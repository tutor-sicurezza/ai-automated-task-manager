/**
 * Porta le correzioni dal repository privato a quello pubblico.
 *
 * I due repository hanno storie separate — il pubblico e' nato con un commit
 * iniziale pulito — quindi non si possono collegare con un push. La
 * sincronizzazione avviene sui FILE: si prende lo stato dei file tracciati nel
 * privato, si tolgono quelli che non devono uscire, e si riporta il risultato
 * nel pubblico come un commit normale.
 *
 * Perche' partire da `git archive HEAD` e non dalla cartella: cosi' escono
 * solo i file TRACCIATI. Tutto cio' che e' in .gitignore (.env.local,
 * .vercel/, dist/, supabase/.temp/) resta fuori per costruzione, non perche'
 * qualcuno si e' ricordato di aggiungerlo a un elenco.
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
 * - `STATO.md` e `LAUNCH_FEEDBACK_GUIDE.md` documentano lo stato interno di
 *   questo progetto e non dicono nulla a chi installa il software.
 * - `scripts/sync-public.mjs` e' questo script: serve qui, non li'.
 */
const SOLO_PRIVATI = new Set([
  'supabase/config.toml',
  'STATO.md',
  'LAUNCH_FEEDBACK_GUIDE.md',
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
  const archivio = path.join(temporanea, 'albero.tar');
  execFileSync('git', ['archive', '-o', archivio, 'HEAD'], { cwd: process.cwd() });
  const estratti = path.join(temporanea, 'estratti');
  fs.mkdirSync(estratti);
  execFileSync('tar', ['-x', '-f', archivio, '-C', estratti]);

  for (const relativo of SOLO_PRIVATI) {
    fs.rmSync(path.join(estratti, relativo), { force: true });
  }

  // --- confronto e copia ---------------------------------------------------

  const elencaFile = (radice, base = '') => {
    const risultato = [];
    for (const voce of fs.readdirSync(path.join(radice, base), { withFileTypes: true })) {
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
  fs.rmSync(temporanea, { recursive: true, force: true });
}
