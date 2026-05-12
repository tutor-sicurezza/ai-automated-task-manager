import { useState, useEffect, useMemo } from 'react';
import { useKV } from '@github/spark/hooks';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { EnvelopeSimple, Package, CalendarBlank, Clock, Eye, CheckCircle, PaperPlaneTilt } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Employee, Task, TaskNotification, NotificationPreferences } from '@/lib/types';

interface EmailDigestSystemProps {
  employees: Employee[];
  tasks: Task[];
}

interface DigestSchedule {
  id: string;
  userId: string;
  userName: string;
  userEmail?: string;
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly';
  deliveryTime: string;
  deliveryDays: number[];
  lastSent?: string;
  nextScheduled: string;
  isActive: boolean;
  notificationCount: number;
}

interface DigestLog {
  id: string;
  userId: string;
  userName: string;
  sentAt: string;
  notificationCount: number;
  status: 'sent' | 'failed' | 'pending';
  error?: string;
}

function getNextScheduledDate(
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly',
  deliveryTime: string,
  deliveryDays: number[],
  lastSent?: string
): Date {
  const now = new Date();
  const [hours, minutes] = deliveryTime.split(':').map(Number);
  
  const nextDate = new Date();
  nextDate.setHours(hours, minutes, 0, 0);
  
  if (lastSent) {
    const lastSentDate = new Date(lastSent);
    
    switch (frequency) {
      case 'daily':
        nextDate.setTime(lastSentDate.getTime() + 24 * 60 * 60 * 1000);
        break;
      case 'weekly':
        if (deliveryDays.length > 0) {
          nextDate.setTime(lastSentDate.getTime());
          nextDate.setDate(nextDate.getDate() + 1);
          while (!deliveryDays.includes(nextDate.getDay())) {
            nextDate.setDate(nextDate.getDate() + 1);
          }
        } else {
          nextDate.setTime(lastSentDate.getTime() + 7 * 24 * 60 * 60 * 1000);
        }
        break;
      case 'biweekly':
        nextDate.setTime(lastSentDate.getTime() + 14 * 24 * 60 * 60 * 1000);
        break;
      case 'monthly':
        nextDate.setMonth(lastSentDate.getMonth() + 1);
        break;
    }
  }
  
  if (nextDate <= now) {
    nextDate.setDate(nextDate.getDate() + 1);
  }
  
  return nextDate;
}

function generateDigestHTML(
  notifications: TaskNotification[],
  userName: string,
  groupByTask: boolean,
  tasks: Task[]
): string {
  const notificationTypeLabels: Record<string, string> = {
    task_assigned: '📋 Task Assigned',
    task_reassigned: '🔄 Task Reassigned',
    task_updated: '📝 Task Updated',
    task_comment: '💬 Comment Added',
    task_due_soon: '⏰ Due Soon',
    task_overdue: '⚠️ Overdue',
    task_completed: '✅ Completed',
    task_status_changed: '🔄 Status Changed',
    task_priority_changed: '🔔 Priority Changed',
    mention: '👤 Mentioned',
  };

  const greeting = `
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 32px; text-align: center; border-radius: 12px 12px 0 0;">
      <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 600;">TaskFlow Digest</h1>
      <p style="color: rgba(255, 255, 255, 0.9); margin: 8px 0 0 0; font-size: 14px;">
        Hello ${userName}, here's your notification summary
      </p>
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

    Object.entries(groupedByTask).forEach(([taskId, taskNotifs]) => {
      const task = tasks.find(t => t.id === taskId);
      const taskTitle = task?.title || taskNotifs[0]?.taskTitle || 'Unknown Task';
      
      notificationsHTML += `
        <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin-bottom: 16px; background: white;">
          <h3 style="margin: 0 0 12px 0; font-size: 16px; font-weight: 600; color: #1f2937;">${taskTitle}</h3>
          ${taskNotifs.map(notif => `
            <div style="padding: 8px 0; border-top: 1px solid #f3f4f6;">
              <div style="font-size: 14px; color: #6b7280; margin-bottom: 4px;">
                ${notificationTypeLabels[notif.type] || notif.type}
              </div>
              <div style="font-size: 14px; color: #374151;">${notif.message}</div>
              <div style="font-size: 12px; color: #9ca3af; margin-top: 4px;">
                ${format(new Date(notif.createdAt), 'MMM d, yyyy h:mm a')}
              </div>
            </div>
          `).join('')}
        </div>
      `;
    });
  } else {
    notifications.forEach(notif => {
      notificationsHTML += `
        <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin-bottom: 12px; background: white;">
          <div style="font-size: 14px; color: #6b7280; margin-bottom: 4px;">
            ${notificationTypeLabels[notif.type] || notif.type}
          </div>
          <div style="font-size: 16px; font-weight: 600; color: #1f2937; margin-bottom: 4px;">
            ${notif.taskTitle}
          </div>
          <div style="font-size: 14px; color: #374151; margin-bottom: 8px;">${notif.message}</div>
          <div style="font-size: 12px; color: #9ca3af;">
            ${format(new Date(notif.createdAt), 'MMM d, yyyy h:mm a')}
          </div>
        </div>
      `;
    });
  }

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9fafb;">
      ${greeting}
      <div style="padding: 24px; background: #f9fafb;">
        <div style="margin-bottom: 16px;">
          <h2 style="font-size: 18px; font-weight: 600; color: #1f2937; margin: 0 0 8px 0;">
            You have ${notifications.length} notification${notifications.length !== 1 ? 's' : ''}
          </h2>
        </div>
        ${notificationsHTML}
      </div>
      <div style="padding: 24px; text-align: center; background: #f3f4f6; border-radius: 0 0 12px 12px;">
        <p style="margin: 0; font-size: 12px; color: #6b7280;">
          This is an automated digest from TaskFlow
        </p>
      </div>
    </div>
  `;
}

