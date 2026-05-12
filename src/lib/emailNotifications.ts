import { Task, TaskAttachment, Employee } from './types';
import { 
  convertTaskAttachmentsToEmailAttachments, 
  filterAttachmentsForEmail,
  createAttachmentListHtml,
  getAttachmentSummary,
  EmailWithAttachments,
  sendEmailWithAttachments
} from './emailAttachments';

interface EmailNotificationConfig {
  fromEmail: string;
  fromName: string;
  replyToEmail?: string;
  provider: 'sendgrid' | 'resend';
  apiKey: string;
}

interface EmailAttachmentSettings {
  includeAttachmentsInEmails: boolean;
  maxAttachmentSize: number;
  maxTotalAttachmentSize: number;
  notifyWhenAttachmentsExcluded: boolean;
}

export async function sendTaskNotificationEmail(
  task: Task,
  recipient: Employee,
  notificationType: string,
  message: string,
  actionByName?: string,
  config?: EmailNotificationConfig,
  attachmentSettings?: EmailAttachmentSettings
): Promise<{ success: boolean; error?: string }> {
  if (!config || !recipient.email) {
    return { success: false, error: 'Missing configuration or recipient email' };
  }

  try {
    const shouldIncludeAttachments = 
      attachmentSettings?.includeAttachmentsInEmails !== false &&
      task.attachments && 
      task.attachments.length > 0;

    let emailAttachments = undefined;
    let attachmentNote = '';

    if (shouldIncludeAttachments && task.attachments) {
      const filtered = filterAttachmentsForEmail(
        task.attachments,
        attachmentSettings?.maxTotalAttachmentSize || 10 * 1024 * 1024
      );

      const maxSize = attachmentSettings?.maxAttachmentSize || 5 * 1024 * 1024;
      const validAttachments = filtered.included.filter(att => att.fileSize <= maxSize);
      const oversizedAttachments = filtered.included.filter(att => att.fileSize > maxSize);
      const allExcluded = [...oversizedAttachments, ...filtered.excluded];

      if (validAttachments.length > 0) {
        emailAttachments = convertTaskAttachmentsToEmailAttachments(validAttachments);
      }

      if (allExcluded.length > 0 && attachmentSettings?.notifyWhenAttachmentsExcluded) {
        attachmentNote = `
          <div style="margin-top: 15px; padding: 12px; background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 4px;">
            <p style="margin: 0; font-size: 13px; color: #92400e;">
              ⚠️ <strong>Note:</strong> ${allExcluded.length} attachment(s) could not be included due to size limits. 
              Please view the task in TaskFlow to access all attachments.
            </p>
          </div>
        `;
      }
    }

    const emailSubject = getEmailSubject(notificationType, task, actionByName);
    const emailBody = createEmailBody(
      task, 
      recipient, 
      notificationType, 
      message, 
      actionByName,
      shouldIncludeAttachments ? task.attachments : undefined,
      attachmentNote
    );
    const emailText = createEmailText(task, notificationType, message, actionByName);

    const emailData: EmailWithAttachments = {
      to: recipient.email,
      subject: emailSubject,
      htmlContent: emailBody,
      textContent: emailText,
      from: `${config.fromName} <${config.fromEmail}>`,
      replyTo: config.replyToEmail,
      provider: config.provider,
      attachments: emailAttachments,
    };

    return await sendEmailWithAttachments(emailData, config.apiKey);
  } catch (error) {
    console.error('Failed to send task notification email:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

function getEmailSubject(
  notificationType: string, 
  task: Task, 
  actionByName?: string
): string {
  const subjects: Record<string, string> = {
    task_assigned: `New Task Assigned: ${task.title}`,
    task_reassigned: `Task Reassigned: ${task.title}`,
    task_updated: `Task Updated: ${task.title}`,
    task_comment: `New Comment on: ${task.title}`,
    task_due_soon: `Task Due Soon: ${task.title}`,
    task_overdue: `Task Overdue: ${task.title}`,
    task_completed: `Task Completed: ${task.title}`,
    task_status_changed: `Task Status Changed: ${task.title}`,
    task_priority_changed: `Task Priority Changed: ${task.title}`,
  };

  return subjects[notificationType] || `Task Notification: ${task.title}`;
}

function createEmailBody(
  task: Task,
  recipient: Employee,
  notificationType: string,
  message: string,
  actionByName?: string,
  attachments?: TaskAttachment[],
  attachmentNote?: string
): string {
  const priorityColors: Record<string, string> = {
    high: '#ef4444',
    medium: '#f59e0b',
    low: '#10b981',
  };

  const statusLabels: Record<string, string> = {
    'not-started': 'Not Started',
    'in-progress': 'In Progress',
    'completed': 'Completed',
  };

  const dueDate = new Date(task.dueDate);
  const isOverdue = dueDate < new Date() && task.status !== 'completed';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${getEmailSubject(notificationType, task, actionByName)}</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
            <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">TaskFlow</h1>
          </div>

          <div style="padding: 30px;">
            <div style="margin-bottom: 24px;">
              <h2 style="margin: 0 0 8px 0; color: #1f2937; font-size: 20px; font-weight: 600;">
                ${message}
              </h2>
              ${actionByName ? `
                <p style="margin: 0; color: #6b7280; font-size: 14px;">
                  by ${actionByName}
                </p>
              ` : ''}
            </div>

            <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin-bottom: 24px; border-left: 4px solid ${priorityColors[task.priority]};">
              <h3 style="margin: 0 0 16px 0; color: #1f2937; font-size: 18px; font-weight: 600;">
                ${task.title}
              </h3>
              
              <p style="margin: 0 0 16px 0; color: #4b5563; font-size: 14px; line-height: 1.6;">
                ${task.description || 'No description provided'}
              </p>

              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 16px;">
                <div>
                  <p style="margin: 0 0 4px 0; color: #6b7280; font-size: 12px; font-weight: 600; text-transform: uppercase;">Priority</p>
                  <span style="display: inline-block; padding: 4px 12px; background-color: ${priorityColors[task.priority]}; color: white; border-radius: 12px; font-size: 12px; font-weight: 600; text-transform: uppercase;">
                    ${task.priority}
                  </span>
                </div>
                <div>
                  <p style="margin: 0 0 4px 0; color: #6b7280; font-size: 12px; font-weight: 600; text-transform: uppercase;">Status</p>
                  <span style="display: inline-block; padding: 4px 12px; background-color: #e5e7eb; color: #1f2937; border-radius: 12px; font-size: 12px; font-weight: 600;">
                    ${statusLabels[task.status]}
                  </span>
                </div>
                <div>
                  <p style="margin: 0 0 4px 0; color: #6b7280; font-size: 12px; font-weight: 600; text-transform: uppercase;">Due Date</p>
                  <p style="margin: 0; color: ${isOverdue ? '#ef4444' : '#1f2937'}; font-size: 14px; font-weight: ${isOverdue ? '600' : '500'};">
                    ${dueDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                    ${isOverdue ? ' (Overdue!)' : ''}
                  </p>
                </div>
                <div>
                  <p style="margin: 0 0 4px 0; color: #6b7280; font-size: 12px; font-weight: 600; text-transform: uppercase;">Task ID</p>
                  <p style="margin: 0; color: #1f2937; font-size: 14px; font-weight: 500;">#${task.id.slice(0, 8)}</p>
                </div>
              </div>
            </div>

            ${attachments && attachments.length > 0 ? createAttachmentListHtml(attachments) : ''}
            
            ${attachmentNote || ''}

            <div style="margin-top: 24px; text-align: center;">
              <a href="${typeof window !== 'undefined' ? window.location.origin : ''}" 
                 style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; padding: 12px 32px; border-radius: 8px; font-weight: 600; font-size: 14px;">
                View Task in TaskFlow
              </a>
            </div>

            <div style="margin-top: 24px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 13px;">
                Hi ${recipient.name},
              </p>
              <p style="margin: 0; color: #6b7280; font-size: 13px; line-height: 1.6;">
                This notification was sent because you're assigned to this task or have notifications enabled for task updates. 
                You can manage your notification preferences in TaskFlow settings.
              </p>
            </div>
          </div>

          <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="margin: 0; color: #9ca3af; font-size: 12px;">
              © ${new Date().getFullYear()} TaskFlow. All rights reserved.
            </p>
            <p style="margin: 8px 0 0 0; color: #9ca3af; font-size: 12px;">
              Sent at ${new Date().toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}

function createEmailText(
  task: Task,
  notificationType: string,
  message: string,
  actionByName?: string
): string {
  const statusLabels: Record<string, string> = {
    'not-started': 'Not Started',
    'in-progress': 'In Progress',
    'completed': 'Completed',
  };

  return `
TaskFlow Notification

${message}
${actionByName ? `by ${actionByName}` : ''}

Task: ${task.title}
Description: ${task.description || 'No description provided'}

Details:
- Priority: ${task.priority.toUpperCase()}
- Status: ${statusLabels[task.status]}
- Due Date: ${new Date(task.dueDate).toLocaleDateString()}
- Task ID: #${task.id.slice(0, 8)}

${task.attachments && task.attachments.length > 0 ? `
Attachments: ${getAttachmentSummary(task.attachments)}
` : ''}

View this task in TaskFlow: ${typeof window !== 'undefined' ? window.location.origin : ''}

---
This notification was sent because you're assigned to this task or have notifications enabled for task updates.
You can manage your notification preferences in TaskFlow settings.

© ${new Date().getFullYear()} TaskFlow
  `.trim();
}

export async function getEmailConfig(): Promise<EmailNotificationConfig | null> {
  try {
    const config = await window.spark.kv.get<{
      apiKey: string;
      fromEmail: string;
      fromName: string;
      replyToEmail?: string;
      provider: 'sendgrid' | 'resend';
      enabled: boolean;
    }>('sendgrid-config');

    if (!config || !config.enabled || !config.apiKey) {
      return null;
    }

    return {
      apiKey: config.apiKey,
      fromEmail: config.fromEmail,
      fromName: config.fromName,
      replyToEmail: config.replyToEmail,
      provider: config.provider,
    };
  } catch (error) {
    console.error('Failed to get email config:', error);
    return null;
  }
}

export async function getEmailAttachmentSettings(): Promise<EmailAttachmentSettings> {
  try {
    const settings = await window.spark.kv.get<EmailAttachmentSettings>('email-attachment-settings');
    
    return settings || {
      includeAttachmentsInEmails: true,
      maxAttachmentSize: 5 * 1024 * 1024,
      maxTotalAttachmentSize: 10 * 1024 * 1024,
      notifyWhenAttachmentsExcluded: true,
    };
  } catch (error) {
    console.error('Failed to get email attachment settings:', error);
    return {
      includeAttachmentsInEmails: true,
      maxAttachmentSize: 5 * 1024 * 1024,
      maxTotalAttachmentSize: 10 * 1024 * 1024,
      notifyWhenAttachmentsExcluded: true,
    };
  }
}
