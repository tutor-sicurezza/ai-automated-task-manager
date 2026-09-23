<div align="center">

# AI Automated Task Manager

**Enterprise task automation where permissions are enforceable.**

Intelligent task orchestration for organizations — AI-powered assignment, smart routing, real-time approvals, automated escalation and intelligent notifications. Security policies live in the database, not in configuration files.

[![React 19](https://img.shields.io/badge/React-19-149ECA?logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Supabase](https://img.shields.io/badge/Supabase-Postgres%20%2B%20RLS-3FCF8E?logo=supabase&logoColor=white)](https://supabase.com)
[![Claude MCP](https://img.shields.io/badge/Claude-MCP%20Enabled-9B5DE5?logo=anthropic&logoColor=white)](https://modelcontextprotocol.io)
[![Vite](https://img.shields.io/badge/Vite-7-646CFF?logo=vite&logoColor=white)](https://vite.dev)
[![Tests](https://img.shields.io/badge/tests-710%20passing-brightgreen)](#testing)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

[English](README.md) · [Italiano](README.it.md) · [Quick Start](QUICKSTART.md) · [Features](docs/FEATURES_AND_BENEFITS.md)

<img src="docs/immagini/dashboard.png" alt="AI Automated Task Manager dashboard: AI insights, smart routing and team performance" width="900">

</div>

---

## What makes it different

Most task managers are reactive tools that wait for humans to organize work. AI Automated Task Manager **proactively orchestrates tasks** using intelligent algorithms while maintaining **database-enforced security policies** that cannot be bypassed from the UI.

| Feature | Benefit |
| --- | --- |
| **AI-Powered Routing** | Tasks are automatically assigned based on skill matching, availability and historical performance using Claude AI integration. No manual dispatch overhead. |
| **Enforceable Security Policies** | Every authorization rule is a Postgres RLS policy or database trigger. Hiding the button is a courtesy — the database enforces the rule regardless. |
| **Smart Escalation** | Tasks blocked by dependencies, overdue items or stalled work trigger intelligent escalation workflows. Humans intervene only when needed. |
| **Real-time Approval Workflows** | Multi-step approvals with audit trails. "Completed" and "completed and signed off" are tracked separately at every level. |
| **MCP Integration** | Claude Desktop connects natively via Model Context Protocol. Tasks are managed through AI with full permission enforcement. |
| **Transparent Audit Trail** | Every action — whether from UI, CLI, or AI assistant — is logged with full context. Accountability is automatic. |

## Key Capabilities

- **Intelligent Task Assignment** — AI recommendations based on skills, availability, capacity and historical success rates
- **Automated Workflow Orchestration** — smart routing, escalation rules, dependency management, recurrence
- **Multi-tenant Role-Based Access** — owner, admin, manager, member, viewer with per-person overrides
- **Real-time Approvals & Notifications** — approval workflows with granular notification preferences
- **Claude AI Integration** — MCP connector for native AI task management with full permission enforcement
- **Email & Notifications** — async delivery via Resend/SendGrid, quiet hours, per-person preferences
- **Department Analytics** — completion rates, bottleneck detection, workload distribution
- **Multi-language Support** — English, Italian, French, German, Spanish
- **Enterprise Security** — Postgres RLS, encrypted secrets, audit logging, GDPR compliance ready

## Architecture

- **Frontend** — React 19 + TypeScript, Vite, Radix/shadcn, Tailwind CSS 4
- **Auth & Data** — Supabase (Postgres + Auth), RLS on every application table
- **AI Intelligence** — Claude API with local MCP connector
- **Server Functions** — Vercel Edge Functions, all secrets stay on the server
- **Database** — Migrations in `/supabase/migrations/`, versioned and ordered

## Quick Start

```bash
npm install
cp .env.example .env.local          # fill in your API keys
supabase link --project-ref <ref>
supabase db push                    # applies all migrations
vercel dev                          # frontend + api/ functions
```

**Full guide:** See [QUICKSTART.md](QUICKSTART.md) and [INSTALLATION.md](docs/INSTALLATION.md)

## CLI Usage

Commands use short keywords. Authenticate once; after that the rest run without prompting:

```bash
node scripts/taskflow.mjs accedi                 # authenticate once (asks email + password)
node scripts/taskflow.mjs elenco                 # list the tasks assigned to you
node scripts/taskflow.mjs stato <id> completata  # change status: non-iniziata | in-corso | bloccata | completata
node scripts/taskflow.mjs nota <id> "note text"  # add a comment
node scripts/taskflow.mjs esci                   # forget the session and revoke it server-side

# Same operations the Claude Desktop connector exposes, from the terminal:
node scripts/taskflow.mjs crea "Title" --assegna <who> --priorita high --scadenza 2026-10-01
node scripts/taskflow.mjs assegna <id> <who|nessuno>   # (re)assign or release
node scripts/taskflow.mjs scadenza <id> 2026-10-01     # set/clear the due date
node scripts/taskflow.mjs priorita <id> high           # low | medium | high
node scripts/taskflow.mjs etichette <id> a b c         # replace the whole label set
node scripts/taskflow.mjs persone                      # list org members (name + role)
node scripts/taskflow.mjs cerca "text" --stato in-corso --di me  # search beyond your own
```

`crea` needs `APP_URL` (or `TASKFLOW_APP_URL`) — `accedi` captures it from `.env.local`.

`<id>` is the leading characters shown by `elenco` — enough to identify a single task.

## Connect Claude Desktop

```bash
node scripts/mcp/taskflow.mjs --installa
# then restart Claude Desktop
```

This installs the MCP connector so Claude can read and update your tasks with your own permissions. See [docs/MCP_GUIDE.md](docs/MCP_GUIDE.md) and [docs/CLAUDE_CLI_SETUP.md](docs/CLAUDE_CLI_SETUP.md).

## Testing

```bash
npm run test          # 710 passing, 15 skipped (Vitest)
npm run typecheck     # TypeScript strict mode
npm run lint          # ESLint + Prettier
npm run build         # production bundle

node scripts/smoke-auth.mjs   # auth & account-provisioning smoke test
```

Tests cover:
- Permission matrix per role and per-person overrides
- XSS/injection prevention for all DOM inputs
- ID uniqueness and data isolation
- Recurrence logic and email digests
- Escalation and approval workflows
- CLI and MCP tool behavior

## Documentation

- **[QUICKSTART.md](QUICKSTART.md)** — 5-minute setup guide
- **[docs/CLAUDE_GUIDE.md](docs/CLAUDE_GUIDE.md)** — all features and the three ways to use Claude
- **[docs/INSTALLATION.md](docs/INSTALLATION.md)** — detailed installation
- **[docs/API_REFERENCE.md](docs/API_REFERENCE.md)** — API endpoints
- **[docs/MCP_GUIDE.md](docs/MCP_GUIDE.md)** — Claude Desktop integration
- **[docs/SECURITY.md](docs/SECURITY.md)** — security model and compliance
- **[CONTRIBUTING.md](CONTRIBUTING.md)** — contribution guidelines
- **[docs/FEATURES_AND_BENEFITS.md](docs/FEATURES_AND_BENEFITS.md)** — detailed feature matrix

## Contributing

Issues and pull requests welcome. Before submitting:

```bash
npm run test && npm run typecheck && npm run lint && npm run build
```

If your change affects permissions, RLS policies or authentication, describe **which operation becomes possible, and for whom** in the PR description.

## Community

- GitHub Issues — bug reports and feature requests
- GitHub Discussions — questions and architecture discussions
- Email — contact@aiautomatedtaskmanager.dev

## License

[MIT](LICENSE) — free for personal and commercial use.

---

<sub>AI Automated Task Manager is an open-source intelligent task orchestration platform built for enterprises that need both **AI automation** and **database-enforced security**.</sub>
