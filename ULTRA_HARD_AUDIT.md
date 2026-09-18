# Ultra-hard audit

Repository: `tutor-sicurezza/employee-task-m-last`  
Date: 2026-09-18

## Scope

This is a stricter follow-up to the general audit. It focuses on the harshest
prioritization:

1. top 10 problems
2. fix roadmap by impact
3. a separate high-pressure summary for what should be improved or fixed first

No fixes are included in this document.

## Executive verdict

This codebase is no longer naive, but it is still structurally fragile.

It looks like a system that has survived real bugs and learned from them, but it
has mostly learned by adding defensive logic, not by becoming simpler. That
means the project is safer than before, yet still too easy to damage during
future changes.

The main danger is no longer “obvious missing checks.”  
The main danger is **regression under complexity**.

---

## Top 10 problems

### 1. `App.tsx` is a god component

**Severity:** Critical  
**Why it is this high:** too much of the product depends on one file.

File:

- `/home/runner/work/employee-task-m-last/employee-task-m-last/src/App.tsx`

Why this is bad:

- view orchestration, permission-aware UI, notifications, onboarding, settings,
  analytics navigation, employee state, and task flows are coordinated in one
  place;
- this raises regression risk for every feature touching the shell;
- code review quality drops when too much unrelated behavior lives together.

Brutal version:

This file is not a component anymore. It is a soft monolith.

### 2. Employee state still has split authority

**Severity:** Critical

Files:

- `/home/runner/work/employee-task-m-last/employee-task-m-last/src/hooks/useKV.ts`
- `/home/runner/work/employee-task-m-last/employee-task-m-last/src/hooks/useSyncEmployees.ts`
- `/home/runner/work/employee-task-m-last/employee-task-m-last/src/lib/dipendenteCorrente.ts`
- `/home/runner/work/employee-task-m-last/employee-task-m-last/src/lib/orgMembers.ts`

Why this is bad:

- some fields are authoritative in Supabase;
- some survive in organization-scoped `app_state`;
- some are merged into UI representations with different trust assumptions.

Brutal version:

When a system has to remember which copy of employee data is the “real” one, it
already has a modeling problem.

### 3. Oversized feature files are a maintenance tax

**Severity:** High

Main examples:

- `/home/runner/work/employee-task-m-last/employee-task-m-last/src/components/UsersManagement.tsx`
- `/home/runner/work/employee-task-m-last/employee-task-m-last/src/hooks/useTasks.ts`
- `/home/runner/work/employee-task-m-last/employee-task-m-last/src/hooks/useKV.ts`
- `/home/runner/work/employee-task-m-last/employee-task-m-last/api/tenants/[tenantId]/members.ts`

Why this is bad:

- bugs become harder to isolate;
- refactors become higher-risk;
- unrelated behavior gets entangled.

Brutal version:

These files are where complexity goes to hide.

### 4. The domain model still contains semantic traps

**Severity:** High

Files:

- `/home/runner/work/employee-task-m-last/employee-task-m-last/src/lib/types.ts`
- `/home/runner/work/employee-task-m-last/employee-task-m-last/src/lib/permissions.ts`

Example:

- `Employee.role` behaves like a business title
- `Employee.userRole` is the authorization role

Why this is bad:

- the naming invites future mistakes;
- permission and presentation concepts are too easy to confuse.

Brutal version:

If the model needs repeated explanation to avoid misuse, the model is not doing
its job.

### 5. UX is accumulating features faster than structure

**Severity:** High

Files:

- `/home/runner/work/employee-task-m-last/employee-task-m-last/src/components/CreateTaskDialog.tsx`
- `/home/runner/work/employee-task-m-last/employee-task-m-last/src/components/TaskDetailsDialog.tsx`
- `/home/runner/work/employee-task-m-last/employee-task-m-last/src/components/NotificationPreferences.tsx`

Why this is bad:

- key dialogs are dense;
- advanced options compete with routine work;
- the product is becoming mentally expensive to use.

Brutal version:

The app is not streamlined. It is increasingly crowded.

### 6. The project relies too much on developers preserving subtle invariants

**Severity:** High

Files:

- `/home/runner/work/employee-task-m-last/employee-task-m-last/api/_lib/supabase.ts`
- `/home/runner/work/employee-task-m-last/employee-task-m-last/api/tasks/index.ts`
- `/home/runner/work/employee-task-m-last/employee-task-m-last/api/notifications/index.ts`
- `/home/runner/work/employee-task-m-last/employee-task-m-last/src/lib/approvazione.ts`

Why this is bad:

- many correctness guarantees depend on order-sensitive checks;
- comments capture critical historical knowledge;
- future simplification attempts can easily re-open old flaws.

Brutal version:

