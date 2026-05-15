# Security Quick Fixes Guide
**Priority:** Implement before production deployment  
**Estimated Time:** 8-12 hours

---

## 🔴 CRITICAL FIXES (Implement Immediately)

### Fix 1: Input Sanitization (30 minutes)

**Install DOMPurify:**
```bash
npm install dompurify @types/dompurify
```

**Create sanitization utility** (`src/lib/sanitize.ts`):
```typescript
import DOMPurify from 'dompurify';

export function sanitizeHtml(input: string): string {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li'],
    ALLOWED_ATTR: []
  });
}

export function sanitizeText(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove angle brackets
    .trim();
}

export function sanitizeFileName(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .replace(/_{2,}/g, '_')
    .slice(0, 255);
}
```

**Apply to all user inputs:**
```typescript
// In handleAddComment
import { sanitizeText } from '@/lib/sanitize';

const comment: TaskComment = {
  content: sanitizeText(content), // ✅ Sanitized
  // ... rest
};

// In handleCreateTask
const newTask: Task = {
  title: sanitizeText(taskData.title),
  description: sanitizeText(taskData.description),
  // ... rest
};
```

---

### Fix 2: File Upload Validation (45 minutes)

**Create file validation utility** (`src/lib/fileValidation.ts`):
```typescript
const ALLOWED_FILE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'text/csv',
];

const DANGEROUS_EXTENSIONS = [
  'exe', 'bat', 'cmd', 'sh', 'js', 'jar', 'vbs', 
  'scr', 'msi', 'app', 'deb', 'rpm', 'dmg', 'pkg',
  'dll', 'sys', 'com', 'pif', 'gadget'
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_FILENAME_LENGTH = 255;

export interface FileValidationResult {
  valid: boolean;
  error?: string;
  sanitizedName?: string;
}

export function validateFile(file: File): FileValidationResult {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: 'File size must be less than 10MB' };
  }

  // Check file type
  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    return { 
      valid: false, 
      error: `File type ${file.type} is not allowed. Allowed types: images, PDF, Word, Excel, text files.` 
    };
  }

  // Check extension
  const extension = file.name.toLowerCase().split('.').pop() || '';
  if (DANGEROUS_EXTENSIONS.includes(extension)) {
    return { 
      valid: false, 
      error: 'File type not allowed for security reasons' 
    };
  }

  // Validate filename length
  if (file.name.length > MAX_FILENAME_LENGTH) {
    return { 
      valid: false, 
      error: 'Filename is too long (max 255 characters)' 
    };
  }

  // Sanitize filename
  const sanitizedName = file.name
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .replace(/_{2,}/g, '_')
    .slice(0, MAX_FILENAME_LENGTH);

  // Check for null bytes
  if (file.name.includes('\0')) {
    return { 
      valid: false, 
      error: 'Invalid filename' 
    };
  }

  return { valid: true, sanitizedName };
}

export function getFileIcon(fileType: string): string {
  if (fileType.startsWith('image/')) return '🖼️';
  if (fileType === 'application/pdf') return '📄';
  if (fileType.includes('word')) return '📝';
  if (fileType.includes('excel') || fileType.includes('spreadsheet')) return '📊';
  if (fileType.startsWith('text/')) return '📃';
  return '📎';
}
```

**Update handleAddAttachment in App.tsx:**
```typescript
import { validateFile } from '@/lib/fileValidation';

const handleAddAttachment = async (taskId: string, file: File) => {
  if (!currentUser) return;

  // Validate file
  const validation = validateFile(file);
  if (!validation.valid) {
    toast.error(validation.error || 'Invalid file');
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    const attachment: TaskAttachment = {
      id: `attachment-${Date.now()}`,
      taskId,
      fileName: validation.sanitizedName || file.name, // Use sanitized name
      fileSize: file.size,
      fileType: file.type,
      fileData: reader.result as string,
      uploadedBy: currentUser.id,
      uploadedByName: currentUser.name,
      uploadedByAvatar: currentUser.avatar,
      uploadedAt: new Date().toISOString(),
    };

    setTasks((currentTasks) =>
      (currentTasks || []).map(task => {
        if (task.id === taskId) {
          const attachments = task.attachments || [];
          return { ...task, attachments: [...attachments, attachment] };
        }
        return task;
      })
    );

    addActivity(taskId, 'attachment_added', undefined, undefined, validation.sanitizedName || file.name);
    toast.success('File attached successfully!');
  };

  reader.onerror = () => {
    toast.error('Failed to read file');
  };

  reader.readAsDataURL(file);
};
```

