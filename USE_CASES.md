# Example Prompts — AI Automated Task Manager

This page collects **illustrative prompts** for the kinds of drafting and
summarizing work you can hand to Claude through the AI Automated Task Manager
CLI and MCP connector.

> **These are examples, not benchmarks.** The outputs below are illustrative and
> were not produced from a real dataset. We do **not** publish "time saved"
> figures, ROI percentages, or customer testimonials, because we have not
> measured them. How long any of this takes, and whether it helps, depends
> entirely on your own workflow — measure it yourself before trusting a number.

For end-to-end scenarios that describe how the product actually orchestrates
tasks (assignment, routing, approvals, escalation), see
[docs/USE_CASES.md](docs/USE_CASES.md).

---

## How you ask

Each example is a prompt you can adapt. Run it via the CLI:

```bash
node scripts/taskflow-cli.mjs run "<your prompt>"
```

or ask Claude Desktop directly once the MCP connector is installed
(see [docs/MCP_GUIDE.md](docs/MCP_GUIDE.md)).

---

## 1. Draft a weekly status update

```
Draft a weekly status update for the week of {date}:
- summarize what the team shipped
- list open blockers and who owns each
- flag anything at risk of slipping
- keep it under one screen
```

Claude returns a first draft you edit — it does not invent metrics it wasn't
given, so supply the numbers you want included.

## 2. Turn rough notes into meeting minutes

```
Turn these raw notes into structured minutes:
- decisions taken
- action items with an owner and a due date each
- open questions
{paste notes}
```

## 3. Draft a reply to a detailed customer email

```
Draft a reply to the email below. Address each point separately, keep the tone
calm and concrete, and end with clear next steps. Do not promise dates I have
not given you.
{paste email}
```

## 4. Write first-pass documentation

```
Write first-pass reference docs for this function: purpose, parameters, return
value, error cases, and one usage example. Mark anything you're unsure about
with TODO so I can fill it in.
{paste code}
```

## 5. Summarize a batch of feedback

```
Summarize the feedback below into themes, ranked by how often each appears.
Separate what people liked from what they struggled with. Quote sparingly and
do not attribute quotes to named people.
{paste feedback}
```

---

## A note on outputs

Anything a model drafts is a starting point, not a finished artifact. Review it
before it leaves your hands — especially figures, names, dates, and commitments.
The connector runs with **your** permissions and its actions are logged; see
[docs/SECURITY.md](docs/SECURITY.md).
