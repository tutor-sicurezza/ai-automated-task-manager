# TaskFlow - Gestione task per team

Applicazione web per assegnare, tracciare e completare task all'interno di un'organizzazione,
con utenti, ruoli, dipartimenti, notifiche e invio email.

Il progetto nasceva da un template GitHub Spark ed e' stato migrato a **Supabase + Vercel**.
Il runtime Spark non e' piu' usato: autenticazione, dati e funzioni server sono reali.

> Per sapere cosa e' stato effettivamente verificato e cosa no, leggi **[STATO.md](STATO.md)**.
> Non esiste alcuna suite di test automatici in questo repository.

---

## Architettura

- **Frontend**: React 19 + TypeScript, build con Vite, UI Radix/shadcn + Tailwind CSS 4.
- **Autenticazione**: Supabase Auth (email + password). Nessun login finto o mock.
- **Database**: Postgres su Supabase, multi-tenant, con **RLS** attiva su tutte le tabelle
  applicative: ogni riga e' visibile solo ai membri dell'organizzazione a cui appartiene.
- **Stato applicativo**: salvato nelle tabelle `app_state` (dati dell'organizzazione) e
  `user_state` (dati del singolo utente) tramite un hook **`useKV` custom**
  (`src/hooks/useKV.ts`). Ha la stessa firma dell'hook Spark che sostituisce, ma
  scrive su Supabase, non su un KV store del runtime.
- **Funzioni serverless**: cartella `api/` su Vercel
  - `api/health.ts` - health check
  - `api/tasks/index.ts`, `api/notifications/index.ts`
  - `api/tenants/index.ts`, `api/tenants/[tenantId]/members.ts`
  - `api/email/send.ts` - invio email (Resend; supporto SendGrid presente nel codice)
  - `api/ai/complete.ts` - funzioni AI, richiede `ANTHROPIC_API_KEY`
- **Email**: Resend, chiamato solo lato server. Le chiavi API non stanno nel bundle client.
- **AI**: le chiamate passano da `api/ai/complete.ts` (SDK Anthropic). Se
  `ANTHROPIC_API_KEY` non e' configurata l'endpoint risponde **503** e le funzioni AI
  dell'interfaccia non funzionano.

---

## Prerequisiti

- Node.js 20 o superiore e npm
- Un progetto Supabase (URL, publishable key, service role key)
- Supabase CLI, oppure accesso all'SQL editor del progetto, per applicare le migrazioni
- Un account Resend con un dominio/mittente verificato (per le email)
- Una chiave API Anthropic (solo se servono le funzioni AI)
- Un account Vercel (per il deploy; le rotte in `api/` girano li')

---

## Setup

### 1. Dipendenze

```bash
npm install
```

### 2. Variabili d'ambiente

Crea un file `.env.local` nella radice (e' ignorato da git; non committarlo mai).

Variabili lette dal **client** (finiscono nel bundle, quindi solo valori pubblici):

```bash
VITE_SUPABASE_URL=https://<progetto>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<publishable/anon key>
```

Variabili lette **solo dal server** (funzioni in `api/`, da configurare anche
su Vercel come Environment Variables del progetto):

```bash
SUPABASE_URL=https://<progetto>.supabase.co
SUPABASE_ANON_KEY=<anon key>
SUPABASE_SERVICE_ROLE_KEY=<service role key>   # segreto: mai lato client
RESEND_API_KEY=<chiave Resend>
EMAIL_FROM="TaskFlow <no-reply@tuodominio.it>"
ANTHROPIC_API_KEY=<chiave Anthropic>           # senza questa, /api/ai/complete risponde 503
```

`SUPABASE_URL`, `SUPABASE_ANON_KEY` e `SUPABASE_SERVICE_ROLE_KEY` sono obbligatorie:
le funzioni serverless falliscono all'avvio se mancano (`api/_lib/env.ts`).

### 3. Migrazioni del database

Le migrazioni SQL stanno in `supabase/migrations/` e vanno applicate **tutte, in ordine
numerico crescente** (`0001_...`, `0002_...`, e cosi' via). Il contenuto della cartella
e' la fonte di verita': schema multi-tenant, policy RLS, tabelle `app_state` /
`user_state`.

Con la Supabase CLI:

```bash
supabase link --project-ref <project-ref>
supabase db push
```

In alternativa, incolla il contenuto di ciascun file nell'SQL editor del progetto
Supabase, rispettando l'ordine numerico. Saltare o invertire una migrazione lascia
le policy RLS in uno stato incoerente.

---

## Comandi npm

| Comando            | Cosa fa                                            |
| ------------------ | -------------------------------------------------- |
| `npm run dev`      | Server di sviluppo Vite                            |
| `npm run build`    | Type-check + build di produzione in `dist/`        |
| `npm run preview`  | Anteprima locale della build                       |
| `npm run lint`     | ESLint                                             |
| `npm run optimize` | Pre-bundling delle dipendenze Vite                 |

Non esiste alcuno script di test: nel repository non c'e' nessun test automatico.

Nota: in sviluppo locale `npm run dev` serve solo il frontend. Le rotte `api/`
richiedono un runtime Vercel (`vercel dev`) o un deploy su Vercel; senza di esso
email e AI non rispondono.

---

## Account utente

**Gli account sono creati esclusivamente dall'amministratore.** Non esiste una
registrazione pubblica: chi non e' stato censito da un amministratore non puo'
entrare. L'amministratore crea gli utenti dall'interfaccia di gestione utenti;
l'appartenenza all'organizzazione determina, tramite RLS, cosa ciascuno vede.

---

## Documentazione presente in questo repository

- [STATO.md](STATO.md) - cosa e' verificato e cosa no (leggilo per primo)
- [PRD.md](PRD.md) - requisiti di prodotto
- [DEPARTMENT_ARCHITECTURE.md](DEPARTMENT_ARCHITECTURE.md) - architettura dei dipartimenti
- [DEPARTMENT_TEST_PLAN.md](DEPARTMENT_TEST_PLAN.md) - piano di test **manuale**, mai eseguito integralmente
- [SECURITY_TESTING.md](SECURITY_TESTING.md) - procedura di test **manuale** anti-XSS
- [XSS_PROTECTION.md](XSS_PROTECTION.md) - sanitizzazione degli input (`src/lib/sanitization.ts`)
- [EMAIL_ATTACHMENTS.md](EMAIL_ATTACHMENTS.md) - allegati nelle email di notifica
- [LAUNCH_FEEDBACK_GUIDE.md](LAUNCH_FEEDBACK_GUIDE.md) - funzionalita' di raccolta feedback

Molti altri documenti presenti in precedenza sono stati rimossi perche' dichiaravano
test eseguiti, audit di sicurezza superati e prontezza al lancio che non
corrispondevano alla realta'.
