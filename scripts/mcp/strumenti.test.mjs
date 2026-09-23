/*
  I sette strumenti aggiunti al connettore (crea, assegna, riprogramma,
  priorita', etichette, elenco persone, ricerca), provati attraverso un vero
  server MCP contro un finto Supabase che fa anche da rotta /api/tasks.

  Come sessione.test.mjs: un processo separato e una conversazione MCP vera, per
  vedere il codice come lo vede Claude Desktop — non le funzioni del nucleo in
  isolamento, che i test del nucleo gia' coprono.
*/
import { createServer } from 'node:http';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

const QUI = dirname(fileURLToPath(import.meta.url));
const SERVER = resolve(QUI, 'taskflow.mjs');
const UTENTE = { id: 'utente-anna', email: 'anna@esempio.it' };
const ORG = { id: 'org-acme', nome: 'Acme' };
const TASK_ID = 'aaaaaaaa-1111-2222-3333-444444444444';

function nuovoTask() {
  return {
    id: TASK_ID, title: 'Rivedere il contratto', description: 'Clausole 4 e 7',
    status: 'not-started', priority: 'medium', due_date: null, department: 'Legal',
    labels: [], subtasks: [], blocked_by: [], requires_approval: false,
    approved_by: null, approved_at: null, assignee_id: null, watchers: [],
    comments: [], activities: [], organization_id: ORG.id, archived_at: null,
    created_by: UTENTE.id, updated_at: '2026-09-20T10:00:00Z',
  };
}

/**
 * Un finto Supabase che risponde come il vero e fa anche da rotta /api/tasks.
 * `ruolo` decide cosa vede la membership (admin => vede tutto, puo' assegnare).
 */
