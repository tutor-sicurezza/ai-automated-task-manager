import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/butt
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/sep
import { Card, CardContent, CardDescription, CardHeader, 
import { EnvelopeSimple, Package, CalendarBlank, Clock
import { Employee, Task, TaskNotification, NotificationPreferences } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { EnvelopeSimple, Package, CalendarBlank, Clock, Eye, CheckCircle, PaperPlaneTilt } from '@phosphor-icons/react';

import { format } from 'date-fns';
import { Employee, Task, TaskNotification, NotificationPreferences } from '@/lib/types';

interface EmailDigestSystemProps {
  deliveryTime: string;
  tasks: Task[];
 

}
}
function getNextS
  deliveryTime: str
  lastSent?: string
  const now = new Date();
  
  nextDate.setHours(hours
  if (lastSent) {
    
      case 'daily':
        break;
}

            nextDate.
        } els
        }
      case 'biweekl
        break;
        nextDate.setMonth(la
    }
  
}

}
function generateDigestHTML(
  userName: string,
  tasks: Task[]
  const notificatio
    task_
  const now = new Date();
  const [hours, minutes] = deliveryTime.split(':').map(Number);
  
  const nextDate = new Date();
  nextDate.setHours(hours, minutes, 0, 0);
  
  if (lastSent) {
    const lastSentDate = new Date(lastSent);
    
    switch (frequency) {
      }
      return acc;

      const task = t
      
        <div style="border: 1px solid #e5e7eb; bord
          ${taskNotifs.map(notif => `
              <div style="font-size: 14px; color: #6b7280; ma
              </div>
           
              </
          `).join('')}
      `;
  } else {
      notificationsHTM
          <div style="font-size: 14px; color: #6b7280; margin-bottom: 4px;">
          </di
            ${notif.t
          <div style="font-size: 14px; color: #374151; 
            ${
     
   

  if (nextDate <= now) {
    nextDate.setDate(nextDate.getDate() + 1);
  }
  
          <h2 styl
 

      <div style="padding: 2
          This is an automated diges
      </div>
  `;

  const [op
  const [digestLogs, setDigestLogs] = useKV<DigestLog[]>('
  const [previewUser, setPreviewUser] 

    const schedules: DigestSchedule[
    employees.forEach(async (employee
      
        const prefsKey = `notif
        
          const lastSentKey = `digest-last-se
          
            preferences.emai
    

          const noti
          const userNotifications = (allNotifications || []).filter(n => n.userId === employee.id);
          schedules.push({
            userId: employee.id,
            userEmail: employee.email,
          
          
    

      } catch (error) {
  
    
  }, [employees]);
  useEffect(() => {
      const now = new Date();
      f
        
          const p
          

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
      ).slice(0, pre
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
  };
      try {
        const prefsKey = `notification-preferences-${employee.id}`;
        const preferences = await window.spark.kv.get<NotificationPreferences>(prefsKey);
    cons
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
             
        }
                       
                          </div>
       
       
    
                    <
                )}


            <ScrollArea className="h-[500px] 
                {(digestLogs 
      
                      No delivery logs ye
                  </Alert>
        
             
                          <div className="flex-1">
                            <div className="text-sm text-muted-foreground">
          
                          <div className="flex items-center gap-3">
          
                                {log.status}
                            </div>
          
                          <div className="mt-2 text-x
                          </div>
                      </CardContent>
                  ))
              </div>
          </
          
              {previewContent ? (
              ) : (
           
                    Selec
                </Alert>
         
       
      
        <div className="flex items-center 
      
    
          </Button>
      </DialogContent>
  );

































































































    const employee = employees.find(e => e.id === userId);
    if (!employee) return;

    const prefsKey = `notification-preferences-${userId}`;


    if (!preferences) return;





      n => n.userId === userId && 




      setPreviewContent('<div style="padding: 48px; text-align: center; color: #6b7280;">No notifications to preview</div>');
      return;


    const content = generateDigestHTML(





    
    setPreviewContent(content);
  };







































































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


        <Separator className="my-4" />
        
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div>
            {lastCheckTime && `Last checked: ${format(new Date(lastCheckTime), 'h:mm a')}`}
          </div>
          <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
            Close

        </div>

    </Dialog>

}
