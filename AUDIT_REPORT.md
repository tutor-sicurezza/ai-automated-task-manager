# Audit report: architecture, usability, logic

Repository: `tutor-sicurezza/employee-task-m-last`  
Date: 2026-09-18

## Scope

This report is an audit only. No fixes are included here. It summarizes the main
areas that should be improved or corrected based on a review of the current
frontend, API handlers, state management, and supporting documentation.

## Executive summary

The repository is stronger on security thinking than on structural simplicity.
The codebase shows clear evidence of hard-earned fixes around tenant isolation,
authentication, notifications, email delivery, and AI access. That is the best
part of the project.

The weakest part is maintainability: too much behavior is concentrated in a few
very large files, some state is still split across trusted database records and
organization-scoped JSON blobs, and several important user flows are protected by
careful local reasoning rather than by simpler system boundaries.

From a product perspective, the application is feature-rich and functional, but
it is becoming crowded. Powerful flows exist, yet they are increasingly dense
for ordinary users and increasingly risky to evolve for developers.

## Key findings

### 1. Monolithic frontend orchestration

**Severity:** High  
**Area:** Architecture / maintainability

The main application shell is oversized and carries too many responsibilities.

- `src/App.tsx`
- `src/components/UsersManagement.tsx`
- `src/hooks/useKV.ts`
- `src/hooks/useTasks.ts`

Observed problems:

- view selection, permission gating, dialog orchestration, notifications,
  employee syncing, task actions, analytics state, onboarding state, and settings
  state are all coordinated from one main component;
- multiple flows depend on stable memoization and careful hook wiring to avoid
  re-render and state-sync problems;
- regressions will be hard to localize because unrelated concerns live together.

Why it matters:

- the project is harder to test, reason about, and refactor safely;
- a bug in one branch of `App.tsx` can affect unrelated areas;
- onboarding a new contributor will be slow.

Recommended direction:

- split the app shell by feature area;
- move view-specific logic out of the root component;
- isolate employee admin, task board, analytics, settings, and onboarding flows
  into narrower containers with cleaner interfaces.

### 2. Split source of truth for employee data

**Severity:** High  
**Area:** Architecture / logic integrity

The employee model is partly anchored in trusted database tables and partly kept
inside organization-scoped `app_state`.

Relevant files:

- `src/hooks/useKV.ts`
- `src/hooks/useSyncEmployees.ts`
- `src/lib/dipendenteCorrente.ts`
- `src/lib/orgMembers.ts`

Observed problems:

- employee-facing data is merged from different sources with different trust
  levels;
- some fields are clearly treated as authoritative only in the database, while
  others survive in mutable application state for convenience;
- correctness depends on remembering which fields are safe to trust and which are
  not.

Why it matters:

- this increases the chance of future privilege, display, and data consistency
  bugs;
- it creates subtle differences between “real member state” and “current UI
  snapshot”;
- future developers can easily extend the wrong storage path.

Recommended direction:

- reduce or eliminate employee-profile data stored in org-wide `app_state`;
- define one authoritative source per field and document it as a stable model
  contract;
- keep derived or presentation-only data separate from identity and permission
  data.

### 3. Confusing role naming in the employee model

**Severity:** Medium  
**Area:** Logic / developer ergonomics

In practice, `Employee.role` behaves like a job title while `Employee.userRole`
is the permission role.

Relevant files:

- `src/lib/types.ts`
- `src/hooks/useSyncEmployees.ts`
- `src/lib/permissions.ts`

Why it matters:

- the naming is easy to misread;
- permission bugs become more likely when “role” means two different things;
- UI and backend concepts are close enough to be confused during refactors.

Recommended direction:

- separate naming for organizational permission role and business/job title;
- avoid dual semantic meaning on the same domain object.

### 4. Good security controls, but high complexity cost

**Severity:** Medium  
**Area:** Logic / architecture

The server-side protections are much stronger than average, but the system often
relies on intricate defensive logic and historical context captured in comments.

Relevant files:

- `api/_lib/supabase.ts`
- `api/tasks/index.ts`
- `api/notifications/index.ts`
- `api/tenants/[tenantId]/members.ts`
- `api/email/disiscrivi.ts`
- `api/ai/complete.ts`

Observed problems:

- handlers are careful, but also dense;
- many important invariants are enforced through layered checks scattered across
  API handlers, hooks, and migrations;
- comments are doing a lot of work to explain why code must stay exactly as-is.

Why it matters:

- the current system may be safe, but it is fragile to future simplification by
  someone who does not understand all the history;
- complexity itself becomes a long-term reliability risk.

Recommended direction:

- keep the server authority, but simplify surrounding client and state flows;
- move more invariants into clearer, narrower contracts where possible;
- reduce the number of places a future change must touch to stay correct.

### 5. Usability is trending toward feature crowding

**Severity:** Medium  
**Area:** Usability

The application offers many capabilities inside one interface: task management,
employees, approvals, notifications, departments, analytics, AI tools, settings,
data management, and feedback.

