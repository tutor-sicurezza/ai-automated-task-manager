# TaskFlow Security Checklist

**⚠️ CONFIDENTIAL - FOR REPOSITORY USE ONLY**

Use this checklist before deploying or making significant system changes.

---

## Pre-Deployment Security Audit

### Data Protection
- [ ] Verified all API keys are stored in Spark KV, not in code
- [ ] Confirmed no secrets in Git history
- [ ] `.env.local` is in `.gitignore`
- [ ] Backup created and stored securely off-site
- [ ] WEBMASTER_GUIDE.md is in `.gitignore` (not pushed to public repos)

### Access Control
- [ ] Super admin accounts reviewed and limited
- [ ] User role permissions tested for each role type
- [ ] Department admin permissions are properly scoped
- [ ] Guest/demo accounts have read-only access

### Email Configuration
- [ ] Email service API key secured in KV store
- [ ] From address verified and SPF/DKIM configured
- [ ] Rate limiting enabled for email sending
- [ ] Email templates sanitized (no XSS vulnerabilities)
- [ ] Unsubscribe mechanism implemented (if required)

### Data Validation
- [ ] All user inputs sanitized before storage
- [ ] File upload size limits enforced (10MB max)
- [ ] File type validation for attachments
- [ ] SQL injection prevention (N/A for KV store, but check future integrations)
- [ ] XSS prevention in comments and descriptions

### Notification System
- [ ] Desktop notification permissions properly requested
- [ ] Quiet hours respected
- [ ] Notification sounds don't auto-play without user interaction
- [ ] Users can disable notifications per type
- [ ] Notifications don't expose sensitive info in preview

### Browser Storage
- [ ] No sensitive data in localStorage (use Spark KV only)
- [ ] Session data properly managed
- [ ] Cookies are secure and httpOnly (if any)

---

## Regular Security Maintenance

### Weekly Tasks
- [ ] Review audit logs for suspicious activity
- [ ] Check for failed login attempts (if auth implemented)
- [ ] Monitor unusual data access patterns
- [ ] Verify backup completion

### Monthly Tasks
- [ ] Update npm dependencies
  ```bash
  npm outdated
  npm audit
  npm audit fix
  ```
- [ ] Review user permission changes
- [ ] Test restore from backup
- [ ] Check for abandoned user accounts

### Quarterly Tasks
- [ ] Security audit of new features
- [ ] Review and update this checklist
- [ ] Penetration testing (if applicable)
- [ ] Review third-party integrations

---

## Incident Response

### Data Breach Response
1. **Immediate Actions**
   - [ ] Identify scope of breach
   - [ ] Revoke compromised API keys
   - [ ] Force password resets (if auth exists)
   - [ ] Notify affected users

2. **Investigation**
   - [ ] Review audit logs
   - [ ] Check Git history for exposed secrets
   - [ ] Identify entry point
   - [ ] Document timeline

3. **Remediation**
   - [ ] Patch vulnerability
   - [ ] Rotate all credentials
   - [ ] Deploy security update
   - [ ] Update documentation

### Data Loss Response
1. [ ] Stop all write operations
2. [ ] Identify last known good state
3. [ ] Restore from backup (see WEBMASTER_GUIDE.md)
4. [ ] Verify data integrity
5. [ ] Document cause and prevention

---

## Code Security Guidelines

### When Adding New Features

#### API Integration Checklist
- [ ] API keys stored in Spark KV
- [ ] Rate limiting implemented
- [ ] Error messages don't expose secrets
- [ ] HTTPS only for external calls
- [ ] Input validation on all parameters

#### User Input Handling
```typescript
// ✅ GOOD - Validate and sanitize
const sanitizedInput = input.trim().slice(0, 500);
if (!/^[a-zA-Z0-9\s\-_.]+$/.test(sanitizedInput)) {
  throw new Error('Invalid input');
}

// ❌ BAD - Direct database insertion
await spark.kv.set('data', userInput); // No validation!
```

#### Permission Checks
```typescript
// ✅ GOOD - Check permissions first
if (!canPerformAction(currentEmployee, 'tasks', 'delete')) {
  toast.error('Access denied');
  return;
}
deleteTask(taskId);

// ❌ BAD - No permission check
deleteTask(taskId); // Anyone can delete!
```

---

## Email Security

### SMTP Configuration Security
- [ ] Use TLS/SSL for SMTP connections
- [ ] Never log email content or passwords
- [ ] Implement SPF records for your domain
- [ ] Set up DKIM signing
- [ ] Configure DMARC policy

### Email Template Security
- [ ] All variables properly escaped
- [ ] No executable JavaScript in templates
- [ ] HTML sanitized before sending
- [ ] Links use HTTPS only
- [ ] Unsubscribe link present (legal requirement)

### Anti-Spam Measures
- [ ] Rate limiting per user (100 emails/hour recommended)
- [ ] Rate limiting per IP (if applicable)
- [ ] Email validation before sending
- [ ] Bounce handling implemented
- [ ] Complaint handling process

