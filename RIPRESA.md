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

## Tre audit sul lavoro del 17 settembre — e due falle introdotte quel giorno

I quattro audit del mattino erano su `783af90`, cioè **prima** di tutto il
lavoro di quella giornata. Le ~3200 righe scritte dopo le aveva riviste solo
chi le aveva scritte. Riviste da tre agenti, hanno trovato questo.

### Due falle fra organizzazioni, introdotte lo stesso giorno

Entrambe avevano in cima al file **un commento che dichiarava la difesa che il
codice non faceva.** È la parte peggiore: chi le avesse rilette si sarebbe
fermato al commento.

**`restore.ts` spostava i task altrui nella propria organizzazione.**
`upsert(… onConflict: 'id')` non guarda a chi appartiene la riga che aggiorna, e
`organization_id` era forzato al tenant di chi chiama — la riga messa apposta
per impedire il contrario. Bastava conoscere un uuid. Riprodotto sul database:

```
organizzazione dopo: 99999999-…  (QA)
era di TaskFlow?     f
i commenti sono sopravvissuti?  [{"id": "c1", "content": "commento riservato"}]
```

`task_campi_immutabili` non aiutava: esce quando `auth.uid()` è nullo, cioè
esattamente nel caso del service role. Ora si leggono gli id esistenti e si
rifiuta **l'intero blocco** (409) se anche uno appartiene altrove — verificato
via HTTP sull'anteprima.

**`members.ts` scriveva il profilo globale di un dipendente altrui.** Spostare
la scrittura dopo l'upsert dell'appartenenza non bastava: **l'upsert non
verifica l'appartenenza, la crea.** Ora i dati di profilo non si toccano se la
persona appartiene anche altrove — la stessa regola della reimpostazione
password, per la stessa ragione.

### 0030: le colonne di sistema erano immutabili solo in creazione

La 0026 chiudeva `recurrence_parent` e `archived_at` in INSERT e le lasciava
aperte in UPDATE. Nessuna policy e nessun trigger le guardava, e il client le
manda. Il danno è quello che la 0026 dichiarava di impedire: un membro crea un
task suo, legge l'id della capostipite di una serie — è visibile a tutti — e
con una PATCH si dichiara sua figlia. Al giro dopo il cron trova una «figlia
aperta» e **smette di rigenerare quel controllo periodico**, rispondendo 200.

Verificato dopo la correzione:

```
1) membro si dichiara figlio della serie .. RIFIUTATO
2) membro archivia a mano ................ RIFIUTATO
3) membro rinomina e cambia stato ........ 1 riga (deve 1)
```

Chiude anche un oracolo minore: la chiave esterna di `recurrence_parent` non è
limitata per organizzazione, quindi scriverci un uuid distingueva «esiste da
qualche parte» da «non esiste».

Più due cose minori: `is_org_owner` non era stata revocata da `public`/`anon`
come le sorelle (non era una scalata — per un anonimo risponde sempre falso —
ma era una deviazione silenziosa da una regola che il progetto si era dato), e
il `restore` non verificava che gli assegnatari del backup fossero membri, il
che permetteva di far arrivare i promemoria a un estraneo.

### Cosa gli attacchi NON hanno scalfito

