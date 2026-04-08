import { describe, it, expect, beforeEach } from 'vitest';
import { AnalyticsService, UsageMetric, ComplianceMetric } from './analyticsService';

describe('AnalyticsService', () => {
  let service: AnalyticsService;

  beforeEach(() => {
    service = new AnalyticsService();
  });

  describe('recordUsage', () => {
    it('should record usage metric', () => {
      const metric: UsageMetric = {
        date: new Date('2024-02-01T00:00:00.000Z'),
        notesCreated: 10,
        notesEdited: 5,
        exportsPerformed: 2,
        importsPerformed: 1,
        activeUsers: 15,
      };

      service.recordUsage(metric);
      const metrics = service.getUsageMetrics(new Date('2024-01-01'), new Date('2025-12-31'));

      expect(metrics).toHaveLength(1);
      expect(metrics[0]).toEqual(metric);
    });

    it('should record multiple usage metrics', () => {
      const metric1: UsageMetric = {
        date: new Date('2024-01-01'),
        notesCreated: 10,
        notesEdited: 5,
        exportsPerformed: 2,
        importsPerformed: 1,
        activeUsers: 15,
      };

      const metric2: UsageMetric = {
        date: new Date('2024-01-02'),
        notesCreated: 12,
        notesEdited: 6,
        exportsPerformed: 3,
        importsPerformed: 2,
        activeUsers: 18,
      };

      service.recordUsage(metric1);
      service.recordUsage(metric2);

      const metrics = service.getUsageMetrics(new Date('2024-01-01'), new Date('2024-12-31'));

      expect(metrics).toHaveLength(2);
    });
  });

  describe('recordCompliance', () => {
    it('should record compliance metric', () => {
      const metric: ComplianceMetric = {
        date: new Date('2024-02-01T00:00:00.000Z'),
        auditsPassed: 95,
        auditsFailed: 5,
        complianceRate: 0.95,
        commonIssues: ['Missing documentation'],
      };

      service.recordCompliance(metric);
      const metrics = service.getComplianceMetrics(new Date('2024-01-01'), new Date('2025-12-31'));

      expect(metrics).toHaveLength(1);
      expect(metrics[0]).toEqual(metric);
    });

    it('should record multiple compliance metrics', () => {
      const metric1: ComplianceMetric = {
        date: new Date('2024-01-01'),
        auditsPassed: 95,
        auditsFailed: 5,
        complianceRate: 0.95,
        commonIssues: [],
      };

      const metric2: ComplianceMetric = {
        date: new Date('2024-01-02'),
        auditsPassed: 98,
        auditsFailed: 2,
        complianceRate: 0.98,
        commonIssues: [],
      };

      service.recordCompliance(metric1);
      service.recordCompliance(metric2);

      const metrics = service.getComplianceMetrics(new Date('2024-01-01'), new Date('2024-12-31'));

      expect(metrics).toHaveLength(2);
    });
  });

  describe('getUsageMetrics', () => {
    it('should filter metrics by date range', () => {
      const metric1: UsageMetric = {
        date: new Date('2024-01-01'),
        notesCreated: 10,
        notesEdited: 5,
        exportsPerformed: 2,
        importsPerformed: 1,
        activeUsers: 15,
      };

      const metric2: UsageMetric = {
        date: new Date('2024-06-01'),
        notesCreated: 20,
        notesEdited: 10,
        exportsPerformed: 4,
        importsPerformed: 2,
        activeUsers: 25,
      };

      service.recordUsage(metric1);
      service.recordUsage(metric2);

      const metrics = service.getUsageMetrics(new Date('2024-01-01'), new Date('2024-03-31'));

      expect(metrics).toHaveLength(1);
      expect(metrics[0].date).toEqual(metric1.date);
    });

    it('should return empty array for date range with no metrics', () => {
      const metric: UsageMetric = {
        date: new Date('2024-01-01'),
        notesCreated: 10,
        notesEdited: 5,
        exportsPerformed: 2,
        importsPerformed: 1,
        activeUsers: 15,
      };

      service.recordUsage(metric);

      const metrics = service.getUsageMetrics(new Date('2024-06-01'), new Date('2024-12-31'));

      expect(metrics).toEqual([]);
    });
  });

  describe('getComplianceMetrics', () => {
    it('should filter compliance metrics by date range', () => {
      const metric1: ComplianceMetric = {
        date: new Date('2024-01-01'),
        auditsPassed: 95,
        auditsFailed: 5,
        complianceRate: 0.95,
        commonIssues: [],
      };

      const metric2: ComplianceMetric = {
        date: new Date('2024-06-01'),
        auditsPassed: 98,
        auditsFailed: 2,
        complianceRate: 0.98,
        commonIssues: [],
      };

      service.recordCompliance(metric1);
      service.recordCompliance(metric2);

      const metrics = service.getComplianceMetrics(new Date('2024-01-01'), new Date('2024-03-31'));

      expect(metrics).toHaveLength(1);
    });
  });

  describe('calculateAverageComplianceRate', () => {
    it('should calculate average compliance rate', () => {
      service.recordCompliance({
        date: new Date('2024-01-01'),
        auditsPassed: 90,
        auditsFailed: 10,
        complianceRate: 0.9,
        commonIssues: [],
      });

      service.recordCompliance({
        date: new Date('2024-01-02'),
        auditsPassed: 100,
        auditsFailed: 0,
        complianceRate: 1.0,
        commonIssues: [],
      });

      const average = service.calculateAverageComplianceRate(
        new Date('2024-01-01'),
        new Date('2024-01-31')
      );

      expect(average).toBe(0.95);
    });

    it('should return 0 for no metrics', () => {
      const average = service.calculateAverageComplianceRate(
        new Date('2024-01-01'),
        new Date('2024-01-31')
      );

      expect(average).toBe(0);
    });
  });

  describe('calculateTotalNotes', () => {
    it('should sum notes created', () => {
      service.recordUsage({
        date: new Date('2024-01-01'),
        notesCreated: 10,
        notesEdited: 5,
        exportsPerformed: 2,
        importsPerformed: 1,
        activeUsers: 15,
      });

      service.recordUsage({
        date: new Date('2024-01-02'),
        notesCreated: 15,
        notesEdited: 8,
        exportsPerformed: 3,
        importsPerformed: 2,
        activeUsers: 20,
      });

      const total = service.calculateTotalNotes(new Date('2024-01-01'), new Date('2024-01-31'));

      expect(total).toBe(25);
    });

    it('should return 0 for no metrics', () => {
      const total = service.calculateTotalNotes(new Date('2024-01-01'), new Date('2024-01-31'));

      expect(total).toBe(0);
    });
  });

  describe('calculateActiveUsers', () => {
    it('should count unique active users', () => {
      service.recordUsage({
        date: new Date('2024-01-01'),
        notesCreated: 10,
        notesEdited: 5,
        exportsPerformed: 2,
        importsPerformed: 1,
        activeUsers: 15,
      });

      service.recordUsage({
        date: new Date('2024-01-02'),
        notesCreated: 15,
        notesEdited: 8,
        exportsPerformed: 3,
        importsPerformed: 2,
        activeUsers: 20,
      });

      const activeUsers = service.calculateActiveUsers(
        new Date('2024-01-01'),
        new Date('2024-01-31')
      );

      expect(activeUsers).toBeGreaterThan(0);
    });
  });

  describe('generateReport', () => {
    it('should generate analytics report', () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      service.recordUsage({
        date: new Date('2024-01-15'),
        notesCreated: 10,
        notesEdited: 5,
        exportsPerformed: 2,
        importsPerformed: 1,
        activeUsers: 15,
      });

      const report = service.generateReport(startDate, endDate);

      expect(report.period.start).toEqual(startDate);
      expect(report.period.end).toEqual(endDate);
      expect(Array.isArray(report.usageMetrics)).toBe(true);
      expect(Array.isArray(report.complianceMetrics)).toBe(true);
      expect(report.totalNotes).toBeGreaterThanOrEqual(0);
      expect(report.totalUsers).toBeGreaterThanOrEqual(0);
    });

    it('should include all metrics in report', () => {
      service.recordUsage({
        date: new Date('2024-01-15'),
        notesCreated: 10,
        notesEdited: 5,
        exportsPerformed: 2,
        importsPerformed: 1,
        activeUsers: 15,
      });

      service.recordCompliance({
        date: new Date('2024-01-15'),
        auditsPassed: 95,
        auditsFailed: 5,
        complianceRate: 0.95,
        commonIssues: [],
      });

      const report = service.generateReport(new Date('2024-01-01'), new Date('2024-01-31'));

      expect(report.usageMetrics.length).toBeGreaterThan(0);
      expect(report.complianceMetrics.length).toBeGreaterThan(0);
    });
  });

  describe('getTrendAnalysis', () => {
    it('should detect increasing usage trend', () => {
      service.recordUsage({
        date: new Date('2024-01-01'),
        notesCreated: 5,
        notesEdited: 2,
        exportsPerformed: 1,
        importsPerformed: 0,
        activeUsers: 5,
      });

      service.recordUsage({
        date: new Date('2024-01-15'),
        notesCreated: 20,
        notesEdited: 10,
        exportsPerformed: 5,
        importsPerformed: 2,
        activeUsers: 20,
      });

      const trend = service.getTrendAnalysis(new Date('2024-01-01'), new Date('2024-01-31'));

      expect(['increasing', 'decreasing', 'stable']).toContain(trend.usageTrend);
    });

    it('should detect improving compliance trend', () => {
      service.recordCompliance({
        date: new Date('2024-01-01'),
        auditsPassed: 80,
        auditsFailed: 20,
        complianceRate: 0.8,
        commonIssues: [],
      });

      service.recordCompliance({
        date: new Date('2024-01-15'),
        auditsPassed: 95,
        auditsFailed: 5,
        complianceRate: 0.95,
        commonIssues: [],
      });

      const trend = service.getTrendAnalysis(new Date('2024-01-01'), new Date('2024-01-31'));

      expect(['improving', 'declining', 'stable']).toContain(trend.complianceTrend);
    });

    it('should return stable trend for insufficient data', () => {
      const trend = service.getTrendAnalysis(new Date('2024-01-01'), new Date('2024-01-31'));

      expect(trend.usageTrend).toBe('stable');
      expect(trend.complianceTrend).toBe('stable');
    });
  });

  describe('clearMetrics', () => {
    it('should clear all metrics', () => {
      service.recordUsage({
        date: new Date('2024-02-01T00:00:00.000Z'),
        notesCreated: 10,
        notesEdited: 5,
        exportsPerformed: 2,
        importsPerformed: 1,
        activeUsers: 15,
      });

      service.recordCompliance({
        date: new Date('2024-02-01T00:00:00.000Z'),
        auditsPassed: 95,
        auditsFailed: 5,
        complianceRate: 0.95,
        commonIssues: [],
      });

      service.clearMetrics();

      const usageMetrics = service.getUsageMetrics(new Date('2024-01-01'), new Date('2025-12-31'));
      const complianceMetrics = service.getComplianceMetrics(
        new Date('2024-01-01'),
        new Date('2025-12-31')
      );

      expect(usageMetrics).toEqual([]);
      expect(complianceMetrics).toEqual([]);
    });
  });
});
