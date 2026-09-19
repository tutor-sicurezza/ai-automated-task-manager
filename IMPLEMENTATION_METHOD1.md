# TaskFlow Method 1 Implementation: Complete Inside App with Claude API

## Overview

Method 1 enables task completion directly within the TaskFlow application using Claude AI assistance. Users can complete tasks with automatically generated notes or provide custom context for more specific completion descriptions.

## Architecture

### Files Created

1. **`api/tasks/complete-with-claude.ts`** - Vercel Edge Function
   - Handles task completion requests
   - Validates user permissions and rate limits
   - Calls Claude API for completion notes generation
   - Updates task status in database
   - Logs API usage

2. **`src/hooks/useCompleteTask.ts`** - Custom React Hook
   - Manages task completion state
   - Handles API communication
   - Provides loading states and error handling
   - Includes availability check hook

3. **`src/components/CompleteWithClaudeButton.tsx`** - React Component
   - Dropdown menu UI for completion options
   - Dialog for custom prompt input
   - Accessibility features (ARIA labels, keyboard navigation)
   - Toast notifications for feedback

## Installation & Setup

### 1. Environment Configuration

Ensure `ANTHROPIC_API_KEY` is configured in your Vercel environment:

```bash
# .env.local or Vercel dashboard
ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_WORKSPACE_ID=<optional, if using org-level API key>
```

Optional rate limiting configuration:

```bash
# Maximum completions per hour per user (default: 30)
AI_COMPLETION_RATE_LIMIT_HOUR=30

# API timeout in milliseconds (default: 20000)
AI_TIMEOUT_MS=20000
```

### 2. Dependencies

All required dependencies are already installed:

```json
{
  "@anthropic-ai/sdk": "^0.124.0",
  "sonner": "^2.0.1",
  "@radix-ui/react-dropdown-menu": "^2.1.6",
  "@radix-ui/react-dialog": "^1.1.6"
}
```

### 3. Database Schema

Uses existing TaskFlow tables:
- `public.tasks` - Task data with status and activities
- `ai_usage` - API usage tracking (already configured)

No schema changes required.

## Usage

### Basic Integration

Add the button to task cards or detail views:

```tsx
import { CompleteWithClaudeButton } from '@/components/CompleteWithClaudeButton';
import { useAuth } from '@/contexts/AuthContext';

export function TaskCard({ task }) {
  const { organization } = useAuth();

  return (
    <div className="task-card">
      <h3>{task.title}</h3>
      <p>{task.description}</p>
      
      {/* Add the completion button */}
      <CompleteWithClaudeButton
        task={task}
        tenantId={organization.id}
        onComplete={(result) => {
          console.log('Task completed:', result);
          // Refresh task list or update state
        }}
      />
    </div>
  );
}
```

### Advanced: Custom Callback

```tsx
import { useCompleteTask } from '@/hooks/useCompleteTask';

export function TaskActions({ task, tenantId, onTaskUpdate }) {
  const { completeTask, isLoading, lastError } = useCompleteTask();

  const handleCompletion = async () => {
    const result = await completeTask(task, tenantId, {
      customPrompt: 'Include a summary of the work completed',
      showToast: false, // Handle toasts manually
    });

    if (result.success) {
      onTaskUpdate({
        ...task,
        status: 'completed',
        completionNotes: result.completionNotes,
      });
    }
  };

  return (
    <button
      onClick={handleCompletion}
      disabled={isLoading}
      aria-busy={isLoading}
    >
      {isLoading ? 'Completing...' : 'Complete with AI'}
    </button>
  );
}
```

### Checking Feature Availability

```tsx
import { useAICompletionAvailable } from '@/hooks/useCompleteTask';

export function TaskMenu({ task }) {
  const { isAvailable, isChecking } = useAICompletionAvailable();

  if (isChecking) return <div>Loading...</div>;
  if (!isAvailable) return null;

  return (
    <CompleteWithClaudeButton
      task={task}
      tenantId={organization.id}
    />
  );
}
```

## API Reference