---

### Fix 3: Rate Limiting for AI Features (1 hour)

**Create rate limiting utility** (`src/lib/rateLimit.ts`):
```typescript
interface RateLimitConfig {
  maxRequestsPerHour: number;
  maxRequestsPerDay: number;
}

const AI_RATE_LIMIT: RateLimitConfig = {
  maxRequestsPerHour: 50,
  maxRequestsPerDay: 200,
};

const EMAIL_RATE_LIMIT: RateLimitConfig = {
  maxRequestsPerHour: 20,
  maxRequestsPerDay: 100,
};

export async function checkRateLimit(
  userId: string,
  category: 'ai' | 'email',
  config?: RateLimitConfig
): Promise<{ allowed: boolean; remaining: number; resetAt: Date }> {
  const limits = config || (category === 'ai' ? AI_RATE_LIMIT : EMAIL_RATE_LIMIT);
  
  const now = new Date();
  const hourKey = `rate-limit-${category}-${userId}-${now.toISOString().slice(0, 13)}`;
  const dayKey = `rate-limit-${category}-${userId}-${now.toISOString().slice(0, 10)}`;

  const hourCount = await window.spark.kv.get<number>(hourKey) || 0;
  const dayCount = await window.spark.kv.get<number>(dayKey) || 0;

  if (hourCount >= limits.maxRequestsPerHour) {
    const resetAt = new Date(now.getTime() + 60 * 60 * 1000);
    return { allowed: false, remaining: 0, resetAt };
  }

  if (dayCount >= limits.maxRequestsPerDay) {
    const resetAt = new Date(now);
    resetAt.setHours(24, 0, 0, 0);
    return { allowed: false, remaining: 0, resetAt };
  }

  // Increment counters
  await window.spark.kv.set(hourKey, hourCount + 1);
  await window.spark.kv.set(dayKey, dayCount + 1);

  const remaining = Math.min(
    limits.maxRequestsPerHour - hourCount - 1,
    limits.maxRequestsPerDay - dayCount - 1
  );

  const resetAt = new Date(now.getTime() + 60 * 60 * 1000);
  return { allowed: true, remaining, resetAt };
}

export async function getRateLimitStatus(
  userId: string,
  category: 'ai' | 'email'
): Promise<{ hourly: number; daily: number; limits: RateLimitConfig }> {
  const limits = category === 'ai' ? AI_RATE_LIMIT : EMAIL_RATE_LIMIT;
  
  const now = new Date();
  const hourKey = `rate-limit-${category}-${userId}-${now.toISOString().slice(0, 13)}`;
  const dayKey = `rate-limit-${category}-${userId}-${now.toISOString().slice(0, 10)}`;

  const hourCount = await window.spark.kv.get<number>(hourKey) || 0;
  const dayCount = await window.spark.kv.get<number>(dayKey) || 0;

  return {
    hourly: hourCount,
    daily: dayCount,
    limits,
  };
}
```

**Apply to AI features:**
```typescript
import { checkRateLimit } from '@/lib/rateLimit';

// In AIAssistant component
const handleGetSuggestions = async () => {
  if (!currentUser) return;

  const rateCheck = await checkRateLimit(currentUser.id, 'ai');
  if (!rateCheck.allowed) {
    toast.error(
      `Rate limit exceeded. Resets at ${rateCheck.resetAt.toLocaleTimeString()}`
    );
    return;
  }

  setLoading(true);
  // ... rest of AI logic
};
```

---

### Fix 4: Enhanced Access Control (1 hour)

**Update permissions checking** (`src/lib/permissions.ts`):
```typescript
// Add ownership validation
export function canPerformTaskAction(
  employee: Employee | null,
  task: Task,
  action: 'edit' | 'delete' | 'view' | 'comment'
): boolean {
  if (!employee) return false;

  const permissions = getEmployeePermissions(employee);
  const isOwner = task.assigneeId === employee.id;

  switch (action) {
    case 'edit':
      return permissions.tasks.edit_any || 
             (permissions.tasks.edit_own && isOwner);
    
    case 'delete':
      return permissions.tasks.delete_any || 
             (permissions.tasks.delete_own && isOwner);
    
    case 'view':
      return permissions.tasks.view_all || 
             permissions.tasks.view_team || 
             (permissions.tasks.view_own && isOwner);
    
    case 'comment':
      return permissions.tasks.comment;
    
    default:
      return false;
  }
}

// Add to exports
export { canPerformTaskAction };
```

