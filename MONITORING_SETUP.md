# Monitoring & Metrics Setup Guide
## AI AUTOMATED TASK MANAGER

**Setup Date:** 2026-09-19  
**Status:** Ready to implement  
**Estimated Setup Time:** 30-45 minutes  

---

## QUICKSTART CHECKLIST

- [ ] **Google Sheets Setup** (10 min)
- [ ] **Slack Integration** (5 min)
- [ ] **GitHub Actions Secrets** (5 min)
- [ ] **Email Alerts Configuration** (10 min)
- [ ] **Dashboard Links Setup** (5 min)
- [ ] **Initial Data Collection** (5 min)

---

## SECTION 1: GOOGLE SHEETS SETUP

### Step 1.1: Create Main Dashboard Spreadsheet

1. Go to **Google Drive** → `+ New` → `Google Sheets`
2. Name it: `AI Task Manager - Metrics Dashboard [SHARED]`
3. Share with team (View-only link)

### Step 1.2: Create Sheet Tabs

Create these tabs in order (right-click "Sheet" → Rename/Duplicate):

| Tab Name | Purpose | Rows | Update Frequency |
|----------|---------|------|------------------|
| `Daily Snapshot` | Daily KPI tracking | 30+ | Daily (09:00 UTC) |
| `Weekly Aggregation` | Weekly roll-up | 52 | Weekly (Monday) |
| `Monthly Summary` | Business metrics | 12 | Monthly (end of month) |
| `Cohort Retention` | User retention analysis | 15 | Weekly |
| `Revenue Forecast` | MRR projections | 12 | Monthly |
| `GitHub Metrics` | Repository health | 365 | Daily |
| `CAC & LTV` | Unit economics | 12 | Monthly |
| `Alert Log` | Issue tracking | 100 | Real-time |
| `Config` | Settings & formulas | — | As needed |

### Step 1.3: Setup Daily Snapshot Sheet

**Column Headers (Row 1):**
```
A: Date
B: Trial Signups (daily)
C: Trial Signups (7-day avg)
D: Email Open Rate (%)
E: Form Completion Rate (%)
F: GitHub Stars
G: New Stars (daily delta)
G: Active Users (7-day avg)
H: Error Rate (%)
I: Mobile Completion (%)
J: On Track? (formula)
K: Notes
```

**Example Row (Row 2):**
```
A2: =TODAY()
B2: [Manual entry or API pull]
C2: =AVERAGE(B2:B8) [7-day moving average]
D2: [From analytics tool]
E2: [From form tracking]
F2: [GitHub API or manual]
G2: =F2-F1 [Daily delta]
H2: [From analytics]
I2: [From form tracking]
J2: [From mobile analytics]
K2: =IF(OR(E2<0.75, J2<0.6, H2>0.01), "⚠️ ALERT", "✓ ON_TRACK")
L2: [Manual notes]
```

**Formatting:**
- Freeze row 1 (View → Freeze → 1 row)
- Conditional formatting on column K:
  - RED: "⚠️ ALERT"
  - GREEN: "✓ ON_TRACK"

### Step 1.4: Setup Weekly Aggregation Sheet

**Column Headers:**
```
A: Week Starting
B: Total Signups
C: Avg Form Completion (%)
D: Avg Mobile Completion (%)
E: New Stars (total)
F: Support Tickets
G: Churn (count)
H: MRR This Week (estimated)
I: Forecast Adjustment
J: Notes
```

**Formulas:**
```
A2: [First Monday of period]
B2: =SUM('Daily Snapshot'!B2:B8) [Sum daily signups]
C2: =AVERAGE('Daily Snapshot'!E2:E8) [Avg completion]
H2: =(C2*0.3*50) [assumes 30% conversion to paid, $50 ARPU]
I2: [Manual: e.g., "adjust +10% due to campaign"]
```

### Step 1.5: Setup Monthly Summary Sheet

**Column Headers:**
```
A: Month
B: Total Signups
C: Paying Customers
D: MRR ($)
E: Churn Rate (%)
F: CAC ($)
G: NPS (if surveyed)
H: GitHub Stars
I: Key Win
J: Key Challenge
K: Variance from Forecast
```

