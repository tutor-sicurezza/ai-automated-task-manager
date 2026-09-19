#!/usr/bin/env node
/**
 * TaskFlow → Claude Desktop Setup
 *
 * One-command setup that:
 * 1. Checks prerequisites
 * 2. Authenticates to TaskFlow
 * 3. Installs MCP connector
 * 4. Verifies installation
 * 5. Gives next steps
 *
 * Usage:
 *   node scripts/setup-claude.mjs
 *   node scripts/setup-claude.mjs --check  (verify only)
 */

import { execSync } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import { homedir, platform } from 'os';
import { resolve } from 'path';

const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
};

function log(msg, color = 'reset') {
  console.log(`${colors[color]}${msg}${colors.reset}`);
}

function step(num, msg) {
  log(`\n[${num}] ${msg}`, 'bold');
}

function success(msg) {
  log(`  ✓ ${msg}`, 'green');
}

function error(msg) {
  log(`  ✗ ${msg}`, 'red');
}

function warning(msg) {
  log(`  ⚠ ${msg}`, 'yellow');
}

function info(msg) {
  log(`  ℹ ${msg}`, 'blue');
}

/**
 * Find Claude Desktop config path
 */
function getClaudeConfigPath() {
  const home = homedir();
  const plat = platform();

  switch (plat) {
    case 'darwin':
      return resolve(home, 'Library/Application Support/Claude/claude_desktop_config.json');
    case 'win32':
      return process.env.APPDATA
        ? resolve(process.env.APPDATA, 'Claude/claude_desktop_config.json')
        : null;
    case 'linux':
      return resolve(
        process.env.XDG_CONFIG_HOME || resolve(home, '.config'),
        'Claude/claude_desktop_config.json'
      );
    default:
      return null;
  }
}

/**
 * Check if Claude Desktop is installed
 */
function checkClaudeDesktopInstalled() {
  const configPath = getClaudeConfigPath();
  if (!configPath) {
    error('Cannot determine Claude Desktop config location for this OS');
    return false;
  }

  if (!existsSync(configPath)) {
    error('Claude Desktop is not installed');
    info(`Expected config at: ${configPath}`);
    return false;
  }

  success('Claude Desktop is installed');
  return true;
}

/**
 * Check if Node.js is 18+
 */
function checkNodeVersion() {
  const version = process.version;
  const major = parseInt(version.slice(1).split('.')[0]);

  if (major < 18) {
    error(`Node.js ${version} is too old (need 18+)`);
    return false;
  }

  success(`Node.js ${version}`);
  return true;
}

/**
 * Check if TaskFlow session exists
 */
function checkTaskFlowSession() {
  const sessionPath = resolve(homedir(), '.taskflow/session.json');

  if (!existsSync(sessionPath)) {
    warning('TaskFlow session not found');
    info(`Will need to authenticate at: ${sessionPath}`);
    return false;
  }

  try {
    const session = JSON.parse(readFileSync(sessionPath, 'utf-8'));
    if (session.token) {
      success('TaskFlow session found');
      return true;
    }
  } catch {}

  error('TaskFlow session is invalid');
  return false;
}

/**
 * Check if MCP connector is installed
 */
function checkMcpInstalled() {
  const configPath = getClaudeConfigPath();
  if (!configPath || !existsSync(configPath)) return false;

  try {
    const config = JSON.parse(readFileSync(configPath, 'utf-8'));
    if (config.mcpServers?.taskflow) {
      success('MCP connector already installed');
      return true;
    }
  } catch {}

  return false;
}

/**
 * Run all checks
 */
