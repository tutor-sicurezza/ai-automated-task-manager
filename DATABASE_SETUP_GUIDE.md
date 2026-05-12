# Database & Data Persistence Setup Guide

**CONFIDENTIAL - For Repository Administrators Only**

This guide covers data persistence strategies for the TaskFlow application, including the current KV store system and optional external database integration.

---

## Table of Contents

1. [Current Data Storage System](#current-data-storage-system)
2. [Data Architecture Overview](#data-architecture-overview)
3. [Backup & Export Strategy](#backup--export-strategy)
4. [Optional: External Database Integration](#optional-external-database-integration)
5. [Data Migration](#data-migration)
6. [Security Best Practices](#security-best-practices)
7. [Troubleshooting](#troubleshooting)

---

## Current Data Storage System

### Spark KV Store

TaskFlow currently uses the **Spark KV (Key-Value) Store** - a built-in persistent storage system that:

- **Automatically persists data** between sessions
- **No setup required** - works out of the box
- **Browser-independent** - data survives page refreshes
- **User-scoped** - each user has their own data namespace
- **Lightweight** - perfect for small to medium datasets

### What Gets Stored

The following data is automatically persisted:

```typescript
// Core Data
- tasks: Task[]                    // All task records
- employees: Employee[]            // All employee/user records
- announcements: Announcement[]    // System announcements
- notifications: TaskNotification[] // User notifications

// User Preferences
- notification-preferences-{userId}: NotificationPreferencesType
- has-completed-welcome: boolean    // Welcome guide status
- email-templates: EmailTemplate[]  // Custom email templates
- smtp-config: SMTPConfig          // Email service configuration
```

### Data Limits

**Important:** The KV store has practical limits:

- **Storage Size:** Approximately 10MB per user
- **Item Count:** Thousands of records work well
- **Performance:** Optimized for small-to-medium datasets

**Recommendation:** For teams with 1000+ tasks or 100+ users, consider external database integration.

---

## Data Architecture Overview

### Current Storage Structure

```plaintext
KV Store
├── tasks                           # Array of all tasks
├── employees                       # Array of all employees
├── announcements                   # Array of announcements
├── notifications                   # Array of notifications
├── notification-preferences-{id}   # Per-user notification settings
├── has-completed-welcome           # User onboarding status
└── [other app-specific keys]       # Additional configuration
```

### Data Relationships

```plaintext
Task
├── id: string
├── title: string
├── description: string
├── assigneeId: string → Employee.id
├── priority: 'high' | 'medium' | 'low'
├── status: 'not-started' | 'in-progress' | 'completed'
├── dueDate: string (ISO 8601)
├── comments: TaskComment[]
├── activities: TaskActivity[]
└── attachments: TaskAttachment[]

Employee
├── id: string
├── name: string
├── email?: string
├── role: string
├── userRole: 'admin' | 'manager' | 'member'
├── department?: string
├── departments?: string[]
├── status: 'active' | 'inactive'
└── joinedDate: string (ISO 8601)

Announcement
├── id: string
├── title: string
├── content: string
├── priority: 'info' | 'warning' | 'critical'
├── targetDepartments?: string[]
├── targetRoles?: string[]
├── createdBy: string → Employee.id
├── createdAt: string (ISO 8601)
└── readBy: string[] → Employee.id[]
```

---

## Backup & Export Strategy

### Automated Backups

TaskFlow includes a **Data Management** tool accessible from the main interface:

1. **Click the Data Management icon** in the toolbar
2. **Export Data** downloads a complete JSON backup
3. **Import Data** restores from a previous backup
4. **Clear All Data** resets the application (use with caution!)

### Manual Backup Process

#### Step 1: Export Current Data

1. Open TaskFlow application
2. Click **Data Management** button
3. Click **Export All Data**
4. Save the `.json` file with a timestamp:
   ```
   taskflow-backup-2025-01-20.json
   ```

#### Step 2: Store Backup Securely

**Recommended Storage Locations:**
- **Cloud Storage:** Google Drive, Dropbox, OneDrive (encrypted)
- **Version Control:** Private Git repository (encrypted)
- **Backup Service:** Automated backup solution
- **Local Encrypted Drive:** For sensitive data

**Backup Rotation Schedule:**
```plaintext
Daily:    Keep last 7 days
Weekly:   Keep last 4 weeks
Monthly:  Keep last 12 months
Yearly:   Keep indefinitely
```

#### Step 3: Verify Backup Integrity

Periodically test backups by:
1. Importing to a test environment
2. Verifying all data loads correctly
3. Checking data relationships are intact

### Backup File Structure

```json
{
  "tasks": [ /* array of task objects */ ],
  "employees": [ /* array of employee objects */ ],
  "announcements": [ /* array of announcement objects */ ],
  "notifications": [ /* array of notification objects */ ],
  "exportDate": "2025-01-20T10:30:00.000Z",
  "version": "1.0"
}
```

---

## Optional: External Database Integration

For larger deployments or enhanced features, you can integrate an external database.

### Recommended Database Options

#### 1. **Supabase** (Recommended for Spark Apps)
- **Type:** PostgreSQL-based backend
- **Free Tier:** Up to 500MB database
- **Pros:** Easy setup, real-time subscriptions, built-in auth
- **Best For:** Small to medium teams

#### 2. **Firebase Firestore**
- **Type:** NoSQL document database
- **Free Tier:** 1GB storage, 50K reads/day
- **Pros:** Real-time sync, offline support, easy integration
- **Best For:** Apps needing real-time collaboration

#### 3. **PlanetScale**
- **Type:** MySQL-compatible serverless database
- **Free Tier:** 5GB storage, 1 billion row reads/month
- **Pros:** Branch-based workflows, automatic backups
- **Best For:** Teams familiar with SQL

#### 4. **MongoDB Atlas**
- **Type:** NoSQL document database
- **Free Tier:** 512MB storage
- **Pros:** Flexible schema, powerful queries
- **Best For:** Complex data structures

### Integration Example: Supabase

#### Step 1: Create Supabase Project

1. Go to [Supabase](https://supabase.com/)
2. Sign up and create a new project
3. Choose a region close to your users
4. Save your project credentials:
   ```
   API URL: https://xxxxx.supabase.co
   Anon Key: eyJhbGc...
   ```

#### Step 2: Create Database Schema

Run these SQL commands in Supabase SQL Editor:

```sql
-- Tasks table
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  assignee_id UUID REFERENCES employees(id),
  priority TEXT NOT NULL CHECK (priority IN ('high', 'medium', 'low')),
  status TEXT NOT NULL CHECK (status IN ('not-started', 'in-progress', 'completed')),
  due_date TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Employees table
CREATE TABLE employees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  role TEXT NOT NULL,
  user_role TEXT NOT NULL CHECK (user_role IN ('admin', 'manager', 'member')),
  department TEXT,
  status TEXT NOT NULL CHECK (status IN ('active', 'inactive')),
  joined_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Task Comments table
CREATE TABLE task_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID REFERENCES employees(id),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Task Activities table
CREATE TABLE task_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID REFERENCES employees(id),
  activity_type TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  details TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Announcements table
CREATE TABLE announcements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  priority TEXT NOT NULL CHECK (priority IN ('info', 'warning', 'critical')),
  created_by UUID REFERENCES employees(id),
  is_pinned BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES employees(id),
  task_id UUID REFERENCES tasks(id),
  notification_type TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_tasks_assignee ON tasks(assignee_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_comments_task ON task_comments(task_id);
CREATE INDEX idx_activities_task ON task_activities(task_id);
CREATE INDEX idx_notifications_user ON notifications(user_id);

-- Enable Row Level Security
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Example RLS Policy (adjust based on your auth setup)
CREATE POLICY "Users can view tasks assigned to them"
  ON tasks FOR SELECT
  USING (assignee_id = auth.uid() OR auth.jwt()->>'role' = 'admin');
```

#### Step 3: Install Supabase Client

```bash
npm install @supabase/supabase-js
```

#### Step 4: Create Supabase Client

Create `src/lib/supabase.ts`:

```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

#### Step 5: Environment Variables

Add to `.env`:
```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
```

---

## Data Migration

### Migrating from KV Store to External Database

#### Migration Script Template

```typescript
// Migration script: KV to Supabase
import { supabase } from './lib/supabase'

async function migrateData() {
  // 1. Export from KV Store
  const tasks = await window.spark.kv.get<Task[]>('tasks') || []
  const employees = await window.spark.kv.get<Employee[]>('employees') || []
  
  // 2. Transform data if needed
  const transformedTasks = tasks.map(task => ({
    title: task.title,
    description: task.description,
    assignee_id: task.assigneeId,
    priority: task.priority,
    status: task.status,
    due_date: task.dueDate,
  }))
  
  // 3. Insert into Supabase
  const { data: insertedTasks, error: taskError } = await supabase
    .from('tasks')
    .insert(transformedTasks)
  
  if (taskError) {
    console.error('Task migration error:', taskError)
    return
  }
  
  // 4. Verify migration
  const { count } = await supabase
    .from('tasks')
    .select('*', { count: 'exact', head: true })
  
  console.log(`Migrated ${count} tasks successfully`)
}

// Run migration
migrateData()
```

### Migration Checklist

- [ ] **Backup current data** using export function
- [ ] **Test migration script** in staging environment
- [ ] **Verify data integrity** after migration
- [ ] **Update application code** to use new database
- [ ] **Test all features** with new database
- [ ] **Monitor performance** for first few days
- [ ] **Keep KV backups** for 30 days post-migration

---

## Security Best Practices

### 1. Data Encryption

**At Rest:**
- Use database providers with encryption (Supabase, Firebase all include this)
- Encrypt sensitive fields (email addresses, personal info)
- Never store passwords in plain text

**In Transit:**
- Always use HTTPS/TLS connections
- Verify SSL certificates
- Use secure WebSocket connections for real-time features

### 2. Access Control

**Principle of Least Privilege:**
```typescript
// Example: Role-based access control
const canAccessTask = (user: Employee, task: Task) => {
  if (user.userRole === 'admin') return true
  if (user.userRole === 'manager' && task.department === user.department) return true
  if (task.assigneeId === user.id) return true
  return false
}
```

**Database-Level Security:**
- Enable Row Level Security (RLS) in Supabase/PostgreSQL
- Use service role keys only in secure backend environments
- Rotate API keys every 90 days

### 3. Data Validation

**Always validate data:**
```typescript
// Example: Input validation
const validateTask = (task: Partial<Task>): boolean => {
  if (!task.title || task.title.length < 3) return false
  if (!task.dueDate || new Date(task.dueDate) < new Date()) return false
  if (!['high', 'medium', 'low'].includes(task.priority!)) return false
  return true
}
```

### 4. Audit Logging

Track all data modifications:
```typescript
// Example: Audit log entry
type AuditLog = {
  timestamp: string
  userId: string
  action: 'create' | 'update' | 'delete'
  resourceType: 'task' | 'employee' | 'announcement'
  resourceId: string
  changes: Record<string, any>
}
```

### 5. Data Retention

**Implement retention policies:**
- **Active Tasks:** Keep indefinitely
- **Completed Tasks:** Archive after 1 year
- **Notifications:** Delete after 90 days
- **Activity Logs:** Retain for 180 days
- **Audit Logs:** Keep for 7 years (compliance)

---

## Backup Automation

### Automated Backup Script

Create a scheduled backup using GitHub Actions:

```yaml
# .github/workflows/backup.yml
name: Automated Backup

on:
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM UTC
  workflow_dispatch:  # Manual trigger

jobs:
  backup:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm install
      
      - name: Run backup script
        env:
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_KEY: ${{ secrets.SUPABASE_SERVICE_KEY }}
        run: node scripts/backup.js
      
      - name: Upload backup to storage
        uses: actions/upload-artifact@v3
        with:
          name: backup-${{ github.run_number }}
          path: backups/
          retention-days: 90
```

---

## Monitoring & Performance

### Key Metrics to Track

1. **Storage Usage**
   - Current data size
   - Growth rate
   - Approaching limits

2. **Query Performance**
   - Average query time
   - Slow query logs
   - Database connection pool usage

3. **Data Quality**
   - Orphaned records (tasks with invalid assignees)
   - Duplicate entries
   - Missing required fields

### Monitoring Tools

**For KV Store:**
```typescript
// Check KV storage usage
const checkStorageUsage = async () => {
  const keys = await window.spark.kv.keys()
  let totalSize = 0
  
  for (const key of keys) {
    const value = await window.spark.kv.get(key)
    const size = new Blob([JSON.stringify(value)]).size
    totalSize += size
  }
  
  console.log(`Total storage: ${(totalSize / 1024 / 1024).toFixed(2)} MB`)
  return totalSize
}
```

**For External Databases:**
- Use provider's built-in monitoring dashboard
- Set up alerts for high CPU/memory usage
- Monitor query performance metrics

---

## Disaster Recovery

### Recovery Plan

#### Scenario 1: Data Corruption
1. **Stop all write operations** immediately
2. **Identify corruption scope** (which records affected)
3. **Restore from latest clean backup**
4. **Verify data integrity**
5. **Resume operations**

#### Scenario 2: Accidental Deletion
1. **Check if soft-deleted** (if implemented)
2. **Restore from backup** taken before deletion
3. **Verify restored data**
4. **Document incident** for audit

#### Scenario 3: Database Provider Outage
1. **Switch to read-only mode** (display cached data)
2. **Queue write operations** for later sync
3. **Monitor provider status page**
4. **Resume when service restored**
5. **Sync queued operations**

### Recovery Time Objectives (RTO)

- **Critical Functions:** < 1 hour
- **Full System:** < 4 hours
- **Complete Data Restore:** < 24 hours

### Recovery Point Objectives (RPO)

- **With Daily Backups:** Up to 24 hours data loss
- **With Hourly Backups:** Up to 1 hour data loss
- **With Real-time Replication:** Near-zero data loss

---

## Troubleshooting

### Common Issues

#### Issue: "Storage quota exceeded"

**Symptoms:**
- Data not saving
- Error messages about storage limits

**Solutions:**
1. Export and archive old completed tasks
2. Clean up old notifications (older than 90 days)
3. Remove unused attachments
4. Consider migrating to external database

---

#### Issue: "Data not persisting"

**Symptoms:**
- Changes lost after page refresh
- Inconsistent data state

**Solutions:**
1. Check browser console for KV errors
2. Verify browser storage is not disabled
3. Test in incognito mode (no extensions)
4. Clear browser cache and reload
5. Check if using functional updates in `useKV`:
   ```typescript
   // ❌ Wrong (uses stale state)
   setTasks([...tasks, newTask])
   
   // ✅ Correct (uses current state)
   setTasks(current => [...current, newTask])
   ```

---

#### Issue: "Slow performance with large datasets"

**Symptoms:**
- App becomes sluggish with 100+ tasks
- Long load times

**Solutions:**
1. Implement pagination for task lists
2. Add filtering before rendering
3. Use React.memo for expensive components
4. Consider migrating to external database
5. Add virtual scrolling for large lists

---

## Data Structure Best Practices

### 1. Normalization vs. Denormalization

**Current (Denormalized):**
```typescript
// Tasks store full employee names
task.assigneeName = "John Doe"
```

**Better (Normalized):**
```typescript
// Tasks store only IDs, join on read
task.assigneeId = "emp-123"
const assignee = employees.find(e => e.id === task.assigneeId)
```

### 2. Avoid Circular References

```typescript
// ❌ Bad: Circular reference
employee.tasks = [task1, task2]  // Contains full task objects
task1.assignee = employee  // Contains full employee object

// ✅ Good: Use IDs
employee.taskIds = ["task1", "task2"]
task1.assigneeId = "employee1"
```

### 3. Use Timestamps

```typescript
// All records should have
{
  createdAt: string  // ISO 8601 format
  updatedAt: string  // ISO 8601 format
}
```

---

## Compliance & Legal

### Data Retention Requirements

**GDPR (EU):**
- Right to erasure (delete user data on request)
- Data portability (export user data)
- Consent for data collection
- Privacy policy disclosure

**CCPA (California):**
- Right to know what data is collected
- Right to delete personal data
- Right to opt-out of data sale

**Implementation:**
```typescript
// GDPR: Delete user data
const deleteUserData = async (userId: string) => {
  setTasks(current => current.filter(t => t.assigneeId !== userId))
  setEmployees(current => current.filter(e => e.id !== userId))
  setNotifications(current => current.filter(n => n.userId !== userId))
}

// GDPR: Export user data
const exportUserData = async (userId: string) => {
  const userData = {
    tasks: tasks.filter(t => t.assigneeId === userId),
    comments: tasks.flatMap(t => 
      t.comments?.filter(c => c.userId === userId) || []
    ),
    activities: tasks.flatMap(t =>
      t.activities?.filter(a => a.userId === userId) || []
    ),
  }
  return JSON.stringify(userData, null, 2)
}
```

---

## Document Version Control

**Document Version:** 1.0  
**Last Updated:** January 2025  
**Next Review:** April 2025  
**Maintained By:** TaskFlow Development Team  
**Classification:** CONFIDENTIAL

---

## Quick Reference

### Essential Commands

```typescript
// Export all data
const exportData = async () => {
  const data = {
    tasks: await window.spark.kv.get('tasks'),
    employees: await window.spark.kv.get('employees'),
    // ... other data
  }
  return JSON.stringify(data, null, 2)
}

// Import data
const importData = async (jsonString: string) => {
  const data = JSON.parse(jsonString)
  await window.spark.kv.set('tasks', data.tasks)
  await window.spark.kv.set('employees', data.employees)
  // ... other data
}

// Clear all data
const clearAllData = async () => {
  const keys = await window.spark.kv.keys()
  for (const key of keys) {
    await window.spark.kv.delete(key)
  }
}

// Check storage size
const getStorageSize = async () => {
  const keys = await window.spark.kv.keys()
  let total = 0
  for (const key of keys) {
    const val = await window.spark.kv.get(key)
    total += JSON.stringify(val).length
  }
  return `${(total / 1024).toFixed(2)} KB`
}
```

---

**Questions?** Contact your system administrator or refer to the [Spark Documentation](https://github.com/github/spark).
