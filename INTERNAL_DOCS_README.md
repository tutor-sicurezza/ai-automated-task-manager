# TaskFlow Internal Documentation

**⚠️ CONFIDENTIAL - INTERNAL REPOSITORY USE ONLY**

This directory contains sensitive system documentation. **DO NOT share publicly or commit to public repositories.**

---

## Documents Overview

### 📘 WEBMASTER_GUIDE.md
**Complete technical reference for system administrators**

**What's inside:**
- Database (Spark KV) management and architecture
- Email system configuration and SMTP integration
- Data persistence and why data might disappear
- Backup and recovery procedures
- Troubleshooting common issues
- Security best practices
- Emergency commands and data inspection tools

**When to use:**
- Setting up email delivery
- Investigating data loss
- Performing backups/restores
- Troubleshooting technical issues
- Understanding how data persistence works

---

### 🔒 SECURITY_CHECKLIST.md
**Pre-deployment and ongoing security audit checklist**

**What's inside:**
- Pre-deployment security audit checklist
- Regular maintenance schedules
- Incident response procedures
- Code security guidelines
- Email security best practices
- Dependency management
- Compliance requirements (GDPR, etc.)

**When to use:**
- Before each deployment
- Weekly/monthly security reviews
- After security incidents
- When adding new features
- During code reviews

---

## Quick Start Guide

### For New Team Members

1. **Read WEBMASTER_GUIDE.md first** to understand:
   - How data is stored (Spark KV, not traditional database)
   - Why you must use functional updates
   - How to backup and restore data

2. **Review SECURITY_CHECKLIST.md** before making changes:
   - Never commit API keys
   - Always validate user input
   - Check permissions before operations

3. **Test locally first:**
   - Make a backup before testing
   - Use browser console commands to inspect data
   - Verify changes work before deploying

---

## Critical Information

### ⚠️ Data Loss Prevention

**The #1 cause of data loss is using stale closures:**

```typescript
// ❌ WRONG - Will lose data!
const addTask = () => {
  setTasks([...tasks, newTask]);  // 'tasks' is stale
};

// ✅ CORRECT - Safe
const addTask = () => {
  setTasks((currentTasks) => [...currentTasks, newTask]);
};
```

**ALWAYS use functional updates with `useKV` hook!**

---

### 🔑 API Keys & Secrets

**Never commit these to Git:**
- Email service API keys (SendGrid, AWS SES, etc.)
- Database credentials (if using external DB)
- OAuth tokens
- Encryption keys
- Production environment variables

**Where to store them:**
- Spark KV store (via Super Admin Settings UI)
- `.env.local` files (in `.gitignore`)
- Secure password manager for team sharing

---

### 📦 Backup Strategy

**Frequency:**
- **Before deployments:** Always export data
- **Daily:** Automatic backups (set up via guide)
- **Weekly:** Test restore process
- **Monthly:** Off-site backup verification

**How to backup:**
1. Click "Data Management" button in app header
2. Click "Export All Data"
3. Save JSON file securely
4. Store in multiple locations

**How to restore:**
1. Click "Data Management"
2. Click "Import Data"
3. Select backup file
4. Confirm and refresh page

---

## Common Tasks

### Granting Super Admin Access

```javascript
// Via browser console
const employees = await spark.kv.get('employees');
const targetEmployee = employees.find(e => e.name === 'USERNAME');
const updated = employees.map(e => 
  e.id === targetEmployee.id 
    ? { ...e, userRole: 'admin' }
    : e
);
await spark.kv.set('employees', updated);
location.reload();
```

### Checking Data Storage

```javascript
// See all stored keys
await spark.kv.keys();

// Check data size
const keys = await spark.kv.keys();
for (const key of keys) {
  const data = await spark.kv.get(key);
  const size = JSON.stringify(data).length;
  console.log(`${key}: ${(size / 1024).toFixed(2)} KB`);
}
```

### Clearing Old Notifications

