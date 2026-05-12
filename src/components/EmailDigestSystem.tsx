import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Envelope, Calendar, Clock, CheckCircle, XCircle, Eye } from '@phosphor-icons/react';
import { format } from 'date-fns';
import { Task, Employee, TaskNotification, NotificationPreferences } from '@/lib/types';

interface DigestSchedule {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly';
  deliveryTime: string;
  deliveryDays?: number[];
  nextScheduled: string;
  lastSent?: string;
  notificationCount: number;
  isActive: boolean;
}

interface DigestLog {
  id: string;
  userId: string;
  userName: string;
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
        const daysToAdd = (nextDay - nextDate.getDay() + 7) % 7 || 7;
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
  notifications: TaskNotification[],
  tasks: Task[],
  groupByTask: boolean
): string {
  const greeting = `
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 28px;">Your Task Digest</h1>
      <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Hi ${userName}, here's your task update</p>
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
      const taskTitle = tasks.find(t => t.id === taskId)?.title || 'Unknown Task';
      notificationsHTML += `
        <div style="margin-bottom: 24px; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
          <h3 style="background: #f7fafc; padding: 16px; margin: 0; font-size: 16px; color: #2d3748;">${taskTitle}</h3>
          <div style="padding: 16px;">
            ${notifs.map(notif => `
              <div style="padding: 12px; margin-bottom: 8px; background: white; border-left: 4px solid #667eea;">
                <div style="font-size: 14px; color: #4a5568; margin-bottom: 4px;">
                  <strong>${notificationTypeLabels[notif.type] || notif.type}</strong>
                </div>
                <div style="font-size: 14px; color: #718096;">${notif.message}</div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    });
  } else {
    notificationsHTML = notifications.map(notif => `
      <div style="padding: 16px; margin-bottom: 12px; background: white; border: 1px solid #e2e8f0; border-radius: 8px;">
        <div style="font-size: 14px; color: #4a5568; margin-bottom: 8px;">
          <strong>${notif.taskTitle}</strong>
          <span style="color: #a0aec0; margin-left: 8px;">${notificationTypeLabels[notif.type] || notif.type}</span>
        </div>
        <div style="font-size: 14px; color: #718096;">${notif.message}</div>
      </div>
    `).join('');
  }

  return `
    <html>
      <head>
        <title>Task Digest</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f7fafc;">
        <div style="max-width: 600px; margin: 0 auto; background: white;">
          ${greeting}
          <div style="padding: 32px 20px;">
            <h2 style="color: #2d3748; font-size: 20px; margin: 0 0 24px 0;">You have ${notifications.length} notification${notifications.length !== 1 ? 's' : ''}</h2>
            ${notificationsHTML}
          </div>
          <div style="background: #f7fafc; padding: 20px; text-align: center; color: #718096; font-size: 12px;">
            <p style="margin: 0;">This is an automated digest from TaskFlow</p>
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
  const [digestLogs, setDigestLogs] = useState<DigestLog[]>([]);
  const [previewContent, setPreviewContent] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('schedules');

  const digestSchedules = useMemo(() => {
    const schedules: DigestSchedule[] = [];
    
    employees.forEach(async (employee) => {
      try {
        const prefsKey = `notification-preferences-${employee.id}`;
        const preferences = await window.spark.kv.get<NotificationPreferences>(prefsKey);
        
        if (preferences?.emailSchedule?.digestEnabled && employee.email) {
          const notifKey = `notifications`;
          const allNotifications = await window.spark.kv.get<TaskNotification[]>(notifKey) || [];
          const userNotifications = allNotifications.filter(
            n => n.userId === employee.id && !n.read
          );

          schedules.push({
            id: `schedule-${employee.id}`,
            userId: employee.id,
            userName: employee.name,
            userEmail: employee.email,
            frequency: preferences.emailSchedule.digestFrequency,
            deliveryTime: preferences.emailSchedule.digestTime,
            deliveryDays: preferences.emailSchedule.digestDays,
            nextScheduled: calculateNextSchedule(
              preferences.emailSchedule.digestFrequency,
              preferences.emailSchedule.digestTime,
              preferences.emailSchedule.digestDays
            ).toISOString(),
            lastSent: undefined,
            notificationCount: userNotifications.length,
            isActive: preferences.emailSchedule.digestEnabled,
          });
        }
      } catch (error) {
        console.error('Error loading digest schedule for employee:', employee.id, error);
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
        toast.error('No notification preferences found for this user');
        return;
      }

      const notifKey = `notifications`;
      const allNotifications = await window.spark.kv.get<TaskNotification[]>(notifKey) || [];
      const userNotifications = allNotifications.filter(
        n => n.userId === userId && !n.read
      ).slice(0, preferences.emailSchedule.maxNotificationsPerDigest || 50);

      if (userNotifications.length === 0) {
        toast.info('No notifications to preview');
        return;
      }

      const content = generateDigestHTML(
        employee.name,
        userNotifications,
        tasks,
        preferences.emailSchedule.groupByTask || false
      );
      
      setPreviewContent(content);
      setActiveTab('preview');
      toast.success('Digest preview generated');
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
        toast.error('No notification preferences found for this user');
        return;
      }

      const notifKey = `notifications`;
      const allNotifications = await window.spark.kv.get<TaskNotification[]>(notifKey) || [];
      const userNotifications = allNotifications.filter(
        n => n.userId === userId && !n.read
      ).slice(0, preferences.emailSchedule.maxNotificationsPerDigest || 50);

      if (userNotifications.length === 0) {
        toast.info('No notifications to send');
        return;
      }

      const content = generateDigestHTML(
        employee.name,
        userNotifications,
        tasks,
        preferences.emailSchedule.groupByTask || false
      );

      const newLog: DigestLog = {
        id: `log-${Date.now()}`,
        userId: employee.id,
        userName: employee.name,
        notificationCount: userNotifications.length,
        status: 'sent',
        timestamp: new Date().toISOString(),
      };

      setDigestLogs(prev => [newLog, ...prev]);

      await window.spark.kv.set(`digest-log-${newLog.id}`, newLog);
      
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
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Envelope className="h-5 w-5" weight="fill" />
            Email Digest Management
          </DialogTitle>
          <DialogDescription>
            Manage automated email digests for team members
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
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

          <TabsContent value="schedules" className="flex-1 overflow-hidden">
            <ScrollArea className="h-[400px] pr-4">
              {digestSchedules.length === 0 ? (
                <Alert>
                  <AlertDescription>
                    No active digest schedules. Team members need to enable email digests in their notification preferences.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-4">
                  {digestSchedules.map((schedule) => (
                    <Card key={schedule.id}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-base">{schedule.userName}</CardTitle>
                            <div className="text-sm text-muted-foreground">{schedule.userEmail}</div>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => handlePreviewDigest(schedule.userId)}>
                              <Eye className="mr-1 h-4 w-4" weight="bold" />
                              Preview
                            </Button>
                            <Button size="sm" onClick={() => handleSendTestDigest(schedule.userId)}>
                              <Envelope className="mr-1 h-4 w-4" weight="bold" />
                              Send Test
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="text-sm text-muted-foreground mb-1">Frequency</div>
                            <Badge variant="secondary" className="capitalize">
                              {schedule.frequency}
                            </Badge>
                          </div>
                          <div>
                            <div className="text-sm text-muted-foreground mb-1">Delivery Time</div>
                            <div className="text-sm font-medium">{schedule.deliveryTime}</div>
                          </div>
                          <div>
                            <div className="text-sm text-muted-foreground mb-1">Next Scheduled</div>
                            <div className="text-sm font-medium">
                              {format(new Date(schedule.nextScheduled), 'MMM d, yyyy h:mm a')}
                            </div>
                          </div>
                          <div>
                            <div className="text-sm text-muted-foreground mb-1">Pending Notifications</div>
                            <div className="text-sm font-medium">{schedule.notificationCount}</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="logs" className="flex-1 overflow-hidden">
            <ScrollArea className="h-[400px] pr-4">
              {digestLogs.length === 0 ? (
                <Alert>
                  <AlertDescription>
                    No delivery logs yet. Send a test digest to see logs here.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-3">
                  {digestLogs.map((log) => (
                    <Card key={log.id}>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">{log.userName}</div>
                            <div className="text-sm text-muted-foreground">
                              {log.notificationCount} notification{log.notificationCount !== 1 ? 's' : ''}
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge variant={log.status === 'sent' ? 'default' : 'destructive'}>
                              {log.status === 'sent' ? (
                                <CheckCircle className="mr-1 h-3 w-3" weight="fill" />
                              ) : (
                                <XCircle className="mr-1 h-3 w-3" weight="fill" />
                              )}
                              {log.status}
                            </Badge>
                            <div className="text-xs text-muted-foreground mt-1">
                              {format(new Date(log.timestamp), 'MMM d, h:mm a')}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="preview" className="flex-1 overflow-hidden">
            <ScrollArea className="h-[400px]">
              {previewContent ? (
                <div className="border rounded-lg overflow-hidden">
                  <iframe
                    srcDoc={previewContent}
                    className="w-full h-[600px] border-0"
                    title="Email Digest Preview"
                  />
                </div>
              ) : (
                <Alert>
                  <AlertDescription>
                    Select a schedule from the Schedules tab and click Preview to see the digest content.
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
