# API Reference — AI AUTOMATED TASK MANAGER

Complete REST API documentation for integrations and custom applications.

## Overview

The AI AUTOMATED TASK MANAGER API is built on Supabase (Postgres + PostgREST) with serverless functions on Vercel.

**Base URL**: `https://your-project.supabase.co/rest/v1`

**Headers required**:
```
Authorization: Bearer {token}
Content-Type: application/json
```

## Authentication

### Get JWT Token

```bash
curl -X POST 'https://your-project.supabase.co/auth/v1/token?grant_type=password' \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password"
  }'
```

Response:
```json
{
  "access_token": "eyJhbGc...",
  "token_type": "bearer",
  "expires_in": 3600
}
```

Use `access_token` in Authorization header for all requests.

### Service Role Authentication

For server-to-server operations, use service role key:

```bash
curl -X GET 'https://your-project.supabase.co/rest/v1/tasks' \
  -H "Authorization: Bearer {SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json"
```

**Warning**: Service role key has no RLS restrictions. Never expose to client.

## Tasks Endpoint

### List Tasks

```
GET /rest/v1/tasks
```

**Query Parameters**:
- `status` — Filter by status (todo, in_progress, done, etc.)
- `assigned_to` — Filter by assignee UUID
- `department_id` — Filter by department
- `priority` — Filter by priority (low, normal, high, urgent)
- `order_by` — Sort field (created_at, due_date, priority)
- `limit` — Results per page (default: 25, max: 1000)
- `offset` — Pagination offset

**Example**:
```bash
curl 'https://project.supabase.co/rest/v1/tasks?status=eq.todo&priority=eq.urgent&limit=10' \
  -H "Authorization: Bearer $TOKEN"
```

**Response**:
```json
[
  {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "title": "Implement task routing",
    "description": "Add AI-powered routing...",
    "status": "todo",
    "priority": "high",
    "assigned_to": "user-uuid",
    "created_by": "creator-uuid",
    "department_id": "dept-uuid",
    "due_date": "2024-01-15",
    "created_at": "2024-01-08T10:30:00Z",
    "updated_at": "2024-01-08T10:30:00Z",
    "blocked_by": ["dep-uuid-1", "dep-uuid-2"],
    "labels": ["feature", "urgent"],
    "approval_required": true,
    "approval_status": "pending"
  }
]
```

### Get Task Details

```
GET /rest/v1/tasks/{id}
```

**Example**:
```bash
curl 'https://project.supabase.co/rest/v1/tasks/123e4567-e89b-12d3-a456-426614174000' \
  -H "Authorization: Bearer $TOKEN"
```

**Response**: Single task object (see List Tasks)

### Create Task

```
POST /rest/v1/tasks
```

**Request Body**:
```json
{
  "title": "New task",
  "description": "Task description",
  "status": "todo",
  "priority": "normal",
  "assigned_to": "user-uuid",
  "department_id": "dept-uuid",
  "due_date": "2024-02-01",
  "labels": ["label1", "label2"],
  "blocked_by": ["dep-uuid"],
  "approval_required": false,
  "recurrence": "weekly"
}
```

**Required**: `title`, `department_id`

**Example**:
```bash
curl -X POST 'https://project.supabase.co/rest/v1/tasks' \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Review PR #123",
    "description": "Code review needed",
    "priority": "high",
    "department_id": "dept-uuid"
  }'
```

**Response**: Created task object

### Update Task

```
PATCH /rest/v1/tasks/{id}
```

**Request Body** (any combination):
```json
{
  "status": "in_progress",
  "priority": "urgent",
  "assigned_to": "new-user-uuid",
  "description": "Updated description",
  "due_date": "2024-02-15"
}
```

**Example**:
```bash
curl -X PATCH 'https://project.supabase.co/rest/v1/tasks/123e4567...' \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "done"}'
```

**Response**: Updated task object

**Note**: Updates are logged to audit trail. RLS policies enforce permissions.

### Delete Task

```
DELETE /rest/v1/tasks/{id}
```

**Example**:
```bash
curl -X DELETE 'https://project.supabase.co/rest/v1/tasks/123e4567...' \
  -H "Authorization: Bearer $TOKEN"
```

**Note**: Only task creator and admins can delete. Deletion is audited.

## Comments Endpoint

### List Comments

```
GET /rest/v1/task_comments?task_id=eq.{task_id}
```

**Example**:
```bash
curl 'https://project.supabase.co/rest/v1/task_comments?task_id=eq.123e4567...' \
  -H "Authorization: Bearer $TOKEN"
```

### Create Comment

```
POST /rest/v1/task_comments
```

**Request Body**:
```json
{
  "task_id": "task-uuid",
  "content": "Comment text with @mention support",
  "attachments": [
    {
      "url": "https://example.com/file.pdf",
      "name": "document.pdf",
      "type": "application/pdf"
    }
  ]
}
```

**Example**:
```bash
curl -X POST 'https://project.supabase.co/rest/v1/task_comments' \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "task_id": "123e4567...",
    "content": "Great work on this, @sarah!"
  }'
```

## Approvals Endpoint

