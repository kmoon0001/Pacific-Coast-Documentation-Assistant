import { describe, it, expect, beforeEach, vi } from 'vitest';
import { monitoring } from '../../lib/monitoring';

describe('Monitoring Service', () => {
  beforeEach(() => {
    monitoring.clear();
  });

  describe('recordMetric', () => {
    it('should record a metric', () => {
      monitoring.recordMetric('test-metric', 100);

      const summary = monitoring.getMetricsSummary();
      expect(summary['test-metric']).toBeDefined();
      expect(summary['test-metric'].count).toBe(1);
      expect(summary['test-metric'].avg).toBe(100);
    });

    it('should record multiple metrics', () => {
      monitoring.recordMetric('test-metric', 100);
      monitoring.recordMetric('test-metric', 200);
      monitoring.recordMetric('test-metric', 300);

      const summary = monitoring.getMetricsSummary();
      expect(summary['test-metric'].count).toBe(3);
      expect(summary['test-metric'].avg).toBe(200);
      expect(summary['test-metric'].max).toBe(300);
      expect(summary['test-metric'].min).toBe(100);
    });

    it('should record metrics with tags', () => {
      monitoring.recordMetric('api-call', 150, { endpoint: '/api/notes' });

      const summary = monitoring.getMetricsSummary();
      expect(summary['api-call']).toBeDefined();
    });

    it('should warn on slow operations', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      monitoring.recordMetric('slow-operation', 2000);

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('captureError', () => {
    it('should capture an error', () => {
      const error = new Error('Test error');
      monitoring.captureError(error);

      const summary = monitoring.getErrorSummary();
      expect(summary['Test error']).toBe(1);
    });

    it('should capture error with context', () => {
      const error = new Error('Test error');
      monitoring.captureError(error, {
        type: 'api-error',
        severity: 'high',
        extra: { endpoint: '/api/test' },
      });

      const summary = monitoring.getErrorSummary();
      expect(summary['Test error']).toBe(1);
    });

    it('should log error to console', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const error = new Error('Test error');

      monitoring.captureError(error);

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('trackAPICall', () => {
    it('should track successful API call', () => {
      monitoring.trackAPICall('/api/notes', 150, 200);

      const summary = monitoring.getMetricsSummary();
      expect(summary['api-call']).toBeDefined();
      expect(summary['api-call'].count).toBe(1);
    });

    it('should track failed API call', () => {
      monitoring.trackAPICall('/api/notes', 150, 500);

      const summary = monitoring.getMetricsSummary();
      expect(summary['api-error']).toBeDefined();
      expect(summary['api-error'].count).toBe(1);
    });
  });

  describe('trackInteraction', () => {
    it('should track user interaction', () => {
      monitoring.trackInteraction('button-click', 50);

      const summary = monitoring.getMetricsSummary();
      expect(summary['user-interaction']).toBeDefined();
    });
  });

  describe('getMetricsSummary', () => {
    it('should return empty summary when no metrics', () => {
      const summary = monitoring.getMetricsSummary();
      expect(Object.keys(summary).length).toBe(0);
    });

    it('should calculate correct statistics', () => {
      monitoring.recordMetric('test', 100);
      monitoring.recordMetric('test', 200);
      monitoring.recordMetric('test', 300);

      const summary = monitoring.getMetricsSummary();
      expect(summary['test'].count).toBe(3);
      expect(summary['test'].avg).toBe(200);
      expect(summary['test'].max).toBe(300);
      expect(summary['test'].min).toBe(100);
    });
  });

  describe('getErrorSummary', () => {
    it('should return empty summary when no errors', () => {
      const summary = monitoring.getErrorSummary();
      expect(Object.keys(summary).length).toBe(0);
    });

    it('should count duplicate errors', () => {
      monitoring.captureError(new Error('Same error'));
      monitoring.captureError(new Error('Same error'));
      monitoring.captureError(new Error('Different error'));

      const summary = monitoring.getErrorSummary();
      expect(summary['Same error']).toBe(2);
      expect(summary['Different error']).toBe(1);
    });
  });

  describe('clear', () => {
    it('should clear all metrics and errors', () => {
      monitoring.recordMetric('test', 100);
      monitoring.captureError(new Error('Test'));

      monitoring.clear();

      const metricsSummary = monitoring.getMetricsSummary();
      const errorSummary = monitoring.getErrorSummary();

      expect(Object.keys(metricsSummary).length).toBe(0);
      expect(Object.keys(errorSummary).length).toBe(0);
    });
  });

  describe('exportData', () => {
    it('should export all data', () => {
      monitoring.recordMetric('test', 100);
      monitoring.captureError(new Error('Test'));

      const data = monitoring.exportData();

      expect(data.metrics).toBeDefined();
      expect(data.errors).toBeDefined();
      expect(data.summary).toBeDefined();
      expect(data.errorSummary).toBeDefined();
      expect(data.timestamp).toBeDefined();
    });
  });
});
