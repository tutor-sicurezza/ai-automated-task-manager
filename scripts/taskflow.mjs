#!/usr/bin/env node
/**
 * TaskFlow dalla riga di comando.
 *
 * Serve a dire "questa l'ho fatta, ecco cosa ho fatto" senza aprire il
 * browser, entrare, cercare l'attivita' e scriverci dentro a mano.
 *
 * PERCHE' NON PASSA DA UNA ROTTA IN api/. Le rotte serverless girano con il
 * service role, che scavalca le policy RLS e per cui `auth.uid()` e' nullo:
 * ogni regola andrebbe riscritta li' dentro, e una dimenticanza sarebbe un
 * buco. Qui invece si accede come l'utente e si parla direttamente a
 * PostgREST con il SUO token, quindi valgono esattamente le stesse policy e
 * gli stessi trigger dell'interfaccia: chi non puo' fare una cosa dal browser
 * non la puo' fare nemmeno da qui, e non perche' lo controlla questo file.
 *
 * In particolare le due regole del cambio di stato — non si completa
 * un'attivita' che ne aspetta altre, e il cambio di stato azzera il visto
 * precedente — stanno nel database dalla migrazione 0025. Questo programma
 * non le ricontrolla: le SUBISCE, come deve.
 *
 * Quello che invece fa, perche' il database non lo fa al posto suo, e'
 * scrivere la riga di cronologia e le notifiche, cosi' che un'attivita'
 * chiusa da qui sia indistinguibile da una chiusa dall'interfaccia.
 *
 * Uso:
 *   node scripts/taskflow.mjs elenco
 *   node scripts/taskflow.mjs stato <id> <stato> [nota]
 *   node scripts/taskflow.mjs nota  <id> <testo>
 *
 * Credenziali: TASKFLOW_EMAIL e TASKFLOW_PASSWORD nell'ambiente, oppure in
 * `.env.local` accanto a quelle che gia' ci sono. Il token vive in memoria
 * per la durata del comando e non viene mai scritto su disco.
 */

import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const RADICE = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/* -------------------------------------------------------------------------- */
/* Configurazione                                                             */
/* -------------------------------------------------------------------------- */

/**
 * Legge `.env.local` senza dipendenze.
 *
 * Volutamente minimale: `CHIAVE=valore`, righe vuote e commenti saltati,
 * virgolette tolte. Non e' un parser di dotenv completo e non deve esserlo —
 * i valori che servono qui sono quattro e li scrive una persona.
 */
function leggiEnvLocale() {
  const valori = {};
  let testo;
  try {
    testo = readFileSync(resolve(RADICE, '.env.local'), 'utf8');
  } catch {
    return valori;
  }
  for (const riga of testo.split('\n')) {
    const pulita = riga.trim();
    if (!pulita || pulita.startsWith('#')) continue;
    const taglio = pulita.indexOf('=');
    if (taglio === -1) continue;
    const chiave = pulita.slice(0, taglio).trim();
    let valore = pulita.slice(taglio + 1).trim();
    if (
      (valore.startsWith('"') && valore.endsWith('"')) ||
      (valore.startsWith("'") && valore.endsWith("'"))
    ) {
      valore = valore.slice(1, -1);
    }
    valori[chiave] = valore;
  }
  return valori;
}

function configurazione() {
  const file = leggiEnvLocale();
  // L'ambiente ha la precedenza sul file: e' cio' che permette di usare un
  // account diverso per una singola chiamata senza toccare `.env.local`.
  const prendi = (chiave) => process.env[chiave] ?? file[chiave];

  const url = prendi('VITE_SUPABASE_URL') ?? prendi('SUPABASE_URL');
  const chiave = prendi('VITE_SUPABASE_PUBLISHABLE_KEY') ?? prendi('SUPABASE_ANON_KEY');
  const email = prendi('TASKFLOW_EMAIL');
  const password = prendi('TASKFLOW_PASSWORD');
  const org = prendi('TASKFLOW_ORG');

  const mancanti = [];
  if (!url) mancanti.push('VITE_SUPABASE_URL');
  if (!chiave) mancanti.push('VITE_SUPABASE_PUBLISHABLE_KEY');
  if (!email) mancanti.push('TASKFLOW_EMAIL');
  if (!password) mancanti.push('TASKFLOW_PASSWORD');
  if (mancanti.length) {
    throw new Error(
      `Manca la configurazione: ${mancanti.join(', ')}.\n` +
        "Mettila nell'ambiente oppure in .env.local."
    );
  }
  return { url: url.replace(/\/+$/, ''), chiave, email, password, org };
}

