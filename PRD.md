# Planning Guide

A collaborative task management system that enables teams to assign, track, and complete work across employees with clear visibility into workload and progress.

**Experience Qualities**: 
1. **Efficient** - Information is dense but organized, allowing managers to quickly scan team status and take action
2. **Transparent** - Everyone can see who's working on what, fostering accountability and preventing duplicate work
3. **Empowering** - Simple interactions make it easy to update status, reassign work, and celebrate completions

**Complexity Level**: Light Application (multiple features with basic state)
This is a task management tool with standard CRUD operations, filtering, and assignment features - more complex than a simple list but not requiring advanced workflows or multiple distinct views.

## Essential Features

### Create Task
- **Functionality**: Add new tasks with title, description, assignee, priority, and due date
- **Purpose**: Capture work that needs to be done and assign responsibility
- **Trigger**: Click "Add Task" button
- **Progression**: Click button → Modal opens → Fill form fields → Click "Create" → Task appears in list
- **Success criteria**: Task persists, appears correctly filtered, shows assigned employee

### Assign/Reassign Employee
- **Functionality**: Change which employee is responsible for a task
- **Purpose**: Distribute workload and adapt to changing team capacity
- **Trigger**: Click employee dropdown on task card
- **Progression**: Click dropdown → Select employee → Assignment updates immediately
- **Success criteria**: Task moves to correct employee's section, change persists on refresh

### Update Task Status
- **Functionality**: Move tasks between Not Started, In Progress, and Completed states
- **Purpose**: Track progress and maintain accurate team workload view
- **Trigger**: Click status dropdown on task card
- **Progression**: Click dropdown → Select new status → Visual state updates
- **Success criteria**: Task appearance changes, filters work correctly, completion metrics update

### Filter and Sort
- **Functionality**: View tasks by employee, priority, status, or due date
- **Purpose**: Focus on relevant subset of work and identify urgent items
- **Trigger**: Select filter/sort options in toolbar
- **Progression**: Click filter → Options appear → Select criteria → List updates instantly
- **Success criteria**: Only matching tasks visible, sort order reflects selection

### Delete Task
- **Functionality**: Remove tasks that are no longer relevant
- **Purpose**: Keep the workspace clean and focused on active work
- **Trigger**: Click delete icon on task card
- **Progression**: Click delete → Confirmation dialog → Confirm → Task removed
- **Success criteria**: Task disappears immediately and doesn't return on refresh

## Edge Case Handling
- **Empty States**: When no tasks exist or filters return no results, show encouraging message with quick action to add first task
- **Overdue Tasks**: Automatically highlight tasks past due date with visual indicator (red accent)
- **Unassigned Tasks**: Allow tasks without assignee, group in "Unassigned" section
- **Long Text**: Truncate long titles/descriptions with ellipsis, expand on hover or in detail view
- **No Employees**: If employee list is empty, prompt to add employees first before creating tasks

## Design Direction
Professional yet approachable workspace tool that feels organized without being sterile. Should evoke a sense of control and clarity, like a well-organized desk. Modern corporate aesthetic with warm touches.

## Color Selection
A sophisticated palette balancing professionalism with energy, using deep teals and warm accents.

- **Primary Color**: Deep teal `oklch(0.45 0.12 210)` - Communicates trust, stability, and focus. Used for primary actions and active states
- **Secondary Colors**: Soft slate `oklch(0.92 0.01 220)` for backgrounds and muted navy `oklch(0.35 0.08 230)` for secondary text - Creates professional, calm foundation
- **Accent Color**: Coral orange `oklch(0.68 0.18 35)` - Energizing highlight for important actions, overdue items, and completion celebrations
- **Foreground/Background Pairings**: 
  - Background (White `oklch(0.99 0 0)`): Foreground `oklch(0.25 0.02 230)` - Ratio 12.1:1 ✓
  - Primary (Deep Teal `oklch(0.45 0.12 210)`): White text `oklch(0.99 0 0)` - Ratio 7.2:1 ✓
  - Accent (Coral `oklch(0.68 0.18 35)`): Dark text `oklch(0.25 0.02 230)` - Ratio 6.8:1 ✓
  - Card (Light slate `oklch(0.97 0.005 220)`): Foreground `oklch(0.25 0.02 230)` - Ratio 13.5:1 ✓

