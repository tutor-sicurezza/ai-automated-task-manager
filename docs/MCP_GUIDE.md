# Claude Desktop Integration (MCP) — AI Automated Task Manager

Connect Claude Desktop to your tasks through the Model Context Protocol (MCP).
Once connected, you can read and update your tasks from inside a Claude
conversation — with your own permissions, enforced by the database.

## What is MCP?

The Model Context Protocol lets Claude Desktop talk to a local server that you
control. The server here is `scripts/mcp/taskflow.mjs`. It runs on your machine,
started and stopped by Claude Desktop, and acts **as the signed-in user**: it
can do exactly what you could do in the web UI, no more. Every rule is a Postgres
RLS policy or trigger — a blocked task cannot be completed through Claude any
more than through the interface.

## Prerequisites

Authenticate once with the CLI. This stores a session so the connector never has
to ask for credentials:

```bash
node scripts/taskflow.mjs accedi
```

You are asked for email and password once. The session is written to
`~/.config/taskflow/sessione.json` (on Windows, under `%APPDATA%` via
`XDG_CONFIG_HOME`; the file holds a refresh token, not your password).

## Install the connector

```bash
node scripts/mcp/taskflow.mjs --installa
# then fully quit and reopen Claude Desktop
```

This adds a `taskflow` entry to Claude Desktop's configuration file
(`mcpServers.taskflow`), pointing at the absolute path of
`scripts/mcp/taskflow.mjs`. Config file location by OS:

- **macOS** — `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows** — `%APPDATA%\Claude\claude_desktop_config.json`
- **Linux** — `~/.config/Claude/claude_desktop_config.json`

The installer merges into the existing file; your other MCP servers are left
untouched.

## Verify

After restarting Claude Desktop:

1. Confirm the `taskflow` block exists under `mcpServers` in the config file
   listed above.
2. In Claude, the TaskFlow tools should be available. Try:

   > "List my open tasks"

If the tools do not appear, fully quit Claude Desktop (not just the window) and
reopen it — the config is read only at startup.

## Usage

Ask in natural language; Claude picks the right tool.

```
"List my open tasks"
"Show details of task a1b2"
"Add a note to a1b2: waiting on legal review"
"Move a1b2 to in-progress and note that I started the draft"
```

Task IDs can be abbreviated to the leading characters shown by the list — enough
to identify a single task. If a prefix matches more than one, the tool asks you
to be more specific instead of guessing.

## Available tools

The connector exposes exactly four tools:

### `taskflow_elenco_task`
Lists the tasks assigned to you (id, status, due date, title). Optional
`includiChiuse` (boolean) includes closed tasks; default is open only.

### `taskflow_leggi_task`
Full detail of one task: description, subtasks, progress, still-open blockers,
approval state, comments. Takes `id` (may be a prefix).

### `taskflow_cambia_stato`
Changes a task's status and optionally adds a note. Arguments: `id`, `stato`
(`non-iniziata` | `in-corso` | `bloccata` | `completata`), optional `nota`. It
writes the activity log and sends **in-app** notifications to watchers, the
assignee and the requester. It does **not** send email and does not resolve
`@mentions` — those need the web UI. Database rules still apply: a task blocked
by another cannot be completed. This tool is marked destructive, so Claude may
ask you to confirm before running it.

### `taskflow_aggiungi_nota`
Adds a comment to a task without changing its status. Arguments: `id` and
`testo`. Notifies watchers and the assignee in-app. `@mentions` are not resolved
here.

There is intentionally **no** create-task and **no** assign tool — those stay in
the UI to avoid accidental changes.

## Permissions

Everything runs with **your** credentials. If a database policy or a per-person
override would stop you from doing something in the UI (e.g. an admin revoked
your `change_status` permission), the connector is stopped the same way — and the
message tells you what happened.

## Multiple organizations

If your account belongs to more than one organization, tell the installer which
one to use (Claude Desktop does not inherit terminal environment variables, so it
has to be baked into the config):

```bash
node scripts/mcp/taskflow.mjs --installa --org "Acme"
# or
TASKFLOW_ORG="Acme" node scripts/mcp/taskflow.mjs --installa
```

## Uninstall

There is no uninstall flag. Remove the connector by deleting the `taskflow` key
from `mcpServers` in `claude_desktop_config.json` (paths above), then restart
Claude Desktop. To also forget the stored session:

```bash
node scripts/taskflow.mjs esci
```

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| Tools don't appear in Claude | Fully quit and reopen Claude Desktop; confirm the `taskflow` entry in `claude_desktop_config.json`. |
| "Session no longer valid — run accedi again" | Run `node scripts/taskflow.mjs accedi` again; the refresh token was revoked or replaced. |
| "Permission denied" from a tool | Your role (or a per-person override) doesn't allow that operation — same limit as the UI. |
| Wrong organization's tasks | Reinstall with `--org` (see above). |

## Privacy & security

- The server runs locally over stdio; it uses your stored session token, never
  your password.
- It cannot read other users' tasks or exceed your permissions.
- Task actions are recorded in the audit trail. See [SECURITY.md](SECURITY.md).

## See also

- [CLAUDE_CLI_SETUP.md](CLAUDE_CLI_SETUP.md) — quick setup
- [../QUICKSTART.md](../QUICKSTART.md) — 5-minute setup
- [API_REFERENCE.md](API_REFERENCE.md) — REST API
- [SECURITY.md](SECURITY.md) — security model

---

Ready? Authenticate, install, restart Claude:

```bash
node scripts/taskflow.mjs accedi
node scripts/mcp/taskflow.mjs --installa
```

Then ask Claude: *"List my open tasks."*
