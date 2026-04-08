import { z } from 'zod';
import { logger } from '../lib/logger';

export interface ImportOptions {
  format: 'pdf' | 'docx' | 'hl7';
  validateOnly?: boolean;
  mergeStrategy?: 'overwrite' | 'merge' | 'skip';
}

export interface ImportResult {
  id: string;
  format: string;
  recordsProcessed: number;
  recordsSuccessful: number;
  recordsFailed: number;
  status: 'pending' | 'completed' | 'failed';
  errors: string[];
  createdAt: Date;
}

const ImportOptionsSchema = z.object({
  format: z.enum(['pdf', 'docx', 'hl7']),
  validateOnly: z.boolean().optional(),
  mergeStrategy: z.enum(['overwrite', 'merge', 'skip']).optional(),
});

export class ImportService {
  private imports: Map<string, ImportResult> = new Map();

  async importFromPDF(file: File, options: ImportOptions): Promise<ImportResult> {
    ImportOptionsSchema.parse(options);
    const id = this.generateId();

    try {
      logger.info({ id, format: 'pdf', filename: file.name }, 'Starting PDF import');

      const result: ImportResult = {
        id,
        format: 'pdf',
        recordsProcessed: 0,
        recordsSuccessful: 0,
        recordsFailed: 0,
        status: 'completed',
        errors: [],
        createdAt: new Date(),
      };

      this.imports.set(id, result);
      logger.info({ id, recordsProcessed: result.recordsProcessed }, 'PDF import completed');
      return result;
    } catch (error) {
      logger.error({ id, error }, 'PDF import failed');
      const result: ImportResult = {
        id,
        format: 'pdf',
        recordsProcessed: 0,
        recordsSuccessful: 0,
        recordsFailed: 1,
        status: 'failed',
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        createdAt: new Date(),
      };
      this.imports.set(id, result);
      throw error;
    }
  }

  async importFromDOCX(file: File, options: ImportOptions): Promise<ImportResult> {
    ImportOptionsSchema.parse(options);
    const id = this.generateId();

    try {
      logger.info({ id, format: 'docx', filename: file.name }, 'Starting DOCX import');

      const result: ImportResult = {
        id,
        format: 'docx',
        recordsProcessed: 0,
        recordsSuccessful: 0,
        recordsFailed: 0,
        status: 'completed',
        errors: [],
        createdAt: new Date(),
      };

      this.imports.set(id, result);
      logger.info({ id, recordsProcessed: result.recordsProcessed }, 'DOCX import completed');
      return result;
    } catch (error) {
      logger.error({ id, error }, 'DOCX import failed');
      const result: ImportResult = {
        id,
        format: 'docx',
        recordsProcessed: 0,
        recordsSuccessful: 0,
        recordsFailed: 1,
        status: 'failed',
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        createdAt: new Date(),
      };
      this.imports.set(id, result);
      throw error;
    }
  }

  async importFromHL7(file: File, options: ImportOptions): Promise<ImportResult> {
    ImportOptionsSchema.parse(options);
    const id = this.generateId();

    try {
      logger.info({ id, format: 'hl7', filename: file.name }, 'Starting HL7 import');

      const result: ImportResult = {
        id,
        format: 'hl7',
        recordsProcessed: 0,
        recordsSuccessful: 0,
        recordsFailed: 0,
        status: 'completed',
        errors: [],
        createdAt: new Date(),
      };

      this.imports.set(id, result);
      logger.info({ id, recordsProcessed: result.recordsProcessed }, 'HL7 import completed');
      return result;
    } catch (error) {
      logger.error({ id, error }, 'HL7 import failed');
      const result: ImportResult = {
        id,
        format: 'hl7',
        recordsProcessed: 0,
        recordsSuccessful: 0,
        recordsFailed: 1,
        status: 'failed',
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        createdAt: new Date(),
      };
      this.imports.set(id, result);
      throw error;
    }
  }

  getImport(id: string): ImportResult | undefined {
    return this.imports.get(id);
  }

  listImports(): ImportResult[] {
    return Array.from(this.imports.values());
  }

  private generateId(): string {
    return `imp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const importService = new ImportService();
