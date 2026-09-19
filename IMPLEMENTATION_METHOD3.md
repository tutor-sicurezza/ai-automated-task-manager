# Method 3: Complete via Claude CLI

Complete TaskFlow tasks directly from the terminal using Claude, without opening the web interface.

## Overview

Method 3 provides a command-line interface to complete tasks using Claude API. It's designed for:

- **Automation**: Run batch task completions from scripts or CI/CD pipelines
- **Terminal workflows**: Stay in your terminal without opening a browser
- **Programmatic integration**: Integrate TaskFlow completion into existing workflows
- **Local-first**: Results can be saved locally before updating the database

## Installation

### 1. Install the CLI tool globally

```bash
npm install -g taskflow
```

Or if developing locally:

```bash
npm install
npm link  # Makes `taskflow` available globally
```

### 2. Set up ANTHROPIC_API_KEY

The CLI uses Claude API, so you need your Anthropic API key:

**macOS/Linux:**
```bash
export ANTHROPIC_API_KEY="sk-ant-..."
```

**Windows PowerShell:**
```powershell
$env:ANTHROPIC_API_KEY = "sk-ant-..."
```

**Windows CMD:**
```cmd
set ANTHROPIC_API_KEY=sk-ant-...
```

**Persistent (macOS/Linux):**
Add to `~/.bash_profile` or `~/.zshrc`:
```bash
export ANTHROPIC_API_KEY="sk-ant-..."
```

### 3. Authenticate with TaskFlow (one time)

```bash
taskflow accedi
```

This creates a local session file that subsequent commands use.

## Usage

### Basic usage

Complete a task by ID prefix:

```bash
taskflow complete-task 550e8400
```

The CLI will:
1. Fetch the task from TaskFlow API
2. Send details to Claude
3. Display Claude's response
4. Ask if you want to mark the task as complete in TaskFlow

### Save result to file

Save Claude's output as JSON before updating the database:

```bash
taskflow complete-task 550e8400 --save
```

This creates a file like `taskflow-550e8400-2025-01-15T10-30-45-123Z.json` in the current directory.

### Use a different Claude model

```bash
taskflow complete-task 550e8400 --model claude-3-opus-20250219
```

Available models:
- `claude-3-5-sonnet-20241022` (default, fast and capable)
- `claude-3-opus-20250219` (most capable)
- `claude-3-haiku-20250307` (fastest, for simple tasks)

### Increase token limit for complex tasks

```bash
taskflow complete-task 550e8400 --max-tokens 4096
```

Default is 2048. Use higher values for tasks that need longer responses.

### Verbose mode for debugging

```bash
taskflow complete-task 550e8400 --verbose
```

Shows:
- Prompt being sent to Claude
- Token usage
- Detailed progress

### Combined options

```bash
taskflow complete-task 550e8400 \
  --model claude-3-opus-20250219 \
  --max-tokens 4096 \
  --save \
  --verbose
```

## Command Reference

```bash
taskflow complete-task <taskId> [options]

Arguments:
  <taskId>           First 4-8 letters of task ID

Options:
  --model <name>     Claude model to use
                     (default: claude-3-5-sonnet-20241022)
  --max-tokens <num> Maximum tokens in response
                     (default: 2048)
  --api-key <key>    Override ANTHROPIC_API_KEY environment variable
  --save, -s         Save result as JSON file
  --verbose, -v      Show detailed progress
  --help, -h         Show help message

Examples:
  taskflow complete-task abc1 --save
  taskflow complete-task abc1 --model claude-3-opus-20250219
  taskflow complete-task abc1 --max-tokens 8192 --verbose
  taskflow help
  taskflow accedi
```

## Workflow Examples

### Example 1: Quick completion

```bash
# Complete a task and mark it done immediately
taskflow complete-task abc1
# Press 's' when asked to update TaskFlow
```

### Example 2: Batch processing with results

```bash
# Process multiple tasks, saving results
for task in abc1 def2 ghi3; do
  echo "Processing $task..."
  taskflow complete-task "$task" --save
  sleep 2  # Be nice to the API
done
```

### Example 3: Use with CI/CD

