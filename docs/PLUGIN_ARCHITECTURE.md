# TaskFlow Claude Plugin Architecture

This document outlines the current implementation and future evolution toward a standalone npm plugin (Option 1).

## Current Implementation (Phase 1 - Complete)

### Files

| File | Purpose |
|------|---------|
| `scripts/mcp/taskflow-connector.mjs` | MCP server that runs locally via stdio |
| `scripts/setup-claude.mjs` | Automated setup assistant |
| `docs/CLAUDE_CLI_SETUP.md` | 30-second quick start |
| `docs/MCP_GUIDE.md` | Full feature documentation |

### How It Works

```
User's Computer
├── Claude Desktop
│   └── MCP Config (claude_desktop_config.json)
│       └── Starts: node scripts/mcp/taskflow-connector.mjs
│
├── TaskFlow Session (~/.taskflow/session.json)
│   └── Contains auth token
│
└── MCP Connector (taskflow-connector.mjs)
    └── Reads session
    └── Connects to TaskFlow API
    └── Communicates with Claude via stdio
```

### User Setup Flow (Current)

```
1. node scripts/taskflow.mjs accedi
   └── Creates ~/.taskflow/session.json

2. node scripts/setup-claude.mjs  (or manually)
   └── Runs: node scripts/mcp/taskflow-connector.mjs --install
   └── Modifies: Claude config file

3. Restart Claude Desktop

4. "List my open tasks"
```

## Future: Standalone npm Plugin (Phase 2)

This phase converts the current solution into a publishable npm package.

### Package Structure

```
@taskflow/claude
├── package.json
├── README.md
├── bin/
│   └── taskflow-claude.js      # Entry point
├── lib/
│   ├── mcp-server.js           # MCP server code
│   ├── installer.js            # Claude config installer
│   ├── session.js              # Session management
│   └── diagnostics.js          # Status checking
├── scripts/
│   └── postinstall.js          # (optional) auto-setup
└── examples/
    └── basic-setup.md
```

### Key Files When Published

**package.json**

```json
{
  "name": "@taskflow/claude",
  "version": "1.0.0",
  "description": "TaskFlow MCP connector for Claude Desktop",
  "type": "module",
  "bin": {
    "taskflow-claude": "./bin/taskflow-claude.js"
  },
  "engines": {
    "node": ">=18.0.0"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.0.0",
    "@supabase/supabase-js": "^2.0.0"
  }
}
```

**bin/taskflow-claude.js**

```javascript
#!/usr/bin/env node

import { program } from 'commander';
import { install, uninstall, status } from '../lib/installer.js';

program
  .command('install')
  .description('Install TaskFlow connector in Claude Desktop')
  .action(install);

program
  .command('uninstall')
  .description('Remove TaskFlow connector from Claude Desktop')
  .action(uninstall);

program
  .command('status')
  .description('Check installation status')
  .action(status);

program.parse();
```

### User Experience (Phase 2)

```bash
# Install from npm
npm install -g @taskflow/claude

# Setup (one command)
taskflow-claude install

# Check status
taskflow-claude status

# Done!
```

### Benefits of Phase 2

- ✅ Installable from npm globally
- ✅ Automatic updates via npm
- ✅ No need to clone the repo
- ✅ Works on any machine
- ✅ Clear CLI interface
- ✅ Can be listed on Claude Marketplace (future)

## Comparison: Current vs Future

| Feature | Phase 1 (Now) | Phase 2 (Future) |
|---------|---|---|
| Setup method | Clone repo + script | `npm install -g` |
| Installation command | `node scripts/setup-claude.mjs` | `taskflow-claude install` |
| Global availability | ❌ (repo path required) | ✅ (in PATH) |
| Updates | Manual (git pull) | Automatic (npm) |
| Distribution | GitHub only | npm + GitHub |
| Claude Marketplace | ❌ | ✅ (possible) |
| User experience | Developer-friendly | End-user friendly |

## Implementation Timeline

