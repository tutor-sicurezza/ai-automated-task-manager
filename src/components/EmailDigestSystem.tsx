import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Envelope, Calendar, Clock, CheckCircle, XCircle, Eye } from '@phosphor-icons/react';
import { Task, Employee, TaskNotification, NotificationPreferences } from '@/lib/types';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface DigestSchedule {
  id: string;
  userId: string;
  userEmail: string;
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly';
  deliveryTime: string;
  nextScheduled: string;
  notificationCount: number;
}

interface DigestLog {
  id: string;
  userId: string;
  userEmail: string;
  notificationCount: number;
  status: 'sent' | 'failed';
  timestamp: string;
}

const notificationTypeLabels: Record<string, string> = {
  task_assigned: 'Task Assigned',
  task_reassigned: 'Task Reassigned',
  task_comment: 'New Comment',
  task_overdue: 'Overdue Task',
  task_due_soon: 'Task Due Soon',
  task_completed: 'Task Completed',
  task_status_changed: 'Status Changed',
  mention: 'Mentioned',
};

function calculateNextSchedule(frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly', deliveryTime: string, deliveryDays?: number[]): Date {
  const now = new Date();
  const [hours, minutes] = deliveryTime.split(':').map(Number);
  const nextDate = new Date(now);
  nextDate.setHours(hours, minutes, 0, 0);
  
  if (nextDate <= now) {
    nextDate.setDate(nextDate.getDate() + 1);
  }
  
  switch (frequency) {
    case 'daily':
      break;
    case 'weekly':
      if (deliveryDays && deliveryDays.length > 0) {
        const nextDay = deliveryDays.find(day => day > nextDate.getDay()) || deliveryDays[0];
        const daysToAdd = (nextDay - nextDate.getDay() + 7) % 7;
        nextDate.setDate(nextDate.getDate() + daysToAdd);
      } else {
        nextDate.setDate(nextDate.getDate() + 7);
      }
      break;
    case 'biweekly':
      nextDate.setDate(nextDate.getDate() + 14);
      break;
    case 'monthly':
      nextDate.setMonth(nextDate.getMonth() + 1);
      break;
  }
  
  return nextDate;
}

