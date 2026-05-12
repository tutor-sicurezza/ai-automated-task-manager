import { useState, useEffect, useMemo } from 'react';
import { useKV } from '@github/spark/hooks';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';

  employees: Employee[];
}
interface DigestSchedule {
  userId: string;

  deliveryTime: string;
  employees: Employee[];
  isActive: bool
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
)

interface DigestLog {
  id: string;
  userId: string;
  userName: string;
  sentAt: string;
  notificationCount: number;
  status: 'sent' | 'failed' | 'pending';
  error?: string;
 

function getNextScheduledDate(
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly',
  deliveryTime: string,
  deliveryDays: number[],
  lastSent?: string
): Date {
  const notificationTypeL
    task_reassigned: '🔄 Task Reassigned',
  
    task_overdue: '⚠️ Overdue',
    task_status_changed: '🔄 Status Change
  

    <div style="background: linear-gradient(1
   
  
  `;
  let notificationsHTML = '';
  if
      if (!acc[notif.tas
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

          const lastSent = await window.spark.kv.get<
          const nextScheduled = ge
            preferences.emailSchedule.digestTime,
            lastSent
        
            id: 
            userName: employee.name,
            frequency: preferences.emailSchedule.digestFrequency,
            deliveryDays: 
            nextS
            notificationCount: user
        } catch (error) {
        }
      
    };
    loadDigestSchedules()

    const checkAndSendDigests = async () => {
      
        if (!employee.
        try {
          const preferences = awai
          if (!prefe
          const lastSentKey = `digest-la
          
            preferences.emailSchedule.digest
            preferences.
          );
              </div>
          }
          consol
      }
      se
    
    checkA
    return () => clearInterval(interval);

    userId: string,
    userEmail: string,
  ) => {
      const notif
      
        n => n.userId === userId && 
      ).slice(0, 
      if (user
          id: `log-${Date.now()}-${userId}`,
          userName,
          not
        };
        setDigestLogs((cur
        cons
        
      }
      const htmlContent = generateDi
        userName
        tasks
      
        id: `log
   

      };
      setDigestLogs((currentLogs) => [log, ...(currentLogs || [])].slice(0, 100));
      const lastSentKey = `digest-last-sent-${userId}`;
      
    } catc
        id: `log-${Date.now()}-${userId}`,
        userName,
        no
        er
    

    }

    const employe
      toast.error('Employee email 
    }
    const prefsKey = `notification-preferences-${userId}`;
    
      toast.error('Notification preferences not found');
    }
    await sendDigest(userId, employee.name, employee.email, prefe

    setPreview
  };
  const handleToggleUserForT
      const 
        newSet.
        ne
    
 

    setSelectedUsersForTest(new Set(allUserIds));

    setSelectedUsersForTest(new Set());

    if (selectedUsersForTest.size === 0) {
      return;

    let successCount = 0;

    
        successCount++;
        failCount++;
    }
    setIsSe

      toast.success(`Successfully sent ${successCount} test digest${successCo
      to
  };
  const handleSendToCustomEmail = async () => {
      toas
    }
    if (!previewUser) {
      return;

    if (!employee) {
      return;

    const preferences = await window.spark.kv.get<NotificationPref
    if (!preferences) {
      return;

    
      const notifKey = `notifications`;
      
        n => n.u
      ).slice(
      const htmlContent = gene
        employee.name,
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
            });
          });
        });
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
  };

  const previewDigestContent = useMemo(async () => {
    if (!previewUser) return null;
    
    const employee = employees.find(e => e.id === previewUser);
    if (!employee) return null;
    
    const prefsKey = `notification-preferences-${previewUser}`;
    const preferences = await window.spark.kv.get<NotificationPreferences>(prefsKey);
    
    if (!preferences) return null;
    
    const notifKey = `notifications`;
    const allNotifications = await window.spark.kv.get<TaskNotification[]>(notifKey);
    
    const userNotifications = (allNotifications || []).filter(
      n => n.userId === previewUser && 
      (preferences.emailSchedule.includeOnlyUnread ? !n.read : true)
    ).slice(0, preferences.emailSchedule.maxNotificationsPerDigest);
    
    if (userNotifications.length === 0) {
      return '<div style="padding: 48px; text-align: center; color: #6b7280;">No notifications to preview</div>';
    }
    
    return generateDigestHTML(
      userNotifications,
      employee.name,
      preferences.emailSchedule.groupByTask,
      tasks
    );
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
                          Send to {schedule.userName}
                      ))}
                        <p className="text-sm t
                        </p>
                    </div>
                </Card>
            </ScrollArea>
        </Tabs>
        <div className="flex items-ce
            Last checked: {format(n
          <Button variant="outline" onClick={()
          </Button>
      </DialogContent>
  );






























































































































































































