import { describe, it, expect, beforeEach } from 'vitest';
import { KnowledgeBaseAnalyticsService } from './knowledgeBaseAnalyticsService';

describe('KnowledgeBaseAnalyticsService', () => {
  let service: KnowledgeBaseAnalyticsService;

  beforeEach(() => {
    service = new KnowledgeBaseAnalyticsService();
  });

  describe('trackDocumentUsage', () => {
    it('should track document usage', async () => {
      await service.trackDocumentUsage('doc-1', 'PT', 'Daily', 'note-1');

      const stats = await service.getDocumentUsageStats('doc-1');
      expect(stats.totalUsages).toBe(1);
      expect(stats.usageByDiscipline['PT']).toBe(1);
      expect(stats.usageByDocumentType['Daily']).toBe(1);
      expect(stats.recentNotes).toContain('note-1');
    });

    it('should accumulate usage statistics', async () => {
      await service.trackDocumentUsage('doc-1', 'PT', 'Daily', 'note-1');
      await service.trackDocumentUsage('doc-1', 'PT', 'Progress', 'note-2');
      await service.trackDocumentUsage('doc-1', 'OT', 'Daily', 'note-3');

      const stats = await service.getDocumentUsageStats('doc-1');
      expect(stats.totalUsages).toBe(3);
      expect(stats.usageByDiscipline['PT']).toBe(2);
      expect(stats.usageByDiscipline['OT']).toBe(1);
      expect(stats.usageByDocumentType['Daily']).toBe(2);
      expect(stats.usageByDocumentType['Progress']).toBe(1);
    });

    it('should maintain recent notes list', async () => {
      for (let i = 1; i <= 15; i++) {
        await service.trackDocumentUsage('doc-1', 'PT', 'Daily', `note-${i}`);
      }

      const stats = await service.getDocumentUsageStats('doc-1');
      expect(stats.recentNotes.length).toBe(10);
      expect(stats.recentNotes[0]).toBe('note-15');
    });
  });

  describe('getPolicyAdoptionMetrics', () => {
    beforeEach(async () => {
      await service.trackDocumentUsage('doc-1', 'PT', 'Daily', 'note-1');
      await service.trackDocumentUsage('doc-1', 'PT', 'Daily', 'note-2');
      await service.trackDocumentUsage('doc-2', 'OT', 'Progress', 'note-3');
      // doc-3 has no usage
    });

    it('should calculate adoption metrics', async () => {
      const metrics = await service.getPolicyAdoptionMetrics();

      expect(metrics.totalPolicies).toBeGreaterThanOrEqual(0);
      expect(metrics.activePolicies).toBeGreaterThanOrEqual(0);
      expect(metrics.adoptionRate).toBeGreaterThanOrEqual(0);
      expect(metrics.adoptionRate).toBeLessThanOrEqual(100);
    });

    it('should identify top policies', async () => {
      const metrics = await service.getPolicyAdoptionMetrics();

      expect(Array.isArray(metrics.topPolicies)).toBe(true);
      if (metrics.topPolicies.length > 0) {
        expect(metrics.topPolicies[0].usages).toBeGreaterThanOrEqual(
          metrics.topPolicies[1]?.usages || 0
        );
      }
    });

    it('should identify unused policies', async () => {
      const metrics = await service.getPolicyAdoptionMetrics();

      expect(Array.isArray(metrics.unusedPolicies)).toBe(true);
    });
  });

  describe('getComplianceMetrics', () => {
    beforeEach(async () => {
      await service.recordComplianceScore('doc-1', 95);
      await service.recordComplianceScore('doc-2', 75);
      await service.recordComplianceScore('doc-3', 55);
    });

    it('should calculate compliance metrics', async () => {
      const metrics = await service.getComplianceMetrics();

      expect(metrics.averageComplianceScore).toBeGreaterThan(0);
      expect(metrics.documentsWithHighCompliance).toBeGreaterThanOrEqual(0);
      expect(metrics.documentsWithLowCompliance).toBeGreaterThanOrEqual(0);
      expect(metrics.criticalIssues).toBeGreaterThanOrEqual(0);
    });

    it('should identify high compliance documents', async () => {
      const metrics = await service.getComplianceMetrics();

      expect(metrics.documentsWithHighCompliance).toBe(1);
    });

    it('should identify low compliance documents', async () => {
      const metrics = await service.getComplianceMetrics();

      expect(metrics.documentsWithLowCompliance).toBe(1);
    });
  });

  describe('getTrendAnalysis', () => {
    beforeEach(async () => {
      await service.trackDocumentUsage('doc-1', 'PT', 'Daily', 'note-1');
      await service.trackDocumentUsage('doc-1', 'PT', 'Daily', 'note-2');
      await service.trackDocumentUsage('doc-2', 'OT', 'Progress', 'note-3');
      await service.trackDocumentUsage('doc-2', 'ST', 'Assessment', 'note-4');
    });

    it('should analyze trends', async () => {
      const analysis = await service.getTrendAnalysis(30);

      expect(analysis.period).toContain('30');
      expect(analysis.totalUsages).toBeGreaterThan(0);
      expect(analysis.averageDailyUsages).toBeGreaterThan(0);
      expect(analysis.trend).toBeDefined();
    });

    it('should identify top disciplines', async () => {
      const analysis = await service.getTrendAnalysis();

      expect(Array.isArray(analysis.topDisciplines)).toBe(true);
      if (analysis.topDisciplines.length > 0) {
        expect(analysis.topDisciplines[0].discipline).toBeDefined();
        expect(analysis.topDisciplines[0].usages).toBeGreaterThan(0);
      }
    });

    it('should identify top document types', async () => {
      const analysis = await service.getTrendAnalysis();

      expect(Array.isArray(analysis.topDocumentTypes)).toBe(true);
      if (analysis.topDocumentTypes.length > 0) {
        expect(analysis.topDocumentTypes[0].type).toBeDefined();
        expect(analysis.topDocumentTypes[0].usages).toBeGreaterThan(0);
      }
    });
  });

  describe('getUsageByDiscipline', () => {
    beforeEach(async () => {
      await service.trackDocumentUsage('doc-1', 'PT', 'Daily', 'note-1');
      await service.trackDocumentUsage('doc-1', 'PT', 'Daily', 'note-2');
      await service.trackDocumentUsage('doc-2', 'OT', 'Progress', 'note-3');
    });

    it('should return usage by discipline', async () => {
      const usage = await service.getUsageByDiscipline();

      expect(usage['PT']).toBe(2);
      expect(usage['OT']).toBe(1);
    });
  });

  describe('getUsageByDocumentType', () => {
    beforeEach(async () => {
      await service.trackDocumentUsage('doc-1', 'PT', 'Daily', 'note-1');
      await service.trackDocumentUsage('doc-1', 'PT', 'Daily', 'note-2');
      await service.trackDocumentUsage('doc-2', 'OT', 'Progress', 'note-3');
    });

    it('should return usage by document type', async () => {
      const usage = await service.getUsageByDocumentType();

      expect(usage['Daily']).toBe(2);
      expect(usage['Progress']).toBe(1);
    });
  });

  describe('getMostUsedDocuments', () => {
    beforeEach(async () => {
      await service.trackDocumentUsage('doc-1', 'PT', 'Daily', 'note-1');
      await service.trackDocumentUsage('doc-1', 'PT', 'Daily', 'note-2');
      await service.trackDocumentUsage('doc-2', 'OT', 'Progress', 'note-3');
    });

    it('should return most used documents', async () => {
      const docs = await service.getMostUsedDocuments(10);

      expect(Array.isArray(docs)).toBe(true);
      expect(docs[0].documentId).toBe('doc-1');
      expect(docs[0].usages).toBe(2);
    });
  });

  describe('getLeastUsedDocuments', () => {
    beforeEach(async () => {
      await service.trackDocumentUsage('doc-1', 'PT', 'Daily', 'note-1');
      await service.trackDocumentUsage('doc-1', 'PT', 'Daily', 'note-2');
      await service.trackDocumentUsage('doc-2', 'OT', 'Progress', 'note-3');
    });

    it('should return least used documents', async () => {
      const docs = await service.getLeastUsedDocuments(10);

      expect(Array.isArray(docs)).toBe(true);
      expect(docs[0].documentId).toBe('doc-2');
      expect(docs[0].usages).toBe(1);
    });
  });

  describe('recordAndGetComplianceScore', () => {
    it('should record and retrieve compliance score', async () => {
      await service.recordComplianceScore('doc-1', 85);

      const score = await service.getComplianceScore('doc-1');
      expect(score).toBe(85);
    });

    it('should return 0 for non-existent document', async () => {
      const score = await service.getComplianceScore('non-existent');
      expect(score).toBe(0);
    });
  });

  describe('generateAnalyticsReport', () => {
    beforeEach(async () => {
      await service.trackDocumentUsage('doc-1', 'PT', 'Daily', 'note-1');
      await service.recordComplianceScore('doc-1', 90);
    });

    it('should generate comprehensive analytics report', async () => {
      const report = await service.generateAnalyticsReport();

      expect(report.generatedAt).toBeDefined();
      expect(report.adoptionMetrics).toBeDefined();
      expect(report.complianceMetrics).toBeDefined();
      expect(report.trendAnalysis).toBeDefined();
      expect(report.usageByDiscipline).toBeDefined();
      expect(report.usageByDocumentType).toBeDefined();
      expect(report.mostUsedDocuments).toBeDefined();
      expect(report.leastUsedDocuments).toBeDefined();
    });
  });
});
