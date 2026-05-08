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
  phone?: string;
  status: 'active' | 'inactive';
  joinedDate: string;
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
