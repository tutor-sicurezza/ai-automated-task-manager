/**
 * Porta le correzioni dal repository privato a quello pubblico.
 *
 * I due repository hanno storie separate — il pubblico e' nato con un commit
 * iniziale pulito — quindi non si possono collegare con un push. La
 * sincronizzazione avviene sui FILE: si prende lo stato dei file tracciati nel
 * privato, si tolgono quelli che non devono uscire, e si riporta il risultato
 * nel pubblico come un commit normale.
 *
 * Perche' partire da un worktree di HEAD e non dalla cartella di lavoro: cosi'
 * escono solo i file TRACCIATI e nello stato in cui sono stati committati.
 * Tutto cio' che e' in .gitignore (.env.local, .vercel/, dist/,
 * supabase/.temp/) resta fuori per costruzione, non perche' qualcuno si e'
 * ricordato di aggiungerlo a un elenco.
 *
 * Uso:
 *   node scripts/sync-public.mjs              # mostra cosa cambierebbe
 *   node scripts/sync-public.mjs --commit     # applica e crea il commit
 *   node scripts/sync-public.mjs --commit --push
 *
 * Il percorso del repo pubblico si passa con PUBLIC_REPO, altrimenti si usa
 * ../taskflow-open.
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const PUBBLICO =
  process.env.PUBLIC_REPO ?? path.resolve(process.cwd(), '..', 'taskflow-open');

/**
 * File che restano SOLO nel privato.
 *
 * - `supabase/config.toml` contiene project ref, dominio e mittente di questa
 *   installazione: nel pubblico c'e' `config.example.toml` con i segnaposto.
 * - `STATO.md`, `RIPRESA.md` e `LAUNCH_FEEDBACK_GUIDE.md` documentano lo stato
 *   interno di questo progetto e non dicono nulla a chi installa il software.
 * - `scripts/sync-public.mjs` e' questo script: serve qui, non li'.
 *
 * `RIPRESA.md` e' stato aggiunto il 17 settembre 2026, dopo essere gia' uscito.
 * Vale la pena dire perche', perche' la ragione non e' quella ovvia: il project
 * ref che contiene NON e' un segreto — e' il sottodominio di
 * `VITE_SUPABASE_URL`, quindi sta gia' nel bundle JavaScript del sito, e
 * chiunque apra l'applicazione ce l'ha. Il problema e' un altro: quel file e'
 * il quaderno di lavoro di QUESTA installazione, e ha una sezione intitolata
 * "Aperto, in ordine di gravita'". Un elenco dei punti deboli ancora aperti,
 * accanto all'indirizzo esatto a cui provarli, non e' documentazione di
 * prodotto: e' una mappa. `STATO.md` era escluso esattamente per questo, e
 * `RIPRESA.md` e' lo stesso tipo di documento.
 *
 * ATTENZIONE: questa riga impedisce le pubblicazioni FUTURE. Non toglie il file
 * dalla cronologia del repository pubblico, dove e' gia' uscito. Per quello
 * serve riscrivere quella cronologia, ed e' una decisione del proprietario.
 *
 * `AUDIT_REPORT.md` e `ULTRA_HARD_AUDIT.md` sono stati aggiunti il 18 settembre
 * 2026, PRIMA che uscissero: il repository pubblico era fermo al giorno prima,
 * quindi qui non c'e' niente da rimpiangere.
 *
 * Non contengono segreti — controllati riga per riga: nessun project ref,
 * nessun indirizzo, nessuna chiave; l'unica occorrenza di `CRON_SECRET` e' il
 * nome della variabile. Restano fuori per la stessa ragione di `STATO.md`: sono
 * inventari di punti deboli. Uno si intitola "Top 10 problems" e l'altro ha una
 * "Priority improvement list". Un elenco ordinato di cosa in questo software e'
 * fragile non e' documentazione di prodotto — e' il lavoro di ricognizione gia'
 * fatto per chi volesse attaccarlo.
 *
 * Il codice che descrivono esce lo stesso, ed e' giusto cosi': chi legge il
 * sorgente vede la struttura. Quello che non esce e' la mappa con le croci.
 */
const SOLO_PRIVATI = new Set([
  'supabase/config.toml',
  'STATO.md',
  'RIPRESA.md',
  'LAUNCH_FEEDBACK_GUIDE.md',
  'AUDIT_REPORT.md',
  'ULTRA_HARD_AUDIT.md',
  'scripts/sync-public.mjs',
]);

function git(cwd, ...args) {
  return execFileSync('git', args, { cwd, encoding: 'utf8' }).trim();
}

function esci(messaggio) {
  console.error(`\n  ${messaggio}\n`);
  process.exit(1);
}

// --- controlli preliminari -------------------------------------------------

if (!fs.existsSync(path.join(PUBBLICO, '.git'))) {
  esci(
    `Repository pubblico non trovato in ${PUBBLICO}.\n` +
      `  Clonalo, oppure indica il percorso con PUBLIC_REPO=...`
  );
}

