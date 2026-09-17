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

Poi **riprovate con un token vero**, contro la produzione. Per non toccare le
credenziali di collaudo esistenti è stato creato un account `member` usa e
getta nell'organizzazione QA, usato per accedere davvero e cancellato al
termine — con lui le tre attività create e la copia di sicurezza dell'elenco
dipendenti. Il database è stato ricontrollato dopo: nessuna traccia.

| Prova, token vero di un `member` | `POST /api/tasks` | PostgREST diretto |
| --- | --- | --- |
| Attività assegnata a una collega | **403**, "solo manager, admin o owner" | **403** (42501) |
| Firma con l'id dell'amministratore | scritta **a nome di chi chiama** | **403** (42501) |
| Assegnatario di un'altra organizzazione | **403**, "non appartiene" | **403** (42501) |
| Creazione senza firmarsi | — (la firma la mette la rotta) | **403** (42501) |
| Attività per se stesso (controllo positivo) | **201** | **201** |

La firma falsa merita una nota: la rotta non rifiuta la richiesta, **ignora**
il campo e mette l'id di chi chiama. È lo stesso esito — nessuno può attribuire
ad altri un'attività — per la via che al database non arriva nemmeno.

Sui permessi personalizzati, con lo stesso token:

- scrivere `customPermissions` dentro `app_state['employees']` **riesce
  ancora** (204), ed è voluto: quella chiave è lavoro quotidiano e serve a
  tutti;
- scrivere `profiles.custom_permissions`, la colonna che ora conta, è
  **rifiutato** dal trigger della 0018: *"I permessi non sono modificabili dal
  proprio profilo"*.

**Cosa non è stato verificato a schermo, e perché.** La prova finale — entrare
con quel dipendente e vedere che la riga avvelenata non cambia più nulla — non
è stata fatta: in questo ambiente remoto il browser non attraversa il proxy di
rete verso nessun host. Al suo posto, la decisione che quella schermata prende
è stata **tolta da `src/App.tsx` e messa in `src/lib/dipendenteCorrente.ts`**,
dove ha i suoi test, costruiti sulla riga avvelenata scritta davvero in
produzione. Restava sepolta in un `useMemo` dentro un componente da tremila
righe, ed era proprio la riga in cui stava la falla.

Nemmeno la rotta dei membri è stata provata da qui: le chiamate che concedono
permessi vengono bloccate dal controllo di sicurezza della sessione. Il
validatore è coperto dai test.

Il ripristino di un backup rifiuta una riga nuova assegnata a chi ha lasciato
l'organizzazione: è voluto, ma va saputo.

**Due difetti trovati verificando**, entrambi nello stesso meccanismo:

- Il tipo `customPermissions` diceva `Partial<Permission>`: categorie
  facoltative, ma ognuna **intera**. Il prodotto invece concede un permesso
  alla volta, e `getEmployeePermissions` fonde per voce. Ogni chiamante
  aggirava il tipo con un cast. Ora c'è `DeroghePermessi`, che dice la verità.
- L'anteprima del pannello ruoli faceva `{...ruolo, ...deroghe}`: con una
  categoria parziale **sostituiva** la categoria invece di fonderla, quindi
  toccando un permesso tutti gli altri della stessa scheda comparivano spenti,
  mentre a runtime restavano quelli del ruolo. Il pannello dei permessi diceva
  il falso proprio dove si decide chi può fare cosa. Ora usa `fondiPermessi`,
  la stessa fusione del runtime.

Cosa è cambiato:

- **Permessi personalizzati letti lato server.** Il pannello dei ruoli li manda
  a `POST /api/tenants/<id>/members` (campo `customPermissions`, `null` per
  toglierli), che li valida contro un catalogo
  (`api/_lib/permessiPersonalizzati.ts`, allineato a `Permission` da un test) e
  li scrive in `profiles.custom_permissions`, la colonna che la 0018 rende
  non modificabile dal proprio profilo. `useSyncEmployees` li rilegge da lì a
  ogni avvio **sovrascrivendo** la copia in app_state, e `dipendenteCorrente`
  prende quelli di chi guarda dal profilo caricato all'accesso, non dall'array
  `employees`. La copia in app_state resta scrivibile, ma nessuno la ascolta
  più.
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

## Aggiornare lo stato da riga di comando (17 settembre 2026)