Relevant files:

- `src/App.tsx`
- `src/components/CreateTaskDialog.tsx`
- `src/components/TaskDetailsDialog.tsx`
- `src/components/NotificationPreferences.tsx`

Observed problems:

- core dialogs have become dense;
- advanced features are useful, but they compete for space and attention;
- the product now asks users to understand many concepts in one place.

Why it matters:

- internal tools can tolerate complexity better than consumer apps, but density
  still slows routine work;
- less frequent users will struggle more than daily power users;
- the learning curve rises as features accumulate.

Recommended direction:

- identify the most common daily flows and optimize the UI around them first;
- progressively disclose advanced options;
- reduce the amount of simultaneous choice in task creation and task details.

### 6. Missing E2E and component-level coverage in high-risk flows

**Severity:** High  
**Area:** Quality / regression risk

The repository has strong unit-test coverage for logic but explicitly lacks E2E
and component coverage for the integrated application experience.

Relevant documentation:

- `README.md`
- `DEPARTMENT_ARCHITECTURE.md`

Why it matters:

- this app depends on auth, tenant state, realtime behavior, edge routes, cron
  behavior, and dense UI workflows;
- unit tests will not catch many breakages in those joined-up flows;
- the most likely future regressions are integration regressions, not pure logic
  regressions.

Recommended direction:

- add high-value end-to-end coverage for login, tenant switching, task creation,
  employee management, notifications, and approval flows;
- add targeted component tests for the most interactive dialogs.

### 7. Performance and data-shape pressure still exist

**Severity:** Medium  
**Area:** Architecture / scalability / UX

The repository already contains compensating logic around payload size, task
loading, and attachment handling.

Relevant files:

- `src/hooks/useTasks.ts`
- `src/components/TaskDetailsDialog.tsx`
- `api/tenants/[tenantId]/restore.ts`
- `vite.config.ts`

Observed problems:

- attachments are still stored inside task JSON payloads;
- task loading logic already contains explicit work to avoid over-fetching;
- bundle-size comments in build config indicate meaningful frontend weight.

Why it matters:

- the code is already defending itself from scale limits;
- this is a sign the data model is carrying too much payload inside hot paths;
- performance issues usually get harder, not easier, as features grow.

Recommended direction:

- move large binary/file content away from core task records;
- keep list payloads lean and stable;
- continue separating “list view data” from “detail view data”.

### 8. Operational correctness still depends on external configuration

**Severity:** Medium  
**Area:** Operations / reliability

Some critical behaviors depend on correct Supabase and Vercel configuration
outside the codebase.

Relevant files:

- `src/contexts/AuthContext.tsx`
- `README.md`
- `api/cron/promemoria.ts`
- `vercel.json`

Examples:

- public signup must stay disabled in Supabase;
- cron authentication depends on `CRON_SECRET`;
- API behavior differs meaningfully between `npm run dev` and `vercel dev`.

Why it matters:

- the application can be logically correct in code and still fail in production;
- misconfiguration can silently reopen old holes or break critical features.

Recommended direction:

- make operational requirements more visible and more verifiable;
- keep smoke checks for auth and environment assumptions close to deployment.

### 9. Documentation quality is high, but it also signals scar tissue

**Severity:** Low  
**Area:** Architecture / team health

The inline commentary is unusually strong and often very valuable. But the volume
of defensive explanation suggests the code is carrying a lot of historical repair
context.

Why it matters:

- comments are helping today;
- over time, comments can become the only map through complexity rather than a
  supplement to a simpler design.

Recommended direction:

- preserve the hard-earned lessons, but progressively encode them in cleaner
  boundaries and smaller modules instead of ever-growing narrative comments.

### 10. Minor polish residue remains

**Severity:** Low  
**Area:** Usability / operations / presentation

Example:

- `api/health.ts` still reports `spark-template-backend`

Why it matters:

- not a core defect, but it suggests incomplete cleanup and may confuse future
  operations or monitoring work.

## Priority improvement list

### Priority 1

1. Break up `src/App.tsx` into feature-level containers.
2. Reduce employee data that still lives in organization-scoped `app_state`.
3. Add end-to-end coverage for the highest-risk flows.

### Priority 2

4. Simplify task and employee flows with clearer ownership boundaries.
5. Reduce dialog density for common workflows.
6. Rename or separate job-title role vs authorization role concepts.

### Priority 3

7. Revisit attachment/data modeling for scale.
8. Tighten operational verification around auth and cron configuration.
9. Clean up remaining template/polish residue.

## Final verdict

This project is **more secure than it is maintainable**.

That is better than the reverse, but it is still a problem. The next serious risk
is not likely to be a naive security mistake. It is more likely to be a
regression introduced by complexity: giant files, mixed state ownership, dense
UI flows, and subtle invariants that are easy to disturb.

If the next phase of work is about quality, the best investment is not adding yet
another feature first. It is reducing structural concentration and clarifying
ownership of state and flows.
