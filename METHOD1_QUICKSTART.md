# Method 1 - Quick Start Guide

## 5-Minute Setup

### 1. Configure Environment

Add to your Vercel environment variables or `.env.local`:

```bash
ANTHROPIC_API_KEY=sk-ant-your-key-here
```

Verify in [Vercel Dashboard](https://vercel.com/dashboard) → Settings → Environment Variables

### 2. Import Component

```tsx
import { CompleteWithClaudeButton } from '@/components/CompleteWithClaudeButton';
import { useAuth } from '@/contexts/AuthContext';

export function TaskDetail({ task }) {
  const { organization } = useAuth();

  return (
    <div>
      <h1>{task.title}</h1>
      <p>{task.description}</p>
      
      {/* Add the button */}
      <CompleteWithClaudeButton
        task={task}
        tenantId={organization.id}
        onComplete={(result) => {
          // Refresh or update state
          console.log('Task completed:', result);
        }}
      />
    </div>
  );
}
```

### 3. Test

```bash
npm run dev
```

Click "Complete with AI" button on any incomplete task. Done!

## What Gets Created

When user completes a task:

1. **Task Status** → Changed to `completed`
2. **Activity Log** → Records completion with Claude's notes
3. **Database** → Completion saved to `activities` column
4. **Logs** → API usage tracked in `ai_usage` table

## File Locations

- **API Endpoint**: `api/tasks/complete-with-claude.ts`
- **React Hook**: `src/hooks/useCompleteTask.ts`
- **UI Component**: `src/components/CompleteWithClaudeButton.tsx`
- **Full Docs**: `IMPLEMENTATION_METHOD1.md`
- **Config Reference**: `METHOD1_SETUP.json`

## Common Errors & Fixes

| Error | Solution |
|-------|----------|
| Button not appearing | Check ANTHROPIC_API_KEY is set |
| "ai_non_configurata" | Add ANTHROPIC_API_KEY to Vercel |
| Rate limit error | Wait 1 hour or increase `AI_COMPLETION_RATE_LIMIT_HOUR` |
| Task not updating | Check database permissions/Supabase logs |

## Next: Advanced Usage

See `IMPLEMENTATION_METHOD1.md` for:
- Custom prompts and templates
- Error handling patterns
- Performance optimization
- Batch operations (Method 2)
- Scheduled completions (Method 3)

---

**Ready?** Push to GitHub and Vercel will deploy automatically!

```bash
git add .
git commit -m "feat: Add Method 1 - Complete Inside App with Claude API"
git push origin main
```