```bash
#!/bin/bash
# GitHub Actions or similar
export ANTHROPIC_API_KEY="${{ secrets.ANTHROPIC_API_KEY }}"
export TASKFLOW_EMAIL="${{ secrets.TASKFLOW_EMAIL }}"
export TASKFLOW_PASSWORD="${{ secrets.TASKFLOW_PASSWORD }}"

# Authenticate
taskflow accedi

# Complete tasks from a list
while read task_id; do
  taskflow complete-task "$task_id" --save
done < tasks.txt
```

### Example 4: Complex task with long response

```bash
# Use Opus model and high token limit for complex analysis
taskflow complete-task complex-research \
  --model claude-3-opus-20250219 \
  --max-tokens 8192 \
  --save \
  --verbose
```

### Example 5: Integration with shell script

```bash
#!/bin/bash
# auto-complete.sh

task_id="$1"
model="${2:-claude-3-5-sonnet-20241022}"

echo "Starting task completion..."
result=$(taskflow complete-task "$task_id" \
  --model "$model" \
  --save \
  --verbose)

if [ $? -eq 0 ]; then
  echo "✓ Task completed successfully"
  echo "$result"
else
  echo "✗ Task failed"
  exit 1
fi
```

## Architecture

### File Structure

```
scripts/
  taskflow-cli.mjs           # Main CLI entry point
  taskflowCore.mjs           # Shared session/auth logic (reused)

src/
  components/
    CompleteWithCLIButton.tsx # UI button to copy CLI commands
    EseguiConClaude.tsx      # Existing button for browser/MCP (Method 1 & 2)
```

### How it works

1. **Authentication**: Uses existing `taskflowCore.mjs` for session management
2. **Task Loading**: Fetches task from TaskFlow API via existing `scripts/taskflowCore.mjs`
3. **Prompt Generation**: Builds Claude prompt with task context (title, description, steps, etc.)
4. **Claude Call**: Uses Anthropic SDK to get task completion from Claude
5. **Result Handling**: 
   - Shows result in terminal
   - Optionally saves to JSON file
   - Optionally updates TaskFlow database
6. **User Confirmation**: Asks before updating database (interactive mode)

### Reusing existing code

The CLI leverages existing infrastructure:

- **`taskflowCore.mjs`**: Session management, authentication, API calls
- **Anthropic SDK**: Already in dependencies (`@anthropic-ai/sdk`)
- **Prompt generation**: Similar logic to `EseguiConClaude.tsx`

This minimizes duplication and keeps the CLI consistent with the web UI.

## Output Example

```
ℹ Connessione a Claude (claude-3-5-sonnet-20241022)...
✓ Task caricato: "Design database schema for user management"

--- RISULTATO ---

I'll design a comprehensive database schema for user management that follows
best practices for scalability and security.

## User Management Schema

### Users Table
- id (UUID, primary key)
- email (unique, indexed)
- username (unique)
- password_hash (encrypted)
- created_at (timestamp)
- updated_at (timestamp)
- deleted_at (soft delete)

### User Roles Table
...

--- FINE ---

Aggiorno TaskFlow segnando il task come completato? (s/n) s
✓ Task aggiornato su TaskFlow
```

## Troubleshooting

### "ANTHROPIC_API_KEY not set"

**Problem**: CLI can't find your API key

**Solution**: Set the environment variable
```bash
export ANTHROPIC_API_KEY="sk-ant-..."
```

Or pass it directly:
```bash
taskflow complete-task abc1 --api-key "sk-ant-..."
```

### "No session found"

**Problem**: Not authenticated with TaskFlow

**Solution**: Run authentication once
```bash
taskflow accedi
```

### "Task not found"

**Problem**: The task ID prefix doesn't match any tasks

**Solutions**:
- Check the task ID is correct
- Use a longer prefix (more letters)
- Check you have access to the task
- Run `taskflow elenco` to see your tasks

### "Claude API Error"

**Problem**: Connection to Claude API failed

**Causes & Solutions**:
- Invalid API key: `export ANTHROPIC_API_KEY="sk-ant-..."`
- Rate limited: Wait a minute and retry
- Quota exceeded: Check your Anthropic account
- Network issue: Check internet connection

### "Cannot update TaskFlow"

**Problem**: Task completed by Claude but not marked done in database

**Causes & Solutions**:
- Session expired: Run `taskflow accedi` again
- Permission denied: Check you can access the task
- Database error: Check TaskFlow server status
- Use `--save` to save result locally, then update manually

