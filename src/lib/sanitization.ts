import DOMPurify from 'dompurify';

export interface SanitizationConfig {
  ALLOWED_TAGS?: string[];
  ALLOWED_ATTR?: string[];
  ALLOW_DATA_ATTR?: boolean;
  RETURN_TRUSTED_TYPE?: boolean;
}

const DEFAULT_CONFIG: SanitizationConfig = {
  ALLOWED_TAGS: [
    'b', 'i', 'em', 'strong', 'u', 's', 'p', 'br', 
    'ul', 'ol', 'li', 'a', 'code', 'pre', 'blockquote'
  ],
  ALLOWED_ATTR: ['href', 'target', 'rel'],
  ALLOW_DATA_ATTR: false,
};

const STRICT_CONFIG: SanitizationConfig = {
  ALLOWED_TAGS: [],
  ALLOWED_ATTR: [],
  ALLOW_DATA_ATTR: false,
};

export function sanitizeHTML(dirty: string, config?: SanitizationConfig): string {
  if (!dirty || typeof dirty !== 'string') {
    return '';
  }
  
  const sanitizeConfig = config || DEFAULT_CONFIG;
  return DOMPurify.sanitize(dirty, sanitizeConfig);
}

export function sanitizeText(dirty: string): string {
  if (!dirty || typeof dirty !== 'string') {
    return '';
  }
  
  return DOMPurify.sanitize(dirty, STRICT_CONFIG);
}

export function sanitizeTaskTitle(title: string): string {
  return sanitizeText(title).slice(0, 200);
}

export function sanitizeTaskDescription(description: string): string {
  return sanitizeHTML(description).slice(0, 5000);
}

export function sanitizeComment(comment: string): string {
  return sanitizeHTML(comment).slice(0, 2000);
}

export function sanitizeUserName(name: string): string {
  return sanitizeText(name).slice(0, 100);
}

export function sanitizeEmail(email: string): string {
  const sanitized = sanitizeText(email).slice(0, 255);
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(sanitized) ? sanitized : '';
}

export function sanitizeDepartmentName(name: string): string {
  return sanitizeText(name).slice(0, 100);
}

export function sanitizeRole(role: string): string {
  return sanitizeText(role).slice(0, 100);
}

export function sanitizeFileName(fileName: string): string {
  const sanitized = sanitizeText(fileName);
  return sanitized.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 255);
}

export function sanitizeURL(url: string): string {
  if (!url || typeof url !== 'string') {
    return '';
  }
  
  const sanitized = sanitizeText(url);
  
  try {
    const urlObj = new URL(sanitized);
    if (urlObj.protocol === 'http:' || urlObj.protocol === 'https:') {
      return sanitized;
    }
  } catch {
    return '';
  }
  
  return '';
}

export function sanitizeAnnouncementContent(content: string): string {
  return sanitizeHTML(content).slice(0, 10000);
}

export function sanitizeSearchQuery(query: string): string {
  return sanitizeText(query).slice(0, 200);
}

export function sanitizeJSONField(value: unknown): string {
  if (typeof value === 'string') {
    return sanitizeText(value);
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  return '';
}

export function sanitizeArray<T extends string>(arr: T[]): T[] {
  if (!Array.isArray(arr)) {
    return [];
  }
  return arr.map(item => sanitizeText(String(item)) as T).filter(Boolean);
}

export function sanitizeObject<T extends Record<string, unknown>>(obj: T): Partial<T> {
  if (!obj || typeof obj !== 'object') {
    return {};
  }
  
  const sanitized: Partial<T> = {};
  
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = obj[key];
      
      if (typeof value === 'string') {
        sanitized[key] = sanitizeText(value) as T[Extract<keyof T, string>];
      } else if (typeof value === 'number' || typeof value === 'boolean') {
        sanitized[key] = value;
      } else if (Array.isArray(value)) {
        sanitized[key] = sanitizeArray(value as string[]) as T[Extract<keyof T, string>];
      } else if (value && typeof value === 'object') {
        sanitized[key] = sanitizeObject(value as Record<string, unknown>) as T[Extract<keyof T, string>];
      }
    }
  }
  
  return sanitized;
}

export const Sanitizer = {
  html: sanitizeHTML,
  text: sanitizeText,
  taskTitle: sanitizeTaskTitle,
  taskDescription: sanitizeTaskDescription,
  comment: sanitizeComment,
  userName: sanitizeUserName,
  email: sanitizeEmail,
  departmentName: sanitizeDepartmentName,
  role: sanitizeRole,
  fileName: sanitizeFileName,
  url: sanitizeURL,
  announcementContent: sanitizeAnnouncementContent,
  searchQuery: sanitizeSearchQuery,
  jsonField: sanitizeJSONField,
  array: sanitizeArray,
  object: sanitizeObject,
};
