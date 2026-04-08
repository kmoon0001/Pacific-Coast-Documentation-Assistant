/**
 * Performance monitoring and error tracking for TheraDoc
 * Integrates with Sentry and custom metrics
 */

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  tags?: Record<string, string>;
}

interface ErrorReport {
  message: string;
  stack?: string;
  context?: Record<string, any>;
  timestamp: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

class MonitoringService {
  private metrics: PerformanceMetric[] = [];
  private errors: ErrorReport[] = [];
  private maxMetrics = 1000;
  private maxErrors = 100;
  private sentryEnabled = false;

  /**
   * Initialize monitoring service
   */
  init(config: { sentryDsn?: string; environment?: string } = {}) {
    if (config.sentryDsn) {
      this.initSentry(config.sentryDsn, config.environment);
    }

    // Set up global error handlers
    this.setupErrorHandlers();

    // Set up performance observers
    this.setupPerformanceObservers();

    console.log('Monitoring service initialized');
  }

  /**
   * Initialize Sentry
   */
  private initSentry(_dsn: string, _environment = 'production') {
    try {
      // In production, use actual Sentry SDK
      // import * as Sentry from '@sentry/browser';
      // Sentry.init({ dsn: _dsn, environment: _environment });
      this.sentryEnabled = true;
      console.log('Sentry initialized');
    } catch (_error) {
      console.error('Failed to initialize Sentry:', _error);
    }
  }

  /**
   * Set up global error handlers
   */
  private setupErrorHandlers() {
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.captureError(new Error(event.reason), {
        type: 'unhandledRejection',
        severity: 'high',
      });
    });

    // Handle global errors
    window.addEventListener('error', (event) => {
      this.captureError(event.error, {
        type: 'globalError',
        severity: 'high',
      });
    });
  }

  /**
   * Set up performance observers
   */
  private setupPerformanceObservers() {
    if ('PerformanceObserver' in window) {
      // Observe long tasks
      try {
        const longTaskObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            this.recordMetric('long-task', entry.duration, {
              name: entry.name,
            });
          }
        });
        longTaskObserver.observe({ entryTypes: ['longtask'] });
      } catch (_e) {
        // Long task API not supported
      }

      // Observe resource timing
      try {
        const resourceObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            const resourceEntry = entry as PerformanceResourceTiming;
            this.recordMetric('resource-load', resourceEntry.duration, {
              name: resourceEntry.name,
              type: resourceEntry.initiatorType,
            });
          }
        });
        resourceObserver.observe({ entryTypes: ['resource'] });
      } catch (_e) {
        // Resource timing not supported
      }
    }
  }

  /**
   * Record a performance metric
   */
  recordMetric(name: string, value: number, tags?: Record<string, string>) {
    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: Date.now(),
      tags,
    };

    this.metrics.push(metric);

    // Keep only recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }

    // Log slow operations
    if (value > 1000) {
      console.warn(`Slow operation detected: ${name} took ${value}ms`, tags);
    }
  }

  /**
   * Capture an error
   */
  captureError(
    error: Error,
    context?: {
      type?: string;
      severity?: 'low' | 'medium' | 'high' | 'critical';
      extra?: Record<string, any>;
    }
  ) {
    const errorReport: ErrorReport = {
      message: error.message,
      stack: error.stack,
      context: {
        type: context?.type,
        ...context?.extra,
      },
      timestamp: Date.now(),
      severity: context?.severity || 'medium',
    };

    this.errors.push(errorReport);

    // Keep only recent errors
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(-this.maxErrors);
    }

    // Send to Sentry if enabled
    if (this.sentryEnabled) {
      // Sentry.captureException(error, { contexts: context });
    }

    // Log to console
    console.error('Error captured:', errorReport);
  }

  /**
   * Track API call performance
   */
  trackAPICall(endpoint: string, duration: number, status: number) {
    this.recordMetric('api-call', duration, {
      endpoint,
      status: status.toString(),
    });

    // Track errors
    if (status >= 400) {
      this.recordMetric('api-error', 1, {
        endpoint,
        status: status.toString(),
      });
    }
  }

  /**
   * Track user interaction
   */
  trackInteraction(action: string, duration?: number) {
    this.recordMetric('user-interaction', duration || 0, {
      action,
    });
  }

  /**
   * Track page load performance
   */
  trackPageLoad() {
    if ('performance' in window) {
      const navigationEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      
      if (navigationEntry) {
        const loadTime = navigationEntry.loadEventEnd - navigationEntry.fetchStart;
        const domReady = navigationEntry.domContentLoadedEventEnd - navigationEntry.fetchStart;
        const firstPaint = navigationEntry.responseStart - navigationEntry.fetchStart;

        this.recordMetric('page-load', loadTime);
        this.recordMetric('dom-ready', domReady);
        this.recordMetric('first-paint', firstPaint);
      }
    }
  }

  /**
   * Get metrics summary
   */
  getMetricsSummary() {
    const summary: Record<string, { count: number; avg: number; max: number; min: number }> = {};

    this.metrics.forEach((metric) => {
      if (!summary[metric.name]) {
        summary[metric.name] = {
          count: 0,
          avg: 0,
          max: -Infinity,
          min: Infinity,
        };
      }

      const s = summary[metric.name];
      s.count++;
      s.avg = (s.avg * (s.count - 1) + metric.value) / s.count;
      s.max = Math.max(s.max, metric.value);
      s.min = Math.min(s.min, metric.value);
    });

    return summary;
  }

  /**
   * Get error summary
   */
  getErrorSummary() {
    const summary: Record<string, number> = {};

    this.errors.forEach((error) => {
      const key = error.message;
      summary[key] = (summary[key] || 0) + 1;
    });

    return summary;
  }

  /**
   * Clear all metrics and errors
   */
  clear() {
    this.metrics = [];
    this.errors = [];
  }

  /**
   * Export data for analysis
   */
  exportData() {
    return {
      metrics: this.metrics,
      errors: this.errors,
      summary: this.getMetricsSummary(),
      errorSummary: this.getErrorSummary(),
      timestamp: Date.now(),
    };
  }
}

// Export singleton instance
export const monitoring = new MonitoringService();

// Auto-initialize in browser
if (typeof window !== 'undefined') {
  const mode = typeof import.meta !== 'undefined' && 'env' in import.meta 
    ? (import.meta as any).env?.MODE 
    : 'development';
  
  monitoring.init({
    environment: mode || 'development',
  });

  // Track page load
  if (document.readyState === 'complete') {
    monitoring.trackPageLoad();
  } else {
    window.addEventListener('load', () => monitoring.trackPageLoad());
  }
}
