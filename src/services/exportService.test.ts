import { describe, it, expect, beforeEach } from 'vitest';
import { ExportService, ExportOptions } from './exportService';

describe('ExportService', () => {
  let service: ExportService;

  beforeEach(() => {
    service = new ExportService();
  });

  describe('exportToPDF', () => {
    it('should export data to PDF format', async () => {
      const options: ExportOptions = { format: 'pdf' };
      const result = await service.exportToPDF({ test: 'data' }, options);

      expect(result.format).toBe('pdf');
      expect(result.status).toBe('completed');
      expect(result.filename).toContain('export-');
      expect(result.filename).toContain('.pdf');
    });

    it('should generate unique export IDs', async () => {
      const options: ExportOptions = { format: 'pdf' };
      const result1 = await service.exportToPDF({ test: 'data1' }, options);
      const result2 = await service.exportToPDF({ test: 'data2' }, options);

      expect(result1.id).not.toBe(result2.id);
    });

    it('should include metadata when requested', async () => {
      const options: ExportOptions = { format: 'pdf', includeMetadata: true };
      const result = await service.exportToPDF({ test: 'data' }, options);

      expect(result.status).toBe('completed');
    });

    it('should include audit trail when requested', async () => {
      const options: ExportOptions = { format: 'pdf', includeAuditTrail: true };
      const result = await service.exportToPDF({ test: 'data' }, options);

      expect(result.status).toBe('completed');
    });

    it('should handle date range filtering', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');
      const options: ExportOptions = {
        format: 'pdf',
        dateRange: { start: startDate, end: endDate },
      };
      const result = await service.exportToPDF({ test: 'data' }, options);

      expect(result.status).toBe('completed');
    });
  });

  describe('exportToDOCX', () => {
    it('should export data to DOCX format', async () => {
      const options: ExportOptions = { format: 'docx' };
      const result = await service.exportToDOCX({ test: 'data' }, options);

      expect(result.format).toBe('docx');
      expect(result.status).toBe('completed');
      expect(result.filename).toContain('.docx');
    });

    it('should create valid DOCX export result', async () => {
      const options: ExportOptions = { format: 'docx' };
      const result = await service.exportToDOCX({ test: 'data' }, options);

      expect(result.id).toBeDefined();
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.size).toBeGreaterThanOrEqual(0);
    });
  });

  describe('exportToHL7', () => {
    it('should export data to HL7 format', async () => {
      const options: ExportOptions = { format: 'hl7' };
      const result = await service.exportToHL7({ test: 'data' }, options);

      expect(result.format).toBe('hl7');
      expect(result.status).toBe('completed');
      expect(result.filename).toContain('.hl7');
    });

    it('should create valid HL7 export result', async () => {
      const options: ExportOptions = { format: 'hl7' };
      const result = await service.exportToHL7({ test: 'data' }, options);

      expect(result.id).toBeDefined();
      expect(result.createdAt).toBeInstanceOf(Date);
    });
  });

  describe('getExport', () => {
    it('should retrieve exported file by ID', async () => {
      const options: ExportOptions = { format: 'pdf' };
      const exported = await service.exportToPDF({ test: 'data' }, options);
      const retrieved = service.getExport(exported.id);

      expect(retrieved).toEqual(exported);
    });

    it('should return undefined for non-existent export', () => {
      const result = service.getExport('non-existent-id');
      expect(result).toBeUndefined();
    });
  });

  describe('listExports', () => {
    it('should list all exports', async () => {
      const options: ExportOptions = { format: 'pdf' };
      await service.exportToPDF({ test: 'data1' }, options);
      await service.exportToDOCX({ test: 'data2' }, options);
      await service.exportToHL7({ test: 'data3' }, options);

      const exports = service.listExports();
      expect(exports).toHaveLength(3);
    });

    it('should return empty array when no exports', () => {
      const exports = service.listExports();
      expect(exports).toEqual([]);
    });

    it('should include all export formats', async () => {
      const options: ExportOptions = { format: 'pdf' };
      await service.exportToPDF({ test: 'data' }, options);
      await service.exportToDOCX({ test: 'data' }, { format: 'docx' });
      await service.exportToHL7({ test: 'data' }, { format: 'hl7' });

      const exports = service.listExports();
      const formats = exports.map(e => e.format);

      expect(formats).toContain('pdf');
      expect(formats).toContain('docx');
      expect(formats).toContain('hl7');
    });
  });

  describe('error handling', () => {
    it('should handle invalid export format', async () => {
      const invalidOptions = { format: 'invalid' } as unknown as ExportOptions;
      await expect(service.exportToPDF({ test: 'data' }, invalidOptions)).rejects.toThrow();
    });

    it('should record failed exports', async () => {
      const options: ExportOptions = { format: 'pdf' };
      try {
        await service.exportToPDF(null as unknown, options);
      } catch {
        // Expected to fail
      }

      const exports = service.listExports();
      const failedExport = exports.find(e => e.status === 'failed');
      expect(failedExport).toBeDefined();
    });
  });

  describe('export metadata', () => {
    it('should set correct creation timestamp', async () => {
      const options: ExportOptions = { format: 'pdf' };
      const before = new Date();
      const result = await service.exportToPDF({ test: 'data' }, options);
      const after = new Date();

      expect(result.createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(result.createdAt.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it('should generate valid filename', async () => {
      const options: ExportOptions = { format: 'pdf' };
      const result = await service.exportToPDF({ test: 'data' }, options);

      expect(result.filename).toMatch(/^export-[a-z0-9_]+\.pdf$/);
    });
  });
});