/* -------------------------------------------------------------------------- */
/* Rete                                                                       */
/* -------------------------------------------------------------------------- */

/** Un errore che va mostrato all'utente cosi' com'e', senza traccia di stack. */
class ErroreUtente extends Error {}

async function chiamata(cfg, percorso, opzioni = {}) {
  const risposta = await fetch(`${cfg.url}${percorso}`, {
    ...opzioni,
    headers: {
      apikey: cfg.chiave,
      authorization: `Bearer ${opzioni.token ?? cfg.chiave}`,
      'content-type': 'application/json',
      ...(opzioni.headers ?? {}),
    },
  });

  const testo = await risposta.text();
  let corpo = null;
  if (testo) {
    try {
      corpo = JSON.parse(testo);
    } catch {
      corpo = testo;
    }
  }

  if (!risposta.ok) {
    // Il messaggio del database e' piu' utile del codice HTTP: e' quello che
    // dice "Prima vanno chiuse: X" invece di un 400 muto.
    const messaggio =
      (corpo && (corpo.message || corpo.msg || corpo.error_description || corpo.error)) ||
      `richiesta fallita (${risposta.status})`;
    throw new ErroreUtente(messaggio);
  }
  return corpo;
}

async function accedi(cfg) {
  const dati = await chiamata(cfg, '/auth/v1/token?grant_type=password', {
    method: 'POST',
    body: JSON.stringify({ email: cfg.email, password: cfg.password }),
  });
  if (!dati?.access_token) throw new ErroreUtente('Accesso non riuscito');
  return { token: dati.access_token, utente: dati.user };
}

const rest = (cfg, sessione, percorso, opzioni = {}) =>
  chiamata(cfg, `/rest/v1${percorso}`, { ...opzioni, token: sessione.token });

/* -------------------------------------------------------------------------- */
/* Dati                                                                       */
/* -------------------------------------------------------------------------- */

async function organizzazione(cfg, sessione) {
  const righe = await rest(
    cfg,
    sessione,
    `/organization_members?user_id=eq.${sessione.utente.id}&select=role,organization_id,organizations(id,name)`
  );
  if (!righe?.length) {
    throw new ErroreUtente('Questo account non appartiene ad alcuna organizzazione');
  }
  if (righe.length === 1) {
    return { id: righe[0].organization_id, ruolo: righe[0].role };
  }

  // Meglio fermarsi che indovinare: scrivere nell'organizzazione sbagliata e'
  // un errore che nessuno nota finche' non lo va a cercare.
  const nomi = righe.map((r) => r.organizations?.name ?? r.organization_id);
  if (!cfg.org) {
    throw new ErroreUtente(
      `Questo account appartiene a piu' organizzazioni (${nomi.join(', ')}). ` +
        'Scegli con TASKFLOW_ORG, indicando il nome o l\'identificativo.'
    );
  }

  const cercata = cfg.org.toLowerCase();
  const scelta = righe.find(
    (r) =>
      r.organization_id.toLowerCase() === cercata ||
      (r.organizations?.name ?? '').toLowerCase() === cercata
  );
  if (!scelta) {
    throw new ErroreUtente(
      `TASKFLOW_ORG non corrisponde a nessuna delle tue: ${nomi.join(', ')}.`
    );
  }
  return { id: scelta.organization_id, ruolo: scelta.role };
}

const COLONNE =
  'id,title,status,due_date,assignee_id,watchers,blocked_by,requires_approval,' +
  'approved_by,approved_at,comments,activities';

async function mieAttivita(cfg, sessione, org) {
  return rest(
    cfg,
    sessione,
    `/tasks?organization_id=eq.${org.id}&assignee_id=eq.${sessione.utente.id}` +
      `&archived_at=is.null&select=${COLONNE}&order=due_date.asc.nullslast`
  );
}

