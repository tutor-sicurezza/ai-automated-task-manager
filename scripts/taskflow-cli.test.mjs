/*
  La riga di comando e i comandi nuovi, provati come li usa una persona.

  Come in scripts/mcp/sessione.test.mjs, al posto di Supabase c'e' un server
  HTTP locale: cosi' gira il codice vero — accesso con il rinnovo salvato,
  lettura dell'appartenenza, e le operazioni sui task — invece di finti.
  Qui pero' non c'e' un processo che vive: ogni comando e' un `node
  scripts/taskflow.mjs ...` a se', avviato con `spawn` e osservato da cio' che
  stampa. Si usa `spawn` e non `spawnSync` di proposito: il server finto gira
  in QUESTO processo, e un figlio sincrono lo terrebbe fermo — nessuno
  risponderebbe alle sue richieste, e il comando resterebbe appeso.
*/
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

const QUI = dirname(fileURLToPath(import.meta.url));
const CLI = resolve(QUI, 'taskflow.mjs');

const RINNOVO = 'rinnovo-anna';
const TOKEN = 'token-anna';
const UTENTE = { id: 'utente-anna', email: 'anna@esempio.it', user_metadata: { full_name: 'Anna' } };
const ORG = { id: 'org-acme', nome: 'Acme' };
const TASK_ID = 'aaaaaaaa-1111-2222-3333-444444444444';

/** Il task che il finto Supabase restituisce, assegnato a chi ha fatto l'accesso. */
const task = () => ({
  id: TASK_ID,
  title: 'Rivedere il contratto',
  status: 'not-started',
  priority: 'medium',
  labels: [],
  due_date: null,
  updated_at: '2026-09-01T00:00:00.000Z',
  assignee_id: UTENTE.id,
  watchers: [],
  blocked_by: [],
  requires_approval: false,
  approved_by: null,
  approved_at: null,
  comments: [],
  activities: [],
});

/** Un finto Supabase che risponde come il vero al poco che questi comandi chiedono. */
async function fintoSupabase() {
  const server = createServer((req, res) => {
    const pezzi = [];
    req.on('data', (p) => pezzi.push(p));
    req.on('end', () => {
      const [percorso, query = ''] = req.url.split('?');
      const rispondi = (stato, corpo) => {
        res.writeHead(stato, { 'content-type': 'application/json' });
        res.end(JSON.stringify(corpo));
      };

      if (percorso === '/auth/v1/token') {
        const { refresh_token: rinnovo } = JSON.parse(Buffer.concat(pezzi).toString() || '{}');
        if (rinnovo !== RINNOVO) return rispondi(400, { message: 'Invalid Refresh Token' });
        return rispondi(200, {
          access_token: TOKEN,
          refresh_token: RINNOVO,
          expires_in: 3600,
          user: UTENTE,
        });
      }

      if (req.headers.authorization !== `Bearer ${TOKEN}`) {
        return rispondi(401, { message: 'JWT non valido' });
      }

      if (percorso === '/rest/v1/organization_members') {
        // `persone` chiede i profili; `organizzazione`, la sola appartenenza.
        if (query.includes('profiles')) {
          return rispondi(200, [
            {
              user_id: UTENTE.id,
              role: 'admin',
              profiles: { id: UTENTE.id, full_name: 'Anna Rossi', avatar_url: '', email: 'anna@esempio.it' },
            },
            {
              user_id: 'utente-bruno',
              role: 'member',
              profiles: { id: 'utente-bruno', full_name: 'Bruno Bianchi', avatar_url: '', email: 'bruno@esempio.it' },
            },
          ]);
        }
        return rispondi(200, [
          {
            organization_id: ORG.id,
            role: 'member',
            custom_permissions: null,
            organizations: { id: ORG.id, name: ORG.nome },
          },
        ]);
      }

      if (percorso === '/rest/v1/profiles') {
        return rispondi(200, [{ full_name: 'Anna', avatar_url: '' }]);
      }

      if (percorso === '/rest/v1/tasks') {
        if (req.method === 'PATCH') {
          const modifiche = JSON.parse(Buffer.concat(pezzi).toString() || '{}');
          return rispondi(200, [{ ...task(), ...modifiche }]);
        }
        if (query.includes('select=comments,activities')) {
          return rispondi(200, [{ comments: [], activities: [] }]);
        }
        if (query.includes('or=(')) {
          // La ricerca per testo: torna gli id che combaciano.
          return rispondi(200, [{ id: TASK_ID }]);
        }
        return rispondi(200, [task()]);
      }

      return rispondi(404, { message: `percorso non previsto: ${percorso}` });
    });
  });

  await new Promise((ok) => server.listen(0, '127.0.0.1', ok));
  return { server, url: `http://127.0.0.1:${server.address().port}` };
}

describe('la riga di comando e i comandi nuovi', () => {
  let finto;
  let casa;

  const esegui = (args) =>
    new Promise((risolvi) => {
      const figlio = spawn(process.execPath, [CLI, ...args], {
        env: {
          PATH: process.env.PATH,
          XDG_CONFIG_HOME: casa,
          VITE_SUPABASE_URL: finto.url,
          VITE_SUPABASE_PUBLISHABLE_KEY: 'anon',
        },
      });
      let out = '';
      let err = '';
      figlio.stdout.on('data', (d) => (out += d));
      figlio.stderr.on('data', (d) => (err += d));
      figlio.on('close', (code) => risolvi({ code, out, err }));
    });

  beforeEach(async () => {
    finto = await fintoSupabase();
    casa = mkdtempSync(resolve(tmpdir(), 'taskflow-cli-'));
    const fileSessione = resolve(casa, 'taskflow/sessione.json');
    mkdirSync(dirname(fileSessione), { recursive: true });
    writeFileSync(
      fileSessione,
      JSON.stringify({ url: finto.url, chiave: 'anon', rinnovo: RINNOVO })
    );
  });

  afterEach(async () => {
    await new Promise((ok) => finto.server.close(ok));
    rmSync(casa, { recursive: true, force: true });
  });

  it('persone elenca i membri con ruolo ed email', async () => {
    const { code, out } = await esegui(['persone']);
    expect(code).toBe(0);
    expect(out).toContain('Anna Rossi');
    expect(out).toContain('admin');
    expect(out).toContain('anna@esempio.it');
    expect(out).toContain('Bruno Bianchi');
    expect(out).toContain('bruno@esempio.it');
  });

  it('priorita <id> high stampa il cambio riuscito', async () => {
    const { code, out } = await esegui(['priorita', TASK_ID.slice(0, 8), 'high']);
    expect(code).toBe(0);
    expect(out).toContain('Rivedere il contratto');
    expect(out).toContain('high');
  });

  it('cerca <testo> trova l attivita che combacia', async () => {
    const { code, out } = await esegui(['cerca', 'contratto']);
    expect(code).toBe(0);
    expect(out).toContain('Rivedere il contratto');
  });
});
