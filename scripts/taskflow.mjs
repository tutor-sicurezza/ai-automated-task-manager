#!/usr/bin/env node
/**
 * TaskFlow dalla riga di comando.
 *
 * Serve a dire "questa l'ho fatta, ecco cosa ho fatto" senza aprire il
 * browser, entrare, cercare l'attivita' e scriverci dentro a mano.
 *
 * Qui dentro e' rimasta solo la parte che PARLA: leggere gli argomenti,
 * stampare righe, chiedere la password. Tutto il resto — sessione, permessi,
 * scritture, notifiche — sta in `taskflowCore.mjs`, che condivide con il
 * server MCP di `scripts/mcp/taskflow.mjs`. Il motivo di quella separazione e'
 * scritto in testa al nucleo, e in breve e': una seconda copia
 * dell'autenticazione e' una copia che un giorno diverge da quella vera.
 *
 * Uso:
 *   node scripts/taskflow.mjs accedi          (una volta sola)
 *   node scripts/taskflow.mjs elenco
 *   node scripts/taskflow.mjs stato <id> <stato> [nota]
 *   node scripts/taskflow.mjs nota  <id> <testo>
 *   node scripts/taskflow.mjs esci
 *
 * L'accesso si fa una volta: `accedi` chiede email e password, e da li' in poi
 * i comandi non chiedono piu' niente. Cio' che resta su disco e' il token di
 * RINNOVO, in un file leggibile solo dal proprietario e fuori dal repository;
 * il token di accesso, che dura un'ora, viene chiesto al momento e non viene
 * mai scritto da nessuna parte. Per le esecuzioni automatiche restano
 * TASKFLOW_EMAIL e TASKFLOW_PASSWORD nell'ambiente.
 */

import {
  ErroreUtente,
  FILE_SESSIONE,
  accediConPassword,
  accediConRinnovo,
  aggiungiNota,
  apriSessione,
  assegnaTask,
  attendeIlVisto,
  cambiaStato,
  cercaTask,
  chiamata,
  chiedi,
  configurazione,
  creaTask,
  dimenticaSessione,
  eChiusaDavvero,
  elencoPersone,
  impostaEtichette,
  impostaPriorita,
  leggiSessioneSalvata,
  mieAttivita,
  organizzazione,
  riprogrammaTask,
  salvaSessione,
} from './taskflowCore.mjs';

/* -------------------------------------------------------------------------- */
/* Comandi                                                                    */
/* -------------------------------------------------------------------------- */

function riga(task) {
  const scadenza = task.due_date ? task.due_date.slice(0, 10) : '—'.padEnd(10);
  // La stessa domanda la decide il nucleo: qui si chiedeva con mezzo
  // confronto (`!approved_by`), e una riga con l'approvatore ma senza la data
  // non risultava ne' chiusa ne' in attesa.
  const attesa = attendeIlVisto(task) ? ' (attende il visto)' : '';
  return `  ${task.id.slice(0, 8)}  ${task.status.padEnd(12)}  ${scadenza}  ${task.title}${attesa}`;
}

