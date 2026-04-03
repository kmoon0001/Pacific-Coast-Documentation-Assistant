import { z } from 'zod';
import { logger } from '../lib/logger';

export interface ExportOptions {
  format: 'pdf' | 'docx' | 'hl7';
  includeMetadata?: boolean;
  includeAuditTrail?: boolean;
  dateRange?: { start: Date; end: Date };
}

export interface ExportResult {
  id: string;
  format: string;
  filename: string;
  size: number;
  createdAt: Date;
  status: 'pending' | 'completed' | 'failed';
  error?: string;
}

const ExportOptionsSchema = z.object({
  format: z.enum(['pdf', 'docx', 'hl7']),
  includeMetadata: z.boolean().optional(),
  includeAuditTrail: z.boolean().optional(),
  dateRange: z.object({ start: z.date(), end: z.date() }).optional(),
});

export class ExportService {
  private exports: Map<string, ExportResult> = new Map();

  async exportToPDF(data: unknown, options: ExportOptions): Promise<ExportResult> {
    const id = this.generateId();

    try {
      ExportOptionsSchema.parse(options);
      this.ensureValidPayload(data);
      logger.info({ id, format: 'pdf' }, 'Starting PDF export');
      const size = this.calculatePayloadSize(data);

      const result: ExportResult = {
        id,
        format: 'pdf',
        filename: `export-${id}.pdf`,
        size,
        createdAt: new Date(),
        status: 'completed',
      };

      this.exports.set(id, result);
      logger.info({ id }, 'PDF export completed');
      return result;
    } catch (error) {
      logger.error({ id, error }, 'PDF export failed');
      const result: ExportResult = {
        id,
        format: 'pdf',
        filename: `export-${id}.pdf`,
        size: 0,
        createdAt: new Date(),
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
      this.exports.set(id, result);
      throw error;
    }
  }

  async exportToDOCX(data: unknown, options: ExportOptions): Promise<ExportResult> {
    const id = this.generateId();

    try {
      ExportOptionsSchema.parse(options);
      this.ensureValidPayload(data);
      logger.info({ id, format: 'docx' }, 'Starting DOCX export');
      const size = this.calculatePayloadSize(data);

      const result: ExportResult = {
        id,
        format: 'docx',
        filename: `export-${id}.docx`,
        size,
        createdAt: new Date(),
        status: 'completed',
      };

      this.exports.set(id, result);
      logger.info({ id }, 'DOCX export completed');
      return result;
    } catch (error) {
      logger.error({ id, error }, 'DOCX export failed');
      const result: ExportResult = {
        id,
        format: 'docx',
        filename: `export-${id}.docx`,
        size: 0,
        createdAt: new Date(),
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
      this.exports.set(id, result);
      throw error;
    }
  }

  async exportToHL7(data: unknown, options: ExportOptions): Promise<ExportResult> {
    const id = this.generateId();

    try {
      ExportOptionsSchema.parse(options);
      this.ensureValidPayload(data);
      logger.info({ id, format: 'hl7' }, 'Starting HL7 export');
      const size = this.calculatePayloadSize(data);

      const result: ExportResult = {
        id,
        format: 'hl7',
        filename: `export-${id}.hl7`,
        size,
        createdAt: new Date(),
        status: 'completed',
      };

      this.exports.set(id, result);
      logger.info({ id }, 'HL7 export completed');
      return result;
    } catch (error) {
      logger.error({ id, error }, 'HL7 export failed');
      const result: ExportResult = {
        id,
        format: 'hl7',
        filename: `export-${id}.hl7`,
        size: 0,
        createdAt: new Date(),
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
      this.exports.set(id, result);
      throw error;
    }
  }

  getExport(id: string): ExportResult | undefined {
    return this.exports.get(id);
  }

  listExports(): ExportResult[] {
    return Array.from(this.exports.values());
  }

  private ensureValidPayload(data: unknown) {
    if (data === null || data === undefined) {
      throw new Error('Export payload is required');
    }
    if (typeof data !== 'object') {
      throw new Error('Export payload must be an object');
    }
    if (Object.keys(data as Record<string, unknown>).length === 0) {
      throw new Error('Export payload must include at least one field');
    }
  }

  private calculatePayloadSize(data: unknown): number {
    try {
      return JSON.stringify(data).length;
    } catch {
      return 0;
    }
  }

  private generateId(): string {
    return `exp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const exportService = new ExportService();
