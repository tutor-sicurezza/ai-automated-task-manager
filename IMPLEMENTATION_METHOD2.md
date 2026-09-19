# TaskFlow Method 2: Complete via Claude Desktop (MCP Connector)

## Overview

**Method 2** enables you to work on TaskFlow tasks directly from Claude Desktop using the MCP (Model Context Protocol) connector. Claude reads your tasks and writes back the results — no manual copying, no manual updating.

### Key Features

- ✅ Claude Desktop integration via MCP server
- ✅ Read and complete tasks directly from Claude
- ✅ Full permission checking (Claude respects your access level)
- ✅ No service keys, no complex setup
- ✅ Works with your existing TaskFlow login

### How It Works

1. You install the MCP connector in Claude Desktop (one-time setup)
2. You ask Claude to help with a task by ID
3. Claude uses the connector tools to read task details
4. Claude completes the work and marks the task done in TaskFlow
5. You see the update instantly in the TaskFlow UI

---

## Installation

### Prerequisites

- TaskFlow repository cloned and Node.js installed
- Claude Desktop installed
- Already logged into TaskFlow

### Step 1: Login to TaskFlow

First, authenticate with TaskFlow (required for the connector to access your session):

```bash
node scripts/taskflow.mjs accedi
```

This saves your login credentials in `~/.taskflow/session.json`.

### Step 2: Install the MCP Connector

```bash
node scripts/mcp/taskflow-connector.mjs --install
```

If you have multiple organizations, specify which one to use:

```bash
node scripts/mcp/taskflow-connector.mjs --install --org <organization-id>
```

The installer will:
- Locate your Claude Desktop configuration file
- Add the TaskFlow connector to `mcpServers`
- Verify the setup

**Configuration Files:**

- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%/Claude/claude_desktop_config.json`
- **Linux**: `~/.config/Claude/claude_desktop_config.json`

### Step 3: Restart Claude Desktop

Complete restart required for Claude to load the new connector.

---

## Usage

### In Claude Desktop

Once installed, you have four tools available:

#### 1. **list-tasks()**
List all your assigned tasks:
```
I have these tools available:
- list-tasks() → See all my open tasks
- read-task(id) → Get full details
- complete-task(id, note?) → Mark complete
- add-note(id, text) → Add a comment
```

**Example**: "Show me my open tasks in TaskFlow"

#### 2. **read-task(id)**
Get full details of a specific task:

```
read-task("3f2a")  // Can use partial ID
```

Returns: title, status, priority, description, subtasks, blocking tasks, recent comments.

#### 3. **complete-task(id, note?)**
Mark a task as completed:

```
complete-task("3f2a", "Finished the implementation and tested locally")
```

- Changes status to "completed"
- Adds the note as a comment
- Sends notifications to followers
- Records the change in history

#### 4. **add-note(id, text)**
Add a comment without changing status:

```
add-note("3f2a", "Ready for review, waiting for feedback")
```

### Working With Tasks

**Typical Workflow:**

```
User: "Help me complete task 3f2a"

Claude uses:
1. read-task("3f2a")  ← Gets full details
2. [Works on the task]
3. complete-task("3f2a", "Completed the feature")  ← Marks done
```

**Task Blocking:**

If a task is blocked by others, `read-task()` shows:
```
Blocked by:
  - Task ABC1 [in-progress]
  - Task ABC2 [in-progress]
```

The database enforces: blocked tasks cannot be marked complete until blockers are closed.

**Status Values:**

- `not-started` — Not yet begun
- `in-progress` — Work in progress
- `blocked` — Waiting for something else
- `completed` — Done (awaits approval if required)

---

## Architecture

### MCP Server: `scripts/mcp/taskflow-connector.mjs`

The connector is a Node.js MCP server that:

1. **Loads your session** from `~/.taskflow/session.json`
2. **Validates authentication** before each action
3. **Routes requests** to the TaskFlow core API
4. **Enforces permissions** using your RLS policies
5. **Handles errors gracefully** with user-friendly messages

**No Service Keys:** The connector never uses administrative credentials. It acts only with your user's permissions — exactly as if you were using the TaskFlow UI.

### React Component: `src/components/CompleteWithDesktopButton.tsx`

A button component that provides:

- Installation guide for first-time setup
- Quick copy-paste of task markdown for Claude
- Links to documentation
- Status of connector availability

**Usage:**

```tsx
import { CompleteWithDesktopButton } from '@/components/CompleteWithDesktopButton';
import type { Task } from '@/lib/types';