/**
 * Trova l'attivita' da un pezzo di identificativo.
 *
 * Sulla riga di comando nessuno incolla un uuid intero: si usano le prime
 * lettere, quelle che `elenco` mostra. Se il pezzo ne individua piu' di una si
 * rifiuta invece di scegliere: agire sull'attivita' sbagliata e' peggio che
 * doverne scrivere due lettere in piu'.
 */
async function trovaAttivita(cfg, sessione, org, pezzo) {
  const cercato = String(pezzo ?? '').toLowerCase();
  if (!cercato) throw new ErroreUtente("Indica l'identificativo dell'attivita'");

  const tutte = await rest(
    cfg,
    sessione,
    `/tasks?organization_id=eq.${org.id}&archived_at=is.null&select=${COLONNE}`
  );
  const candidate = tutte.filter((t) => t.id.toLowerCase().startsWith(cercato));

  if (candidate.length === 0) throw new ErroreUtente(`Nessuna attivita' che inizi per "${pezzo}"`);
  if (candidate.length > 1) {
    const elenco = candidate.map((t) => `  ${t.id.slice(0, 12)}  ${t.title}`).join('\n');
    throw new ErroreUtente(`"${pezzo}" corrisponde a piu' attivita':\n${elenco}`);
  }
  return candidate[0];
}

/* -------------------------------------------------------------------------- */
/* Stati                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * I valori veri sono quelli inglesi, perche' sono quelli nella colonna. Gli
 * alias italiani esistono perche' chi scrive da terminale scrive nella lingua
 * in cui pensa, e "completata" non deve dare errore.
 */
const STATI = {
  'not-started': 'not-started',
  'non-iniziata': 'not-started',
  'da-fare': 'not-started',
  'in-progress': 'in-progress',
  'in-corso': 'in-progress',
  blocked: 'blocked',
  bloccata: 'blocked',
  completed: 'completed',
  completata: 'completed',
  fatta: 'completed',
  fatto: 'completed',
};

function statoCanonico(valore) {
  const stato = STATI[String(valore ?? '').toLowerCase()];
  if (!stato) {
    throw new ErroreUtente(
      `Stato sconosciuto: "${valore}". Usa uno fra: ` +
        'non-iniziata, in-corso, bloccata, completata.'
    );
  }
  return stato;
}

/* -------------------------------------------------------------------------- */
/* Scritture                                                                  */
/* -------------------------------------------------------------------------- */

const adesso = () => new Date().toISOString();

/**
 * Il blocco di un minuto dentro la chiave dell'evento.
 *
 * L'indice unico su (organization_id, event_key) respinge i doppioni: due
 * comandi identici lanciati nello stesso minuto producono una notifica sola,
 * che e' lo stesso meccanismo usato dall'interfaccia.
 */
const bloccoMinuto = () => adesso().slice(0, 16);

function identita(sessione) {
  const meta = sessione.utente.user_metadata ?? {};
  return {
    id: sessione.utente.id,
    nome: meta.full_name || sessione.utente.email || 'Utente',
    avatar: meta.avatar_url || '',
  };
}

function voceCronologia(io, task, tipo, extra = {}) {
  return {
    id: `att-${randomUUID()}`,
    taskId: task.id,
    userId: io.id,
    userName: io.nome,
    userAvatar: io.avatar,
    type: tipo,
    createdAt: adesso(),
    ...extra,
  };
}

/**
 * Una notifica, con le stesse colonne che scrive l'interfaccia.
 *
 * Il doppione non e' un guasto: l'indice unico lo respinge con il codice
 * 23505 e qui viene ignorato in silenzio, esattamente come nel client.
 */
async function notifica(cfg, sessione, org, io, task, { destinatario, tipo, messaggio }) {
  if (!destinatario || destinatario === io.id) return;
  try {
    await rest(cfg, sessione, '/notifications', {
      method: 'POST',
      headers: { prefer: 'return=minimal' },
      body: JSON.stringify({
        organization_id: org.id,
        user_id: destinatario,
        task_ref: task.id,
        task_title: task.title,
        type: tipo,
        message: messaggio,
        action_by: io.id,
        action_by_name: io.nome,
        action_by_avatar: io.avatar || null,
        link: null,
        read: false,
        event_key: `cli:${task.id}:${tipo}:${destinatario}:${bloccoMinuto()}`,
      }),
    });
  } catch (e) {
    if (!/duplicate key|23505/i.test(e.message)) {
      // Una notifica persa non deve far credere che la modifica non sia
      // andata a buon fine: si segnala e si prosegue.
      console.warn(`  avviso: notifica non inviata (${e.message})`);
    }
  }
}