async function comandoElenco(cfg, sessione, org) {
  const mie = await mieAttivita(cfg, sessione, org);
  if (!mie.length) {
    console.log('Nessuna attivita\' assegnata a te.');
    return;
  }
  /*
    "Aperte" comprende cio' che aspetta un visto.

    Prima il taglio era `status !== 'completed'`, quindi un lavoro consegnato e
    in attesa di approvazione spariva dalle aperte e compariva fra le chiuse.
    Chi la mattina dopo eseguiva `elenco` per sapere cosa gli restava non lo
    vedeva piu' e lo dimenticava — che e' il modo esatto in cui un flusso di
    approvazione diventa un intralcio invece che un controllo.
  */
  const aperte = mie.filter((t) => !eChiusaDavvero(t));
  const chiuse = mie
    .filter(eChiusaDavvero)
    // `mieAttivita` ordina per scadenza crescente, che per un elenco di cose
    // CHIUSE e' l'ordine sbagliato: prendendone dieci si sarebbero prese le
    // dieci con la scadenza piu' vecchia, cioe' le meno recenti possibili,
    // sotto un titolo che dice "di recente".
    .sort((a, b) => String(b.updated_at ?? '').localeCompare(String(a.updated_at ?? '')));

  console.log(`\nAperte (${aperte.length}):`);
  if (!aperte.length) console.log('  nessuna');
  for (const t of aperte) console.log(riga(t));

  if (chiuse.length) {
    const MOSTRATE = 10;
    const mostrate = chiuse.slice(0, MOSTRATE);
    // Si dice quante se ne stanno vedendo, non solo quante ce ne sono: prima
    // l'intestazione diceva "(47)" e sotto comparivano dieci righe, senza
    // nessun accenno alle altre trentasette.
    const intestazione =
      chiuse.length > MOSTRATE
        ? `Chiuse di recente (${mostrate.length} di ${chiuse.length}):`
        : `Chiuse di recente (${chiuse.length}):`;
    console.log(`\n${intestazione}`);
    for (const t of mostrate) console.log(riga(t));
  }
  console.log('');
}

async function comandoStato(cfg, sessione, org, [pezzo, statoGrezzo, nota]) {
  const esito = await cambiaStato(cfg, sessione, org, {
    pezzo,
    stato: statoGrezzo,
    nota,
  });

  if (!esito.cambiato && !esito.conNota) {
    console.log(`"${esito.task.title}" e' gia' ${esito.statoNuovo}. Niente da fare.`);
    return;
  }

  console.log(
    `"${esito.task.title}" ${esito.cambiato ? `-> ${esito.statoNuovo}` : '(stato invariato)'}` +
      (esito.conNota ? ' con nota' : '') +
      (esito.attendeVisto ? '. Ora aspetta l\'approvazione di un responsabile.' : '.')
  );
}

async function comandoNota(cfg, sessione, org, [pezzo, ...resto]) {
  const { task } = await aggiungiNota(cfg, sessione, org, {
    pezzo,
    testo: resto.join(' '),
  });
  console.log(`Nota aggiunta a "${task.title}".`);
}

/**
 * Divide gli argomenti in posizionali, opzioni `--nome valore` e bandiere.
 *
 * Serve ai comandi nuovi (`crea`, `cerca`) che mescolano un titolo o un testo
 * libero con delle opzioni: senza, l'ordine degli argomenti diventerebbe
 * rigido e il primo `--priorita` finirebbe scambiato per il titolo. Le opzioni
 * con valore che non lo trovano (fine riga, o un altro `--`) si fermano subito,
 * come fa `estraiOrg`: meglio un errore chiaro di un valore preso per sbaglio.
 */
function analizzaArgomenti(argomenti, { conValore = [], bandiere = [] } = {}) {
  const valori = {};
  const attive = new Set();
  const posizionali = [];
  for (let i = 0; i < argomenti.length; i++) {
    const a = argomenti[i];
    if (bandiere.includes(a)) {
      attive.add(a);
      continue;
    }
    if (conValore.includes(a)) {
      const v = argomenti[i + 1];
      if (v === undefined || v.startsWith('--')) {
        throw new ErroreUtente(`Dopo ${a} serve un valore.`);
      }
      valori[a] = v;
      i++;
      continue;
    }
    posizionali.push(a);
  }
  return { valori, attive, posizionali };
}

async function comandoCrea(cfg, sessione, org, argomenti) {
  const { valori, posizionali } = analizzaArgomenti(argomenti, {
    conValore: ['--assegna', '--priorita', '--scadenza', '--etichette'],
  });
  const titolo = posizionali.join(' ');
  const etichette = valori['--etichette']
    ? valori['--etichette'].split(',').map((e) => e.trim()).filter(Boolean)
    : undefined;

  const task = await creaTask(cfg, sessione, org, {
    titolo,
    assegnatario: valori['--assegna'],
    priorita: valori['--priorita'],
    scadenza: valori['--scadenza'],
    etichette,
  });

  const id = task.id ? ` [${String(task.id).slice(0, 8)}]` : '';
  console.log(`Creata "${task.title ?? titolo}"${id}.`);
}

