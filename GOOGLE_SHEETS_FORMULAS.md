# Google Sheets Formulas Reference
## AI AUTOMATED TASK MANAGER Metrics Dashboard

**Purpose:** Complete reference for all formulas used in the metrics Google Sheets  
**Last Updated:** 2026-09-19  
**Maintainer:** Growth Lead  

---

## TABLE OF CONTENTS

1. [Sheet Setup](#sheet-setup)
2. [Daily Snapshot Formulas](#daily-snapshot-formulas)
3. [Weekly Aggregation Formulas](#weekly-aggregation-formulas)
4. [Monthly Summary Formulas](#monthly-summary-formulas)
5. [Cohort Retention Formulas](#cohort-retention-formulas)
6. [Revenue Forecast Formulas](#revenue-forecast-formulas)
7. [CAC & LTV Formulas](#cac--ltv-formulas)
8. [Chart Formulas](#chart-formulas)
9. [Conditional Formatting Rules](#conditional-formatting-rules)
10. [Data Import Formulas](#data-import-formulas)

---

## Sheet Setup

### Freeze Rows & Columns

**For all sheets:**
```
View → Freeze → 1 row (freeze header row)
```

### Default Number Formats

| Column Type | Format | Example |
|-------------|--------|---------|
| Date | YYYY-MM-DD | 2026-09-19 |
| Percentage | 0.00% | 75.32% |
| Currency | $#,##0.00 | $1,200.50 |
| Decimal | 0.00 | 3.42 |
| Count | 0 | 125 |

---

## Daily Snapshot Formulas

**Sheet Name:** `Daily Snapshot`  
**Update Frequency:** Daily (automated + manual)  
**Purpose:** Track daily KPIs for standup meeting

### Column Structure

```
A: Date
B: Trial Signups (daily)
C: Trial Signups (7-day moving avg)
D: Email Open Rate (%)
E: Form Completion Rate (%)
F: GitHub Stars
G: New Stars (daily delta)
H: Active Users (7-day avg)
I: Error Rate (%)
J: Mobile Completion (%)
K: On Track? (formula)
L: Notes
```

### Formula Reference

#### Column A: Date
**Formula (A2):**
```
=TODAY()
```
**Purpose:** Auto-generates current date  
**Copy down:** Yes  

---

#### Column C: 7-Day Moving Average of Signups
**Formula (C2):**
```
=AVERAGE(OFFSET(B2,-6,0,7,1))
```
**Purpose:** Calculate 7-day rolling average (current row + 6 above)  
**Alternative (simpler):**
```
=AVERAGE(B2:B8)  [if rows 2-8 contain the 7 days]
```
**Copy down:** Yes  

---

#### Column D: Email Open Rate
**Formula (D2):**
```
=[Manual entry from Resend/SendGrid API or analytics]
```
**Purpose:** Manual data entry from email service  
**Calculation if available:**
```
=IF(email_service_connected,
  QUERY(email_log, "SELECT AVG(open_rate) WHERE date >= TODAY()-1"),
  "[Manual Entry Needed]"
)
```

---

#### Column E: Form Completion Rate
**Formula (E2):**
```
=IF(B2=0, 0, 
  IF(ISBLANK(VLOOKUP("form_completions", analytics_sheet, 2, FALSE)),
    "[Manual]",
    VLOOKUP("form_completions", analytics_sheet, 2, FALSE) / 
    VLOOKUP("form_starts", analytics_sheet, 2, FALSE)
  )
)
```
**Purpose:** Calculate form completion as % (completions / starts)  
**Data Source:** Typically from MONITORING_CONFIG.ts analytics events  
**Manual Entry:** If automation not available

---

#### Column G: New Stars (Daily Delta)
**Formula (G2):**
```
=IF(ROW()=2, 
  "[First entry - no delta]",
  F2 - F1
)
```
**Purpose:** Calculate daily change in GitHub stars  
**Logic:** Current day stars minus previous day  

---

#### Column H: Active Users 7-Day Average
**Formula (H2):**
```
=AVERAGE(OFFSET(H2,-6,0,7,1))
```
**Purpose:** Rolling 7-day average of active users  
**Note:** Requires daily active user data from analytics  

---

#### Column K: On Track Status (Alert Formula)
**Formula (K2):**
```
=IF(OR(
  E2 < 0.75,              [Form completion < 75%]
  J2 < 0.60,              [Mobile completion < 60%]
  I2 > 0.01,              [Error rate > 1%]
  C2 < 20                 [7-day avg signups < 20]
),
  "🔴 ALERT",
  IF(OR(
    E2 > 0.90,
    C2 > 50
  ),
    "🟢 EXCELLENT",
    "🟡 ON_TRACK"
  )
)
```
**Purpose:** Auto-alert when metrics breach thresholds  
**Conditional Formatting:** See [Conditional Formatting Rules](#conditional-formatting-rules)

---

#### Column L: Notes
**Formula (L2):**
```
[Manual entry]
```
**Purpose:** Free text for daily notes/observations  
**Examples:**
- "Campaign launched Monday, spikes expected"
- "Server downtime 2-3pm, affects error rate"
- "Mobile redesign live, monitoring completion"

---

### Dynamic Summary Row (Bottom of Daily Sheet)

**Formula to add at bottom (Row 32):**
```
A32: =TEXT(TODAY(), "YYYY-MM-DD") & " - SUMMARY"
B32: =SUM(B2:B31)
C32: =AVERAGE(C2:C31)
E32: =AVERAGE(E2:E31)
F32: =MAX(F2:F31)
I32: =AVERAGE(I2:I31)
```

**Purpose:** End-of-month summary row

---

## Weekly Aggregation Formulas

**Sheet Name:** `Weekly Aggregation`  
**Update Frequency:** Weekly (Monday)  
**Purpose:** Roll up daily data into weekly summaries for review meeting

### Column Structure

```
A: Week Starting Date
B: Total Signups
C: Avg Form Completion (%)
D: Avg Mobile Completion (%)
E: New Stars (total)
F: Support Tickets
G: Churn (count)
H: Weekly MRR Estimate
I: Forecast Adjustment
J: Notes
```

### Formulas

#### Column B: Total Signups (Weekly Sum)
**Formula (B2, week starting 2026-09-16):**
```
=SUMIFS(
  'Daily Snapshot'!B:B,
  'Daily Snapshot'!A:A, ">=" & A2,
  'Daily Snapshot'!A:A, "<" & A2 + 7
)
```
**Purpose:** Sum daily signups for that week  
**Copy down:** Yes (A2 must contain Monday date)

---

#### Column C: Avg Form Completion Rate (Weekly)
**Formula (C2):**
```
=AVERAGEIFS(
  'Daily Snapshot'!E:E,
  'Daily Snapshot'!A:A, ">=" & A2,
  'Daily Snapshot'!A:A, "<" & A2 + 7
)
```
**Purpose:** Average form completion % for the week  

---

#### Column E: Total New Stars (Weekly)
**Formula (E2):**
```
=SUMIFS(
  'Daily Snapshot'!G:G,
  'Daily Snapshot'!A:A, ">=" & A2,
  'Daily Snapshot'!A:A, "<" & A2 + 7
)
```
**Purpose:** Sum daily star delta for that week  

---

#### Column H: Weekly MRR Estimate
**Formula (H2):**
```
=B2 * 0.3 * 50 * 0.9
```
**Explanation:**
- B2 = signups this week
- 0.3 = estimated 30% conversion to paid
- 50 = average subscription price ($50/month)
- 0.9 = adjust for partial month (conservative)

**Purpose:** Rough estimate of MRR from this week's signups  
**Note:** Replace with actual Stripe data if available

---

#### Column J: Notes
**Formula (J2):**
```
=IF(B2 > 200,
  "🎉 Strong week",
  IF(B2 > 150,
    "📊 Average week",
    "⚠️ Slow week - investigate"
  )
)
```
**Purpose:** Auto-summarize week quality  
**Override:** Manually edit for campaign notes, etc.

---

### Week Starting Dates (Column A)

**Manual entry pattern:**
```
A2: 2026-09-16  [first Monday]
A3: 2026-09-23  [add 7 days]
A4: 2026-09-30
...
```

**Or use formula to auto-generate Mondays:**
```
=DATE(2026,9,16) + (ROW()-2)*7
```

---

## Monthly Summary Formulas

**Sheet Name:** `Monthly Summary`  
**Update Frequency:** Monthly (last day of month)  
**Purpose:** Business-level metrics for MBR meeting

### Column Structure

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

### Formulas

#### Column B: Total Monthly Signups
**Formula (B2, September):**
```
=SUMIFS(
  'Daily Snapshot'!B:B,
  'Daily Snapshot'!A:A, ">=" & DATE(2026,9,1),
  'Daily Snapshot'!A:A, "<" & DATE(2026,10,1)
)
```
**Purpose:** Sum all signups in month  
**Alternative:** Sum Weekly Aggregation column B for that month

---

#### Column C: Paying Customers (Manual)
**Formula (C2):**
```
=[Pull from Stripe or manual count]
```
**Stripe Query (if available):**
```
=QUERY(stripe_data,
  "SELECT COUNT(customer_id) WHERE DATE(created_at) >= DATE(2026,9,1) 
   AND DATE(created_at) < DATE(2026,10,1) AND status='active'"
)
```
**Purpose:** Count active paying customers at end of month  

---

#### Column D: MRR (From Stripe)
**Formula (D2):**
```
=SUMIF(stripe_customers!A:A,
  stripe_customers!subscription_status="active",
  stripe_customers!monthly_value
)
```
**Purpose:** Sum all active monthly subscription values  
**Simplified (if Stripe not connected):**
```
=C2 * 50  [customers × avg subscription]
```

---

#### Column E: Churn Rate (%)
**Formula (E2):**
```
=(VLOOKUP("churn_count_september", churn_log, 2, FALSE) / 
  VLOOKUP("starting_customers_september", churn_log, 2, FALSE)) * 100
```
**Simpler (manual tracking):**
```
=[Count customers lost this month] / [Starting customers] * 100
```
**Example:** 5 lost / 100 starting = 5% churn

---

#### Column F: CAC (Customer Acquisition Cost)
**Formula (F2):**
```
=(
  VLOOKUP("marketing_spend_september", budget_log, 2, FALSE) +
  VLOOKUP("support_costs_september", budget_log, 2, FALSE)
) / C2
```
**Simplified:**
```
=total_marketing_spend / new_paying_customers
```
**Example:** $2,500 spend / 50 new customers = $50 CAC

---

#### Column K: Variance from Forecast
**Formula (K2):**
```
=IF(D2 >= D_forecast * 0.85,
  IF(D2 >= D_forecast,
    "✅ AHEAD",
    "🟡 ON_TRACK"
  ),
  "❌ BELOW"
)
```
**Purpose:** Compare actual vs. forecasted MRR  

---

---

## Cohort Retention Formulas

**Sheet Name:** `Cohort Retention`  
**Update Frequency:** Weekly  
**Purpose:** Track retention cohorts to measure product-market fit

### Sheet Structure

```
       | Week 1 | Week 2 | Week 3 | Week 4 | Week 8 | Week 12
Sep W1 | 100%   | 68%    | 55%    | 48%    | 30%    | 20%
Sep W2 | 100%   | 72%    | —      | —      | —      | —
Sep W3 | 100%   | —      | —      | —      | —      | —
```

### Column Headers (Row 1)
```
A1: Signup Week
B1: Week 1
C1: Week 2
D1: Week 3
E1: Week 4
F1: Week 8
G1: Week 12
```

### Formulas

#### First Column (Week 1, always 100%)
**Formula (B2):**
```
=1  [or 100% formatted as percentage]
```

#### Subsequent Weeks
**Formula (C2, Week 2 retention for Sep W1 cohort):**
```
=COUNTIFS(
  trial_log!signup_week, "Sep W1",
  trial_log!active_week_2, TRUE
) / COUNTIF(
  trial_log!signup_week, "Sep W1"
)
```
**Purpose:** Count active users in week 2 / total signup week users  

**Simpler (if tracking active users list):**
```
=active_users_week2 / active_users_week1
```

---

## Revenue Forecast Formulas

**Sheet Name:** `Revenue Forecast`  
**Update Frequency:** Monthly  
**Purpose:** Project MRR for next 6-12 months

### Column Structure

```
A: Month
B: Current MRR (actual)
C: New ARR (signups → paid conversion)
D: Expansion ARR (upsells)
E: Churn Impact (negative)
F: Net MRR (formula)
G: Forecast MRR (target)
H: Variance (F - G)
```

### Formulas

#### Column C: New ARR (New Customer Revenue)
**Formula (C2, October):**
```
=('Weekly Aggregation'!B:B from October) * 0.3 * 50 * 12 / 52
```
**Explanation:**
- B:B = weekly signups
- 0.3 = 30% convert to paid
- 50 = avg price
- 12/52 = annualize weekly to monthly portion

**Simplified:**
```
=50 * new_paying_customers_this_month
```

---

#### Column E: Churn Impact (Revenue Lost)
**Formula (E2):**
```
=-1 * (VLOOKUP("churn_customers", churn_log, 2, FALSE) * 50)
```
**Example:** -5 customers lost × $50 = -$250 MRR impact

---

#### Column F: Net MRR (Monthly Total)
**Formula (F2):**
```
=B2 + C2 + D2 + E2
```
**Purpose:** Total MRR = (previous MRR) + (new ARR) + (expansion) - (churn)

---

#### Column G: Forecast MRR (Target)
**Formula (G2):**
```
=F1 * 1.2  [20% MoM growth target]
```
**Alternative (with acceleration/deceleration):**
```
=IF(ROW() <= 5,
  F1 * 1.3,    [30% growth early stage]
  F1 * 1.15    [15% growth slowing]
)
```

---

#### Column H: Variance
**Formula (H2):**
```
=F2 - G2
```
**Interpretation:**
- Positive = exceeding forecast
- Negative = below forecast

---

### Example Revenue Forecast

```
Month    | Current | New ARR | Expansion | Churn  | Net MRR | Forecast | Variance
Oct 2026 | $2,500  | $2,000  | $100      | -$200  | $4,400  | $3,000   | +$1,400 ✓
Nov 2026 | $4,400  | $2,500  | $150      | -$300  | $6,750  | $5,280   | +$1,470 ✓
Dec 2026 | $6,750  | $3,000  | $200      | -$400  | $9,550  | $8,100   | +$1,450 ✓
```

---

## CAC & LTV Formulas

**Sheet Name:** `CAC & LTV`  
**Update Frequency:** Monthly  
**Purpose:** Track unit economics (break-even analysis)

### Column Structure

```
A: Month
B: Marketing Spend ($)
C: Customers Acquired
D: CAC ($) [B/C]
E: ARPU ($/month)
F: Churn Rate (%)
G: LTV ($) [formula]
H: LTV:CAC Ratio
I: Payback Period (months)
J: Health Status
```

### Formulas

#### Column D: CAC (Customer Acquisition Cost)
**Formula (D2):**
```
=IF(C2=0, 0, B2/C2)
```
**Purpose:** Total spend divided by customers acquired  
**Example:** $2,500 spend / 50 customers = $50 CAC

---

#### Column G: LTV (Lifetime Value)
**Formula (G2):**
```
=(E2 * 12 * 0.75) / (F2/100)
```
**Breakdown:**
- E2 * 12 = annualized ARPU
- 0.75 = gross profit margin (adjust to your %)
- F2/100 = convert churn % to decimal

**Example:**
- ARPU: $50/month
- Annualized: $600
- Margin: $450
- Churn: 5%
- LTV = $450 / 0.05 = $9,000

---

#### Column H: LTV:CAC Ratio
**Formula (H2):**
```
=IF(D2=0, "N/A", G2/D2)
```
**Interpretation:**
- < 1.5:1 = Unprofitable
- 1.5-3:1 = Growing but risky
- > 3:1 = Healthy
- > 5:1 = Excellent

---

#### Column I: Payback Period (Months)
**Formula (I2):**
```
=IF(D2=0, "N/A", D2/E2)
```
**Purpose:** How many months of revenue to recoup acquisition cost  
**Target:** < 12 months for SaaS

**Example:** $50 CAC / $50 ARPU = 1 month payback ✓

---

#### Column J: Health Status
**Formula (J2):**
```
=IF(H2 >= 5,
  "🟢 EXCELLENT",
  IF(H2 >= 3,
    "🟡 HEALTHY",
    IF(H2 >= 1.5,
      "🟠 RISKY",
      "🔴 UNPROFITABLE"
    )
  )
)
```

---

## Chart Formulas

**Charts referenced from:** Daily Snapshot, Weekly Aggregation, Monthly Summary

### Chart 1: Daily Signups Trend
**Data Source:** Daily Snapshot columns A & B  
**Chart Type:** Line chart  
**X-axis:** Date (A2:A31)  
**Y-axis:** Signups (B2:B31) + trend line  

**Add average line:**
```
Series 2 (overlay): =AVERAGE(B2:B31) [constant line]
```

---

### Chart 2: MRR Growth Forecast
**Data Source:** Revenue Forecast columns A, F, G  
**Chart Type:** Combo chart (Line + Column)  
**Columns:**
- Column: Forecast MRR (blue)
- Line: Actual MRR (orange)

---

### Chart 3: GitHub Stars Over Time
**Data Source:** GitHub Metrics sheet columns A & B  
**Chart Type:** Line with data points  
**Formatting:** Dual Y-axis (left: absolute stars, right: daily growth %)  

---

### Chart 4: Cohort Retention Heatmap
**Data Source:** Cohort Retention sheet  
**Chart Type:** Heatmap (requires conditional formatting)  

**Conditional Formatting (select data range):**
```
Format → Conditional formatting
Format rules → Color scale
- Minimum: 50% = Red
- Midpoint: 75% = Yellow
- Maximum: 100% = Green
```

---

## Conditional Formatting Rules

### Alert Formula Column (K) - Daily Snapshot

**Range:** K2:K31  
**Rules:**

1. **Red for ALERT:**
   ```
   Format rules → Custom formula is
   =FIND("ALERT", K2) > 0
   Fill color: Red, Text: White
   ```

2. **Green for EXCELLENT:**
   ```
   =FIND("EXCELLENT", K2) > 0
   Fill color: Green, Text: White
   ```

3. **Yellow for ON_TRACK:**
   ```
   =FIND("ON_TRACK", K2) > 0
   Fill color: Yellow, Text: Black
   ```

---

### Color Scale (Percentage Columns)

**Range:** E2:E31, J2:J31 (completion rates)  
**Format:**
```
Format → Conditional formatting
Format rules → Color scale
- Minimum: 40% = Red
- Midpoint: 75% = Yellow
- Maximum: 100% = Green
```

---

### Data Validation (Dropdown for Manual Entries)

**For Notes columns (L, J):**
```
Data → Data validation
List of items:
- "Campaign launched"
- "Server maintenance"
- "Mobile redesign"
- "Bug fix released"
- "[Other]"
```

---

## Data Import Formulas

### Importing from External Sheets

#### Import GitHub Data (if stored separately)
**Formula:**
```
=IMPORTRANGE(
  "https://docs.google.com/spreadsheets/d/GITHUB_SHEET_ID",
  "GitHub Metrics!A:F"
)
```

**First time setup:**
- Sheet will show permission request
- Click "Allow access"
- Then data imports automatically

---

#### Import from Stripe (if exported to Google Sheets)
```
=QUERY(
  IMPORTRANGE(STRIPE_SHEET_ID, "Customers!A:K"),
  "SELECT * WHERE status='active'"
)
```

---

### Query Syntax (if combining multiple sources)

```
=QUERY(
  {
    'Daily Snapshot'!A2:L;
    'Weekly Aggregation'!A2:J
  },
  "SELECT * WHERE Col5 > 0.75",
  0
)
```

---

## Best Practices

### 1. Protect Sensitive Data
```
Tools → Protect sheets and ranges
Select sheets: Revenue Forecast, CAC & LTV, Config
Set to "Editor only" for team members
```

### 2. Use Named Ranges for Complex Formulas

Instead of:
```
=IF(VLOOKUP("...") > 100, ...)
```

Create named range `ALERT_THRESHOLD = 100`:
```
=IF(VLOOKUP("...") > ALERT_THRESHOLD, ...)
```

**To create:**
Data → Named ranges → New range → Name it

---

### 3. Comment Formulas for Clarity

Click cell → Insert → Comment (Ctrl+Alt+M)
```
Example formula in E2
Converts 30% of signups to paid customers
$50 avg subscription value
Updates daily via analytics integration
```

---

### 4. Backup Important Sheets

**Monthly:**
1. File → Download → Excel (.xlsx)
2. Save to: `/backups/metrics/Metrics_Dashboard_[YYYY-MM].xlsx`
3. Keep 3-month rolling backup

---

### 5. Version Control Key Formulas

If formulas change significantly, document in Config sheet:
```
A: Formula Name | B: Old Formula | C: New Formula | D: Change Date | E: Reason
```

---

## Troubleshooting Common Formula Errors

| Error | Cause | Fix |
|-------|-------|-----|
| #REF! | Deleted referenced row/column | Check range references, restore deleted items |
| #NAME? | Typo in formula or function | Check spelling, verify function exists |
| #DIV/0! | Dividing by zero | Add IF check: =IF(denominator=0, 0, numerator/denominator) |
| #N/A | VLOOKUP value not found | Verify value exists in lookup table |
| Circular reference | Formula references its own cell | Check formula doesn't include its own cell |
| QUERY error | Incorrect QUERY syntax | Verify sheet name, column letters, WHERE clause |

---

## Quick Copy-Paste Templates

### Monthly Summary Row Template
```
Copy this entire row and adjust for each month:
[Month] | [B formula] | [C formula] | [D formula] | [E formula] | [F formula] | [G formula] | [H formula] | [Notes]
```

### Weekly Aggregation Row Template
```
[Week Start] | [SUM formula] | [AVERAGE formula] | ... | [Est MRR formula] | [Notes]
```

---

**Last Updated:** 2026-09-19  
**Next Review:** 2026-10-19 (after first full month of tracking)

