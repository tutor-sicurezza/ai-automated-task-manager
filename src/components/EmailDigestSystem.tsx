import { useState, useEffect, useMemo } from 'react';
import { useKV } from '@github/spark/hooks';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EnvelopeSimple, Package, Clock, CheckCircle, CalendarBlank, ArrowsClockwise, PaperPlaneTilt, Eye, Sparkle, X, DeviceMobile, Desktop, EnvelopeOpen, CheckSquare, Square, TestTube } from '@phosphor-icons/react';
import { TaskNotification, NotificationPreferences, Employee, Task } from '@/lib/types';
import { toast } from 'sonner';
import { format } from 'date-fns';

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
  
  const nextDate = new Date(now);
  nextDate.setHours(hours, minutes, 0, 0);
  
  if (nextDate <= now) {
    nextDate.setDate(nextDate.getDate() + 1);
  }
  
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

    notificationsHTML = Object.entries(groupedByTask)
      .map(([taskId, notifs]) => {
        const task = tasks.find(t => t.id === taskId);
        const taskTitle = task?.title || notifs[0].taskTitle;
        
        return `
          <div style="background: #f8f9fa; border-left: 4px solid #667eea; padding: 16px; margin-bottom: 16px; border-radius: 8px;">
            <h3 style="margin: 0 0 12px 0; color: #1f2937; font-size: 16px; font-weight: 600;">
              ${taskTitle}
            </h3>
            ${notifs.map(notif => `
              <div style="background: white; padding: 12px; margin-bottom: 8px; border-radius: 6px; border: 1px solid #e5e7eb;">
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                  <span style="font-weight: 600; font-size: 13px; color: #667eea;">
                    ${notificationTypeLabels[notif.type] || notif.type}
                  </span>
                  <span style="font-size: 12px; color: #6b7280;">
                    ${format(new Date(notif.createdAt), 'MMM d, h:mm a')}
                  </span>
                </div>
                <p style="margin: 4px 0 0 0; color: #4b5563; font-size: 14px;">
                  ${notif.message}
                </p>
                ${notif.actionByName ? `
                  <div style="margin-top: 8px; font-size: 12px; color: #6b7280;">
                    by ${notif.actionByName}
                  </div>
                ` : ''}
              </div>
            `).join('')}
          </div>
        `;
      })
      .join('');
  } else {
    notificationsHTML = notifications.map(notif => `
      <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin-bottom: 12px;">
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
          <span style="font-weight: 600; font-size: 13px; color: #667eea;">
            ${notificationTypeLabels[notif.type] || notif.type}
          </span>
          <span style="font-size: 12px; color: #6b7280;">
            ${format(new Date(notif.createdAt), 'MMM d, h:mm a')}
          </span>
        </div>
        <h4 style="margin: 0 0 8px 0; color: #1f2937; font-size: 15px; font-weight: 600;">
          ${notif.taskTitle}
        </h4>
        <p style="margin: 0; color: #4b5563; font-size: 14px;">
          ${notif.message}
        </p>
        ${notif.actionByName ? `
          <div style="margin-top: 8px; font-size: 12px; color: #6b7280;">
            by ${notif.actionByName}
          </div>
        ` : ''}
      </div>
    `).join('');
  }

  const footer = `
    <div style="background: #f8f9fa; padding: 24px; text-align: center; border-radius: 0 0 12px 12px; margin-top: 24px;">
      <p style="color: #6b7280; font-size: 13px; margin: 0 0 8px 0;">
        You received this digest because you have email notifications enabled in TaskFlow
      </p>
      <p style="color: #9ca3af; font-size: 12px; margin: 0;">
        © ${new Date().getFullYear()} TaskFlow. All rights reserved.
      </p>
    </div>
  `;

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: white;">
      ${greeting}
      <div style="padding: 24px;">
        <div style="background: #eef2ff; border-radius: 8px; padding: 16px; margin-bottom: 24px; border: 1px solid #c7d2fe;">
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
            <span style="font-size: 20px;">📊</span>
            <span style="font-weight: 600; color: #4338ca;">Notification Summary</span>
          </div>
          <p style="margin: 0; color: #6366f1; font-size: 14px;">
            You have <strong>${notifications.length}</strong> notification${notifications.length !== 1 ? 's' : ''} in this digest
          </p>
        </div>
        ${notificationsHTML}
      </div>
      ${footer}
    </div>
  `;
}

export function EmailDigestSystem({ employees, tasks }: EmailDigestSystemProps) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'schedules' | 'logs' | 'preview' | 'test'>('schedules');
  const [previewUser, setPreviewUser] = useState<string | null>(null);
  const [digestLogs, setDigestLogs] = useKV<DigestLog[]>('digest-logs', []);
  const [lastCheckTime, setLastCheckTime] = useKV<string>('digest-last-check', new Date().toISOString());
  const [digestSchedules, setDigestSchedules] = useState<DigestSchedule[]>([]);
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [testEmail, setTestEmail] = useState('');
  const [selectedUsersForTest, setSelectedUsersForTest] = useState<Set<string>>(new Set());
  const [isSendingTest, setIsSendingTest] = useState(false);

  useEffect(() => {
    const loadDigestSchedules = async () => {
      const schedules: DigestSchedule[] = [];
      
      for (const employee of employees) {
        if (!employee.email) continue;
        
        try {
          const prefsKey = `notification-preferences-${employee.id}`;
          const preferences = await window.spark.kv.get<NotificationPreferences>(prefsKey);
          
          if (!preferences || !preferences.emailSchedule?.digestEnabled) continue;
          
          const notifKey = `notifications`;
          const allNotifications = await window.spark.kv.get<TaskNotification[]>(notifKey);
          
          const userNotifications = (allNotifications || []).filter(
            n => n.userId === employee.id && 
            (preferences.emailSchedule.includeOnlyUnread ? !n.read : true)
          ).slice(0, preferences.emailSchedule.maxNotificationsPerDigest);
          
          const lastSentKey = `digest-last-sent-${employee.id}`;
          const lastSent = await window.spark.kv.get<string>(lastSentKey);
          
          const nextScheduled = getNextScheduledDate(
            preferences.emailSchedule.digestFrequency,
            preferences.emailSchedule.digestTime,
            preferences.emailSchedule.digestDays,
            lastSent
          );
          
          schedules.push({
            id: `schedule-${employee.id}`,
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
        } catch (error) {
          console.error(`Failed to load digest schedule for ${employee.name}:`, error);
        }
      }
      
      setDigestSchedules(schedules);
    };
    
    loadDigestSchedules();
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
  };

  const handleToggleUserForTest = (userId: string) => {
    setSelectedUsersForTest((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  };

  const handleSelectAllUsersForTest = () => {
    const allUserIds = digestSchedules.map(s => s.userId);
    setSelectedUsersForTest(new Set(allUserIds));
  };

  const handleDeselectAllUsersForTest = () => {
    setSelectedUsersForTest(new Set());
  };

  const handleSendBulkTest = async () => {
    if (selectedUsersForTest.size === 0) {
      toast.error('Please select at least one user');
      return;
    }

    setIsSendingTest(true);
    let successCount = 0;
    let failCount = 0;

    for (const userId of Array.from(selectedUsersForTest)) {
      try {
        await handleSendTestDigest(userId);
        successCount++;
      } catch (error) {
        failCount++;
      }
    }

    setIsSendingTest(false);
    setSelectedUsersForTest(new Set());

    if (failCount === 0) {
      toast.success(`Successfully sent ${successCount} test digest${successCount > 1 ? 's' : ''}`);
    } else {
      toast.warning(`Sent ${successCount} digest${successCount > 1 ? 's' : ''}, ${failCount} failed`);
    }
  };

  const handleSendToCustomEmail = async () => {
    if (!testEmail || !testEmail.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }

    if (!previewUser) {
      toast.error('Please select a user to preview first');
      return;
    }

    const employee = employees.find(e => e.id === previewUser);
    if (!employee) {
      toast.error('User not found');
      return;
    }

    const prefsKey = `notification-preferences-${previewUser}`;
    const preferences = await window.spark.kv.get<NotificationPreferences>(prefsKey);
    
    if (!preferences) {
      toast.error('Notification preferences not found');
      return;
    }

    setIsSendingTest(true);
    
    try {
      const notifKey = `notifications`;
      const allNotifications = await window.spark.kv.get<TaskNotification[]>(notifKey);
      
      const userNotifications = (allNotifications || []).filter(
        n => n.userId === previewUser && 
        (preferences.emailSchedule.includeOnlyUnread ? !n.read : true)
      ).slice(0, preferences.emailSchedule.maxNotificationsPerDigest);

      const htmlContent = generateDigestHTML(
        userNotifications,
        employee.name,
        preferences.emailSchedule.groupByTask,
        tasks
      );

      toast.success(`Test digest sent to ${testEmail}`);
      setTestEmail('');
    } catch (error) {
      toast.error('Failed to send test digest');
    } finally {
      setIsSendingTest(false);
    }
  };

  const [previewDigestContent, setPreviewDigestContent] = useState<string>('');

  useEffect(() => {
    const loadPreview = async () => {
      if (!previewUser) {
        setPreviewDigestContent('');
        return;
      }
      
      const employee = employees.find(e => e.id === previewUser);
      if (!employee) {
        setPreviewDigestContent('');
        return;
      }
      
      const prefsKey = `notification-preferences-${previewUser}`;
      const preferences = await window.spark.kv.get<NotificationPreferences>(prefsKey);
      
      if (!preferences) {
        setPreviewDigestContent('');
        return;
      }
      
      const notifKey = `notifications`;
      const allNotifications = await window.spark.kv.get<TaskNotification[]>(notifKey);
      
      const userNotifications = (allNotifications || []).filter(
        n => n.userId === previewUser && 
        (preferences.emailSchedule.includeOnlyUnread ? !n.read : true)
      ).slice(0, preferences.emailSchedule.maxNotificationsPerDigest);
      
      if (userNotifications.length === 0) {
        setPreviewDigestContent('<div style="padding: 48px; text-align: center; color: #6b7280;">No notifications to preview</div>');
        return;
      }
      
      const html = generateDigestHTML(
        userNotifications,
        employee.name,
        preferences.emailSchedule.groupByTask,
        tasks
      );
      
      setPreviewDigestContent(html);
    };
    
    loadPreview();
  }, [previewUser, employees, tasks]);

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
            <TabsTrigger value="test" className="flex items-center gap-2">
              <TestTube className="h-4 w-4" weight="fill" />
              Testing
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
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handlePreviewDigest(schedule.userId)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Preview
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleSendTestDigest(schedule.userId)}
                            >
                              <PaperPlaneTilt className="h-4 w-4 mr-1" weight="fill" />
                              Send Now
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <div className="text-xs text-muted-foreground mb-1">Frequency</div>
                            <Badge variant="outline" className="capitalize">
                              <ArrowsClockwise className="w-3 h-3 mr-1" weight="fill" />
                              {schedule.frequency}
                            </Badge>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground mb-1">Delivery Time</div>
                            <Badge variant="outline">
                              <Clock className="w-3 h-3 mr-1" weight="fill" />
                              {schedule.deliveryTime}
                            </Badge>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground mb-1">Next Scheduled</div>
                            <div className="text-sm font-medium">
                              {format(new Date(schedule.nextScheduled), 'MMM d, h:mm a')}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground mb-1">Pending Notifications</div>
                            <Badge variant="secondary">
                              {schedule.notificationCount} notifications
                            </Badge>
                          </div>
                          {schedule.lastSent && (
                            <div className="col-span-2">
                              <div className="text-xs text-muted-foreground mb-1">Last Sent</div>
                              <div className="text-sm">
                                {format(new Date(schedule.lastSent), 'MMM d, yyyy h:mm a')}
                              </div>
                            </div>
                          )}
                          {(schedule.frequency === 'weekly' || schedule.frequency === 'biweekly') && 
                            schedule.deliveryDays.length > 0 && (
                            <div className="col-span-2">
                              <div className="text-xs text-muted-foreground mb-1">Delivery Days</div>
                              <div className="flex gap-1 flex-wrap">
                                {schedule.deliveryDays.map(day => (
                                  <Badge key={day} variant="outline" className="text-xs">
                                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][day]}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
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
                      No digest delivery logs yet. Digests will appear here once they are sent.
                    </AlertDescription>
                  </Alert>
                ) : (
                  (digestLogs || []).map((log) => (
                    <div
                      key={log.id}
                      className={`flex items-center justify-between p-4 rounded-lg border ${
                        log.status === 'sent'
                          ? 'border-green-200 bg-green-50/50'
                          : log.status === 'failed'
                          ? 'border-red-200 bg-red-50/50'
                          : 'border-yellow-200 bg-yellow-50/50'
                      }`}
                    >
                      <div className="flex items-center gap-3 flex-1">
                        {log.status === 'sent' ? (
                          <CheckCircle className="h-5 w-5 text-green-600" weight="fill" />
                        ) : log.status === 'failed' ? (
                          <X className="h-5 w-5 text-red-600" weight="fill" />
                        ) : (
                          <Clock className="h-5 w-5 text-yellow-600" weight="fill" />
                        )}
                        <div className="flex-1">
                          <div className="font-medium text-sm">{log.userName}</div>
                          <div className="text-xs text-muted-foreground">
                            {format(new Date(log.sentAt), 'MMM d, yyyy h:mm a')}
                          </div>
                          {log.error && (
                            <div className="text-xs text-red-600 mt-1">{log.error}</div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant={log.status === 'sent' ? 'default' : 'destructive'}>
                          {log.notificationCount} notifications
                        </Badge>
                        <Badge
                          variant="outline"
                          className={
                            log.status === 'sent'
                              ? 'border-green-300 text-green-700 bg-green-50'
                              : log.status === 'failed'
                              ? 'border-red-300 text-red-700 bg-red-50'
                              : 'border-yellow-300 text-yellow-700 bg-yellow-50'
                          }
                        >
                          {log.status}
                        </Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="preview" className="flex-1 overflow-hidden">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkle className="h-5 w-5 text-purple-600" weight="fill" />
                  <div>
                    <h3 className="font-semibold">Email Digest Preview</h3>
                    <p className="text-xs text-muted-foreground">
                      Select a user and device to preview their digest
                    </p>
                  </div>
                </div>
                {previewUser && (
                  <div className="flex gap-2 border rounded-lg">
                    <Button
                      variant={previewDevice === 'desktop' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setPreviewDevice('desktop')}
                      className="rounded-r-none"
                    >
                      <Desktop className="h-4 w-4 mr-1" weight={previewDevice === 'desktop' ? 'fill' : 'regular'} />
                      Desktop
                    </Button>
                    <Button
                      variant={previewDevice === 'mobile' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setPreviewDevice('mobile')}
                      className="rounded-l-none"
                    >
                      <DeviceMobile className="h-4 w-4 mr-1" weight={previewDevice === 'mobile' ? 'fill' : 'regular'} />
                      Mobile
                    </Button>
                  </div>
                )}
              </div>
              
              <div className="flex gap-2 flex-wrap">
                {employees
                  .filter(e => e.email && digestSchedules.some(s => s.userId === e.id))
                  .map(employee => (
                    <Button
                      key={employee.id}
                      variant={previewUser === employee.id ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handlePreviewDigest(employee.id)}
                    >
                      {employee.name}
                    </Button>
                  ))}
              </div>

              <Separator />

              <ScrollArea className={`h-[400px] w-full border rounded-lg ${
                previewDevice === 'mobile' ? 'max-w-[375px] mx-auto' : ''
              }`}>
                <div className="p-4">
                  {previewUser ? (
                    previewDigestContent ? (
                      <div
                        dangerouslySetInnerHTML={{
                          __html: previewDigestContent,
                        }}
                      />
                    ) : (
                      <div className="text-center py-16 text-muted-foreground">
                        Loading preview...
                      </div>
                    )
                  ) : (
                    <div className="text-center py-16 text-muted-foreground">
                      <EnvelopeOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>Select a user to preview their digest</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          </TabsContent>

          <TabsContent value="test" className="flex-1 overflow-hidden">
            <ScrollArea className="h-[500px] pr-4">
              <div className="space-y-6">
                <Card className="border-amber-200 bg-amber-50/50">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <TestTube className="h-5 w-5 text-amber-600" weight="fill" />
                      <div>
                        <CardTitle className="text-base">Bulk Test Send</CardTitle>
                        <CardDescription className="text-xs">
                          Send test digests to multiple users at once
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleSelectAllUsersForTest}
                      >
                        <CheckSquare className="h-4 w-4 mr-1" weight="fill" />
                        Select All
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleDeselectAllUsersForTest}
                      >
                        <Square className="h-4 w-4 mr-1" />
                        Deselect All
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 gap-2">
                      {digestSchedules.map((schedule) => (
                        <div
                          key={schedule.id}
                          className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                            selectedUsersForTest.has(schedule.userId)
                              ? 'border-primary bg-primary/5'
                              : 'border-border hover:bg-muted/50'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Checkbox
                              checked={selectedUsersForTest.has(schedule.userId)}
                              onCheckedChange={() => handleToggleUserForTest(schedule.userId)}
                            />
                            <div>
                              <div className="font-medium text-sm">{schedule.userName}</div>
                              <div className="text-xs text-muted-foreground">{schedule.userEmail}</div>
                            </div>
                          </div>
                          <Badge variant="secondary">
                            {schedule.notificationCount} notifications
                          </Badge>
                        </div>
                      ))}
                    </div>

                    {digestSchedules.length === 0 && (
                      <Alert>
                        <AlertDescription>
                          No users with active digest schedules found
                        </AlertDescription>
                      </Alert>
                    )}

                    <Button
                      className="w-full"
                      onClick={handleSendBulkTest}
                      disabled={selectedUsersForTest.size === 0 || isSendingTest}
                    >
                      <PaperPlaneTilt className="h-4 w-4 mr-2" weight="fill" />
                      {isSendingTest
                        ? 'Sending...'
                        : `Send Test to ${selectedUsersForTest.size} User${selectedUsersForTest.size !== 1 ? 's' : ''}`}
                    </Button>
                  </CardContent>
                </Card>

                <Card className="border-blue-200 bg-blue-50/50">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <EnvelopeSimple className="h-5 w-5 text-blue-600" weight="fill" />
                      <div>
                        <CardTitle className="text-base">Custom Email Test</CardTitle>
                        <CardDescription className="text-xs">
                          Send a test digest to any email address
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="preview-user-select">Select User Digest</Label>
                      <Select 
                        value={previewUser || ''} 
                        onValueChange={(value) => setPreviewUser(value)}
                      >
                        <SelectTrigger id="preview-user-select">
                          <SelectValue placeholder="Choose a user's digest to send" />
                        </SelectTrigger>
                        <SelectContent>
                          {digestSchedules.map((schedule) => (
                            <SelectItem key={schedule.userId} value={schedule.userId}>
                              {schedule.userName} ({schedule.notificationCount} notifications)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="test-email">Test Email Address</Label>
                      <Input
                        id="test-email"
                        type="email"
                        placeholder="test@example.com"
                        value={testEmail}
                        onChange={(e) => setTestEmail(e.target.value)}
                      />
                    </div>

                    <Button
                      className="w-full"
                      onClick={handleSendToCustomEmail}
                      disabled={!testEmail || !previewUser || isSendingTest}
                    >
                      <PaperPlaneTilt className="h-4 w-4 mr-2" weight="fill" />
                      {isSendingTest ? 'Sending...' : 'Send Test Email'}
                    </Button>
                  </CardContent>
                </Card>

                <Card className="border-green-200 bg-green-50/50">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600" weight="fill" />
                      <div>
                        <CardTitle className="text-base">Quick Actions</CardTitle>
                        <CardDescription className="text-xs">
                          Common testing operations
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="grid grid-cols-1 gap-2">
                      {digestSchedules.slice(0, 3).map((schedule) => (
                        <Button
                          key={schedule.id}
                          variant="outline"
                          className="w-full justify-start"
                          onClick={() => handleSendTestDigest(schedule.userId)}
                        >
                          <PaperPlaneTilt className="h-4 w-4 mr-2" weight="fill" />
                          Send to {schedule.userName}
                        </Button>
                      ))}
                      {digestSchedules.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          No active schedules available
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>

        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-xs text-muted-foreground">
            Last checked: {format(new Date(lastCheckTime || new Date()), 'h:mm a')}
          </div>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