export function TaskDetail({ task }: { task: Task }) {
  return (
    <>
      <h1>{task.title}</h1>
      <CompleteWithDesktopButton task={task} />
    </>
  );
}
```

### Utilities: `src/utils/generateTaskMarkdown.ts`

Helper functions for working with tasks:

- **generateTaskMarkdown(task, options)** — Full task markdown for Claude
- **getInstallationCommands(orgId)** — Installation shell commands
- **getCompletionCommand(task, note)** — Mark-complete CLI command
- **taskAsJSON(task)** — Structured JSON export
- **getClaudePrompt(task)** — Quick prompt for Claude

---

## Configuration

### Claude Desktop Config

After installation, your Claude Desktop config will include:

```json
{
  "mcpServers": {
    "taskflow": {
      "command": "node",
      "args": ["/path/to/scripts/mcp/taskflow-connector.mjs"]
    }
  }
}
```

With multiple organizations:

```json
{
  "mcpServers": {
    "taskflow": {
      "command": "node",
      "args": ["/path/to/scripts/mcp/taskflow-connector.mjs"],
      "env": {
        "TASKFLOW_ORG": "organization-uuid"
      }
    }
  }
}
```

### Environment Variables

- `TASKFLOW_ORG` — Fixes the organization (optional, only if multiple orgs exist)

---

## Permissions & Security

### How Permissions Work

The connector uses **Row Level Security (RLS)** policies:

1. Your session token is loaded from `~/.taskflow/session.json`
2. Every database query runs with your user's RLS policies
3. If you can't see/edit a task in the UI, Claude can't do it either
4. Approvals, blocking tasks, and role checks all apply

### No Admin Access

- The connector never uses service role credentials
- It cannot bypass your organization's permission structure
- It cannot view tasks outside your department/organization
- Failed operations return user-friendly error messages

### What Claude Can't Do

- Complete a task blocked by other open tasks (database rejects it)
- Edit tasks it doesn't have permission to access (RLS policy blocks it)
- View closed tasks unless you ask explicitly
- Mention people with @ (UI-only feature)

---

## Troubleshooting

### "Connector not available" in Claude Desktop

**Cause:** Claude hasn't reloaded configuration.

**Fix:**
1. Fully restart Claude Desktop
2. Check installation completed without errors
3. Verify config file exists at the path for your OS

### "Unauthorized" or "Permission denied"

**Cause:** Session token expired or login changed.

**Fix:**
```bash
node scripts/taskflow.mjs accedi
node scripts/mcp/taskflow-connector.mjs --install
# Restart Claude
```

### "Cannot complete: task is blocked"

**Cause:** Task has open blockers.

**Fix:**
```
read-task("id")  # See which tasks are blocking it
# Close those first, then retry
```

### "Task not found"

**Cause:** Task doesn't exist or wrong partial ID.

**Fix:**
```
list-tasks()  # See all your tasks and full IDs
```

### Tools not showing in Claude

**Cause:** 
- Connector not installed
- Claude not restarted
- Installation failed silently

**Fix:**
1. Check config file exists
2. Check the file is valid JSON: `cat path/to/claude_desktop_config.json`
3. Reinstall: `node scripts/mcp/taskflow-connector.mjs --install`
4. Restart Claude

---

## Examples

### Example 1: Simple Task Completion

```
User: "Help me complete task 3f2a"

Claude:
→ read-task("3f2a")
  ✓ Gets: "Implement user authentication module"
          Status: in-progress
          Due: 2025-09-25

→ [Works on it...]

→ complete-task("3f2a", "Implemented JWT authentication with refresh tokens, added tests, deployed to staging")
  ✓ Task marked complete
  ✓ Notification sent to project lead
```

### Example 2: Checking Blockers

```
User: "What's holding back task 8c4f?"

Claude:
→ read-task("8c4f")
  ✓ Shows: Blocked by:
            - Task 1a2b [in-progress]
            - Task 2c3d [completed, awaiting approval]

→ "The database backend needs to be completed (1a2b is in progress). 
   Task 2c3d is done but waiting for manager approval."
```

### Example 3: Multiple Tasks

```
User: "What tasks are due this week?"

Claude:
→ list-tasks()
  ✓ Shows 7 open tasks