Auto-promozione ad `owner` via DELETE+INSERT (il delete toglie subito
`is_org_admin`, e l'insert di un `owner` richiede `is_org_owner`) · degradare o
cancellare il proprietario · ricorsione o menzogna di `is_org_owner` ·
assegnatario cambiato in due scritture `X→NULL→Y` (ogni statement è rivalutato
contro lo stato presente) · l'oracolo sui titoli della 0026 · la lettura
per-organizzazione delle deroghe della 0028.

### Un rilievo che si è rivelato nullo
L'agente segnalava che il travaso della 0028 avrebbe replicato le deroghe
globali in ogni organizzazione. **Verificato: zero righe** — nessuno aveva
deroghe, né su `profiles` né su `organization_members`, quindi quell'UPDATE non
ha copiato niente. Resta vero come difetto del *codice* della migrazione, per
un'installazione che invece ne avesse.

### L'accessibilità: mai guardata prima
Un rilievo **bloccante** (il pulsante «Importa backup» non è raggiungibile da
tastiera: `Button asChild` produce uno `<span>`, e l'input è `display:none`) e
tre trasversali: l'anello di fuoco a 2,31:1 quando ne servono 3, le targhette di
priorità a 2,15:1 con testo `"HIGH"`/`"MEDIUM"`/`"LOW"` in inglese, e il
calendario in inglese perché nessuno passa `locale` a `DayPicker` — con
`initialFocus` che nella versione 9 esiste nei tipi ma non nel runtime. **Non
ancora affrontati.**

## Gli advisor di prestazioni, mai letti prima (17 settembre 2026)

Gli advisor di **sicurezza** li avevamo guardati. Quelli di **prestazioni** no,
mai. Dentro c'erano due cose vere.

### Sette chiavi esterne senza indice — chiuso con la 0029

Le due che contano davvero:

- **`organization_members.user_id`** è il percorso di **accesso**:
  `AuthContext` legge le appartenenze a ogni avvio, e da oggi lo fa anche la
  guardia sulla reimpostazione password. Erano scansioni complete.
- **`tasks.created_by`** sta dentro la `using` della policy di UPDATE, quindi
  viene valutata **per ogni riga toccata** — un'operazione in blocco su
  cinquanta attività la valuta cinquanta volte.

Le altre cinque contano per la cancellazione di una persona: senza indice,
Postgres deve scandire ogni tabella che la referenzia.

### `auth_rls_initplan` su 14 policy — NON applicato, di proposito

`auth.uid()` viene rivalutata riga per riga invece di `(select auth.uid())`. Il
rilievo è giusto e a regime conta.

Non l'ho fatto perché significherebbe **riscrivere le policy di sicurezza
appena chiuse** (0024, 0026, 0027) per un guadagno che si vede da qualche
migliaio di righe in su — e riscrivere una policy è esattamente il gesto con
cui si reintroduce un buco. Va fatto come cambiamento a sé, con le sonde di
verifica della 0026 e della 0027 **rieseguite dopo**.

### Cosa NON è un problema, per non riaprirlo ogni volta

- **`unused_index` su quattro indici** (`tasks_blocked_by_idx`,
  `tasks_promemoria_due_date_idx`, `notifications_lette_created_at_idx`,
  `email_delivery_logs_created_at_idx`): non sono inutili, sono **nuovi**.
  Servono a lavori pianificati che hanno girato poco. Toglierli sarebbe un
  errore.
- **`multiple_permissive_policies`**: le coppie segnalate sono volute —
  bootstrap del proprietario più admin su `organization_members`, profilo
  proprio più profili dei colleghi su `profiles`.
- **`is_org_owner` eseguibile da `anon`**: per un anonimo `auth.uid()` è nullo,
  quindi risponde sempre falso. Come le altre `is_org_*`.

## Gli advisor di sicurezza, letti fino in fondo — 0031 (17 settembre 2026)

Due rilievi restavano aperti sul database. Nessuno dei due era una falla: erano
**margini**, cose che non fanno danno oggi per ragioni che non erano scritte da
nessuna parte, e che una modifica futura può cancellare in silenzio.

### Otto funzioni di trigger pubblicate come RPC

Vivono in `public`, quindi PostgREST le esponeva su `/rest/v1/rpc/<nome>` **a
chiunque, anche senza accesso**, e sono `security definer`.

Non facevano danno perché una funzione di trigger chiamata fuori da un trigger
fallisce: `new` e `old` non esistono. È una difesa che viene dal linguaggio e
copre il codice di oggi — se domani una di queste prende un ramo che non tocca
`new`, sparisce senza che nessuno se ne accorga.

**La revoca non spegne i trigger.** In PostgreSQL il permesso `execute` su una
funzione di trigger si controlla quando il trigger viene **creato**, non quando
scatta. Non l'ho dato per scontato: misurato su questo database con una tabella
e un trigger usa-e-getta, agendo come `authenticated` senza `execute` — il
trigger è scattato lo stesso.

Il primo tentativo di prova **non provava niente**: girando come `postgres`,
`auth.uid()` è nullo e i trigger escono subito per disegno, quindi "l'update è
passato" non diceva nulla sulla revoca. Riscritto con `set local role
authenticated` e `request.jwt.claims`.

Verificato dopo via HTTP con la chiave anonima: le quattro provate rispondono
`PGRST202`, cioè PostgREST non le espone più.

### Due funzioni con `search_path` mutabile

`app_state_key_amministrativa` e `app_state_key_riservata` decidono, dentro le
policy di `app_state`, se una chiave è riservata ai manager. Nel corpo non c'è
nessun oggetto: solo un `in` su stringhe. L'unica cosa dirottabile era
l'operatore `=` fra text, e per farlo serve `create` su uno schema del percorso:
**verificato che né `anon` né `authenticated` ce l'hanno su nessuno schema.**

Il costo è reale e va detto: una funzione SQL con una clausola `SET` non è più
incorporabile dal planner, quindi diventa una chiamata per riga. Su `app_state`
ci sono **7 righe**. Si sceglie il margine.

### Cosa resta segnalato, di proposito

- **Le sei `is_org_*` eseguibili da `authenticated`.** Non si revocano: le
  policy RLS sono valutate con i privilegi di chi fa la richiesta, quindi senza
  `execute` su `is_org_member` ogni policy che la usa fallisce e l'applicazione
  si ferma. Da `anon` sono già revocate.
- **`email_promemoria_inviati` con RLS attiva e zero policy** (livello INFO).
  È esattamente il disegno, scritto nella 0014: la scrivono solo i lavori
  pianificati col service role. Poter cancellare una riga qui significherebbe
  far rispedire un'email; poterne inserire una, zittire il promemoria di un
  collega.

Dopo la 0031 l'advisor di sicurezza non segnala più nulla sul database. Restano
**solo i due interruttori della console**, in fondo a questo documento.

## Le rotte `api/` sono state esercitate via HTTP (17 settembre 2026)

Era il limite dichiarato in fondo alla PR #10: tutto verificato al livello del
database, niente al livello HTTP. Chiuso, con account di collaudo veri
dell'organizzazione **TaskFlow QA** e token veri, contro la **produzione**.

| Prova | Esito |
| --- | --- |
| `POST /restore` — elenco vuoto | `{"ripristinati":0}` |
| `POST /restore` — senza `tasks` | `400 Serve un elenco di task` |
| `POST /restore` — altra organizzazione | `403 You do not belong to this tenant` |
| **`POST /restore` — riga approvata + archiviata + `attachments_count`** | `{"ripristinati":1}` |
| `POST /api/tasks` — member assegna a un collega | `403 Solo manager, admin o owner…` |
| `POST /api/tasks` — member assegna a sé | creata |
| `POST /api/notifications` | `task_ref` **popolato**, `task_id` nullo |
| `POST /members` reset password — utente multi-organizzazione | `403` col messaggio nuovo |
| `POST /members` reset password — utente di questa sola | riuscito |
| `POST /api/ai/complete` — da `viewer` | `403 Richiede il ruolo 'member'…` |
| `PATCH /rest/v1/tasks` — `viewer` sulla propria attività | `[]`, zero righe |
| `GET /api/ai/complete` | `{"available":true}` |

**La prova che vale di più è la quarta.** Il payload conteneva di proposito
l'`organization_id` di un'**altra** organizzazione: la riga è atterrata in QA,
non là. La rotta sovrascrive quel campo, e `attachments_count` è stato scartato
e ricalcolato a 0 invece dei 3 inviati. È esattamente ciò per cui la rotta
esiste — e con il token di un utente quella riga era irricevibile, per tre
difese diverse.

`GET /api/ai/complete` risponde `{"available":true}`: **`ANTHROPIC_API_KEY` è
configurata in produzione e funziona.** Era una domanda aperta.

Anche i cinque cron rispondono `401` e non `503`: **`CRON_SECRET` è
configurato**, quindi i lavori pianificati sono armati.

### Cosa è stato toccato, e rimesso a posto
Password usa-e-getta su `qa.admin`, `qa.mario`, `qa.user`, poi sostituita con
una casuale che nessuno conosce. Un'organizzazione di prova creata e
cancellata. `qa.user` messo a `viewer` e rimesso a `member`. Task e notifiche di
prova cancellati. Ricontrollato dopo: 2 organizzazioni, 6 appartenenze, 8 task,
zero residui.

**`qa.lucia` ha una password nuova** che non conosco: è il risultato della prova
di reimpostazione legittima, e non l'ho stampata. Si recupera via email.

### Cosa resta NON verificato
**L'interfaccia.** Nessuno ha ancora aperto l'applicazione in un browser dopo
le modifiche del 17 settembre, e da questo ambiente non è raggiungibile.

## La tabella delle migrazioni ora corrisponde ai file (17 settembre 2026)

`supabase_migrations.schema_migrations` registrava **otto** migrazioni mentre
ne sono applicate **ventotto**, ed è il motivo per cui `supabase db push`
rifiuta. Il difetto vero però non era il numero: era la **forma**. Le otto
righe usavano le versioni a timestamp della CLI —
`20260908082343_multitenant_schema` — mentre i file locali si chiamano
`0001_multitenant_schema.sql`. Per la CLI erano migrazioni *diverse*, quindi
le due cronologie non potevano coincidere in nessun caso.

Ora le versioni corrispondono ai file, tutte e ventotto. Le otto originali
erano, per il caso vada annotato:

```
20260908082343 multitenant_schema           → 0001
20260908082452 fix_rls_recursion            → 0002
20260908082608 restrict_helper_functions    → 0003
20260908084522 extend_schema_for_app_state  → 0004
20260908085239 owner_can_read_own_org       → 0005
20260908123855 restrict_task_mutations      → 0006
20260908171452 ai_usage_limits              → 0007
20260908171441 role_write_separation        → 0008
```

(Le ultime due erano registrate in ordine inverso rispetto ai file. Non conta:
sono entrambe applicate da settembre.)

Fatto in un unico blocco atomico, e riletto dopo: 28 righe, esattamente i 28
file. **Non verificato end-to-end**: `supabase db push` non è eseguibile in
questo ambiente (la CLI non c'è). Quello che si può dire è che lo stato di
prima rendeva impossibile l'allineamento, e questo lo rende possibile.

## Rilievi minori, chiusi in blocco (17 settembre 2026)

Ognuno piccolo, ognuno con una conseguenza concreta.

**Ricorrenze: la guardia fermava l'occorrenza, non la serie.** Su una serie con
storia non serviva a niente — l'occorrenza #5 in attesa di visto veniva
saltata, la #4 già approvata entrava come "ultima chiusa", e la #6 veniva creata
mentre la #5 aspettava ancora. Funzionava solo al primo giro.

**`api/notifications` scriveva `task_id` invece di `task_ref`.** Esistono
entrambe le colonne, ed è per questo che l'errore era invisibile: l'insert
riusciva. Ma il client legge `task_ref`, quindi il collegamento all'attività non
portava da nessuna parte.

**`api/ai/complete` controllava l'appartenenza, non il ruolo.** Un `viewer` che
chiamasse la rotta direttamente otteneva le risposte AI, facendole pagare
all'organizzazione contro i tetti di spesa degli altri.

**Il CSV delle analisi non neutralizzava le formule.** Usava `scappaHTML`, che
in un CSV non c'entra niente e soprattutto non impedisce a un nome di reparto
di essere letto come formula. Le virgolette non bastano: un foglio esegue
`"=HYPERLINK(...)"` come `=HYPERLINK(...)`.

**La riga di comando cancellava i commenti dei colleghi** — la stessa corsa
chiusa in `useTasks`, e qui la finestra era di *secondi*. Ora si rileggono
`comments` e `activities` un istante prima di riscriverli. Non chiude la
finestra, la riduce a millisecondi: chiuderla del tutto vorrebbe dire una
scrittura condizionata sul valore letto, che per due colonne jsonb PostgREST
non offre in modo pulito.

**E `elenco` mentiva in tre modi**: metteva fra le "chiuse" il lavoro in attesa
di visto (che così spariva dalle aperte e si dimenticava), ordinava le "chiuse
di recente" per scadenza crescente — cioè le *meno* recenti — e scriveva «(47)»
sopra dieci righe senza accennare alle altre trentasette.

**I promemoria: due letture con due tetti, non una con un tetto solo.** Le
attività aperte e scadute da mesi non escono mai dall'insieme e si mangiavano il
budget di 2000 righe, e in coda a quell'ordinamento c'era proprio il preavviso.
Il primo a morire era `task_due_soon`, che fra i due è il più utile: avvisare
prima serve, avvisare dopo constata.

**Comporre un'email costava cinque letture, tre identiche per ogni destinatario
della stessa azienda.** Cento email significavano trecento letture per ottenere
tre risultati. Ora c'è una cache che dura quanto l'esecuzione — creata da chi
chiama, non globale, così non esiste il caso del modello modificato che continua
a valere perché l'istanza è rimasta calda.

## Le attività archiviate non si scaricano più (17 settembre 2026)

`useTasks` leggeva **tutta** la tabella `tasks` dell'organizzazione, archiviate
comprese, con `comments` e `activities` dentro la riga. Il filtro sugli
archiviati esisteva solo nel client (due `filter` su `archivedAt` in `App.tsx`),
quindi **l'archiviazione automatica non alleggeriva niente**: il lavoro
pianificato archiviava dopo trenta giorni e la scheda continuava a scaricare
tutto, per sempre. E la lettura riparte a ogni `focus` della finestra: ogni
alt-tab riscaricava l'archivio.

Con commenti e cronologia nella riga, mille attività sono nell'ordine dei dieci
megabyte. Un'azienda di venti persone che ne crea dieci al giorno ci arriva in
cinque mesi — è il muro di scala più probabile per il cliente bersaglio, e lo si
tocca entro il primo anno. C'era già un indice parziale apposta
(`tasks_org_attivi_idx`) che questa query non usava.

Perché non cambia nessun conto: un'attività archiviata è **sempre** chiusa
davvero (`daArchiviare` richiede `eChiuso`), quindi come bloccante risulta
"riferimento non trovato", che il client tratta come "non blocca" — la stessa
conclusione di prima.

L'unico posto che le voleva davvero è l'esportazione con ambito "tutti". Lì si
caricano a richiesta (`caricaArchiviate()`), una volta sola, e il dialogo lo
dice: conteggio provvisorio mentre arrivano, e **un messaggio esplicito se non
arrivano**. Un'esportazione "completa" che manca di un pezzo in silenzio è
peggio di un errore.

> Il secondo problema di scala — gli allegati base64 rispediti a ogni modifica —
> è già chiuso dal diff delle colonne: `attachments` entra nell'UPDATE solo se
> è cambiato.

## La disiscrizione non scrive più su GET (17 settembre 2026)

`api/email/disiscrivi.ts` spegneva le email **prima** di distinguere GET da
POST. Sembrava innocuo e non lo era: quel collegamento vive dentro un'email, e i
sistemi di scansione dei link lo seguono da soli — Outlook ATP Safe Links, i
gateway antispam aziendali, i prefetcher dei client. La persona veniva
disiscritta **senza aver cliccato niente e senza nessun avviso**, e poi «non mi
arrivano più le notifiche» diventava un problema che nessuno sapeva spiegare,
perché nell'applicazione non c'è nulla che dica che qualcosa le ha spente.

Ora la GET controlla il gettone e mostra una pagina con un pulsante. Il POST
one-click di RFC 8058 — quello che manda Gmail quando si preme "Annulla
iscrizione" nella posta — resta immediato, com'è giusto.

Il modulo non ha `action`, quindi manda il POST allo stesso indirizzo, gettone
compreso: il gettone non va riscritto dentro l'HTML e non c'è niente da
ripulire. Un campo `conferma=web` distingue il pulsante dal client di posta, per
rispondere con una pagina all'uno e con JSON all'altro.

## Migrazione 0028: le deroghe valgono dove sono state date (17 settembre 2026)

È il rovescio preciso di un lavoro fatto prima, e vale la pena raccontarlo per
intero perché è il tipo di errore che si fa correggendo.

Le deroghe stavano in `app_state.employees`: una chiave **per organizzazione**,
ma riscrivibile da ogni membro col proprio token — chiunque si concedeva i
permessi che voleva. Sono state spostate su `profiles.custom_permissions`, che
nessuno può modificare per sé (trigger della 0018). Falla chiusa.

Ma `profiles` ha **una riga per persona**, non una per organizzazione: le
deroghe sono diventate **globali**. Mario è membro di Acme e di Beta;
l'amministratrice di Acme gli concede `tasks.edit_any`; Mario passa su Beta e si
ritrova i comandi di approvazione sul lavoro di colleghi che non hanno mai
deciso niente in proposito. Una falla chiusa, un'altra aperta di forma diversa.

La sede giusta non era nessuna delle due: è `organization_members`, che è già la
riga che dice *"questa persona, in questa organizzazione, è questo"*. Per
organizzazione come `app_state`, non scrivibile dall'interessato come
`profiles`.

Verificato sul database:

```
deroga nell'organizzazione dove è stata data: {"tasks": {"edit_any": true}}
deroga nell'altra organizzazione ...........: nessuna
1) membro si concede una deroga ....: 0 righe, valore ora: nessuna
2) admin si concede una deroga .....: RIFIUTATO: Non si cambiano i propri permessi
3) admin concede una deroga a un altro: 1 riga
```

Due difese distinte e volute: il **membro** non passa nemmeno dalla policy
(`organization_members` è scrivibile solo dagli amministratori, 0027), e
l'**amministratore** entra ma lo ferma il trigger — perché un amministratore è
un membro come gli altri, e la sua riga è una riga come le altre.

> Nota di metodo: la prima versione di questa prova diceva «PASSATO» per il
> caso 1, perché guardavo solo l'eccezione. Un UPDATE filtrato da RLS **non
> solleva niente**: tocca zero righe. È esattamente il difetto corretto poche
> ore prima in `useTasks` e in `taskflow.mjs`, ripetuto da me nella sonda.

`profiles.custom_permissions` **non viene cancellata**: i valori sono copiati,
nessuno la legge più, e la colonna porta un commento che lo dice. Toglierla
sarebbe irreversibile per guadagnare qualche byte.

## I due "backup" (17 settembre 2026)

Esistevano due percorsi con lo stesso nome e semantiche **opposte**: uno
cancellava, l'altro non funzionava.

### `DataManagement` — cancellava, senza dirlo

`handleImportData` faceva `setTasks(data.tasks)`, e sembrava un ripristino. Non
lo era: `setTasks` calcola una differenza, e tutto ciò che non compariva nel
file diventava un **DELETE vero**. Importare un backup di due settimane fa
cancellava ogni attività creata da allora — senza conferma (mentre "Clear All
Data", che fa un danno minore, una conferma ce l'aveva), senza dire quante, e
nel momento in cui lo si usa, che è sempre un momento di panico.

E la metà costruttiva non funzionava nemmeno: il server rifiuta in creazione i
commenti non firmati da chi importa (`elencoFirmato`), e un backup vero
contiene i commenti dei colleghi. **Bilancio netto: le attività nuove
cancellate, quelle vecchie non tornate.**

Ora è una fusione per id — ciò che sta nel file aggiorna ciò che c'è, il resto
resta dov'è — con una conferma che dice quante attività ci sono nel file e che
niente verrà cancellato. Tre chiavi nuove, tradotte in tutte e cinque le
lingue.

### `SuperAdminSettings` — non poteva funzionare, e per tre motivi

Provato sul database, con gli errori veri:

1. **`attachments_count` è una colonna `generated always`** (0017). Il backup fa
   `select('*')`, quindi se la porta dentro, e Postgres risponde
   `cannot insert a non-DEFAULT value into column "attachments_count"`. Bastava
   questo a far fallire l'intero blocco.
2. Il trigger della **0023** rifiuta ogni riga nuova già approvata, quando chi
   scrive è una persona. Un backup di chi usa le approvazioni ne contiene
   sempre.
3. Le policy della **0024** e della **0026** non lasciano nascere una riga
   archiviata o figlia di una serie ricorrente.

Nessuna delle tre va allentata: descrivono ciò che una *persona* non può
fabbricarsi a mano. Un ripristino non è quello. Ora passa da
`POST /api/tenants/<id>/restore`, col service role, a blocchi di 25 — verificato
che una riga approvata+archiviata+figlia di serie passa, e che l'invariante
della 0026 **continua a mordere anche lì**: un backup che dice "completata"
mentre ciò che la bloccava risulta aperto viene rifiutato, col nome
dell'attività.

E i task si ripristinano **per primi**. Non ci sono transazioni fra chiamate:
facendoli per ultimi, un guasto lasciava le impostazioni del backup sopra i
task di prima — lo stato peggiore, perché è incoerente e non se ne accorge
nessuno. Per primi, un guasto lascia tutto com'era.

## I quattro lavori pianificati che si spegnevano da soli (17 settembre 2026)

`supabase-js` manda i `select` come GET con i filtri nella query string, e un
`in (...)` non lo spezza da solo. Con 2000 uuid l'indirizzo supera i 70 kB e il
gateway rifiuta la richiesta molto prima.

Il guasto non è un errore isolato, ed è questo il punto: **la rotta risponde 500
e non fa niente.** In `pulizia` l'arretrato non si riduce, quindi la stessa
richiesta troppo lunga si ripresenta la notte dopo, e quella dopo, per sempre.
In `promemoria` bastano un paio di centinaia di attività aperte e scadute perché
non parta più nessun promemoria, a nessuno. E si vede solo in produzione: a
regime i numeri sono piccoli e tutto passa.

La precauzione **esisteva già** in `manutenzione.ts`, per l'UPDATE di
archiviazione, con il commento giusto accanto (`BLOCCO_ARCHIVIAZIONE = 100`).
Era applicata in un punto su cinque. Ora sta in `api/_lib/aBlocchi.ts` — un
numero solo, 7 test — ed è usata nei quattro punti che mancavano:

| File | Cosa |
| --- | --- |
| `cron/pulizia.ts` | `delete .in('id', …)`, fino a 5000 |
| `cron/promemoria.ts` | `select .in('task_id', …)`, fino a 2000 |
| `cron/manutenzione.ts` | `select .in('task_id', …)`, fino a 2000 |
| `cron/ricorrenze.ts` | due `select .in(…)`, fino a 2000 |

In `pulizia` si conta anche quanto è stato cancellato **davvero**: se un blocco
fallisce, i precedenti restano lavoro fatto, e l'arretrato cala di cento righe
per volta invece di non calare mai.

## `members.ts`: due falle nella stessa rotta (17 settembre 2026)

**1. Scalata fra organizzazioni via reimpostazione password.** Il controllo
guardava il ruolo del bersaglio **solo dentro questo tenant**. Bob è
proprietario di "Beta" e semplice membro di "Acme"; Carla, amministratrice di
Acme, gli reimposta la password, la legge in chiaro nella risposta, entra come
Bob e si ritrova proprietaria di Beta. Il ruolo letto diceva `member` e i due
controlli passavano entrambi.

Ora la reimpostazione è rifiutata se il bersaglio appartiene a **qualunque**
altra organizzazione. Non basta escludere i ruoli privilegiati altrove: entrare
come semplice membro di un'altra organizzazione ne apre comunque i dati.
Un'identità che vale in più posti non è amministrabile da uno solo di quei
posti — chi è in quella condizione recupera la password da sé, per email.

**2. La scrittura veniva prima del controllo.** Mandando
`{email: <proprietario>, status: "inactive"}` si riceveva
`403 Solo il proprietario puo modificare il proprio ruolo`, e intanto il
proprietario era già disattivato e le sue deroghe cancellate. Il controllo
proteggeva davvero solo la riga in `organization_members`.

Ora l'ordine è: controllo → appartenenza → profilo. L'aggiornamento del profilo
sta **dopo** l'upsert dell'appartenenza, non solo dopo il controllo: `profiles`
non ha una colonna per organizzazione, quindi `status`, `team_lead` e
`custom_permissions` valgono ovunque quella persona sia, e scriverli prima di
sapere se è gente nostra permetteva all'amministratore di Acme — indovinando un
indirizzo email — di disattivare un dipendente di Beta.

> Che quelle tre colonne siano **globali** resta un difetto di forma, non
> chiuso: una deroga concessa in Acme vale anche in Beta. La sede giusta è
> `organization_members.custom_permissions`. È il rovescio del lavoro fatto
> spostandole da `app_state` (per-organizzazione ma scrivibile da chiunque) a
> `profiles` (protetto ma globale): ha chiuso una falla e ne ha aperta una di
> forma diversa.

## La scrittura di un task non è più a riga intera (17 settembre 2026)

`useTasks` mandava in UPDATE **tutte** le colonne, con i valori che il browser
aveva in memoria. Sembrava innocuo: erano i valori giusti. Il punto è che erano
i valori giusti *per lui*.

Due persone sulla stessa attività, o una sola con una scheda rimasta aperta
mentre la rete cadeva, e il commento scritto da un collega nel frattempo veniva
riscritto via — senza errori, e la rilettura confermava che sul database non
c'era più. Il caso peggiore non erano i commenti: se la copia locale era
antecedente a un'approvazione, partivano `approved_by: null` e
`approved_at: null`, e **nessun trigger li ferma** (la 0023 non controlla un
visto che viene *tolto*, perché riaprire è legittimo; la 0026 azzera solo se
cambia lo stato). Bastava correggere un titolo: la cronologia diceva
"approvato" e la riga non aveva più un approvatore.

Due difese, in `src/lib/scritturaTask.ts` (modulo nuovo, logica pura, 10 test):

1. **`taskToRow(task, precedente)`** mette nell'UPDATE solo le colonne il cui
   valore è davvero cambiato. È la stessa garanzia che già valeva per
   `attachments`, estesa a tutte: non sta in un controllo, sta nel fatto che la
   colonna non entra nella query.
2. **`fondiPerId`** per `comments` e `activities`, che sono cumulative e quindi
   non bastava non toccarle: chi *aggiunge* un commento manda comunque l'array
   intero. Quando cambiano si rilegge la colonna e ci si riapplica sopra la
   differenza — aggiunto, modificato, tolto. È quello che fa già `flushKey` in
   `useKV`: la base è sempre lo stato del server, mai la copia locale. Se la
   rilettura fallisce quelle due colonne non si scrivono, e lo si dice.

Restano fuori `subtasks`, `labels` e `watchers`: la difesa 1 protegge chi non
li tocca, la 2 non è stata estesa perché si modificano come insieme e non per
accumulo. Se un giorno due persone li modificheranno insieme, la sede è la
stessa.

## Migrazioni 0026 e 0027 (17 settembre 2026)

Nate da un audit in quattro parti. Ogni buco è stato **prima riprodotto** sul
database di produzione dentro un blocco che si annulla da solo, poi chiuso, poi
riprovato con la stessa sonda. Sei su sei erano reali; uno stampava in chiaro il
titolo di un'attività di un'altra organizzazione.

### 0026 — confini di creazione e dipendenze

1. **La sottoquery della 0025 non si fermava al confine dell'organizzazione.**
   Il trigger è `security definer`, quindi vedeva *tutti* i task del progetto,
   mentre il client considera "riferimento rotto, non blocca" qualunque id non
   suo. Chi conosceva un uuid altrui se lo metteva fra i propri `blocked_by`
   (nessuno valida quella colonna in UPDATE) e si portava a casa il messaggio
   `Prima vanno chiuse: <titolo altrui>`. Oracolo ripetibile. Chiuso con
   `and b.organization_id = new.organization_id`.
2. **La regola dei bloccanti valeva solo in UPDATE.** Il trigger passa a
   `before insert or update`: si poteva nascere già `completed` con dipendenze
   aperte.
3. **La 0024 non guardava `recurrence_parent` né `archived_at`.** Un membro si
   dichiarava figlio di una serie ricorrente e il cron, trovando una "figlia
   aperta", **smetteva di rigenerare quel controllo periodico** — rispondendo
   200, senza errori per nessuno.

### 0027 — appartenenze e assegnazioni

1. **Un `admin` poteva prendersi l'organizzazione.** `organization_members`
   aveva una sola policy di scrittura (`for all` con `is_org_admin`) e nessun
   trigger: bastava una PATCH per mettersi `owner`, degradare il proprietario o
   cancellarlo. Ora tre policy separate più un trigger: nessuno cambia il
   proprio ruolo, la proprietà la conferisce solo chi ce l'ha, un'appartenenza
   non cambia persona né organizzazione. Nuova funzione `is_org_owner`.
2. **Un'attività si assegnava a chiunque, anche fuori organizzazione** (e il
   cron dei promemoria poi gli mandava l'email). Il confine sta in un trigger e
   non in una `with check` perché deve scattare **solo quando l'assegnatario
   cambia**: altrimenti un'attività il cui assegnatario ha lasciato l'azienda
   diventerebbe immodificabile per sempre.
3. **Un `viewer` assegnatario poteva scrivere:** la policy di update non
   consultava mai `is_org_writer`. Ora sì.

Applicate con `mcp__Supabase__execute_sql` (il binario `supabase` non c'è
nell'ambiente remoto; il file resta la fonte di verità in
`supabase/migrations/`).

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

### 9. Da fare a mano in Supabase — l'elenco completo

Dopo la 0031, **tutto ciò che si poteva chiudere dal database è chiuso**. Quello
che resta non si tocca da qui: non esiste uno strumento per la configurazione
auth, la CLI non è installata, e le chiavi `config.toml` corrispondenti non sono
confermate dalla documentazione (scriverle alla cieca, in un file che dichiara
di rappresentare lo stato *completo* di `[auth]`, è più rischioso che lasciarle
stare).

Console: <https://supabase.com/dashboard/project/ibjlfamnoewpixfnowvd>

1. **Protezione password compromesse** — Authentication → Policies. Confronta le
   password con HaveIBeenPwned al momento della registrazione e del cambio.
   Oggi **disattivata**; la segnala l'advisor di sicurezza.
2. **MFA / TOTP** — stessa pagina. Oggi con **troppo pochi metodi attivi**;
   stesso advisor.
3. **La password del proprietario.** È stata esposta durante il lavoro del 17
   settembre ed è stato inviato il messaggio di recupero. Finché non si completa
   il cambio, **la vecchia password vale ancora**.

Questi tre sono gli unici punti in sospeso su Supabase. Il resto — policy,
trigger, indici, revoche, `search_path` — è applicato e verificato in
produzione, e la tabella delle migrazioni ha **31 righe per 31 file**.

### I due domini di produzione sono lo stesso deploy
`supabase/config.toml` ha `site_url = employee-task-m-last-dodalo.vercel.app`
mentre qui sopra si legge `employee-task-m-last.vercel.app`. Verificato il 17
settembre: **rispondono entrambi 200**, sono alias. I link di recupero password
funzionano. Era un dubbio lasciato aperto dall'audit sulla documentazione.

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