async function comandoAssegna(cfg, sessione, org, [pezzo, chi]) {
  const esito = await assegnaTask(cfg, sessione, org, { pezzo, assegnatario: chi });
  if (!esito.cambiato) {
    console.log(`"${esito.task.title}": assegnazione invariata.`);
    return;
  }
  const dove = esito.assegnatario ? `a ${chi}` : 'a nessuno';
  console.log(`"${esito.task.title}" -> assegnata ${dove}.`);
}

async function comandoScadenza(cfg, sessione, org, [pezzo, quando]) {
  const esito = await riprogrammaTask(cfg, sessione, org, { pezzo, scadenza: quando });
  if (!esito.cambiato) {
    console.log(`"${esito.task.title}": scadenza invariata.`);
    return;
  }
  const nuova = esito.scadenza ? esito.scadenza.slice(0, 10) : 'nessuna';
  console.log(`"${esito.task.title}" -> scadenza ${nuova}.`);
}

async function comandoPriorita(cfg, sessione, org, [pezzo, valore]) {
  const esito = await impostaPriorita(cfg, sessione, org, { pezzo, priorita: valore });
  if (!esito.cambiato) {
    console.log(`"${esito.task.title}": e' gia' a priorita' ${esito.priorita}.`);
    return;
  }
  console.log(`"${esito.task.title}" -> priorita' ${esito.priorita}.`);
}

async function comandoEtichette(cfg, sessione, org, [pezzo, ...etichette]) {
  const esito = await impostaEtichette(cfg, sessione, org, { pezzo, etichette });
  if (!esito.cambiato) {
    console.log(`"${esito.task.title}": etichette invariate.`);
    return;
  }
  const lista = esito.etichette.length ? esito.etichette.join(', ') : 'nessuna';
  console.log(`"${esito.task.title}" -> etichette: ${lista}.`);
}

async function comandoPersone(cfg, sessione, org) {
  const persone = await elencoPersone(cfg, sessione, org);
  if (!persone.length) {
    console.log('Nessuna persona in questa organizzazione.');
    return;
  }
  for (const p of persone) {
    const email = p.email ? ` (${p.email})` : '';
    console.log(`- ${p.nome} — ${p.ruolo}${email}`);
  }
}

async function comandoCerca(cfg, sessione, org, argomenti) {
  const { valori, attive, posizionali } = analizzaArgomenti(argomenti, {
    conValore: ['--stato', '--di'],
    bandiere: ['--tutte'],
  });
  const { righe } = await cercaTask(cfg, sessione, org, {
    testo: posizionali.join(' ') || undefined,
    stato: valori['--stato'],
    assegnatario: valori['--di'],
    // Senza --tutte si mostrano solo le aperte: il nucleo, con soloAperti,
    // tiene comunque visibile lo stato chiesto esplicitamente con --stato.
    soloAperti: !attive.has('--tutte'),
  });

  if (!righe.length) {
    console.log('Nessuna attivita\' trovata.');
    return;
  }
  console.log('');
  for (const t of righe) console.log(riga(t));
  console.log('');
}

async function comandoAccedi(cfg) {
  // Se le credenziali sono gia' nell'ambiente non si chiede niente: e' il caso
  // di chi automatizza e fa `accedi` una volta per lasciare la sessione pronta.
  const email = cfg.email || (await chiedi('Email: '));
  const password = cfg.password || (await chiedi('Password (non si vede): ', { nascosto: true }));
  if (!email || !password) throw new ErroreUtente('Servono email e password.');

  const sessione = await accediConPassword(cfg, email, password);
  if (!sessione.rinnovo) {
    throw new ErroreUtente(
      'Il server non ha dato un token di rinnovo: non posso ricordare la sessione.'
    );
  }

  salvaSessione({
    url: cfg.url,
    chiave: cfg.chiave,
    // L'indirizzo del sito viene salvato con la sessione: senza, "crea task"
    // (che passa da /api/tasks) non saprebbe dove chiamare da fuori dal repo.
    ...(cfg.appUrl ? { appUrl: cfg.appUrl } : {}),
    email: sessione.utente.email,
    utente: sessione.utente.id,
    rinnovo: sessione.rinnovo,
  });

  console.log(`\nAccesso riuscito come ${sessione.utente.email}.`);
  console.log(`Sessione salvata in ${FILE_SESSIONE}, leggibile solo da te.`);
  console.log('Da ora i comandi non chiedono piu\' niente. Per dimenticarla: "esci".\n');
}

