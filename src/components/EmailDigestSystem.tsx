import { useState, useMemo } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
  userEmail: string;
  deliveryTime: string;
  notificationCount: number;


  userEmail: string;
  status: 'se
}
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

      break;
      nextDate.setDate(nextDate.g
    case 'monthly':
      break;
  
}
function generateDigestEmail(
  userEmail: string,
  tasks: Task[]
  

      <div style="padding: 12px; background: #f7fafc; border-radius: 8px; margin-bottom: 8px;">
        <div style="font-
      </div>
  }).join('');
  return `
  
      </head>
        <div style="max-width: 600px; margin:
   
  
              TaskFlow
          </div>
      </body
  `;

  employees: Employee[];
}
export function EmailDigestSystem({ employees, tasks }: E
  const [previ
  const digestSchedules = useMemo(() => {
    emp
        cons
        
          const notifKey = `notifications`;
          co
          );
          schedules.push({
            
   
  
              pref
 

        console.error('Error 
    });
    return schedules

    const emplo
    
      const prefsKey = `notification-preferences
      if (!preferences?.emailSchedule?.digestEnabled) {
        return;

      const allNotifications = await window.spark.kv.get<TaskNotification[]>(notifKey) || [];
        n => n.userId === userId && !n.read

        toast.info('No unread notifications for this user');
      
      
        userNo

      toas
      toas
  };
  const handleSendTestDigest = asy
    if (!empl
    try {
      const preferences = await window.spark.kv.get<NotificationPrefer
        toast.error('Email digest is not enabled for this user');
      }
      const notifKey = `notifications`;
      const userNotifica
      );
      const content = generateDigestEmail(
        employee.e
        tasks,

        id: `
        use
    
 

      toast.error('Failed to send 
  };
  return (
 

        </Button>
      <DialogContent className="max-w-4xl 
          <DialogTitle>Email Digest System</DialogTitle>

        </DialogHeader>
        <Tabs defaultValue="schedules" clas
            <TabsTrigger value="schedules">
           
            <TabsTrigger value="logs">
              Delivery Logs
        
              Preview
          </TabsList>
          <TabsContent value="schedules" className="space-y-4">
              {digestSchedules.length === 0 ? (
                  <AlertDescription>
            

                  {digestS
                      <CardHeader>
                          <div>
                            <div className="text-sm 
                          <div className="flex gap-2">
                              <Eye className="mr-1 h-4 w-4" wei
                            </Button>
                              <Envelope className="mr-1 h-4 w-4" we
                            </Button>
                        </di
                      <CardContent>
             
         
                       
                            <div className="text-sm text-muted-
       
       

                     
                  

                  ))}
    const employee = employees.find(e => e.id === userId);
          </TabsContent>
    
         
                  No delivery logs available yet. Logs will 
              </Alert>
          </TabsContent>
          <TabsContent value="preview" className="space-y-4">
              {
       

                  />
              ) : (
                  <AlertDescription>
                  </AlertDescription>
        

      </DialogContent>
  );

      























      }











        tasks,
      );

      const newLog: DigestLog = {

        userId: employee.id,







    } catch (error) {

    }






















              Schedules

            <TabsTrigger value="logs">

              Delivery Logs

            <TabsTrigger value="preview">

              Preview









                  </AlertDescription>



                  {digestSchedules.map((schedule) => (

                      <CardHeader>







                              <Eye className="mr-1 h-4 w-4" weight="bold" />

                            </Button>









                          <div>



                          <div>



                          <div>



                            </div>

                        </div>




                    </Card>

                </div>

            </ScrollArea>









            </ScrollArea>









                    title="Email Digest Preview"

                </div>

                <Alert>



                </Alert>

            </ScrollArea>

        </Tabs>

    </Dialog>

}