**Update App.tsx to use enhanced validation:**
```typescript
import { canPerformTaskAction } from '@/lib/permissions';

// In TaskCard or similar
const handleEditTask = (taskId: string) => {
  const task = (tasks || []).find(t => t.id === taskId);
  if (!task || !currentEmployee) return;

  if (!canPerformTaskAction(currentEmployee, task, 'edit')) {
    toast.error('You do not have permission to edit this task');
    return;
  }

  setEditingTask(task);
  setEditDialogOpen(true);
};
```

---

### Fix 5: Data Export Redaction (30 minutes)

**Update handleExportData in App.tsx:**
```typescript
const handleExportData = useCallback(async () => {
  if (!currentEmployee) return;

  // Check permission
  if (!canPerformAction(currentEmployee, 'employees', 'view')) {
    toast.error('You do not have permission to export data');
    return;
  }

  const isAdmin = currentEmployee.userRole === 'admin';

  // Redact sensitive data for non-admins
  const sanitizedEmployees = (employees || []).map(emp => ({
    ...emp,
    email: isAdmin ? emp.email : undefined,
    phone: isAdmin ? emp.phone : undefined,
  }));

  const data = {
    tasks: tasks || [],
    employees: sanitizedEmployees,
    announcements: announcements || [],
    notifications: [], // Don't export notifications for privacy
    exportDate: new Date().toISOString(),
    version: '1.0',
    exportedBy: currentEmployee.id,
    exportedByName: currentEmployee.name,
  };

  const dataStr = JSON.stringify(data, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `taskflow-backup-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  // Log the export
  await logAuditEvent({
    userId: currentEmployee.id,
    action: 'data_export',
    resource: 'system',
    details: `Exported ${(tasks || []).length} tasks, ${(employees || []).length} employees`,
    success: true,
  });

  toast.success('Data exported successfully');
}, [tasks, employees, announcements, currentEmployee]);
```

---

### Fix 6: Basic Audit Logging (1 hour)

**Create audit logging utility** (`src/lib/auditLog.ts`):
```typescript
export interface AuditLogEntry {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  action: string;
  category: 'user' | 'task' | 'system' | 'security' | 'settings';
  resource: string;
  details: string;
  success: boolean;
}

const MAX_AUDIT_LOGS = 10000;

export async function logAuditEvent(
  event: Omit<AuditLogEntry, 'id' | 'timestamp'>
): Promise<void> {
  try {
    const logs = await window.spark.kv.get<AuditLogEntry[]>('audit-logs') || [];
    
    const newLog: AuditLogEntry = {
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      ...event,
    };

    logs.push(newLog);

    // Keep only recent logs
    if (logs.length > MAX_AUDIT_LOGS) {
      logs.splice(0, logs.length - MAX_AUDIT_LOGS);
    }

    await window.spark.kv.set('audit-logs', logs);
  } catch (error) {
    console.error('Failed to log audit event:', error);
  }
}

export async function getAuditLogs(
  filters?: {
    userId?: string;
    category?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }
): Promise<AuditLogEntry[]> {
  try {
    let logs = await window.spark.kv.get<AuditLogEntry[]>('audit-logs') || [];

    if (filters?.userId) {
      logs = logs.filter(log => log.userId === filters.userId);
    }

    if (filters?.category) {
      logs = logs.filter(log => log.category === filters.category);
    }

    if (filters?.startDate) {
      logs = logs.filter(log => 
        new Date(log.timestamp) >= filters.startDate!
      );
    }

    if (filters?.endDate) {
      logs = logs.filter(log => 
        new Date(log.timestamp) <= filters.endDate!
      );
    }

    // Sort by most recent first
    logs.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    if (filters?.limit) {
      logs = logs.slice(0, filters.limit);
    }

    return logs;
  } catch (error) {
    console.error('Failed to get audit logs:', error);
    return [];
  }
}
```

**Apply audit logging to critical operations:**
```typescript
import { logAuditEvent } from '@/lib/auditLog';