**Formulas:**
```
A2: Jan 2026
B2: [SUM all signups in month]
C2: [Manual: count from Stripe]
D2: [Manual: sum MRR from Stripe]
E2: =([Customers Lost] / [Starting Customers]) * 100
F2: =[Total Marketing Spend] / C2
G2: [Manual: from NPS survey results]
H2: [From GitHub metrics]
K2: =IF(D2 >= D1*1.2, "AHEAD ✓", IF(D2 >= D1*0.85, "ON_TRACK", "BELOW ⚠️"))
```

### Step 1.6: Setup Config Sheet

**Purpose:** Centralized reference for thresholds, formulas, and settings

```
A: Setting Name | B: Value | C: Notes

Alert Thresholds:
Form Completion Rate (min) | 75% | Alert if below
Mobile Completion Rate (min) | 70% | Alert if below
Error Rate (max) | 0.1% | Alert if above
Email Delivery (min) | 99% | Alert if below
Churn Rate (max) | 5% | Alert if above

Conversion Rates:
Signup to Paid | 30% | Baseline assumption
Paid to Expanded | 10% | Upsell rate

Financial Assumptions:
Average Subscription ($) | 50 | Per month
Gross Margin (%) | 75% | Revenue - COGS
Support Hours ($ per hour) | 50 | For CAC calculation

API Keys & Secrets:
SLACK_WEBHOOK_URL | [REDACTED] | For notifications
GOOGLE_SHEETS_ID | [SPREADSHEET_ID] | This sheet ID
STRIPE_API_KEY | [REDACTED] | For revenue data
```

### Step 1.7: Protect Sheets

1. Select all sensitive tabs (Revenue Forecast, Alert Log, Config)
2. **Tools → Protect sheets and ranges**
3. Set to "Editor" only (view-only for others)

---

## SECTION 2: GITHUB ACTIONS SETUP

### Step 2.1: Create GitHub Secrets

1. Go to **GitHub Repo → Settings → Secrets and variables → Actions**
2. Add these secrets:

| Secret Name | Value | Where to Get |
|------------|-------|--------------|
| `SLACK_WEBHOOK_URL` | `https://hooks.slack.com/...` | See Section 3 |
| `GOOGLE_SHEETS_ID` | `[spreadsheet_id]` | From URL: docs.google.com/spreadsheets/d/`{id}` |
| `GSHEET_CLIENT_EMAIL` | `[service_account@project.iam.gserviceaccount.com]` | Google Cloud Console |
| `GSHEET_PRIVATE_KEY` | `[long_key_string]` | Google Cloud Console (JSON key file) |

### Step 2.2: Verify GitHub Actions Permissions

1. **Settings → Actions → General**
2. Ensure "Read and write permissions" is selected
3. Check "Allow GitHub Actions to create and approve pull requests"

### Step 2.3: Manually Trigger First Run

1. Go to **Actions → Daily Metrics Collection**
2. Click **Run workflow → Run workflow** (test run)
3. Monitor logs for success/errors

### Step 2.4: Verify Metrics File Creation

After first run:
```bash
# Check if metrics file was created/updated:
git log --oneline | grep "update daily metrics"
git show --name-only HEAD | grep "daily_metrics"
```

---

## SECTION 3: SLACK INTEGRATION

### Step 3.1: Create Slack Webhook

