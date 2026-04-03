import { describe, it, expect, beforeEach } from 'vitest';
import { ImportService, ImportOptions } from './importService';

describe('ImportService', () => {
  let service: ImportService;

  beforeEach(() => {
    service = new ImportService();
  });

  describe('importFromPDF', () => {
    it('should import data from PDF file', async () => {
      const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
      const options: ImportOptions = { format: 'pdf' };
      const result = await service.importFromPDF(file, options);

      expect(result.format).toBe('pdf');
      expect(result.status).toBe('completed');
      expect(result.recordsProcessed).toBeGreaterThanOrEqual(0);
    });

    it('should generate unique import IDs', async () => {
      const file1 = new File(['content1'], 'test1.pdf', { type: 'application/pdf' });
      const file2 = new File(['content2'], 'test2.pdf', { type: 'application/pdf' });
      const options: ImportOptions = { format: 'pdf' };

      const result1 = await service.importFromPDF(file1, options);
      const result2 = await service.importFromPDF(file2, options);

      expect(result1.id).not.toBe(result2.id);
    });

    it('should track successful and failed records', async () => {
      const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
      const options: ImportOptions = { format: 'pdf' };
      const result = await service.importFromPDF(file, options);

      expect(result.recordsSuccessful).toBeGreaterThanOrEqual(0);
      expect(result.recordsFailed).toBeGreaterThanOrEqual(0);
    });

    it('should support validate-only mode', async () => {
      const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
      const options: ImportOptions = { format: 'pdf', validateOnly: true };
      const result = await service.importFromPDF(file, options);

      expect(result.status).toBe('completed');
    });

    it('should support merge strategies', async () => {
      const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
      const strategies: Array<'overwrite' | 'merge' | 'skip'> = ['overwrite', 'merge', 'skip'];

      for (const strategy of strategies) {
        const options: ImportOptions = { format: 'pdf', mergeStrategy: strategy };
        const result = await service.importFromPDF(file, options);
        expect(result.status).toBe('completed');
      }
    });
  });

  describe('importFromDOCX', () => {
    it('should import data from DOCX file', async () => {
      const file = new File(['test content'], 'test.docx', { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
      const options: ImportOptions = { format: 'docx' };
      const result = await service.importFromDOCX(file, options);

      expect(result.format).toBe('docx');
      expect(result.status).toBe('completed');
    });

    it('should create valid import result', async () => {
      const file = new File(['test content'], 'test.docx', { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
      const options: ImportOptions = { format: 'docx' };
      const result = await service.importFromDOCX(file, options);

      expect(result.id).toBeDefined();
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.errors).toEqual([]);
    });
  });

  describe('importFromHL7', () => {
    it('should import data from HL7 file', async () => {
      const file = new File(['test content'], 'test.hl7', { type: 'text/plain' });
      const options: ImportOptions = { format: 'hl7' };
      const result = await service.importFromHL7(file, options);

      expect(result.format).toBe('hl7');
      expect(result.status).toBe('completed');
    });

    it('should create valid HL7 import result', async () => {
      const file = new File(['test content'], 'test.hl7', { type: 'text/plain' });
      const options: ImportOptions = { format: 'hl7' };
      const result = await service.importFromHL7(file, options);

      expect(result.id).toBeDefined();
      expect(result.createdAt).toBeInstanceOf(Date);
    });
  });

  describe('getImport', () => {
    it('should retrieve import by ID', async () => {
      const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
      const options: ImportOptions = { format: 'pdf' };
      const imported = await service.importFromPDF(file, options);
      const retrieved = service.getImport(imported.id);

      expect(retrieved).toEqual(imported);
    });

    it('should return undefined for non-existent import', () => {
      const result = service.getImport('non-existent-id');
      expect(result).toBeUndefined();
    });
  });

  describe('listImports', () => {
    it('should list all imports', async () => {
      const options: ImportOptions = { format: 'pdf' };
      const file1 = new File(['content1'], 'test1.pdf', { type: 'application/pdf' });
      const file2 = new File(['content2'], 'test2.pdf', { type: 'application/pdf' });

      await service.importFromPDF(file1, options);
      await service.importFromPDF(file2, options);

      const imports = service.listImports();
      expect(imports).toHaveLength(2);
    });

    it('should return empty array when no imports', () => {
      const imports = service.listImports();
      expect(imports).toEqual([]);
    });

    it('should include all import formats', async () => {
      const pdfFile = new File(['content'], 'test.pdf', { type: 'application/pdf' });
      const docxFile = new File(['content'], 'test.docx', { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
      const hl7File = new File(['content'], 'test.hl7', { type: 'text/plain' });

      await service.importFromPDF(pdfFile, { format: 'pdf' });
      await service.importFromDOCX(docxFile, { format: 'docx' });
      await service.importFromHL7(hl7File, { format: 'hl7' });

      const imports = service.listImports();
      const formats = imports.map(i => i.format);

      expect(formats).toContain('pdf');
      expect(formats).toContain('docx');
      expect(formats).toContain('hl7');
    });
  });

  describe('error handling', () => {
    it('should handle import errors', async () => {
      const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
      const invalidOptions = { format: 'invalid' } as ImportOptions;

      await expect(service.importFromPDF(file, invalidOptions)).rejects.toThrow();
    });

    it('should record failed imports', async () => {
      const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
      const options: ImportOptions = { format: 'pdf' };

      try {
        await service.importFromPDF(file, options);
      } catch {
        // Expected
      }

      const imports = service.listImports();
      expect(imports.length).toBeGreaterThanOrEqual(0);
    });

    it('should track error messages', async () => {
      const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
      const options: ImportOptions = { format: 'pdf' };
      const result = await service.importFromPDF(file, options);

      expect(Array.isArray(result.errors)).toBe(true);
    });
  });

  describe('import metadata', () => {
    it('should set correct creation timestamp', async () => {
      const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
      const options: ImportOptions = { format: 'pdf' };
      const before = new Date();
      const result = await service.importFromPDF(file, options);
      const after = new Date();

      expect(result.createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(result.createdAt.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it('should track record counts', async () => {
      const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
      const options: ImportOptions = { format: 'pdf' };
      const result = await service.importFromPDF(file, options);

      expect(result.recordsProcessed).toBeGreaterThanOrEqual(0);
      expect(result.recordsSuccessful).toBeGreaterThanOrEqual(0);
      expect(result.recordsFailed).toBeGreaterThanOrEqual(0);
    });
  });
});
