# Claude Desktop Integration (MCP) — TaskFlow

Connect Claude Desktop to manage tasks natively via the Model Context Protocol.

**Quick start?** See [CLAUDE_CLI_SETUP.md](CLAUDE_CLI_SETUP.md) for a 30-second setup guide.

## What is MCP?

The Model Context Protocol (MCP) allows Claude to interact with external systems through a standardized interface. With MCP, Claude can:

- Read and manage your tasks with full permission enforcement
- Execute operations using your credentials (not the server's)
- Update task status and add comments
- Leverage AI for insights and recommendations

**Key principle**: All operations respect your role and RLS policies — Claude does exactly what you'd be allowed to do from the UI.

## Installation (30 seconds)

### Prerequisites

- **Claude Desktop** installed ([download](https://claude.ai/download))
- **Node.js 18+** on your computer
- **TaskFlow authenticated** — run `node scripts/taskflow.mjs accedi` first

### Step-by-Step

1. **Authenticate to TaskFlow:**
   ```bash
   node scripts/taskflow.mjs accedi
   ```
   This creates `~/.taskflow/session.json`

2. **Install the MCP connector:**
   ```bash
   node scripts/mcp/taskflow-connector.mjs --install
   ```

3. **Restart Claude Desktop** fully (don't just close the window)

4. **Test it:**
   In Claude, ask: "List my open tasks"

### Verify Installation

Check status anytime:

```bash
node scripts/mcp/taskflow-connector.mjs --status
```

You should see:
```
✓ TaskFlow connector is installed

Configuration:
  Command: node
  Args: ["/path/to/taskflow-connector.mjs"]
```

## Usage

### Basic Commands

Ask Claude to manage your tasks:

```
"List my open tasks"
Claude:
  1. Implement feature X (High, due Jan 15)
  2. Review PR #42 (Normal, due Jan 10)
  3. Fix bug in auth (Urgent, due Jan 8)
```

```
"Show my tasks due this week"
Claude will filter and display tasks due in the next 7 days.
```

```
"What's blocking my critical tasks?"
Claude analyzes your blocked tasks and summarizes.
```

### Workflow Examples

#### Example 1: Daily Standup

```
You: "Give me my daily standup report"

Claude:
📊 Your Daily Standup

Tasks completed yesterday: 3
Tasks in progress: 5
Tasks due today: 2
Blocked tasks: 1 (waiting on backend)

High priority items:
1. Finish API integration (due today)
2. Security review (due in 2 days)

Risks:
- Backend task is blocking 2 others
- No one working on Q1 planning yet

Recommendations:
- Prioritize API integration today
- Check with backend team on blocker
```

#### Example 2: Assign Work to Team

```
You: "Which team member is least busy? Assign the API integration task to them."

Claude:
Looking at team capacity...
- Sarah: 3 tasks (capacity OK)
- Mike: 7 tasks (at capacity)
- Ali: 2 tasks (has bandwidth)

Assigning "API integration" to Ali
✅ Task assigned. Ali has been notified.
```

#### Example 3: Prioritization Help

```
You: "Help me prioritize this week's work"

Claude:
📋 Priority Ranking

1. Security review (Urgent, due Jan 10)
   - Blocks release to production
   - Takes ~4 hours

2. API integration (High, due Jan 12)
   - 2 other features depend on this
   - Takes ~6 hours

3. Documentation (Normal, due Jan 20)
   - No dependencies
   - Can be parallelized

4. Nice-to-have feature (Low)
   - No deadline
   - Defer if time is tight
```

#### Example 4: Update Task & Notify

```
You: "Mark 'API integration' as done and add a note"

Claude:
Updating task...
✅ Status changed to "done"
✅ Note added: "Completed API integration, ready for testing"
✅ Notifications sent to watchers

Next steps:
- QA team should test the integration
- Sarah (who requested it) has been notified
```

## Available Tools

Claude has access to four core task management tools:

### 1. `list_tasks`

List your tasks with optional filters.

```
Parameters:
- status: Filter by status (todo, in_progress, done, etc.)
- priority: Filter by priority (low, normal, high, urgent)
- assigned_to: "me" or user email
- department: Filter by department name
- due_before: ISO date (e.g., "2024-01-15")
- limit: Max results (default: 25)

Example:
list_tasks(status="todo", priority="urgent")
→ Returns your urgent open tasks
```

### 2. `read_task`

Get detailed information about a specific task.

```
Parameters:
- id: Task UUID

Returns:
- Full task details
- Comments (if any)
- Activity history
- Approval status
- Blockers
- Attachments

Example:
read_task(id="123e4567...")
→ Returns task with full context
```

### 3. `update_task_status`

Change a task's status and add an optional note.

```
Parameters:
- id: Task UUID
- status: New status (todo, in_progress, done, etc.)
- note: Optional comment to add

Example:
update_task_status(
  id="123e4567...",
  status="done",
  note="Completed API integration, all tests passing"
)
→ Updates task and sends notifications
```

### 4. `add_comment`

Add a comment to a task.

```
Parameters:
- task_id: Task UUID
- content: Comment text (supports @mentions)
- attachments: Optional file URLs

Example:
add_comment(
  task_id="123e4567...",
  content="@sarah The API is ready for review"
)
→ Adds comment and notifies @sarah
```

## Limitations

**What Claude CAN'T do:**

- Create new tasks (prevents accidental spam)
- Delete tasks (requires confirmation in UI)
- Change permissions or roles
- Access tasks from other organizations
- Bypass RLS policies or approval requirements

**Why?** These safeguards prevent accidental changes and maintain security.

**Workaround**: Use the web interface for these operations.

## Permissions

All operations use **your credentials**, not the server's:

```
Your permissions → Claude operations

If you're a "viewer":
  ✅ Can read tasks
  ❌ Cannot update status
  ❌ Cannot assign work

If you're a "manager":
  ✅ Can read all department tasks
  ✅ Can assign work
  ✅ Can update status
  ❌ Cannot create approval rules

If you're an "admin":
  ✅ Full access (same as UI)
```

Your role is checked for every operation. If you can't do something in the UI, Claude can't do it either.

## Debugging

### Troubleshooting Checklist

| Problem | Solution |
|---------|----------|
| "TaskFlow tool not showing in Claude" | Run `node scripts/mcp/taskflow-connector.mjs --install` and restart Claude completely |
| "Not authenticated" | Run `node scripts/taskflow.mjs accedi` to create session |
| "Cannot find Claude config" | Install Claude Desktop first, then try the installer again |
| "Permission denied" error | Verify your TaskFlow role in settings (you might be a viewer) |
| "Slow responses" | Restart Claude completely; MCP server might have crashed |

### MCP Tool Not Showing

**Verify:**
```bash
node scripts/mcp/taskflow-connector.mjs --status
```

**Fix if not installed:**
```bash
# Step 1: Authenticate
node scripts/taskflow.mjs accedi

# Step 2: Install
node scripts/mcp/taskflow-connector.mjs --install

# Step 3: Fully restart Claude
```

**macOS**: Cmd+Q then reopen
**Windows**: Close all Claude windows and reopen
**Linux**: Close the window and reopen

### Authentication Issues

**Error: "Not authenticated"**

```bash
# Create session
node scripts/taskflow.mjs accedi

# Check session file
cat ~/.taskflow/session.json  # should show token

# Reinstall if needed
node scripts/mcp/taskflow-connector.mjs --install
```

### Operation Denied

**Error: "Permission denied: insufficient permissions"**

This means your TaskFlow role doesn't allow the operation. Check in the TaskFlow UI:
- Settings > Team > Your Role
- You might be a "viewer" (read-only)
- Ask an admin to change your role to "manager" or "admin"

### Slow or Stuck Responses

The MCP connector might have crashed. The fix is always:

```bash
# Fully restart Claude (don't just close the window)
# macOS: Cmd+Q
# Windows: Alt+F4 on all Claude windows
# Linux: Close the window

# Then reopen Claude
```

If it keeps happening, check your task count (very large task lists might slow it down).

## Examples

See [examples/mcp-setup.sh](../examples/mcp-setup.sh) for installation automation.

## Configuration

### Uninstall MCP Connector

To remove the connector:

```bash
node scripts/mcp/taskflow-connector.mjs --uninstall
```

Then restart Claude Desktop.

### Multiple Organizations

If you have access to multiple TaskFlow organizations, set the default:

```bash
TASKFLOW_ORG="Organization Name" node scripts/mcp/taskflow-connector.mjs --install
```

Replace "Organization Name" with your actual organization name in TaskFlow.

To verify which organization is configured:

```bash
node scripts/mcp/taskflow-connector.mjs --status
```

If `TASKFLOW_ORG` is set, it will show in the configuration.

## Best Practices

### Do

- ✅ Use Claude for daily task reviews
- ✅ Leverage AI for prioritization help
- ✅ Have Claude track blockers
- ✅ Use for routine status updates
- ✅ Ask for workload analysis

### Don't

- ❌ Assign sensitive tasks via Claude chat (privacy)
- ❌ Rely on Claude for compliance decisions
- ❌ Treat Claude suggestions as decisions (still you decide)
- ❌ Share transcripts with task details

## Privacy & Security

**What is logged:**
- Your Claude conversation transcripts (by Anthropic)
- Task operations (in our audit trail)
- Authentication token in local storage

**What is NOT logged:**
- Task details (sent to Claude, not stored by us)
- Conversation content (with us, sent to Anthropic)

**Security model:**
- MCP operates over stdin/stdout (local-only)
- Uses your existing authentication token
- Cannot access your password
- Cannot access other users' tasks

See [SECURITY.md](SECURITY.md) for full security model.

## Advanced

### Custom MCP Server

To run your own MCP server:

```bash
# Clone the MCP implementation
git clone https://github.com/aiautomatedtaskmanager/mcp-server.git

# Run locally
node server.js --auth-token $YOUR_TOKEN
```

Then configure Claude to use your server instead.

## Support

- **Issues**: GitHub Issues > label:mcp
- **Questions**: GitHub Discussions
- **Email**: support@aiautomatedtaskmanager.dev

## See Also

- [QUICKSTART.md](../QUICKSTART.md) — 5-minute setup
- [API_REFERENCE.md](API_REFERENCE.md) — REST API docs
- [SECURITY.md](SECURITY.md) — Security model
- [docs/FEATURES_AND_BENEFITS.md](FEATURES_AND_BENEFITS.md) — Feature overview

---

Ready to connect Claude? Start with:
```bash
node scripts/mcp/task-manager.mjs --install
```

Then restart Claude Desktop and try:
> "List my open tasks"