The code is safer than simple systems, but also more fragile than simple systems.

### 7. Test coverage is strong where the app is least likely to fail

**Severity:** High

Relevant docs:

- `/home/runner/work/employee-task-m-last/employee-task-m-last/README.md`
- `/home/runner/work/employee-task-m-last/employee-task-m-last/DEPARTMENT_ARCHITECTURE.md`

Why this is bad:

- logic tests are useful;
- but missing E2E/component coverage leaves the app exposed exactly where real
  regressions are most likely: auth, UI flow, realtime, multi-step state.

Brutal version:

The unit test count is reassuring, but incomplete reassurance is still a risk.

### 8. Performance workarounds suggest structural payload problems

**Severity:** Medium

Files:

- `/home/runner/work/employee-task-m-last/employee-task-m-last/src/hooks/useTasks.ts`
- `/home/runner/work/employee-task-m-last/employee-task-m-last/src/components/TaskDetailsDialog.tsx`
- `/home/runner/work/employee-task-m-last/employee-task-m-last/api/tenants/[tenantId]/restore.ts`

Why this is bad:

- attachments still create pressure on hot data paths;
- the system is already compensating to avoid over-fetching;
- that means scale pain is not hypothetical.

Brutal version:

The repo is already negotiating with its own data shape.

### 9. Operational correctness is still too configuration-sensitive

**Severity:** Medium

Files:

- `/home/runner/work/employee-task-m-last/employee-task-m-last/src/contexts/AuthContext.tsx`
- `/home/runner/work/employee-task-m-last/employee-task-m-last/api/cron/promemoria.ts`
- `/home/runner/work/employee-task-m-last/employee-task-m-last/vercel.json`

Why this is bad:

- critical safety depends on deployment configuration being right;
- local developer behavior differs depending on which command is used;
- failures can be environmental, not just code-level.

Brutal version:

A system that is correct only when its setup is perfect is not robust enough.

### 10. The repo still shows template residue and uneven cleanup

**Severity:** Low

Example:

- `/home/runner/work/employee-task-m-last/employee-task-m-last/api/health.ts`

Why this matters:

- low severity, but it signals that cleanup is incomplete;
- incomplete cleanup often correlates with future confusion in operations and
  maintenance.

Brutal version:

Small leftovers are not the main problem, but they reveal discipline gaps.

---

## Fix roadmap in impact order

## Phase 1 — reduce structural risk first

### A. Split the app shell

Target:

- `/home/runner/work/employee-task-m-last/employee-task-m-last/src/App.tsx`

Goal:

- move feature orchestration into narrower containers;
- reduce the blast radius of routine changes.

Expected value:

- biggest improvement in maintainability and regression control.

### B. Define authoritative ownership for employee fields

Target:

- employee/profile/membership/app-state boundary

Goal:

- one authoritative source per field;
- clear separation between permission data, identity data, and presentation data.

Expected value:

- major reduction in subtle sync and trust bugs.

### C. Add E2E coverage for critical flows

Priority flows:

- login
- tenant selection/switch
- task creation/edit
- employee add/edit/remove
- role changes
- approval flow
- notifications

Expected value:

- catches the class of regressions unit tests are weakest at catching.

## Phase 2 — simplify user-facing pressure points

### D. Reduce density in `CreateTaskDialog`

Goal:

- separate common actions from advanced controls;
- make the default path faster and clearer.

### E. Reduce density in `TaskDetailsDialog`

Goal:

- stop using one dialog as the universal task control surface;
- split secondary behavior from the primary reading/editing path.

### F. Rework role naming and model clarity

Goal:

- remove semantic ambiguity around role/title/permission role.

Expected value:

- low visual impact, high future correctness value.

## Phase 3 — remove persistent scaling and complexity debt

### G. Revisit task attachment storage shape

Goal:

- keep heavy payloads out of hot task records.

### H. Reduce manual invariant reassembly

Goal:

- fewer places recomputing the same rules;
- stronger central contracts for permission/state transitions.

### I. Harden operational verification

Goal:

- make critical environment assumptions easier to detect and harder to forget.

---

## “Fix this first” summary

If only a few things happen next, they should be these:

1. break up `App.tsx`
2. clean up employee state ownership
3. add E2E coverage on critical flows
4. simplify the two densest dialogs
5. remove ambiguous role naming

Everything else is secondary to those.

---

## Final ultra-hard conclusion

This repository is no longer reckless.  
But it is still too dependent on careful humans protecting a complicated system.

That is not the same thing as having a clean system.

Right now the codebase feels like this:

- smart
- defensive
- experienced
- crowded
- easy to regress

The next major quality win should not be another feature.  
It should be **structural simplification with tighter ownership of state and
flows**.
