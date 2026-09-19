# Claude Desktop — 30-second setup

Connect Claude Desktop to your tasks. Two commands, then a restart.

```bash
# 1. Authenticate once (asks email + password, remembers the session)
node scripts/taskflow.mjs accedi

# 2. Install the MCP connector into Claude Desktop
node scripts/mcp/taskflow.mjs --installa

# 3. Fully quit and reopen Claude Desktop
```

Then ask Claude:

> "List my open tasks"

## What just happened

- `accedi` stored a session at `~/.config/taskflow/sessione.json` (a refresh
  token, not your password).
- `--installa` added a `taskflow` entry to Claude Desktop's
  `claude_desktop_config.json`, pointing at `scripts/mcp/taskflow.mjs`. Your
  other MCP servers are left untouched.

## Multiple organizations

Claude Desktop does not inherit terminal environment variables, so bake the org
into the install:

```bash
node scripts/mcp/taskflow.mjs --installa --org "Acme"
```

## Uninstall

Remove the `taskflow` key from `mcpServers` in `claude_desktop_config.json` and
restart Claude Desktop. To also forget the session: `node scripts/taskflow.mjs esci`.

## More

Full reference — the four tools, permissions, troubleshooting — is in
[MCP_GUIDE.md](MCP_GUIDE.md).
