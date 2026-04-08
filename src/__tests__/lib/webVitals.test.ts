import { describe, it, expect, vi, beforeEach } from 'vitest';
import { initWebVitals, getWebVitalsSummary } from '../../lib/webVitals';

// Mock the monitoring service
vi.mock('../../lib/monitoring', () => ({
  monitoring: {
    recordMetric: vi.fn(),
    getMetricsSummary: vi.fn(() => ({
      'web-vital-cls': { count: 1, avg: 0.05, max: 0.05, min: 0.05 },
      'web-vital-fid': { count: 1, avg: 50, max: 50, min: 50 },
      'web-vital-fcp': { count: 1, avg: 1500, max: 1500, min: 1500 },
      'web-vital-lcp': { count: 1, avg: 2000, max: 2000, min: 2000 },
      'web-vital-ttfb': { count: 1, avg: 500, max: 500, min: 500 },
      'web-vital-inp': { count: 1, avg: 100, max: 100, min: 100 },
    })),
  },
}));

describe('Web Vitals', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('initWebVitals', () => {
    it('should initialize without errors', () => {
      expect(() => initWebVitals()).not.toThrow();
    });

    it('should accept callback function', () => {
      const callback = vi.fn();
      expect(() => initWebVitals(callback)).not.toThrow();
    });
  });

  describe('getWebVitalsSummary', () => {
    it('should return web vitals summary', () => {
      const summary = getWebVitalsSummary();

      expect(summary).toBeDefined();
      expect(summary.cls).toBeDefined();
      expect(summary.fid).toBeDefined();
      expect(summary.fcp).toBeDefined();
      expect(summary.lcp).toBeDefined();
      expect(summary.ttfb).toBeDefined();
      expect(summary.inp).toBeDefined();
    });

    it('should return correct metric values', () => {
      const summary = getWebVitalsSummary();

      expect(summary.cls.avg).toBe(0.05);
      expect(summary.fid.avg).toBe(50);
      expect(summary.fcp.avg).toBe(1500);
      expect(summary.lcp.avg).toBe(2000);
      expect(summary.ttfb.avg).toBe(500);
      expect(summary.inp.avg).toBe(100);
    });
  });
});
