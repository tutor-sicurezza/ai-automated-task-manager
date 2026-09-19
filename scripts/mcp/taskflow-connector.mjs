#!/usr/bin/env node
/**
 * TaskFlow MCP Connector — Complete via Claude Desktop
 *
 * Method 2: Complete via Claude Desktop (MCP Connector)
 *
 * Questo server MCP permette a Claude Desktop di leggere e scrivere attivita'
 * TaskFlow direttamente, agendo con i permessi dell'utente che ha fatto login.
 *
 * ## Features
 *
 * - list-tasks: Elenca task assegnati
 * - read-task: Legge dettagli completi di un task
 * - complete-task: Marca un task come completato
 * - add-note: Aggiunge una nota a un task
 *
 * ## Authentication
 *
 * Usa il token salvato in ~/.taskflow/session.json
 * Nessuna chiave di servizio, nessuna configurazione aggiuntiva
 *
 * ## Installation
 *
 * Per la prima volta (scarica il token):
 *   node scripts/taskflow.mjs accedi
 *
 * Installa il connettore:
 *   node scripts/mcp/taskflow-connector.mjs --install
 *
 * Poi riavvia Claude Desktop.
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { homedir, platform } from 'node:os';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

import {
  ErroreUtente,
  aggiungiNota,
  attendeIlVisto,
  apriSessione,
  bloccantiApertiPerTask,
  cambiaStato,
  configurazione,
  dettaglioTask,
  eChiusaDavvero,
  improntaSessione,
  mieAttivita,
  organizzazione,
  staPerScadere,
} from '../taskflowCore.mjs';

const QUESTO = fileURLToPath(import.meta.url);

/* -------------------------------------------------------------------------- */
/* Session Management                                                         */
/* -------------------------------------------------------------------------- */

/**
 * La sessione si apre alla PRIMA chiamata, non all'avvio.
 * Si tiene in cache perche' ogni apertura brucia un token di rinnovo.
 */
let inCache = null;

/**
 * Contesto della sessione — accesso database e permessi.
 * Si riapre PRIMA che il token scada, non quando fallisce.
 */
async function contesto({ perScrivere = false } = {}) {
  // Verifica se la sessione salvata e' ancora la stessa
  if (inCache && inCache.impronta !== improntaSessione()) inCache = null;

  if (inCache && !staPerScadere(inCache.sessione)) {
    if (!perScrivere) return inCache;

    // Prima di SCRIVERE, rilegge i permessi
    inCache = {
      ...inCache,
      org: await organizzazione(inCache.cfg, inCache.sessione),
    };
    return inCache;
  }

  // Si riparte da zero
  inCache = null;

  const cfg = configurazione();
  const sessione = await apriSessione(cfg);
  const org = await organizzazione(cfg, sessione);

  inCache = { cfg, sessione, org, impronta: improntaSessione() };
  return inCache;
}

/**
 * Gestisce gli errori — un errore utente diventa testo, non un crollo.
 */
async function conErrori(azione) {
  try {
    return await azione();
  } catch (errore) {
    // La sessione potrebbe essere appena scaduta
    if (errore instanceof ErroreUtente) inCache = null;

    return {
      isError: true,
      content: [
        {
          type: 'text',
          text:
            errore instanceof ErroreUtente
              ? errore.message
              : `Operazione fallita: ${errore?.message ?? errore}`,
        },
      ],
    };
  }
}

const testo = (t, dati) => ({
  content: [{ type: 'text', text: t }],
  ...(dati ? { structuredContent: dati } : {}),
});

/* -------------------------------------------------------------------------- */
/* MCP Server & Tools                                                         */
/* -------------------------------------------------------------------------- */

const server = new McpServer({ name: 'taskflow-connector', version: '1.0.0' });

/**
 * Tool: list-tasks
 * Elenca i task assegnati all'utente attuale
 */