/**
 * Chiude la sessione, qui e sul server.
 *
 * Cancellare il file da solo non basterebbe: il token di rinnovo resterebbe
 * valido per chiunque ne avesse fatto una copia. Si prova percio' a revocarlo
 * davvero, e il file si cancella comunque — anche se la revoca fallisce, non
 * lasciarne la copia in giro e' sempre meglio.
 */
async function comandoEsci() {
  const salvata = leggiSessioneSalvata();
  if (!salvata) {
    console.log('Non c\'era nessuna sessione salvata.');
    return;
  }

  try {
    const cfg = configurazione();
    const sessione = await accediConRinnovo(cfg, salvata.rinnovo);
    await chiamata(cfg, '/auth/v1/logout', { method: 'POST', token: sessione.token });
    dimenticaSessione();
    console.log('Sessione chiusa, qui e sul server.');
  } catch {
    dimenticaSessione();
    console.log(
      'Sessione dimenticata qui.\n' +
        'Non sono riuscito a revocarla sul server: scadra\' da sola.'
    );
  }
}

const AIUTO = `
TaskFlow da riga di comando.

  node scripts/taskflow.mjs accedi
      Chiede email e password una volta sola e ricorda la sessione.
      Da li' in poi gli altri comandi non chiedono piu' niente.

  node scripts/taskflow.mjs elenco
      Le attivita' assegnate a te, con l'inizio dell'identificativo.

  node scripts/taskflow.mjs stato <id> <stato> ["cosa ho fatto"]
      Cambia lo stato, e con il terzo argomento lascia anche la nota.
      Stati: non-iniziata, in-corso, bloccata, completata.

  node scripts/taskflow.mjs nota <id> "testo"
      Aggiunge solo un commento.

  node scripts/taskflow.mjs crea "titolo" [--assegna <chi>] [--priorita low|medium|high] [--scadenza <ISO>] [--etichette a,b,c]
      Crea un'attivita'. Solo il titolo e' obbligatorio; --assegna accetta
      un nome, un'email, "me" o "nessuno".

  node scripts/taskflow.mjs assegna <id> <chi|nessuno>
      Cambia l'assegnatario, o lo toglie con "nessuno".

  node scripts/taskflow.mjs scadenza <id> <ISO|nessuna>
      Imposta la scadenza (es. 2026-10-01), o la toglie con "nessuna".

  node scripts/taskflow.mjs priorita <id> <low|medium|high>
      Cambia la priorita'.

  node scripts/taskflow.mjs etichette <id> [a b c ...]
      Sostituisce tutte le etichette. Senza argomenti le toglie.

  node scripts/taskflow.mjs persone
      Chi c'e' nell'organizzazione, con ruolo ed email.

  node scripts/taskflow.mjs cerca [testo] [--stato <stato>] [--di <chi>] [--tutte]
      Cerca fra le attivita'. Senza --tutte mostra solo le aperte.

  node scripts/taskflow.mjs esci
      Dimentica la sessione e la revoca sul server.

L'<id> sono le prime lettere che mostra "elenco": bastano finche' individuano
una sola attivita', altrimenti il comando si ferma invece di indovinare.

Per far lavorare Claude sulle tue attivita' senza copiare niente a mano:
  node scripts/mcp/taskflow.mjs --installa
e poi riavvia Claude Desktop. Le stesse attivita', dentro la conversazione.

Con piu' organizzazioni si indica quale, in uno dei due modi:
  --org <identificativo o nome>   dentro il comando, e vale ovunque
  TASKFLOW_ORG=<...>              nell'ambiente, per non ripeterlo ogni volta
Se ci sono entrambi vince --org.

Per le esecuzioni automatiche, dove non c'e' nessuno a rispondere, restano
TASKFLOW_EMAIL e TASKFLOW_PASSWORD nell'ambiente.

Le regole sono quelle del database: se un'attivita' e' bloccata da un'altra,
chiuderla viene rifiutato qui come nell'interfaccia.
`;

