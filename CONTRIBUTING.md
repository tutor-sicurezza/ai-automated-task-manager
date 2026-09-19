# Contributing to AI AUTOMATED TASK MANAGER

Thank you for your interest in contributing! This document provides guidelines and instructions for getting started.

## Code of Conduct

This project adheres to the Contributor Covenant Code of Conduct. By participating, you are expected to uphold this code. Please report unacceptable behavior to conduct@aiautomatedtaskmanager.dev.

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Git
- Supabase account (for testing)
- Claude API key (optional, for AI features)

### Setup Development Environment

```bash
# Clone the repository
git clone https://github.com/yourusername/ai-automated-task-manager.git
cd ai-automated-task-manager

# Install dependencies
npm install

# Copy environment template
cp .env.example .env.local

# Fill in your development credentials
# (see QUICKSTART.md for details)

# Link to Supabase
supabase link --project-ref <your-project-ref>

# Push database migrations
supabase db push

# Start development server
vercel dev
```

## How to Contribute

### Reporting Bugs

1. Check if the bug has already been reported in [Issues](https://github.com/yourusername/ai-automated-task-manager/issues)
2. If not, create a new issue using the Bug Report template
3. Include:
   - Clear description of the bug
   - Steps to reproduce
   - Expected vs actual behavior
   - Environment info (OS, browser, Node version)
   - Error stack traces if applicable

### Suggesting Features

1. Check existing [Issues](https://github.com/yourusername/ai-automated-task-manager/issues) and [Discussions](https://github.com/yourusername/ai-automated-task-manager/discussions)
2. Use the Feature Request issue template
3. Describe:
   - The problem it solves
   - Your proposed solution
   - Use cases and examples
   - Expected benefits

### Submitting Code

#### 1. Fork and Branch

```bash
# Fork the repository on GitHub
# Clone your fork
git clone https://github.com/yourusername/ai-automated-task-manager.git
cd ai-automated-task-manager

# Add upstream remote
git remote add upstream https://github.com/aiautomatedtaskmanager/ai-automated-task-manager.git

# Create a feature branch
git checkout -b feature/your-feature-name
# or for fixes:
git checkout -b fix/bug-description
```

#### 2. Make Your Changes

Follow the code style and conventions in this project:

**TypeScript:**
- Use strict mode (`tsconfig.json`)
- Avoid `any` types
- Document complex logic with comments
- Use meaningful variable names

**React Components:**
- Functional components with hooks
- Use TypeScript for prop types
- Keep components focused (single responsibility)
- Use Radix/shadcn components when available

**Database:**
- Keep migrations in `/supabase/migrations/`
- Always write RLS policies
- Document schema changes
- Test migrations on a clean database

**Testing:**
- Write tests for new features
- Write tests before fixing bugs (TDD)
- Aim for >80% coverage on new code
- Use Vitest for unit tests

#### 3. Commit Guidelines

```bash
# Commits should be atomic and well-described

git commit -m "feat: add AI-powered task routing

This implements intelligent task assignment based on:
- Skill matching
- Current workload
- Historical success rate

Closes #123"
```

**Commit message format:**

```
type(scope): subject

body

footer
```

**Types:**
- `feat` — new feature
- `fix` — bug fix
- `docs` — documentation
- `style` — code style (formatting, semicolons, etc.)
- `refactor` — code refactoring
- `perf` — performance improvement
- `test` — test addition or modification
- `chore` — build process, dependencies, etc.

**Scopes:**
- `api` — API routes
- `db` — database/migrations
- `rls` — row-level security
- `ui` — React components
- `cli` — command-line tools
- `mcp` — Model Context Protocol
- `auth` — authentication
- `email` — email functionality

#### 4. Verify Your Changes

```bash
# Run all checks
npm run test          # Unit tests (Vitest)
npm run typecheck     # TypeScript strict mode
npm run lint          # ESLint + Prettier
npm run build         # Production build

# Test manually
vercel dev            # Start dev server
# Test your feature in browser at http://localhost:3000
```

#### 5. Database Changes

If your change requires database schema changes:

```bash
# Create a new migration
supabase migration new <descriptive-name>

# Edit the migration file in supabase/migrations/
# Include SQL changes + RLS policies

# Test locally
supabase db push      # Apply migration
# Test your feature
supabase db reset     # Reset to clean state
```

**Migration checklist:**
- [ ] Migration is in `/supabase/migrations/`
- [ ] Filename is timestamped and descriptive
- [ ] RLS policies are updated if needed
- [ ] Migration is idempotent (safe to run twice)
- [ ] Tested on fresh database

#### 6. Permission Changes

If your change affects permissions, authentication, or RLS:

1. **Describe clearly in PR:**
   - Which operation becomes possible?
   - For which roles or users?
   - What was the previous behavior?

2. **Add tests:**
   ```typescript
   test('admin can approve tasks', async () => {
     // Test that admin role can perform approval
   });
   test('member cannot approve tasks', async () => {
     // Test that member role cannot approve
   });
   ```

3. **Update documentation:**
   - Update `/docs/SECURITY.md` if needed
   - Document new roles or permissions

### Pull Request Process

1. **Push to your fork:**
   ```bash
   git push origin feature/your-feature-name
   ```

2. **Open a PR on GitHub:**
   - Use the Pull Request template
   - Reference related issues (#123)
   - Describe what changed and why
   - List breaking changes if any

3. **Respond to review:**
   - Address reviewer feedback
   - Re-request review after changes
   - Be open to suggestions

4. **Final checks:**
   ```bash
   # Ensure all CI checks pass
   # Rebase if needed:
   git fetch upstream
   git rebase upstream/main
   git push -f origin feature/your-feature-name
   ```

5. **Merge:**
   - Wait for at least one approval
   - Ensure all CI checks pass
   - Maintainer will merge

## Development Practices

### Testing

```bash
# Run specific test file
npm run test -- src/components/__tests__/TaskCard.test.ts

# Run tests matching pattern
npm run test -- --grep "permission"

# Run with coverage
npm run test -- --coverage

# Watch mode (reruns on changes)
npm run test -- --watch
```

### Code Style

We use Prettier for formatting and ESLint for linting. Most issues are auto-fixable:

```bash
# Auto-fix formatting and common issues
npm run lint -- --fix
```

**Pre-commit hooks:**
Pre-commit hooks run automatically on git commit. If they fail:
```bash
# Fix issues and try again
npm run lint -- --fix
git add .
git commit -m "..."
```

### Debugging

```bash
# Enable verbose logging
DEBUG=* npm run dev

# Debug tests
node --inspect-brk node_modules/.bin/vitest

# Then open chrome://inspect in Chrome DevTools
```

### Documentation

- Document public APIs with JSDoc comments
- Add examples for complex features
- Keep README.md and docs/ in sync
- Add TypeScript types for all public functions

## Project Structure

```
ai-automated-task-manager/
├── src/
│   ├── components/       # React components
│   ├── hooks/           # Custom hooks
│   ├── lib/             # Utility functions
│   ├── types/           # TypeScript types
│   └── __tests__/       # Unit tests
├── api/                 # Vercel Edge Functions
├── supabase/
│   ├── migrations/      # Database migrations
│   └── sql/             # SQL queries
├── scripts/
│   ├── cli.mjs          # CLI tool
│   └── mcp/             # MCP integration
├── docs/                # Documentation
├── examples/            # Code examples
└── tests/               # Integration tests
```

## Getting Help

- **GitHub Discussions** — ask questions about architecture or approach
- **GitHub Issues** — report bugs or request features
- **Email** — support@aiautomatedtaskmanager.dev
- **Slack** (if available) — join our community

## Release Process

Maintainers follow semver (semantic versioning):
- `MAJOR.MINOR.PATCH` (e.g., 1.2.3)
- MAJOR: breaking changes
- MINOR: new features
- PATCH: bug fixes

Changelog is updated automatically from commit messages.

## Recognition

Contributors are recognized in:
- CONTRIBUTORS.md file
- Release notes
- GitHub "Contributors" page

Thank you for contributing! 🎉
