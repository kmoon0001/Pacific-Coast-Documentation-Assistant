/**
 * Performance Monitoring System
 * Tracks Web Vitals, API latency, error rates, and performance metrics
 */

import { getWebVitals } from './performance';

/**
 * Performance monitoring configuration
 */
export interface PerformanceConfig {
  enabled: boolean;
  sampleRate: number; // 0-1
  endpoint?: string;
  batchSize: number;
  flushInterval: number;
}

/**
 * Performance metric
 */
export interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: number;
  tags?: Record<string, string>;
}

/**
 * API latency metric
 */
export interface APILatencyMetric {
  endpoint: string;
  method: string;
  duration: number;
  status: number;
  timestamp: number;
  error?: string;
}

/**
 * Error rate metric
 */
export interface ErrorRateMetric {
  errorType: string;
  count: number;
  rate: number;
  timestamp: number;
}

/**
 * Performance monitoring class
 */
export class PerformanceMonitor {
  private config: PerformanceConfig;
  private metrics: PerformanceMetric[] = [];
  private apiMetrics: APILatencyMetric[] = [];
  private errorMetrics: ErrorRateMetric[] = [];
  private flushTimer: NodeJS.Timeout | null = null;
  private errorCount = 0;
  private totalRequests = 0;

  constructor(config: Partial<PerformanceConfig> = {}) {
    this.config = {
      enabled: true,
      sampleRate: 0.1,
      batchSize: 50,
      flushInterval: 60000, // 1 minute
      ...config,
    };

    if (this.config.enabled) {
      this.initialize();
    }
  }

  /**
   * Initialize monitoring
   */
  private initialize(): void {
    this.monitorWebVitals();
    this.monitorAPILatency();
    this.monitorErrors();
    this.startFlushTimer();
  }

  /**
   * Monitor Web Vitals
   */
  private monitorWebVitals(): void {
    getWebVitals().then((vitals) => {
      this.recordMetric('lcp', vitals.lcp, 'ms');
      this.recordMetric('fcp', vitals.fcp, 'ms');
      this.recordMetric('cls', vitals.cls, 'score');
      this.recordMetric('ttfb', vitals.ttfb, 'ms');
      this.recordMetric('fid', vitals.fid, 'ms');
    });
  }

  /**
   * Monitor API latency
   */
  private monitorAPILatency(): void {
    const originalFetch = window.fetch;

    window.fetch = async (...args: any[]) => {
      const startTime = performance.now();
      const request = args[0];
      const method = (args[1]?.method || 'GET').toUpperCase();

      try {
        const response = await originalFetch(...args);
        const duration = performance.now() - startTime;

        this.recordAPIMetric({
          endpoint: this.getEndpoint(request),
          method,
          duration,
          status: response.status,
          timestamp: Date.now(),
        });

        this.totalRequests++;
        return response;
      } catch (error) {
        const duration = performance.now() - startTime;

        this.recordAPIMetric({
          endpoint: this.getEndpoint(request),
          method,
          duration,
          status: 0,
          timestamp: Date.now(),
          error: (error as Error).message,
        });

        this.errorCount++;
        this.totalRequests++;
        throw error;
      }
    };
  }

  /**
   * Monitor errors
   */
  private monitorErrors(): void {
    window.addEventListener('error', (event) => {
      this.recordError('uncaught_error', event.error);
    });

    window.addEventListener('unhandledrejection', (event) => {
      this.recordError('unhandled_rejection', event.reason);
    });
  }

  /**
   * Record performance metric
   */
  recordMetric(name: string, value: number, unit: string, tags?: Record<string, string>): void {
    if (!this.shouldSample()) return;

    this.metrics.push({
      name,
      value,
      unit,
      timestamp: Date.now(),
      tags,
    });

    if (this.metrics.length >= this.config.batchSize) {
      this.flush();
    }
  }

  /**
   * Record API metric
   */
  recordAPIMetric(metric: APILatencyMetric): void {
    if (!this.shouldSample()) return;

    this.apiMetrics.push(metric);

    if (this.apiMetrics.length >= this.config.batchSize) {
      this.flush();
    }
  }

  /**
   * Record error
   */
  recordError(errorType: string, _error: any): void {
    if (!this.shouldSample()) return;

    this.errorCount++;
    const rate = this.totalRequests > 0 ? this.errorCount / this.totalRequests : 0;

    this.errorMetrics.push({
      errorType,
      count: this.errorCount,
      rate,
      timestamp: Date.now(),
    });
  }

  /**
   * Get endpoint from request
   */
  private getEndpoint(request: any): string {
    if (typeof request === 'string') {
      return request;
    }
    return request.url || 'unknown';
  }

  /**
   * Should sample metric
   */
  private shouldSample(): boolean {
    return Math.random() < this.config.sampleRate;
  }

