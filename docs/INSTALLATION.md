# Installation Guide — AI AUTOMATED TASK MANAGER

Complete setup instructions for development and production.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Development Setup](#development-setup)
3. [Configuration](#configuration)
4. [Database Setup](#database-setup)
5. [Running Locally](#running-locally)
6. [Production Deployment](#production-deployment)
7. [Troubleshooting](#troubleshooting)

## Prerequisites

### System Requirements

- **Node.js**: 18.x or higher
- **npm**: 10.x or higher (or yarn/pnpm equivalent)
- **PostgreSQL**: 15+ (via Supabase)
- **Git**: For version control

### External Accounts

1. **Supabase** (free tier available)
   - Create account at https://supabase.com
   - Create new project

2. **Vercel** (for deployment)
   - Create account at https://vercel.com
   - Install Vercel CLI: `npm install -g vercel`

3. **Claude API Key** (optional, for AI features)
   - Get from https://console.anthropic.com
   - Set `ANTHROPIC_API_KEY` in `.env.local`

4. **Email Service** (optional)
   - **Resend**: https://resend.com (recommended)
   - **SendGrid**: https://sendgrid.com
   - Set API key in `.env.local`

## Development Setup

### 1. Clone Repository

```bash
git clone https://github.com/aiautomatedtaskmanager/ai-automated-task-manager.git
cd ai-automated-task-manager
```

### 2. Install Dependencies

```bash
npm install
```

This installs:
- React, TypeScript, Vite
- Supabase client
- Tailwind CSS, Radix UI, shadcn/ui
- Testing libraries (Vitest)
- Build tools

### 3. Create Environment File

```bash
cp .env.example .env.local
```

Fill in the values (see [Configuration](#configuration) section).

### 4. Link Supabase Project

```bash
npx supabase login
supabase link --project-ref your-project-ref
```

Find `your-project-ref` in your Supabase project settings (it's in the URL: https://supabase.com/dashboard/project/**your-project-ref**).

When prompted for password, use your Supabase database password.

### 5. Setup Database

```bash
# Apply all migrations
supabase db push

# This creates:
# - All tables with RLS policies
# - Database triggers
# - Functions and views
# - Initial data if needed
```

### 6. Start Development Server

```bash
vercel dev
```

This starts:
- **Frontend**: http://localhost:3000
- **API Functions**: http://localhost:3001

### 7. Access the Application

1. Open http://localhost:3000
2. Sign in with default admin credentials:
   - Email: `admin@localhost`
   - Password: `changeme`
3. **Change password immediately** in Settings

## Configuration

### Environment Variables

Create `.env.local` with these values:

#### Required: Supabase

```env
# Get these from Supabase Dashboard > Settings > API
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...

# Get from Settings > Database
SUPABASE_DB_PASSWORD=your_secure_password

# Get from Settings > API > Service Role Secret
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIs...
```

#### Optional: AI Features

```env
# Claude API (for AI-powered routing)
ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_MODEL=claude-3-5-sonnet-20241022
```

#### Optional: Email

```env
# Option A: Resend (recommended)
RESEND_API_KEY=re_...

# Option B: SendGrid
SENDGRID_API_KEY=SG.xxx

# Default from address
SMTP_FROM=noreply@yourdomain.com
```

#### Optional: Deployment

```env
# Vercel deployment
VERCEL_TOKEN=your_vercel_token
VERCEL_PROJECT_ID=your_project_id
VERCEL_ORG_ID=your_org_id
```

#### Optional: Analytics & Monitoring

```env
# Sentry (error tracking)
SENTRY_DSN=https://key@sentry.io/123456

# PostHog (product analytics)
POSTHOG_API_KEY=your_posthog_key

# GA4 (Google Analytics)
NEXT_PUBLIC_GA_ID=G-XXXXXXXX
```

### Key Configuration Points

**Two common setup traps:**

1. **Missing SUPABASE_SERVICE_ROLE_KEY**
   - Error: "Service role key not found"
   - Fix: Get from Supabase Dashboard > Settings > API > Service Role Secret
   - Copy the full key (starts with `eyJhbGc...`)

2. **Wrong database password**
   - Error: "Database connection failed"
   - Fix: Use the password you set when creating Supabase project
   - Not the Supabase account password

## Database Setup

### Initial Setup

```bash
# Link to your Supabase project
supabase link --project-ref your-project-ref

# Push all migrations to create schema
supabase db push

# This creates:
# - public.tasks
# - public.users
# - public.notifications
# - public.approvals
# - ...and more
#
# Plus RLS policies and triggers
```

### Migrations

Migrations live in `supabase/migrations/`:

```
supabase/migrations/
├── 20240101000000_init_tables.sql
├── 20240101000001_add_rls_policies.sql
├── 20240101000002_create_triggers.sql
└── ...
```

To apply new migrations after pulling:

```bash
supabase db push
```

### Database Structure

Key tables:
- `public.tasks` — task records with RLS per-row policies
- `public.users` — user profiles with org association
- `public.notifications` — user notifications (recipient-only readable)
- `public.approvals` — approval records with audit trail
- `public.departments` — organization departments
- `public.app_state` — configuration (manager/admin only)

All tables have:
- RLS (Row Level Security) policies
- Audit triggers (created_at, updated_at)
- Type safety via functions

### Backup

To backup your database:

```bash
# Via Supabase Dashboard
# Settings > Backups > Manual backup

# Or via CLI
supabase db pull  # Download schema
```

## Running Locally

### Start Development Server

```bash
vercel dev
```

Runs both frontend and API functions:
- Frontend: http://localhost:3000
- API: http://localhost:3001

### Run Tests

```bash
# All tests
npm run test

# Watch mode (reruns on changes)
npm run test -- --watch

# Single file
npm run test -- src/lib/__tests__/permissions.test.ts

# With coverage
npm run test -- --coverage
```

### Linting & Type Checking

```bash
# Check types
npm run typecheck

# Lint code
npm run lint

# Auto-fix issues
npm run lint -- --fix

# Full verification
npm run test && npm run typecheck && npm run lint && npm run build
```

### Database Commands

```bash
# Show migrations status
supabase migration list

# View remote database changes
supabase db pull

# Reset to clean state (development only!)
supabase db reset

# Push local migrations
supabase db push

# View logs
supabase functions list logs
```

## Production Deployment

### Deploy to Vercel

```bash
# Login to Vercel
vercel login

# Deploy
vercel

# Or deploy to production
vercel --prod
```

### Environment Variables in Vercel

1. Go to Vercel Dashboard > Settings > Environment Variables
2. Add all variables from `.env.local`:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `ANTHROPIC_API_KEY` (if using AI)
   - Email service keys
   - Others as needed

### Database in Production

```bash
# Link to production Supabase project
supabase link --project-ref prod-project-ref

# Push migrations to production
supabase db push
```

### Configure Custom Domain

1. Vercel Dashboard > Settings > Domains
2. Add your domain
3. Update DNS records (instructions provided)
4. Wait for SSL certificate generation

### Email Configuration

If using email:

```env
# Resend
RESEND_API_KEY=re_prod_key

# SendGrid
SENDGRID_API_KEY=SG.prod_key

# From address for production
SMTP_FROM=noreply@yourdomain.com
```

### Monitoring

1. **Errors**: Sentry (optional)
   - Dashboard > Settings > Environment Variables
   - Add `SENTRY_DSN`

2. **Logs**: Vercel Dashboard > Logs
   - View real-time logs
   - Search by status, date range

3. **Performance**: Vercel Analytics
   - Automatic Core Web Vitals tracking
   - Performance dashboard

## Troubleshooting

### "Cannot find module" or npm errors

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

### "Database connection failed"

**Cause**: Wrong database password or Supabase URL

```bash
# Verify environment variables
echo $SUPABASE_DB_PASSWORD
echo $VITE_SUPABASE_URL

# Test connection
supabase db push --dry-run
```

### "Service role key not found"

**Cause**: Missing `SUPABASE_SERVICE_ROLE_KEY`

1. Go to Supabase Dashboard
2. Settings > API
3. Find "Service Role Secret" (not "anon" key)
4. Copy to `.env.local`:
   ```env
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
   ```

### "RLS policies prevent operation"

**Expected behavior**: Some operations are denied.

```bash
# Check your user role
# Settings > Team > Your profile

# If you're a viewer, you can't create tasks
# Change role to admin/manager to test
```

### "Email not sending"

```bash
# Test email configuration
node scripts/test-email.mjs your-email@example.com

# Check logs
vercel logs --tail

# Verify API keys
echo $RESEND_API_KEY    # or SENDGRID_API_KEY
```

### "Claude MCP tool not showing"

1. Run install:
   ```bash
   node scripts/mcp/task-manager.mjs --install
   ```

2. Fully close Claude Desktop (not just window)

3. Restart Claude Desktop

4. Check Settings > Integrations > MCP Servers

### "TypeScript errors"

```bash
# Clear TypeScript cache
rm -rf .next node_modules/.cache

# Rebuild
npm run typecheck
npm run build
```

### "Port already in use"

```bash
# If port 3000 is in use:
vercel dev --listen 3001

# Or kill the process:
# macOS/Linux:
lsof -i :3000 | grep LISTEN | awk '{print $2}' | xargs kill -9

# Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

## Next Steps

1. ✅ Create admin account (done during setup)
2. ✅ Invite team members (Settings > Users)
3. ✅ Configure departments (Settings > Departments)
4. ✅ Set role permissions (Settings > Roles)
5. ✅ Enable email (set API key)
6. ✅ Enable Claude (run MCP installer)
7. ✅ Create first task

## Support

- **Issues**: GitHub Issues
- **Questions**: GitHub Discussions
- **Email**: support@aiautomatedtaskmanager.dev
- **Docs**: https://github.com/aiautomatedtaskmanager/ai-automated-task-manager/docs

---

Happy deploying! 🚀
