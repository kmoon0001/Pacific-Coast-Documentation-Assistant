import { UsageStats } from '../types';

/**
 * Service for analytics and reporting on knowledge base usage
 */
export class KnowledgeBaseAnalyticsService {
  private usageData: Map<string, UsageStats> = new Map();
  private complianceData: Map<string, number> = new Map();

  /**
   * Get document usage statistics
   */
  async getDocumentUsageStats(documentId: string): Promise<UsageStats> {
    return (
      this.usageData.get(documentId) || {
        documentId,
        totalUsages: 0,
        usageByDiscipline: {},
        usageByDocumentType: {},
        recentNotes: [],
      }
    );
  }

  /**
   * Track document usage
   */
  async trackDocumentUsage(
    documentId: string,
    discipline: string,
    documentType: string,
    noteId: string
  ): Promise<void> {
    const stats = this.usageData.get(documentId) || {
      documentId,
      totalUsages: 0,
      usageByDiscipline: {},
      usageByDocumentType: {},
      recentNotes: [],
      lastUsed: new Date(),
    };

    stats.totalUsages++;
    stats.lastUsed = new Date();
    stats.usageByDiscipline[discipline] = (stats.usageByDiscipline[discipline] || 0) + 1;
    stats.usageByDocumentType[documentType] = (stats.usageByDocumentType[documentType] || 0) + 1;
    stats.recentNotes = [noteId, ...stats.recentNotes.slice(0, 9)];

    this.usageData.set(documentId, stats);
  }

  /**
   * Get policy adoption metrics
   */
  async getPolicyAdoptionMetrics(_organizationId?: string): Promise<{
    totalPolicies: number;
    activePolicies: number;
    adoptionRate: number;
    averageUsagePerPolicy: number;
    topPolicies: Array<{ documentId: string; usages: number }>;
    unusedPolicies: string[];
  }> {
    const allStats = Array.from(this.usageData.values());
    const totalPolicies = allStats.length;
    const activePolicies = allStats.filter((s) => s.totalUsages > 0).length;
    const adoptionRate = totalPolicies > 0 ? (activePolicies / totalPolicies) * 100 : 0;
    const totalUsages = allStats.reduce((sum, s) => sum + s.totalUsages, 0);
    const averageUsagePerPolicy = totalPolicies > 0 ? totalUsages / totalPolicies : 0;

    const topPolicies = allStats
      .sort((a, b) => b.totalUsages - a.totalUsages)
      .slice(0, 10)
      .map((s) => ({ documentId: s.documentId, usages: s.totalUsages }));

    const unusedPolicies = allStats.filter((s) => s.totalUsages === 0).map((s) => s.documentId);

    return {
      totalPolicies,
      activePolicies,
      adoptionRate,
      averageUsagePerPolicy,
      topPolicies,
      unusedPolicies,
    };
  }

  /**
   * Get compliance metrics
   */
  async getComplianceMetrics(): Promise<{
    averageComplianceScore: number;
    documentsWithHighCompliance: number;
    documentsWithLowCompliance: number;
    complianceTrend: 'improving' | 'stable' | 'declining';
    criticalIssues: number;
  }> {
    const scores = Array.from(this.complianceData.values());
    const averageComplianceScore =
      scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    const documentsWithHighCompliance = scores.filter((s) => s >= 80).length;
    const documentsWithLowCompliance = scores.filter((s) => s < 60).length;

    return {
      averageComplianceScore,
      documentsWithHighCompliance,
      documentsWithLowCompliance,
      complianceTrend: 'stable',
      criticalIssues: documentsWithLowCompliance,
    };
  }

