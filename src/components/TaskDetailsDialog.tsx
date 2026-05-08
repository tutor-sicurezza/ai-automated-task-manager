import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useState, useEffect, useRef } from 'react';
import { Task, Employee, TaskComment, TaskActivity, TaskAttachment, TaskPriority, TaskStatus } from '@/lib/types';
import { Clock, Circle, CircleHalf, CheckCircle, ChatCircle, ClockCounterClockwise, PaperPlaneTilt, ArrowsLeftRight, User, Calendar, Flag, FileText, CheckSquare, Paperclip, UploadSimple, Download, Trash, File, FileDoc, FilePdf, FileJpg, FilePng, FileZip } from '@phosphor-icons/react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface TaskDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: Task | null;
  employees: Employee[];
  currentUser: { id: string; name: string; avatar: string } | null;
  onAddComment: (taskId: string, content: string) => void;
  onAddAttachment: (taskId: string, file: File) => void;
  onDeleteAttachment: (taskId: string, attachmentId: string) => void;
}

export function TaskDetailsDialog({ open, onOpenChange, task, employees, currentUser, onAddComment, onAddAttachment, onDeleteAttachment }: TaskDetailsDialogProps) {
  const [commentText, setCommentText] = useState('');
  const [activeTab, setActiveTab] = useState('comments');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) {
      setCommentText('');
      setActiveTab('comments');
    }
  }, [open]);

  if (!task) return null;

  const handleAddComment = () => {
    if (!commentText.trim()) return;
    onAddComment(task.id, commentText);
    setCommentText('');
  };

  const assignee = task.assigneeId ? employees.find(e => e.id === task.assigneeId) : null;
  const isOverdue = new Date(task.dueDate) < new Date() && task.status !== 'completed';

  const priorityColors: Record<TaskPriority, string> = {
    high: 'bg-accent text-accent-foreground',
    medium: 'bg-amber-500 text-white',
    low: 'bg-slate-400 text-white'
  };

  const statusIcons = {
    'not-started': Circle,
    'in-progress': CircleHalf,
    'completed': CheckCircle
  };

  const StatusIcon = statusIcons[task.status];

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && task) {
      const MAX_FILE_SIZE = 10 * 1024 * 1024;
      if (file.size > MAX_FILE_SIZE) {
        return;
      }
      onAddAttachment(task.id, file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDownloadAttachment = (attachment: TaskAttachment) => {
    const link = document.createElement('a');
    link.href = attachment.fileData;
    link.download = attachment.fileName;
    link.click();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${Math.round(bytes / Math.pow(k, i) * 100) / 100} ${sizes[i]}`;
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.includes('pdf')) return FilePdf;
    if (fileType.includes('image')) {
      if (fileType.includes('png')) return FilePng;
      if (fileType.includes('jpg') || fileType.includes('jpeg')) return FileJpg;
    }
    if (fileType.includes('word') || fileType.includes('document')) return FileDoc;
    if (fileType.includes('zip') || fileType.includes('rar')) return FileZip;
    return File;
  };

  const getActivityIcon = (type: TaskActivity['type']) => {
    switch (type) {
      case 'created':
        return CheckSquare;
      case 'status_changed':
        return ArrowsLeftRight;
      case 'assignee_changed':
        return User;
      case 'due_date_changed':
        return Calendar;
      case 'priority_changed':
        return Flag;
      case 'title_changed':
      case 'description_changed':
        return FileText;
      case 'comment_added':
        return ChatCircle;
      case 'attachment_added':
        return Paperclip;
      case 'attachment_removed':
        return Paperclip;
      default:
        return ClockCounterClockwise;
    }
  };

  const getActivityMessage = (activity: TaskActivity) => {
    switch (activity.type) {
      case 'created':
        return 'created this task';
      case 'status_changed':
        return `changed status from ${activity.oldValue} to ${activity.newValue}`;
      case 'assignee_changed':
        return activity.oldValue 
          ? `reassigned from ${activity.oldValue} to ${activity.newValue || 'Unassigned'}`
          : `assigned to ${activity.newValue}`;
      case 'due_date_changed':
        return `changed due date from ${activity.oldValue} to ${activity.newValue}`;
      case 'priority_changed':
        return `changed priority from ${activity.oldValue} to ${activity.newValue}`;
      case 'title_changed':
        return 'updated the title';
      case 'description_changed':
        return 'updated the description';
      case 'comment_added':
        return 'added a comment';
      case 'attachment_added':
        return `attached ${activity.details}`;
      case 'attachment_removed':
        return `removed attachment ${activity.details}`;
      default:
        return activity.details || 'made a change';
    }
  };

  const comments = task.comments || [];
  const activities = task.activities || [];
  const attachments = task.attachments || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[85vh] p-0 flex flex-col">
        <DialogHeader className="px-6 pt-6 pb-4 flex-shrink-0">
          <div className="flex items-start gap-3 mb-3">
            <div className="flex-1">
              <DialogTitle className="text-2xl mb-2">{task.title}</DialogTitle>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary" className={cn('text-xs', priorityColors[task.priority])}>
                  {task.priority.toUpperCase()}
                </Badge>
                <Badge variant="outline" className="text-xs flex items-center gap-1">
                  <StatusIcon weight="fill" className="w-3 h-3" />
                  {task.status.replace('-', ' ').toUpperCase()}
                </Badge>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock weight="bold" className="w-3.5 h-3.5" />
                  <span className={cn(isOverdue && 'text-destructive font-medium')}>
                    {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {task.description && (
            <div className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
              {task.description}
            </div>
          )}

          {assignee && (
            <div className="flex items-center gap-2 pt-2">
              <span className="text-xs text-muted-foreground">Assigned to:</span>
              <div className="flex items-center gap-2">
                <Avatar className="w-6 h-6">
                  <AvatarImage src={assignee.avatar} alt={assignee.name} />
                  <AvatarFallback className="text-[10px]">{assignee.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium">{assignee.name}</span>
              </div>
            </div>
          )}
        </DialogHeader>

        <Separator />

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="mx-6 mt-4 w-auto self-start">
            <TabsTrigger value="comments" className="flex items-center gap-1.5">
              <ChatCircle className="w-4 h-4" weight="bold" />
              Comments ({comments.length})
            </TabsTrigger>
            <TabsTrigger value="attachments" className="flex items-center gap-1.5">
              <Paperclip className="w-4 h-4" weight="bold" />
              Attachments ({attachments.length})
            </TabsTrigger>
            <TabsTrigger value="activity" className="flex items-center gap-1.5">
              <ClockCounterClockwise className="w-4 h-4" weight="bold" />
              Activity ({activities.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="comments" className="flex-1 flex flex-col overflow-hidden mt-4 px-6">
            <ScrollArea className="flex-1 pr-4">
              <div className="space-y-4 pb-4">
                {comments.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <ChatCircle className="w-12 h-12 mx-auto mb-2 opacity-50" weight="light" />
                    <p className="text-sm">No comments yet. Start the conversation!</p>
                  </div>
                ) : (
                  comments.map((comment) => (
                    <div key={comment.id} className="flex gap-3">
                      <Avatar className="w-8 h-8 flex-shrink-0">
                        <AvatarImage src={comment.userAvatar} alt={comment.userName} />
                        <AvatarFallback className="text-xs">{comment.userName.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium">{comment.userName}</span>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                          </span>
                        </div>
                        <div className="text-sm bg-muted rounded-lg p-3">
                          {comment.content}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>

            {currentUser && (
              <div className="pt-4 pb-6 flex-shrink-0">
                <div className="flex gap-2">
                  <Avatar className="w-8 h-8 flex-shrink-0">
                    <AvatarImage src={currentUser.avatar} alt={currentUser.name} />
                    <AvatarFallback className="text-xs">{currentUser.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 flex gap-2">
                    <Textarea
                      placeholder="Add a comment..."
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      className="min-h-[80px] resize-none"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                          e.preventDefault();
                          handleAddComment();
                        }
                      }}
                    />
                    <Button
                      onClick={handleAddComment}
                      disabled={!commentText.trim()}
                      size="icon"
                      className="flex-shrink-0"
                    >
                      <PaperPlaneTilt className="w-4 h-4" weight="bold" />
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2 ml-10">
                  Press ⌘+Enter to post
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="attachments" className="flex-1 flex flex-col overflow-hidden mt-4 px-6">
            <ScrollArea className="flex-1 pr-4">
              <div className="space-y-3 pb-4">
                {attachments.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Paperclip className="w-12 h-12 mx-auto mb-2 opacity-50" weight="light" />
                    <p className="text-sm mb-2">No attachments yet</p>
                    <p className="text-xs">Upload files up to 10MB</p>
                  </div>
                ) : (
                  attachments.map((attachment) => {
                    const FileIconComponent = getFileIcon(attachment.fileType);
                    return (
                      <div key={attachment.id} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
                        <div className="flex-shrink-0 w-10 h-10 rounded bg-primary/10 flex items-center justify-center">
                          <FileIconComponent className="w-5 h-5 text-primary" weight="fill" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">{attachment.fileName}</div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                            <span>{formatFileSize(attachment.fileSize)}</span>
                            <span>•</span>
                            <span>{formatDistanceToNow(new Date(attachment.uploadedAt), { addSuffix: true })}</span>
                            <span>by {attachment.uploadedByName}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={() => handleDownloadAttachment(attachment)}
                            title="Download"
                          >
                            <Download className="w-4 h-4" weight="bold" />
                          </Button>
                          {currentUser && attachment.uploadedBy === currentUser.id && (
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => onDeleteAttachment(task.id, attachment.id)}
                              title="Delete"
                            >
                              <Trash className="w-4 h-4" weight="bold" />
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </ScrollArea>

            {currentUser && (
              <div className="pt-4 pb-6 flex-shrink-0">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  className="hidden"
                  accept="*/*"
                />
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <UploadSimple className="mr-2 h-4 w-4" weight="bold" />
                  Upload File (Max 10MB)
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="activity" className="flex-1 overflow-hidden mt-4 px-6">
            <ScrollArea className="h-full pr-4">
              <div className="space-y-3 pb-6">
                {activities.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <ClockCounterClockwise className="w-12 h-12 mx-auto mb-2 opacity-50" weight="light" />
                    <p className="text-sm">No activity yet</p>
                  </div>
                ) : (
                  activities.map((activity) => {
                    const ActivityIcon = getActivityIcon(activity.type);
                    return (
                      <div key={activity.id} className="flex gap-3">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                          <ActivityIcon className="w-4 h-4 text-muted-foreground" weight="bold" />
                        </div>
                        <div className="flex-1 min-w-0 pt-1">
                          <div className="text-sm">
                            <span className="font-medium">{activity.userName}</span>
                            {' '}
                            <span className="text-muted-foreground">{getActivityMessage(activity)}</span>
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
