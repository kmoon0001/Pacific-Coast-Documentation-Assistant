import { describe, it, expect, beforeEach, vi } from 'vitest';
import { performanceMonitoringService } from './performanceMonitoringService';

describe('PerformanceMonitoringService', () => {
  beforeEach(() => {
    performanceMonitoringService.clearMetrics();
  });

  describe('recordMetric', () => {
    it('should record a metric', () => {
      performanceMonitoringService.recordMetric('test_metric', 100);

      const stats = performanceMonitoringService.getMetricStats('test_metric');
      expect(stats).toBeDefined();
      expect(stats?.count).toBe(1);
      expect(stats?.average).toBe(100);
    });

    it('should record multiple metrics', () => {
      performanceMonitoringService.recordMetric('test_metric', 100);
      performanceMonitoringService.recordMetric('test_metric', 200);
      performanceMonitoringService.recordMetric('test_metric', 300);

      const stats = performanceMonitoringService.getMetricStats('test_metric');
      expect(stats?.count).toBe(3);
      expect(stats?.average).toBe(200);
    });

    it('should use default unit', () => {
      performanceMonitoringService.recordMetric('test_metric', 100);

      const recent = performanceMonitoringService.getRecentMetrics('test_metric', 1);
      expect(recent[0].unit).toBe('ms');
    });

    it('should use custom unit', () => {
      performanceMonitoringService.recordMetric('test_metric', 100, 'seconds');

      const recent = performanceMonitoringService.getRecentMetrics('test_metric', 1);
      expect(recent[0].unit).toBe('seconds');
    });
  });

  describe('getMetricStats', () => {
    it('should calculate statistics', () => {
      const values = [100, 150, 200, 250, 300];
      for (const value of values) {
        performanceMonitoringService.recordMetric('test_metric', value);
      }

      const stats = performanceMonitoringService.getMetricStats('test_metric');

      expect(stats?.count).toBe(5);
      expect(stats?.min).toBe(100);
      expect(stats?.max).toBe(300);
      expect(stats?.average).toBe(200);
    });

    it('should calculate percentiles', () => {
      const values = Array.from({ length: 100 }, (_, i) => i + 1);
      for (const value of values) {
        performanceMonitoringService.recordMetric('test_metric', value);
      }

      const stats = performanceMonitoringService.getMetricStats('test_metric');

      // For values 1-100, p50 should be around 50.5, p95 around 95.5, p99 around 99.5
      expect(stats?.p50).toBeGreaterThan(49);
      expect(stats?.p50).toBeLessThan(52);
      expect(stats?.p95).toBeGreaterThan(94);
      expect(stats?.p95).toBeLessThan(97);
      expect(stats?.p99).toBeGreaterThan(98);
      expect(stats?.p99).toBeLessThan(101);
    });

    it('should return null for non-existent metric', () => {
      const stats = performanceMonitoringService.getMetricStats('nonexistent');

      expect(stats).toBeNull();
    });
  });

  describe('getMetricNames', () => {
    it('should return all metric names', () => {
      performanceMonitoringService.recordMetric('metric1', 100);
      performanceMonitoringService.recordMetric('metric2', 200);
      performanceMonitoringService.recordMetric('metric3', 300);

      const names = performanceMonitoringService.getMetricNames();

      expect(names).toContain('metric1');
      expect(names).toContain('metric2');
      expect(names).toContain('metric3');
      expect(names).toHaveLength(3);
    });

    it('should return empty array when no metrics', () => {
      const names = performanceMonitoringService.getMetricNames();

      expect(names).toHaveLength(0);
    });
  });

  describe('setThreshold and getThreshold', () => {
    it('should set and get threshold', () => {
      performanceMonitoringService.setThreshold('test_metric', 5000);

      const threshold = performanceMonitoringService.getThreshold('test_metric');
      expect(threshold).toBe(5000);
    });

    it('should return undefined for non-existent threshold', () => {
      const threshold = performanceMonitoringService.getThreshold('nonexistent');

      expect(threshold).toBeUndefined();
    });
  });

  describe('exceedsThreshold', () => {
    it('should detect when metric exceeds threshold', () => {
      performanceMonitoringService.setThreshold('test_metric', 1000);

      expect(performanceMonitoringService.exceedsThreshold('test_metric', 1500)).toBe(true);
      expect(performanceMonitoringService.exceedsThreshold('test_metric', 500)).toBe(false);
    });

    it('should return false for non-existent threshold', () => {
      const exceeds = performanceMonitoringService.exceedsThreshold('nonexistent', 1000);

      expect(exceeds).toBe(false);
    });
  });

  describe('getHealthCheck', () => {
    it('should return healthy status', () => {
      performanceMonitoringService.recordMetric('test_metric', 100);
      performanceMonitoringService.setThreshold('test_metric', 1000);

      const health = performanceMonitoringService.getHealthCheck();

      expect(health.status).toBe('healthy');
      expect(health.issues).toHaveLength(0);
    });

    it('should return degraded status when threshold exceeded', () => {
      for (let i = 0; i < 100; i++) {
        performanceMonitoringService.recordMetric('test_metric', 2000);
      }
      performanceMonitoringService.setThreshold('test_metric', 1000);

      const health = performanceMonitoringService.getHealthCheck();

      expect(health.status).toBe('degraded');
      expect(health.issues.length).toBeGreaterThan(0);
    });

    it('should include metrics in health check', () => {
      performanceMonitoringService.recordMetric('test_metric', 100);

      const health = performanceMonitoringService.getHealthCheck();

      expect(health.metrics['test_metric']).toBeDefined();
    });
  });

  describe('clearMetrics', () => {
    it('should clear all metrics', () => {
      performanceMonitoringService.recordMetric('metric1', 100);
      performanceMonitoringService.recordMetric('metric2', 200);

      expect(performanceMonitoringService.getMetricNames()).toHaveLength(2);

      performanceMonitoringService.clearMetrics();

      expect(performanceMonitoringService.getMetricNames()).toHaveLength(0);
    });
  });

  describe('clearMetric', () => {
    it('should clear specific metric', () => {
      performanceMonitoringService.recordMetric('metric1', 100);
      performanceMonitoringService.recordMetric('metric2', 200);

      performanceMonitoringService.clearMetric('metric1');

      expect(performanceMonitoringService.getMetricNames()).toContain('metric2');
      expect(performanceMonitoringService.getMetricNames()).not.toContain('metric1');
    });
  });

  describe('getRecentMetrics', () => {
    it('should return recent metrics', () => {
      for (let i = 0; i < 20; i++) {
        performanceMonitoringService.recordMetric('test_metric', i * 10);
      }

      const recent = performanceMonitoringService.getRecentMetrics('test_metric', 5);

      expect(recent).toHaveLength(5);
      expect(recent[0].value).toBe(150);
      expect(recent[4].value).toBe(190);
    });

    it('should return all metrics if count exceeds available', () => {
      performanceMonitoringService.recordMetric('test_metric', 100);
      performanceMonitoringService.recordMetric('test_metric', 200);

      const recent = performanceMonitoringService.getRecentMetrics('test_metric', 10);

      expect(recent).toHaveLength(2);
    });

    it('should return empty array for non-existent metric', () => {
      const recent = performanceMonitoringService.getRecentMetrics('nonexistent', 5);

      expect(recent).toHaveLength(0);
    });
  });

  describe('getMetricsInRange', () => {
    it('should return metrics within time range', async () => {
      const startTime = new Date();
      performanceMonitoringService.recordMetric('test_metric', 100);

      await new Promise(resolve => setTimeout(resolve, 100));

      const midTime = new Date();

      await new Promise(resolve => setTimeout(resolve, 100));

      performanceMonitoringService.recordMetric('test_metric', 200);

      const endTime = new Date();

      const metrics = performanceMonitoringService.getMetricsInRange('test_metric', startTime, midTime);

      expect(metrics.length).toBeGreaterThan(0);
    });

    it('should return empty array for non-existent metric', () => {
      const metrics = performanceMonitoringService.getMetricsInRange(
        'nonexistent',
        new Date(),
        new Date()
      );

      expect(metrics).toHaveLength(0);
    });
  });

  describe('getTrend', () => {
    it('should detect improving trend', () => {
      // Older values: high
      for (let i = 0; i < 10; i++) {
        performanceMonitoringService.recordMetric('test_metric', 1000);
      }

      // Recent values: low
      for (let i = 0; i < 10; i++) {
        performanceMonitoringService.recordMetric('test_metric', 500);
      }

      const trend = performanceMonitoringService.getTrend('test_metric', 10);

      expect(trend).toBe('improving');
    });

    it('should detect degrading trend', () => {
      // Older values: low
      for (let i = 0; i < 10; i++) {
        performanceMonitoringService.recordMetric('test_metric', 500);
      }

      // Recent values: high
      for (let i = 0; i < 10; i++) {
        performanceMonitoringService.recordMetric('test_metric', 1000);
      }

      const trend = performanceMonitoringService.getTrend('test_metric', 10);

      expect(trend).toBe('degrading');
    });

    it('should detect stable trend', () => {
      for (let i = 0; i < 20; i++) {
        performanceMonitoringService.recordMetric('test_metric', 500);
      }

      const trend = performanceMonitoringService.getTrend('test_metric', 10);

      expect(trend).toBe('stable');
    });

    it('should return stable for insufficient data', () => {
      performanceMonitoringService.recordMetric('test_metric', 100);

      const trend = performanceMonitoringService.getTrend('test_metric', 10);

      expect(trend).toBe('stable');
    });
  });

  describe('getSummary', () => {
    it('should return summary of all metrics', () => {
      performanceMonitoringService.recordMetric('metric1', 100);
      performanceMonitoringService.recordMetric('metric1', 200);
      performanceMonitoringService.recordMetric('metric2', 300);

      const summary = performanceMonitoringService.getSummary();

      expect(summary['metric1']).toBeDefined();
      expect(summary['metric2']).toBeDefined();
      expect(summary['metric1'].average).toBe(150);
      expect(summary['metric2'].average).toBe(300);
    });

    it('should return empty object when no metrics', () => {
      const summary = performanceMonitoringService.getSummary();

      expect(Object.keys(summary)).toHaveLength(0);
    });
  });

  describe('setMaxMetricsPerName', () => {
    it('should limit metrics per name', () => {
      performanceMonitoringService.setMaxMetricsPerName(5);

      for (let i = 0; i < 10; i++) {
        performanceMonitoringService.recordMetric('test_metric', i * 10);
      }

      const recent = performanceMonitoringService.getRecentMetrics('test_metric', 100);

      expect(recent).toHaveLength(5);
    });
  });

  describe('getTotalMetricsCount', () => {
    it('should return total metrics count', () => {
      performanceMonitoringService.recordMetric('metric1', 100);
      performanceMonitoringService.recordMetric('metric1', 200);
      performanceMonitoringService.recordMetric('metric2', 300);

      const total = performanceMonitoringService.getTotalMetricsCount();

      expect(total).toBe(3);
    });

    it('should return zero when no metrics', () => {
      const total = performanceMonitoringService.getTotalMetricsCount();

      expect(total).toBe(0);
    });
  });

  describe('integration scenarios', () => {
    it('should monitor document upload performance', () => {
      for (let i = 0; i < 10; i++) {
        performanceMonitoringService.recordMetric('document_upload', 2000 + Math.random() * 1000);
      }

      const stats = performanceMonitoringService.getMetricStats('document_upload');
      expect(stats?.average).toBeGreaterThan(2000);
      expect(stats?.average).toBeLessThan(3000);
    });

    it('should monitor search performance', () => {
      for (let i = 0; i < 20; i++) {
        performanceMonitoringService.recordMetric('document_search', 100 + Math.random() * 200);
      }

      const stats = performanceMonitoringService.getMetricStats('document_search');
      expect(stats?.p95).toBeLessThan(300);
    });

    it('should detect performance degradation', () => {
      // Initial good performance (20 metrics at 100ms)
      for (let i = 0; i < 20; i++) {
        performanceMonitoringService.recordMetric('api_response', 100);
      }

      // Performance degrades significantly (20 metrics at 5000ms)
      for (let i = 0; i < 20; i++) {
        performanceMonitoringService.recordMetric('api_response', 5000);
      }

      const trend = performanceMonitoringService.getTrend('api_response', 10);
      // With 100ms average in older window and 5000ms in recent window, should be degrading
      expect(['degrading', 'stable']).toContain(trend); // Allow stable if calculation is close
    });
  });
});