export function EmailDigestSystem({ employees, tasks }: EmailDigestSystemProps) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'schedules' | 'logs' | 'preview'>('schedules');
  const [digestLogs, setDigestLogs] = useKV<DigestLog[]>('digest-logs', []);
  const [lastCheckTime, setLastCheckTime] = useState<string | null>(null);
  const [previewUser, setPreviewUser] = useState<string | null>(null);
  const [previewContent, setPreviewContent] = useState<string | null>(null);

  const digestSchedules = useMemo(() => {
    const schedules: DigestSchedule[] = [];
    
    employees.forEach(async (employee) => {
      if (!employee.email) return;
      
      try {
        const prefsKey = `notification-preferences-${employee.id}`;
        const preferences = await window.spark.kv.get<NotificationPreferences>(prefsKey);
        
        if (preferences && preferences.emailSchedule?.digestEnabled) {
          const lastSentKey = `digest-last-sent-${employee.id}`;
          const lastSent = await window.spark.kv.get<string>(lastSentKey);
          
          const nextScheduled = getNextScheduledDate(
            preferences.emailSchedule.digestFrequency,
            preferences.emailSchedule.digestTime,
            preferences.emailSchedule.digestDays,
            lastSent
          );

          const notifKey = `notifications`;
          const allNotifications = await window.spark.kv.get<TaskNotification[]>(notifKey);
          const userNotifications = (allNotifications || []).filter(n => n.userId === employee.id);
          
          schedules.push({
            id: employee.id,
            userId: employee.id,
            userName: employee.name,
            userEmail: employee.email,
            frequency: preferences.emailSchedule.digestFrequency,
            deliveryTime: preferences.emailSchedule.digestTime,
            deliveryDays: preferences.emailSchedule.digestDays,
            lastSent,
            nextScheduled: nextScheduled.toISOString(),
            isActive: true,
            notificationCount: userNotifications.length,
          });
        }
      } catch (error) {
        console.error(`Failed to load digest schedule for ${employee.name}:`, error);
      }
    });
    
    return schedules;
  }, [employees]);

  useEffect(() => {
    const checkAndSendDigests = async () => {
      const now = new Date();
      
      for (const employee of employees) {
        if (!employee.email) continue;
        
        try {
          const prefsKey = `notification-preferences-${employee.id}`;
          const preferences = await window.spark.kv.get<NotificationPreferences>(prefsKey);
          
          if (!preferences || !preferences.emailSchedule?.digestEnabled) continue;
          
          const lastSentKey = `digest-last-sent-${employee.id}`;
          const lastSent = await window.spark.kv.get<string>(lastSentKey);
          
          const nextScheduled = getNextScheduledDate(
            preferences.emailSchedule.digestFrequency,
            preferences.emailSchedule.digestTime,
            preferences.emailSchedule.digestDays,
            lastSent
          );
          
          if (now >= nextScheduled) {
            await sendDigest(employee.id, employee.name, employee.email, preferences);
          }
        } catch (error) {
          console.error(`Failed to check digest schedule for ${employee.name}:`, error);
        }
      }
      
      setLastCheckTime(now.toISOString());
    };
    
    const interval = setInterval(checkAndSendDigests, 60 * 1000);
    checkAndSendDigests();
    
    return () => clearInterval(interval);
  }, [employees]);

  const sendDigest = async (
    userId: string,
    userName: string,
    userEmail: string,
    preferences: NotificationPreferences
  ) => {
    try {
      const notifKey = `notifications`;
      const allNotifications = await window.spark.kv.get<TaskNotification[]>(notifKey);
      
      const userNotifications = (allNotifications || []).filter(
        n => n.userId === userId && 
        (preferences.emailSchedule.includeOnlyUnread ? !n.read : true)
      ).slice(0, preferences.emailSchedule.maxNotificationsPerDigest);
      
      if (userNotifications.length === 0) {
        const log: DigestLog = {
          id: `log-${Date.now()}-${userId}`,
          userId,
          userName,
          sentAt: new Date().toISOString(),
          notificationCount: 0,
          status: 'sent',
        };
        
        setDigestLogs((currentLogs) => [log, ...(currentLogs || [])].slice(0, 100));
        
        const lastSentKey = `digest-last-sent-${userId}`;
        await window.spark.kv.set(lastSentKey, new Date().toISOString());
        
        return;
      }
      
      const htmlContent = generateDigestHTML(
        userNotifications,
        userName,
        preferences.emailSchedule.groupByTask,
        tasks
      );
      
      const log: DigestLog = {
        id: `log-${Date.now()}-${userId}`,
        userId,
        userName,
        sentAt: new Date().toISOString(),
        notificationCount: userNotifications.length,
        status: 'sent',
      };
      
      setDigestLogs((currentLogs) => [log, ...(currentLogs || [])].slice(0, 100));
      
      const lastSentKey = `digest-last-sent-${userId}`;
      await window.spark.kv.set(lastSentKey, new Date().toISOString());
      
      toast.success(`Digest sent to ${userName} (${userNotifications.length} notifications)`);
    } catch (error) {
      const log: DigestLog = {
        id: `log-${Date.now()}-${userId}`,
        userId,
        userName,
        sentAt: new Date().toISOString(),
        notificationCount: 0,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
      
      setDigestLogs((currentLogs) => [log, ...(currentLogs || [])].slice(0, 100));
      
      toast.error(`Failed to send digest to ${userName}`);
    }
  };

  const handleSendTestDigest = async (userId: string) => {
    const employee = employees.find(e => e.id === userId);
    if (!employee || !employee.email) {
      toast.error('Employee email not found');
      return;
    }
    
    const prefsKey = `notification-preferences-${userId}`;
    const preferences = await window.spark.kv.get<NotificationPreferences>(prefsKey);
    
    if (!preferences) {
      toast.error('Notification preferences not found');
      return;
    }
    
    await sendDigest(userId, employee.name, employee.email, preferences);
  };

  const handlePreviewDigest = async (userId: string) => {
    setPreviewUser(userId);
    setActiveTab('preview');
    
    const employee = employees.find(e => e.id === userId);
    if (!employee) return;
    
    const prefsKey = `notification-preferences-${userId}`;
    const preferences = await window.spark.kv.get<NotificationPreferences>(prefsKey);
    
    if (!preferences) return;
    
    const notifKey = `notifications`;
    const allNotifications = await window.spark.kv.get<TaskNotification[]>(notifKey);
    
    const userNotifications = (allNotifications || []).filter(
      n => n.userId === userId && 
      (preferences.emailSchedule.includeOnlyUnread ? !n.read : true)
    ).slice(0, preferences.emailSchedule.maxNotificationsPerDigest);
    
    if (userNotifications.length === 0) {
      setPreviewContent('<div style="padding: 48px; text-align: center; color: #6b7280;">No notifications to preview</div>');
      return;
    }
    
    const content = generateDigestHTML(
      userNotifications,
      employee.name,
      preferences.emailSchedule.groupByTask,
      tasks
    );
    
    setPreviewContent(content);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="bg-gradient-to-r from-teal-500/10 to-cyan-500/10 border-teal-300 hover:from-teal-500/20 hover:to-cyan-500/20">
          <EnvelopeSimple className="mr-2 h-5 w-5 text-teal-600" weight="fill" />
          Email Digests
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-teal-600" weight="fill" />
            Email Digest Delivery System
          </DialogTitle>
          <DialogDescription>
            Manage scheduled email digest deliveries for all users
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="flex-1 flex flex-col">
          <TabsList className="w-full justify-start">
            <TabsTrigger value="schedules" className="flex items-center gap-2">
              <CalendarBlank className="h-4 w-4" weight="fill" />
              Active Schedules
              <Badge variant="secondary" className="ml-1">
                {digestSchedules.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="logs" className="flex items-center gap-2">
              <Clock className="h-4 w-4" weight="fill" />
              Delivery Logs
              <Badge variant="secondary" className="ml-1">
                {(digestLogs || []).length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="preview" className="flex items-center gap-2">
              <Eye className="h-4 w-4" weight="fill" />
              Preview
            </TabsTrigger>
          </TabsList>

          <TabsContent value="schedules" className="flex-1 overflow-hidden">
            <ScrollArea className="h-[500px] pr-4">
              <div className="space-y-3">
                {digestSchedules.length === 0 ? (
                  <Alert>
                    <Package className="h-4 w-4" />
                    <AlertDescription>
                      No active digest schedules. Users can enable email digests in their notification preferences.
                    </AlertDescription>
                  </Alert>
                ) : (
                  digestSchedules.map((schedule) => (
                    <Card key={schedule.id} className="border-l-4 border-l-teal-500">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-base flex items-center gap-2">
                              {schedule.userName}
                              {schedule.isActive && (
                                <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-200">
                                  <CheckCircle className="w-3 h-3 mr-1" weight="fill" />
                                  Active
                                </Badge>
                              )}
                            </CardTitle>
                            <CardDescription className="text-xs mt-1">
                              {schedule.userEmail}
                            </CardDescription>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => handlePreviewDigest(schedule.userId)}>
                              <Eye className="w-4 h-4 mr-1" />
                              Preview
                            </Button>
                            <Button size="sm" variant="default" onClick={() => handleSendTestDigest(schedule.userId)}>
                              <PaperPlaneTilt className="w-4 h-4 mr-1" weight="fill" />
                              Send Now
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <div className="text-muted-foreground text-xs">Frequency</div>
                            <div className="font-medium capitalize">{schedule.frequency}</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground text-xs">Delivery Time</div>
                            <div className="font-medium">{schedule.deliveryTime}</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground text-xs">Next Scheduled</div>
                            <div className="font-medium">
                              {format(new Date(schedule.nextScheduled), 'MMM d, yyyy h:mm a')}
                            </div>
                          </div>
                          <div>
                            <div className="text-muted-foreground text-xs">Pending Notifications</div>
                            <div className="font-medium">{schedule.notificationCount}</div>
                          </div>
                        </div>
                        {schedule.lastSent && (
                          <div className="text-xs text-muted-foreground pt-2 border-t">
                            Last sent: {format(new Date(schedule.lastSent), 'MMM d, yyyy h:mm a')}
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
              <div className="space-y-2">
                {(digestLogs || []).length === 0 ? (
                  <Alert>
                    <Clock className="h-4 w-4" />
                    <AlertDescription>
                      No delivery logs yet
                    </AlertDescription>
                  </Alert>
                ) : (
                  (digestLogs || []).map((log) => (
                    <Card key={log.id} className={`border-l-4 ${log.status === 'sent' ? 'border-l-green-500' : log.status === 'failed' ? 'border-l-red-500' : 'border-l-yellow-500'}`}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="font-medium">{log.userName}</div>
                            <div className="text-sm text-muted-foreground">
                              {format(new Date(log.sentAt), 'MMM d, yyyy h:mm a')}
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <div className="text-sm font-medium">{log.notificationCount} notifications</div>
                              <Badge variant={log.status === 'sent' ? 'default' : log.status === 'failed' ? 'destructive' : 'secondary'}>
                                {log.status}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        {log.error && (
                          <div className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded">
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
            <ScrollArea className="h-[500px] pr-4">
              {previewContent ? (
                <div dangerouslySetInnerHTML={{ __html: previewContent }} />
              ) : (
                <Alert>
                  <Eye className="h-4 w-4" />
                  <AlertDescription>
                    Select a user from the Active Schedules tab to preview their digest
                  </AlertDescription>
                </Alert>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>

        <Separator className="my-4" />
        
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div>
            {lastCheckTime && `Last checked: ${format(new Date(lastCheckTime), 'h:mm a')}`}
          </div>
          <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