  /**
   * Get trend analysis
   */
  async getTrendAnalysis(days: number = 30): Promise<{
    period: string;
    totalUsages: number;
    averageDailyUsages: number;
    peakUsageDay: string;
    trend: 'increasing' | 'decreasing' | 'stable';
    topDisciplines: Array<{ discipline: string; usages: number }>;
    topDocumentTypes: Array<{ type: string; usages: number }>;
  }> {
    const allStats = Array.from(this.usageData.values());
    const totalUsages = allStats.reduce((sum, s) => sum + s.totalUsages, 0);
    const averageDailyUsages = days > 0 ? totalUsages / days : 0;

    // Aggregate discipline and document type usage
    const disciplineUsage: Record<string, number> = {};
    const documentTypeUsage: Record<string, number> = {};

    for (const stats of allStats) {
      for (const [discipline, count] of Object.entries(stats.usageByDiscipline)) {
        disciplineUsage[discipline] = (disciplineUsage[discipline] || 0) + count;
      }
      for (const [type, count] of Object.entries(stats.usageByDocumentType)) {
        documentTypeUsage[type] = (documentTypeUsage[type] || 0) + count;
      }
    }

    const topDisciplines = Object.entries(disciplineUsage)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([discipline, usages]) => ({ discipline, usages }));

    const topDocumentTypes = Object.entries(documentTypeUsage)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([type, usages]) => ({ type, usages }));

    return {
      period: `Last ${days} days`,
      totalUsages,
      averageDailyUsages,
      peakUsageDay: new Date().toISOString().split('T')[0],
      trend: 'stable',
      topDisciplines,
      topDocumentTypes,
    };
  }

  /**
   * Get usage by discipline
   */
  async getUsageByDiscipline(): Promise<Record<string, number>> {
    const usage: Record<string, number> = {};
    for (const stats of this.usageData.values()) {
      for (const [discipline, count] of Object.entries(stats.usageByDiscipline)) {
        usage[discipline] = (usage[discipline] || 0) + count;
      }
    }
    return usage;
  }

  /**
   * Get usage by document type
   */
  async getUsageByDocumentType(): Promise<Record<string, number>> {
    const usage: Record<string, number> = {};
    for (const stats of this.usageData.values()) {
      for (const [type, count] of Object.entries(stats.usageByDocumentType)) {
        usage[type] = (usage[type] || 0) + count;
      }
    }
    return usage;
  }

  /**
   * Get most used documents
   */
  async getMostUsedDocuments(
    limit: number = 10
  ): Promise<Array<{ documentId: string; usages: number }>> {
    return Array.from(this.usageData.values())
      .sort((a, b) => b.totalUsages - a.totalUsages)
      .slice(0, limit)
      .map((s) => ({ documentId: s.documentId, usages: s.totalUsages }));
  }

  /**
   * Get least used documents
   */
  async getLeastUsedDocuments(
    limit: number = 10
  ): Promise<Array<{ documentId: string; usages: number }>> {
    return Array.from(this.usageData.values())
      .sort((a, b) => a.totalUsages - b.totalUsages)
      .slice(0, limit)
      .map((s) => ({ documentId: s.documentId, usages: s.totalUsages }));
  }

  /**
   * Record compliance score
   */
  async recordComplianceScore(documentId: string, score: number): Promise<void> {
    this.complianceData.set(documentId, score);
  }

  /**
   * Get compliance score
   */
  async getComplianceScore(documentId: string): Promise<number> {
    return this.complianceData.get(documentId) || 0;
  }

  /**
   * Generate analytics report
   */
  async generateAnalyticsReport(): Promise<{
    generatedAt: Date;
    adoptionMetrics: any;
    complianceMetrics: any;
    trendAnalysis: any;
    usageByDiscipline: Record<string, number>;
    usageByDocumentType: Record<string, number>;
    mostUsedDocuments: Array<{ documentId: string; usages: number }>;
    leastUsedDocuments: Array<{ documentId: string; usages: number }>;
  }> {
    return {
      generatedAt: new Date(),
      adoptionMetrics: await this.getPolicyAdoptionMetrics(),
      complianceMetrics: await this.getComplianceMetrics(),
      trendAnalysis: await this.getTrendAnalysis(),
      usageByDiscipline: await this.getUsageByDiscipline(),
      usageByDocumentType: await this.getUsageByDocumentType(),
      mostUsedDocuments: await this.getMostUsedDocuments(),
      leastUsedDocuments: await this.getLeastUsedDocuments(),
    };
  }
}

export const knowledgeBaseAnalyticsService = new KnowledgeBaseAnalyticsService();