  /**
   * Start flush timer
   */
  private startFlushTimer(): void {
    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.config.flushInterval);
  }

  /**
   * Flush metrics to endpoint
   */
  async flush(): Promise<void> {
    if (this.metrics.length === 0 && this.apiMetrics.length === 0 && this.errorMetrics.length === 0) {
      return;
    }

    const payload = {
      metrics: this.metrics,
      apiMetrics: this.apiMetrics,
      errorMetrics: this.errorMetrics,
      timestamp: Date.now(),
    };

    if (this.config.endpoint) {
      try {
        await fetch(this.config.endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          keepalive: true,
        });
      } catch (error) {
        console.error('Failed to flush metrics:', error);
      }
    }

    // Clear metrics
    this.metrics = [];
    this.apiMetrics = [];
    this.errorMetrics = [];
  }

  /**
   * Get current metrics
   */
  getMetrics(): {
    metrics: PerformanceMetric[];
    apiMetrics: APILatencyMetric[];
    errorMetrics: ErrorRateMetric[];
  } {
    return {
      metrics: this.metrics,
      apiMetrics: this.apiMetrics,
      errorMetrics: this.errorMetrics,
    };
  }

  /**
   * Get error rate
   */
  getErrorRate(): number {
    return this.totalRequests > 0 ? this.errorCount / this.totalRequests : 0;
  }

  /**
   * Get average API latency
   */
  getAverageAPILatency(): number {
    if (this.apiMetrics.length === 0) return 0;
    const total = this.apiMetrics.reduce((sum, m) => sum + m.duration, 0);
    return total / this.apiMetrics.length;
  }

  /**
   * Get API latency percentile
   */
  getAPILatencyPercentile(percentile: number): number {
    if (this.apiMetrics.length === 0) return 0;

    const sorted = [...this.apiMetrics].sort((a, b) => a.duration - b.duration);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[index]?.duration || 0;
  }

  /**
   * Disable monitoring
   */
  disable(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    this.flush();
  }

  /**
   * Enable monitoring
   */
  enable(): void {
    if (!this.config.enabled) {
      this.config.enabled = true;
      this.initialize();
    }
  }
}

/**
 * Performance budget checker
 */
export class PerformanceBudget {
  private budgets: Map<string, number> = new Map();

  /**
   * Set budget for metric
   */
  setBudget(metric: string, limit: number): void {
    this.budgets.set(metric, limit);
  }

  /**
   * Check if metric exceeds budget
   */
  checkBudget(metric: string, value: number): boolean {
    const budget = this.budgets.get(metric);
    if (!budget) return true;
    return value <= budget;
  }

  /**
   * Get budget status
   */
  getBudgetStatus(metric: string, value: number): BudgetStatus {
    const budget = this.budgets.get(metric);
    if (!budget) {
      return { status: 'unknown', percentage: 0 };
    }

    const percentage = (value / budget) * 100;
    const status = percentage > 100 ? 'exceeded' : percentage > 80 ? 'warning' : 'ok';

    return { status, percentage };
  }

  /**
   * Get all budgets
   */
  getBudgets(): Record<string, number> {
    const result: Record<string, number> = {};
    this.budgets.forEach((value, key) => {
      result[key] = value;
    });
    return result;
  }
}

/**
 * Performance dashboard configuration
 */
export interface PerformanceDashboardConfig {
  title: string;
  metrics: DashboardMetric[];
  refreshInterval: number;
  theme: 'light' | 'dark';
}

/**
 * Dashboard metric
 */
export interface DashboardMetric {
  name: string;
  type: 'gauge' | 'line' | 'bar';
  unit: string;
  threshold?: {
    warning: number;
    critical: number;
  };
}

/**
 * Budget status
 */
export interface BudgetStatus {
  status: 'ok' | 'warning' | 'exceeded' | 'unknown';
  percentage: number;
}

/**
 * Create default performance budgets
 */
export function createDefaultBudgets(): PerformanceBudget {
  const budget = new PerformanceBudget();

  // Web Vitals budgets
  budget.setBudget('lcp', 2500); // 2.5 seconds
  budget.setBudget('fcp', 1800); // 1.8 seconds
  budget.setBudget('cls', 0.1); // 0.1 score
  budget.setBudget('ttfb', 600); // 600ms
  budget.setBudget('fid', 100); // 100ms

  // API budgets
  budget.setBudget('api_latency_p50', 200); // 200ms
  budget.setBudget('api_latency_p95', 1000); // 1 second
  budget.setBudget('api_latency_p99', 2000); // 2 seconds

  // Error budgets
  budget.setBudget('error_rate', 0.001); // 0.1%

  // Bundle size budgets
  budget.setBudget('bundle_size', 500 * 1024); // 500KB

  return budget;
}

/**
 * Global performance monitor instance
 */
let globalMonitor: PerformanceMonitor | null = null;

/**
 * Get or create global performance monitor
 */
export function getPerformanceMonitor(config?: Partial<PerformanceConfig>): PerformanceMonitor {
  if (!globalMonitor) {
    globalMonitor = new PerformanceMonitor(config);
  }
  return globalMonitor;
}
