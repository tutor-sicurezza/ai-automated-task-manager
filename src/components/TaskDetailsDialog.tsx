import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textar
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useState, useEffect, useRef } from 'r
import { Clock, Circle, CircleHalf, CheckCircle, ChatCircle, ClockCounterClockwi
import { cn } from '@/lib/utils';
interface TaskDetailsDialogProps {
import { useState, useEffect } from 'react';
  employees: Employee[];
  onAddComment: (taskId: string, content: string) => void;
  onDeleteAttachment: (taskId: string, attachme
import { cn } from '@/lib/utils';

interface TaskDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: Task | null;

  currentUser: { id: string; name: string; avatar: string } | null;
  onAddComment: (taskId: string, content: string) => void;
 

export function TaskDetailsDialog({ open, onOpenChange, task, employees, currentUser, onAddComment }: TaskDetailsDialogProps) {
  const [commentText, setCommentText] = useState('');
  const [activeTab, setActiveTab] = useState('comments');

  useEffect(() => {
    if (!open) {
      setCommentText('');
      setActiveTab('comments');
    }
    if (file 

      }

      fileInputRef.current.value =
  };
  const handleDownloadAttachment = (att
    link.href = attachm
    

    if (bytes === 0) return '0 B';
    const sizes = ['B', 'KB', 'MB', 'GB'];


    if (fileType.includes('pdf')) return File
      if (fileType.includes('png')) re
    }
    

  const getActivityIcon
      case 'created':
      case 'status_changed':
      case 'assignee_changed
    

      case 'title_changed':

        return ChatCircle;
        return Pape
        return Paperc
        return ClockCounter
  };
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
      default:
        return activity.details || 'made a change';
    }
  };

  const comments = task.comments || [];
  const activities = task.activities || [];

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
            {currentUser 
                <div c
                    
                  
                

                      className=
                        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                          handle
                  
            

                      cl
                      <PaperPlaneTilt className="w-4 h-4" 
                  </div>
                <p className="text-xs text-muted-foregr
                </p>
            )}

            <ScrollArea c
                {attachments.length === 0 ? (
                    
                  
            
                    con

                     

                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                            <span>•</span>
                            <span>by {attachment.uploadedByName}</span>
                        </div>
                          <Button
                          
                            onClick={() => handleDownloadAttachment(attachment)}
                          >
                          </Button>
                          
                     

                            >
                            </Button>
                        </div>
                    );
                )}
            </ScrollArea>
            {currentUser && (
                <input
                  ref
                  className="hidden"
                />
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  <UploadSimple className="mr-2 h-4 w-4" weight="bold" />
                </Button>
            )}

            <ScrollArea className="h-full pr-4">
                {activities.length === 0 ? (
                    <ClockCounterClockwise className="w-12 h-12 mx-auto mb-2 opacity-50" weight="li
                  </div>
                  activities.m
                    return (
                        <div className="fle
                        </div>
                          <d
                          
                    
                  
                    
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