/** Chi puo' approvare, per avvisarlo quando un lavoro resta in attesa. */
async function responsabili(cfg, sessione, org) {
  const righe = await rest(
    cfg,
    sessione,
    `/organization_members?organization_id=eq.${org.id}&role=in.(owner,admin,manager)&select=user_id`
  );
  return righe.map((r) => r.user_id);
}

/* -------------------------------------------------------------------------- */
/* Comandi                                                                    */
/* -------------------------------------------------------------------------- */

function riga(task) {
  const scadenza = task.due_date ? task.due_date.slice(0, 10) : '—'.padEnd(10);
  const attesa =
    task.status === 'completed' && task.requires_approval && !task.approved_by
      ? ' (attende il visto)'
      : '';
  return `  ${task.id.slice(0, 8)}  ${task.status.padEnd(12)}  ${scadenza}  ${task.title}${attesa}`;
}

async function comandoElenco(cfg, sessione, org) {
  const mie = await mieAttivita(cfg, sessione, org);
  if (!mie.length) {
    console.log('Nessuna attivita\' assegnata a te.');
    return;
  }
  const aperte = mie.filter((t) => t.status !== 'completed');
  const chiuse = mie.filter((t) => t.status === 'completed');

  console.log(`\nAperte (${aperte.length}):`);
  if (!aperte.length) console.log('  nessuna');
  for (const t of aperte) console.log(riga(t));

  if (chiuse.length) {
    console.log(`\nChiuse di recente (${chiuse.length}):`);
    for (const t of chiuse.slice(0, 10)) console.log(riga(t));
  }
  console.log('');
}

async function comandoStato(cfg, sessione, org, [pezzo, statoGrezzo, nota]) {
  const task = await trovaAttivita(cfg, sessione, org, pezzo);
  const nuovo = statoCanonico(statoGrezzo);
  const io = identita(sessione);

  if (task.status === nuovo && !nota) {
    console.log(`"${task.title}" e' gia' ${nuovo}. Niente da fare.`);
    return;
  }

  const cronologia = Array.isArray(task.activities) ? [...task.activities] : [];
  const commenti = Array.isArray(task.comments) ? [...task.comments] : [];

  if (task.status !== nuovo) {
    cronologia.push(
      voceCronologia(io, task, 'status_changed', {
        oldValue: task.status.replace('-', ' '),
        newValue: nuovo.replace('-', ' '),
      })
    );
  }
  if (nota) {
    commenti.push({
      id: `com-${randomUUID()}`,
      taskId: task.id,
      userId: io.id,
      userName: io.nome,
      userAvatar: io.avatar,
      content: nota,
      createdAt: adesso(),
    });
    cronologia.push(voceCronologia(io, task, 'comment_added'));
  }

  /*
    Si inviano SOLO le colonne toccate.

    Rimandare indietro la riga intera e' il modo classico di cancellare cio'
    che non si era letto: e' la stessa cautela per cui la lista
    dell'interfaccia non scrive mai `attachments`.

    Il visto non si tocca: se va azzerato lo azzera il trigger della 0025, che
    e' l'unico posto in cui quella regola vale per tutti.
  */
  const modifiche = { activities: cronologia, updated_at: adesso() };
  if (task.status !== nuovo) modifiche.status = nuovo;
  if (nota) modifiche.comments = commenti;

  await rest(cfg, sessione, `/tasks?id=eq.${task.id}`, {
    method: 'PATCH',
    headers: { prefer: 'return=minimal' },
    body: JSON.stringify(modifiche),
  });

  const osservatori = Array.isArray(task.watchers) ? task.watchers : [];
  const diventaChiusa = nuovo === 'completed' && task.status !== 'completed';
  const attendeVisto = diventaChiusa && task.requires_approval === true;

  if (task.status !== nuovo) {
    for (const o of osservatori) {
      await notifica(cfg, sessione, org, io, task, {
        destinatario: o,
        tipo: 'task_status_changed',
        messaggio: `"${task.title}": ${io.nome} ha messo lo stato su ${nuovo}`,
      });
    }
    if (attendeVisto) {
      // Chi deve approvare va avvisato, altrimenti il lavoro resta fermo
      // finche' un responsabile non passa per caso dalla bacheca.
      for (const r of await responsabili(cfg, sessione, org)) {
        await notifica(cfg, sessione, org, io, task, {
          destinatario: r,
          tipo: 'task_status_changed',
          messaggio: `"${task.title}" aspetta la tua approvazione`,
        });
      }
    } else if (diventaChiusa) {
      await notifica(cfg, sessione, org, io, task, {
        destinatario: task.assignee_id,
        tipo: 'task_completed',
        messaggio: `La tua attivita' "${task.title}" e' stata completata`,
      });
    }
  }

  console.log(
    `"${task.title}" ${task.status !== nuovo ? `-> ${nuovo}` : '(stato invariato)'}` +
      (nota ? ' con nota' : '') +
      (attendeVisto ? '. Ora aspetta l\'approvazione di un responsabile.' : '.')
  );
}