server.registerTool(
  'list-tasks',
  {
    title: 'List assigned tasks',
    description: 'Lists all tasks assigned to the logged-in user. Returns id, title, status, and due date.',
    inputSchema: {
      includeClosed: z
        .boolean()
        .optional()
        .describe('If true, also includes closed tasks. Default: false.'),
    },
    annotations: { readOnlyHint: true, destructiveHint: false },
  },
  async ({ includeClosed = false }) =>
    conErrori(async () => {
      const { cfg, sessione, org } = await contesto();
      const tutte = await mieAttivita(cfg, sessione, org);
      const scelte = includeClosed ? tutte : tutte.filter((t) => !eChiusaDavvero(t));

      if (!scelte.length) {
        return testo(
          includeClosed
            ? `No tasks assigned to you in ${org.name}.`
            : `No open tasks assigned to you in ${org.name}.`,
          { organization: org.name, tasks: [] }
        );
      }

      const aperti = await bloccantiApertiPerTask(cfg, sessione, org, scelte);

      const righe = scelte.map((t) => ({
        id: t.id,
        title: t.title,
        status: t.status,
        dueDate: t.due_date ? t.due_date.slice(0, 10) : null,
        awaitingApproval: attendeIlVisto(t),
        blockedBy: aperti.get(t.id) ?? 0,
      }));

      const elenco = righe
        .map(
          (r) =>
            `- ${r.id}  [${r.status}]  ${r.dueDate ?? 'no due date'}  ${r.title}` +
            (r.awaitingApproval ? '  (awaiting approval)' : '') +
            (r.blockedBy ? `  (blocked by ${r.blockedBy})` : '')
        )
        .join('\n');

      return testo(`${org.name} — ${righe.length} tasks:\n${elenco}`, {
        organization: org.name,
        tasks: righe,
      });
    })
);

/**
 * Tool: read-task
 * Legge il dettaglio completo di un task
 */
server.registerTool(
  'read-task',
  {
    title: 'Read task details',
    description: 'Gets full content of a task: description, subtasks, priority, labels, comments, and blocking tasks.',
    inputSchema: {
      id: z
        .string()
        .min(2)
        .describe('Task ID, can be partial (e.g., "3f2a").'),
    },
    annotations: { readOnlyHint: true, destructiveHint: false },
  },
  async ({ id }) =>
    conErrori(async () => {
      const { cfg, sessione, org } = await contesto();
      const { task, bloccanti } = await dettaglioTask(cfg, sessione, org, id);

      const subtasks = Array.isArray(task.subtasks) ? task.subtasks : [];
      const comments = Array.isArray(task.comments) ? task.comments : [];

      const parti = [
        `# ${task.title}`,
        `Status: ${task.status}${attendeIlVisto(task) ? ' (awaiting approval)' : ''}` +
          `   Priority: ${task.priority ?? '—'}   Due: ${
            task.due_date ? task.due_date.slice(0, 10) : 'none'
          }`,
      ];

      if (task.department) parti.push(`Department: ${task.department}`);
      if (Array.isArray(task.labels) && task.labels.length) {
        parti.push(`Labels: ${task.labels.join(', ')}`);
      }

      parti.push('', task.description?.trim() || '(no description)');

      if (subtasks.length) {
        parti.push('', 'Steps:');
        for (const p of subtasks) {
          parti.push(`  [${p.done ? 'x' : ' '}] ${p.title ?? ''}`);
        }
      }

      if (bloccanti.length) {
        parti.push('', 'Blocked by:');
        for (const b of bloccanti) parti.push(`  - ${b.title} [${b.status}]`);
      }

      if (comments.length) {
        const ultimi = comments.slice(-5);
        parti.push('', `Comments (last ${ultimi.length} of ${comments.length}):`);
        for (const c of ultimi) {
          parti.push(`  ${c.userName ?? 'someone'}: ${c.content ?? ''}`);
        }
      }

      return testo(parti.join('\n'), {
        id: task.id,
        title: task.title,
        status: task.status,
        awaitingApproval: attendeIlVisto(task),
        priority: task.priority ?? null,
        dueDate: task.due_date ?? null,
        description: task.description ?? null,
        subtasks,
        blockedBy: bloccanti.map((b) => ({ id: b.id, title: b.title, status: b.status })),
      });
    })
);

