#!/bin/bash
#
# AI AUTOMATED TASK MANAGER — MCP Setup Script
#
# Automates the installation and configuration of the Model Context Protocol
# integration with Claude Desktop
#

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Detect OS
if [[ "$OSTYPE" == "darwin"* ]]; then
  OS="macos"
  CONFIG_DIR="$HOME/.claude"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
  OS="linux"
  CONFIG_DIR="$HOME/.claude"
elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" ]]; then
  OS="windows"
  CONFIG_DIR="$APPDATA/Claude"
else
  OS="unknown"
  CONFIG_DIR="$HOME/.claude"
fi

echo -e "${BLUE}=== AI AUTOMATED TASK MANAGER MCP Setup ===${NC}\n"
echo -e "Detected OS: ${YELLOW}$OS${NC}"
echo -e "Config directory: ${YELLOW}$CONFIG_DIR${NC}\n"

# ============================================================================
# FUNCTIONS
# ============================================================================

check_prerequisites() {
  echo -e "${YELLOW}Checking prerequisites...${NC}\n"

  # Check Node.js
  if ! command -v node &> /dev/null; then
    echo -e "${RED}✗ Node.js not found${NC}"
    echo "  Install from: https://nodejs.org/"
    exit 1
  fi
  local node_version=$(node -v)
  echo -e "${GREEN}✓ Node.js${NC} ($node_version)"

  # Check npm
  if ! command -v npm &> /dev/null; then
    echo -e "${RED}✗ npm not found${NC}"
    exit 1
  fi
  local npm_version=$(npm -v)
  echo -e "${GREEN}✓ npm${NC} ($npm_version)"

  # Check Claude Desktop
  case "$OS" in
    macos)
      if ! [ -d "$HOME/Applications/Claude.app" ] && ! [ -d "/Applications/Claude.app" ]; then
        echo -e "${RED}✗ Claude Desktop not found${NC}"
        echo "  Install from: https://claude.ai/download"
        exit 1
      fi
      echo -e "${GREEN}✓ Claude Desktop${NC}"
      ;;
    windows)
      # Check Windows PATH for claude executable
      if ! command -v claude &> /dev/null; then
        echo -e "${RED}✗ Claude Desktop not found${NC}"
        echo "  Install from: https://claude.ai/download"
        exit 1
      fi
      echo -e "${GREEN}✓ Claude Desktop${NC}"
      ;;
    linux)
      echo -e "${YELLOW}⚠ Claude Desktop not available for Linux${NC}"
      echo "  MCP will work with Claude via web or other clients"
      ;;
  esac

  echo ""
}

install_mcp() {
  echo -e "${YELLOW}Installing MCP connector...${NC}\n"

  if [ ! -f "scripts/mcp/task-manager.mjs" ]; then
    echo -e "${RED}✗ MCP script not found${NC}"
    echo "  Expected: scripts/mcp/task-manager.mjs"
    exit 1
  fi

  # Run the installation
  node scripts/mcp/task-manager.mjs --install

  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ MCP connector installed${NC}\n"
  else
    echo -e "${RED}✗ MCP installation failed${NC}"
    exit 1
  fi
}

verify_installation() {
  echo -e "${YELLOW}Verifying installation...${NC}\n"

  if [ ! -d "$CONFIG_DIR" ]; then
    echo -e "${RED}✗ Claude config directory not found${NC}"
    echo "  Expected: $CONFIG_DIR"
    exit 1
  fi

  if [ -f "$CONFIG_DIR/claude.json" ]; then
    echo -e "${GREEN}✓ Claude configuration found${NC}"

    # Check if task-manager is in config
    if grep -q "task-manager" "$CONFIG_DIR/claude.json"; then
      echo -e "${GREEN}✓ Task Manager MCP registered${NC}\n"
    else
      echo -e "${YELLOW}⚠ Task Manager not in Claude config${NC}"
      echo "  Run: node scripts/mcp/task-manager.mjs --install"
      exit 1
    fi
  else
    echo -e "${YELLOW}⚠ Claude configuration not found${NC}"
    echo "  It will be created when you first run Claude"
    echo ""
  fi
}