async function runChecks() {
  log('\n═══════════════════════════════════════════', 'bold');
  log('  TaskFlow → Claude Desktop Setup', 'bold');
  log('═══════════════════════════════════════════', 'bold');

  const checks = [
    { name: 'Node.js 18+', fn: checkNodeVersion },
    { name: 'Claude Desktop', fn: checkClaudeDesktopInstalled },
    { name: 'TaskFlow session', fn: checkTaskFlowSession },
    { name: 'MCP connector', fn: checkMcpInstalled },
  ];

  log('\nChecking prerequisites...', 'dim');
  const results = await Promise.all(checks.map(async (c) => ({ ...c, ok: c.fn() })));

  const allOk = results.every((r) => r.ok || (r.name === 'TaskFlow session' && !r.ok) || (r.name === 'MCP connector' && !r.ok));

  if (!allOk && results.find((r) => !r.ok && r.name !== 'TaskFlow session' && r.name !== 'MCP connector')) {
    log('\n✗ Prerequisites not met. Cannot continue.', 'red');
    process.exit(1);
  }

  return results;
}

/**
 * Authenticate to TaskFlow
 */
async function authenticateTaskFlow() {
  step('A', 'Authenticate to TaskFlow');

  const sessionPath = resolve(homedir(), '.taskflow/session.json');
  if (existsSync(sessionPath)) {
    success('Already authenticated');
    return true;
  }

  info('Running: node scripts/taskflow.mjs accedi');
  try {
    execSync('node scripts/taskflow.mjs accedi', { stdio: 'inherit' });
    success('Authentication complete');
    return true;
  } catch (err) {
    error('Authentication failed');
    return false;
  }
}

/**
 * Install MCP connector
 */
async function installMcpConnector() {
  step('B', 'Install MCP connector');

  info('Running: node scripts/mcp/taskflow-connector.mjs --install');
  try {
    execSync('node scripts/mcp/taskflow-connector.mjs --install', { stdio: 'inherit' });
    success('MCP connector installed');
    return true;
  } catch (err) {
    error('Installation failed');
    return false;
  }
}

/**
 * Verify installation
 */
async function verifyInstallation() {
  step('C', 'Verify installation');

  info('Running: node scripts/mcp/taskflow-connector.mjs --status');
  try {
    execSync('node scripts/mcp/taskflow-connector.mjs --status', { stdio: 'inherit' });
    success('Installation verified');
    return true;
  } catch (err) {
    error('Verification failed');
    return false;
  }
}

/**
 * Print next steps
 */
function printNextSteps() {
  log('\n═══════════════════════════════════════════', 'bold');
  log('  ✓ Setup Complete!', 'green');
  log('═══════════════════════════════════════════', 'bold');

  log('\nNext steps:', 'bold');
  log('  1. Fully restart Claude Desktop');
  log('     • macOS: Cmd+Q, then reopen');
  log('     • Windows: Close all Claude windows, then reopen');
  log('     • Linux: Close the window, then reopen');

  log('\n  2. Test in Claude:');
  log('     "List my open tasks"');

  log('\nDocumentation:', 'bold');
  log('  • Quick setup: docs/CLAUDE_CLI_SETUP.md');
  log('  • Full guide: docs/MCP_GUIDE.md');

  log('\n');
}

/**
 * Main
 */
async function main() {
  const isCheckOnly = process.argv.includes('--check');

  const results = await runChecks();

  const needsAuth = !results.find((r) => r.name === 'TaskFlow session')?.ok;
  const needsMcp = !results.find((r) => r.name === 'MCP connector')?.ok;

  if (isCheckOnly) {
    log('\n✓ Check complete. Run without --check to install.', 'green');
    process.exit(0);
  }

  if (!needsAuth && !needsMcp) {
    log('\n✓ Everything is already set up!', 'green');
    log('Restart Claude Desktop if you haven\'t already.', 'dim');
    process.exit(0);
  }

  if (needsAuth) {
    if (!(await authenticateTaskFlow())) {
      process.exit(1);
    }
  }

  if (needsMcp) {
    if (!(await installMcpConnector())) {
      process.exit(1);
    }
  }

  await verifyInstallation();
  printNextSteps();
}

main().catch((err) => {
  error(`Setup failed: ${err.message}`);
  process.exit(1);
});