function generateDigestEmail(
  userName: string,
  userEmail: string,
  notifications: TaskNotification[],
  tasks: Task[]
): string {
  const notifList = notifications.map(notif => {
    const task = tasks.find(t => t.id === notif.taskId);
    const taskTitle = task?.title || notif.taskTitle;
    return `
      <div style="padding: 12px; background: #f7fafc; border-radius: 8px; margin-bottom: 8px;">
        <div style="font-weight: 600; color: #2d3748; margin-bottom: 4px;">${notificationTypeLabels[notif.type] || notif.type}</div>
        <div style="font-size: 14px; color: #4a5568;">${taskTitle}</div>
        <div style="font-size: 14px; color: #718096;">${notif.message}</div>
      </div>
    `;
  }).join('');

  return `
    <html>
      <head>
        <title>Task Digest</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f7fafc;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: white; border-radius: 12px; padding: 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            <h2 style="color: #2d3748; margin-top: 0;">Your Task Digest</h2>
            <p style="color: #4a5568; margin-bottom: 24px;">Hello ${userName}, here are your recent notifications:</p>
            ${notifList}
            <div style="margin-top: 24px; padding-top: 24px; border-top: 1px solid #e2e8f0; text-align: center; color: #718096; font-size: 12px;">
              TaskFlow - Employee Task Manager
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
}

interface EmailDigestSystemProps {
  employees: Employee[];
  tasks: Task[];
}

export function EmailDigestSystem({ employees, tasks }: EmailDigestSystemProps) {
  const [open, setOpen] = useState(false);
  const [previewContent, setPreviewContent] = useState<string>('');

  const digestSchedules = useMemo(() => {
    const schedules: DigestSchedule[] = [];
    employees.forEach(async (employee) => {
      try {
        const prefsKey = `notification-preferences-${employee.id}`;
        const preferences = await window.spark.kv.get<NotificationPreferences>(prefsKey);
        
        if (preferences?.emailSchedule?.digestEnabled) {
          const notifKey = `notifications`;
          const allNotifications = await window.spark.kv.get<TaskNotification[]>(notifKey) || [];
          const userNotifications = allNotifications.filter(
            n => n.userId === employee.id && !n.read
          );

          schedules.push({
            id: `digest-${employee.id}`,
            userId: employee.id,
            userEmail: employee.email || 'No email',
            frequency: preferences.emailSchedule.digestFrequency || 'daily',
            deliveryTime: preferences.emailSchedule.digestTime,
            nextScheduled: calculateNextSchedule(
              preferences.emailSchedule.digestFrequency || 'daily',
              preferences.emailSchedule.digestTime,
            ).toISOString(),
            notificationCount: userNotifications.length,
          });
        }
      } catch (error) {
        console.error('Error loading digest schedule:', error);
      }
    });

    return schedules;
  }, [employees]);

  const handlePreviewDigest = async (userId: string) => {
    const employee = employees.find(e => e.id === userId);
    if (!employee) return;
    
    try {
      const prefsKey = `notification-preferences-${userId}`;
      const preferences = await window.spark.kv.get<NotificationPreferences>(prefsKey);
      if (!preferences?.emailSchedule?.digestEnabled) {
        toast.error('Email digest is not enabled for this user');
        return;
      }

      const notifKey = `notifications`;
      const allNotifications = await window.spark.kv.get<TaskNotification[]>(notifKey) || [];
      const userNotifications = allNotifications.filter(
        n => n.userId === userId && !n.read
      );

      if (userNotifications.length === 0) {
        toast.info('No unread notifications for this user');
      }
      
      const content = generateDigestEmail(
        employee.name,
        employee.email || 'No email',
        userNotifications,
        tasks
      );
      setPreviewContent(content);
      toast.success('Preview generated');
    } catch (error) {
      toast.error('Failed to generate preview');
    }
  };

  const handleSendTestDigest = async (userId: string) => {
    const employee = employees.find(e => e.id === userId);
    if (!employee) return;

    try {
      const prefsKey = `notification-preferences-${userId}`;
      const preferences = await window.spark.kv.get<NotificationPreferences>(prefsKey);
      if (!preferences?.emailSchedule?.digestEnabled) {
        toast.error('Email digest is not enabled for this user');
        return;
      }
      
      const notifKey = `notifications`;
      const allNotifications = await window.spark.kv.get<TaskNotification[]>(notifKey) || [];
      const userNotifications = allNotifications.filter(
        n => n.userId === userId && !n.read
      );

      const content = generateDigestEmail(
        employee.name,
        employee.email || 'No email',
        userNotifications,
        tasks,
      );

      const newLog: DigestLog = {
        id: `log-${Date.now()}`,
        userId: employee.id,
        userEmail: employee.email || 'No email',
        notificationCount: userNotifications.length,
        status: 'sent',
        timestamp: new Date().toISOString(),
      };

      toast.success(`Test digest sent to ${employee.name}`);
    } catch (error) {
      toast.error('Failed to send test digest');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Envelope className="mr-2 h-4 w-4" weight="bold" />
          Email Digests
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Email Digest System</DialogTitle>
          <DialogDescription>
            Manage automated email digests for task notifications
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="schedules" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="schedules">
              <Calendar className="mr-2 h-4 w-4" weight="bold" />
              Schedules
            </TabsTrigger>
            <TabsTrigger value="logs">
              <Clock className="mr-2 h-4 w-4" weight="bold" />
              Delivery Logs
            </TabsTrigger>
            <TabsTrigger value="preview">
              <Eye className="mr-2 h-4 w-4" weight="bold" />
              Preview
            </TabsTrigger>
          </TabsList>

          <TabsContent value="schedules" className="space-y-4">
            <ScrollArea className="h-[500px] pr-4">
              {digestSchedules.length === 0 ? (
                <Alert>
                  <AlertDescription>
                    No email digests are currently configured. Users can enable digests in their notification preferences.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-4">
                  {digestSchedules.map((schedule) => (
                    <Card key={schedule.id}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-semibold">{employees.find(e => e.id === schedule.userId)?.name}</div>
                            <div className="text-sm text-muted-foreground">{schedule.userEmail}</div>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => handlePreviewDigest(schedule.userId)}>
                              <Eye className="mr-1 h-4 w-4" weight="bold" />
                              Preview
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleSendTestDigest(schedule.userId)}>
                              <Envelope className="mr-1 h-4 w-4" weight="bold" />
                              Send Test
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <div className="text-sm font-medium">Frequency</div>
                            <Badge variant="secondary">{schedule.frequency}</Badge>
                          </div>
                          <div>
                            <div className="text-sm font-medium">Delivery Time</div>
                            <div className="text-sm text-muted-foreground">{schedule.deliveryTime}</div>
                          </div>
                          <div>
                            <div className="text-sm font-medium">Next Scheduled</div>
                            <div className="text-sm text-muted-foreground">
                              {format(new Date(schedule.nextScheduled), 'MMM d, yyyy h:mm a')}
                            </div>
                          </div>
                        </div>
                        <div className="mt-3 flex items-center gap-2">
                          <Badge variant="outline">{schedule.notificationCount} pending notifications</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="logs" className="space-y-4">
            <ScrollArea className="h-[500px] pr-4">
              <Alert>
                <AlertDescription>
                  No delivery logs available yet. Logs will appear here once digests are sent.
                </AlertDescription>
              </Alert>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="preview" className="space-y-4">
            <ScrollArea className="h-[500px] pr-4">
              {previewContent ? (
                <div className="border rounded-lg overflow-hidden">
                  <iframe
                    srcDoc={previewContent}
                    className="w-full h-[480px] border-0"
                    title="Email Digest Preview"
                  />
                </div>
              ) : (
                <Alert>
                  <AlertDescription>
                    Select a schedule from the Schedules tab and click Preview to see what the email will look like.
                  </AlertDescription>
                </Alert>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
