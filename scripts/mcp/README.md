# MCP server

This folder holds the Model Context Protocol server that connects Claude Desktop
to your tasks.

- **`taskflow.mjs`** — the MCP server. Claude Desktop starts it; it runs locally
  over stdio and acts with the signed-in user's own permissions.
- **`installa.test.mjs`** — tests that `--installa` writes Claude's config safely.
- **`sessione.test.mjs`** — tests session handling (a changed session on disk is
  noticed; a valid one is cached).

## Setup

```bash
node ../taskflow.mjs accedi          # authenticate once
node taskflow.mjs --installa         # register with Claude Desktop
# then fully restart Claude Desktop
```

## Tools exposed

- `taskflow_elenco_task` — list your tasks
- `taskflow_leggi_task` — full detail of one task
- `taskflow_cambia_stato` — change status (+ optional note)
- `taskflow_aggiungi_nota` — add a comment
- `taskflow_crea_task` — create a task (via `/api/tasks`; needs `TASKFLOW_APP_URL`)
- `taskflow_assegna_task` — set/clear the assignee
- `taskflow_riprogramma_task` — set/clear the due date
- `taskflow_imposta_priorita` — set priority (low/medium/high)
- `taskflow_imposta_etichette` — replace the label set
- `taskflow_elenco_persone` — list org members (name + role)
- `taskflow_cerca_task` — search tasks (text / status / assignee)

All run with your own permissions (RLS + per-person overrides); the four writers
follow the same database rules as the UI.

## Tests

```bash
npm run test -- scripts/mcp/
```

Full documentation: [../../docs/MCP_GUIDE.md](../../docs/MCP_GUIDE.md) ·
Quick start: [../../docs/CLAUDE_CLI_SETUP.md](../../docs/CLAUDE_CLI_SETUP.md)