### List Approvals

```
GET /rest/v1/approvals?task_id=eq.{task_id}
```

### Create Approval Request

```
POST /rest/v1/approvals
```

**Request Body**:
```json
{
  "task_id": "task-uuid",
  "required_role": "manager",
  "description": "Please review this task"
}
```

### Update Approval

```
PATCH /rest/v1/approvals/{id}
```

**Request Body**:
```json
{
  "status": "approved",
  "comment": "Looks good!"
}
```

## Notifications Endpoint

### List User Notifications

```
GET /rest/v1/notifications
```

Automatically filtered to current user by RLS policy.

**Example**:
```bash
curl 'https://project.supabase.co/rest/v1/notifications?limit=20' \
  -H "Authorization: Bearer $TOKEN"
```

### Mark Notification Read

```
PATCH /rest/v1/notifications/{id}
```

**Request Body**:
```json
{
  "read_at": "2024-01-08T12:00:00Z"
}
```

### Update Notification Preferences

```
PATCH /rest/v1/user_notification_preferences
```

**Request Body**:
```json
{
  "notify_on_assigned": true,
  "notify_on_comment": true,
  "notify_on_approval": false,
  "quiet_hours_start": "18:00",
  "quiet_hours_end": "08:00",
  "email_digest_frequency": "daily"
}
```

## Users Endpoint

### Get Current User

```
GET /rest/v1/users?id=eq.{user_id}
```

Or use Supabase auth endpoint:

```bash
curl 'https://project.supabase.co/auth/v1/user' \
  -H "Authorization: Bearer $TOKEN"
```

### List Team Users

```
GET /rest/v1/users?department_id=eq.{department_id}
```

Filters based on your permissions.

## Departments Endpoint

### List Departments

```
GET /rest/v1/departments
```

Filtered by accessible departments based on your role.

### Get Department Analytics

```
GET /rest/v1/department_analytics?id=eq.{department_id}
```

**Response**:
```json
{
  "id": "dept-uuid",
  "name": "Engineering",
  "total_tasks": 42,
  "completed_tasks": 28,
  "completion_rate": 66.7,
  "average_task_age": 3.5,
  "overdue_count": 3,
  "team_size": 5
}
```

## Error Handling

Standard HTTP status codes:

| Code | Meaning | Example |
| --- | --- | --- |
| 200 | Success | Task retrieved |
| 201 | Created | Task created |
| 204 | No Content | Update successful |
| 400 | Bad Request | Invalid JSON |
| 401 | Unauthorized | Missing auth token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Task doesn't exist |
| 409 | Conflict | RLS policy violation |
| 500 | Server Error | Database error |

**Example Error Response**:
```json
{
  "code": "42501",
  "message": "new row violates row-level security policy",
  "details": "Assigned user is not in your department"
}
```

## Webhook Events

When you enable webhooks, these events are sent:

- `task.created` — New task created
- `task.updated` — Task updated
- `task.completed` — Task marked done
- `task.deleted` — Task deleted
- `comment.created` — Comment added
- `approval.requested` — Approval needed
- `approval.approved` — Task approved
- `approval.rejected` — Task rejected

**Event Payload**:
```json
{
  "type": "task.updated",
  "timestamp": "2024-01-08T10:30:00Z",
  "user_id": "user-uuid",
  "data": {
    "id": "task-uuid",
    "title": "Task title",
    "status": "in_progress",
    "previous_status": "todo"
  }
}
```

## Rate Limiting

- **Anon key**: 100 requests/minute
- **Service role**: 1000 requests/minute
- **Auth token**: 500 requests/minute

## Examples

### Node.js / JavaScript

```javascript
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://project.supabase.co',
  'anon-key'
);

// Get user's tasks
const { data, error } = await supabase
  .from('tasks')
  .select('*')
  .eq('assigned_to', user.id)
  .eq('status', 'todo');

// Update task
await supabase
  .from('tasks')
  .update({ status: 'done' })
  .eq('id', taskId);
```

### Python

```python
from supabase import create_client, Client

url = "https://project.supabase.co"
key = "anon-key"
supabase: Client = create_client(url, key)

# Get tasks
response = supabase.table('tasks').select('*').execute()

# Create task
response = supabase.table('tasks').insert({
    'title': 'New task',
    'department_id': dept_id
}).execute()
```

### cURL

```bash
# List tasks
curl 'https://project.supabase.co/rest/v1/tasks' \
  -H "Authorization: Bearer $TOKEN"

# Create task
curl -X POST 'https://project.supabase.co/rest/v1/tasks' \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"New task","department_id":"dept-id"}'
```

## Support

- **API Issues**: GitHub Issues
- **Questions**: GitHub Discussions
- **Documentation**: https://supabase.com/docs
- **Email**: support@aiautomatedtaskmanager.dev

---

See also:
- [MCP_GUIDE.md](MCP_GUIDE.md) — Claude Desktop integration
- [SECURITY.md](SECURITY.md) — Security model and RLS policies
- [docs/FEATURES_AND_BENEFITS.md](FEATURES_AND_BENEFITS.md) — Feature overview
