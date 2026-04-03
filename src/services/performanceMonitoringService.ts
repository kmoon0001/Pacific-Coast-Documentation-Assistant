import { PerformanceMetric, PerformanceStats, HealthCheckResult } from '../types';

/**
 * PerformanceMonitoringService
 * Tracks and analyzes performance metrics
 * Provides health checks and performance statistics
 */
class PerformanceMonitoringService {
  private metrics: Map<string, PerformanceMetric[]> = new Map();
  private thresholds: Map<string, number> = new Map();
  private maxMetricsPerName: number = 1000;

  constructor() {
    // Set default thresholds
    this.setThreshold('document_upload', 5000); // 5 seconds
    this.setThreshold('document_search', 1000); // 1 second
    this.setThreshold('semantic_search', 500); // 500ms
    this.setThreshold('note_generation', 10000); // 10 seconds
    this.setThreshold('api_response', 2000); // 2 seconds
  }

  /**
   * Record a performance metric
   */
  recordMetric(name: string, value: number, unit: string = 'ms'): void {
    const metric: PerformanceMetric = {
      name,
      value,
      unit,
      timestamp: new Date(),
    };

    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }

    const metricsList = this.metrics.get(name)!;
    metricsList.push(metric);

    // Keep only the last N metrics to prevent memory bloat
    if (metricsList.length > this.maxMetricsPerName) {
      metricsList.shift();
    }
  }

  /**
   * Get statistics for a metric
   */
  getMetricStats(name: string): PerformanceStats | null {
    const metricsList = this.metrics.get(name);

    if (!metricsList || metricsList.length === 0) {
      return null;
    }

    const values = metricsList.map(m => m.value).sort((a, b) => a - b);
    const count = values.length;

    return {
      p50: this.percentile(values, 50),
      p95: this.percentile(values, 95),
      p99: this.percentile(values, 99),
      min: Math.min(...values),
      max: Math.max(...values),
      average: values.reduce((a, b) => a + b, 0) / count,
      count,
    };
  }

  /**
   * Get all metric names
   */
  getMetricNames(): string[] {
    return Array.from(this.metrics.keys());
  }

  /**
   * Set performance threshold for a metric
   */
  setThreshold(name: string, thresholdMs: number): void {
    this.thresholds.set(name, thresholdMs);
  }

  /**
   * Get performance threshold for a metric
   */
  getThreshold(name: string): number | undefined {
    return this.thresholds.get(name);
  }

  /**
   * Check if a metric exceeds its threshold
   */
  exceedsThreshold(name: string, value: number): boolean {
    const threshold = this.thresholds.get(name);
    return threshold !== undefined && value > threshold;
  }

  /**
   * Get health check result
   */
  getHealthCheck(): HealthCheckResult {
    const issues: string[] = [];
    const metrics: Record<string, PerformanceStats> = {};

    for (const name of this.getMetricNames()) {
      const stats = this.getMetricStats(name);
      if (stats) {
        metrics[name] = stats;

        // Check if p95 exceeds threshold
        const threshold = this.thresholds.get(name);
        if (threshold && stats.p95 > threshold) {
          issues.push(`${name} p95 (${stats.p95.toFixed(2)}ms) exceeds threshold (${threshold}ms)`);
        }
      }
    }

    const status = issues.length === 0 ? 'healthy' : issues.length <= 2 ? 'degraded' : 'unhealthy';

    return {
      status,
      timestamp: new Date(),
      metrics,
      issues,
    };
  }

  /**
   * Clear all metrics
   */
  clearMetrics(): void {
    this.metrics.clear();
  }

  /**
   * Clear metrics for a specific name
   */
  clearMetric(name: string): void {
    this.metrics.delete(name);
  }

  /**
   * Get recent metrics
   */
  getRecentMetrics(name: string, count: number = 10): PerformanceMetric[] {
    const metricsList = this.metrics.get(name);

    if (!metricsList) {
      return [];
    }

    return metricsList.slice(-count);
  }

  /**
   * Get metrics within time range
   */
  getMetricsInRange(name: string, startTime: Date, endTime: Date): PerformanceMetric[] {
    const metricsList = this.metrics.get(name);

    if (!metricsList) {
      return [];
    }

    return metricsList.filter(m => m.timestamp >= startTime && m.timestamp <= endTime);
  }

  /**
   * Calculate percentile
   */
  private percentile(values: number[], p: number): number {
    if (values.length === 0) return 0;
    if (values.length === 1) return values[0];

    const index = (p / 100) * (values.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const weight = index % 1;

    if (lower === upper) {
      return values[lower];
    }

    return values[lower] * (1 - weight) + values[upper] * weight;
  }

  /**
   * Get trend analysis for a metric
   */
  getTrend(name: string, windowSize: number = 10): 'improving' | 'stable' | 'degrading' {
    const metricsList = this.metrics.get(name);

    if (!metricsList || metricsList.length < windowSize * 2) {
      return 'stable';
    }

    const recentValues = metricsList.slice(-windowSize).map(m => m.value);
    const olderValues = metricsList.slice(-windowSize * 2, -windowSize).map(m => m.value);

    const recentAvg = recentValues.reduce((a, b) => a + b, 0) / recentValues.length;
    const olderAvg = olderValues.reduce((a, b) => a + b, 0) / olderValues.length;

    const percentChange = ((recentAvg - olderAvg) / olderAvg) * 100;

    if (percentChange < -5) {
      return 'improving';
    } else if (percentChange > 5) {
      return 'degrading';
    } else {
      return 'stable';
    }
  }

  /**
   * Get summary statistics
   */
  getSummary(): Record<string, PerformanceStats> {
    const summary: Record<string, PerformanceStats> = {};

    for (const name of this.getMetricNames()) {
      const stats = this.getMetricStats(name);
      if (stats) {
        summary[name] = stats;
      }
    }

    return summary;
  }

  /**
   * Set max metrics per name
   */
  setMaxMetricsPerName(max: number): void {
    this.maxMetricsPerName = max;
  }

  /**
   * Get total metrics count
   */
  getTotalMetricsCount(): number {
    let total = 0;
    for (const metricsList of this.metrics.values()) {
      total += metricsList.length;
    }
    return total;
  }
}

export const performanceMonitoringService = new PerformanceMonitoringService();