→ Filters for dueDate between today and 7 days out:
  "You have 3 tasks due this week:
   - Task 3f2a: Implement auth [in-progress, due 2025-09-20]
   - Task 5e6f: Write tests [not-started, due 2025-09-22]
   - Task 7g8h: Deploy v2.0 [blocked, due 2025-09-25]
   
   Task 5e6f can start now. Tasks 3f2a and 7g8h need the backend (1a2b)."
```

---

## Comparison: Method 1 vs Method 2

| | **Method 1: Browser Prompt** | **Method 2: MCP Connector** |
|---|---|---|
| **Setup** | None | One-time install + restart Claude |
| **Where it works** | Claude web, browser | Claude Desktop only |
| **Task lookup** | Manual copy-paste or use ID | Automatic via tools |
| **Status update** | Manual CLI command | Automatic via tool |
| **Permissions** | Same as user | Same as user |
| **Best for** | Quick work, browser users | Full workflow in Claude, power users |

---

## FAQ

### Do I need to be in the TaskFlow repository to use the connector?

Yes, the connector runs `taskflowCore.mjs` which needs the repo structure. It's designed for local development/testing. For production, use the web UI or integrate via TaskFlow's REST API.

### Can Claude access my comments?

Yes, but only the last 5 comments are included in task details (to keep the context focused). The full comment thread stays in TaskFlow.

### What if my login expires?

The connector refreshes the token automatically if it's about to expire. If it actually expires, you'll see an error. Just login again:

```bash
node scripts/taskflow.mjs accedi
```

No need to reinstall — the next Claude call will pick up the new session.

### Can multiple people share one connector installation?

The connector uses the login session from `~/.taskflow/session.json`. Each person needs their own session (their own machine or login). Sharing the connector would mean Claude operates as whoever last logged in.

### How do I uninstall?

Remove the taskflow entry from your Claude Desktop config file, then restart Claude:

```json
{
  "mcpServers": {
    // Delete this block:
    // "taskflow": { ... }
  }
}
```

---

## Development & Testing

### Testing the connector locally

```bash
# Start the MCP server directly (will wait for stdin)
node scripts/mcp/taskflow-connector.mjs

# In another terminal, send a test request (advanced)
# MCP uses JSON-RPC over stdio
```

### Running tests

```bash
npm test  # Runs all test suites
npm run test:watch  # Watch mode
```

### Debugging

The connector logs to stderr (stdout is the MCP protocol channel):

```bash
node scripts/mcp/taskflow-connector.mjs 2> debug.log
```

---

## Next Steps

1. **Install the connector** (one-time):
   ```bash
   node scripts/taskflow.mjs accedi
   node scripts/mcp/taskflow-connector.mjs --install
   # Restart Claude Desktop
   ```

2. **Try it out**:
   - Ask Claude: "Show me my open tasks in TaskFlow"
   - Ask Claude: "Help me work on task <id>"

3. **Integrate into TaskFlow UI**:
   - The `CompleteWithDesktopButton` component is ready to use
   - Add it to your task detail views for one-click access

4. **Build workflows**:
   - Create agent prompts that use the connector
   - Build multi-step task completion flows in Claude
   - Integrate with your team's Claude workspace

---

## Support

For issues or questions:

1. Check the **Troubleshooting** section above
2. Review the **MCP Server** source: `scripts/mcp/taskflow-connector.mjs`
3. Check Claude Desktop's logs (varies by OS)
4. See existing **tests** in `scripts/mcp/*.test.mjs`

---

## Technical Details

### MCP Tool Definitions

```typescript
interface ListTasksInput {
  includeClosed?: boolean;  // Default: false
}

interface ReadTaskInput {
  id: string;  // Can be partial (first few chars)
}

interface CompleteTaskInput {
  id: string;                 // Can be partial
  note?: string;             // Optional completion note
}

interface AddNoteInput {
  id: string;        // Can be partial
  text: string;      // Note content
}
```

### Response Format

All tools return:

```typescript
{
  content: [
    {
      type: 'text',
      text: 'Human-readable response'
    }
  ],
  structuredContent?: {
    // Machine-readable data (when applicable)
  }
}
```

---

## Version History

- **v1.0.0** — Initial MCP connector release
  - 4 tools: list-tasks, read-task, complete-task, add-note
  - Claude Desktop integration
  - Permission enforcement via RLS
  - Error handling and session management