1. Go to [api.slack.com/apps](https://api.slack.com/apps) → **Create New App**
2. Name: `Metrics Bot`
3. Choose workspace
4. **Incoming Webhooks** → **Add New Webhook to Workspace**
5. Select channel: `#metrics-alerts` (or create if needed)
6. Copy Webhook URL: `https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXX`

### Step 3.2: Add to GitHub Secrets

1. Go to GitHub Repo → **Settings → Secrets → New repository secret**
2. Name: `SLACK_WEBHOOK_URL`
3. Value: [Paste webhook URL from Step 3.1]
4. Save

### Step 3.3: Create Slack Channels

Create these channels in Slack:
- **#metrics-alerts** — Daily snapshots & critical alerts
- **#metrics-weekly** — Weekly summaries & reviews
- **#metrics-archive** — Historical data & reports

---

## SECTION 4: EMAIL ALERTS CONFIGURATION

### Step 4.1: Setup Email Service

**Option A: Use Resend (Recommended)**

1. Go to [Resend.com](https://resend.com) → Sign in
2. Create API key: **Dashboard → API Keys → Create API Key**
3. Copy key and add to GitHub Secrets:
   - Name: `RESEND_API_KEY`
   - Value: `[Resend API key]`

4. Create email templates for alerts

**Option B: Use SendGrid**

1. Go to [SendGrid.com](https://sendgrid.com) → Dashboard
2. Create API key: **Settings → API Keys → Create API Key**
3. Add to GitHub Secrets:
   - Name: `SENDGRID_API_KEY`
   - Value: `[SendGrid API key]`

### Step 4.2: Create Email Alert Template

**File:** `.github/email_alerts/warning_digest.txt`

```
Subject: [METRICS] Weekly Warning Summary — Week of {{DATE}}

Hi {{NAME}},

This week's metrics show some areas needing attention:

⚠️ WARNING ITEMS:
1. {{METRIC_1}}: {{VALUE}} vs target {{TARGET}} — {{ANALYSIS}}
2. {{METRIC_2}}: {{VALUE}} vs target {{TARGET}} — {{ANALYSIS}}
3. {{METRIC_3}}: {{VALUE}} vs target {{TARGET}} — {{ANALYSIS}}

📊 QUICK STATS:
- MRR: {{MRR}} ({{VARIANCE}})
- Trial users: {{TRIAL_USERS}} ({{TREND}})
- GitHub stars: {{STARS}} ({{WEEKLY_DELTA}})

🎯 ACTIONS:
- [ ] Action 1 (owner: @person)
- [ ] Action 2 (owner: @person)

Dashboard: {{DASHBOARD_URL}}

Best,
Metrics Bot
---
Auto-generated by AI Task Manager metrics system
Manage alerts: {{SETTINGS_URL}}
```

### Step 4.3: Configure Alert Frequency

Create GitHub Actions workflow `.github/workflows/email-alerts.yml`:

```yaml
name: Email Alert Digest

on:
  schedule:
    # Daily warning digest at 06:00 UTC
    - cron: '0 6 * * *'
    # Weekly digest Monday at 10:00 UTC
    - cron: '0 10 * * 1'

jobs:
  send_digest:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Generate Alert Digest
        id: digest
        # Parse metrics file and generate email body
        run: echo "digest_html=<html>...</html>" >> $GITHUB_OUTPUT
      
      - name: Send Email Alert
        uses: dawidd6/action-send-mail@v3
        with:
          server_address: ${{ secrets.EMAIL_SERVER }}
          server_port: ${{ secrets.EMAIL_PORT }}
          username: ${{ secrets.EMAIL_USERNAME }}
          password: ${{ secrets.EMAIL_PASSWORD }}
          subject: "[METRICS] Weekly Warning Summary — $(date +%Y-%m-%d)"
          to: tutorsicurezza@gmail.com
          html_body: ${{ steps.digest.outputs.digest_html }}
```

---

## SECTION 5: DASHBOARD LINKS & ACCESS

### Step 5.1: Compile Dashboard URLs

Create a reference document. Save as **`DASHBOARDS.md`** in repo root:

```markdown
# Metrics Dashboards Reference

## Primary Dashboards

### 1. Google Sheets Dashboard
- **URL:** https://docs.google.com/spreadsheets/d/[ID]/edit
- **Access:** Team (view-only)
- **Tabs:** Daily, Weekly, Monthly summaries
- **Update:** Automated (daily 09:00 UTC)

### 2. GitHub Repository
- **URL:** https://github.com/your-org/your-repo
- **Insights Tab:** https://github.com/your-org/your-repo/graphs/traffic
- **Releases:** https://github.com/your-org/your-repo/releases
- **Stars:** https://github.com/your-org/your-repo/stargazers

### 3. Stripe Dashboard
- **URL:** https://dashboard.stripe.com/
- **Access:** Founder only
- **Data:** Revenue, customers, subscriptions
- **Update:** Real-time

### 4. Vercel Analytics
- **URL:** https://vercel.com/[TEAM]/[PROJECT]
- **Tabs:** Analytics, Deployments, Monitoring
- **Data:** Page performance, traffic, errors
- **Update:** Real-time

### 5. Resend Email Metrics
- **URL:** https://resend.com/emails
- **Data:** Delivery rate, open rate, click rate
- **Update:** Real-time

### 6. Error Tracking (if using Sentry/similar)
- **URL:** https://[org].sentry.io/projects/[project]/
- **Data:** Error trends, stack traces, affected users
- **Update:** Real-time

## Local Dashboards

### Metrics File (Git)
- **Location:** `.github/metrics/daily_metrics.jsonl`
- **Format:** JSON Lines (one metric entry per line)
- **View:** `git log --follow -p .github/metrics/daily_metrics.jsonl | head -100`
```

### Step 5.2: Create Team Access Sheet

Add to **Google Sheets → Config tab:**

```
Team Member | Email | Dashboard Access | Role | Frequency
Jane (Growth) | jane@email.com | View All | Owner | Daily
Bob (Eng) | bob@email.com | GitHub + Vercel | Contributor | Weekly
Alice (Founder) | alice@email.com | View All + Stripe | Owner | Daily
```

---

## SECTION 6: TESTING & VALIDATION

### Step 6.1: Test Daily Metrics Workflow

1. Go to **GitHub Actions → Daily Metrics Collection**
2. Click **Run workflow → Run workflow**
3. Wait for completion (should take ~2 minutes)
4. Verify:
   - [ ] GitHub stats fetched (check logs)
   - [ ] Metrics file updated (check `.github/metrics/daily_metrics.jsonl`)
   - [ ] Slack message sent (check `#metrics-alerts`)
   - [ ] No errors in workflow log

### Step 6.2: Test Slack Alerts

1. Trigger test message:
```bash
curl -X POST -H 'Content-type: application/json' \
  --data '{"text":"Test alert from metrics system"}' \
  YOUR_WEBHOOK_URL
```

2. Verify message appears in `#metrics-alerts` channel

### Step 6.3: Test Google Sheets Integration

1. Manually add test row to **Daily Snapshot**
2. Verify formulas calculate correctly
3. Test conditional formatting (add alert condition, verify color change)

### Step 6.4: Test Email Alerts

1. Send test email manually:
```bash
curl -X POST https://api.resend.com/emails \
  -H 'Authorization: Bearer $RESEND_API_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "from": "metrics@yourdomain.com",
    "to": "your-email@gmail.com",
    "subject": "Test Metrics Alert",
    "html": "<h1>Test Email</h1>"
  }'
```

2. Verify email arrives

---

## SECTION 7: DAILY OPERATIONS

### Daily Standup (09:00 UTC)

1. **Automated:** GitHub Actions workflow runs daily
2. **Slack notification:** Summary posts to `#metrics-alerts`
3. **Manual check:** Open Google Sheets → Daily Snapshot tab
4. **Review:** Note any alerts or anomalies
5. **Action:** If alert triggered, investigate and document in Alert Log sheet

### Weekly Review (Monday 10:00 UTC)

1. **Preparation:** Google Sheets auto-aggregates weekly data
2. **Meeting:** 30-45 minute sync with team
3. **Output:** Fill weekly report section in Google Sheets
4. **Follow-up:** Slack message with summary to `#metrics-weekly`

### Monthly Business Review (Last Tuesday)

1. **Preparation:** Download metrics → create presentation deck
2. **Meeting:** 60-90 minute sync with stakeholders
3. **Output:** MBR slide deck saved to Google Drive
4. **Archive:** Screenshot dashboard for records

---

## SECTION 8: TROUBLESHOOTING

### GitHub Actions Workflow Not Running

**Issue:** Workflow scheduled but doesn't execute  
**Solutions:**
1. Check workflow is enabled: **Actions → Daily Metrics Collection → Edit → Ensure "Enable" is checked**
2. Verify cron syntax: Use [crontab.guru](https://crontab.guru/) to validate
3. Check logs: **Actions → Latest run → View logs**

### Slack Webhook Failed

**Issue:** "Webhook URL invalid" error in workflow  
**Solutions:**
1. Verify webhook URL in GitHub Secrets (exact copy, no extra spaces)
2. Test webhook manually: `curl -X POST -H 'Content-type: application/json' --data '{"text":"test"}' YOUR_URL`
3. Check webhook not expired (regenerate if >6 months old)

### Google Sheets Formula Errors

**Issue:** `#REF!` or `#NAME?` errors in formulas  
**Solutions:**
1. Check sheet name spelling (formulas reference exact sheet names)
2. Verify range references (A2:B10 should exist)
3. Check API credentials if using IMPORTRANGE or external data

### Email Not Sending

**Issue:** Alert email not arriving  
**Solutions:**
1. Check email in spam folder
2. Verify API key valid: `curl -H "Authorization: Bearer $KEY" https://api.resend.com/emails`
3. Check email formatting (valid HTML if using html_body)
4. Review rate limits (free tier has limits)

---

## SECTION 9: ADVANCED SETUP (OPTIONAL)

### Google Sheets API Automation

**For advanced users:** Set up automated data pulls from APIs

```python
# Setup: pip install google-auth-oauthlib google-auth-httplib2 google-api-python-client

from google.oauth2.service_account import Credentials
from google.auth.transport.requests import Request
from googleapiclient.discovery import build

# Load credentials from GitHub Secret
credentials = Credentials.from_service_account_info(json.loads(SERVICE_ACCOUNT_JSON))

# Build service
service = build('sheets', 'v4', credentials=credentials)

# Append metrics to sheet
request = service.spreadsheets().values().append(
    spreadsheetId=SHEETS_ID,
    range='Daily Snapshot!A:K',
    valueInputOption='RAW',
    body={'values': [[date, signups, ...]]},
    insertDataOption='INSERT_ROWS'
)
response = request.execute()
```

### Custom Metrics Ingestion

**For teams wanting real-time analytics:**

1. Set up webhook endpoint in your app to receive metrics
2. Post events from application: form submissions, errors, etc.
3. Store in Supabase / database
4. Query in Google Sheets via IMPORTDATA or API

---

## SECTION 10: MAINTENANCE & REVIEWS

### Weekly Maintenance Checklist

- [ ] Review Alert Log sheet (resolve old alerts)
- [ ] Check workflow logs (any errors?)
- [ ] Verify Slack messages received (no missed alerts)
- [ ] Update Config sheet if thresholds changed
- [ ] Archive old data (>90 days) to historical sheet

### Monthly Review Checklist

- [ ] Audit Google Sheets access (remove old team members)
- [ ] Verify API keys still valid (regenerate if expired)
- [ ] Review metric definitions (still accurate?)
- [ ] Check formula accuracy (sample calculations manually)
- [ ] Update targets based on new learnings

### Quarterly Review Checklist

- [ ] Review all alert thresholds (adjust based on performance)
- [ ] Recalculate unit economics (CAC, LTV)
- [ ] Survey team on dashboard usability
- [ ] Plan metric infrastructure improvements
- [ ] Audit costs (Slack, email, Google Drive storage)

---

## SECTION 11: QUICK REFERENCE COMMANDS

### View Latest Metrics

```bash
# Show last 10 metrics entries
tail -10 .github/metrics/daily_metrics.jsonl

# Show metrics from specific date
grep "2026-09-19" .github/metrics/daily_metrics.jsonl

# Pretty print latest metric
tail -1 .github/metrics/daily_metrics.jsonl | jq .
```

### Push Metrics to Google Sheets (Manual)

```bash
# If automation fails, manually append:
echo '{"date":"2026-09-19","stars":125,...}' >> .github/metrics/daily_metrics.jsonl
git add .github/metrics/daily_metrics.jsonl
git commit -m "chore: manual metrics update"
git push
```

### Trigger Workflow Manually

```bash
# Via GitHub CLI (requires auth)
gh workflow run daily-metrics.yml

# Or use GitHub web UI: Actions → Daily Metrics Collection → Run workflow
```

---

## APPENDIX: SAMPLE METRICS ENTRY

Example metric JSON structure:

```json
{
  "date": "2026-09-19",
  "timestamp": "2026-09-19T09:00:00Z",
  "repository": {
    "stars": 125,
    "forks": 8,
    "watchers": 45,
    "open_issues": 18,
    "open_prs": 7,
    "description": "AI Automated Task Manager",
    "language": "TypeScript",
    "is_template": false
  },
  "signups": {
    "daily": 28,
    "cumulative": 840,
    "from_organic": 18,
    "from_referral": 10
  },
  "trial": {
    "active_users": 380,
    "activated_this_week": 45,
    "seven_day_retention": 0.65
  },
  "quality": {
    "error_rate": 0.08,
    "form_completion_rate": 0.76,
    "mobile_completion_rate": 0.71,
    "avg_load_time_ms": 1840
  },
  "alerts": []
}
```

---

## NEXT STEPS

1. **Today:** Complete sections 1-5 (Google Sheets + Slack setup)
2. **Tomorrow:** Test all workflows (section 6)
3. **This Week:** Run first daily standup with team
4. **Next Week:** Run first weekly review meeting
5. **End of Month:** Complete first monthly business review

---

**Support & Questions:**  
See `METRICS.md` for detailed metric definitions and calculations.  
See `.github/workflows/daily-metrics.yml` for GitHub Actions implementation.  

Last Updated: 2026-09-19

