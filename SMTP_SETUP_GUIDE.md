# SMTP Email Service Setup Guide

**CONFIDENTIAL - For Repository Administrators Only**

This guide provides step-by-step instructions for setting up email notification services for the TaskFlow application using SMTP.

---

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Choosing an SMTP Provider](#choosing-an-smtp-provider)
4. [Configuration Steps](#configuration-steps)
5. [Testing Your Setup](#testing-your-setup)
6. [Troubleshooting](#troubleshooting)
7. [Security Best Practices](#security-best-practices)

---

## Overview

TaskFlow uses SMTP (Simple Mail Transfer Protocol) to send email notifications for:
- Task assignments and reassignments
- Status changes and updates
- Comment notifications
- Due date reminders
- Email digests (scheduled summaries)
- System announcements

---

## Prerequisites

Before setting up SMTP, ensure you have:

1. **Administrative access** to the TaskFlow application
2. **Access to an email service** (Gmail, Outlook, SendGrid, etc.)
3. **SMTP credentials** (host, port, username, password)
4. **Domain verification** (if using custom domain)

---

## Choosing an SMTP Provider

### Recommended Providers

#### 1. **Gmail (Google Workspace)**
- **Best for:** Small to medium teams
- **Free tier:** 500 emails/day
- **Pros:** Easy setup, reliable, familiar interface
- **Cons:** Daily sending limits, requires app password

#### 2. **SendGrid**
- **Best for:** Medium to large organizations
- **Free tier:** 100 emails/day
- **Pros:** High deliverability, detailed analytics, generous free tier
- **Cons:** Requires signup and API key setup

#### 3. **Amazon SES**
- **Best for:** Large scale deployments
- **Free tier:** 62,000 emails/month (when sent from EC2)
- **Pros:** Cost-effective, highly scalable
- **Cons:** More complex setup, requires AWS account

#### 4. **Mailgun**
- **Best for:** Developers and technical teams
- **Free tier:** 5,000 emails/month for 3 months
- **Pros:** Developer-friendly, good documentation
- **Cons:** Limited free tier

#### 5. **Microsoft 365 (Outlook)**
- **Best for:** Organizations using Microsoft ecosystem
- **Free tier:** N/A (requires subscription)
- **Pros:** Enterprise-grade, integrated with Office
- **Cons:** Requires paid subscription

---

## Configuration Steps

### Option 1: Gmail SMTP Setup

#### Step 1: Enable 2-Factor Authentication
1. Go to [Google Account Settings](https://myaccount.google.com/)
2. Navigate to **Security**
3. Enable **2-Step Verification**

#### Step 2: Generate App Password
1. After enabling 2FA, go to **App passwords**
2. Select **Mail** and **Other (Custom name)**
3. Name it "TaskFlow" and click **Generate**
4. **Copy the 16-character password** (you won't see it again)

#### Step 3: SMTP Configuration Values
```plaintext
SMTP Host: smtp.gmail.com
SMTP Port: 587 (TLS) or 465 (SSL)
SMTP Secure: true
SMTP Username: your-email@gmail.com
SMTP Password: [16-character app password]
From Email: your-email@gmail.com
From Name: TaskFlow Notifications
```

---

### Option 2: SendGrid Setup (RECOMMENDED)

#### Step 1: Create SendGrid Account
1. Go to [SendGrid](https://sendgrid.com/)
2. Sign up for a free account (100 emails/day free tier)
3. Verify your email address

#### Step 2: Create API Key
1. Navigate to **Settings** → **API Keys**
2. Click **Create API Key**
3. Choose **Full Access** or **Restricted Access** (minimum: Mail Send)
4. Name it "TaskFlow"
5. **Copy the API key** (shown only once - save it securely!)

#### Step 3: Verify Sender Identity
1. Go to **Settings** → **Sender Authentication**
2. Choose one of two options:
   - **Single Sender Verification** (Quick - for testing)
     - Click **Verify a Single Sender**
     - Enter your email address
     - Check your inbox and click verification link
   - **Domain Authentication** (Recommended - for production)
     - Click **Authenticate Your Domain**
     - Follow the DNS setup instructions
     - Wait for verification (up to 48 hours)

#### Step 4: Configure in TaskFlow
1. Log in to TaskFlow as Super Admin
2. Navigate to **Super Admin Settings** → **Email Configuration**
3. Select **SendGrid** as the provider
4. Enter your API key
5. Set **From Email** to your verified sender email
6. Set **From Name** (e.g., "TaskFlow Notifications")
7. Test the connection
8. Send a test email
9. Enable the email service

#### Configuration Values Reference
```plaintext
Provider: SendGrid
API Key: [Your SendGrid API key from Step 2]
From Email: notifications@yourdomain.com (must be verified)
From Name: TaskFlow Notifications
Reply-To: support@yourdomain.com (optional)
```

#### SendGrid API Integration
TaskFlow uses the SendGrid v3 API (not SMTP) for better deliverability and tracking:
- API Endpoint: `https://api.sendgrid.com/v3/mail/send`
- Authentication: Bearer token
- Features: Custom args, tracking, analytics

---

### Option 3: Amazon SES Setup

#### Step 1: Create AWS Account
1. Go to [AWS Console](https://aws.amazon.com/)
2. Sign up or log in to your account
3. Navigate to **Amazon SES**

#### Step 2: Verify Email Address
1. Click **Verified identities** → **Create identity**
2. Choose **Email address**
3. Enter the email you'll send from
4. Check your inbox and verify

#### Step 3: Request Production Access
1. By default, SES is in sandbox mode (limited)
2. Go to **Account dashboard**
3. Click **Request production access**
4. Fill out the form (explain use case)

#### Step 4: Create SMTP Credentials
1. Navigate to **SMTP Settings**
2. Click **Create SMTP credentials**
3. Name the user "taskflow-smtp"
4. **Download and save the credentials**

#### Step 5: SMTP Configuration Values
```plaintext
SMTP Host: email-smtp.[region].amazonaws.com
   (e.g., email-smtp.us-east-1.amazonaws.com)
SMTP Port: 587 (TLS) or 465 (SSL)
SMTP Secure: true
SMTP Username: [From SMTP credentials]
SMTP Password: [From SMTP credentials]
From Email: verified-email@yourdomain.com
From Name: TaskFlow Notifications
```

---

### Option 4: Microsoft 365 SMTP Setup

#### Step 1: Enable SMTP Authentication
1. Go to [Microsoft 365 Admin Center](https://admin.microsoft.com/)
2. Navigate to **Users** → **Active users**
3. Select the user account for sending emails
4. Go to **Mail** → **Manage email apps**
5. Enable **Authenticated SMTP**

#### Step 2: SMTP Configuration Values
```plaintext
SMTP Host: smtp.office365.com
SMTP Port: 587
SMTP Secure: true (STARTTLS)
SMTP Username: your-email@yourdomain.com
SMTP Password: [Your Microsoft 365 password]
From Email: your-email@yourdomain.com
From Name: TaskFlow Notifications
```

---

## Implementing SMTP in TaskFlow

### Step 1: Create Environment Configuration

Create a `.env` file in your project root (DO NOT commit to Git):

```env
# SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=true
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM_EMAIL=your-email@gmail.com
SMTP_FROM_NAME=TaskFlow Notifications

# Application Configuration
APP_URL=https://your-app-url.com
```

### Step 2: Add `.env` to `.gitignore`

Ensure your `.gitignore` includes:
```gitignore
.env
.env.local
.env.production
```

### Step 3: Install Required Packages

Since this is a browser-based Spark application, you'll need to implement email sending through a serverless function or backend service.

**Recommended Approach: Use GitHub Actions or Cloudflare Workers**

For a client-side Spark app, you have two options:

#### Option A: Use a Third-Party Email Service API
Services like SendGrid, Mailgun, or EmailJS provide REST APIs that can be called from the browser.

#### Option B: Set Up a Serverless Backend
Use Cloudflare Workers, Vercel Functions, or AWS Lambda to handle SMTP securely.

---

## Testing Your Setup

### Manual Testing Checklist

1. **Test Connection**
   - Verify SMTP host and port are correct
   - Check firewall isn't blocking ports 587/465

2. **Test Authentication**
   - Confirm username and password work
   - For Gmail, ensure app password is used (not regular password)

3. **Test Sending**
   - Send a test email to yourself
   - Check spam folder if not received
   - Verify sender name and email display correctly

4. **Test Templates**
   - Send each notification type
   - Verify HTML renders properly
   - Check links work correctly

### Common Test Scenarios

```plaintext
✓ Task Assignment Email
✓ Task Status Change Email
✓ Comment Notification Email
✓ Due Date Reminder Email
✓ Daily Digest Email
✓ System Announcement Email
```

---

## Troubleshooting

### Issue: Emails Not Sending

**Possible Causes:**
1. **Incorrect credentials** - Double-check username/password
2. **Firewall blocking** - Ensure ports 587/465 are open
3. **2FA not configured** (Gmail) - Must use app password
4. **Sandbox mode** (SES) - Request production access
5. **Rate limiting** - Check if you've exceeded sending limits

**Solutions:**
- Test with a simple SMTP testing tool first
- Check email service dashboard for error logs
- Verify DNS records if using custom domain
- Contact provider support with error codes

---

### Issue: Emails Going to Spam

**Possible Causes:**
1. **Missing SPF record** - Domain authentication needed
2. **Missing DKIM signature** - Email signing required
3. **Low sender reputation** - New domain/IP
4. **Suspicious content** - Trigger words or formatting

**Solutions:**
- Set up SPF, DKIM, and DMARC records
- Warm up sending gradually (don't send thousands at once)
- Avoid spam trigger words
- Include unsubscribe link
- Test email content with spam checkers

---

### Issue: Connection Timeout

**Possible Causes:**
1. **Wrong port** - Try alternative port (587 vs 465)
2. **TLS/SSL mismatch** - Check secure setting
3. **Network restrictions** - Firewall or proxy
4. **Provider downtime** - Check status page

**Solutions:**
- Try both TLS (587) and SSL (465) ports
- Disable VPN temporarily for testing
- Check provider status page
- Test from different network

---

## Security Best Practices

### 1. **Credential Management**

✅ **DO:**
- Use environment variables for credentials
- Rotate passwords regularly (every 90 days)
- Use app-specific passwords (not account passwords)
- Implement rate limiting to prevent abuse
- Log all email sending attempts

❌ **DON'T:**
- Commit credentials to Git
- Share credentials in plain text
- Use personal email accounts for production
- Store passwords in code or database without encryption

---

### 2. **Email Content Security**

✅ **DO:**
- Sanitize user input in email templates
- Use HTTPS links only
- Include unsubscribe mechanism
- Add email verification tokens for sensitive actions
- Implement DMARC for email authentication

❌ **DON'T:**
- Include sensitive data in plain text
- Allow arbitrary HTML in user-generated content
- Send passwords or credentials via email
- Include clickable links without validation

---

### 3. **Rate Limiting & Monitoring**

✅ **DO:**
- Set up sending limits per user/hour
- Monitor bounce rates and complaints
- Track delivery success rates
- Alert on unusual sending patterns
- Implement exponential backoff for retries

❌ **DON'T:**
- Allow unlimited email sending
- Ignore bounce notifications
- Send without user consent
- Retry failed sends indefinitely

---

### 4. **Compliance**

Ensure compliance with:
- **CAN-SPAM Act** (US) - Include unsubscribe, physical address
- **GDPR** (EU) - Get consent, allow opt-out
- **CASL** (Canada) - Explicit consent required
- **CCPA** (California) - Right to opt-out

---

## DNS Records Setup

To improve email deliverability, set up these DNS records:

### SPF Record
```dns
TXT @ "v=spf1 include:_spf.google.com ~all"
```
*Replace with your provider's SPF record*

### DKIM Record
```dns
TXT default._domainkey "v=DKIM1; k=rsa; p=[public-key]"
```
*Get public key from your email provider*

### DMARC Record
```dns
TXT _dmarc "v=DMARC1; p=quarantine; rua=mailto:dmarc@yourdomain.com"
```

---

## Monitoring & Maintenance

### Regular Tasks

**Weekly:**
- Check email delivery rates
- Review bounce and complaint rates
- Monitor sending volume trends

**Monthly:**
- Rotate credentials if needed
- Review and update email templates
- Audit user notification preferences
- Check DNS records are still valid

**Quarterly:**
- Assess provider performance
- Review and optimize sending patterns
- Update compliance documentation
- Test disaster recovery procedures

---

## Support & Resources

### Provider Documentation

- [Gmail SMTP Guide](https://support.google.com/mail/answer/7126229)
- [SendGrid Documentation](https://docs.sendgrid.com/)
- [Amazon SES Guide](https://docs.aws.amazon.com/ses/)
- [Mailgun Documentation](https://documentation.mailgun.com/)
- [Microsoft 365 SMTP](https://docs.microsoft.com/en-us/exchange/mail-flow-best-practices/how-to-set-up-a-multifunction-device-or-application-to-send-email-using-microsoft-365-or-office-365)

### Testing Tools

- [SMTP Tester](https://www.smtptester.com/)
- [MX Toolbox](https://mxtoolbox.com/)
- [Mail Tester](https://www.mail-tester.com/)
- [DNS Checker](https://dnschecker.org/)

---

## Emergency Contacts

In case of critical email delivery issues:

1. **Check Provider Status Page** - Most providers have real-time status
2. **Review Recent Changes** - Check if configuration was modified
3. **Switch to Backup Provider** - Have a secondary SMTP provider configured
4. **Contact Provider Support** - Use support channels with error details

---

## Appendix: Sample Email Templates

### Task Assignment Email
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #4F46E5; color: white; padding: 20px; text-align: center; }
    .content { background: #f9f9f9; padding: 20px; }
    .button { background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>TaskFlow - New Task Assignment</h1>
    </div>
    <div class="content">
      <h2>You've been assigned a new task!</h2>
      <p><strong>Task:</strong> {{task_title}}</p>
      <p><strong>Description:</strong> {{task_description}}</p>
      <p><strong>Priority:</strong> {{task_priority}}</p>
      <p><strong>Due Date:</strong> {{due_date}}</p>
      <p><strong>Assigned By:</strong> {{assigned_by}}</p>
      <br>
      <a href="{{task_link}}" class="button">View Task Details</a>
    </div>
    <div class="footer">
      <p>You're receiving this email because you're a member of TaskFlow.</p>
      <p><a href="{{preferences_link}}">Email Preferences</a> | <a href="{{unsubscribe_link}}">Unsubscribe</a></p>
    </div>
  </div>
</body>
</html>
```

---

**Document Version:** 1.0  
**Last Updated:** January 2025  
**Maintained By:** TaskFlow Development Team  
**Classification:** CONFIDENTIAL - Repository Administrators Only

---

## Quick Start Checklist

- [ ] Choose SMTP provider
- [ ] Create account and verify email
- [ ] Generate credentials (API key or app password)
- [ ] Set up DNS records (SPF, DKIM, DMARC)
- [ ] Configure environment variables
- [ ] Test with sample email
- [ ] Verify spam score
- [ ] Set up monitoring
- [ ] Document configuration for team
- [ ] Schedule regular maintenance checks

---

**Questions or Issues?** Refer to provider documentation or contact your team's system administrator.