---

## Database Security (Spark KV)

### Data Encryption
- [ ] Sensitive data encrypted at rest (handled by Spark)
- [ ] No plaintext passwords stored
- [ ] Personal data minimized

### Data Access Patterns
```typescript
// ✅ GOOD - Scoped data access
const userTasks = tasks.filter(t => 
  t.assigneeId === currentUser.id || 
  canViewAllTasks(currentUser)
);

// ❌ BAD - Exposing all data
const allTasks = await spark.kv.get('tasks');
return allTasks; // Users see everything!
```

### Backup Security
- [ ] Backups encrypted if containing PII
- [ ] Backup storage access controlled
- [ ] Backup retention policy defined
- [ ] Old backups securely deleted

---

## Third-Party Dependencies

### Package Security
```bash
# Run before each deployment
npm audit

# Check for critical vulnerabilities
npm audit --audit-level=critical

# Auto-fix non-breaking updates
npm audit fix

# Manual review for breaking changes
npm audit fix --force  # Use with caution!
```

### Dependency Review Checklist
- [ ] No packages with known critical vulnerabilities
- [ ] Dependencies are from trusted sources (npm verified)
- [ ] Package versions pinned (not using `^` or `~` in production)
- [ ] Unused packages removed
- [ ] License compliance verified

---

## Environment-Specific Settings

### Development Environment
```bash
# .env.local (development)
VITE_ENABLE_DEBUG_MODE=true
VITE_ENABLE_EMAIL_DELIVERY=false  # Use mock emails
VITE_RATE_LIMIT_DISABLED=true
```

### Production Environment
```bash
# .env.local (production)
VITE_ENABLE_DEBUG_MODE=false
VITE_ENABLE_EMAIL_DELIVERY=true
VITE_RATE_LIMIT_DISABLED=false
VITE_APP_URL=https://yourdomain.com
```

### Security Headers (if using custom server)
```typescript
// Add these headers in production
{
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'X-XSS-Protection': '1; mode=block',
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'"
}
```

---

## Compliance & Legal

### GDPR Compliance (if applicable)
- [ ] User consent for data collection
- [ ] Privacy policy published
- [ ] Right to access implemented (export data)
- [ ] Right to erasure implemented (delete account)
- [ ] Data processing records maintained
- [ ] Data breach notification process (72 hours)

### Data Retention
- [ ] Completed tasks archived after 6 months
- [ ] Old notifications deleted after 90 days
- [ ] Inactive accounts flagged after 1 year
- [ ] Audit logs retained for 2 years minimum

---

## Emergency Contacts

### Security Issues
**Primary:** [Your IT Security Team]  
**Email:** security@yourcompany.com  
**Phone:** [Emergency Number]

### Platform Issues
**Spark Support:** spark.github.com  
**Email:** support@spark.github.com

### Service Providers
**Email Service (SendGrid):**  
- Dashboard: https://app.sendgrid.com
- Support: support@sendgrid.com

---

## Security Testing

### Before Each Release
```bash
# 1. Run linting
npm run lint

# 2. Check for security issues
npm audit

# 3. Test authentication flows
# Manual: Try accessing admin features as regular user

# 4. Test data isolation
# Manual: Verify users can't see others' private data

# 5. Test rate limiting
# Manual: Try sending 100+ notifications rapidly

# 6. Test backup/restore
# Manual: Export → Clear → Import → Verify
```

---

## Red Flags - Immediate Action Required

### Critical Security Issues
🚨 **If you see any of these, stop and fix immediately:**

1. **API keys in code**
   ```typescript
   const API_KEY = "sk_live_abc123";  // 🚨 NEVER DO THIS
   ```

2. **No permission checks**
   ```typescript
   app.delete('/tasks/:id', (req, res) => {
     deleteTask(req.params.id);  // 🚨 Anyone can delete!
   });
   ```

3. **SQL injection vulnerable** (if using SQL later)
   ```typescript
   query(`SELECT * FROM users WHERE id = ${userId}`);  // 🚨 Vulnerable
   ```

4. **Unvalidated redirects**
   ```typescript
   window.location = req.query.redirect;  // 🚨 Phishing risk
   ```

5. **Sensitive data in logs**
   ```typescript
   console.log(user.password);  // 🚨 Never log passwords
   ```

---

## Security Resources

### Learning Resources
- OWASP Top 10: https://owasp.org/www-project-top-ten/
- Spark Security Best Practices: [Spark Docs]
- npm Security Best Practices: https://docs.npmjs.com/security

### Tools
- npm audit: Built-in security checker
- Snyk: Advanced dependency scanning
- GitHub Security Advisories: Automatic vulnerability alerts

---

**Document Version:** 1.0  
**Last Security Audit:** [Date]  
**Next Audit Due:** [Date]  
**Audited By:** [Name]

⚠️ **Keep this checklist updated with each security change or incident!**