### POST `/api/tasks/complete-with-claude`

Completes a task with Claude AI assistance.

#### Request

```json
{
  "tenantId": "org-uuid",
  "taskId": "task-uuid",
  "taskTitle": "Task Title",
  "taskDescription": "Task description...",
  "customPrompt": "Additional context (optional)",
  "targetStatus": "completed"
}
```

#### Response (Success)

```json
{
  "success": true,
  "taskId": "task-uuid",
  "completionNotes": "Generated completion notes by Claude...",
  "model": "claude-3-5-sonnet-20241022",
  "tokensUsed": {
    "input": 150,
    "output": 85
  }
}
```

#### Response (Error)

```json
{
  "success": false,
  "taskId": "task-uuid",
  "error": "Error code (e.g., 'ai_non_configurata')",
  "message": "Human-readable error message"
}
```

#### Error Codes

| Code | Status | Description | Action |
|------|--------|-------------|--------|
| `ai_non_configurata` | 503 | ANTHROPIC_API_KEY not configured | Contact admin |
| `ai_chiave_non_valida` | 503 | Invalid API key | Check credentials |
| `ai_workspace_mancante` | 503 | Workspace ID required but missing | Configure workspace |
| `ai_credito_esaurito` | 503 | Account out of credits | Purchase credits |
| `limite_richieste_superato` | 429 | Rate limit exceeded (30/hour) | Retry after 1 hour |
| `prompt_troppo_lungo` | 413 | Request exceeds size limit | Reduce prompt length |
| `tenant_mancante` | 400 | tenantId not provided | Include organization ID |
| `task_mancante` | 400 | taskId not provided | Include task ID |

## Features

### Rate Limiting

- **Default**: 30 completions per hour per user
- **Configurable**: Set `AI_COMPLETION_RATE_LIMIT_HOUR` environment variable
- **Response**: HTTP 429 with `Retry-After: 3600` header

### Error Handling

All errors include:
- Stable error code (for translations)
- Human-readable message
- Configuration flag (whether admin intervention needed)
- HTTP status code appropriate for the error

### Completion Modes

#### 1. Quick Complete
- Uses task title and description only
- Fast generation of generic completion notes
- No user interaction required

#### 2. Custom Prompt Complete
- Accepts additional context from user
- Better completion notes with specific details
- Dialog-based UI for prompt input

### Activity Tracking

Completed tasks record:
- Status change from in-progress to completed
- AI-generated completion notes
- Timestamp and user attribution

### Usage Logging

All API calls logged to `ai_usage` table:
- Organization ID
- User ID
- Model used
- Input/output token count
- Timestamp

## Configuration Examples

### Standard Setup (Workspace-Scoped API Key)

```bash
# Vercel environment variables
ANTHROPIC_API_KEY=sk-ant-...
```

### Organization-Level API Key

```bash
# If using an organization-level API key
ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_WORKSPACE_ID=org-abc-123-...
```

### Custom Rate Limiting

```bash
# Allow 50 completions per hour per user
AI_COMPLETION_RATE_LIMIT_HOUR=50

# Shorter timeout for Edge runtime
AI_TIMEOUT_MS=15000
```

## Performance Considerations

### Token Usage

- **Input tokens**: ~150-250 per request (task title + description)
- **Output tokens**: ~80-120 per request (completion notes)
- **Cost**: ~$0.02-$0.05 per completion (at claude-3-5-sonnet rates)

### API Response Time

- **Typical**: 1-3 seconds
- **Edge runtime timeout**: 30 seconds default (configurable)
- **User-facing timeout**: 20 seconds (fails gracefully)

### Database Impact

- Minimal: One UPDATE per completion
- One INSERT to `ai_usage` for logging
- No large data transfers

## Security & Permissions

### Authorization

- ✅ User must be authenticated
- ✅ User must be organization member
- ✅ User must have 'member' or higher role
- ✅ Task must belong to user's organization

### Rate Limiting

- ✅ Per-user hourly limit (prevents abuse)
- ✅ Per-organization limits possible (TODO)
- ✅ Graceful degradation with error codes