// Sincronizzare un albero sporco significa pubblicare modifiche che nel
// privato non sono nemmeno state committate: si perde la corrispondenza fra i
// due repository e non si sa piu' cosa e' uscito.
if (git(process.cwd(), 'status', '--porcelain')) {
  esci('Ci sono modifiche non committate nel repository privato. Committa prima di sincronizzare.');
}

if (git(PUBBLICO, 'status', '--porcelain')) {
  esci(`Il repository pubblico (${PUBBLICO}) ha modifiche non committate. Sistemalo prima.`);
}

// --- estrazione dei file tracciati -----------------------------------------

const temporanea = fs.mkdtempSync(path.join(os.tmpdir(), 'sync-pubblico-'));

try {
  // `git worktree` invece di `git archive | tar`: su Windows tar interpreta la
  // "C:" del percorso come un host remoto e fallisce con
  // "Cannot connect to C: resolve failed". Il worktree e' anche piu' diretto —
  // e' un checkout di HEAD, quindi contiene esattamente i file tracciati.
  const estratti = path.join(temporanea, 'estratti');
  execFileSync('git', ['worktree', 'add', '--detach', '--quiet', estratti, 'HEAD'], {
    cwd: process.cwd(),
  });

  for (const relativo of SOLO_PRIVATI) {
    fs.rmSync(path.join(estratti, relativo), { force: true });
  }

  // --- confronto e copia ---------------------------------------------------

  const elencaFile = (radice, base = '') => {
    const risultato = [];
    for (const voce of fs.readdirSync(path.join(radice, base), { withFileTypes: true })) {
      // Il worktree porta con se' un file `.git`: non fa parte del progetto.
      if (!base && voce.name === '.git') continue;
      const relativo = base ? `${base}/${voce.name}` : voce.name;
      if (voce.isDirectory()) risultato.push(...elencaFile(radice, relativo));
      else risultato.push(relativo);
    }
    return risultato;
  };

  const nuovi = new Set(elencaFile(estratti));
  const attuali = git(PUBBLICO, 'ls-files').split('\n').filter(Boolean);

  const daEliminare = attuali.filter((f) => !nuovi.has(f));
  const applica = process.argv.includes('--commit');

  let modificati = 0;
  let aggiunti = 0;

  for (const relativo of nuovi) {
    const origine = path.join(estratti, relativo);
    const destinazione = path.join(PUBBLICO, relativo);
    const esisteva = fs.existsSync(destinazione);

    if (esisteva && fs.readFileSync(origine).equals(fs.readFileSync(destinazione))) continue;

    if (esisteva) modificati++;
    else aggiunti++;

    if (applica) {
      fs.mkdirSync(path.dirname(destinazione), { recursive: true });
      fs.copyFileSync(origine, destinazione);
    }
  }

  if (applica) {
    for (const relativo of daEliminare) {
      fs.rmSync(path.join(PUBBLICO, relativo), { force: true });
    }
  }

  console.log(`\nRepository pubblico: ${PUBBLICO}`);
  console.log(`  file aggiunti:    ${aggiunti}`);
  console.log(`  file modificati:  ${modificati}`);
  console.log(`  file eliminati:   ${daEliminare.length}`);
  if (daEliminare.length) console.log(`    ${daEliminare.join('\n    ')}`);
  console.log(`  esclusi (solo privati): ${[...SOLO_PRIVATI].join(', ')}`);

  if (!applica) {
    console.log('\n  Nessuna modifica applicata. Rilancia con --commit per procedere.\n');
    process.exit(0);
  }

  if (aggiunti + modificati + daEliminare.length === 0) {
    console.log('\n  Il repository pubblico e gia allineato.\n');
    process.exit(0);
  }

  // --- commit --------------------------------------------------------------

  const titoloPrivato = git(process.cwd(), 'log', '-1', '--format=%s');
  git(PUBBLICO, 'add', '-A');
  execFileSync(
    'git',
    [
      'commit',
      '-q',
      '-m',
      `Allinea al repository di sviluppo: ${titoloPrivato}`,
      '-m',
      'Sincronizzazione dei file tracciati. La configurazione specifica\n' +
        "dell'installazione (supabase/config.toml, variabili d'ambiente) resta\n" +
        'fuori dal repository pubblico.',
    ],
    { cwd: PUBBLICO, stdio: 'inherit' }
  );

  console.log(`\n  Commit creato nel repository pubblico.`);

  if (process.argv.includes('--push')) {
    execFileSync('git', ['push', 'origin', 'main'], { cwd: PUBBLICO, stdio: 'inherit' });
    console.log('  Push eseguito.\n');
  } else {
    console.log('  Non ancora pubblicato: rilancia con --push, oppure `git push` dal repo pubblico.\n');
  }
} finally {
  // Il worktree va rimosso da git, non solo dal disco: altrimenti resta
  // registrato e `git worktree list` si riempie di voci morte.
  try {
    execFileSync('git', ['worktree', 'remove', '--force', path.join(temporanea, 'estratti')], {
      cwd: process.cwd(),
      stdio: 'ignore',
    });
  } catch {
    // Gia' rimosso o mai creato: la pulizia del disco qui sotto basta.
  }
  fs.rmSync(temporanea, { recursive: true, force: true });
}
