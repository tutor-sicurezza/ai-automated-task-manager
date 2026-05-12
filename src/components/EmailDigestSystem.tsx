import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-are
import { Tabs, TabsContent, TabsList, TabsTrigge
import { Badge } from '@/components/ui/badge';
import { Envelope, Calendar, Clock, CheckCircle, XCircle, Eye } 
import { Task, Employee, TaskNotification, NotificationPreferences } from '@/lib
interface DigestSchedule {
  userId: string;
  userEmail: string;
  deliveryTime: string;
  nextScheduled: string;
  notificationCount: number;

interface DigestLog {
  userId: str
  notificationCou
  timestamp: string

  task_assigned: 'Task Assigned',
  task_comment: 'New Co
  task_due_soon: 'Task Due
  task_status_changed: '
};
  notificationCount: number;
  const [hours, minu
 

  }
  switch (fre
      break;
      if (deliveryD
        const daysToAdd = (n
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
        <div style="font-size: 14px; color: #718096;">${notif.message
    `).join('');

    <html>
        <title>Task 
      <body style="margin: 0; padding: 0; font-f
          ${
            <h2 sty
          </div>
            
   
  
}
i


  const [open, setO
  const [previewContent, setPreviewC

    const schedules: D
    employe
        const prefsK
        
          const notifKey = `notifications`;
          const userNotifications = allNotifications.filter(
          
    

            userEmail: employ

            nextSche
              preferences.emailSchedule.digestTime,
            ).toISOString(),
            notificationCount: 
       
      } catch (error) {
      }
    

  const handlePreviewDigest = async (userId: string) => {
    if (!employee) return;
    try {
      const preferences = await window.spark.kv.get<NotificationPreferences>(prefsKey);
      if (!preferences?.emailSchedule?.digestEnabled) {
        return;

      const allNotifications = await window.spark.kv.get<TaskNotification[]>(notifKey) || [];
        n => n.userId === userId && !n.read

        toast.info('No
      }
      const content 
        userNotification
        preferen
      
      se
    } c
    }

    const employee = employees.find(e => e.id === userId);

      const prefsKey = `notification-preferen
      
        toast.
      }
      const 
      const user
   

        re

        empl
        tasks,
      );
      const newLog: DigestLog = {
        userId: employee.id,
        notificationC
        timestamp: new Date().toISOString()


      
    } catch (error) {
    }

    <Dialog op
        <Butt
          E
    
 

          </DialogTitle>
            Manage autom
        </Dialog
 

              Schedules
            <TabsTrigger value="logs">
              Delivery Logs
            <TabsTrigger value="preview">
              Preview

          <TabsContent value="schedules" 
              {digestSchedules.length === 0
    
                  </AlertDescription>
           
                  {digestSchedules.map((schedule) => (
                      <CardHeader>
        
                            <div className="text-sm text-muted-foreground"
                          <div className="f
                              <Eye className="mr-1 h-4 w-4" weight="bold" />
                            </Button>
                              <Envelope className="m
            

                      <Car
                          <div>
                            <Bad
                            </Badge>
                          <div>
                            <div className="text-sm font-medium">
                          <div>
                            <div className="text-sm font-medium
                            </div>
                          <div>
                            <div className="text-sm
                        </div>
                    </Card>
                </div>
            </ScrollArea>

            <
         
                    No 
                </Alert>
       
       
    
                     
                  

                            <Badge variant={log.status ==
                                <CheckCircle className="mr
                          

         
                            </div>
                        </div>
      
                </div>
            </ScrollArea>

       

                    srcDoc={previewCont
                    title="Email Digest Preview"
                </div>
                <Alert>
                    Select a schedule from the Schedules tab and click Previ

            </ScrollArea>
        </Tabs>
    </Dialog>
}

































































































              Preview














                    <Card key={schedule.id}>





                          </div>









                          </div>

                      </CardHeader>





                              {schedule.frequency}

                          </div>



                          </div>



                              {format(new Date(schedule.nextScheduled), 'MMM d, yyyy h:mm a')}












            </ScrollArea>
















                          <div>












                              {log.status}




                          </div>

                      </CardContent>









              {previewContent ? (












                </Alert>

            </ScrollArea>

        </Tabs>

    </Dialog>

}
