# Security Model — AI AUTOMATED TASK MANAGER

How AI AUTOMATED TASK MANAGER enforces security at the database level.

## Core Principle

**Authorization lives in the database, not in the UI.**

This means:
- Hiding a button is a courtesy to the user
- The real security is a Postgres RLS policy or database trigger
- No operation can bypass the database rules, whether from UI, CLI, or AI assistant

## Security Layers

### Layer 1: Row-Level Security (RLS)

Every application table has RLS policies:

```sql
-- Example: users can only see their own tasks
CREATE POLICY "users can select own tasks" ON public.tasks
FOR SELECT
USING (auth.uid() = assigned_to OR auth.uid() = created_by);

-- Example: notifications visible only to recipient
CREATE POLICY "users see own notifications" ON public.notifications
FOR SELECT
USING (auth.uid() = recipient_id);
```

**Effect**: Queries automatically filtered to accessible rows.

### Layer 2: Database Triggers

Business rules that cannot be bypassed:

```sql
-- Example: prevent closing blocked tasks
CREATE TRIGGER prevent_close_blocked_task
BEFORE UPDATE ON public.tasks
FOR EACH ROW
EXECUTE FUNCTION check_task_not_blocked();

-- Example: auto-log every change to audit table
CREATE TRIGGER audit_task_changes
AFTER INSERT OR UPDATE OR DELETE ON public.tasks
FOR EACH ROW
EXECUTE FUNCTION audit_log_changes();
```

**Effect**: Certain operations fail at the database level, period.

### Layer 3: Role-Based Access Control (RBAC)

Five roles with escalating permissions:

| Role | Can Create | Can Assign | Can Approve | Can Configure |
| --- | --- | --- | --- | --- |
| **Viewer** | ❌ | ❌ | ❌ | ❌ |
| **Member** | ✅ | ✅ (own) | ❌ | ❌ |
| **Manager** | ✅ | ✅ (team) | ✅ (team) | ❌ |
| **Admin** | ✅ | ✅ (all) | ✅ (all) | ✅ (limited) |
| **Owner** | ✅ | ✅ (all) | ✅ (all) | ✅ (full) |

### Layer 4: Per-Person Overrides

Individual exceptions without code changes:

```
Sarah (normally Manager) → Add override "Can approve financial tasks"
Mike (normally Member) → Add override "Can view HR records"
```

Overrides are checked by triggers and stored in `public.role_overrides` table.

## Authentication

### Sign-Up

**Disabled by default.** Users are created by administrators only.

This prevents:
- Random people registering
- Domain takeover via email
- Account enumeration

### Password Requirements

- Minimum 12 characters
- Complexity check (uppercase, lowercase, numbers, symbols)
- Not in common password list
- History: cannot reuse last 5 passwords

### Session Management

- Sessions expire after 7 days
- Inactivity timeout: 30 minutes (configurable per role)
- Logout clears token and cookies
- MFA available (if enabled)

### API Keys

- Service role key is **server-only** (never in browser bundle)
- Anon key has limited, scoped permissions
- API keys are rotated in production monthly
- Leaked keys are immediately revoked

## Data Isolation

### Multi-Tenant Architecture

Each organization is isolated by `organization_id`:

```sql
-- User sees only their org's tasks
SELECT * FROM public.tasks
WHERE organization_id = auth.jwt() ->> 'org_id';

-- Cross-org access denied at database level
```

### Department Isolation

Within an organization, departments provide secondary isolation:

```sql
-- Manager sees only their department's data
WHERE department_id = (
  SELECT department_id FROM public.users 
  WHERE id = auth.uid()
)
```

### Per-Row Security

Some tables have per-row policies:

```sql
-- Task visible only to creator, assignee, or manager
WHERE 
  auth.uid() = created_by
  OR auth.uid() = assigned_to
  OR (SELECT role FROM public.users WHERE id = auth.uid()) = 'manager'
```

## Secrets Management

### Environment Variables

All secrets stored in environment variables, never hardcoded:

```
✅ SUPABASE_SERVICE_ROLE_KEY (server only)
✅ ANTHROPIC_API_KEY (server only)
✅ RESEND_API_KEY (server only)
❌ Never in version control
❌ Never in browser bundle
```

### Encryption at Rest

- Database uses Postgres encryption
- Secrets encrypted via AWS KMS (Vercel)
- Backups encrypted and separated

### Encryption in Transit

- All traffic: HTTPS/TLS
- API: Bearer token in Authorization header
- Database: SSL connection
- Email: Resend/SendGrid over HTTPS

## Audit Logging

Every operation is logged:

```sql
CREATE TABLE public.audit_log (
  id UUID PRIMARY KEY,
  table_name TEXT,
  operation TEXT, -- INSERT, UPDATE, DELETE
  user_id UUID,
  timestamp TIMESTAMP,
  old_values JSONB,
  new_values JSONB,
  organization_id UUID
);
```

**What's logged:**
- Who performed the action
- When it happened
- What changed
- From which IP/app

**Retention:** 2 years by default

**Access:** Only organization owner and auditors can read

### Audit Trail Example

```json
{
  "timestamp": "2024-01-08T10:30:00Z",
  "user_id": "sarah-uuid",
  "action": "UPDATE task status",
  "task_id": "123e4567...",
  "old_status": "in_progress",
  "new_status": "done",
  "organization_id": "org-uuid"
}
```

## Permission Checks

### Pre-Operation Check (UI)

Shows/hides buttons based on role:

```typescript
if (canEditTask(userRole)) {
  return <EditButton />;  // Show button
}
// Button not shown (but doesn't prevent operation)
```

