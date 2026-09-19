## Description

Brief description of what this PR does.

**Closes:** #___

## Type of Change

- [ ] Bug fix (non-breaking change that fixes an issue)
- [ ] New feature (non-breaking change that adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to change)
- [ ] Documentation update
- [ ] Performance improvement
- [ ] Refactoring
- [ ] Test improvement

## Related Issues

- Closes #___
- Related to #___
- Fixes #___

## Changes Made

- [ ] Change 1
- [ ] Change 2
- [ ] Change 3

## Affected Areas

- [ ] Task Management
- [ ] Permissions / RLS
- [ ] Notifications
- [ ] Approvals
- [ ] Claude Integration (MCP)
- [ ] Analytics
- [ ] Email
- [ ] CLI
- [ ] Database / Migrations
- [ ] API / Routes
- [ ] Other: ___________

## Testing Done

Describe the testing you've performed:

```
npm run test          # unit tests
npm run typecheck     # type checking
npm run lint          # linting
npm run build         # build verification
```

Test results: ✅ All passing

### Manual Testing

Describe any manual testing:

1. Step 1
2. Step 2
3. Observed result

## Security Considerations

If this change affects permissions, authentication, or database access:

**What operation becomes possible, and for whom?**

- ___

**Have you verified RLS policies are still enforced?**
- [ ] Yes, tested with non-admin user
- [ ] No changes to permissions
- [ ] N/A

## Breaking Changes

- [ ] No breaking changes
- [ ] Breaking changes (describe below)

Breaking changes:
- ___

## Migration Notes

If this requires database migrations:

```bash
# Migration command if needed
supabase db push
```

## Screenshots / Demo

If applicable, add screenshots or links to demo:

---

## Checklist

Before requesting review:

- [ ] My code follows the style guidelines of this project
- [ ] I've added/updated tests for my changes
- [ ] My changes generate no new warnings
- [ ] I've updated documentation if needed
- [ ] I've tested this in development (vercel dev)
- [ ] I've tested with production database structure if applicable
- [ ] All tests pass locally (npm run test && npm run typecheck && npm run lint && npm run build)
- [ ] For permission changes: I've described which operation becomes possible for whom
- [ ] For database changes: I've added a migration in supabase/migrations/

## Review Guidance

Things reviewers should pay special attention to:

1. ___
2. ___

## Additional Notes

Any additional context for reviewers:

---

**Author checklist:**
- [ ] This PR is ready for review
- [ ] I've assigned reviewers
- [ ] I've added appropriate labels
- [ ] I've linked related issues