// Log task deletion
const handleDeleteTask = async (taskId: string) => {
  const task = (tasks || []).find(t => t.id === taskId);
  if (!task || !currentEmployee) return;

  setTasks((currentTasks) => 
    (currentTasks || []).filter(t => t.id !== taskId)
  );

  await logAuditEvent({
    userId: currentEmployee.id,
    userName: currentEmployee.name,
    action: 'delete_task',
    category: 'task',
    resource: task.id,
    details: `Deleted task: ${task.title}`,
    success: true,
  });

  toast.success('Task deleted');
};

// Log role changes
const handleEditEmployee = async (id: string, updates: Omit<Employee, 'id'>) => {
  const oldEmployee = (employees || []).find(e => e.id === id);
  
  setEmployees((currentEmployees) =>
    (currentEmployees || []).map(employee =>
      employee.id === id ? { ...employee, ...updates } : employee
    )
  );

  if (oldEmployee?.userRole !== updates.userRole) {
    await logAuditEvent({
      userId: currentEmployee?.id || 'system',
      userName: currentEmployee?.name || 'System',
      action: 'role_change',
      category: 'security',
      resource: id,
      details: `Changed role from ${oldEmployee?.userRole} to ${updates.userRole}`,
      success: true,
    });
  }

  toast.success('Team member updated successfully!');
};
```

---

## 🟠 HIGH PRIORITY FIXES (Complete Within 48 Hours)

### Fix 7: Enhanced Error Handling (30 minutes)

**Create error handling utility** (`src/lib/errorHandling.ts`):
```typescript
export function handleError(error: unknown, userMessage: string = 'An unexpected error occurred'): void {
  // Log to console in development
  if (import.meta.env.DEV) {
    console.error('Error details:', error);
  }

  // In production, you would send to error tracking service
  // Example: Sentry.captureException(error);

  // Show user-friendly message
  toast.error(userMessage);
}

export function isNetworkError(error: unknown): boolean {
  return error instanceof TypeError && error.message.includes('fetch');
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return import.meta.env.DEV ? error.message : 'An error occurred';
  }
  return 'An unexpected error occurred';
}
```

**Apply throughout the app:**
```typescript
import { handleError } from '@/lib/errorHandling';

try {
  // Some operation
} catch (error) {
  handleError(error, 'Failed to save task');
}
```

---

### Fix 8: Session Timeout Warning (1 hour)

**Create session management** (`src/lib/sessionManagement.ts`):
```typescript
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
const WARNING_TIME = 5 * 60 * 1000; // 5 minutes before timeout

export function initSessionTimeout(onTimeout: () => void, onWarning: () => void): () => void {
  let timeoutId: NodeJS.Timeout;
  let warningId: NodeJS.Timeout;

  const resetTimers = () => {
    clearTimeout(timeoutId);
    clearTimeout(warningId);

    warningId = setTimeout(onWarning, SESSION_TIMEOUT - WARNING_TIME);
    timeoutId = setTimeout(onTimeout, SESSION_TIMEOUT);
  };

  // Reset on user activity
  const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
  events.forEach(event => {
    document.addEventListener(event, resetTimers, { passive: true });
  });

  resetTimers();

  // Cleanup function
  return () => {
    clearTimeout(timeoutId);
    clearTimeout(warningId);
    events.forEach(event => {
      document.removeEventListener(event, resetTimers);
    });
  };
}
```

---

## Testing Checklist

After implementing fixes, test:

- [ ] File upload with various file types (allowed and blocked)
- [ ] File upload with oversized files
- [ ] File upload with malicious filenames (../../../etc/passwd)
- [ ] XSS attempts in comments, descriptions, names
- [ ] Rate limiting by making rapid AI requests
- [ ] Permission boundaries (try to edit others' tasks as member)
- [ ] Data export as admin vs. regular user
- [ ] Audit log creation for critical operations
- [ ] Session timeout and warning functionality

---

## Post-Fix Verification

Run these commands after implementing fixes:

```bash
# Check for security vulnerabilities
npm audit

# Run tests
npm test

# Build for production
npm run build

# Check bundle size
npm run build -- --analyze
```

---

## Next Steps After Quick Fixes

1. **Backend Implementation:** Move API keys to backend
2. **External Security Audit:** Hire penetration testers
3. **Monitoring Setup:** Implement error tracking
4. **Documentation:** Update security documentation
5. **Training:** Security awareness for team

---

*Estimated total implementation time: 6-8 hours for critical fixes*
