# SendGrid Quick Start

## Super Admin Setup (5 minutes)

### 1. Get SendGrid API Key
```
1. Go to sendgrid.com
2. Sign up (free: 100 emails/day)
3. Settings → API Keys → Create API Key
4. Copy the key (shown only once!)
```

### 2. Verify Sender Email
```
1. Settings → Sender Authentication
2. Verify a Single Sender
3. Enter your email
4. Click verification link in inbox
```

### 3. Configure in TaskFlow
```
1. Log in as Super Admin
2. System Settings → Email tab
3. Provider: SendGrid
4. Paste API key
5. Test Connection ✓
6. From Email: your-verified-email@domain.com
7. From Name: TaskFlow
8. Send Test Email ✓
9. Enable service ✓
10. Save
```

## Status Check

✅ Connection successful
✅ Test email received
✅ Service enabled
✅ Ready to go!

## Common Issues

### "Connection failed"
→ Double-check API key

### "Test email not received"
→ Check spam folder
→ Verify sender email

### "Emails not sending"
→ Toggle service to Enabled
→ Check Statistics tab

## Email Notifications

Users automatically receive emails for:
- New task assignments
- Task status changes
- Comments on their tasks
- Upcoming due dates
- Department announcements

## Monitor Performance

System Settings → Email → Statistics:
- Total sent
- Delivery rate
- Failed count
- Last sent time

## Need More?

📖 See SENDGRID_INTEGRATION_GUIDE.md for complete documentation
📖 See SMTP_SETUP_GUIDE.md for detailed provider setup

## Support

- SendGrid Dashboard: app.sendgrid.com
- Documentation: docs.sendgrid.com
- DNS Records: Use their domain authentication wizard
- Daily Limit: 100 emails (free tier)
