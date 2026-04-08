import { describe, it, expect, beforeEach, vi } from 'vitest';
import { bulkOperationsService } from '../../services/bulkOperationsService';
import { knowledgeBaseService } from '../../services/knowledgeBaseService';

vi.mock('../../services/knowledgeBaseService');
vi.mock('../../lib/auditLogger');

describe('BulkOperationsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('bulkUpload', () => {
    it('should upload multiple files successfully', async () => {
      const mockFiles = [
        new File(['content1'], 'file1.txt', { type: 'text/plain' }),
        new File(['content2'], 'file2.txt', { type: 'text/plain' }),
      ];

      const mockDoc = { id: '123', name: 'test.txt' };
      vi.mocked(knowledgeBaseService.uploadDocument).mockResolvedValue(mockDoc as any);

      const result = await bulkOperationsService.bulkUpload(
        mockFiles,
        { category: 'test' },
        'user123'
      );

      expect(result.successful.length).toBe(2);
      expect(result.failed.length).toBe(0);
      expect(result.total).toBe(2);
    });

    it('should handle upload failures', async () => {
      const mockFiles = [
        new File(['content1'], 'file1.txt', { type: 'text/plain' }),
        new File(['content2'], 'file2.txt', { type: 'text/plain' }),
      ];

      vi.mocked(knowledgeBaseService.uploadDocument)
        .mockResolvedValueOnce({ id: '123', name: 'file1.txt' } as any)
        .mockRejectedValueOnce(new Error('Upload failed'));

      const result = await bulkOperationsService.bulkUpload(
        mockFiles,
        { category: 'test' },
        'user123'
      );

      expect(result.successful.length).toBe(1);
      expect(result.failed.length).toBe(1);
      expect(result.failed[0].file).toBe('file2.txt');
      expect(result.failed[0].error).toBe('Upload failed');
    });

    it('should call progress callback', async () => {
      const mockFiles = [new File(['content1'], 'file1.txt', { type: 'text/plain' })];

      vi.mocked(knowledgeBaseService.uploadDocument).mockResolvedValue({ id: '123' } as any);

      const onProgress = vi.fn();
      await bulkOperationsService.bulkUpload(
        mockFiles,
        { category: 'test' },
        'user123',
        onProgress
      );

      expect(onProgress).toHaveBeenCalledWith(1, 1);
    });

    it('should handle errors without message', async () => {
      const mockFiles = [new File(['content1'], 'file1.txt', { type: 'text/plain' })];

      vi.mocked(knowledgeBaseService.uploadDocument).mockRejectedValueOnce({});

      const result = await bulkOperationsService.bulkUpload(
        mockFiles,
        { category: 'test' },
        'user123'
      );

      expect(result.failed[0].error).toBe('Upload failed');
    });
  });

  describe('bulkDelete', () => {
    it('should delete multiple documents successfully', async () => {
      vi.mocked(knowledgeBaseService.deleteDocument).mockResolvedValue(undefined);

      const result = await bulkOperationsService.bulkDelete(['doc1', 'doc2'], 'user123');

      expect(result.successful.length).toBe(2);
      expect(result.failed.length).toBe(0);
      expect(result.total).toBe(2);
    });

    it('should handle delete failures', async () => {
      vi.mocked(knowledgeBaseService.deleteDocument)
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(new Error('Delete failed'));

      const result = await bulkOperationsService.bulkDelete(['doc1', 'doc2'], 'user123');

      expect(result.successful.length).toBe(1);
      expect(result.failed.length).toBe(1);
      expect(result.failed[0].id).toBe('doc2');
    });

    it('should include reason in audit log', async () => {
      vi.mocked(knowledgeBaseService.deleteDocument).mockResolvedValue(undefined);

      await bulkOperationsService.bulkDelete(['doc1'], 'user123', 'Outdated content');

      expect(knowledgeBaseService.deleteDocument).toHaveBeenCalled();
    });

    it('should handle errors without message', async () => {
      vi.mocked(knowledgeBaseService.deleteDocument).mockRejectedValueOnce({});

      const result = await bulkOperationsService.bulkDelete(['doc1'], 'user123');

      expect(result.failed[0].error).toBe('Delete failed');
    });
  });

  describe('bulkUpdateTags', () => {
    it('should add tags to documents', async () => {
      const mockDoc = { id: 'doc1', tags: ['existing'] };
      vi.mocked(knowledgeBaseService.getDocument).mockResolvedValue(mockDoc as any);
      vi.mocked(knowledgeBaseService.updateDocumentMetadata).mockResolvedValue(undefined);

      const result = await bulkOperationsService.bulkUpdateTags(
        ['doc1'],
        ['new-tag'],
        'user123',
        'add'
      );

      expect(result.successful.length).toBe(1);
      expect(knowledgeBaseService.updateDocumentMetadata).toHaveBeenCalledWith('doc1', 'user123', {
        tags: ['existing', 'new-tag'],
      });
    });

    it('should remove tags from documents', async () => {
      const mockDoc = { id: 'doc1', tags: ['tag1', 'tag2', 'tag3'] };
      vi.mocked(knowledgeBaseService.getDocument).mockResolvedValue(mockDoc as any);
      vi.mocked(knowledgeBaseService.updateDocumentMetadata).mockResolvedValue(undefined);

      const result = await bulkOperationsService.bulkUpdateTags(
        ['doc1'],
        ['tag2'],
        'user123',
        'remove'
      );

      expect(result.successful.length).toBe(1);
      expect(knowledgeBaseService.updateDocumentMetadata).toHaveBeenCalledWith('doc1', 'user123', {
        tags: ['tag1', 'tag3'],
      });
    });

    it('should replace tags on documents', async () => {
      const mockDoc = { id: 'doc1', tags: ['old1', 'old2'] };
      vi.mocked(knowledgeBaseService.getDocument).mockResolvedValue(mockDoc as any);
      vi.mocked(knowledgeBaseService.updateDocumentMetadata).mockResolvedValue(undefined);

      const result = await bulkOperationsService.bulkUpdateTags(
        ['doc1'],
        ['new1', 'new2'],
        'user123',
        'replace'
      );

      expect(result.successful.length).toBe(1);
      expect(knowledgeBaseService.updateDocumentMetadata).toHaveBeenCalledWith('doc1', 'user123', {
        tags: ['new1', 'new2'],
      });
    });

    it('should handle documents without tags', async () => {
      const mockDoc = { id: 'doc1' };
      vi.mocked(knowledgeBaseService.getDocument).mockResolvedValue(mockDoc as any);
      vi.mocked(knowledgeBaseService.updateDocumentMetadata).mockResolvedValue(undefined);

      const result = await bulkOperationsService.bulkUpdateTags(
        ['doc1'],
        ['new-tag'],
        'user123',
        'add'
      );

      expect(result.successful.length).toBe(1);
    });

    it('should handle document not found', async () => {
      vi.mocked(knowledgeBaseService.getDocument).mockResolvedValue(null);

      const result = await bulkOperationsService.bulkUpdateTags(['doc1'], ['new-tag'], 'user123');

      expect(result.failed.length).toBe(1);
      expect(result.failed[0].error).toBe('Document not found');
    });

    it('should handle update failures', async () => {
      const mockDoc = { id: 'doc1', tags: ['existing'] };
      vi.mocked(knowledgeBaseService.getDocument).mockResolvedValue(mockDoc as any);
      vi.mocked(knowledgeBaseService.updateDocumentMetadata).mockRejectedValue(
        new Error('Update failed')
      );

      const result = await bulkOperationsService.bulkUpdateTags(['doc1'], ['new-tag'], 'user123');

      expect(result.failed.length).toBe(1);
    });

    it('should handle errors without message', async () => {
      vi.mocked(knowledgeBaseService.getDocument).mockRejectedValueOnce({});

      const result = await bulkOperationsService.bulkUpdateTags(['doc1'], ['new-tag'], 'user123');

      expect(result.failed[0].error).toBe('Update failed');
    });
  });

  describe('bulkUpdateCategory', () => {
    it('should update category for multiple documents', async () => {
      vi.mocked(knowledgeBaseService.updateDocumentMetadata).mockResolvedValue(undefined);

      const result = await bulkOperationsService.bulkUpdateCategory(
        ['doc1', 'doc2'],
        'new-category',
        'user123'
      );

      expect(result.successful.length).toBe(2);
      expect(result.failed.length).toBe(0);
    });

    it('should handle update failures', async () => {
      vi.mocked(knowledgeBaseService.updateDocumentMetadata)
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(new Error('Update failed'));

      const result = await bulkOperationsService.bulkUpdateCategory(
        ['doc1', 'doc2'],
        'new-category',
        'user123'
      );

      expect(result.successful.length).toBe(1);
      expect(result.failed.length).toBe(1);
    });

    it('should handle errors without message', async () => {
      vi.mocked(knowledgeBaseService.updateDocumentMetadata).mockRejectedValueOnce({});

      const result = await bulkOperationsService.bulkUpdateCategory(
        ['doc1'],
        'new-category',
        'user123'
      );

      expect(result.failed[0].error).toBe('Update failed');
    });
  });

  describe('getBulkOperationStatus', () => {
    it('should return operation status', async () => {
      const result = await bulkOperationsService.getBulkOperationStatus('op123');

      expect(result.operationId).toBe('op123');
      expect(result.status).toBe('completed');
      expect(result.progress).toBe(100);
    });
  });
});
