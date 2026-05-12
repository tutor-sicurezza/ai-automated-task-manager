import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogDescri
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-are
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';

  id: string;
  userName: string;
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly';
  deliveryDays?: number[];
  nextScheduled: string;
  notificationCount: number;

  id: string;
  userName: s
  notificationCou
  status: 'sent' | 
}
const notificationTypeLabels: Record<string, string> = {
  task_reassigned: 'Tas
  task_comment: 'New Comme
  task_overdue: 'Ove
  task_status_changed: '
  mention: 'Mentione

 

  const now = new Dat
  const nextD
  nextDate.setHou
  if (nextDate <= n
  }
  switch (frequency) {
      break;
      if (deliveryDays && deliveryDays.l
        const nex
 

      nextDate.setDate(nextDate.getDate() + 14);
    case 'monthly':
      break;
  
}
function generateDigestHTML(
  tasks: Task[],
  groupByTask: boolean
  const greeting = `
      <h1 style="color: white; margin: 0; fo
    </div>


    const groupedByTask = noti
        acc[notif.taskId] = [];
      acc[notif.taskId]
    }, {} as Record<strin
    Objec
      const taskTitle = t
      notificationsHTML += `
          <h3 style="background: 
  
            ${notifs.map(notif => `
  
                </div>
              </div>
   
  
  } else {
      <div style=
          <s
          </span>
        </div>
      </div>
  }
  return `
    <html>
       
        <tit
      <body style="m
          <div style="background: white; border-
            
                You
              ${notificationsHTML}
            
   
  
        </div>
 

interface EmailDigestSystemP
  tasks: Task[];

  const [open, setOpen] = useState(f
  const [digestLogs, s
  const [pr
  const digestSchedu
    
      try {
        const preferences = await window.spark.kv.get<NotificationPreferences>(prefsKey);
        if
    

          const userNotificat

            preferen
          );
          schedules.push({
            userId: employee.id
       
            deliveryTime: preference
            lastS
            isActive: preferences.emailSchedule.d

      } catch (error) {
      }
    
  }, [
  const handlePreviewDigest 
    if (!employee) return;
    try {
      const preferences 
      if (!pref
        return;

      const allNotifications = await window.spark.kv.get<TaskNotification[]>(not
        n => n.userId === userId && 
      ).slice(0, preferences.emailSchedule.maxNotificationsPerDigest 
      if (userNotifica
        return;

        employee.name,
        userNoti
      );
      se
      s
      toas
    }

    const employee = employees.find(e => e.id === userId);

      const prefsKey = `notification-preferences-${userId}`;

        toast.error('No notification preferences found for this user');
      }
      const notifKey = `notifications`;
      const 
        (!prefer


      }
      const content
        ta
        pref

        id: `log-${Date.now()}`,
        userName: employee.name,
        notif
        status: 'sent',


      await window.spar
      toast.success(`Test digest sent to
      toast.error('Failed to send test digest');
    }

    <Dialog open={open} onOpenChan
        <Button va
          Email Digests
      </DialogTrigger>
        <DialogHeader>
            <Envel
          </Dialog
            Mana
        </Dial
        <Tabs
           
    
 

            <TabsTrigger value="pr
              Preview
          </Tabs
 

                  <Alert>
                    <AlertDescription>
                    </AlertDescription>
                ) : (
                    <Card key={schedule.id}>
                        <div className="flex items-start just

                          </div>
                            <Button size="s
    
                            <Button size="s
           
                          </div>
                      </CardHeader>
        
        if (preferences?.emailSchedule?.digestEnabled && employee.email) {
                              {schedule.frequency}
                          </div>
          
                          </div>
                            <div className="text-muted-foreground mb-1">Next Scheduled</div
                              {format(new Date(schedule.nextScheduled), 'MMM d, yyyy h:mm a')}
          
                            <div className="text-mute
            preferences.emailSchedule.digestFrequency,
            preferences.emailSchedule.digestTime,
            preferences.emailSchedule.digestDays
            
          
                    </Card
                )}
            </ScrollArea>

            <ScrollArea className="h-[
            frequency: preferences.emailSchedule.digestFrequency,
            deliveryTime: preferences.emailSchedule.digestTime,
            deliveryDays: preferences.emailSchedule.digestDays,
                  </Alert>
                  (digestLogs || []).map((log) => (
            isActive: preferences.emailSchedule.digestEnabled,
                          <div>
             
         
                       
                              {log.status}
       
       
    
                     
                  

                          </div>
                      </CardContent>
                  ))

         
          <TabsContent value="preview" className="flex-1 ove
              {previewContent ? (

                  </div>
                    className="bg-white"
               
       

                    Select a schedule f
                </Alert>
            </ScrollArea>
        </Tabs>
    </Dialog>
}






























































































































































































































































