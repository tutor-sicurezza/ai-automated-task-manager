/**
 * Post-Deployment Monitoring Configuration
 * Tracks KPIs for UX/UI improvements
 *
 * Deploy commit: 73468da
 * Date: 2026-09-18
 */

import { analytics } from '@vercel/analytics/server';

/**
 * KPI Tracking Interface
 */
interface FormMetrics {
  timestamp: number;
  formStartTime: number;
  formCompleteTime?: number;
  deviceType: 'mobile' | 'tablet' | 'desktop';
  fieldsCompleted: number;
  charactersTyped: number;
  helpIconsClicked: number;
  completionSuccess: boolean;
  errorCount: number;
  errors: string[];
}

/**
 * Form Session Tracker
 * Call this when user opens the form
 */
export function trackFormStart(formType: 'create' | 'edit') {
  const sessionId = generateSessionId();
  const startTime = Date.now();

  sessionStorage.setItem(`form_${formType}_start`, JSON.stringify({
    sessionId,
    startTime,
    deviceType: detectDevice(),
    userAgent: navigator.userAgent,
    viewport: {
      width: window.innerWidth,
      height: window.innerHeight
    }
  }));

  // Analytics event
  gtag('event', `form_${formType}_opened`, {
    event_category: 'engagement',
    device_type: detectDevice(),
    event_time: new Date().toISOString()
  });
}

/**
 * Track field interactions
 */
export function trackFieldInteraction(
  fieldName: string,
  eventType: 'focus' | 'blur' | 'change' | 'help_icon_clicked',
  value?: string
) {
  gtag('event', 'form_field_interaction', {
    event_category: 'form_engagement',
    event_label: fieldName,
    event_value: eventType,
    character_count: value?.length || 0
  });
}

/**
 * Track form submission
 */
export function trackFormSubmission(
  formType: 'create' | 'edit',
  success: boolean,
  metrics: Partial<FormMetrics>
) {
  const sessionData = sessionStorage.getItem(`form_${formType}_start`);

  if (!sessionData) return;

  const { startTime } = JSON.parse(sessionData);
  const completionTime = Date.now() - startTime;

  // Core metrics
  gtag('event', 'form_submission', {
    event_category: 'engagement',
    event_label: `${formType}_${success ? 'success' : 'failure'}`,
    form_completion_time_ms: completionTime,
    device_type: metrics.deviceType || detectDevice(),
    fields_completed: metrics.fieldsCompleted || 0,
    help_icons_clicked: metrics.helpIconsClicked || 0,
    errors: metrics.errorCount || 0,
    success: success ? 1 : 0
  });

  // Mobile-specific metrics
  if (metrics.deviceType === 'mobile') {
    gtag('event', 'mobile_form_submission', {
      event_category: 'mobile_engagement',
      event_label: `${formType}_${success ? 'success' : 'failure'}`,
      completion_time_ms: completionTime,
      viewport_width: window.innerWidth
    });
  }

  // Detailed analytics tracking
  if (success) {
    gtag('event', 'conversion', {
      event_category: 'task_creation',
      transaction_id: generateSessionId(),
      value: 1,
      device_type: metrics.deviceType,
      time_to_completion_seconds: Math.round(completionTime / 1000)
    });
  }

  // Clear session data
  sessionStorage.removeItem(`form_${formType}_start`);
}

/**
 * Track character counter interactions
 */
export function trackCharacterCounter(fieldName: string, charCount: number, maxLength: number) {
  // Only track every 10th character or limit reached
  if (charCount % 10 === 0 || charCount === maxLength) {
    gtag('event', 'character_counter_update', {
      event_category: 'form_engagement',
      event_label: fieldName,
      character_count: charCount,
      max_length: maxLength,
      percentage_filled: Math.round((charCount / maxLength) * 100)
    });
  }
}

/**
 * Track field reorganization impact
 * (Assignee field moved to position 3)
 */
export function trackAssigneeFieldInteraction(source: 'early' | 'late') {
  gtag('event', 'assignee_field_interaction', {
    event_category: 'ux_improvement',
    event_label: `reorganized_field_${source}_in_form`,
    field_position: source === 'early' ? 3 : 10 // New position vs old
  });
}

/**
 * Track mobile responsiveness
 */
export function trackMobileFormBehavior(
  viewport: 'mobile' | 'tablet' | 'desktop',
  scrolling: boolean,
  touchEvents: number
) {
  gtag('event', 'mobile_form_behavior', {
    event_category: 'mobile_ux',
    event_label: `viewport_${viewport}`,
    scrolling_inside_dialog: scrolling ? 1 : 0,
    touch_interactions: touchEvents
  });
}

/**
 * Track dark mode rendering
 */
export function trackDarkModeRendering(
  isDarkMode: boolean,
  elementsVisible: number,
  elementsHidden: number
) {
  gtag('event', 'dark_mode_rendering', {
    event_category: 'accessibility',
    event_label: isDarkMode ? 'dark' : 'light',
    visible_elements: elementsVisible,
    hidden_elements: elementsHidden,
    accessibility_issue: elementsHidden > 0 ? 1 : 0
  });
}

/**
 * Track help icon clicks
 */
export function trackHelpIconClick(fieldName: 'labels' | 'watchers') {
  gtag('event', 'help_icon_clicked', {
    event_category: 'ux_engagement',
    event_label: `${fieldName}_help_icon`,
    field_name: fieldName,
    timestamp: new Date().toISOString()
  });
}

