/**
 * Performance Optimization Utilities
 * Implements code splitting, lazy loading, and performance monitoring
 */

import { lazy } from 'react';

/**
 * Lazy load component with error boundary
 */
export function lazyLoadComponent<T extends React.ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  displayName: string
): React.LazyExoticComponent<T> {
  const Component = lazy(importFunc);
  (Component as any).displayName = displayName;
  return Component;
}

/**
 * Debounce function for performance optimization
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function for performance optimization
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return function (...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Request animation frame throttle
 */
export function rafThrottle<T extends (...args: any[]) => any>(func: T): (...args: Parameters<T>) => void {
  let rafId: number | null = null;

  return function (...args: Parameters<T>) {
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
    }
    rafId = requestAnimationFrame(() => {
      func(...args);
      rafId = null;
    });
  };
}

/**
 * Memoize function results
 */
export function memoize<T extends (...args: any[]) => any>(func: T): T {
  const cache = new Map();

  return ((...args: Parameters<T>) => {
    const key = JSON.stringify(args);

    if (cache.has(key)) {
      return cache.get(key);
    }

    const result = func(...args);
    cache.set(key, result);

    // Limit cache size
    if (cache.size > 100) {
      const firstKey = cache.keys().next().value;
      cache.delete(firstKey);
    }

    return result;
  }) as T;
}

/**
 * Batch DOM updates
 */
export function batchDOMUpdates(updates: (() => void)[]): void {
  requestAnimationFrame(() => {
    updates.forEach((update) => update());
  });
}

/**
 * Lazy load image with intersection observer
 */
export function lazyLoadImage(
  element: HTMLImageElement,
  src: string,
  placeholder?: string
): void {
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          img.src = src;
          img.classList.add('loaded');
          observer.unobserve(img);
        }
      });
    });

    if (placeholder) {
      element.src = placeholder;
    }
    observer.observe(element);
  } else {
    element.src = src;
  }
}

/**
 * Preload resource
 */
export function preloadResource(url: string, type: 'script' | 'style' | 'image' = 'script'): void {
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = type;
  link.href = url;
  document.head.appendChild(link);
}

/**
 * Prefetch resource
 */
export function prefetchResource(url: string): void {
  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.href = url;
  document.head.appendChild(link);
}

/**
 * DNS prefetch
 */
export function dnsPrefetch(domain: string): void {
  const link = document.createElement('link');
  link.rel = 'dns-prefetch';
  link.href = `//${domain}`;
  document.head.appendChild(link);
}

/**
 * Preconnect to domain
 */
export function preconnect(domain: string): void {
  const link = document.createElement('link');
  link.rel = 'preconnect';
  link.href = `//${domain}`;
  document.head.appendChild(link);
}

/**
 * Measure performance metric
 */
export function measureMetric(name: string, callback: () => void): number {
  const startMark = `${name}-start`;
  const endMark = `${name}-end`;
  const measureName = `${name}-duration`;

  performance.mark(startMark);
  callback();
  performance.mark(endMark);
  performance.measure(measureName, startMark, endMark);

  const measure = performance.getEntriesByName(measureName)[0] as PerformanceMeasure;
  return measure.duration;
}

/**
 * Get Web Vitals
 */
export async function getWebVitals(): Promise<WebVitals> {
  const vitals: WebVitals = {
    lcp: 0,
    fid: 0,
    cls: 0,
    ttfb: 0,
    fcp: 0,
  };

  // LCP (Largest Contentful Paint)
  if ('PerformanceObserver' in window) {
    try {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        vitals.lcp = (lastEntry as any).renderTime || (lastEntry as any).loadTime;
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
    } catch {
      // LCP not supported
    }

    // CLS (Cumulative Layout Shift)
    try {
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            vitals.cls += (entry as any).value;
          }
        }
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
    } catch {
      // CLS not supported
    }
  }

  // FCP (First Contentful Paint)
  const fcpEntry = performance.getEntriesByName('first-contentful-paint')[0];
  if (fcpEntry) {
    vitals.fcp = fcpEntry.startTime;
  }

  // TTFB (Time to First Byte)
  const navigationTiming = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
  if (navigationTiming) {
    vitals.ttfb = navigationTiming.responseStart - navigationTiming.fetchStart;
  }

  return vitals;
}

/**
 * Monitor performance
 */
export function monitorPerformance(callback: (metrics: PerformanceMetrics) => void): () => void {
  const observer = new PerformanceObserver((list) => {
    const entries = list.getEntries();
    const metrics: PerformanceMetrics = {
      entries: entries.map((entry) => ({
        name: entry.name,
        duration: (entry as any).duration || 0,
        startTime: entry.startTime,
      })),
      timestamp: Date.now(),
    };
    callback(metrics);
  });

  observer.observe({ entryTypes: ['measure', 'navigation', 'resource'] });

  return () => observer.disconnect();
}

/**
 * Optimize Xenova model loading
 */
export async function optimizeModelLoading(modelName: string): Promise<void> {
  // Preload model resources
  preloadResource(`/models/${modelName}.onnx`, 'script');
  prefetchResource(`/models/${modelName}.onnx`);

  // DNS prefetch for model CDN
  dnsPrefetch('cdn.example.com');
  preconnect('cdn.example.com');
}

/**
 * Implement request debouncing
 */
export function createDebouncedRequest<T extends (...args: any[]) => Promise<any>>(
  func: T,
  delay: number = 300
): T {
  return debounce(func, delay) as T;
}

/**
 * Implement request throttling
 */
export function createThrottledRequest<T extends (...args: any[]) => Promise<any>>(
  func: T,
  limit: number = 1000
): T {
  return throttle(func, limit) as T;
}

/**
 * Cache API responses
 */
export class ResponseCache {
  private cache = new Map<string, CachedResponse>();
  private maxAge: number;

  constructor(maxAge: number = 5 * 60 * 1000) {
    // 5 minutes default
    this.maxAge = maxAge;
  }

  set(key: string, value: any): void {
    this.cache.set(key, {
      value,
      timestamp: Date.now(),
    });
  }

  get(key: string): any | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    if (Date.now() - cached.timestamp > this.maxAge) {
      this.cache.delete(key);
      return null;
    }

    return cached.value;
  }

  clear(): void {
    this.cache.clear();
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }
}

/**
 * HTTP caching strategy
 */
export class HTTPCacheStrategy {
  static getCacheControl(type: 'static' | 'dynamic' | 'api'): string {
    switch (type) {
      case 'static':
        return 'public, max-age=31536000, immutable'; // 1 year
      case 'dynamic':
        return 'public, max-age=3600, must-revalidate'; // 1 hour
      case 'api':
        return 'private, max-age=300, must-revalidate'; // 5 minutes
      default:
        return 'no-cache';
    }
  }

  static getETag(content: string): string {
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return `"${hash.toString(16)}"`;
  }
}

/**
 * Service Worker registration
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered:', registration);
      return registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return null;
    }
  }
  return null;
}

/**
 * Unregister Service Worker
 */
export async function unregisterServiceWorker(): Promise<void> {
  if ('serviceWorker' in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    for (const registration of registrations) {
      await registration.unregister();
    }
  }
}

export interface WebVitals {
  lcp: number; // Largest Contentful Paint
  fid: number; // First Input Delay
  cls: number; // Cumulative Layout Shift
  ttfb: number; // Time to First Byte
  fcp: number; // First Contentful Paint
}

export interface PerformanceMetrics {
  entries: Array<{
    name: string;
    duration: number;
    startTime: number;
  }>;
  timestamp: number;
}

interface CachedResponse {
  value: any;
  timestamp: number;
}
