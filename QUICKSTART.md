# Quick Start Guide — AI AUTOMATED TASK MANAGER

Get up and running in 5 minutes.

## Prerequisites

- Node.js 18+ and npm
- Supabase account (free tier works)
- Vercel account (for deployment)
- Claude API key (for AI features)

## Installation

### 1. Clone & Install

```bash
git clone https://github.com/yourusername/ai-automated-task-manager.git
cd ai-automated-task-manager
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env.local
```

Fill in your `.env.local`:

```env
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Database
SUPABASE_DB_PASSWORD=your_db_password

# Claude AI (optional)
ANTHROPIC_API_KEY=sk-ant-...

# Email (Resend or SendGrid)
RESEND_API_KEY=re_your_key
# OR
SENDGRID_API_KEY=SG.your_key

# Deployment
VERCEL_TOKEN=your_vercel_token
```

### 3. Setup Database

```bash
# Link to your Supabase project
supabase link --project-ref your-project-ref

# Push all migrations
supabase db push
```

This creates all tables, RLS policies, and triggers.

### 4. Start Development Server

```bash
vercel dev
```

This runs:
- Frontend on http://localhost:3000
- API functions on http://localhost:3001

## First Login

1. Open http://localhost:3000
2. An admin account is created during migration
3. Use email: `admin@localhost` password: `changeme`
4. **Change the password immediately** in Settings

## Create Your First Task

1. Click "New Task"
2. Title: "Welcome to AI AUTOMATED TASK MANAGER"
3. Assign to yourself
4. Set priority and due date
5. Click "Create"

Done! You now have a task tracking system with:
- ✅ Role-based access control
- ✅ Real-time notifications
- ✅ Approval workflows
- ✅ Audit logging

## Enable Claude Integration

### Connect Claude Desktop

```bash
node scripts/mcp/task-manager.mjs --install
```

Then restart Claude Desktop. You'll see a new "Task Manager" tool.

### Try It

In Claude:
> "List my open tasks and suggest a priority order"

Claude can now:
- List your tasks (with your permissions)
- Read task details
- Update status
- Add comments

All operations respect RLS policies.

## CLI Usage

```bash
# Login once
node scripts/ai-task-manager.mjs login

# List your tasks
node scripts/ai-task-manager.mjs list

# Create a task
node scripts/ai-task-manager.mjs create "Task title" --priority high

# Assign to someone
node scripts/ai-task-manager.mjs assign <task-id> <user-email>

# Update status
node scripts/ai-task-manager.mjs status <task-id> done "I finished this"
```

## What's Next?

- **[Full Documentation](docs/INSTALLATION.md)** — detailed setup, configuration options
- **[Security Model](docs/SECURITY.md)** — how permissions work
- **[API Reference](docs/API_REFERENCE.md)** — build custom integrations
- **[Contributing](CONTRIBUTING.md)** — add features or fix bugs
- **[Examples](examples/)** — code samples

## Common Issues

### "Service role key not found"

Make sure you set `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`. It's needed for database operations.

### "Database migrations failed"

Run `supabase migration list` to see status. If stuck:

```bash
supabase db reset
supabase db push
```

### "Claude MCP tool not showing"

After `--install`, fully close Claude Desktop (not just the window). Then restart it.

### "Email not sending"

Check `.env.local` has a valid Resend or SendGrid key. Test with:

```bash
node scripts/test-email.mjs your-email@example.com
```

## Getting Help

- **GitHub Issues** — bugs and feature requests
- **GitHub Discussions** — questions and architecture
- **Email** — support@aiautomatedtaskmanager.dev

## Next Steps

1. ✅ Invite your team (Settings > Users)
2. ✅ Create departments (Settings > Departments)
3. ✅ Set role permissions (Settings > Roles)
4. ✅ Enable Claude integration (see above)
5. ✅ Deploy to production (see docs/DEPLOYMENT.md)

Happy tasking! 🚀
