# Da dove riprendere

Documento per riaprire il lavoro in una sessione nuova, senza rileggere tutto.
Aggiornato al 14 settembre 2026, dopo la chiusura delle due falle di permessi.

## Cos'è TaskFlow

Gestionale di attività per assegnare lavoro ai dipendenti. **Generico**, non
legato a un settore: i dati di prova parlano di sicurezza sul lavoro perché
l'organizzazione di collaudo è quella, ma il prodotto non lo è.

React 19 + Vite + TypeScript + Supabase (multi-organizzazione con RLS) +
funzioni serverless su Vercel. Cinque lingue, dove **la chiave di traduzione è
il testo inglese**.

- Sviluppo: `github.com/tutor-sicurezza/employee-task-m-last` (privato)
- Pubblico: `github.com/tutor-sicurezza/taskflow`, allineato con
  `node scripts/sync-public.mjs --commit --push`
- Produzione: `employee-task-m-last.vercel.app`, pubblica da `main`
- Database: progetto Supabase `ibjlfamnoewpixfnowvd` ("task manager")

## Come si lavora qui

**Le migrazioni si applicano così**, perché la cronologia locale e quella remota
non coincidono e `supabase db push` rifiuta:

```
supabase db query --linked -f supabase/migrations/00NN_nome.sql
```

Solo SELECT per le verifiche: `supabase db query --linked "select ..."`.

**Verifica prima di pubblicare.** Type-check e test verdi non bastano: metà dei
difetti seri di questa giornata sono stati trovati guardando lo schermo con un
account reale, o provando l'attacco con curl. Le credenziali di collaudo sono in
`.env.local` (`QA_ADMIN_*`, `QA_MARIO_*`, `QA_LUCIA_*`, `QA_USER_*`).

**Il service worker serve il pacchetto precedente.** Dopo un `npm run build`, la
pagina va ricaricata due volte, o si azzera con
`navigator.serviceWorker.getRegistrations()` + `caches.delete`. Non è un guasto:
è la PWA che fa il suo mestiere.

**Traduzioni.** Non si modificano i dizionari a mano. Le chiavi nuove vanno in un
file JSON `{"English key": ["it", "fr", "de", "es"]}` e si uniscono con lo
script `unisci_chiavi.py` (nella scratchpad di sessione, va ricreato: legge i
`chiavi-*.json`, salta ciò che esiste già e rifiuta le chiavi non usate nel
codice). Controlli utili: `allineamento.py` (le quattro lingue devono avere lo
stesso numero di chiavi) e `doppioni.py`.

**Gli agenti in parallelo funzionano** se ognuno ha file suoi e nessuno tocca
`src/App.tsx`, che va tenuto per sé: è il punto di collisione.

## Stato: fatto e verificato in produzione

Attività con etichette, osservatori, stima e tempo impiegato, scadenza
facoltativa, stato "bloccata", ricorrenze, archiviazione, calendario, carico di
lavoro, esportazione CSV/PDF, filtri salvati (per-utente), riepilogo email
giornaliero, escalation, **approvazione**, **sottoattività**, **dipendenze**,
PWA installabile su computer.

Cinque lavori pianificati su Vercel: promemoria, pulizia, digest (orario),
manutenzione, ricorrenze.

## Le due falle di permessi: chiuse, applicate, verificate (14 settembre 2026)

