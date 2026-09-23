# Funzionalità e integrazioni con Claude — AI Automated Task Manager

Un riferimento unico e onesto a cosa fa l'applicazione e ai tre modi per usarla
con Claude. Tutto ciò che segue è una funzionalità che esiste già nel codice: non
ci sono promesse di roadmap né dati di benchmark in questo documento.

> 🇬🇧 English version: [CLAUDE_GUIDE.md](CLAUDE_GUIDE.md)

- **Primo avvio?** Parti da [../QUICKSTART.md](../QUICKSTART.md).
- **Vuoi solo collegare Claude Desktop?** Vai a
  [Il connettore MCP](#b-il-connettore-mcp-claude-desktop) o alla guida completa
  [MCP_GUIDE.md](MCP_GUIDE.md).

---

## 1. Cosa fa l'applicazione

Un gestore di attività per il team dove ogni permesso è imposto dal database
(Row-Level Security di Postgres), non solo nascosto nell'interfaccia.

### Gestione delle attività
- **Ciclo di vita** — ogni attività passa per `non-iniziata → in-corso →
  bloccata → completata`, con il registro attività che annota ogni cambiamento.
- **Assegnazione** — assegna a una persona (o libera l'attività). Assegnare
  lavoro a qualcun altro richiede un ruolo da manager; l'assegnatario deve
  appartenere alla tua organizzazione e il database rifiuta chi non ne fa parte.
- **Priorità** — `bassa` / `media` / `alta`.
- **Scadenze** — imposta o rimuovi una data.
- **Etichette** — tag liberi, resi minuscoli e deduplicati.
- **Sotto-attività** — spezza un'attività in una checklist con avanzamento
  proprio.
- **Dipendenze / blocchi** — segna un'attività come "bloccata da" un'altra.
  Un'attività bloccata **non** può essere completata finché i suoi blocchi non si
  chiudono: è imposto dal database, quindi vale allo stesso modo da interfaccia,
  CLI e Claude.
- **Commenti** — thread di discussione per attività, registrato nel log.

### Approvazioni e watcher
- **Stato di approvazione** — "completata" e "completata e approvata" sono
  tracciate separatamente: la firma finale è distinta dal semplice terminare il
  lavoro.
- **Watcher** — chi segue un'attività riceve notifiche in-app sui cambiamenti.

### Ruoli e permessi
- Ruoli: **owner, admin, manager, member, viewer**.
- **Eccezioni per persona** — un admin può concedere o revocare una singola
  capacità (es. `change_status`) a una persona senza cambiarne il ruolo.
- Poiché le regole vivono in policy e trigger RLS, nascondere un pulsante è solo
  una cortesia: è il database a imporre davvero la regola.

### Viste
Dashboard, Attività, Calendario, Carico di lavoro e Analisi, più Annunci e un
pannello Assistente AI. Ogni vista rispetta ciò che il tuo ruolo può vedere.

### Notifiche
Le notifiche in-app scattano sugli eventi che ti riguardano — un'attività
assegnata a te, un'attività che segui che cambia, un'approvazione che devi dare.
I cambi di stato e i nuovi commenti fatti dal connettore o dalla CLI avvisano
watcher e assegnatario **in-app** (non inviano email e non risolvono le
`@menzioni`: per quelle serve l'interfaccia web).

### Multi-organizzazione e multilingua
- Un account può appartenere a più organizzazioni; ognuna è isolata dalla RLS.
- Interfaccia disponibile in **italiano, inglese, francese, tedesco e spagnolo**.

### Esportazione
Un'attività può essere esportata in **Markdown** (per documenti e passaggi di
consegne) o **PDF** (per un riepilogo stampabile), inclusi descrizione,
sotto-attività e attività registrate.

---

## 2. Tre modi per usare Claude

Ci sono tre percorsi di integrazione, dal nessun-setup al pienamente automatico.
Scegli quello adatto alla persona: un utente nel browser vuole il primo; uno
sviluppatore che vive in Claude Desktop vuole il secondo.

### A. "Segui con Claude" — nessun setup

Ogni attività ha un pulsante **✨ Segui con Claude**. Apre una finestra con due
schede:

- **Prompt pronto** — un testo da copiare e incollare che descrive l'attività
  (titolo, descrizione, sotto-attività, blocchi ancora aperti), da incollare in
  Claude, nel browser o nell'app desktop. Dà anche l'unico comando da terminale
  che segna l'attività come completata quando hai finito. I commenti sono
  volutamente esclusi dal prompt perché possono citare colleghi.
- **Connettore (MCP)** — i comandi di installazione (una volta sola) e una frase
  di esempio, per quando vuoi passare al percorso automatico qui sotto.

> Questo pulsante **prepara** il lavoro; una pagina web non può avviare un
> programma sul tuo computer, e la finestra lo dice chiaramente. Una volta
> installato il connettore (percorso B) non serve più copiare nulla.

### B. Il connettore MCP (Claude Desktop)

L'integrazione completa. Un piccolo server locale (`scripts/mcp/taskflow.mjs`),
avviato e fermato da Claude Desktop, permette a Claude di leggere e modificare le
tue attività **come te** — può fare esattamente ciò che potresti fare
nell'interfaccia web, niente di più, perché ogni richiesta passa comunque per le
stesse policy RLS.

**Configurazione (una volta sola):**

```bash
node scripts/taskflow.mjs accedi        # autenticati (email + password, una volta)
node scripts/mcp/taskflow.mjs --installa # registra il connettore
# poi chiudi e riapri completamente Claude Desktop
```

Poi chiedi in linguaggio naturale — *"Elenca le mie attività aperte"*, *"Sposta
a1b2 in corso e annota che ho iniziato la bozza"*. Gli ID attività si possono
abbreviare ai primi caratteri mostrati dall'elenco.

**Gli undici strumenti:**

| Strumento | Cosa fa |
| --- | --- |
| `taskflow_elenco_task` | Elenca le attività assegnate a te (opzionalmente incluse le chiuse). |
| `taskflow_leggi_task` | Dettaglio completo di un'attività: descrizione, sotto-attività, blocchi aperti, stato di approvazione, commenti. |
| `taskflow_cambia_stato` | Cambia lo stato e opzionalmente aggiunge una nota. Rispetta i blocchi; marcato come distruttivo. |
| `taskflow_aggiungi_nota` | Aggiunge un commento senza cambiare stato. |
| `taskflow_crea_task` | Crea un'attività tramite la rotta `/api/tasks` dell'app (stessi controlli dell'interfaccia). |
| `taskflow_assegna_task` | (Ri)assegna o libera un'attività; l'assegnatario deve essere nella tua org. |
| `taskflow_riprogramma_task` | Imposta o rimuove la scadenza. |
| `taskflow_imposta_priorita` | Imposta la priorità (bassa / media / alta). |
| `taskflow_imposta_etichette` | Sostituisce l'intero set di etichette (minuscole, deduplicate). |
| `taskflow_elenco_persone` | Elenca le persone della tua organizzazione (nome + ruolo). |
| `taskflow_cerca_task` | Cerca attività per testo, stato e assegnatario (tutta l'org se il tuo ruolo può vedere tutto; altrimenti solo le tue). |

Creare un'attività richiede `TASKFLOW_APP_URL` (o `APP_URL`) impostata — `accedi`
la cattura automaticamente da `.env.local`. Setup completo, multi-org,
disinstallazione e risoluzione problemi sono in **[MCP_GUIDE.md](MCP_GUIDE.md)**.

### C. La CLI (terminale)

Le stesse operazioni del connettore, senza Claude — utile negli script o quando
vuoi solo il terminale. Autenticati una volta, poi:

```bash
node scripts/taskflow.mjs elenco                 # le tue attività
node scripts/taskflow.mjs stato <id> completata  # non-iniziata | in-corso | bloccata | completata
node scripts/taskflow.mjs nota <id> "testo della nota"
node scripts/taskflow.mjs crea "Titolo" --assegna <chi> --priorita high --scadenza 2026-10-01
node scripts/taskflow.mjs assegna <id> <chi|nessuno>
node scripts/taskflow.mjs scadenza <id> 2026-10-01
node scripts/taskflow.mjs priorita <id> high
node scripts/taskflow.mjs etichette <id> a b c
node scripts/taskflow.mjs persone
node scripts/taskflow.mjs cerca "testo" --stato in-corso --di me
```

Vedi **[CLAUDE_CLI_SETUP.md](CLAUDE_CLI_SETUP.md)**.

---

## 3. Perché l'integrazione resta sicura

I tre percorsi differiscono per comodità, non per privilegi. Tutti quanti:

- **Agiscono come te** — il connettore e la CLI usano il **token** della tua
  sessione salvata, **mai la password**, e non possono mai superare i tuoi
  permessi. Se un admin ha revocato una capacità, Claude viene fermato allo stesso
  modo in cui ti fermerebbe l'interfaccia, e il messaggio dice cosa è successo.
- **Passano per gli stessi controlli** — la creazione di un'attività usa la rotta
  `/api/tasks` dell'app, mai un inserimento grezzo nel database; un'attività
  bloccata non può essere completata; un'assegnazione fuori organizzazione viene
  rifiutata da un trigger del database.
- **Vengono registrati** — ogni azione finisce nel registro di audit, che arrivi
  dall'interfaccia, dalla CLI o da Claude.

Vedi **[SECURITY.md](SECURITY.md)** per il modello completo.

---

## Vedi anche

- [../QUICKSTART.md](../QUICKSTART.md) — configurazione in 5 minuti
- [MCP_GUIDE.md](MCP_GUIDE.md) — connettore Claude Desktop, in dettaglio
- [CLAUDE_CLI_SETUP.md](CLAUDE_CLI_SETUP.md) — configurazione CLI
- [INSTALLATION.md](INSTALLATION.md) — installazione dettagliata
- [SECURITY.md](SECURITY.md) — modello di sicurezza
- [API_REFERENCE.md](API_REFERENCE.md) — API REST
