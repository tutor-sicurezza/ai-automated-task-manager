# STATO REALE DEL PROGETTO

Documento unico e onesto sullo stato di TaskFlow dopo la migrazione da GitHub Spark
a Supabase + Vercel.

Serve a sostituire i vecchi documenti (audit di sicurezza "superati", report di
"launch readiness", risultati di test "19/19 passati") che dichiaravano verifiche
mai eseguite. Quei file sono stati cancellati.

**Regola di questo documento: qui si scrive solo cio' che e' stato realmente
osservato. Tutto il resto sta nella sezione "Non verificato".**

---

## 1. Non esistono test automatici

Questo e' il punto su cui i vecchi documenti mentivano di piu'.

- Nel repository **non c'e' nessuna suite di test automatici**: nessun test unitario,
  nessun test di integrazione, nessun test end-to-end.
- In `package.json` **non esiste uno script `test`** e non e' installato alcun
  framework di test (niente Vitest, Jest, Playwright, Cypress).
- I documenti che parlavano di "19/19 test passati", "5/5 test di sicurezza superati",
  "100% pass rate" o "audit superato" descrivevano, nel migliore dei casi, una lettura
  del codice fatta da un agente. **Nessun test e' mai stato eseguito da una macchina.**
- Di conseguenza: **non esiste una rete di sicurezza contro le regressioni.** Ogni
  modifica va verificata a mano.

Se in futuro qualcuno aggiunge dei test, aggiornare questa sezione con i comandi
reali per eseguirli.

---

## 2. Verificato funzionante (test manuali reali)

Le voci qui sotto sono state provate a mano sull'applicazione reale, contro un
progetto Supabase reale.

| Funzionalita' | Esito |
| --- | --- |
| Login e logout con Supabase Auth | Funziona |
| Creazione utenti riservata all'amministratore (nessuna registrazione pubblica) | Funziona |
| Assegnazione di un task a un utente | Funziona |
| Completamento di un task, con persistenza dopo refresh/riavvio | Funziona |
| Notifiche in-app | Funzionano |
| Invio email tramite Resend | Funziona, **consegna confermata** (email ricevuta) |
| Isolamento multi-tenant tramite RLS: un'organizzazione non vede i dati di un'altra | Funziona |

Attenzione: "verificato a mano una volta" non equivale a "coperto da test". Queste
verifiche non vengono rieseguite automaticamente e possono regredire senza che
nessuno se ne accorga.

---

## 3. Non verificato / non funzionante

| Area | Stato |
| --- | --- |
| Funzioni AI (`api/ai/complete.ts` e tutti i componenti che la usano: assistente, auto-assegnazione, stime, insight) | **Non funzionanti.** `ANTHROPIC_API_KEY` non e' configurata, l'endpoint risponde **503**. Mai provate con una chiave valida. |
| Test automatici | **Inesistenti** (vedi sezione 1). |
| Test di carico, performance, stress | Mai eseguiti. |
| Audit di sicurezza indipendente | Mai eseguito. Nessun risultato dei vecchi "security report" e' da considerarsi valido. |
| Protezione XSS / sanitizzazione input | Il codice esiste (`src/lib/sanitization.ts`, `src/hooks/use-sanitized-input.ts`) ma **non e' stato testato**. Vedi `SECURITY_TESTING.md` per la procedura manuale, mai eseguita integralmente. |
| Allegati nelle email | Non verificato. Il percorso in `src/lib/emailAttachments.ts` invia ancora direttamente dal client anziche' passare da `api/email/send.ts`: va rivisto. |
| Invio email tramite SendGrid | Codice presente in `api/email/send.ts`, **mai provato**. Solo Resend e' stato verificato. |
| Piano di test dei dipartimenti (`DEPARTMENT_TEST_PLAN.md`) | Piano manuale, **mai eseguito integralmente**. Le spunte nel documento sono risultati attesi, non risultati ottenuti. |
| Notifiche desktop del browser | Non verificate. |
| Backup, export/import dei dati | Non verificati dopo la migrazione a Supabase. |
| Comportamento delle rotte `api/` in sviluppo locale | `npm run dev` serve solo il frontend; senza runtime Vercel (`vercel dev`) le rotte `api/` non rispondono. |

---

## 4. Cosa sappiamo con certezza sull'architettura

Verificato leggendo il codice sorgente attuale:

- Frontend React 19 + Vite (`package.json`, `vite.config.ts`).
- Autenticazione reale via Supabase (`src/lib/supabase.ts`, `src/contexts/`).
- Lo stato applicativo passa dall'hook custom `src/hooks/useKV.ts`, che scrive sulle
  tabelle `app_state` (dati di organizzazione) e `user_state` (dati per-utente).
  Non c'e' piu' alcun KV store del runtime Spark.
- Migrazioni SQL numerate in `supabase/migrations/`, che definiscono lo schema
  multi-tenant e le policy RLS. Vanno applicate tutte, in ordine crescente.
- Funzioni serverless in `api/`: `health`, `tasks`, `notifications`, `tenants`,
  `tenants/[tenantId]/members`, `email/send`, `ai/complete`.
- Residui del template Spark ancora presenti nel repository: la dipendenza
  `@github/spark` in `package.json`, `spark.meta.json`, `runtime.config.json` e alcuni
  riferimenti a `window.spark` in `src/`. Sono da ripulire; finche' ci sono, il repo
  contiene codice morto o percorsi non piu' validi.

---

## 5. Prima di mettere in produzione

Non c'e' nessun documento in questo repository che autorizzi un lancio. Come minimo
servirebbero:

1. Configurazione di `ANTHROPIC_API_KEY` (oppure rimozione/disabilitazione esplicita
   delle funzioni AI dall'interfaccia, cosi' che non falliscano davanti all'utente).
2. Una suite di test automatici, almeno sui percorsi critici: autenticazione, RLS
   multi-tenant, creazione e completamento task.
3. Verifica manuale documentata delle policy RLS con almeno due organizzazioni.
4. Rimozione dei residui del template Spark.
5. Revisione del percorso di invio degli allegati email.

_Aggiornare questo file ogni volta che qualcosa viene realmente verificato, indicando
cosa e' stato provato e come. Non aggiungere mai voci nella sezione "Verificato"
senza averle eseguite._