async function comandoNota(cfg, sessione, org, [pezzo, ...resto]) {
  const testo = resto.join(' ').trim();
  if (!testo) throw new ErroreUtente('Scrivi il testo della nota');

  const task = await trovaAttivita(cfg, sessione, org, pezzo);
  const io = identita(sessione);

  const commenti = Array.isArray(task.comments) ? [...task.comments] : [];
  commenti.push({
    id: `com-${randomUUID()}`,
    taskId: task.id,
    userId: io.id,
    userName: io.nome,
    userAvatar: io.avatar,
    content: testo,
    createdAt: adesso(),
  });
  const cronologia = Array.isArray(task.activities) ? [...task.activities] : [];
  cronologia.push(voceCronologia(io, task, 'comment_added'));

  await rest(cfg, sessione, `/tasks?id=eq.${task.id}`, {
    method: 'PATCH',
    headers: { prefer: 'return=minimal' },
    body: JSON.stringify({ comments: commenti, activities: cronologia, updated_at: adesso() }),
  });

  const destinatari = new Set([
    task.assignee_id,
    ...(Array.isArray(task.watchers) ? task.watchers : []),
  ]);
  for (const d of destinatari) {
    await notifica(cfg, sessione, org, io, task, {
      destinatario: d,
      tipo: 'task_comment',
      messaggio: `${io.nome} ha commentato "${task.title}"`,
    });
  }

  console.log(`Nota aggiunta a "${task.title}".`);
}

const AIUTO = `
TaskFlow da riga di comando.

  node scripts/taskflow.mjs elenco
      Le attivita' assegnate a te, con l'inizio dell'identificativo.

  node scripts/taskflow.mjs stato <id> <stato> ["cosa ho fatto"]
      Cambia lo stato, e con il terzo argomento lascia anche la nota.
      Stati: non-iniziata, in-corso, bloccata, completata.

  node scripts/taskflow.mjs nota <id> "testo"
      Aggiunge solo un commento.

L'<id> sono le prime lettere che mostra "elenco": bastano finche' individuano
una sola attivita'.

Credenziali in TASKFLOW_EMAIL e TASKFLOW_PASSWORD, nell'ambiente o in
.env.local. Le regole sono quelle del database: se un'attivita' e' bloccata da
un'altra, chiuderla viene rifiutato qui come nell'interfaccia.
`;

/* -------------------------------------------------------------------------- */

async function principale() {
  const [comando, ...argomenti] = process.argv.slice(2);

  if (!comando || comando === 'aiuto' || comando === '--help' || comando === '-h') {
    console.log(AIUTO);
    return;
  }

  const cfg = configurazione();
  const sessione = await accedi(cfg);
  const org = await organizzazione(cfg, sessione);

  switch (comando) {
    case 'elenco':
      return comandoElenco(cfg, sessione, org);
    case 'stato':
      return comandoStato(cfg, sessione, org, argomenti);
    case 'nota':
      return comandoNota(cfg, sessione, org, argomenti);
    default:
      throw new ErroreUtente(`Comando sconosciuto: "${comando}". Prova "aiuto".`);
  }
}

principale().catch((errore) => {
  if (errore instanceof ErroreUtente) {
    console.error(`\n${errore.message}\n`);
  } else {
    console.error(errore);
  }
  process.exitCode = 1;
});
