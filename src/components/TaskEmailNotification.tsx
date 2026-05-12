import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Paperclip, PaperPlaneTilt, CheckCircle, XCircle, Info } from '@phosphor-icons/react';
import { Task, Employee } from '@/lib/types';
import { sendTaskNotificationEmail, getEmailConfig, getEmailAttachmentSettings } from '@/lib/emailNotifications';
import { getAttachmentSummary } from '@/lib/emailAttachments';
import { toast } from 'sonner';

interface TaskEmailNotificationProps {
  task: Task;
  recipient: Employee;
}

export function TaskEmailNotification({ task, recipient }: TaskEmailNotificationProps) {
  const [open, setOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ success: boolean; error?: string } | null>(null);
  const [notificationType] = useState('task_assigned');
  const [message, setMessage] = useState('You have been assigned a new task');

  const handleSendEmail = async () => {
    if (!recipient.email) {
      toast.error('Recipient does not have an email address');
      return;
    }

    setSending(true);
    setResult(null);

    try {
      const config = await getEmailConfig();
      if (!config) {
        toast.error('Email service is not configured. Please configure it in Super Admin Settings.');
        setSending(false);
        return;
      }

      const attachmentSettings = await getEmailAttachmentSettings();

      const sendResult = await sendTaskNotificationEmail(
        task,
        recipient,
        notificationType,
        message,
        undefined,
        config,
        attachmentSettings
      );

      setResult(sendResult);

      if (sendResult.success) {
        toast.success('Email notification sent successfully!');
      } else {
        toast.error(`Failed to send email: ${sendResult.error || 'Unknown error'}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setResult({ success: false, error: errorMessage });
      toast.error(`Failed to send email: ${errorMessage}`);
    } finally {
      setSending(false);
    }
  };

  const hasAttachments = task.attachments && task.attachments.length > 0;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <PaperPlaneTilt className="mr-2 h-4 w-4" />
          Send Email Notification
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PaperPlaneTilt className="h-5 w-5" />
            Send Task Email Notification
          </DialogTitle>
          <DialogDescription>
            Send an email notification with task details and attachments
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Task Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-xs text-muted-foreground">Title</Label>
                <p className="text-sm font-medium">{task.title}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Description</Label>
                <p className="text-sm">{task.description || 'No description'}</p>
              </div>
              <div className="flex gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Priority</Label>
                  <Badge variant="secondary" className="mt-1">
                    {task.priority}
                  </Badge>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Status</Label>
                  <Badge variant="outline" className="mt-1">
                    {task.status}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {hasAttachments && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Paperclip className="h-4 w-4" />
                  Attachments ({task.attachments!.length})
                </CardTitle>
                <CardDescription>
                  {getAttachmentSummary(task.attachments!)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="max-h-[200px]">
                  <div className="space-y-2">
                    {task.attachments!.map((att) => (
                      <div
                        key={att.id}
                        className="flex items-center justify-between p-2 rounded-md bg-muted/50"
                      >
                        <div className="flex items-center gap-2">
                          <Paperclip className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">{att.fileName}</p>
                            <p className="text-xs text-muted-foreground">
                              {(att.fileSize / 1024).toFixed(1)} KB
                            </p>
                          </div>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {att.fileType.split('/')[1] || 'file'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                <Alert className="mt-4">
                  <Info className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    Attachments will be included in the email based on your attachment settings. 
                    Large files may be excluded to comply with email size limits.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recipient</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-xs text-muted-foreground">Name</Label>
                <p className="text-sm font-medium">{recipient.name}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Email</Label>
                <p className="text-sm">{recipient.email || 'No email address'}</p>
              </div>
              {!recipient.email && (
                <Alert>
                  <XCircle className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    This recipient does not have an email address. Please add one in User Management.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Email Message</CardTitle>
            </CardHeader>
            <CardContent>
              <Label htmlFor="message">Custom Message</Label>
              <Input
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Enter custom message"
                className="mt-2"
              />
            </CardContent>
          </Card>

          {result && (
            <Alert variant={result.success ? 'default' : 'destructive'}>
              {result.success ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <XCircle className="h-4 w-4" />
              )}
              <AlertDescription>
                {result.success
                  ? 'Email sent successfully! The recipient will receive the notification with all eligible attachments.'
                  : `Failed to send email: ${result.error}`}
              </AlertDescription>
            </Alert>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Close
          </Button>
          <Button
            onClick={handleSendEmail}
            disabled={sending || !recipient.email}
          >
            {sending ? (
              <>Sending...</>
            ) : (
              <>
                <PaperPlaneTilt className="mr-2 h-4 w-4" />
                Send Email
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
