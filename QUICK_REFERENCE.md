# SMTP & Database Quick Reference Card

**⚠️ CONFIDENTIAL - Quick reference for administrators**

---

## 📧 Email Setup Quick Start

### Fastest Setup: SendGrid (Recommended)

1. **Sign up:** [sendgrid.com](https://sendgrid.com/) (Free: 100 emails/day)
2. **Create API Key:**
   - Settings → API Keys → Create API Key
   - Copy key (shown only once!)
3. **SMTP Settings:**
   ```
   Host: smtp.sendgrid.net
   Port: 587
   Username: apikey
   Password: [Your API key]
   ```

### Alternative: Gmail (Testing Only)

1. **Enable 2FA:** Google Account → Security → 2-Step Verification
2. **App Password:** Security → App passwords → Generate
3. **SMTP Settings:**
   ```
   Host: smtp.gmail.com
   Port: 587
   Username: your-email@gmail.com
   Password: [16-char app password]
   ```

**⚠️ Note:** Gmail has strict sending limits (500/day). Not for production!

---

## 💾 Database Quick Facts

### Current Storage: Spark KV Store

- **No setup needed** - Works automatically
- **~10MB limit per user** - Good for 1000+ tasks
- **Browser-independent** - Survives page refresh
- **Real-time** - Updates instantly

### Critical Rule: Use Functional Updates!

```typescript
// ❌ WRONG - Will lose data!
setTasks([...tasks, newTask])

// ✅ CORRECT - Always safe
setTasks(current => [...current, newTask])
```

### When to Consider External Database

- More than 100 active users
- More than 5,000 tasks
- Need advanced queries/reporting
- Require audit trails
- Multi-tenant deployment

**Recommended:** Supabase (PostgreSQL, free 500MB)

---

## 🔧 Emergency Commands

### Browser Console Quick Access

```javascript
// View all data keys
await spark.kv.keys()

// Export all data
const keys = await spark.kv.keys()
const backup = {}
for (const key of keys) {
  backup[key] = await spark.kv.get(key)
}
console.log(JSON.stringify(backup, null, 2))

// Make someone super admin
const employees = await spark.kv.get('employees')
const updated = employees.map(e => 
  e.name === 'USERNAME' ? {...e, userRole: 'admin'} : e
)
await spark.kv.set('employees', updated)
location.reload()

// Check storage size
const keys = await spark.kv.keys()
let total = 0
for (const key of keys) {
  const data = await spark.kv.get(key)
  total += JSON.stringify(data).length
}
console.log(`Total: ${(total/1024).toFixed(2)} KB`)
```

---

## 📋 Daily Checklist

### Before Deployment
- [ ] Export current data (Data Management → Export)
- [ ] Test changes in dev environment
- [ ] Check browser console for errors
- [ ] Verify functional updates used
- [ ] Review security checklist

### After Deployment
- [ ] Verify app loads correctly
- [ ] Check data integrity (no data loss)
- [ ] Test core functionality
- [ ] Monitor for errors (first hour)
- [ ] Keep backup file for 24 hours

---

## 🚨 Common Issues & Fixes

### "Users disappeared!"
**Fix:** Check if using functional updates
```javascript
const employees = await spark.kv.get('employees')
console.log(employees) // Still there?
// If yes: refresh page
// If no: restore from backup
```

### "Tasks not saving!"
**Fix:** Use functional updates everywhere
```typescript
// Search code for this pattern:
setTasks([...tasks, ...]) // ❌ Replace with:
setTasks(current => [...current, ...]) // ✅
```

### "Email not sending!"
**Fix:** Check these in order:
1. SMTP credentials correct?
2. Port not blocked by firewall?
3. API key still valid?
4. Rate limit exceeded?
5. Check provider dashboard for errors

### "Storage quota exceeded!"
**Fix:** Clean old data
```javascript
// Remove old notifications (>90 days)
const notifs = await spark.kv.get('notifications') || []
const cutoff = Date.now() - (90 * 24 * 60 * 60 * 1000)
const recent = notifs.filter(n => 
  new Date(n.createdAt).getTime() > cutoff
)
await spark.kv.set('notifications', recent)
```

---

## 🔐 Security Essentials

### Never Commit These:
- ❌ API keys
- ❌ SMTP passwords
- ❌ `.env` files
- ❌ `*backup*.json` files
- ❌ Database credentials

### Always Check:
- ✅ `.gitignore` includes `.env`
- ✅ No `console.log()` with sensitive data
- ✅ User input is validated
- ✅ Permissions checked before operations
- ✅ Secrets stored in Spark KV or `.env.local`

---

## 📖 Full Documentation

| Document | Purpose |
|----------|---------|
| **SMTP_SETUP_GUIDE.md** | Complete email service setup |
| **DATABASE_SETUP_GUIDE.md** | Data persistence & external DB |
| **WEBMASTER_GUIDE.md** | Full technical reference |
| **SECURITY_CHECKLIST.md** | Security audit procedures |
| **INTERNAL_DOCS_README.md** | Documentation overview |

---

## 📞 Quick Support Path

1. **Check browser console** for errors
2. **Review WEBMASTER_GUIDE.md** troubleshooting section
3. **Check recent Git commits** for breaking changes
4. **Restore from backup** if data corrupted
5. **Contact team lead** if still stuck

---

## 💡 Pro Tips

### Data Safety
- Always backup before code changes
- Test restore process monthly
- Use functional updates 100% of the time
- Monitor storage usage weekly

### Email Delivery
- Start with SendGrid (easiest setup)
- Set up SPF/DKIM for better deliverability
- Test email templates before going live
- Monitor bounce rates and complaints

### Performance
- Archive completed tasks older than 6 months
- Clean notifications older than 90 days
- Use pagination for large lists
- Consider external DB at 100+ users

### Development
- Make changes on feature branches
- Test with real data volumes
- Check console for warnings
- Document custom configurations

---

## 🎯 Success Metrics

### Email System Health
- ✅ Delivery rate > 95%
- ✅ Bounce rate < 2%
- ✅ Complaint rate < 0.1%
- ✅ Open rate > 20%

### Data System Health
- ✅ No data loss incidents
- ✅ Backup completion rate 100%
- ✅ Storage < 80% of limit
- ✅ Zero corruption errors

### Application Health
- ✅ Uptime > 99.9%
- ✅ Page load < 2 seconds
- ✅ Zero console errors
- ✅ All features functional

---

**Last Updated:** January 2025  
**For:** TaskFlow Administrators  
**Classification:** CONFIDENTIAL

**Keep this card handy - bookmark or print!**