/**
 * Monitor form errors and issues
 */
export function trackFormError(errorType: string, context: Record<string, any>) {
  gtag('event', 'exception', {
    description: `form_error_${errorType}`,
    ...context
  });

  // Also log to error tracking service
  console.error(`[Form Error] ${errorType}:`, context);
}

/**
 * Detect device type
 */
function detectDevice(): 'mobile' | 'tablet' | 'desktop' {
  const width = window.innerWidth;

  if (width < 640) return 'mobile';
  if (width < 1024) return 'tablet';
  return 'desktop';
}

/**
 * Generate unique session ID
 */
function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Initialize monitoring
 * Call on app startup
 */
export function initializeFormMonitoring() {
  // Track initial page metrics
  if (typeof window !== 'undefined') {
    // Mobile form behavior
    window.addEventListener('orientationchange', () => {
      gtag('event', 'orientation_changed', {
        event_category: 'mobile_ux',
        new_orientation: window.innerWidth > window.innerHeight ? 'landscape' : 'portrait'
      });
    });

    // Monitor CPU/Memory during form submission
    if ('memory' in performance) {
      const perf = performance as any;

      window.addEventListener('beforeunload', () => {
        gtag('event', 'page_performance', {
          event_category: 'performance',
          memory_used_mb: Math.round(perf.memory.usedJSHeapSize / 1048576),
          memory_limit_mb: Math.round(perf.memory.jsHeapSizeLimit / 1048576)
        });
      });
    }
  }
}

/**
 * Generate monitoring report
 */
export async function generateMonitoringReport() {
  const report = {
    timestamp: new Date().toISOString(),
    deployment_commit: '73468da',
    kpis: {
      formCompletionRate: await fetchMetric('form_completion_rate'),
      mobileCompletionRate: await fetchMetric('mobile_completion_rate'),
      averageCompletionTime: await fetchMetric('avg_form_completion_time'),
      supportTickets: await fetchMetric('support_tickets_form_related'),
      errorRate: await fetchMetric('form_error_rate')
    },
    breakdowns: {
      byDevice: await fetchMetricBreakdown('device_type'),
      byFieldOrder: await fetchMetricBreakdown('field_interaction_order'),
      byCharacterCounter: await fetchMetricBreakdown('character_counter_usage')
    },
    issues: await fetchReportedIssues()
  };

  return report;
}

/**
 * Fetch metric from analytics backend
 */
async function fetchMetric(metricName: string): Promise<number | null> {
  try {
    const response = await fetch(`/api/analytics/metrics/${metricName}`, {
      headers: { 'Authorization': `Bearer ${process.env.ANALYTICS_API_KEY}` }
    });
    const data = await response.json();
    return data.value;
  } catch (error) {
    console.error(`Failed to fetch metric ${metricName}:`, error);
    return null;
  }
}

/**
 * Fetch metric breakdown
 */
async function fetchMetricBreakdown(dimension: string): Promise<Record<string, number>> {
  try {
    const response = await fetch(`/api/analytics/breakdowns/${dimension}`, {
      headers: { 'Authorization': `Bearer ${process.env.ANALYTICS_API_KEY}` }
    });
    const data = await response.json();
    return data.breakdown;
  } catch (error) {
    console.error(`Failed to fetch breakdown ${dimension}:`, error);
    return {};
  }
}

/**
 * Fetch reported issues from error tracking
 */
async function fetchReportedIssues(): Promise<Array<{ issue: string; count: number }>> {
  try {
    const response = await fetch('/api/analytics/issues', {
      headers: { 'Authorization': `Bearer ${process.env.ANALYTICS_API_KEY}` }
    });
    const data = await response.json();
    return data.issues;
  } catch (error) {
    console.error('Failed to fetch reported issues:', error);
    return [];
  }
}

/**
 * Monitoring alerts threshold
 */
export const ALERT_THRESHOLDS = {
  formCompletionRate: {
    min: 0.75, // Alert if below 75%
    warn: 0.85 // Warning if below 85%
  },
  mobileCompletionRate: {
    min: 0.60, // Alert if below 60% (lower baseline for mobile)
    warn: 0.75
  },
  errorRate: {
    max: 0.02, // Alert if above 2%
    warn: 0.01 // Warning if above 1%
  },
  supportTickets: {
    max: 5, // Alert if more than 5 form-related tickets per day
    warn: 3
  }
};

/**
 * Check if any metrics exceed alert thresholds
 */
export async function checkAlerts(metrics: any): Promise<string[]> {
  const alerts: string[] = [];

  if (metrics.formCompletionRate < ALERT_THRESHOLDS.formCompletionRate.min) {
    alerts.push(`❌ ALERT: Form completion rate dropped to ${metrics.formCompletionRate}%`);
  }

  if (metrics.mobileCompletionRate < ALERT_THRESHOLDS.mobileCompletionRate.min) {
    alerts.push(`⚠️ ALERT: Mobile completion rate is ${metrics.mobileCompletionRate}%`);
  }

  if (metrics.errorRate > ALERT_THRESHOLDS.errorRate.max) {
    alerts.push(`❌ ALERT: Form error rate exceeded ${ALERT_THRESHOLDS.errorRate.max * 100}%`);
  }

  if (metrics.supportTickets > ALERT_THRESHOLDS.supportTickets.max) {
    alerts.push(`⚠️ ALERT: ${metrics.supportTickets} form-related support tickets today`);
  }

  return alerts;
}
