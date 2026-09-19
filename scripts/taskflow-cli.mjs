#!/usr/bin/env node
/**
 * TaskFlow - Complete Task via Claude CLI
 *
 * Esegue un task usando Claude direttamente da terminale senza interfaccia web.
 *
 * Uso:
 *   taskflow complete-task <taskId> [options]
 *
 * Options:
 *   --model         Modello Claude (default: claude-3-5-sonnet-20241022)
 *   --max-tokens    Token massimi (default: 2048)
 *   --api-key       Override ANTHROPIC_API_KEY
 *   --save, -s      Salva output a file JSON
 *   --verbose, -v   Output dettagliato
 *
 * Esempio:
 *   taskflow complete-task 550e8400 --save
 *   taskflow complete-task 550e8400 --model claude-3-opus-20250219 --max-tokens 4096
 */

import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Classe per gestire gli errori dell'utente in modo coerente
 */
class ErroreUtente extends Error {
  constructor(message) {
    super(message);
    this.name = 'ErroreUtente';
  }
}

/**
 * Colori per output del terminale
 */
const colori = {
  reset: '\x1b[0m',
  grigio: '\x1b[90m',
  rosso: '\x1b[31m',
  giallo: '\x1b[33m',
  azzurro: '\x1b[36m',
  verde: '\x1b[32m',
  bianco: '\x1b[37m',
};

function stampa(testo, colore = 'reset') {
  console.log(`${colori[colore]}${testo}${colori.reset}`);
}

function log(testo) {
  stampa(`ℹ ${testo}`, 'azzurro');
}

function errore(testo) {
  stampa(`✗ ${testo}`, 'rosso');
}

function successo(testo) {
  stampa(`✓ ${testo}`, 'verde');
}

function avviso(testo) {
  stampa(`⚠ ${testo}`, 'giallo');
}

/**
 * Carica il task dal TaskFlow API
 */
async function caricaTask(taskId, sessione) {
  try {
    // Carica la configurazione dal taskflowCore
    const coreModule = await import('./taskflowCore.mjs');
    const {
      configurazione,
      apriSessione,
      organizzazione,
      chiamata
    } = coreModule;

    const cfg = configurazione();
    const sessioneTaskFlow = sessione || await apriSessione(cfg);
    const org = await organizzazione(cfg, sessioneTaskFlow);

    // Cerca il task per ID prefisso
    const url = `/org/${org.id}/tasks?search=${taskId}`;
    const risposta = await chiamata(cfg, url, { token: sessioneTaskFlow.token });

    if (!risposta.tasks || risposta.tasks.length === 0) {
      throw new Error(`Nessun task trovato con ID che inizia per "${taskId}"`);
    }

    const task = risposta.tasks[0];
    return { task, sessioneTaskFlow, cfg, org };
  } catch (err) {
    throw new ErroreUtente(`Errore nel caricamento del task: ${err.message}`);
  }
}

/**
 * Genera il prompt per Claude basato sul task
 */
function generaPrompt(task, nomeOrganizzazione) {
  const righe = [];

  righe.push('Help me move this task forward. If something is unclear, ask me instead of making it up.');
  righe.push('');
  righe.push(`# ${task.title}`);

  const meta = [
    `Priority: ${task.priority || 'normal'}`,
    `Status: ${task.status || 'not-started'}`,
  ];

  if (task.due_date) {
    meta.push(`Due Date: ${task.due_date.slice(0, 10)}`);
  }

  if (nomeOrganizzazione) {
    meta.push(`Organization: ${nomeOrganizzazione}`);
  }

  if (task.department) {
    meta.push(`Department: ${task.department}`);
  }

  righe.push(meta.join('  ·  '));

  if (task.labels && task.labels.length) {
    righe.push(`Labels: ${task.labels.join(', ')}`);
  }

  righe.push('');
  righe.push(task.description?.trim() || '(no description)');

  if (task.subtasks && task.subtasks.length) {
    righe.push('', 'Steps:');
    for (const step of task.subtasks) {
      righe.push(`- [${step.done ? 'x' : ' '}] ${step.title}`);
    }
  }

  righe.push('');
  righe.push(`When we are done, I will record the result in TaskFlow myself (id ${task.id.slice(0, 8)}).`);

  return righe.join('\n');
}

