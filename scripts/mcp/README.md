# TaskFlow MCP Connector

This folder contains the Model Context Protocol (MCP) server that connects Claude Desktop to TaskFlow.

## What is this?

**taskflow-connector.mjs** is a small Node.js server that:

1. Runs locally (no network server)
2. Listens to Claude Desktop requests
3. Executes task operations (list, read, complete, add notes)
4. Returns results back to Claude

Claude Desktop then displays results naturally in the chat.

## Quick Start

```bash
# 1. Authenticate to TaskFlow
node ../taskflow.mjs accedi

# 2. Install connector in Claude Desktop
node taskflow-connector.mjs --install

# 3. Restart Claude Desktop (Cmd+Q, then reopen)

# Done! Ask Claude: "List my open tasks"
```

For detailed setup, see: [CLAUDE_CLI_SETUP.md](../../docs/CLAUDE_CLI_SETUP.md)

## Commands

### Install (One-Time Setup)

```bash
node taskflow-connector.mjs --install
```

Adds the connector to Claude Desktop's configuration. After this, the server runs automatically whenever Claude starts.

### Check Status

```bash
node taskflow-connector.mjs --status
```

Verifies the connector is installed and shows configuration details.

### Uninstall

```bash
node taskflow-connector.mjs --uninstall
```

Removes the connector from Claude Desktop. You can reinstall anytime.

### Run Standalone (Dev)

```bash
node taskflow-connector.mjs
```

Starts the MCP server directly. This is what Claude Desktop runs automatically.

## How Claude Uses This

### Tool Flow

```
User Types in Claude:
  "List my open tasks"
    ↓
Claude Sends Request:
  tool: "list-tasks"
  params: { includeClosed: false }
    ↓
taskflow-connector.mjs Receives:
  Reads session from ~/.taskflow/session.json
  Queries TaskFlow API
  Returns task list
    ↓
Claude Displays:
  1. Task A (High, due Jan 15)
  2. Task B (Normal, due Jan 10)
```

### Available Tools

1. **list-tasks** — Show all assigned tasks
2. **read-task** — Get full details of a task
3. **complete-task** — Mark a task done
4. **add-note** — Add a comment to a task

See [MCP_GUIDE.md](../../docs/MCP_GUIDE.md) for full documentation.

## Files

| File | Purpose |
|------|---------|
| **taskflow-connector.mjs** | Main MCP server |
| **installa.test.mjs** | Test installation flow |
| **sessione.test.mjs** | Test session handling |

## Troubleshooting

### "TaskFlow tool not showing in Claude"

```bash
# 1. Check status
node taskflow-connector.mjs --status

# 2. If not installed, run:
node taskflow-connector.mjs --install

# 3. Fully restart Claude (Cmd+Q, don't just close)
```

### "Not authenticated"

```bash
# Session might have expired
node ../taskflow.mjs accedi

# Then restart Claude
```

### "Slow responses"

Restart Claude completely (not just window). The server might have crashed.

## Testing

### Manual Test

```bash
# Start the server
node taskflow-connector.mjs

# In another terminal, test with curl (advanced)
echo '{"jsonrpc":"2.0",...}' | node taskflow-connector.mjs
```

### Automated Tests

```bash
npm run test -- scripts/mcp/
```

## Architecture

The connector follows the MCP specification:

```
stdio Communication:
  ↓
Request (JSON-RPC)
  ↓
taskflow-connector.mjs
  ├── Validate permissions
  ├── Query TaskFlow API
  └── Format response
  ↓
Response (JSON-RPC)
  ↓
Claude Desktop
```

All communication is local (no internet required except API calls).

## Security

The connector:
- ✅ Reads session from `~/.taskflow/session.json`
- ✅ Uses YOUR credentials (not a service account)
- ✅ Respects all RLS (Row Level Security) policies
- ✅ Cannot access other users' tasks
- ✅ Cannot bypass permissions

Claude can only do what you're allowed to do in the web UI.

## Advanced Usage

### Multiple Organizations

```bash
# Set default organization
TASKFLOW_ORG="Company A" node taskflow-connector.mjs --install
```

### Custom Configuration

Edit `claude_desktop_config.json` to pass environment variables:

```json
{
  "mcpServers": {
    "taskflow": {
      "command": "node",
      "args": ["/path/to/taskflow-connector.mjs"],
      "env": {
        "TASKFLOW_ORG": "Company Name",
        "DEBUG": "1"
      }
    }
  }
}
```

### Debug Mode

```bash
DEBUG=1 node taskflow-connector.mjs
```

Outputs debug logs to stderr (doesn't interfere with MCP communication).

## Contributing

To add a new tool:

1. Add a `registerTool()` call in `taskflow-connector.mjs`
2. Implement the handler function
3. Test with `npm run test`
4. Update [MCP_GUIDE.md](../../docs/MCP_GUIDE.md) docs

Example:

```javascript
server.registerTool(
  'my-new-tool',
  {
    title: 'Do something',
    description: 'What this tool does',
    inputSchema: {
      param: z.string().describe('Parameter description'),
    },
    annotations: { readOnlyHint: true, destructiveHint: false },
  },
  async ({ param }) =>
    conErrori(async () => {
      const { cfg, sessione, org } = await contesto();
      // Implementation
      return testo('Result', { /* data */ });
    })
);
```

## Related Documentation

- [CLAUDE_CLI_SETUP.md](../../docs/CLAUDE_CLI_SETUP.md) — 30-second setup guide
- [MCP_GUIDE.md](../../docs/MCP_GUIDE.md) — Full feature documentation
- [PLUGIN_ARCHITECTURE.md](../../docs/PLUGIN_ARCHITECTURE.md) — Architecture & roadmap

## Support

- **Quick help**: See [CLAUDE_CLI_SETUP.md](../../docs/CLAUDE_CLI_SETUP.md)
- **Detailed docs**: See [MCP_GUIDE.md](../../docs/MCP_GUIDE.md)
- **Issues**: GitHub Issues (label: mcp)
- **Questions**: GitHub Discussions

---

**Last Updated**: 2025-09-19  
**Version**: 1.0.0  
**Status**: Production Ready ✅
