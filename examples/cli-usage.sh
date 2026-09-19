#!/bin/bash
#
# AI AUTOMATED TASK MANAGER — CLI Usage Examples
#
# This script demonstrates how to use the command-line tool
#

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== AI AUTOMATED TASK MANAGER CLI Examples ===${NC}\n"

# ============================================================================
# SETUP
# ============================================================================

echo -e "${YELLOW}1. Login (one-time setup)${NC}"
echo "$ node scripts/ai-task-manager.mjs login"
echo "Enter your email and password"
echo -e "${GREEN}✓ Logged in${NC}\n"

# ============================================================================
# LIST TASKS
# ============================================================================

echo -e "${YELLOW}2. List your tasks${NC}"
echo "$ node scripts/ai-task-manager.mjs list"
echo "Output:"
echo "  1. Implement task routing (High, due Jan 15)"
echo "  2. Review PR #42 (Normal, due Jan 10)"
echo "  3. Fix auth bug (Urgent, due Jan 8)"
echo ""

echo -e "${YELLOW}3. List open tasks (filter)${NC}"
echo "$ node scripts/ai-task-manager.mjs list --status todo"
echo "Output:"
echo "  1. Implement task routing"
echo "  2. Review PR #42"
echo ""

echo -e "${YELLOW}4. List high priority tasks${NC}"
echo "$ node scripts/ai-task-manager.mjs list --priority urgent"
echo "Output:"
echo "  3. Fix auth bug"
echo ""

echo -e "${YELLOW}5. List tasks due today${NC}"
echo "$ node scripts/ai-task-manager.mjs list --due today"
echo "Output:"
echo "  3. Fix auth bug (Urgent, due today)"
echo ""

echo -e "${YELLOW}6. List tasks assigned to team member${NC}"
echo "$ node scripts/ai-task-manager.mjs list --assigned-to sarah@example.com"
echo "Output:"
echo "  1. Implement task routing (assigned to Sarah)"
echo ""

# ============================================================================
# VIEW TASK DETAILS
# ============================================================================

echo -e "${YELLOW}7. View task details${NC}"
echo "$ node scripts/ai-task-manager.mjs read 123e4567..."
echo "Output:"
echo "  Title: Implement task routing"
echo "  Status: todo"
echo "  Priority: high"
echo "  Assigned to: sarah@example.com"
echo "  Due: 2024-01-15"
echo "  Description: Add AI-powered task assignment..."
echo "  Comments:"
echo "    Sarah: Can we have this done by next week?"
echo "    You: Yes, targeting Friday"
echo ""

# ============================================================================
# CREATE TASKS
# ============================================================================

echo -e "${YELLOW}8. Create a new task${NC}"
echo "$ node scripts/ai-task-manager.mjs create --title 'New task' --priority high"
echo "Output:"
echo "  ${GREEN}✓ Task created: 123e4567-e89b-12d3-a456-426614174000${NC}"
echo ""

echo -e "${YELLOW}9. Create with full details${NC}"
echo "$ node scripts/ai-task-manager.mjs create \\"
echo "    --title 'Implement API' \\"
echo "    --description 'Build REST endpoints' \\"
echo "    --priority high \\"
echo "    --due-date 2024-01-20 \\"
echo "    --assigned-to mike@example.com"
echo "Output:"
echo "  ${GREEN}✓ Task created: 9876543..${NC}"
echo "  ${GREEN}✓ Assigned to mike@example.com${NC}"
echo ""

# ============================================================================
# UPDATE TASKS
# ============================================================================

echo -e "${YELLOW}10. Update task status${NC}"
echo "$ node scripts/ai-task-manager.mjs status 123e4567... in-progress"
echo "Output:"
echo "  ${GREEN}✓ Status updated to: in_progress${NC}"
echo ""

echo -e "${YELLOW}11. Update status with note${NC}"
echo "$ node scripts/ai-task-manager.mjs status 123e4567... done 'Implementation complete'"
echo "Output:"
echo "  ${GREEN}✓ Status updated to: done${NC}"
echo "  ${GREEN}✓ Note added${NC}"
echo "  ${GREEN}✓ Notification sent to watchers${NC}"
echo ""

echo -e "${YELLOW}12. Update priority${NC}"
echo "$ node scripts/ai-task-manager.mjs update 123e4567... --priority urgent"
echo "Output:"
echo "  ${GREEN}✓ Task updated${NC}"
echo ""

echo -e "${YELLOW}13. Assign task to team member${NC}"
echo "$ node scripts/ai-task-manager.mjs assign 123e4567... sarah@example.com"
echo "Output:"
echo "  ${GREEN}✓ Task assigned to sarah@example.com${NC}"
echo "  ${GREEN}✓ Sarah has been notified${NC}"
echo ""

echo -e "${YELLOW}14. Add comment${NC}"
echo "$ node scripts/ai-task-manager.mjs comment 123e4567... 'Great progress, @sarah!'"
echo "Output:"
echo "  ${GREEN}✓ Comment added${NC}"
echo "  ${GREEN}✓ Sarah has been notified${NC}"
echo ""

# ============================================================================
# ANALYTICS
# ============================================================================

echo -e "${YELLOW}15. Show your dashboard${NC}"
echo "$ node scripts/ai-task-manager.mjs dashboard"
echo "Output:"
echo "  Tasks Today:"
echo "    Open: 5"
echo "    Completed: 2"
echo "    Overdue: 1"
echo ""
echo "  This Week:"
echo "    Assigned: 12"
echo "    Completed: 8"
echo "    Completion rate: 67%"
echo ""