/**
 * Tool: complete-task
 * Marca un task come completato e aggiunge una nota opzionale
 */
server.registerTool(
  'complete-task',
  {
    title: 'Complete a task',
    description:
      'Marks a task as completed with an optional note about what was done. ' +
      'Sends notifications and records to history. ' +
      'The database enforces rules: a task blocked by others cannot be completed.',
    inputSchema: {
      id: z.string().min(2).describe('Task ID, can be partial.'),
      note: z
        .string()
        .optional()
        .describe('What was accomplished. Becomes a visible comment.'),
    },
    annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: false },
  },
  async ({ id, note }) =>
    conErrori(async () => {
      const { cfg, sessione, org } = await contesto({ perScrivere: true });
      const esito = await cambiaStato(cfg, sessione, org, { pezzo: id, stato: 'completata', nota: note });

      if (!esito.cambiato && !esito.conNota) {
        return testo(
          `"${esito.task.title}" was already ${esito.statoNuovo}: nothing changed.`,
          { changed: false, withNote: false }
        );
      }

      const pezzi = [`"${esito.task.title}"`];
      pezzi.push(esito.cambiato ? `moved to ${esito.statoNuovo}` : 'status unchanged');
      if (esito.conNota) pezzi.push('with note added');
      if (esito.attendeVisto) pezzi.push('— now awaits manager approval');

      return testo(pezzi.join(' '), {
        changed: esito.cambiato,
        withNote: esito.conNota,
        previousStatus: esito.statoPrecedente,
        newStatus: esito.statoNuovo,
        awaitingApproval: esito.attendeVisto,
      });
    })
);

/**
 * Tool: add-note
 * Aggiunge una nota senza cambiare lo stato
 */
server.registerTool(
  'add-note',
  {
    title: 'Add a note to a task',
    description:
      'Adds a comment to a task without changing its status. ' +
      'Notifies followers and assignees. Using "@Name" does NOT mention them.',
    inputSchema: {
      id: z.string().min(2).describe('Task ID, can be partial.'),
      text: z.string().min(1).describe('The comment text.'),
    },
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false },
  },
  async ({ id, text: contenuto }) =>
    conErrori(async () => {
      const { cfg, sessione, org } = await contesto({ perScrivere: true });
      const { task } = await aggiungiNota(cfg, sessione, org, { pezzo: id, testo: contenuto });
      return testo(`Note added to "${task.title}".`, { id: task.id, title: task.title });
    })
);

/* -------------------------------------------------------------------------- */
/* Claude Desktop Configuration                                              */
/* -------------------------------------------------------------------------- */

/**
 * Trova il percorso della configurazione di Claude Desktop per il sistema operativo.
 */
function percorsoConfigurazione() {
  const casa = homedir();
  switch (platform()) {
    case 'darwin':
      return resolve(casa, 'Library/Application Support/Claude/claude_desktop_config.json');
    case 'win32':
      return process.env.APPDATA
        ? resolve(process.env.APPDATA, 'Claude/claude_desktop_config.json')
        : null;
    case 'linux':
      return resolve(
        process.env.XDG_CONFIG_HOME || resolve(casa, '.config'),
        'Claude/claude_desktop_config.json'
      );
    default:
      return null;
  }
}

/**
 * Installa il connettore in Claude Desktop
 */
