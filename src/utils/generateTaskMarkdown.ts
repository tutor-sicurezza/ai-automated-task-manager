/**
 * generateTaskMarkdown.ts
 *
 * Utilities per generare il markdown di un task pronto per Claude Desktop.
 * Queste funzioni creano il prompt strutturato che Claude puo' capire
 * e che il connettore MCP puo' usare per comprendere cosa fare.
 *
 * Method 2: Complete via Claude Desktop (MCP Connector)
 */

import { bloccantiAperti } from '@/lib/dipendenze';
import { ETICHETTA_PRIORITA, ETICHETTA_STATO } from '@/lib/scaleTask';
import type { Task, Sottoattivita } from '@/lib/types';

/** Traduttore per i testi. */
export type Translator = (key: string, params?: Record<string, string | number>) => string;

const DEFAULT_TRANSLATOR: Translator = (key, params) =>
  Object.entries(params ?? {}).reduce(
    (acc, [name, value]) => acc.split(`{${name}}`).join(String(value)),
    key
  );

/**
 * Opzioni per generare il markdown del task
 */
export interface GenerateMarkdownOptions {
  /** Nome dell'organizzazione, per contesto */
  organizzazione?: string | null;
  /** Traduttore (opzionale, usa inglese di default) */
  t?: Translator;
  /** Tutti i task, per distinguere bloccanti aperti da chiusi */
  tuttiITask?: Task[];
}

/**
 * Converte una lista di sottoattivita' in stringhe formattate
 */
function formatSubtasks(subtasks: Sottoattivita[] | undefined): string[] {
  if (!subtasks?.length) return [];
  return subtasks.map((s) => `- [${s.done ? 'x' : ' '}] ${s.title}`);
}

/**
 * Traduce un valore di una scala chiusa
 */
function translateScale(
  value: string,
  labels: Record<string, string>,
  t: Translator
): string {
  const key = labels[value];
  return key ? t(key) : value;
}

/**
 * Genera il markdown strutturato di un task per Claude
 *
 * Questo markdown contiene tutte le informazioni di cui Claude ha bisogno
 * per comprendere il task e lavorarci. E' strutturato in modo che sia
 * facile da leggere per un umano ma anche interpretabile da Claude.
 *
 * @param task Il task da formattare
 * @param options Opzioni per la generazione (organizzazione, traduttore, etc)
 * @returns String in markdown pronto per Claude
 */
export function generateTaskMarkdown(
  task: Task,
  options: GenerateMarkdownOptions = {}
): string {
  const t = options.t ?? DEFAULT_TRANSLATOR;
  const lines: string[] = [];

  // Introduzione
  lines.push(
    t('Help me complete this task in TaskFlow. Ask if anything is unclear.')
  );
  lines.push('');

  // Titolo
  lines.push(`# ${task.title}`);

  // Metadata
  const metadata: string[] = [
    `${t('ID')}: ${task.id.slice(0, 8)}`,
    `${t('Status')}: ${translateScale(task.status, ETICHETTA_STATO, t)}`,
    `${t('Priority')}: ${translateScale(task.priority ?? 'medium', ETICHETTA_PRIORITA, t)}`,
  ];

  if (task.dueDate) {
    metadata.push(`${t('Due')}: ${task.dueDate.slice(0, 10)}`);
  }

  if (options.organizzazione) {
    metadata.push(`${t('Organization')}: ${options.organizzazione}`);
  }

  if (task.department) {
    metadata.push(`${t('Department')}: ${task.department}`);
  }

  lines.push(metadata.join('  ·  '));

  // Etichette
  if (task.labels?.length) {
    lines.push(`${t('Labels')}: ${task.labels.join(', ')}`);
  }

  lines.push('');

  // Descrizione
  lines.push(task.description?.trim() || t('(no description)'));

  // Sottoattivita'
  const subtasks = formatSubtasks(task.subtasks);
  if (subtasks.length) {
    lines.push('', `${t('Steps')}:`, ...subtasks);
  }

  // Bloccanti aperti
  const openBlockers = options.tuttiITask
    ? bloccantiAperti(task, options.tuttiITask)
    : [];

  if (openBlockers.length) {
    lines.push(
      '',
      t(
        'WARNING: This task is blocked by {count} other open tasks. ' +
          'The database will refuse to mark it complete until they are closed.',
        { count: openBlockers.length }
      )
    );
  }

  // Istruzioni finali
  lines.push(
    '',
    t(
      'When done, use the MCP Connector to mark this complete ' +
        '(task ID: {id}). ' +
        'You can use these tools: list-tasks, read-task, complete-task, add-note.',
      { id: task.id.slice(0, 8) }
    )
  );

  return lines.join('\n');
}