echo -e "${YELLOW}16. Team statistics${NC}"
echo "$ node scripts/ai-task-manager.mjs stats --department engineering"
echo "Output:"
echo "  Engineering Department Statistics"
echo "  ---------------------------------"
echo "  Team size: 5"
echo "  Total tasks: 42"
echo "  Completed: 28"
echo "  Completion rate: 66.7%"
echo "  Average task age: 3.5 days"
echo "  Overdue: 3"
echo ""

# ============================================================================
# BULK OPERATIONS
# ============================================================================

echo -e "${YELLOW}17. Bulk assign tasks${NC}"
echo "$ node scripts/ai-task-manager.mjs bulk-assign \\"
echo "    --filter 'priority=high' \\"
echo "    --assign-to sarah@example.com"
echo "Output:"
echo "  ${GREEN}✓ 5 tasks assigned to sarah@example.com${NC}"
echo ""

echo -e "${YELLOW}18. Bulk update status${NC}"
echo "$ node scripts/ai-task-manager.mjs bulk-status \\"
echo "    --filter 'status=todo,priority=urgent' \\"
echo "    --status in-progress"
echo "Output:"
echo "  ${GREEN}✓ 2 tasks updated to in_progress${NC}"
echo ""

# ============================================================================
# EXPORT
# ============================================================================

echo -e "${YELLOW}19. Export tasks to CSV${NC}"
echo "$ node scripts/ai-task-manager.mjs export --format csv --output tasks.csv"
echo "Output:"
echo "  ${GREEN}✓ Exported 42 tasks to tasks.csv${NC}"
echo ""

echo -e "${YELLOW}20. Export department report{{NC}"
echo "$ node scripts/ai-task-manager.mjs export \\"
echo "    --format pdf \\"
echo "    --department engineering \\"
echo "    --output engineering-report.pdf"
echo "Output:"
echo "  ${GREEN}✓ Generated engineering-report.pdf (12 KB)${NC}"
echo ""

# ============================================================================
# MCP INTEGRATION
# ============================================================================

echo -e "${YELLOW}21. Check MCP status${NC}"
echo "$ node scripts/mcp/task-manager.mjs --status"
echo "Output:"
echo "  MCP Server Status:"
echo "  ✓ Installed"
echo "  ✓ Configured for Claude Desktop"
echo "  ✓ Version: 1.0.0"
echo ""

echo -e "${YELLOW}22. Install MCP integration${NC}"
echo "$ node scripts/mcp/task-manager.mjs --install"
echo "Output:"
echo "  ${GREEN}✓ MCP server installed${NC}"
echo "  ${GREEN}✓ Added to Claude configuration${NC}"
echo "  ${GREEN}✓ Please restart Claude Desktop${NC}"
echo ""

# ============================================================================
# HELP
# ============================================================================

echo -e "${YELLOW}23. Get help${NC}"
echo "$ node scripts/ai-task-manager.mjs --help"
echo "Output:"
echo "  Usage: ai-task-manager.mjs <command> [options]"
echo ""
echo "  Commands:"
echo "    login                   Authenticate"
echo "    logout                  Sign out"
echo "    list                    List tasks"
echo "    read <id>               View task details"
echo "    create                  Create new task"
echo "    status <id> <status>    Update task status"
echo "    update <id>             Update task properties"
echo "    assign <id> <user>      Assign task"
echo "    comment <id> <text>     Add comment"
echo "    delete <id>             Delete task"
echo "    dashboard               Show your dashboard"
echo "    stats                   Team statistics"
echo "    export                  Export tasks"
echo "    bulk-assign             Bulk assign tasks"
echo "    bulk-status             Bulk update status"
echo ""

echo -e "${YELLOW}24. Command-specific help${NC}"
echo "$ node scripts/ai-task-manager.mjs create --help"
echo "Output:"
echo "  Usage: create [options]"
echo ""
echo "  Options:"
echo "    --title <text>          Task title (required)"
echo "    --description <text>    Task description"
echo "    --priority <level>      low|normal|high|urgent"
echo "    --due-date <date>       YYYY-MM-DD format"
echo "    --assigned-to <email>   Assign to user"
echo "    --labels <tags>         Comma-separated labels"
echo ""

# ============================================================================
# WORKFLOWS
# ============================================================================

echo -e "\n${YELLOW}Common Workflows:${NC}\n"

echo -e "${BLUE}Daily Standup:${NC}"
echo "$ node scripts/ai-task-manager.mjs list --due today"
echo "$ node scripts/ai-task-manager.mjs dashboard"
echo ""

echo -e "${BLUE}Weekly Review:${NC}"
echo "$ node scripts/ai-task-manager.mjs list --status todo"
echo "$ node scripts/ai-task-manager.mjs stats"
echo ""

echo -e "${BLUE}End of Day Check-in:${NC}"
echo "$ node scripts/ai-task-manager.mjs list --status in-progress"
echo "$ node scripts/ai-task-manager.mjs list --assigned-to me --due today"
echo ""

echo -e "${BLUE}Bulk Assignment:${NC}"
echo "$ node scripts/ai-task-manager.mjs bulk-assign --filter 'status=todo,priority=urgent' --assign-to sarah@example.com"
echo ""

echo -e "\n${GREEN}Done! See docs/API_REFERENCE.md for more details.${NC}\n"