async function fintoServer(store, ruolo = 'admin') {
  const server = createServer((req, res) => {
    const pezzi = [];
    req.on('data', (p) => pezzi.push(p));
    req.on('end', () => {
      const url = req.url;
      const percorso = url.split('?')[0];
      const body = Buffer.concat(pezzi).toString() || '{}';
      const ok = (b, s = 200) => { res.writeHead(s, { 'content-type': 'application/json' }); res.end(JSON.stringify(b)); };

      if (percorso === '/auth/v1/token')
        return ok({ access_token: 'token-anna', refresh_token: 'rinnovo-anna', expires_in: 3600, user: UTENTE });
      if (!req.headers.authorization) return ok({ message: 'no auth' }, 401);

      if (percorso === '/rest/v1/organization_members') {
        if (url.includes('profiles('))
          return ok([
            { user_id: 'utente-anna', role: ruolo, profiles: { id: 'utente-anna', full_name: 'Anna Rossi', email: 'anna@esempio.it' } },
            { user_id: 'utente-bruno', role: 'member', profiles: { id: 'utente-bruno', full_name: 'Bruno Bianchi', email: 'bruno@esempio.it' } },
          ]);
        return ok([{ role: ruolo, organization_id: ORG.id, custom_permissions: null, organizations: { id: ORG.id, name: ORG.nome } }]);
      }
      if (percorso === '/rest/v1/profiles') return ok([{ full_name: 'Anna Rossi', avatar_url: null }]);
      if (percorso === '/rest/v1/notifications') { store.notifiche++; return ok([], 201); }

      if (percorso === '/rest/v1/tasks') {
        if (req.method === 'PATCH') {
          // Un finto blocco RLS: rispondere 200 [] simula "0 righe" e deve
          // diventare un errore, non un finto successo.
          if (store.rlsBlocca) return ok([]);
          Object.assign(store.task, JSON.parse(body));
          store.patch++;
          return ok([store.task]);
        }
        if (url.includes('id=in.(')) return ok([]);
        if (url.includes('or=(title.ilike')) {
          const m = decodeURIComponent(url).match(/ilike\.\*([^*]+)\*/);
          const q = (m ? m[1] : '').toLowerCase();
          const trova = store.task.title.toLowerCase().includes(q) || (store.task.description || '').toLowerCase().includes(q);
          return ok(trova ? [{ id: store.task.id }] : []);
        }
        return ok([store.task]);
      }

      if (percorso === '/api/tasks' && req.method === 'POST') {
        const b = JSON.parse(body);
        store.creati.push(b);
        return ok({ task: { ...b, status: b.status, priority: b.priority, due_date: b.dueDate, assignee_id: b.assigneeId, organization_id: ORG.id, created_by: UTENTE.id, created_at: '2026-09-20T11:00:00Z' } }, 201);
      }
      return ok({ message: `non previsto: ${percorso}` }, 404);
    });
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  return { server, url: `http://127.0.0.1:${server.address().port}` };
}

describe('gli strumenti aggiuntivi del connettore', () => {
  let finto, store, casa, cliente;

  const avvia = async ({ ruolo = 'admin', conAppUrl = true } = {}) => {
    store = { task: nuovoTask(), patch: 0, notifiche: 0, creati: [], rlsBlocca: false };
    finto = await fintoServer(store, ruolo);
    casa = mkdtempSync(resolve(tmpdir(), 'tf-strumenti-'));
    const fileSess = resolve(casa, 'taskflow/sessione.json');
    mkdirSync(dirname(fileSess), { recursive: true });
    writeFileSync(fileSess, JSON.stringify({ url: finto.url, chiave: 'anon', rinnovo: 'rinnovo-anna', utente: UTENTE }));
    const env = { PATH: process.env.PATH, XDG_CONFIG_HOME: casa, VITE_SUPABASE_URL: finto.url, VITE_SUPABASE_PUBLISHABLE_KEY: 'anon' };
    if (conAppUrl) env.TASKFLOW_APP_URL = finto.url;
    cliente = new Client({ name: 'prova', version: '1.0.0' });
    await cliente.connect(new StdioClientTransport({ command: process.execPath, args: [SERVER], env }));
  };

  const chiama = async (name, args = {}) => {
    const e = await cliente.callTool({ name, arguments: args });
    return { testo: e.content.map((c) => c.text).join('\n'), errore: e.isError === true };
  };

  afterEach(async () => {
    await cliente?.close();
    if (finto) await new Promise((ok) => finto.server.close(ok));
    if (casa) rmSync(casa, { recursive: true, force: true });
  });

  it('espone undici strumenti', async () => {
    await avvia();
    const nomi = (await cliente.listTools()).tools.map((t) => t.name);
    expect(nomi).toHaveLength(11);
    expect(nomi).toEqual(expect.arrayContaining([
      'taskflow_crea_task', 'taskflow_assegna_task', 'taskflow_riprogramma_task',
      'taskflow_imposta_priorita', 'taskflow_imposta_etichette',
      'taskflow_elenco_persone', 'taskflow_cerca_task',
    ]));
  });

  it('elenca le persone con nome e ruolo', async () => {
    await avvia();
    const { testo, errore } = await chiama('taskflow_elenco_persone');
    expect(errore).toBe(false);
    expect(testo).toContain('Anna Rossi — admin');
    expect(testo).toContain('Bruno Bianchi — member');
  });

  it('crea un task passando dalla rotta /api/tasks', async () => {
    await avvia();
    const { testo, errore } = await chiama('taskflow_crea_task', { titolo: 'Nuovo incarico', assegnatario: 'bruno@esempio.it', priorita: 'high' });
    expect(errore).toBe(false);
    expect(testo).toContain('Nuovo incarico');
    expect(store.creati).toHaveLength(1);
    expect(store.creati[0].assigneeId).toBe('utente-bruno');
    expect(store.creati[0].status).toBe('not-started');
    expect(store.creati[0].priority).toBe('high');
  });

  it('crea_task senza TASKFLOW_APP_URL spiega come impostarlo', async () => {
    await avvia({ conAppUrl: false });
    const { testo, errore } = await chiama('taskflow_crea_task', { titolo: 'Senza indirizzo' });
    expect(errore).toBe(true);
    expect(testo).toMatch(/TASKFLOW_APP_URL/);
    expect(store.creati).toHaveLength(0);
  });

  it('assegna, riprogramma, cambia priorita ed etichette (con dedup e minuscole)', async () => {
    await avvia();
    expect((await chiama('taskflow_assegna_task', { id: 'aaaa', assegnatario: 'me' })).errore).toBe(false);
    expect(store.task.assignee_id).toBe('utente-anna');

    expect((await chiama('taskflow_riprogramma_task', { id: 'aaaa', scadenza: '2026-12-01' })).errore).toBe(false);
    expect(String(store.task.due_date)).toMatch(/^2026-12-01/);

    expect((await chiama('taskflow_imposta_priorita', { id: 'aaaa', priorita: 'high' })).errore).toBe(false);
    expect(store.task.priority).toBe('high');

    expect((await chiama('taskflow_imposta_etichette', { id: 'aaaa', etichette: ['Urgente', 'urgente', 'Legale'] })).errore).toBe(false);
    expect(store.task.labels).toEqual(['urgente', 'legale']);
  });

  it('un blocco RLS sulla PATCH diventa un errore, non un finto successo', async () => {
    await avvia();
    store.rlsBlocca = true;
    const { errore, testo } = await chiama('taskflow_imposta_priorita', { id: 'aaaa', priorita: 'high' });
    expect(errore).toBe(true);
    expect(testo).toMatch(/non ha lasciato passare/);
  });

  it('rifiuta un assegnatario che non e della organizzazione', async () => {
    await avvia();
    const { errore, testo } = await chiama('taskflow_assegna_task', { id: 'aaaa', assegnatario: 'estraneo@altrove.it' });
    expect(errore).toBe(true);
    expect(testo).toMatch(/Nessuna persona/);
  });

  it('cerca fra le attivita: un admin vede tutta l organizzazione', async () => {
    await avvia({ ruolo: 'admin' });
    const { testo, errore } = await chiama('taskflow_cerca_task', { testo: 'contratto' });
    expect(errore).toBe(false);
    expect(testo).toContain('Acme —');
    expect(testo).toContain('Rivedere il contratto');
  });

  it('cerca fra le attivita: un member vede solo le proprie', async () => {
    await avvia({ ruolo: 'member' });
    const { testo, errore } = await chiama('taskflow_cerca_task', {});
    expect(errore).toBe(false);
    expect(testo).toContain('le tue attivita');
  });
});
