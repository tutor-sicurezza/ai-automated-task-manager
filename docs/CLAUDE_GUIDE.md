# Features & Claude Integration — AI Automated Task Manager

A single, honest reference to what the app does and the three ways you can drive
it with Claude. Everything here is a feature that exists in the code today; there
are no roadmap promises or benchmark claims in this document.

> 🇮🇹 Versione italiana: [CLAUDE_GUIDE.it.md](CLAUDE_GUIDE.it.md)

- **New to the project?** Start with [../QUICKSTART.md](../QUICKSTART.md).
- **Just want Claude Desktop connected?** Jump to
  [The MCP connector](#b-the-mcp-connector-claude-desktop) or the full
  [MCP_GUIDE.md](MCP_GUIDE.md).

---

## 1. What the app does

A team task manager where every permission is enforced by the database (Postgres
Row-Level Security), not just hidden in the UI.

### Task management
- **Lifecycle** — every task moves through `not-started → in-progress → blocked →
  completed`, with the activity log recording each change.
- **Assignment** — assign to a person (or release it). Assigning work to someone
  else requires a manager-level role; the assignee must belong to your
  organization, and the database rejects anyone who doesn't.
- **Priority** — `low` / `medium` / `high`.
- **Due dates** — set or clear a scheduled date.
- **Labels** — free-form tags, lowercased and de-duplicated.
- **Subtasks** — break a task into checklist items with their own progress.
- **Dependencies / blockers** — mark a task "blocked by" another. A blocked task
  **cannot** be completed until its blockers close — this is enforced in the
  database, so it holds through the UI, the CLI and Claude alike.
- **Comments** — discussion thread per task, recorded in the activity log.

### Approvals & watchers
- **Approval state** — "completed" and "completed & approved" are tracked
  separately, so sign-off is distinct from finishing the work.
- **Watchers** — people following a task receive in-app notifications on changes.

### Roles & permissions
- Roles: **owner, admin, manager, member, viewer**.
- **Per-person overrides** — an admin can grant or revoke a single capability
  (e.g. `change_status`) for one person without changing their role.
- Because the rules live in RLS policies and triggers, hiding a button is a
  courtesy — the database is what actually enforces the rule.

### Views
Dashboard, Tasks, Calendar, Workload and Analytics, plus Announcements and an
AI Assistant panel. Each view respects what your role is allowed to see.

### Notifications
In-app notifications fire on the events that matter to you — a task assigned to
you, a task you watch changing, an approval you owe. Status changes and new
comments made through the connector or CLI notify watchers and the assignee
**in-app** (they do not send email or resolve `@mentions` — those need the web UI).

### Multi-organization & multi-language
- One account can belong to several organizations; each is isolated by RLS.
- Interface available in **English, Italian, French, German and Spanish**.

### Export
A task can be exported as **Markdown** (for docs and handoffs) or **PDF** (for a
printable summary), including its description, subtasks and activity.

---

## 2. Three ways to use Claude

There are three integration paths, from zero-setup to fully automated. Pick the
one that fits the person: an end user in a browser wants the first; a developer
living in Claude Desktop wants the second.

### A. "Work on this with Claude" — no setup

Every task has a **✨ Work on this with Claude** button. It opens a dialog with
two tabs:

- **Ready-made prompt** — a copy-paste prompt that describes the task (title,
  description, subtasks, still-open blockers) for you to paste into Claude, in the
  browser or the desktop app. It also gives you the one terminal command that
  marks the task done when you finish. Comments are deliberately left out of the
  prompt because they may name colleagues.
- **Connector (MCP)** — the install-once commands and an example phrase, for when
  you want to upgrade to the automated path below.

> This button **prepares** the work; a web page cannot start a program on your
> computer, and the dialog says so plainly. No copying is involved once the
> connector (path B) is installed.

### B. The MCP connector (Claude Desktop)

The full integration. A small local server (`scripts/mcp/taskflow.mjs`), started
and stopped by Claude Desktop, lets Claude read and change your tasks **as you** —
it can do exactly what you could do in the web UI, no more, because every request
still passes through the same RLS policies.

**Set up once:**

```bash
node scripts/taskflow.mjs accedi        # authenticate (email + password, once)
node scripts/mcp/taskflow.mjs --installa # register the connector
# then fully quit and reopen Claude Desktop
```

Then ask in natural language — *"List my open tasks"*, *"Move a1b2 to
in-progress and note I started the draft"*. Task IDs can be abbreviated to the
leading characters the list shows.

**The eleven tools:**

| Tool | What it does |
| --- | --- |
| `taskflow_elenco_task` | List tasks assigned to you (optionally include closed). |
| `taskflow_leggi_task` | Full detail of one task: description, subtasks, open blockers, approval state, comments. |
| `taskflow_cambia_stato` | Change status and optionally add a note. Respects blockers; marked destructive. |
| `taskflow_aggiungi_nota` | Add a comment without changing status. |
| `taskflow_crea_task` | Create a task through the app's `/api/tasks` route (same checks as the UI). |
| `taskflow_assegna_task` | (Re)assign or release a task; assignee must be in your org. |
| `taskflow_riprogramma_task` | Set or clear the due date. |
| `taskflow_imposta_priorita` | Set priority (low / medium / high). |
| `taskflow_imposta_etichette` | Replace the whole label set (lowercased, de-duplicated). |
| `taskflow_elenco_persone` | List the people in your organization (name + role). |
| `taskflow_cerca_task` | Search tasks by text, status and assignee (your org if your role can see all; otherwise just yours). |

Creating a task needs `TASKFLOW_APP_URL` (or `APP_URL`) set — `accedi` captures
it from `.env.local` automatically. Full setup, multi-org, uninstall and
troubleshooting live in **[MCP_GUIDE.md](MCP_GUIDE.md)**.

### C. The CLI (terminal)

The same operations the connector exposes, without Claude — useful in scripts or
when you just want the terminal. Authenticate once, then:

```bash
node scripts/taskflow.mjs elenco                 # your tasks
node scripts/taskflow.mjs stato <id> completata  # non-iniziata | in-corso | bloccata | completata
node scripts/taskflow.mjs nota <id> "note text"
node scripts/taskflow.mjs crea "Title" --assegna <who> --priorita high --scadenza 2026-10-01
node scripts/taskflow.mjs assegna <id> <who|nessuno>
node scripts/taskflow.mjs scadenza <id> 2026-10-01
node scripts/taskflow.mjs priorita <id> high
node scripts/taskflow.mjs etichette <id> a b c
node scripts/taskflow.mjs persone
node scripts/taskflow.mjs cerca "text" --stato in-corso --di me
```

See **[CLAUDE_CLI_SETUP.md](CLAUDE_CLI_SETUP.md)**.

---

## 3. How the integration stays safe

The three paths differ in convenience, not in privilege. All of them:

- **Act as you** — the connector and CLI use your stored session **token, never
  your password**, and can never exceed your permissions. If an admin revoked a
  capability, Claude is stopped the same way the UI would stop you, and the
  message says what happened.
- **Go through the same checks** — task creation uses the app's `/api/tasks`
  route, never a raw database insert; a blocked task can't be completed; an
  out-of-org assignment is rejected by a database trigger.
- **Are recorded** — every action lands in the audit trail, whether it came from
  the UI, the CLI or Claude.

See **[SECURITY.md](SECURITY.md)** for the full model.

---

## See also

- [../QUICKSTART.md](../QUICKSTART.md) — 5-minute setup
- [MCP_GUIDE.md](MCP_GUIDE.md) — Claude Desktop connector, in depth
- [CLAUDE_CLI_SETUP.md](CLAUDE_CLI_SETUP.md) — CLI setup
- [INSTALLATION.md](INSTALLATION.md) — detailed installation
- [SECURITY.md](SECURITY.md) — security model
- [API_REFERENCE.md](API_REFERENCE.md) — REST API