test_mcp_connection() {
  echo -e "${YELLOW}Testing MCP connection...${NC}\n"

  # Test authentication
  if node scripts/mcp/task-manager.mjs --test &> /dev/null; then
    echo -e "${GREEN}✓ MCP connection successful${NC}\n"
  else
    echo -e "${YELLOW}⚠ MCP connection test failed${NC}"
    echo "  This is normal if you haven't logged in yet"
    echo "  Login with: node scripts/ai-task-manager.mjs login"
    echo ""
  fi
}

configure_organization() {
  echo -e "${YELLOW}Configure default organization (optional)${NC}\n"

  read -p "Do you want to set a default organization? (y/n) " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    read -p "Enter organization ID or name: " org_name
    node scripts/mcp/task-manager.mjs --install --org "$org_name"
    echo -e "${GREEN}✓ Default organization set to: $org_name${NC}\n"
  fi
}

final_steps() {
  echo -e "${GREEN}=== Setup Complete! ===${NC}\n"

  echo -e "${YELLOW}Next steps:${NC}\n"

  # OS-specific instructions
  case "$OS" in
    macos|windows)
      echo "1. ${BLUE}Restart Claude Desktop${NC}"
      echo "   - Fully close Claude (use Cmd+Q or close from taskbar)"
      echo "   - Reopen Claude Desktop"
      echo ""
      ;;
    linux)
      echo "1. ${BLUE}Restart Claude (web or API)${NC}"
      echo "   - Refresh the web interface or restart the client"
      echo ""
      ;;
  esac

  echo "2. ${BLUE}Authenticate${NC} (if not done already)"
  echo "   $ node scripts/ai-task-manager.mjs login"
  echo ""

  echo "3. ${BLUE}Test the integration${NC} in Claude"
  echo "   Type: 'List my open tasks'"
  echo ""

  echo "4. ${BLUE}Read the documentation${NC}"
  echo "   See: docs/MCP_GUIDE.md"
  echo ""

  echo -e "${GREEN}You're all set!${NC}\n"
}

show_troubleshooting() {
  echo -e "${YELLOW}Troubleshooting:${NC}\n"

  echo -e "${BLUE}MCP tool not showing in Claude?${NC}"
  echo "  1. Check installation: node scripts/mcp/task-manager.mjs --status"
  echo "  2. Make sure Claude is fully closed (not just minimized)"
  echo "  3. Look in Claude Settings > Integrations > MCP Servers"
  echo "  4. Reinstall: node scripts/mcp/task-manager.mjs --install"
  echo ""

  echo -e "${BLUE}Authentication failed?${NC}"
  echo "  1. Login: node scripts/ai-task-manager.mjs login"
  echo "  2. Check token: node scripts/ai-task-manager.mjs token"
  echo "  3. Verify credentials: node scripts/ai-task-manager.mjs status"
  echo ""

  echo -e "${BLUE}Permission denied errors?${NC}"
  echo "  1. Verify your role: Settings > Team > Your role"
  echo "  2. Check if you're in the right department"
  echo "  3. Some operations require admin permissions"
  echo ""

  echo -e "${BLUE}Need more help?${NC}"
  echo "  - GitHub Issues: github.com/aiautomatedtaskmanager/issues"
  echo "  - Documentation: docs/MCP_GUIDE.md"
  echo "  - Email: support@aiautomatedtaskmanager.dev"
  echo ""
}

# ============================================================================
# MAIN
# ============================================================================

main() {
  # Check prerequisites
  check_prerequisites

  # Install MCP
  install_mcp

  # Verify
  verify_installation

  # Test connection
  test_mcp_connection

  # Configure organization (optional)
  configure_organization

  # Show troubleshooting info
  show_troubleshooting

  # Final steps
  final_steps
}

# Run main
main