`node scripts/taskflow.mjs` serve a dire "questa l'ho fatta, ecco cosa ho
fatto" senza aprire il browser.

```
node scripts/taskflow.mjs accedi                                (una volta sola)
node scripts/taskflow.mjs elenco
node scripts/taskflow.mjs stato <id> completata "cosa ho fatto"
node scripts/taskflow.mjs nota  <id> "testo"
node scripts/taskflow.mjs esci
```

L'`<id>` sono le prime lettere che mostra `elenco`: bastano finché individuano
una sola attività, altrimenti il comando si ferma invece di indovinare.

**L'accesso si fa una volta.** `accedi` chiede email e password (la password
non compare sullo schermo) e da lì in poi nessun comando chiede più niente.

Cosa resta su disco, ed è la distinzione che conta: il token di **rinnovo**, in
`~/.config/taskflow/sessione.json`, cartella `700` e file `600` — fuori dal
repository, così non può finire in un commit nemmeno per distrazione, e così i
comandi funzionano da qualunque cartella. Il token di **accesso**, che dura
un'ora, viene chiesto al momento e non viene scritto da nessuna parte. Supabase
ruota il token di rinnovo a ogni uso, quindi il file viene riscritto a ogni
comando; `esci` lo revoca sul server e cancella il file (e cancella il file
anche se la revoca fallisce — meglio non lasciarne una copia in giro).

Per le esecuzioni automatiche, dove non c'è nessuno a rispondere a una domanda,
restano `TASKFLOW_EMAIL` e `TASKFLOW_PASSWORD` nell'ambiente o in `.env.local`;
con più organizzazioni si sceglie con `TASKFLOW_ORG`. Ora sono documentate in
`.env.example`.

**Non passa da una rotta in `api/`, ed è la decisione che conta.** Le rotte
serverless girano con il service role: scavalcano le policy e per loro
`auth.uid()` è nullo, quindi ogni regola andrebbe riscritta lì dentro e una
dimenticanza sarebbe un buco. Il comando accede invece come l'utente e parla a
PostgREST con il **suo** token: valgono le stesse policy e gli stessi trigger
dell'interfaccia. Chi non può fare una cosa dal browser non la può fare
nemmeno da qui, e non perché lo controlli lo script.

### Migrazione 0025: due regole del cambio di stato scendono nel database

Perché il punto sopra regga, due regole che vivevano solo nel client sono
diventate un trigger (`0025_stato_regole_lato_server.sql`):

1. non si porta a "completata" un'attività che ne aspetta altre;
2. il cambio di stato azzera il visto precedente, altrimenti un lavoro
   approvato, riaperto e richiuso resta approvato dalla volta prima.

Erano in `handleStatusChange` dentro `src/App.tsx`, cioè in codice che gira sul
computer di chi le deve rispettare: bastava una PATCH a PostgREST per saltarle
entrambe. Stessa forma delle falle chiuse dalla 0023 e dalla 0024.

Non sono autorizzazioni ma invarianti sui dati, quindi valgono **anche per il
service role**, a differenza dei trigger della 0018 e della 0023. Verificato
che nessun lavoro pianificato scrive `status` (i cron toccano solo
`archived_at`). Conseguenza da sapere, come per la 0024: il ripristino di un
backup che rimettesse un'attività completata mentre ciò che la blocca risulta
ancora aperto viene rifiutato.

### Cosa il comando fa e cosa non fa

Scrive la riga di cronologia e le notifiche, così un'attività chiusa da qui è
indistinguibile da una chiusa dal browser. **Un'approssimazione da conoscere:**
per avvisare chi deve approvare usa i ruoli (`owner`, `admin`, `manager`),
mentre l'interfaccia usa `puoApprovare`, che tiene conto anche di una deroga
personale su `tasks.edit_any`. Un membro con quella deroga non riceve la
notifica dal comando. Si sbaglia per difetto, mai per eccesso.

Aggiungere un commento è una lettura-modifica-scrittura sulla colonna
`comments`: due note scritte nello stesso istante da persone diverse possono
sovrapporsi. È lo stesso limite dell'interfaccia.

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
Pro. (`CRON_SECRET` e `APP_URL` sono ora documentate in `.env.example`,
insieme a `SENDGRID_API_KEY`, ai tetti AI e alle `TASKFLOW_*`.)

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
