import { useState, useMemo } from 'react';
import { useKV } from '@github/spark/hooks';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, Car
import { Separator } from '@/components/ui/separator';
import { Employee, Task, TaskNotification, NotificationPreferences } from '@/lib/types';

import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
}
interface DigestSchedule {
  userName: string;
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly';
import { toast } from 'sonner';

  isActive: boolean;
  employees: Employee[];
interface Digest
 

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
  deliveryDays?: number[],
    }
): Date {
      nextDate.setDate(ne
      acc[notif.taskId].push(notif);
  
    Object.entries(groupedByTa
      const taskTitle = task?.title || tas
  
          <h3 sty
            <div style="padding: 8px 0; bord
    
              <div style
      case 'daily':
        nextDate.setDate(lastSentDate.getDate() + 1);
        break;
      case 'weekly':
        nextDate.setDate(lastSentDate.getDate() + 7);
        break;
      case 'biweekly':
        nextDate.setDate(lastSentDate.getDate() + 14);
        break;
      case 'monthly':
        nextDate.setMonth(lastSentDate.getMonth() + 1);
        break;
    }
  return `
    if (nextDate <= now) {
      nextDate.setDate(nextDate.getDate() + 1);
    }
   
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
    

  let notificationsHTML = '';

  if (groupByTask) {
    const groupedByTask = notifications.reduce((acc, notif) => {
      if (!acc[notif.taskId]) {
        acc[notif.taskId] = [];
      }
      acc[notif.taskId].push(notif);
      return acc;
    }, {} as Record<string, TaskNotification[]>);

    ).slice(0, preferences.emailSchedule.maxNotificationsPerDigest ||
    if (userNotifications.length === 0) {
      return;

      employee.name,
      userNotifications,
    );
    setPreviewContent(content);
    setActiveTab('preview');

    const employee = employees.find(e => e.id === userId);
              </div>
      const prefsKey = `notification-preferences-${userId}`;

        toast.error('No notification preferences found for this user');
      }
      const notifK
      const userNotifi
        (!pref

       
      }
      const content = generateDigest
        tasks,
        preferences.emailSchedule.groupByTask || false

        id: `log-${Date.now()}`,
        userName
        notificationCount: userNotifications.length,
        status: 'sent',


      await window.spark.kv.set(lastSentKey, new Date().
      toast.success(`Test digest sent to ${employee.name}`);
      toast.erro
    }

    <Di
   

      </Di
        <DialogHeader>
            <Enve
          </DialogTitle>
            Manage and preview email diges
        </DialogHeader>
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} classN
            <Ta
              
            <TabsTrigger val
            
            <TabsTrigger value="preview" className="flex items-center gap-2">
              Preview
          </TabsList>
          <T
            
          
    
 

                    <Card key={schedule.id}>
                        <div className="fl
                            <CardTitle className="text-base">{schedule.userName}</CardTitle>
                          </div>
                            <Button size="sm" variant="outline" onClick={(
                              Preview
                            <Button size="sm" variant="default" onClick={() 

                          </div>
                      </CardHeader>
    
                            <div className=
                          </div>
      
           
                            <div className="text-muted-foreground t
                              {format(new Date(schedule.nextScheduled), 'MMM d, yyyy h:mm
        
                            <div className="text-muted-foreground text
                          </div>
                        {schedule.lastSent && (
          
                        )}
                    </Card>
                )}
            </ScrollArea>

            

                    <Clock className="h-4 w
                      No delivery logs yet
                  </Alert>
          
                      <Car
                          <d
                            <div
                            </div>
                          <div classNa
                              <div className="text-sm font-medium
                                {log.status}
                            </div>
                     
                          <div className="mt-2 text-xs 
                          <
                      </CardContent>
          });
         
      } catch (error) {
        console.error(`Error loading digest schedule for ${employee.name}:`, error);
      }
    });
    
    return schedules;
  }, [employees]);

  const handlePreviewDigest = async (userId: string) => {




    const preferences = await window.spark.kv.get<NotificationPreferences>(prefsKey);



    const notifKey = `notifications`;
    const allNotifications = await window.spark.kv.get<TaskNotification[]>(notifKey);
    const userNotifications = (allNotifications || []).filter(

      (!preferences.emailSchedule.includeOnlyUnread || !n.read)
    ).slice(0, preferences.emailSchedule.maxNotificationsPerDigest || 50);

    if (userNotifications.length === 0) {


    }


      employee.name,
      tasks,
      userNotifications,
      preferences.emailSchedule.groupByTask || false
    );


    setPreviewUser(userId);
    setActiveTab('preview');


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











































            </ScrollArea>



























































        </Tabs>









          </Button>

      </DialogContent>

  );