/* -------------------------------------------------------------------------- */

/**
 * Toglie `--org <id>` dagli argomenti e restituisce cosa e' stato chiesto.
 *
 * Esiste perche' il comando che l'interfaccia fa copiare deve poter funzionare
 * su qualunque shell: `TASKFLOW_ORG=... comando` e' sintassi POSIX e su
 * Windows — che l'installatore del connettore supporta — ne' PowerShell ne'
 * cmd.exe la accettano. Un argomento vale ovunque.
 *
 * La variabile d'ambiente resta, e resta utile: e' quella che si mette una
 * volta in `.env.local` o nell'elemento di Claude Desktop. Se ci sono
 * entrambe vince l'argomento, perche' e' piu' vicino al gesto: l'ha scritto
 * chi sta eseguendo questo comando, adesso.
 */
function estraiOrg(argomenti) {
  const posizione = argomenti.indexOf('--org');
  if (posizione === -1) return { org: null, resto: argomenti };

  const valore = argomenti[posizione + 1];
  if (!valore || valore.startsWith('--')) {
    throw new ErroreUtente('Dopo --org serve l\'identificativo o il nome dell\'organizzazione.');
  }
  return {
    org: valore,
    resto: [...argomenti.slice(0, posizione), ...argomenti.slice(posizione + 2)],
  };
}

async function principale() {
  const [comando, ...tutti] = process.argv.slice(2);
  const { org: orgChiesta, resto: argomenti } = estraiOrg(tutti);

  if (!comando || comando === 'aiuto' || comando === 'help' || comando === '--help' || comando === '-h') {
    console.log(AIUTO);
    return;
  }

  /*
    Un comando sconosciuto lo si dice SUBITO, prima di cercare sessione e
    organizzazione: chi sbaglia a scrivere "elenoc" (o non ha ancora una
    sessione) merita "comando sconosciuto, prova aiuto", non un errore di
    configurazione che parla d'altro.
  */
  const NOTI = new Set([
    'esci',
    'accedi',
    'elenco',
    'stato',
    'nota',
    'crea',
    'assegna',
    'scadenza',
    'priorita',
    'etichette',
    'persone',
    'cerca',
  ]);
  if (!NOTI.has(comando)) {
    throw new ErroreUtente(`Comando sconosciuto: "${comando}". Prova "aiuto".`);
  }

  // `esci` non ha bisogno di sapere chi sei: e' il comando che serve proprio
  // quando la sessione e' in uno stato che non si riesce piu' ad aprire.
  if (comando === 'esci') return comandoEsci();

  const base = configurazione();
  const cfg = orgChiesta ? { ...base, org: orgChiesta } : base;

  if (comando === 'accedi') return comandoAccedi(cfg);

  const sessione = await apriSessione(cfg);
  const org = await organizzazione(cfg, sessione);

  switch (comando) {
    case 'elenco':
      return comandoElenco(cfg, sessione, org);
    case 'stato':
      return comandoStato(cfg, sessione, org, argomenti);
    case 'nota':
      return comandoNota(cfg, sessione, org, argomenti);
    case 'crea':
      return comandoCrea(cfg, sessione, org, argomenti);
    case 'assegna':
      return comandoAssegna(cfg, sessione, org, argomenti);
    case 'scadenza':
      return comandoScadenza(cfg, sessione, org, argomenti);
    case 'priorita':
      return comandoPriorita(cfg, sessione, org, argomenti);
    case 'etichette':
      return comandoEtichette(cfg, sessione, org, argomenti);
    case 'persone':
      return comandoPersone(cfg, sessione, org);
    case 'cerca':
      return comandoCerca(cfg, sessione, org, argomenti);
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
