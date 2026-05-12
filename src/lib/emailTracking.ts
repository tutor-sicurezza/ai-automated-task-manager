import { EmailDeliveryLog, EmailClickEvent, NotificationType } from './types';

export async function logEmailDelivery(
  userId: string,
  userName: string,
  userEmail: string | undefined,
  emailType: NotificationType | 'digest',
  subject: string,
  status: 'sent' | 'failed' | 'pending' | 'bounced' = 'sent',
  error?: string
): Promise<void> {
  try {
    const logsKey = 'email-delivery-logs';
    const existingLogs = await window.spark.kv.get<EmailDeliveryLog[]>(logsKey) || [];
    
    const newLog: EmailDeliveryLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId,
      userName,
      userEmail,
      emailType,
      subject,
      sentAt: new Date().toISOString(),
      status,
      error,
      openCount: 0,
      clicks: [],
    };
    
    await window.spark.kv.set(logsKey, [...existingLogs, newLog]);
  } catch (error) {
    console.error('Failed to log email delivery:', error);
  }
}

export async function trackEmailOpen(
  emailLogId: string,
  deviceType?: 'desktop' | 'mobile' | 'tablet' | 'unknown',
  userAgent?: string,
  ipAddress?: string
): Promise<void> {
  try {
    const logsKey = 'email-delivery-logs';
    const logs = await window.spark.kv.get<EmailDeliveryLog[]>(logsKey) || [];
    
    const updatedLogs = logs.map(log => {
      if (log.id === emailLogId) {
        return {
          ...log,
          openedAt: log.openedAt || new Date().toISOString(),
          openCount: log.openCount + 1,
          deviceType: deviceType || log.deviceType,
          userAgent: userAgent || log.userAgent,
          ipAddress: ipAddress || log.ipAddress,
        };
      }
      return log;
    });
    
    await window.spark.kv.set(logsKey, updatedLogs);
  } catch (error) {
    console.error('Failed to track email open:', error);
  }
}

export async function trackEmailClick(
  emailLogId: string,
  url: string,
  deviceType?: 'desktop' | 'mobile' | 'tablet' | 'unknown',
  userAgent?: string
): Promise<void> {
  try {
    const logsKey = 'email-delivery-logs';
    const logs = await window.spark.kv.get<EmailDeliveryLog[]>(logsKey) || [];
    
    const clickEvent: EmailClickEvent = {
      id: `click-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      url,
      clickedAt: new Date().toISOString(),
      deviceType,
      userAgent,
    };
    
    const updatedLogs = logs.map(log => {
      if (log.id === emailLogId) {
        return {
          ...log,
          clicks: [...log.clicks, clickEvent],
        };
      }
      return log;
    });
    
    await window.spark.kv.set(logsKey, updatedLogs);
  } catch (error) {
    console.error('Failed to track email click:', error);
  }
}

export function detectDeviceType(userAgent?: string): 'desktop' | 'mobile' | 'tablet' | 'unknown' {
  if (!userAgent) return 'unknown';
  
  const ua = userAgent.toLowerCase();
  
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    return 'tablet';
  }
  
  if (/mobile|iphone|ipod|android|blackberry|opera mini|windows phone|palm|smartphone|iemobile/i.test(ua)) {
    return 'mobile';
  }
  
  if (/windows|mac|linux|x11/i.test(ua)) {
    return 'desktop';
  }
  
  return 'unknown';
}

export function generateTrackingPixel(emailLogId: string): string {
  const trackingUrl = `data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7`;
  return `<img src="${trackingUrl}" width="1" height="1" alt="" style="display:block;" data-email-id="${emailLogId}" />`;
}

export function wrapLinksWithTracking(htmlContent: string, emailLogId: string): string {
  const linkRegex = /<a\s+(?:[^>]*?\s+)?href="([^"]*)"/gi;
  
  return htmlContent.replace(linkRegex, (match, url) => {
    const trackingData = `data-email-id="${emailLogId}" data-original-url="${url}"`;
    return match.replace('href="', `${trackingData} href="`);
  });
}

export async function simulateEmailOpen(emailLogId: string): Promise<void> {
  const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown';
  const deviceType = detectDeviceType(userAgent);
  
  await trackEmailOpen(emailLogId, deviceType, userAgent);
}

export async function simulateEmailClick(emailLogId: string, url: string): Promise<void> {
  const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown';
  const deviceType = detectDeviceType(userAgent);
  
  await trackEmailClick(emailLogId, url, deviceType, userAgent);
}

export function generateDemoEmailLogs(employees: Array<{ id: string; name: string; email?: string }>): EmailDeliveryLog[] {
  const emailTypes: Array<NotificationType | 'digest'> = [
    'task_assigned',
    'task_reassigned',
    'task_completed',
    'task_due_soon',
    'task_overdue',
    'digest',
  ];
  
  const devices: Array<'desktop' | 'mobile' | 'tablet'> = ['desktop', 'mobile', 'tablet'];
  const statuses: Array<'sent' | 'bounced'> = ['sent', 'sent', 'sent', 'sent', 'bounced'];
  
  const demoLogs: EmailDeliveryLog[] = [];
  const now = Date.now();
  
  for (let i = 0; i < 50; i++) {
    const daysAgo = Math.floor(Math.random() * 30);
    const sentAt = new Date(now - daysAgo * 24 * 60 * 60 * 1000);
    const employee = employees[Math.floor(Math.random() * employees.length)];
    const emailType = emailTypes[Math.floor(Math.random() * emailTypes.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const device = devices[Math.floor(Math.random() * devices.length)];
    
    const shouldOpen = Math.random() > 0.3 && status === 'sent';
    const shouldClick = shouldOpen && Math.random() > 0.5;
    
    const log: EmailDeliveryLog = {
      id: `demo-log-${i}-${Date.now()}`,
      userId: employee.id,
      userName: employee.name,
      userEmail: employee.email,
      emailType,
      subject: getSubjectForType(emailType),
      sentAt: sentAt.toISOString(),
      status,
      openCount: shouldOpen ? Math.floor(Math.random() * 3) + 1 : 0,
      clicks: shouldClick ? generateDemoClicks(Math.floor(Math.random() * 3) + 1) : [],
      deviceType: shouldOpen ? device : undefined,
      openedAt: shouldOpen ? new Date(sentAt.getTime() + Math.random() * 60 * 60 * 1000).toISOString() : undefined,
    };
    
    demoLogs.push(log);
  }
  
  return demoLogs;
}

function getSubjectForType(type: NotificationType | 'digest'): string {
  const subjects: Record<string, string> = {
    task_assigned: 'New Task Assigned to You',
    task_reassigned: 'Task Reassigned to You',
    task_completed: 'Task Completed',
    task_due_soon: 'Task Due Soon',
    task_overdue: 'Task Overdue',
    task_comment: 'New Comment on Your Task',
    task_status_changed: 'Task Status Updated',
    digest: 'Your Daily Task Digest',
  };
  
  return subjects[type] || 'Task Notification';
}

function generateDemoClicks(count: number): EmailClickEvent[] {
  const urls = [
    '/tasks/view',
    '/tasks/edit',
    '/dashboard',
    '/profile',
    '/settings',
  ];
  
  return Array.from({ length: count }, (_, i) => ({
    id: `demo-click-${i}-${Date.now()}-${Math.random()}`,
    url: urls[Math.floor(Math.random() * urls.length)],
    clickedAt: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString(),
    deviceType: ['desktop', 'mobile', 'tablet'][Math.floor(Math.random() * 3)] as any,
  }));
}
