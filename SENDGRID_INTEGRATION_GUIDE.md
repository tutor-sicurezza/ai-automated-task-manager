# SendGrid Email Integration Guide

## Overview

TaskFlow now supports live email delivery through SendGrid (or Resend) for sending task notifications, reminders, and system alerts to users.

## Features

✅ **Dual Provider Support**: Choose between SendGrid and Resend
✅ **Live SMTP Delivery**: Real-time email sending via API
✅ **Email Configuration UI**: Easy setup through Super Admin Settings
✅ **Connection Testing**: Test your API key before enabling
✅ **Test Email Sending**: Send test emails to verify configuration
✅ **Email Statistics**: Track sent, delivered, and failed emails
✅ **Delivery Rate Tracking**: Monitor email performance
✅ **Automatic Logging**: All emails logged in delivery logs

## Setup Instructions

### Step 1: Create SendGrid Account

1. Go to [SendGrid.com](https://sendgrid.com/)
2. Sign up for a free account (100 emails/day)
3. Verify your email address

### Step 2: Generate API Key

1. Log in to SendGrid Dashboard
2. Navigate to **Settings** → **API Keys**
3. Click **Create API Key**
4. Name it "TaskFlow"
5. Choose **Full Access** or **Restricted Access** (minimum: Mail Send permission)
6. Click **Create & View**
7. **Copy the API key** (you won't see it again!)

### Step 3: Verify Sender Identity

**Option A: Single Sender Verification (Quick - For Testing)**
1. Go to **Settings** → **Sender Authentication**
2. Click **Verify a Single Sender**
3. Enter your email address
4. Check your inbox and click the verification link
5. Your email is now verified!

**Option B: Domain Authentication (Recommended - For Production)**
1. Go to **Settings** → **Sender Authentication**
2. Click **Authenticate Your Domain**
3. Enter your domain (e.g., yourdomain.com)
4. Add the provided DNS records to your domain registrar:
   - CNAME records for SendGrid authentication
   - Usually 3 CNAME records are required
5. Wait for DNS propagation (up to 48 hours)
6. Return to SendGrid and click **Verify**

### Step 4: Configure in TaskFlow

1. Log in to TaskFlow as Super Admin
2. Click **System Settings** in the top navigation
3. Go to the **Email** tab
4. Select **SendGrid** as the provider
5. Enter your API key
6. Click **Test Connection** to verify
7. Set **From Name**: `TaskFlow` (or your preferred name)
8. Set **From Email**: The email you verified in Step 3
9. (Optional) Set **Reply-To Email** for user replies
10. Click **Save Configuration**

### Step 5: Test Email Delivery

1. In the **Testing** tab
2. Enter your email address
3. Click **Send Test Email**
4. Check your inbox (and spam folder)
5. If successful, you'll receive a test email from TaskFlow

### Step 6: Enable Email Service

1. In the **Configuration** tab
2. Toggle **Email Notifications** to **Enabled**
3. Click **Save Configuration**
4. Done! Emails will now be sent automatically

## Configuration Options

### Provider Selection

- **SendGrid**: 100 emails/day free tier, excellent deliverability
- **Resend**: 100 emails/day free tier, developer-friendly API

### Sender Information

- **From Name**: Display name users see (e.g., "TaskFlow Notifications")
- **From Email**: Must be verified with your provider
- **Reply-To Email**: Optional - where user replies are sent

### Service Status

- **Enabled**: Users receive email notifications
- **Disabled**: No emails are sent (notifications still appear in-app)

## Email Statistics

Track your email performance in the **Statistics** tab:

- **Total Sent**: Number of emails attempted
- **Delivered**: Successfully delivered emails
- **Failed**: Emails that failed to send
- **Delivery Rate**: Percentage of successful deliveries
- **Last Sent**: Timestamp of most recent email

## Email Types

TaskFlow sends the following email notifications:

### Task Notifications
- New task assignment
- Task reassignment
- Task status change
- Task completion
- Task comment added
- Task due date approaching

### System Notifications
- Department announcements
- System alerts
- Account changes

## Troubleshooting

### Emails Not Sending

**Problem**: Test email fails or no emails are sent

**Solutions**:
1. Verify API key is correct
2. Check that sender email is verified
3. Ensure email service is **Enabled**
4. Check email statistics for failed count
5. Review browser console for errors
6. Verify you haven't exceeded daily limits

### Emails Going to Spam

**Problem**: Emails arrive in spam folder

**Solutions**:
1. Set up domain authentication (not single sender)
2. Add SPF, DKIM, and DMARC records to DNS
3. Use a professional domain (not @gmail.com)
4. Warm up your sending gradually
5. Avoid spam trigger words in content

### Connection Test Fails

**Problem**: "Connection failed - Invalid API key"

**Solutions**:
1. Double-check API key was copied correctly
2. Ensure API key has Mail Send permission
3. Try generating a new API key
4. Check SendGrid account is active

### DNS Records Not Verifying

**Problem**: Domain authentication stuck on "Pending"

**Solutions**:
1. Wait up to 48 hours for DNS propagation
2. Verify DNS records were added exactly as shown
3. Check records using [DNS Checker](https://dnschecker.org/)
4. Contact your domain registrar for help
5. Try removing and re-adding the records

## API Integration Details

### SendGrid API v3

```typescript
// Endpoint
POST https://api.sendgrid.com/v3/mail/send

// Headers
Authorization: Bearer {API_KEY}
Content-Type: application/json

// Body
{
  personalizations: [{
    to: [{ email: "user@example.com" }],
    custom_args: {
      tenant_id: "...",
      sent_by: "..."
    }
  }],
  from: {
    email: "notifications@yourdomain.com",
    name: "TaskFlow"
  },
  subject: "New Task Assignment",
  content: [
    { type: "text/plain", value: "..." },
    { type: "text/html", value: "..." }
  ]
}
```

### Response

```typescript
// Success
Status: 202 Accepted
Headers: X-Message-Id: {MESSAGE_ID}

// Error
Status: 400/401/403
Body: { errors: [...] }
```

## Best Practices

### Security

✅ **DO**:
- Store API keys securely (never commit to git)
- Use environment variables for production
- Rotate API keys every 90 days
- Use restricted access API keys
- Enable two-factor auth on SendGrid account

❌ **DON'T**:
- Share API keys in plain text
- Use full access if not needed
- Hardcode credentials in code
- Expose API keys in client-side code

### Email Content

✅ **DO**:
- Use clear, descriptive subject lines
- Include plain text version
- Add unsubscribe link (for bulk emails)
- Use responsive HTML templates
- Include company/app information

❌ **DON'T**:
- Use ALL CAPS in subject
- Include too many links
- Use spam trigger words
- Send without user consent
- Include sensitive data in plain text

### Sending Volume

✅ **DO**:
- Start with low volume and increase gradually
- Monitor bounce and complaint rates
- Respect user preferences
- Implement rate limiting
- Use email batching for bulk sends

❌ **DON'T**:
- Send maximum volume immediately
- Ignore bounce notifications
- Send to unverified addresses
- Retry failed sends indefinitely

## Advanced Configuration

### Environment Variables

For production deployment, set these environment variables:

```bash
# SendGrid Configuration
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxx

# Or Resend Configuration
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxx

# Supabase (Required)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Application URL
APP_URL=https://yourdomain.com
```

### DNS Records for Domain Authentication

Add these DNS records to your domain:

```dns
# SPF Record (TXT)
@ TXT "v=spf1 include:sendgrid.net ~all"

# DKIM Records (CNAME) - Get from SendGrid
s1._domainkey CNAME s1.domainkey.u12345.wl.sendgrid.net
s2._domainkey CNAME s2.domainkey.u12345.wl.sendgrid.net

# DMARC Record (TXT)
_dmarc TXT "v=DMARC1; p=none; rua=mailto:dmarc@yourdomain.com"
```

### Custom Email Templates

Email templates are defined in the application code. To customize:

1. Locate `api/email/send.ts`
2. Modify HTML/text content
3. Use variables for dynamic content
4. Test thoroughly before deploying

## Monitoring & Maintenance

### Weekly Tasks
- Check delivery rate in Statistics tab
- Review failed email count
- Monitor SendGrid dashboard for issues

### Monthly Tasks
- Review email sending volume
- Check for bounce/complaint increases
- Update email templates if needed
- Verify DNS records still valid

### Quarterly Tasks
- Rotate API keys
- Review and optimize email content
- Assess provider performance
- Update documentation

## Support Resources

### SendGrid Documentation
- [Getting Started](https://docs.sendgrid.com/for-developers/sending-email/api-getting-started)
- [API Reference](https://docs.sendgrid.com/api-reference/mail-send/mail-send)
- [Domain Authentication](https://docs.sendgrid.com/ui/account-and-settings/how-to-set-up-domain-authentication)
- [Troubleshooting](https://docs.sendgrid.com/for-developers/sending-email/getting-started-smtp)

### Resend Documentation
- [Quick Start](https://resend.com/docs/send-with-nodejs)
- [API Reference](https://resend.com/docs/api-reference/emails/send-email)
- [Domain Verification](https://resend.com/docs/dashboard/domains/introduction)

### Testing Tools
- [SMTP Tester](https://www.smtptester.com/)
- [Mail Tester](https://www.mail-tester.com/)
- [MX Toolbox](https://mxtoolbox.com/)
- [DNS Checker](https://dnschecker.org/)

## FAQ

### Q: How many emails can I send?
A: Free tier allows 100 emails/day. Paid plans offer more volume.

### Q: Can I use my Gmail account?
A: Not recommended for production. Use a professional domain.

### Q: What if I exceed the daily limit?
A: Emails will queue until the next day or upgrade to paid plan.

### Q: Do users need to verify their email?
A: No, only the sender email needs verification.

### Q: Can I switch providers later?
A: Yes, just change provider in settings and update API key.

### Q: Are emails sent immediately?
A: Yes, emails are sent in real-time via API.

### Q: Can I customize email templates?
A: Yes, templates are in the codebase (requires developer access).

### Q: What happens if SendGrid is down?
A: Emails will fail. Consider setting up a backup provider.

### Q: How do I view email logs?
A: Check SendGrid dashboard or Supabase email_delivery_logs table.

### Q: Can I send attachments?
A: Currently not supported. Coming in future update.

## Compliance

Ensure your email sending complies with:

- **CAN-SPAM Act** (US): Include unsubscribe, physical address
- **GDPR** (EU): Get consent, allow opt-out
- **CASL** (Canada): Explicit consent required
- **CCPA** (California): Right to opt-out

## Need Help?

- Review this guide thoroughly
- Check SendGrid/Resend documentation
- Test with a personal email first
- Contact your system administrator
- Review browser console for errors
- Check network tab in DevTools

---

**Version**: 1.0
**Last Updated**: January 2025
**Maintained By**: TaskFlow Development Team
