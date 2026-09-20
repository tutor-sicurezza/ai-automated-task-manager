# Changelog — AI Automated Task Manager

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- AI-powered task routing based on skills and availability
- Claude Desktop integration via Model Context Protocol (MCP)
- Department-level analytics and insights
- Automated escalation workflows
- Multi-step approval workflows

### Changed
- Improved notification UI and preferences
- Enhanced workload visualization

### Fixed
- Permission enforcement in task updates
- Email delivery reliability

---

## [1.0.0] — 2024-XX-XX

### Added

#### Core Features
- **Task Management**
  - Create, read, update, delete tasks
  - Task status tracking (todo, in-progress, done, etc.)
  - Priority levels (low, normal, high, urgent)
  - Due dates and recurrence
  - Task dependencies and blocking
  - Subtasks and steps
  - Task labels and categorization
  - Bulk task operations

#### Authorization & Security
- Row-level security (RLS) on all tables
- Role-based access control (owner, admin, manager, member, viewer)
- Per-person permission overrides
- Database-enforced authorization (not UI-only)
- Audit logging of all operations
- Encrypted secrets in environment variables

#### Notifications
- Real-time in-app notifications
- Email notifications via Resend/SendGrid
- Notification preferences per user
- Quiet hours support
- Digest emails

#### Approvals
- Multi-step approval workflows
- Approval status tracking
- Sign-off audit trail
- Parallel and sequential approvals

#### Departments & Teams
- Departments with granular permissions
- Department-level analytics
- Team performance metrics
- Workload distribution by department

#### Analytics
- Completion rates by department and person
- Task age and cycle time metrics
- Bottleneck detection
- Performance trends
- Top performers (anonymized)

#### CLI
- Task listing and filtering
- Status updates from command line
- Task creation via CLI
- Assignment operations
- Export functionality

#### Multi-language
- English
- Italian
- French
- German
- Spanish
- Configurable per user

#### Email
- Async email delivery
- Templated emails
- Resend or SendGrid support
- Email digest options
- Unsubscribe management

#### Data Export
- CSV export for spreadsheets
- PDF export for reports
- JSON export for integrations
- Markdown export for documentation

#### UI/UX
- Responsive design (desktop, tablet, mobile)
- Dark mode support
- Real-time updates via WebSocket
- Drag-and-drop task ordering
- Advanced filtering and search
- Saved filters per user
- Dashboard with key metrics
- Task detail view with full history

### Technical Stack
- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS 4, Radix UI, shadcn/ui
- **Backend:** Vercel Edge Functions, Node.js
- **Database:** Supabase (Postgres 15+), migrations
- **Authentication:** Supabase Auth
- **Email:** Resend or SendGrid integration
- **Testing:** Vitest, 725+ tests
- **Type Safety:** TypeScript strict mode

### Documentation
- [README.md](README.md) — Project overview
- [QUICKSTART.md](QUICKSTART.md) — 5-minute setup guide
- [docs/INSTALLATION.md](docs/INSTALLATION.md) — Detailed installation
- [docs/FEATURES_AND_BENEFITS.md](docs/FEATURES_AND_BENEFITS.md) — Feature overview
- [docs/USE_CASES.md](docs/USE_CASES.md) — Real-world use cases
- [docs/API_REFERENCE.md](docs/API_REFERENCE.md) — API documentation
- [docs/MCP_GUIDE.md](docs/MCP_GUIDE.md) — Claude Desktop integration
- [docs/SECURITY.md](docs/SECURITY.md) — Security model and compliance
- [CONTRIBUTING.md](CONTRIBUTING.md) — Contribution guidelines

### Community
- GitHub Issues for bug reports
- GitHub Discussions for questions
- Contributing guidelines
- Code of Conduct

---

## Format Guide

Each version section follows this format:

### Added
Features that were newly added.

### Changed
Changes to existing functionality.

### Deprecated
Features that are marked for removal.

### Removed
Features that were removed.

### Fixed
Bug fixes.

### Security
Security vulnerability fixes.

---

## Guidelines for Updates

### Version Numbering

- **MAJOR** version when making incompatible API changes
- **MINOR** version when adding functionality in a backwards-compatible manner
- **PATCH** version when making backwards-compatible bug fixes

Additional labels:
- `-alpha` or `-a` for alpha releases
- `-beta` or `-b` for beta releases
- `-rc` for release candidates

### Commit to Changelog

When submitting a PR, include the changelog entry in your commit message or PR description:

```
feat(task): add task dependencies

Add support for blocking tasks on dependencies.
- Implement blocking relationship
- Add database trigger to prevent completing blocked tasks
- Update UI to show blockers
- Add tests for blocking logic

Changelog:
- Added task dependency blocking feature
- Tasks blocked by others cannot be marked complete
```

### Unreleased Section

Keep an "Unreleased" section at the top for changes that haven't been released yet.

When releasing a new version:
1. Rename `[Unreleased]` to `[X.Y.Z] — YYYY-MM-DD`
2. Add a new `[Unreleased]` section
3. Create a GitHub Release with the changelog

---

## Release Process

1. **Update CHANGELOG.md** with all changes since last release
2. **Update version** in `package.json`
3. **Create commit:** `chore: release v1.2.3`
4. **Create git tag:** `git tag v1.2.3`
5. **Push:** `git push && git push --tags`
6. **Create GitHub Release** with changelog content
7. **Deploy** to production

---

## Notable Changes

### v1.0.0 (Initial Release)

This is the first stable release of AI Automated Task Manager with all core features:
- Enterprise task management with AI automation
- Database-enforced security (not UI-only)
- Claude Desktop integration
- Multi-tenant architecture
- 725+ passing tests
- 5-language support

See [README.md](README.md) and [QUICKSTART.md](QUICKSTART.md) to get started.

---

## Migration Guides

### From Beta to v1.0.0

No breaking changes for beta users. All data is preserved.

1. Update dependencies: `npm install`
2. Run migrations: `supabase db push`
3. Restart your application

---

## Security

For security vulnerability reports, please email **security@aiautomatedtaskmanager.dev** instead of using the issue tracker.

---

## Links

- [GitHub Repository](https://github.com/aiautomatedtaskmanager/ai-automated-task-manager)
- [Documentation](docs/)
- [Contributing](CONTRIBUTING.md)
- [License](LICENSE)
- [Code of Conduct](CODE_OF_CONDUCT.md)