/**
 * Genera i comandi di installazione per il connettore MCP
 *
 * @param organizationId ID dell'organizzazione (opzionale)
 * @returns Comandi shell da eseguire
 */
export function getInstallationCommands(organizationId?: string | null): string {
  const lines = [
    '# Step 1: Login to TaskFlow',
    'node scripts/taskflow.mjs accedi',
    '',
    '# Step 2: Install the MCP Connector',
    organizationId
      ? `node scripts/mcp/taskflow.mjs --installa --org ${organizationId}`
      : 'node scripts/mcp/taskflow.mjs --installa',
    '',
    '# Then restart Claude Desktop',
  ];

  return lines.join('\n');
}

/**
 * Genera il comando di completamento per la CLI
 *
 * Questo comando puo' essere usato da terminale per marcare
 * un task come completato, quando non si usa il connettore MCP.
 *
 * @param task Il task da completare
 * @param note Nota opzionale da aggiungere
 * @returns Comando shell
 */
export function getCompletionCommand(task: Task, note?: string): string {
  const baseCmd = `node scripts/taskflow.mjs stato ${task.id.slice(0, 8)} completata`;

  if (note) {
    // Escapa la nota per la shell
    const escapedNote = note.replace(/"/g, '\\"');
    return `${baseCmd} "${escapedNote}"`;
  }

  return baseCmd;
}

/**
 * Formato JSON strutturato di un task per applicazioni
 *
 * Utile per esportare il task in formato strutturato invece che markdown.
 *
 * @param task Il task da formattare
 * @returns Oggetto JSON con i dati del task
 */
export function taskAsJSON(task: Task) {
  return {
    id: task.id,
    title: task.title,
    status: task.status,
    priority: task.priority ?? null,
    dueDate: task.dueDate ?? null,
    department: task.department ?? null,
    description: task.description ?? null,
    labels: task.labels ?? [],
    subtasks: (task.subtasks ?? []).map((s) => ({
      id: s.id,
      title: s.title,
      done: s.done,
      doneAt: s.doneAt ?? null,
      doneBy: s.doneBy ?? null,
    })),
    blockedBy: task.blockedBy ?? [],
    comments: (task.comments ?? []).map((c) => ({
      id: c.id,
      author: c.userName,
      content: c.content,
      createdAt: c.createdAt,
    })),
  };
}

/**
 * Frase di introduzione per chiedere a Claude di usare il connettore
 *
 * @param task Il task da completare
 * @param t Traduttore (opzionale)
 * @returns Frase pronta da dire a Claude
 */
export function getClaudePrompt(task: Task, t?: Translator): string {
  const translator = t ?? DEFAULT_TRANSLATOR;
  return translator(
    'Open TaskFlow task {id} using the MCP Connector and help me work on it.',
    { id: task.id.slice(0, 8) }
  );
}

/**
 * Crea un prompt strutturato per Claude con tutti i dettagli del task
 *
 * Questo e' piu' breve del generateTaskMarkdown ed e' pensato per essere
 * incollato direttamente in una conversazione con Claude.
 *
 * @param task Il task
 * @param options Opzioni
 * @returns Prompt strutturato
 */
export function getQuickPrompt(
  task: Task,
  options: GenerateMarkdownOptions = {}
): string {
  const t = options.t ?? DEFAULT_TRANSLATOR;

  return (
    `${t('Work on this task in TaskFlow:')} ${task.title}\n` +
    `${t('ID')}: ${task.id.slice(0, 8)}\n` +
    `${t('Status')}: ${task.status}\n` +
    `${t('Priority')}: ${task.priority ?? 'medium'}\n` +
    (task.dueDate ? `${t('Due')}: ${task.dueDate.slice(0, 10)}\n` : '') +
    (task.description ? `\n${task.description.slice(0, 200)}${task.description.length > 200 ? '...' : ''}\n` : '') +
    `\n${t('Use the MCP Connector tools to help with this task.')}`
  );
}
