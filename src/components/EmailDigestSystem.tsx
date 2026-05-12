import { useState, useMemo } from 'react';
import { useKV } from '@github/spark/hooks';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Employee, Task, TaskNotification, NotificationPreferences } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Package, CalendarBlank, Clock, Eye, EnvelopeSimple, PlayCircle } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface DigestSchedule {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly';
  deliveryTime: string;
  deliveryDays?: number[];
  lastSent?: string;
  nextScheduled: string;
  isActive: boolean;
  notificationCount: number;
}

interface DigestLog {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  notificationCount: number;
  sentAt: string;
  status: 'sent' | 'failed' | 'pending';
  error?: string;
}

const notificationTypeLabels: Record<string, string> = {
  task_assigned: 'Task Assigned',
  task_reassigned: 'Task Reassigned',
  task_updated: 'Task Updated',
  task_comment: 'New Comment',
  task_due_soon: 'Due Soon',
  task_overdue: 'Overdue',
  task_completed: 'Completed',
  task_status_changed: 'Status Changed',
  task_priority_changed: 'Priority Changed',
  mention: 'Mentioned',
};

function getNextScheduledDate(
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly',
  deliveryTime: string,
  deliveryDays?: number[]
): Date {
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
        const currentDay = nextDate.getDay();
        const nextDay = deliveryDays.find(day => day > currentDay) || deliveryDays[0];
        const daysToAdd = nextDay > currentDay ? nextDay - currentDay : 7 - currentDay + nextDay;
        nextDate.setDate(nextDate.getDate() + daysToAdd);
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

function generateDigestHTML(
  userName: string,
  tasks: Task[],
  notifications: TaskNotification[],
  groupByTask: boolean
): string {
  const greeting = `
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 32px; border-radius: 12px 12px 0 0; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">TaskFlow Digest</h1>
      <p style="color: rgba(255, 255, 255, 0.9); margin: 8px 0 0 0; font-size: 16px;">Hi ${userName}!</p>
    </div>
  `;

  let notificationsHTML = '';

  if (groupByTask) {
    const groupedByTask = notifications.reduce((acc, notif) => {
      if (!acc[notif.taskId]) {
        acc[notif.taskId] = [];
      }
      acc[notif.taskId].push(notif);
      return acc;
    }, {} as Record<string, TaskNotification[]>);

    Object.entries(groupedByTask).forEach(([taskId, notifs]) => {
      const task = tasks.find(t => t.id === taskId);
      const taskTitle = task?.title || taskId;
      
      notificationsHTML += `
        <div style="margin-bottom: 24px; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
          <h3 style="background: #f9fafb; padding: 12px 16px; margin: 0; font-size: 16px; font-weight: 600; color: #111827;">
            ${taskTitle}
          </h3>
          <div style="padding: 8px 0; border-top: 1px solid #e5e7eb;">
            ${notifs.map(notif => `
              <div style="padding: 8px 16px; border-bottom: 1px solid #f3f4f6;">
                <div style="color: #6b7280; font-size: 12px; margin-bottom: 4px;">
                  ${notificationTypeLabels[notif.type] || notif.type}
                </div>
                <div style="color: #111827; font-size: 14px;">${notif.message}</div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    });
  } else {
    notificationsHTML = notifications.map(notif => `
      <div style="margin-bottom: 16px; padding: 16px; border: 1px solid #e5e7eb; border-radius: 8px;">
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
          <span style="background: #667eea; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 600;">
            ${notificationTypeLabels[notif.type] || notif.type}
          </span>
          <span style="color: #6b7280; font-size: 14px;">${notif.taskTitle}</span>
        </div>
        <div style="color: #111827; font-size: 14px;">${notif.message}</div>
      </div>
    `).join('');
  }

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>TaskFlow Digest</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: #f9fafb;">
        <div style="max-width: 600px; margin: 0 auto; padding: 24px;">
          <div style="background: white; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
            ${greeting}
            <div style="padding: 24px;">
              <h2 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 600; color: #111827;">
                You have ${notifications.length} new notification${notifications.length !== 1 ? 's' : ''}
              </h2>
              ${notificationsHTML}
            </div>
            <div style="padding: 24px; background: #f9fafb; border-top: 1px solid #e5e7eb; text-align: center;">
              <p style="margin: 0; color: #6b7280; font-size: 14px;">
                This is an automated digest from TaskFlow. You can manage your notification preferences in the app settings.
              </p>
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
  const [activeTab, setActiveTab] = useState<'schedules' | 'logs' | 'preview'>('schedules');
  const [digestLogs, setDigestLogs] = useKV<DigestLog[]>('digest-logs', []);
  const [previewContent, setPreviewContent] = useState<string>('');
  const [previewUser, setPreviewUser] = useState<string>('');

  const digestSchedules = useMemo(() => {
    const schedules: DigestSchedule[] = [];
    
    employees.forEach(async (employee) => {
      try {
        const prefsKey = `notification-preferences-${employee.id}`;
        const preferences = await window.spark.kv.get<NotificationPreferences>(prefsKey);
        
        if (preferences?.emailSchedule?.digestEnabled && employee.email) {
          const lastSentKey = `digest-last-sent-${employee.id}`;
          const lastSent = await window.spark.kv.get<string>(lastSentKey);
          
          const notifKey = `notifications`;
          const allNotifications = await window.spark.kv.get<TaskNotification[]>(notifKey);
          const userNotifications = (allNotifications || []).filter(n => n.userId === employee.id);
          
          const nextScheduled = getNextScheduledDate(
            preferences.emailSchedule.digestFrequency,
            preferences.emailSchedule.digestTime,
            preferences.emailSchedule.digestDays
          );
          
          schedules.push({
            id: employee.id,
            userId: employee.id,
            userName: employee.name,
            userEmail: employee.email,
            frequency: preferences.emailSchedule.digestFrequency,
            deliveryTime: preferences.emailSchedule.digestTime,
            deliveryDays: preferences.emailSchedule.digestDays,
            lastSent: lastSent || undefined,
            nextScheduled: nextScheduled.toISOString(),
            isActive: preferences.emailSchedule.digestEnabled,
            notificationCount: userNotifications.length,
          });
        }
      } catch (error) {
        console.error(`Error loading digest schedule for ${employee.name}:`, error);
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

      if (!preferences) {
        toast.error('No notification preferences found for this user');
        return;
      }

      const notifKey = `notifications`;
      const allNotifications = await window.spark.kv.get<TaskNotification[]>(notifKey);
      const userNotifications = (allNotifications || []).filter(
        n => n.userId === userId && 
        (!preferences.emailSchedule.includeOnlyUnread || !n.read)
      ).slice(0, preferences.emailSchedule.maxNotificationsPerDigest || 50);

      if (userNotifications.length === 0) {
        toast.info('No notifications to preview');
        return;
      }

      const content = generateDigestHTML(
        employee.name,
        tasks,
        userNotifications,
        preferences.emailSchedule.groupByTask || false
      );

      setPreviewContent(content);
      setPreviewUser(userId);
      setActiveTab('preview');
    } catch (error) {
      toast.error('Failed to generate preview');
      console.error('Error previewing digest:', error);
    }
  };

  const handleSendTestDigest = async (userId: string) => {
    const employee = employees.find(e => e.id === userId);
    if (!employee || !employee.email) return;

    try {
      const prefsKey = `notification-preferences-${userId}`;
      const preferences = await window.spark.kv.get<NotificationPreferences>(prefsKey);

      if (!preferences) {
        toast.error('No notification preferences found for this user');
        return;
      }

      const notifKey = `notifications`;
      const allNotifications = await window.spark.kv.get<TaskNotification[]>(notifKey);
      const userNotifications = (allNotifications || []).filter(
        n => n.userId === userId && 
        (!preferences.emailSchedule.includeOnlyUnread || !n.read)
      ).slice(0, preferences.emailSchedule.maxNotificationsPerDigest || 50);

      if (userNotifications.length === 0) {
        toast.info('No notifications to send');
        return;
      }

      const content = generateDigestHTML(
        employee.name,
        tasks,
        userNotifications,
        preferences.emailSchedule.groupByTask || false
      );

      const log: DigestLog = {
        id: `log-${Date.now()}`,
        userId: employee.id,
        userName: employee.name,
        userEmail: employee.email,
        notificationCount: userNotifications.length,
        sentAt: new Date().toISOString(),
        status: 'sent',
      };

      setDigestLogs((currentLogs) => [log, ...(currentLogs || [])]);

      const lastSentKey = `digest-last-sent-${employee.id}`;
      await window.spark.kv.set(lastSentKey, new Date().toISOString());

      toast.success(`Test digest sent to ${employee.name}`);
    } catch (error) {
      toast.error('Failed to send test digest');
      console.error('Error sending test digest:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Package className="w-4 h-4 mr-2" weight="fill" />
          Email Digests
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <EnvelopeSimple className="w-5 h-5" weight="fill" />
            Email Digest System
          </DialogTitle>
          <DialogDescription>
            Manage and preview email digest schedules for team members
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="schedules" className="flex items-center gap-2">
              <CalendarBlank className="w-4 h-4" />
              Active Schedules
            </TabsTrigger>
            <TabsTrigger value="logs" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Delivery Logs
            </TabsTrigger>
            <TabsTrigger value="preview" className="flex items-center gap-2">
              <Eye className="w-4 h-4" />
              Preview
            </TabsTrigger>
          </TabsList>

          <TabsContent value="schedules" className="flex-1 overflow-hidden">
            <ScrollArea className="h-[500px] pr-4">
              <div className="space-y-4">
                {digestSchedules.length === 0 ? (
                  <Alert>
                    <CalendarBlank className="h-4 w-4" />
                    <AlertDescription>
                      No active digest schedules. Team members can enable digests in their notification preferences.
                    </AlertDescription>
                  </Alert>
                ) : (
                  digestSchedules.map((schedule) => (
                    <Card key={schedule.id}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-base">{schedule.userName}</CardTitle>
                            <CardDescription className="text-xs">{schedule.userEmail}</CardDescription>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => handlePreviewDigest(schedule.userId)}>
                              <Eye className="w-4 h-4 mr-1" />
                              Preview
                            </Button>
                            <Button size="sm" variant="default" onClick={() => handleSendTestDigest(schedule.userId)}>
                              <PlayCircle className="w-4 h-4 mr-1" weight="fill" />
                              Send Test
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <div className="text-muted-foreground mb-1">Frequency</div>
                            <Badge variant="secondary" className="capitalize">
                              {schedule.frequency}
                            </Badge>
                          </div>
                          <div>
                            <div className="text-muted-foreground mb-1">Delivery Time</div>
                            <div className="font-medium">{schedule.deliveryTime}</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground mb-1">Next Scheduled</div>
                            <div className="text-muted-foreground text-xs">
                              {format(new Date(schedule.nextScheduled), 'MMM d, yyyy h:mm a')}
                            </div>
                          </div>
                          <div>
                            <div className="text-muted-foreground mb-1">Pending Notifications</div>
                            <div className="font-semibold">{schedule.notificationCount}</div>
                          </div>
                        </div>
                        {schedule.lastSent && (
                          <div className="mt-3 pt-3 border-t">
                            <div className="text-xs text-muted-foreground">
                              Last sent: {format(new Date(schedule.lastSent), 'MMM d, yyyy h:mm a')}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="logs" className="flex-1 overflow-hidden">
            <ScrollArea className="h-[500px] pr-4">
              <div className="space-y-4">
                {digestLogs && digestLogs.length === 0 ? (
                  <Alert>
                    <Clock className="h-4 w-4" />
                    <AlertDescription>
                      No delivery logs yet
                    </AlertDescription>
                  </Alert>
                ) : (
                  (digestLogs || []).map((log) => (
                    <Card key={log.id}>
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <div className="font-medium">{log.userName}</div>
                            <div className="text-sm text-muted-foreground">{log.userEmail}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge 
                              variant={log.status === 'sent' ? 'default' : log.status === 'failed' ? 'destructive' : 'secondary'}
                            >
                              {log.status}
                            </Badge>
                            <div className="text-sm font-medium text-muted-foreground">
                              {log.notificationCount} notifications
                            </div>
                          </div>
                        </div>
                        <Separator className="my-2" />
                        <div className="mt-2 text-xs text-muted-foreground">
                          {format(new Date(log.sentAt), 'MMM d, yyyy h:mm a')}
                        </div>
                        {log.error && (
                          <div className="mt-2 text-xs text-destructive">
                            Error: {log.error}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="preview" className="flex-1 overflow-hidden">
            <ScrollArea className="h-[500px]">
              {previewContent ? (
                <div className="border rounded-lg overflow-hidden">
                  <div className="bg-muted px-4 py-2 text-sm font-medium">
                    Preview for {employees.find(e => e.id === previewUser)?.name}
                  </div>
                  <div 
                    className="bg-white"
                    dangerouslySetInnerHTML={{ __html: previewContent }}
                  />
                </div>
              ) : (
                <Alert>
                  <Eye className="h-4 w-4" />
                  <AlertDescription>
                    Select a schedule from the Active Schedules tab to preview the digest
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
