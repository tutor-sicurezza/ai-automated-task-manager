export type TaskStatus = 'not-started' | 'in-progress' | 'completed';
export type TaskPriority = 'low' | 'medium' | 'high';
export type ActivityType = 'created' | 'status_changed' | 'priority_changed' | 'assignee_changed' | 'due_date_changed' | 'title_changed' | 'description_changed' | 'comment_added' | 'attachment_added' | 'attachment_removed';

export interface Employee {
  id: string;
  name: string;
  avatar: string;
  role: string;
  email?: string;
  department?: string;
  departments?: string[];
  phone?: string;
  status: 'active' | 'inactive';
  joinedDate: string;
  location?: string;
  bio?: string;
  skills?: string[];
  teamLead?: boolean;
}

export interface TaskComment {
  id: string;
  taskId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  content: string;
  createdAt: string;
}

export interface TaskActivity {
  id: string;
  taskId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  type: ActivityType;
  oldValue?: string;
  newValue?: string;
  details?: string;
  createdAt: string;
}

export interface TaskAttachment {
  id: string;
  taskId: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  fileData: string;
  uploadedBy: string;
  uploadedByName: string;
  uploadedByAvatar: string;
  uploadedAt: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  assigneeId: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate: string;
  createdAt: string;
  comments?: TaskComment[];
  activities?: TaskActivity[];
  attachments?: TaskAttachment[];
}

export type AnnouncementPriority = 'info' | 'important' | 'urgent';

export interface Announcement {
  id: string;
  title: string;
  message: string;
  departments: string[];
  priority: AnnouncementPriority;
  createdBy: string;
  createdByName: string;
  createdByAvatar: string;
  createdAt: string;
  expiresAt?: string;
  isPinned: boolean;
  readBy: string[];
}

export type NotificationType = 
  | 'task_assigned'
  | 'task_reassigned'
  | 'task_updated'
  | 'task_comment'
  | 'task_due_soon'
  | 'task_overdue'
  | 'task_completed'
  | 'task_status_changed'
  | 'task_priority_changed'
  | 'mention';

export interface TaskNotification {
  id: string;
  userId: string;
  taskId: string;
  taskTitle: string;
  type: NotificationType;
  message: string;
  actionBy?: string;
  actionByName?: string;
  actionByAvatar?: string;
  createdAt: string;
  read: boolean;
  link?: string;
}

export interface NotificationPreferences {
  userId: string;
  emailNotifications: boolean;
  enabledNotifications: {
    task_assigned: boolean;
    task_reassigned: boolean;
    task_updated: boolean;
    task_comment: boolean;
    task_due_soon: boolean;
    task_overdue: boolean;
    task_completed: boolean;
    task_status_changed: boolean;
    task_priority_changed: boolean;
    mention: boolean;
  };
  notificationFrequency: 'instant' | 'daily' | 'weekly';
  quietHours: {
    enabled: boolean;
    startTime: string;
    endTime: string;
  };
}