Le due voci che stavano in cima all'elenco qui sotto sono chiuse nel codice
(PR #6, unita in `main` e pubblicata). La **migrazione 0024 è applicata** al
database di produzione, con il contenuto identico al file, senza registrarla
nella cronologia delle migrazioni (come `db query -f`).

Verificato sul database reale, con lo stesso metodo delle sessioni precedenti
ma dentro un blocco che annulla l'inserimento alla fine (nessuna riga scritta):
`set local role authenticated` più `request.jwt.claims` con l'id
dell'account, cioè esattamente ciò che PostgREST fa con un token.

| Prova, con l'account `qa.user` (member) | Prima della 0024 | Dopo |
| --- | --- | --- |
| Task assegnato alla collega Lucia | passava | **rifiutato** (42501) |
| `created_by` con l'id dell'amministratore | passava | **rifiutato** |
| `assignee_id` di un utente di un'altra organizzazione | passava | **rifiutato** |
| Task per se stesso, firmato da sé (controllo positivo) | passava | passa |
| Mario (manager) assegna a Lucia e registra a nome di qa.user | — | passa |
| Mario assegna a un utente di un'altra organizzazione | — | **rifiutato** |

In produzione la rotta nuova è viva: `POST /api/tasks` senza token risponde
401, la `GET` tolta risponde 405, e il pacchetto servito da `main` contiene la
creazione via rotta e la lettura di `custom_permissions`.

**Non verificato, e va fatto con le credenziali di collaudo** (che stanno in
`.env.local`, non in un ambiente remoto): le stesse tre varianti via
`POST /api/tasks` con il token di un dipendente, e la scrittura di
`customPermissions` in `app_state['employees']`, che deve restare possibile
ma **non deve più avere effetto** dopo un ricaricamento. Il ripristino di un
backup rifiuta una riga nuova assegnata a chi ha lasciato l'organizzazione: è
voluto, ma va saputo.

Cosa è cambiato:

- **Permessi personalizzati letti lato server.** Il pannello dei ruoli li manda
  a `POST /api/tenants/<id>/members` (campo `customPermissions`, `null` per
  toglierli), che li valida contro un catalogo
  (`api/_lib/permessiPersonalizzati.ts`, allineato a `Permission` da un test) e
  li scrive in `profiles.custom_permissions`, la colonna che la 0018 rende
  non modificabile dal proprio profilo. `useSyncEmployees` li rilegge da lì a
  ogni avvio **sovrascrivendo** la copia in app_state, e `currentEmployee` in
  App.tsx prende quelli di chi guarda dal profilo caricato all'accesso, non
  dall'array `employees`. La copia in app_state resta scrivibile, ma nessuno
  la ascolta più.
- **La creazione passa da `api/tasks`.** `useTasks.applica` chiama
  `creaTaskSulServer` (`src/lib/creazioneTask.ts`) invece di `insert`. La rotta
  (`api/_lib/nuovoTask.ts`, con test) rifiuta ciò che un task non può essere
  alla nascita — approvato, archiviato, completato, occorrenza di una serie —
  pretende che commenti, cronologia e allegati siano firmati da chi crea, e
  verifica sul database assegnatario, osservatori e dipendenze. La `GET` di
  quella rotta, mai chiamata, è stata tolta. Modifiche e cancellazioni restano
  scritture dirette sotto le policy.
- **Conseguenza in sviluppo locale:** con `npm run dev` le rotte `api/` non
  rispondono, quindi la creazione di attività fallisce (come già la gestione
  dei membri). Serve `vercel dev`.

## Aperto, in ordine di gravità

### 1. `api/notifications/index.ts` è pubblicata e mai usata
Nessuna schermata la chiama. Accetta scritture che scavalcano le regole del
client. Va tolta o messa in uso — non lasciata lì. (`api/tasks` è ora in uso,
vedi sopra.)

### 2. Cron: tetti di lettura e recuperi mancanti
- I promemoria leggono 2000 attività ordinate per scadenza: superata quella
  soglia di scaduti, le nuove scadenze non escono più. Il tetto va messo sui
  candidati esaminati, non sulle email uscite.
- Il riepilogo legge 5000 notifiche **globali**, non per persona: una persona
  molto attiva può far restare tutti gli altri senza riepilogo.
- Il riepilogo non ha recupero: l'ora persa è persa.
- `componiPerDestinatario` fa cinque letture per ogni destinatario, senza cache
  per organizzazione.
- Le preferenze per tipo non valgono dentro il riepilogo.

### 3. Le ore di silenzio non toccano le email
`quietHours` esiste solo nel client, per suono e notifica desktop. Di notte le
email partono lo stesso. E sono valutate sull'ora locale del browser, mentre il
riepilogo usa il fuso salvato: due nozioni di orario nella stessa schermata.

### 4. Prestazioni
- `TaskCard` riceve `tuttiITask`, la cui identità cambia a ogni modifica:
  il memo salta per tutte le schede. Risolvibile passando i bloccanti già
  risolti. Sotto le ~200 attività non si nota.
- `useTasks.applica` scrive una riga alla volta in serie: "seleziona tutto" su
  cento attività sono cento andate e ritorno.
- `useKV` rilegge due volte al rientro sulla scheda (`focus` +
  `visibilitychange`), e `useTasks` rilegge l'intera tabella a ogni alt-tab.
- ~153 kB di componenti da amministratore potrebbero essere caricati a
  richiesta.

### 5. Icone
`@phosphor-icons/react` pesa **360 kB misurati** per 119 icone, perché ognuna
porta sei tratti. Passare a lucide (già presente) ne recupera ~340, ma ridisegna
119 icone in 49 file: **è una scelta estetica, decide il proprietario.**

### 6. Quattro collegamenti rapidi tolti dal cruscotto
Erano cablati a `() => {}`. Per ricollegarli servono dialoghi controllati
(UsersManagement, DepartmentManagement, AnnouncementsDialog, AIAutoAssign).

### 7. Notifiche quando l'applicazione è chiusa
Suoni e notifiche desktop **ci sono già** e funzionano mentre l'applicazione è
aperta (anche installata). Per avvisare a finestra chiusa serve Web Push:
chiavi VAPID, tabella delle sottoscrizioni, invio dal server e gestore `push`
nel service worker. Il service worker ormai c'è, quindi è la strada naturale —
ma le chiavi VAPID le deve generare e configurare il proprietario.

### 8. Da fare a mano nella dashboard Vercel
Controllare i **Cron Jobs**: sono cinque e uno è orario, che richiede il piano
Pro. Aggiungere `CRON_SECRET` e `APP_URL` a `.env.example` (in produzione ci
sono già, manca solo la riga di documentazione).

## Cose che sembrano difetti e non lo sono

- **`api/_lib/manutenzioneTask.ts` duplica `eChiusoDavvero`**: `api/` ha un suo
  tsconfig e non condivide i percorsi con `src/`. Il duplicato è segnalato nei
  commenti di entrambi i lati.
- **`prossimaOccorrenza` fa un passo solo** se non riceve `adesso`: il salto
  delle occorrenze passate è una decisione del lavoro pianificato, non del
  calendario. I test con date fisse dipendono da questo.
- **Il tetto di 50 passi vale solo in scrittura**: troncare in lettura
  perderebbe per sempre i passi di un'importazione più lunga.
- **Il timestamp nel nome dei file esportati resta in forma ISO**: un nome
  ordinato alfabeticamente deve restare ordinato nel tempo.