## Font Selection
Typography should feel corporate-professional yet modern and readable - conveying organization and competence.

- **Typographic Hierarchy**: 
  - H1 (Page Title): Work Sans SemiBold/32px/tight tracking (-0.02em)
  - H2 (Section Headers): Work Sans Medium/20px/tight tracking (-0.01em)
  - H3 (Task Titles): Work Sans Medium/16px/normal tracking
  - Body (Descriptions): Inter Regular/14px/relaxed leading (1.6)
  - Labels (Meta info): Inter Medium/12px/wide tracking (0.02em)/uppercase

## Animations
Animations reinforce status changes and provide feedback without slowing workflow.

- **Task State Changes**: Smooth 200ms color fade when status updates
- **Task Creation**: Modal slides up with 300ms spring ease, new task fades in to list
- **Hover States**: Subtle 150ms lift on task cards (2px translate + soft shadow)
- **Completion**: Brief scale pulse (1.05x) and confetti-style particle burst for completed tasks
- **Drag Interactions**: If implementing drag-to-reorder, smooth 250ms position transitions

## Component Selection

- **Components**: 
  - Dialog: Task creation/editing modal with form fields
  - Card: Task display with elevated styling and hover states
  - Select: Employee and status dropdowns with search
  - Badge: Priority levels (High/Medium/Low) with color coding
  - Button: Primary actions (Add Task) using filled primary color, secondary actions (Cancel) using ghost variant
  - Input/Textarea: Form fields with floating labels
  - Separator: Dividing sections and grouping related tasks
  - Alert Dialog: Delete confirmation to prevent accidents
  - Tabs: Switching between "All Tasks", "My Tasks", "Team View"
  - Avatar: Employee profile pictures in assignments and headers

- **Customizations**: 
  - Custom task card with status indicator stripe on left edge (4px width, color-coded by priority)
  - Employee selector with avatar thumbnails in dropdown
  - Empty state illustrations (simple SVG icons)
  - Priority badges with custom colors (High: coral, Medium: amber, Low: slate)

- **States**: 
  - Buttons: Default with solid bg → Hover lifts with deeper shadow → Active depresses slightly → Disabled grays out at 40% opacity
  - Task Cards: Default elevated subtle → Hover lifts more → Selected has primary color border → Overdue has pulsing red accent glow
  - Inputs: Default with border → Focus gets primary ring and label animates → Filled shows check icon → Error shows red ring and message
  - Dropdowns: Closed shows current value → Opens with slide-down 200ms → Hover highlights options with secondary bg → Selected shows check mark

- **Icon Selection**: 
  - Plus (add task)
  - UserCircle (assign employee)
  - Clock (due dates)
  - CheckCircle (completed)
  - Circle (not started)
  - CircleHalf (in progress)
  - ArrowsDownUp (sort)
  - FunnelSimple (filter)
  - Trash (delete)
  - CalendarBlank (date picker trigger)

- **Spacing**: 
  - Page padding: p-6 (24px)
  - Card padding: p-4 (16px)
  - Card gap: gap-4 (16px) between cards
  - Section gap: gap-8 (32px) between major sections
  - Form field gap: gap-3 (12px) vertically
  - Button padding: px-4 py-2 (16px/8px)

- **Mobile**: 
  - Stack filters vertically instead of horizontal toolbar
  - Task cards full width with slightly reduced padding (p-3)
  - Dialog becomes full-screen sheet on mobile
  - Tabs scroll horizontally if needed
  - Reduce typography scale by 10% for smaller screens
  - Avatar sizes reduce from 40px to 32px