function installConnectorInClaudeDesktop(organizzazione) {
  const configPath = percorsoConfigurazione();
  if (!configPath) {
    console.error('Cannot determine Claude Desktop config location for this OS.');
    process.exitCode = 1;
    return;
  }

  // Leggi configurazione esistente o crea nuovo oggetto
  let config = {};
  try {
    const contenuto = readFileSync(configPath, 'utf-8');
    config = JSON.parse(contenuto);
  } catch {
    // File non esiste o non e' JSON valido, partiamo da zero
  }

  // Aggiungi il server MCP
  if (!config.mcpServers) config.mcpServers = {};

  const scriptPath = resolve(dirname(QUESTO), 'taskflow-connector.mjs');
  config.mcpServers.taskflow = {
    command: 'node',
    args: [scriptPath],
  };

  // Se c'e' un'organizzazione, passala come env var
  if (organizzazione) {
    config.mcpServers.taskflow.env = {
      TASKFLOW_ORG: organizzazione,
    };
  }

  // Scrivi la configurazione
  mkdirSync(dirname(configPath), { recursive: true });
  writeFileSync(configPath, JSON.stringify(config, null, 2));

  console.log(`✓ TaskFlow connector installed in Claude Desktop`);
  console.log(`✓ Config: ${configPath}`);
  if (organizzazione) console.log(`✓ Organization: ${organizzazione}`);
  console.log('\nRestart Claude Desktop to use the connector.');
}

/**
 * Disinstalla il connettore da Claude Desktop
 */
function uninstallConnectorFromClaudeDesktop() {
  const configPath = percorsoConfigurazione();
  if (!configPath) {
    console.error('Cannot determine Claude Desktop config location for this OS.');
    process.exitCode = 1;
    return;
  }

  try {
    const contenuto = readFileSync(configPath, 'utf-8');
    const config = JSON.parse(contenuto);

    if (config.mcpServers?.taskflow) {
      delete config.mcpServers.taskflow;
      writeFileSync(configPath, JSON.stringify(config, null, 2));
      console.log('✓ TaskFlow connector removed from Claude Desktop');
      console.log('✓ Config: ' + configPath);
      console.log('\nRestart Claude Desktop to apply changes.');
    } else {
      console.log('ℹ TaskFlow connector not found in Claude configuration');
    }
  } catch (err) {
    console.error('Error reading config: ' + err.message);
    process.exitCode = 1;
  }
}

/**
 * Verifica lo stato dell'installazione
 */
function checkInstallationStatus() {
  const configPath = percorsoConfigurazione();
  if (!configPath) {
    console.error('Cannot determine Claude Desktop config location for this OS.');
    process.exitCode = 1;
    return;
  }

  try {
    const contenuto = readFileSync(configPath, 'utf-8');
    const config = JSON.parse(contenuto);
    const taskflowServer = config.mcpServers?.taskflow;

    if (taskflowServer) {
      console.log('✓ TaskFlow connector is installed');
      console.log('\nConfiguration:');
      console.log('  Command: ' + taskflowServer.command);
      console.log('  Args: ' + JSON.stringify(taskflowServer.args));
      if (taskflowServer.env?.TASKFLOW_ORG) {
        console.log('  Organization: ' + taskflowServer.env.TASKFLOW_ORG);
      }
      console.log('\nLocation: ' + configPath);
    } else {
      console.log('✗ TaskFlow connector is NOT installed');
      console.log('\nTo install, run:');
      console.log('  node scripts/mcp/taskflow-connector.mjs --install');
    }
  } catch (err) {
    if (err.code === 'ENOENT') {
      console.log('ℹ Claude Desktop config file not found');
      console.log('   Make sure Claude Desktop is installed first');
      console.log('   Config path: ' + configPath);
    } else {
      console.error('Error reading config: ' + err.message);
    }
    process.exitCode = 1;
  }
}

/**
 * Gestisce gli argomenti CLI
 */
const arg = process.argv[2];
if (arg === '--install') {
  installConnectorInClaudeDesktop();
  process.exit(0);
}

if (arg === '--uninstall') {
  uninstallConnectorFromClaudeDesktop();
  process.exit(0);
}

if (arg === '--status') {
  checkInstallationStatus();
  process.exit(0);
}

/* -------------------------------------------------------------------------- */
/* Server Startup                                                             */
/* -------------------------------------------------------------------------- */

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  // Logging solo su stderr, non su stdout (che e' il canale MCP)
  console.error('[TaskFlow MCP Connector] Server started');
}

main().catch((err) => {
  console.error('Server error:', err);
  process.exit(1);
});
