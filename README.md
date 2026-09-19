<div align="center">

# AI AUTOMATED TASK MANAGER

**Enterprise task automation where permissions are enforceable.**

Intelligent task orchestration for organizations — AI-powered assignment, smart routing, real-time approvals, automated escalation and intelligent notifications. Security policies live in the database, not in configuration files.

[![React 19](https://img.shields.io/badge/React-19-149ECA?logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Supabase](https://img.shields.io/badge/Supabase-Postgres%20%2B%20RLS-3FCF8E?logo=supabase&logoColor=white)](https://supabase.com)
[![Claude MCP](https://img.shields.io/badge/Claude-MCP%20Enabled-9B5DE5?logo=anthropic&logoColor=white)](https://modelcontextprotocol.io)
[![Vite](https://img.shields.io/badge/Vite-7-646CFF?logo=vite&logoColor=white)](https://vite.dev)
[![Tests](https://img.shields.io/badge/tests-725%20passing-brightgreen)](#testing)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

[English](README.md) · [Italiano](README.it.md) · [Quick Start](QUICKSTART.md) · [Features](docs/FEATURES_AND_BENEFITS.md)

<img src="docs/immagini/dashboard.png" alt="AI AUTOMATED TASK MANAGER dashboard: AI insights, smart routing and team performance" width="900">

</div>

---

## What makes it different

Most task managers are reactive tools that wait for humans to organize work. AI AUTOMATED TASK MANAGER **proactively orchestrates tasks** using intelligent algorithms while maintaining **database-enforced security policies** that cannot be bypassed from the UI.

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

```bash
node scripts/ai-task-manager.mjs login              # authenticate once
node scripts/ai-task-manager.mjs list               # show your tasks
node scripts/ai-task-manager.mjs assign <id> <user> # assign task
node scripts/ai-task-manager.mjs status <id> done   # mark complete
```

## Connect Claude Desktop

```bash
node scripts/mcp/task-manager.mjs --install
# then restart Claude Desktop
```

This installs the MCP connector so Claude can read, assign, and update tasks with your permissions.

## Testing

```bash
npm run test          # 725+ tests (Vitest)
npm run typecheck     # TypeScript strict mode
npm run lint          # ESLint + Prettier
npm run build         # production bundle
npm run smoke-test    # integration verification
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

<sub>AI AUTOMATED TASK MANAGER is an open-source intelligent task orchestration platform built for enterprises that need both **AI automation** and **database-enforced security**.</sub>