### Actual Authorization (Database)

```sql
-- RLS policy runs regardless
UPDATE public.tasks SET status = 'done'
WHERE id = $1
-- Database checks: Is this user allowed to UPDATE?
-- If not: 42501 (permission denied) error
```

### Layered Defense

1. **UI hides what you can't do** (convenience)
2. **API re-checks permissions** (prevents circumvention)
3. **Database enforces with RLS** (final authority)
4. **Triggers prevent invalid state** (business logic)

This "defense in depth" means:
- Even if we remove all UI checks, security remains
- Even if someone crafts a direct API call, RLS blocks it
- Even if they hack the API, triggers prevent bad data

## Compliance

### GDPR Compliance

- ✅ Data subject access requests (export)
- ✅ Right to be forgotten (delete account + data)
- ✅ Data portability (download all data)
- ✅ Audit logging (who did what, when)
- ✅ DPA available (on request)

**Data export:**
```bash
# User can export their own data
GET /api/export  # Returns JSON of all accessible records
```

**Data deletion:**
```bash
# Admin can delete user account + linked data
DELETE /api/users/{id}
# Triggers: removes tasks, comments, notifications, etc.
# Keeps: audit log entries (anonymized)
```

### SOC 2 Compliance

- ✅ Access controls (RLS, roles)
- ✅ Audit logging (2-year retention)
- ✅ Change tracking (audit trail)
- ✅ Data encryption (at rest, in transit)
- ✅ Disaster recovery (automated backups)
- ✅ Incident response (security policy)

### HIPAA Compliance (Healthcare)

If handling protected health information:

- ✅ Row-level access control
- ✅ Audit logging required
- ✅ Encrypted communications
- ⚠️ BAA required (Business Associate Agreement)
- ⚠️ Additional encryption policies needed

Contact support@aiautomatedtaskmanager.dev for HIPAA setup.

## Attack Prevention

### SQL Injection

**Protected by:**
- Parameterized queries (no string concatenation)
- Supabase PostgREST validation
- Prepared statements throughout

### XSS (Cross-Site Scripting)

**Protected by:**
- React auto-escaping
- DOMPurify on user input
- Content Security Policy headers
- Markdown sanitization

### CSRF (Cross-Site Request Forgery)

**Protected by:**
- SameSite cookie policy
- State verification
- Double-submit tokens

### Brute Force

**Protected by:**
- Rate limiting: 5 failed attempts → 15 min lockout
- IP-based rate limiting
- Supabase built-in protection

### Privilege Escalation

**Protected by:**
- RLS policies verify auth.uid() = owner
- Roles are stored immutably in database
- Triggers prevent role changes by non-owners

### Insecure Deserialization

**Protected by:**
- JSON schema validation
- TypeScript type checking
- Input sanitization

## Third-Party Security

### Supabase

- SOC 2 Type II certified
- ISO 27001 certified
- GDPR compliant
- Regular security audits

### Vercel

- SOC 2 Type II certified
- DDoS protection built-in
- CDN security
- Automated HTTPS

### Claude (Anthropic)

- SOC 2 Type II certified
- GDPR compliant
- Encrypted communications
- Enterprise data handling

## Security Hardening Checklist

For production deployment:

- [ ] Change default admin password
- [ ] Enable MFA for all admin accounts
- [ ] Verify Supabase security settings
- [ ] Review and test RLS policies
- [ ] Set up audit log monitoring
- [ ] Configure rate limiting
- [ ] Enable database backups
- [ ] Test data retention policies
- [ ] Review third-party integrations
- [ ] Document your security policy

## Incident Response

If you suspect a security issue:

1. **Do not** post details in GitHub Issues
2. **Email** security@aiautomatedtaskmanager.dev with:
   - Description of vulnerability
   - Steps to reproduce (if applicable)
   - Your contact information

We'll:
- Acknowledge within 24 hours
- Investigate promptly
- Issue patch if needed
- Credit you in release notes (if desired)

## Reporting Security Vulnerabilities

**Responsible Disclosure Policy**

We follow the standard responsible disclosure process:

1. Report privately (don't post publicly)
2. Allow 90 days for patch development
3. Coordinate disclosure timing
4. Acknowledge responsible reporters

## Security Best Practices

### For Users

1. **Use strong passwords** (16+ characters, random)
2. **Enable MFA** (if available)
3. **Log out** when leaving your device
4. **Report suspicious activity** immediately
5. **Don't share credentials** with others

### For Administrators

1. **Regular backups** (daily minimum)
2. **Monitor audit logs** for suspicious activity
3. **Update dependencies** (check for advisories)
4. **Review access** quarterly
5. **Test disaster recovery** annually

### For Developers

1. **Never commit secrets** to version control
2. **Use environment variables** for sensitive data
3. **Validate all input** (server-side)
4. **Sanitize all output** (for display)
5. **Update dependencies** regularly

## Contact

- **Security Issues**: security@aiautomatedtaskmanager.dev
- **General Questions**: support@aiautomatedtaskmanager.dev
- **GitHub**: Report on GitHub (non-sensitive issues only)

## See Also

- [API_REFERENCE.md](API_REFERENCE.md) — API security notes
- [MCP_GUIDE.md](MCP_GUIDE.md) — MCP security
- [CONTRIBUTING.md](../CONTRIBUTING.md) — Permission changes in PRs
- [docs/FEATURES_AND_BENEFITS.md](FEATURES_AND_BENEFITS.md) — Security benefits

---

Questions about security? Open a GitHub Discussion or email support@aiautomatedtaskmanager.dev