### Phase 1 (✅ Complete)
- ✅ MCP server implementation
- ✅ Claude Desktop installer
- ✅ Setup automation script
- ✅ Documentation (quick start + full guide)
- ✅ Status checking & diagnostics

### Phase 2 (Optional - if need to scale)
- Create npm package structure
- Publish to npm registry
- Add CLI command wrapper
- Update onboarding docs
- Add auto-update mechanism

### Phase 3 (Optional - production)
- Submit to Claude Marketplace
- Add telemetry & analytics
- Create web-based setup wizard
- Build desktop app installer

## Testing the Current Solution

### Quick Test

```bash
# 1. Setup
node scripts/setup-claude.mjs

# 2. Restart Claude (Cmd+Q or Ctrl+Q)

# 3. Test in Claude
# Ask: "List my open tasks"
```

### Diagnostic Test

```bash
# Check status
node scripts/mcp/taskflow-connector.mjs --status

# View configuration
cat ~/.claude/claude_desktop_config.json | grep taskflow

# View session
cat ~/.taskflow/session.json
```

### Full Reset

```bash
# Uninstall
node scripts/mcp/taskflow-connector.mjs --uninstall

# Re-authenticate
node scripts/taskflow.mjs accedi

# Reinstall
node scripts/setup-claude.mjs
```

## Extending the Connector

### Adding a New Tool

Edit `scripts/mcp/taskflow-connector.mjs`:

```javascript
server.registerTool(
  'my-new-tool',
  {
    title: 'Do something',
    description: 'Detailed description',
    inputSchema: {
      param1: z.string().describe('Parameter 1'),
    },
    annotations: { readOnlyHint: true, destructiveHint: false },
  },
  async ({ param1 }) =>
    conErrori(async () => {
      const { cfg, sessione, org } = await contesto();
      // Implementation here
      return testo('Result', { /* structured data */ });
    })
);
```

The tool automatically appears in Claude Desktop after restart.

### Adding Multi-Organization Support

Already supported! Set environment variable:

```bash
TASKFLOW_ORG="Organization Name" node scripts/mcp/taskflow-connector.mjs --install
```

## Troubleshooting Plugin Issues

### "Port already in use"

The MCP connector uses stdio (not TCP), so this shouldn't happen. But if Claude gets stuck:

```bash
# Kill any hanging node processes
killall node

# Restart Claude Desktop
```

### "Module not found" errors

The connector is missing dependencies. Run from the repo root:

```bash
npm install
```

### "Session expired"

The MCP server auto-refreshes sessions. If it keeps expiring:

```bash
node scripts/taskflow.mjs accedi
```

Then restart Claude.

## Future Enhancements

- [ ] Web-based setup wizard (no CLI needed)
- [ ] Auto-detect Claude Desktop location
- [ ] One-click uninstall from Settings UI
- [ ] Task search within Claude (not just list)
- [ ] Subtask management
- [ ] Time tracking integration
- [ ] Notifications from Claude
- [ ] Multi-workspace support

## Architecture Decision Log

### Why MCP over REST?

**MCP (Model Context Protocol)**
- ✅ Works offline (stdio communication)
- ✅ Automatic tool discovery
- ✅ Better security (local-only)
- ✅ Native Claude Desktop support

**REST API**
- ❌ Requires network setup
- ❌ No automatic tool discovery
- ❌ More complex authentication

### Why Node.js + CLI over GUI installer?

**Node.js CLI**
- ✅ Works on all platforms
- ✅ Scriptable for automation
- ✅ Minimal dependencies
- ✅ Developers familiar with it

**GUI Installer**
- ❌ Platform-specific
- ❌ Larger file size
- ❌ Harder to maintain

### Why not just a web interface?

We provide web interface AND Claude Desktop connector:
- **Web**: Full UI, mobile access
- **Claude**: Quick task updates, AI assistance

They complement each other.

---

## See Also

- [CLAUDE_CLI_SETUP.md](CLAUDE_CLI_SETUP.md) — 30-second setup
- [MCP_GUIDE.md](MCP_GUIDE.md) — Full documentation
- [Model Context Protocol](https://modelcontextprotocol.io) — MCP spec

