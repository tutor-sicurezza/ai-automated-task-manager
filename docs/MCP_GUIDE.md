# Claude Desktop Integration (MCP) — AI AUTOMATED TASK MANAGER

Connect Claude Desktop to manage tasks natively via the Model Context Protocol.

## What is MCP?

The Model Context Protocol (MCP) allows Claude to interact with external systems through a standardized interface. With MCP, Claude can:

- Read and manage your tasks with full permission enforcement
- Execute operations using your credentials (not the server's)
- Update task status and add comments
- Leverage AI for insights and recommendations

**Key principle**: All operations respect your role and RLS policies — Claude does exactly what you'd be allowed to do from the UI.

## Installation

### Step 1: Install Claude Desktop

Download from https://claude.ai/download

### Step 2: Install MCP Connector

```bash
node scripts/mcp/task-manager.mjs --install
```

This:
- Adds the task manager to your Claude configuration
- Sets up authentication with your local credentials
- Restarts Claude Desktop

### Step 3: Restart Claude Desktop

Fully close Claude (not just the window). Then restart it.

### Verify Installation

In Claude, you should see a new "Task Manager" tool in the toolkit:

```
Tools
├── Browse
├── File Search
├── Task Manager ✅
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

### MCP Tool Not Showing

1. Verify installation:
   ```bash
   node scripts/mcp/task-manager.mjs --status
   ```

2. Check configuration:
   - macOS/Linux: `~/.claude/claude.json`
   - Windows: `%APPDATA%\Claude\claude.json`
   - Look for task-manager entry

3. Restart Claude Desktop completely

### Authentication Issues

```
Error: "Not authenticated"

Fix:
1. Check that you're logged in: npm scripts/ai-task-manager.mjs login
2. Verify token: node scripts/ai-task-manager.mjs token
3. Reinstall MCP: node scripts/mcp/task-manager.mjs --install
```

### Operation Denied

```
Error: "Permission denied: insufficient permissions"

This means:
- Your role doesn't allow this operation
- Or the task/user isn't in your accessible scope

Check:
1. Your role (Settings > Team > Your role)
2. If you're in the right department
3. If the task was created by someone else
```

### Slow Responses

The MCP tool communicates over stdin/stdout. If responses are slow:

```bash
# Check local network/permissions
ls -la ~/.claude/

# Verify database connection
supabase status

# Check logs
node scripts/mcp/task-manager.mjs --debug
```

## Examples

See [examples/mcp-setup.sh](../examples/mcp-setup.sh) for installation automation.

## Configuration

### Multiple Organizations

If you have access to multiple organizations:

```bash
node scripts/mcp/task-manager.mjs --install --org "Organization Name"
```

This sets the default organization for the MCP tool.

To switch organizations in Claude:
```
"Switch to Organization B"
Claude: Switching to Organization B...
```

### Disable MCP Tool

To remove the MCP integration:

```bash
node scripts/mcp/task-manager.mjs --uninstall
```

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