### Data Handling

- ✅ API key never sent to client
- ✅ All requests go through Edge Function
- ✅ Claude doesn't store task data
- ✅ Completion notes stored only in TaskFlow DB

## Testing

### Unit Tests

```bash
npm run test
```

### Integration Testing

```tsx
// Test the hook
import { renderHook, act } from '@testing-library/react';
import { useCompleteTask } from '@/hooks/useCompleteTask';

test('completes task successfully', async () => {
  const { result } = renderHook(() => useCompleteTask());
  
  const task = { id: '1', title: 'Test', status: 'in-progress' };
  
  await act(async () => {
    const res = await result.current.completeTask(task, 'org-1');
    expect(res.success).toBe(true);
  });
});
```

### Manual Testing

1. Navigate to a task detail page
2. Click "Complete with AI" button
3. Select "Quick Complete" option
4. Verify:
   - ✅ Toast notification appears
   - ✅ Task status changes to completed
   - ✅ Completion notes appear in activity log
   - ✅ No errors in console or network tab

## Troubleshooting

### Button Not Appearing

**Cause**: AI features not configured or unavailable
**Solution**:
1. Check `ANTHROPIC_API_KEY` in Vercel environment
2. Verify API key is valid: `curl https://api.anthropic.com/v1/models -H "authorization: Bearer $ANTHROPIC_API_KEY"`
3. Check browser console for availability check errors

### Rate Limit Errors

**Cause**: User exceeded 30 completions per hour
**Solution**:
1. Adjust `AI_COMPLETION_RATE_LIMIT_HOUR` if needed
2. Retry after 1 hour
3. Consider batching completions

### Task Status Not Updating

**Cause**: Database update failed
**Solution**:
1. Check Supabase logs for policy violations
2. Verify task belongs to correct organization
3. Check database connection in Vercel logs

### Poor Completion Notes Quality

**Cause**: Task description too generic
**Solution**:
1. Use "Complete with Custom Prompt" option
2. Provide specific deliverables in custom prompt
3. Consider improving task descriptions in system

## Future Enhancements

- [ ] Batch completion for multiple tasks
- [ ] Completion notes templates
- [ ] Multiple model selection (Haiku for speed, Opus for quality)
- [ ] Completion preview before saving
- [ ] Completion notes editing/refinement
- [ ] Organization-level rate limits
- [ ] Usage analytics dashboard
- [ ] Custom system prompts per organization

## Monitoring

### Key Metrics

Track in your monitoring tool:
- Completion success rate
- Average response time
- Token usage per completion
- Rate limit hits
- Error rate by type

### Logs to Monitor

```bash
# In Vercel Function Logs
[complete-with-claude] Claude API call failed
[complete-with-claude] rate limit check failed
[complete-with-claude] Failed to update task
```

## Support & Escalation

### User-Facing Errors

Display user-friendly messages based on error code:

```tsx
const errorMessages: Record<string, string> = {
  'ai_non_configurata': 'AI features are not available. Contact your administrator.',
  'limite_richieste_superato': 'You\'ve reached your hourly completion limit.',
  'ai_chiave_non_valida': 'AI configuration error. Contact your administrator.',
  'risposta_vuota': 'Claude did not generate completion notes. Please try again.',
};
```

### Admin-Level Monitoring

1. Check `ai_usage` table for suspicious patterns
2. Review CloudWatch logs in Vercel dashboard
3. Monitor API key usage in Anthropic dashboard
4. Track organization-level token consumption

## References

- [Anthropic API Documentation](https://docs.anthropic.com/en/api)
- [Claude Models](https://docs.anthropic.com/en/docs/about-claude/latest-claude)
- [TaskFlow Architecture](./DEPARTMENT_ARCHITECTURE.md)
- [Vercel Edge Functions](https://vercel.com/docs/edge-runtime)
- [Supabase Realtime](https://supabase.com/docs/guides/realtime)

---

**Last Updated**: 2025-09-19
**Version**: 1.0.0
**Author**: Claude AI Implementation
