# STATO REALE DEL PROGETTO

Documento unico e onesto sullo stato di TaskFlow dopo la migrazione da GitHub Spark
a Supabase + Vercel.

Serve a sostituire i vecchi documenti (audit di sicurezza "superati", report di
"launch readiness", risultati di test "19/19 passati") che dichiaravano verifiche
mai eseguite. Quei file sono stati cancellati.

**Regola di questo documento: qui si scrive solo cio' che e' stato realmente
osservato. Tutto il resto sta nella sezione "Non verificato".**

---

## 1. Test automatici: ora esistono, ma coprono poco

Questa sezione diceva "non esistono test automatici". Non e' piu' vero, e la
correzione va scritta con la stessa precisione con cui era scritta la
denuncia.

- `npm run test` esegue una suite Vitest: **539 test in 34 file**
  (verificato il 17 settembre 2026, `npx vitest run`).

  L'elenco delle aree coperte, perche' il numero da solo non dice niente:
  permessi per ruolo e deroghe, sanificazione dei contenuti che finiscono nel
  DOM, unicita' degli identificatori, resistenza delle impostazioni a dati
  malformati, traduzioni, ricorrenze, riepilogo email, manutenzione ed
  escalation, sottoattivita', dipendenze fra attivita', etichette, menzioni
  `@`, esportazione CSV/PDF, approvazione, filtri salvati, promemoria,
  creazione di un task lato server, disiscrizione, scrittura di un task
  (quali colonne entrano nell'UPDATE), lettura a blocchi dei lavori
  pianificati, e un componente React vero (`src/components/ui/calendar.test.ts`
  monta il calendario).

  Questa riga ha detto **34** fino al 17 settembre, mentre i test erano gia'
  qualche centinaio. Era una bugia al ribasso, il che la rende meno grave di
  quelle per cui i vecchi documenti sono stati cancellati, ma l'effetto
  pratico e' lo stesso: chi legge non si fida di cio' che ha in mano, e rifa'
  lavoro gia' fatto.
- Non sono test decorativi: reintroducendo i difetti che coprono (ad esempio
  `Date.now()` al posto di `newId`, o la rimozione della fusione con le
  impostazioni predefinite) la suite fallisce. E' stato verificato
  esplicitamente.
- `node scripts/smoke-auth.mjs` e' un controllo di integrazione contro il
  progetto Supabase reale: registrazione pubblica chiusa, creazione account da
  amministratore funzionante, account esistenti che risolvono la propria
  organizzazione.

**Cosa NON e' coperto**: nessun test end-to-end, nessun test dei componenti
React, nessun test delle policy RLS eseguito in automatico. Le verifiche sulle
policy di questa sessione sono state fatte a mano contro il database reale e
NON vengono rieseguite da sole: possono regredire senza che nessuno se ne
accorga.

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
| Funzioni AI (`api/ai/complete.ts` e tutti i componenti che la usano: assistente, auto-assegnazione, stime, insight) | **Provate in produzione** con una chiave valida (vedi il commento in `api/ai/complete.ts:120`). Senza chiave l'interfaccia non le mostra piu' affatto (`useAIAvailability`), quindi non falliscono piu' davanti a nessuno. Esistono tetti di spesa: 30 chiamate/ora per utente, 200/ora per organizzazione. |
| Test automatici | **539 in 34 file** (vedi sezione 1). Questa riga ha detto "Inesistenti" fino al 17 settembre, contraddicendo la sezione 1 dello stesso documento a 45 righe di distanza. |
| Test di carico, performance, stress | Mai eseguiti. |
| Audit di sicurezza indipendente | Mai eseguito. Nessun risultato dei vecchi "security report" e' da considerarsi valido. |
| Protezione XSS / sanitizzazione input | **Testata**: `src/lib/sanitization.test.ts`, 19 test contro payload XSS reali su titoli, descrizioni, commenti, nomi, email, url, nomi file. Eccezione nota: `DepartmentManagement.tsx` non usa il `Sanitizer` (i nomi sono resi come testo da React, quindi non c'e' XSS, ma la rimozione che `SECURITY_TESTING.md` si aspetta non avviene). |
| Allegati nelle email | **Non esistono piu'.** `src/lib/emailAttachments.ts` e' stato rimosso; `api/email/send.ts` e `api/_lib/invio.ts` non contengono la parola `attachment`. Gli allegati non entrano mai in un'email. La funzionalita' e' stata tolta senza che nessun documento lo dicesse, ed e' ancora elencata fra le *Essential Features* del PRD. |
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
  `tenants/[tenantId]/members`, `tenants/[tenantId]/restore`, `email/send`,
  `email/disiscrivi`, `ai/complete`, e i cinque lavori pianificati
  `cron/{promemoria,pulizia,digest,manutenzione,ricorrenze}`. Fino al 17
  settembre questo elenco ne dichiarava sette su quattordici.
- **Residui del template Spark: quelli elencati qui fino al 17 settembre non
  esistono piu'.** `@github/spark` non e' in `package.json`, `spark.meta.json` e
  `runtime.config.json` non esistono, e le occorrenze di `window.spark` in
  `src/` sono tutte dentro commenti storici che spiegano cosa e' stato tolto.
  Ne restano due veri, e sono i soli due che l'utente puo' vedere:
  `api/health.ts:6` risponde `service: 'spark-template-backend'`, e
  `src/ErrorFallback.tsx:18` mostra «This spark has encountered a runtime
  error» quando qualcosa si rompe — tradotto in cinque lingue, quindi la parola
  "spark" arriva sullo schermo di chi usa il prodotto.

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