## Comparing Methods

| Feature | Method 1 (Browser/Chat) | Method 2 (MCP) | Method 3 (CLI) |
|---------|-----------|--------|--------|
| **How to use** | Copy prompt to Claude.com | Ask Claude Desktop | Run command |
| **Automation** | ❌ Manual | ⚠️ Via Claude | ✅ Full |
| **Batch processing** | ❌ No | ⚠️ Limited | ✅ Yes |
| **Installation** | ✅ None | ⚠️ Setup MCP | ✅ `npm install -g` |
| **No browser needed** | ✅ Yes | ✅ Yes | ✅ Yes |
| **Can save results** | ✅ Yes | ⚠️ To Claude | ✅ JSON files |
| **Integration ready** | ❌ No | ⚠️ Via Claude | ✅ Shell scripts |
| **Setup time** | < 1 min | 5-10 min | 2-3 min |

## Integration Examples

### Node.js/JavaScript

```javascript
import { spawn } from 'child_process';

async function completeTask(taskId) {
  return new Promise((resolve, reject) => {
    const proc = spawn('taskflow', ['complete-task', taskId, '--save']);
    
    let output = '';
    proc.stdout.on('data', (data) => { output += data; });
    
    proc.on('close', (code) => {
      if (code === 0) resolve(output);
      else reject(new Error('Task completion failed'));
    });
  });
}

const result = await completeTask('abc1');
console.log(result);
```

### Python

```python
import subprocess
import json

def complete_task(task_id):
    result = subprocess.run(
        ['taskflow', 'complete-task', task_id, '--save'],
        capture_output=True,
        text=True
    )
    return result.stdout, result.returncode
```

### Make/Makefile

```makefile
.PHONY: complete-%
complete-%:
	taskflow complete-task $* --save --verbose

.PHONY: complete-batch
complete-batch:
	@for task in abc1 def2 ghi3; do \
		echo "Completing $$task..."; \
		$(MAKE) complete-$$task; \
	done
```

## Performance Notes

- **Default model** (Sonnet): Fast, ~2-5 seconds per task
- **Opus model**: Slower (~10-20 sec) but more capable
- **Haiku model**: Fastest (~1-2 sec) for simple tasks
- **Token usage**: ~500-1500 tokens per task (typical)

Cost per task (approximate):
- Sonnet: $0.001-0.005
- Opus: $0.005-0.02
- Haiku: $0.0002-0.001

## Security Considerations

1. **API Key**: Never commit your API key to version control
   - Use environment variables
   - Use `.env.local` (add to `.gitignore`)
   
2. **Session File**: The session file is created with restrictive permissions
   - Only readable by the user who created it
   - Contains refresh token (not access token)
   
3. **Task Privacy**: Task content is sent to Claude API
   - Review what you're sending
   - Use `--save` first to inspect before updating database

## Limitations

- **Interactive only**: Requires confirmation before updating database
  - Use `--save` to review results first
  - Could be automated with future `--auto-confirm` flag
  
- **One task at a time**: Process tasks sequentially or with shell loops
  - For batch: use `for` loop with sleep between tasks
  - Future version could support batch mode
  
- **Same capabilities as web UI**: Can't do anything more than the UI allows
  - Respects your permissions
  - Same validation rules as TaskFlow

## Future Enhancements

- `--batch <file>`: Process multiple tasks from JSON/CSV
- `--auto-confirm`: Automatically mark complete without asking
- `--webhook`: Send results to custom endpoint
- `--template`: Custom prompt template per task type
- `--dry-run`: Show what would happen without updating
- Output formats: `--json`, `--csv`, `--markdown`

## Support

For issues or feature requests:

1. Check the troubleshooting section above
2. Run with `--verbose` to see more details
3. Run `taskflow help` for command reference
4. Check TaskFlow documentation for API/auth issues

## Related

- **Method 1**: [Browser/Chat workflow](./IMPLEMENTATION_METHOD1.md)
- **Method 2**: [MCP Connector for Claude Desktop](./IMPLEMENTATION_METHOD2.md)
- **TaskFlow CLI**: `node scripts/taskflow.mjs --help`
- **Anthropic API**: https://docs.anthropic.com
