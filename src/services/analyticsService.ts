import { logger } from '../lib/logger';

export interface UsageMetric {
  date: Date;
  notesCreated: number;
  notesEdited: number;
  exportsPerformed: number;
  importsPerformed: number;
  activeUsers: number;
}

export interface ComplianceMetric {
  date: Date;
  auditsPassed: number;
  auditsFailed: number;
  complianceRate: number;
  commonIssues: string[];
}

export interface AnalyticsReport {
  period: { start: Date; end: Date };
  usageMetrics: UsageMetric[];
  complianceMetrics: ComplianceMetric[];
  totalNotes: number;
  totalUsers: number;
  averageNoteLength: number;
  topDisciplines: { discipline: string; count: number }[];
}

export class AnalyticsService {
  private usageMetrics: UsageMetric[] = [];
  private complianceMetrics: ComplianceMetric[] = [];

  recordUsage(metric: UsageMetric): void {
    this.usageMetrics.push(metric);
    logger.info({ date: metric.date }, 'Usage metric recorded');
  }

  recordCompliance(metric: ComplianceMetric): void {
    this.complianceMetrics.push(metric);
    logger.info({ date: metric.date, complianceRate: metric.complianceRate }, 'Compliance metric recorded');
  }

  getUsageMetrics(startDate: Date, endDate: Date): UsageMetric[] {
    return this.usageMetrics.filter(
      m => m.date >= startDate && m.date <= endDate
    );
  }

  getComplianceMetrics(startDate: Date, endDate: Date): ComplianceMetric[] {
    return this.complianceMetrics.filter(
      m => m.date >= startDate && m.date <= endDate
    );
  }

  calculateAverageComplianceRate(startDate: Date, endDate: Date): number {
    const metrics = this.getComplianceMetrics(startDate, endDate);
    if (metrics.length === 0) return 0;

    const total = metrics.reduce((sum, m) => sum + m.complianceRate, 0);
    return total / metrics.length;
  }

  calculateTotalNotes(startDate: Date, endDate: Date): number {
    const metrics = this.getUsageMetrics(startDate, endDate);
    return metrics.reduce((sum, m) => sum + m.notesCreated, 0);
  }

  calculateActiveUsers(startDate: Date, endDate: Date): number {
    const metrics = this.getUsageMetrics(startDate, endDate);
    const uniqueUsers = new Set<number>();
    metrics.forEach(m => uniqueUsers.add(m.activeUsers));
    return uniqueUsers.size;
  }

  generateReport(startDate: Date, endDate: Date): AnalyticsReport {
    const usageMetrics = this.getUsageMetrics(startDate, endDate);
    const complianceMetrics = this.getComplianceMetrics(startDate, endDate);

    const report: AnalyticsReport = {
      period: { start: startDate, end: endDate },
      usageMetrics,
      complianceMetrics,
      totalNotes: this.calculateTotalNotes(startDate, endDate),
      totalUsers: this.calculateActiveUsers(startDate, endDate),
      averageNoteLength: 0,
      topDisciplines: [],
    };

    logger.info({ period: report.period }, 'Analytics report generated');
    return report;
  }

  getTrendAnalysis(startDate: Date, endDate: Date): {
    usageTrend: 'increasing' | 'decreasing' | 'stable';
    complianceTrend: 'improving' | 'declining' | 'stable';
  } {
    const usageMetrics = this.getUsageMetrics(startDate, endDate);
    const complianceMetrics = this.getComplianceMetrics(startDate, endDate);

    let usageTrend: 'increasing' | 'decreasing' | 'stable' = 'stable';
    let complianceTrend: 'improving' | 'declining' | 'stable' = 'stable';

    if (usageMetrics.length > 1) {
      const firstHalf = usageMetrics.slice(0, Math.floor(usageMetrics.length / 2));
      const secondHalf = usageMetrics.slice(Math.floor(usageMetrics.length / 2));

      const firstAvg = firstHalf.reduce((sum, m) => sum + m.notesCreated, 0) / firstHalf.length;
      const secondAvg = secondHalf.reduce((sum, m) => sum + m.notesCreated, 0) / secondHalf.length;

      if (secondAvg > firstAvg * 1.1) usageTrend = 'increasing';
      else if (secondAvg < firstAvg * 0.9) usageTrend = 'decreasing';
    }

    if (complianceMetrics.length > 1) {
      const firstHalf = complianceMetrics.slice(0, Math.floor(complianceMetrics.length / 2));
      const secondHalf = complianceMetrics.slice(Math.floor(complianceMetrics.length / 2));

      const firstAvg = firstHalf.reduce((sum, m) => sum + m.complianceRate, 0) / firstHalf.length;
      const secondAvg = secondHalf.reduce((sum, m) => sum + m.complianceRate, 0) / secondHalf.length;

      if (secondAvg > firstAvg * 1.05) complianceTrend = 'improving';
      else if (secondAvg < firstAvg * 0.95) complianceTrend = 'declining';
    }

    return { usageTrend, complianceTrend };
  }

  clearMetrics(): void {
    this.usageMetrics = [];
    this.complianceMetrics = [];
    logger.info('All metrics cleared');
  }
}

export const analyticsService = new AnalyticsService();
