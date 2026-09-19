# Connect TaskFlow to Claude Desktop (30 seconds)

Quick integration guide for Claude Desktop with TaskFlow MCP connector.

## One-Time Setup

### 1. Authenticate to TaskFlow

```bash
node scripts/taskflow.mjs accedi
```

This creates `~/.taskflow/session.json` with your credentials.

### 2. Install MCP Connector

```bash
node scripts/mcp/taskflow-connector.mjs --install
```

This:
- Finds Claude Desktop configuration automatically (macOS/Windows/Linux)
- Adds TaskFlow MCP server entry
- No manual path editing needed

### 3. Restart Claude Desktop

Fully close Claude (not just the window):
- **macOS**: Cmd+Q
- **Windows**: Alt+F4 or close all windows
- **Linux**: Close the window

Then launch Claude again.

## Verify It Works

In Claude, ask:

```
"List my open tasks"
```

Claude should respond with your tasks from TaskFlow.

## Troubleshooting

### "Task Manager tool not showing"

**Fix:**

```bash
# Check status
node scripts/mcp/taskflow-connector.mjs --status

# Re-install if needed
node scripts/mcp/taskflow-connector.mjs --install

# Then restart Claude Desktop again
```

### "Not authenticated"

**Fix:**

```bash
node scripts/taskflow.mjs accedi
```

Then re-run the installer.

### "Service Unavailable" in Claude

This usually means the MCP server crashed. Try:

```bash
# Check logs
node scripts/taskflow-cli.mjs

# Restart Claude Desktop completely (not just the window)
```

## What You Can Do

### In Claude:

```
"List my open tasks"
"Show tasks due this week"
"Mark task 3f2a as completed"
"Add a note to task 3f2a"
"What tasks are blocking my work?"
```

### Examples:

**Daily Standup**

```
"Give me my daily standup report"

Claude will show:
- Completed yesterday
- In progress today
- Due today
- Blocked tasks
- Recommendations
```

**Prioritization Help**

```
"Help me prioritize this week's work"

Claude analyzes dependencies and deadlines
```

**Workload Check**

```
"Am I overloaded this week?"

Claude reviews your task load and capacity
```

## Advanced

### Multiple Organizations

If you have access to multiple organizations in TaskFlow:

```bash
# Set default org for Claude
TASKFLOW_ORG="Organization Name" node scripts/mcp/taskflow-connector.mjs --install
```

### Uninstall

To remove the MCP connector:

```bash
node scripts/mcp/taskflow-connector.mjs --uninstall
```

## FAQ

**Q: Is my data safe?**

A: Yes. The MCP connector:
- Runs locally (stdin/stdout only)
- Uses your existing TaskFlow session token
- Never sends passwords
- Respects all RLS (Row Level Security) policies
- Can only do what you're allowed to do in the UI

**Q: Do you store my conversations?**

A: No. We only see task operation logs. Your conversation with Claude goes to Anthropic (Claude's privacy policy applies).

**Q: Can I use this with Claude Web?**

A: No, MCP connectors only work with Claude Desktop. Use the web interface at [https://taskflow.example.com](https://taskflow.example.com) instead.

**Q: What if Claude suggests something I don't want?**

A: You still decide. Claude is just an assistant. You always approve before any task gets updated.

## Next Steps

1. ✅ Authenticate: `node scripts/taskflow.mjs accedi`
2. ✅ Install: `node scripts/mcp/taskflow-connector.mjs --install`
3. ✅ Restart Claude
4. ✅ Try: "List my open tasks"

Happy tasking!

---

**Need help?** See [MCP_GUIDE.md](MCP_GUIDE.md) for full documentation.
