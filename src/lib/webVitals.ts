/**
 * Web Vitals monitoring for TheraDoc
 * Tracks Core Web Vitals: LCP, FID, CLS, FCP, TTFB
 */

import { monitoring } from './monitoring';

interface WebVitalMetric {
  name: 'CLS' | 'FID' | 'FCP' | 'LCP' | 'TTFB' | 'INP';
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  id: string;
}

type WebVitalCallback = (metric: WebVitalMetric) => void;

/**
 * Thresholds for Web Vitals ratings
 */
const THRESHOLDS = {
  CLS: { good: 0.1, poor: 0.25 },
  FID: { good: 100, poor: 300 },
  FCP: { good: 1800, poor: 3000 },
  LCP: { good: 2500, poor: 4000 },
  TTFB: { good: 800, poor: 1800 },
  INP: { good: 200, poor: 500 },
};

/**
 * Get rating for a metric value
 */
function getRating(name: WebVitalMetric['name'], value: number): WebVitalMetric['rating'] {
  const threshold = THRESHOLDS[name];
  if (value <= threshold.good) return 'good';
  if (value <= threshold.poor) return 'needs-improvement';
  return 'poor';
}

/**
 * Report Web Vital metric
 */
function reportWebVital(metric: WebVitalMetric, callback?: WebVitalCallback) {
  // Log to monitoring service
  monitoring.recordMetric(`web-vital-${metric.name.toLowerCase()}`, metric.value, {
    rating: metric.rating,
    id: metric.id,
  });

  // Log to console in development
  const isDev = typeof import.meta !== 'undefined' && 'env' in import.meta 
    ? (import.meta as any).env?.DEV 
    : false;
    
  if (isDev) {
    console.log(`[Web Vital] ${metric.name}:`, {
      value: metric.value,
      rating: metric.rating,
      delta: metric.delta,
    });
  }

  // Call custom callback
  if (callback) {
    callback(metric);
  }
}

/**
 * Measure Cumulative Layout Shift (CLS)
 */
export function measureCLS(callback?: WebVitalCallback) {
  if (!('PerformanceObserver' in window)) return;

  let clsValue = 0;

  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      // Only count layout shifts without recent user input
      if (!(entry as any).hadRecentInput) {
        clsValue += (entry as any).value;
      }
    }
  });

  observer.observe({ type: 'layout-shift', buffered: true });

  // Report on page hide
  const reportCLS = () => {
    const metric: WebVitalMetric = {
      name: 'CLS',
      value: clsValue,
      rating: getRating('CLS', clsValue),
      delta: clsValue,
      id: `cls-${Date.now()}`,
    };
    reportWebVital(metric, callback);
  };

  window.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      reportCLS();
    }
  });

  window.addEventListener('pagehide', reportCLS);
}

/**
 * Measure First Input Delay (FID)
 */
export function measureFID(callback?: WebVitalCallback) {
  if (!('PerformanceObserver' in window)) return;

  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      const fidEntry = entry as PerformanceEventTiming;
      const metric: WebVitalMetric = {
        name: 'FID',
        value: fidEntry.processingStart - fidEntry.startTime,
        rating: getRating('FID', fidEntry.processingStart - fidEntry.startTime),
        delta: fidEntry.processingStart - fidEntry.startTime,
        id: `fid-${Date.now()}`,
      };
      reportWebVital(metric, callback);
      observer.disconnect();
    }
  });

  observer.observe({ type: 'first-input', buffered: true });
}

/**
 * Measure First Contentful Paint (FCP)
 */
export function measureFCP(callback?: WebVitalCallback) {
  if (!('PerformanceObserver' in window)) return;

  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (entry.name === 'first-contentful-paint') {
        const metric: WebVitalMetric = {
          name: 'FCP',
          value: entry.startTime,
          rating: getRating('FCP', entry.startTime),
          delta: entry.startTime,
          id: `fcp-${Date.now()}`,
        };
        reportWebVital(metric, callback);
        observer.disconnect();
      }
    }
  });

  observer.observe({ type: 'paint', buffered: true });
}

/**
 * Measure Largest Contentful Paint (LCP)
 */
export function measureLCP(callback?: WebVitalCallback) {
  if (!('PerformanceObserver' in window)) return;

  let lcpValue = 0;

  const observer = new PerformanceObserver((list) => {
    const entries = list.getEntries();
    const lastEntry = entries[entries.length - 1];
    lcpValue = lastEntry.startTime;
  });

  observer.observe({ type: 'largest-contentful-paint', buffered: true });

  // Report on page hide
  const reportLCP = () => {
    const metric: WebVitalMetric = {
      name: 'LCP',
      value: lcpValue,
      rating: getRating('LCP', lcpValue),
      delta: lcpValue,
      id: `lcp-${Date.now()}`,
    };
    reportWebVital(metric, callback);
  };

  window.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      reportLCP();
    }
  });

  window.addEventListener('pagehide', reportLCP);
}

/**
 * Measure Time to First Byte (TTFB)
 */
export function measureTTFB(callback?: WebVitalCallback) {
  if (!('performance' in window) || !('timing' in performance)) return;

  const navigationEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;

  if (navigationEntry) {
    const ttfb = navigationEntry.responseStart - navigationEntry.requestStart;
    const metric: WebVitalMetric = {
      name: 'TTFB',
      value: ttfb,
      rating: getRating('TTFB', ttfb),
      delta: ttfb,
      id: `ttfb-${Date.now()}`,
    };
    reportWebVital(metric, callback);
  }
}

/**
 * Measure Interaction to Next Paint (INP)
 */
export function measureINP(callback?: WebVitalCallback) {
  if (!('PerformanceObserver' in window)) return;

  let maxDuration = 0;

  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      const eventEntry = entry as PerformanceEventTiming;
      if (eventEntry.duration > maxDuration) {
        maxDuration = eventEntry.duration;
      }
    }
  });

  // Note: durationThreshold is not in TypeScript types but is valid in browsers
  observer.observe({ type: 'event', buffered: true } as PerformanceObserverInit);

  // Report on page hide
  const reportINP = () => {
    const metric: WebVitalMetric = {
      name: 'INP',
      value: maxDuration,
      rating: getRating('INP', maxDuration),
      delta: maxDuration,
      id: `inp-${Date.now()}`,
    };
    reportWebVital(metric, callback);
  };

  window.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      reportINP();
    }
  });

  window.addEventListener('pagehide', reportINP);
}

/**
 * Initialize all Web Vitals measurements
 */
export function initWebVitals(callback?: WebVitalCallback) {
  measureCLS(callback);
  measureFID(callback);
  measureFCP(callback);
  measureLCP(callback);
  measureTTFB(callback);
  measureINP(callback);
}

/**
 * Get Web Vitals summary
 */
export function getWebVitalsSummary() {
  const summary = monitoring.getMetricsSummary();
  return {
    cls: summary['web-vital-cls'],
    fid: summary['web-vital-fid'],
    fcp: summary['web-vital-fcp'],
    lcp: summary['web-vital-lcp'],
    ttfb: summary['web-vital-ttfb'],
    inp: summary['web-vital-inp'],
  };
}

// Auto-initialize in browser
if (typeof window !== 'undefined') {
  // Wait for page load
  if (document.readyState === 'complete') {
    initWebVitals();
  } else {
    window.addEventListener('load', () => initWebVitals());
  }
}