```javascript
// Remove notifications older than 90 days
const notifications = await spark.kv.get('notifications') || [];
const cutoff = Date.now() - (90 * 24 * 60 * 60 * 1000);
const recent = notifications.filter(n => 
  new Date(n.createdAt).getTime() > cutoff
);
await spark.kv.set('notifications', recent);
console.log(`Removed ${notifications.length - recent.length} old notifications`);
```

---

## Getting Help

### Internal Support
1. Check WEBMASTER_GUIDE.md troubleshooting section
2. Review recent Git commits for changes
3. Check browser console for errors
4. Test on clean Spark instance

### External Support
- **Spark Platform:** spark.github.com
- **React Issues:** reactjs.org
- **npm Packages:** Check package's GitHub issues

---

## Development Workflow

### Making Changes Safely

1. **Create backup**
   ```bash
   # Via app UI: Data Management → Export
   ```

2. **Make changes on feature branch**
   ```bash
   git checkout -b feature/your-feature
   ```

3. **Test thoroughly**
   - Test with real data
   - Test edge cases
   - Verify data persists after refresh

4. **Backup again before deployment**
   ```bash
   # Export data before merging to main
   ```

5. **Deploy and verify**
   - Check console for errors
   - Verify data integrity
   - Test core functionality

---

## Security Reminders

### Before Every Commit

- [ ] No API keys in code
- [ ] No sensitive data in console.logs
- [ ] User input is validated
- [ ] Permissions are checked
- [ ] Secrets are in `.env.local` or Spark KV

### Before Every Deployment

- [ ] Backup created
- [ ] Security checklist completed
- [ ] Dependencies audited (`npm audit`)
- [ ] Testing completed
- [ ] Rollback plan ready

---

## File Organization

```
/workspaces/spark-template/
├── WEBMASTER_GUIDE.md          ← Main technical guide
├── SECURITY_CHECKLIST.md        ← Security audit checklist
├── INTERNAL_DOCS_README.md      ← This file
├── .gitignore                   ← Keeps docs private
├── src/
│   ├── components/              ← React components
│   ├── lib/
│   │   ├── types.ts            ← Type definitions
│   │   ├── permissions.ts      ← Permission logic
│   │   └── notificationSounds.ts
│   └── App.tsx                  ← Main application
└── package.json
```

---

## Maintenance Schedule

### Daily
- Monitor error logs
- Check backup completion

### Weekly
- Review audit logs
- Update security checklist
- Verify data integrity

### Monthly
- Update dependencies
- Test backup restore
- Review user permissions
- Clean old data

### Quarterly
- Full security audit
- Documentation review
- Disaster recovery test

---

## Emergency Procedures

### System Down
1. Check browser console errors
2. Verify Spark runtime is running
3. Check recent Git commits
4. Rollback if needed
5. Restore from backup

### Data Corrupted
1. Stop all operations
2. Identify last good backup
3. Restore from backup (see WEBMASTER_GUIDE.md)
4. Verify data integrity
5. Document incident

### Security Breach
1. Revoke all API keys immediately
2. Check audit logs
3. Change all credentials
4. Follow SECURITY_CHECKLIST.md incident response
5. Notify affected users

---

## Contact Information

### Internal Team
- **Primary Admin:** [Name/Email]
- **Backup Admin:** [Name/Email]
- **Security Lead:** [Name/Email]

### Emergency
- **After Hours:** [Phone/Contact]
- **Critical Issues:** [Escalation Process]

---

## Version History

| Version | Date | Changes | Updated By |
|---------|------|---------|------------|
| 1.0 | 2024 | Initial documentation | Spark Agent |
| | | | |
| | | | |

---

## Contributing to These Docs

**When to update:**
- System architecture changes
- New security requirements
- New features added
- Incidents or bugs discovered
- Process improvements

**How to update:**
1. Edit relevant markdown file
2. Update version history
3. Review with team
4. Commit to repository (ensure still in .gitignore)

---

**⚠️ REMEMBER: These documents are CONFIDENTIAL**

Do not:
- Share on public forums
- Commit to public repositories
- Send via unencrypted email
- Store in shared public drives

Keep them:
- In private Git repositories only
- In encrypted storage
- On need-to-know basis
- Updated and accurate

---

**Last Updated:** 2024  
**Next Review:** [Set Date]