/**
 * Chiama Claude per completare il task
 */
async function completaConClaude(prompt, opzioni) {
  const apiKey = opzioni.apiKey || process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new ErroreUtente(
      'ANTHROPIC_API_KEY non e\' impostato. Passa --api-key oppure esporta ANTHROPIC_API_KEY.'
    );
  }

  const client = new Anthropic({ apiKey });

  log(`Connessione a Claude (${opzioni.model})...`);

  try {
    const response = await client.messages.create({
      model: opzioni.model,
      max_tokens: opzioni.maxTokens,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    if (response.content && response.content.length > 0) {
      const contenuto = response.content[0];
      if (contenuto.type === 'text') {
        return {
          output: contenuto.text,
          usage: {
            input_tokens: response.usage.input_tokens,
            output_tokens: response.usage.output_tokens,
          },
          stop_reason: response.stop_reason,
        };
      }
    }

    throw new Error('Risposta inattesa da Claude');
  } catch (err) {
    if (err instanceof ErroreUtente) throw err;
    throw new ErroreUtente(`Errore in comunicazione con Claude: ${err.message}`);
  }
}

/**
 * Salva il risultato su file
 */
async function salvaRisultato(task, risultato, opzioni) {
  if (!opzioni.salva) return null;

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const nomeFile = `taskflow-${task.id.slice(0, 8)}-${timestamp}.json`;
  const percorso = path.join(process.cwd(), nomeFile);

  const dati = {
    task: {
      id: task.id,
      title: task.title,
      status: task.status,
    },
    completato: new Date().toISOString(),
    modello: opzioni.model,
    risultato: {
      output: risultato.output,
      usage: risultato.usage,
      stop_reason: risultato.stop_reason,
    },
  };

  fs.writeFileSync(percorso, JSON.stringify(dati, null, 2), 'utf-8');
  return percorso;
}

/**
 * Aggiorna lo stato del task su TaskFlow
 */
async function aggiornaTasKFlow(task, risultato, sessioneTaskFlow, cfg, org, opzioni) {
  try {
    const { cambiaStato, aggiungiNota } = await import('./taskflowCore.mjs');

    // Marca il task come completato
    const esito = await cambiaStato(cfg, sessioneTaskFlow, org, {
      pezzo: task.id.slice(0, 8),
      stato: 'completata',
    });

    // Aggiungi una nota con un riassunto dell'output di Claude
    const riassunto = risultato.output.slice(0, 500).replace(/\n/g, ' ');
    await aggiungiNota(cfg, sessioneTaskFlow, org, {
      pezzo: task.id.slice(0, 8),
      testo: `[Via CLI Claude] ${riassunto}...`,
    });

    return esito;
  } catch (err) {
    if (opzioni.verbose) {
      avviso(`Non ho potuto aggiornare automaticamente su TaskFlow: ${err.message}`);
    }
    return null;
  }
}

/**
 * Mostra help
 */
function mostraHelp() {
  const aiuto = `
TaskFlow - Complete Task via Claude CLI

Uso:
  taskflow complete-task <taskId> [options]

Argomenti:
  <taskId>  Prime lettere dell'ID task (es: 550e8400)

Opzioni:
  --model <nome>        Modello Claude da usare
                        (default: claude-3-5-sonnet-20241022)
  --max-tokens <num>    Token massimi per la risposta
                        (default: 2048)
  --api-key <key>       Override ANTHROPIC_API_KEY
  --save, -s            Salva il risultato in file JSON
  --verbose, -v         Mostra dettagli durante l'esecuzione
  --help, -h            Mostra questo messaggio

Esempi:
  # Completa il task interattivamente
  taskflow complete-task 550e8400

  # Salva il risultato su file
  taskflow complete-task 550e8400 --save

  # Usa un modello diverso
  taskflow complete-task 550e8400 --model claude-3-opus-20250219

  # Tutti insieme
  taskflow complete-task 550e8400 --model claude-3-opus-20250219 \\
    --max-tokens 4096 --save --verbose

Prerequisiti:
  1. Esegui una volta: taskflow accedi
  2. Imposta ANTHROPIC_API_KEY nell'ambiente

Note:
  • Il task viene cercato per prefix: "550e" trova tutti i task
    che iniziano con quelle lettere
  • Se ci sono piu' match, viene usato il primo
  • Il risultato puo' essere salvato con --save per
    verificarlo prima di aggiornare TaskFlow
`;
  console.log(aiuto);
}

/**
 * Funzione principale
 */
async function principale() {
  const argomenti = process.argv.slice(2);

  // Help
  if (
    argomenti.length === 0 ||
    argomenti.includes('--help') ||
    argomenti.includes('-h') ||
    argomenti[0] === 'help'
  ) {
    mostraHelp();
    return;
  }

  // Parsing argomenti semplice (no yargs per mantenere dipendenze minime)
  const comando = argomenti[0];

  if (comando !== 'complete-task') {
    throw new ErroreUtente(`Comando sconosciuto: "${comando}". Prova "help".`);
  }

  const taskId = argomenti[1];
  if (!taskId) {
    throw new ErroreUtente('Serve l\'ID del task. Prova: taskflow help');
  }

  // Parsing opzioni
  const opzioni = {
    model: 'claude-3-5-sonnet-20241022',
    maxTokens: 2048,
    apiKey: null,
    salva: false,
    verbose: false,
  };

  for (let i = 2; i < argomenti.length; i++) {
    const arg = argomenti[i];

    if (arg === '--model') {
      opzioni.model = argomenti[++i];
    } else if (arg === '--max-tokens') {
      opzioni.maxTokens = parseInt(argomenti[++i], 10);
    } else if (arg === '--api-key') {
      opzioni.apiKey = argomenti[++i];
    } else if (arg === '--save' || arg === '-s') {
      opzioni.salva = true;
    } else if (arg === '--verbose' || arg === '-v') {
      opzioni.verbose = true;
    }
  }

  if (opzioni.verbose) {
    log(`Opzioni: ${JSON.stringify(opzioni)}`);
  }

  // Carica il task
  if (opzioni.verbose) log('Caricamento task da TaskFlow...');
  const { task, sessioneTaskFlow, cfg, org } = await caricaTask(taskId);
  successo(`Task caricato: "${task.title}"`);

  // Genera prompt per Claude
  if (opzioni.verbose) log('Generazione prompt per Claude...');
  const prompt = generaPrompt(task, org.name);

  if (opzioni.verbose) {
    console.log('\n' + colori.grigio + '--- PROMPT ---' + colori.reset);
    console.log(prompt);
    console.log(colori.grigio + '--- FINE PROMPT ---' + colori.reset + '\n');
  }

  // Chiama Claude
  const risultato = await completaConClaude(prompt, opzioni);
  successo('Risposta ricevuta da Claude');

  if (opzioni.verbose) {
    log(`Token usati: ${risultato.usage.input_tokens} input, ${risultato.usage.output_tokens} output`);
  }

  // Mostra il risultato
  console.log('\n' + colori.bianco + '--- RISULTATO ---' + colori.reset);
  console.log(risultato.output);
  console.log(colori.bianco + '--- FINE ---' + colori.reset + '\n');

  // Salva se richiesto
  if (opzioni.salva) {
    const percorso = await salvaRisultato(task, risultato, opzioni);
    if (percorso) {
      successo(`Risultato salvato: ${percorso}`);
    }
  }

  // Chiedi se aggiornare TaskFlow
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const domanda = () => {
    return new Promise((resolve) => {
      rl.question(
        '\nAggiorno TaskFlow segnando il task come completato? (s/n) ',
        (risposta) => {
          resolve(risposta.toLowerCase() === 's' || risposta.toLowerCase() === 'si');
        }
      );
    });
  };

  const aggiorna = await domanda();
  rl.close();

  if (aggiorna) {
    if (opzioni.verbose) log('Aggiornamento TaskFlow...');
    await aggiornaTasKFlow(task, risultato, sessioneTaskFlow, cfg, org, opzioni);
    successo('Task aggiornato su TaskFlow');
  } else {
    log('Task non aggiornato. Ricorda di aggiornarlo manualmente!');
  }
}

// Esecuzione
principale().catch((err) => {
  if (err instanceof ErroreUtente) {
    errore(err.message);
  } else {
    errore(`Errore: ${err.message}`);
    if (process.env.DEBUG) {
      console.error(err);
    }
  }
  process.exitCode = 1;
});
