import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BulkOperationsService } from './bulkOperationsService';

// Mock dependencies
vi.mock('./knowledgeBaseService', () => ({
  knowledgeBaseService: {
    uploadDocument: vi.fn(),
    deleteDocument: vi.fn(),
    getDocument: vi.fn(),
    updateDocumentMetadata: vi.fn(),
  },
}));

vi.mock('../lib/auditLogger', () => ({
  auditLog: vi.fn().mockResolvedValue(undefined),
}));

describe('BulkOperationsService', () => {
  let service: BulkOperationsService;

  beforeEach(() => {
    service = new BulkOperationsService();
    vi.clearAllMocks();
  });

  describe('bulkUpload', () => {
    it('should upload multiple files', async () => {
      const { knowledgeBaseService } = await import('./knowledgeBaseService');
      const mockDoc = {
        id: 'doc-1',
        title: 'Test',
        category: 'Policy',
        content: 'test',
        contentHash: 'hash',
        fileType: 'md',
        fileSize: 100,
        uploadedAt: new Date(),
        updatedAt: new Date(),
        version: 1,
        tags: [],
        isActive: true,
        metadata: {},
        userId: 'user-1',
      };

      vi.mocked(knowledgeBaseService.uploadDocument).mockResolvedValue(mockDoc);

      const files = [
        new File(['content1'], 'file1.md'),
        new File(['content2'], 'file2.md'),
      ];

      const result = await service.bulkUpload(files, {}, 'user-1');

      expect(result.successful.length).toBe(2);
      expect(result.failed.length).toBe(0);
      expect(result.total).toBe(2);
    });

    it('should handle upload failures', async () => {
      const { knowledgeBaseService } = await import('./knowledgeBaseService');

      vi.mocked(knowledgeBaseService.uploadDocument)
        .mockResolvedValueOnce({
          id: 'doc-1',
          title: 'Test',
          category: 'Policy',
          content: 'test',
          contentHash: 'hash',
          fileType: 'md',
          fileSize: 100,
          uploadedAt: new Date(),
          updatedAt: new Date(),
          version: 1,
          tags: [],
          isActive: true,
          metadata: {},
          userId: 'user-1',
        })
        .mockRejectedValueOnce(new Error('Upload failed'));

      const files = [
        new File(['content1'], 'file1.md'),
        new File(['content2'], 'file2.md'),
      ];

      const result = await service.bulkUpload(files, {}, 'user-1');

      expect(result.successful.length).toBe(1);
      expect(result.failed.length).toBe(1);
      expect(result.failed[0].error).toBe('Upload failed');
    });

    it('should track progress', async () => {
      const { knowledgeBaseService } = await import('./knowledgeBaseService');
      const mockDoc = {
        id: 'doc-1',
        title: 'Test',
        category: 'Policy',
        content: 'test',
        contentHash: 'hash',
        fileType: 'md',
        fileSize: 100,
        uploadedAt: new Date(),
        updatedAt: new Date(),
        version: 1,
        tags: [],
        isActive: true,
        metadata: {},
        userId: 'user-1',
      };

      vi.mocked(knowledgeBaseService.uploadDocument).mockResolvedValue(mockDoc);

      const progressUpdates: Array<[number, number]> = [];
      const onProgress = (current: number, total: number) => {
        progressUpdates.push([current, total]);
      };

      const files = [
        new File(['content1'], 'file1.md'),
        new File(['content2'], 'file2.md'),
      ];

      await service.bulkUpload(files, {}, 'user-1', onProgress);

      expect(progressUpdates.length).toBe(2);
      expect(progressUpdates[0]).toEqual([1, 2]);
      expect(progressUpdates[1]).toEqual([2, 2]);
    });
  });

  describe('bulkDelete', () => {
    it('should delete multiple documents', async () => {
      const { knowledgeBaseService } = await import('./knowledgeBaseService');
      vi.mocked(knowledgeBaseService.deleteDocument).mockResolvedValue(undefined);

      const result = await service.bulkDelete(['doc-1', 'doc-2'], 'user-1');

      expect(result.successful.length).toBe(2);
      expect(result.failed.length).toBe(0);
      expect(result.total).toBe(2);
    });

    it('should handle delete failures', async () => {
      const { knowledgeBaseService } = await import('./knowledgeBaseService');

      vi.mocked(knowledgeBaseService.deleteDocument)
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(new Error('Delete failed'));

      const result = await service.bulkDelete(['doc-1', 'doc-2'], 'user-1');

      expect(result.successful.length).toBe(1);
      expect(result.failed.length).toBe(1);
    });
  });

  describe('bulkUpdateTags', () => {
    it('should add tags to multiple documents', async () => {
      const { knowledgeBaseService } = await import('./knowledgeBaseService');
      const mockDoc = {
        id: 'doc-1',
        title: 'Test',
        category: 'Policy',
        content: 'test',
        contentHash: 'hash',
        fileType: 'md',
        fileSize: 100,
        uploadedAt: new Date(),
        updatedAt: new Date(),
        version: 1,
        tags: ['existing'],
        isActive: true,
        metadata: {},
        userId: 'user-1',
      };

      vi.mocked(knowledgeBaseService.getDocument).mockResolvedValue(mockDoc);
      vi.mocked(knowledgeBaseService.updateDocumentMetadata).mockResolvedValue(mockDoc);

      const result = await service.bulkUpdateTags(['doc-1', 'doc-2'], ['new-tag'], 'user-1', 'add');

      expect(result.successful.length).toBe(2);
      expect(result.failed.length).toBe(0);
    });

    it('should remove tags from documents', async () => {
      const { knowledgeBaseService } = await import('./knowledgeBaseService');
      const mockDoc = {
        id: 'doc-1',
        title: 'Test',
        category: 'Policy',
        content: 'test',
        contentHash: 'hash',
        fileType: 'md',
        fileSize: 100,
        uploadedAt: new Date(),
        updatedAt: new Date(),
        version: 1,
        tags: ['tag1', 'tag2'],
        isActive: true,
        metadata: {},
        userId: 'user-1',
      };

      vi.mocked(knowledgeBaseService.getDocument).mockResolvedValue(mockDoc);
      vi.mocked(knowledgeBaseService.updateDocumentMetadata).mockResolvedValue(mockDoc);

      const result = await service.bulkUpdateTags(['doc-1'], ['tag1'], 'user-1', 'remove');

      expect(result.successful.length).toBe(1);
    });

    it('should replace tags on documents', async () => {
      const { knowledgeBaseService } = await import('./knowledgeBaseService');
      const mockDoc = {
        id: 'doc-1',
        title: 'Test',
        category: 'Policy',
        content: 'test',
        contentHash: 'hash',
        fileType: 'md',
        fileSize: 100,
        uploadedAt: new Date(),
        updatedAt: new Date(),
        version: 1,
        tags: ['old-tag'],
        isActive: true,
        metadata: {},
        userId: 'user-1',
      };

      vi.mocked(knowledgeBaseService.getDocument).mockResolvedValue(mockDoc);
      vi.mocked(knowledgeBaseService.updateDocumentMetadata).mockResolvedValue(mockDoc);

      const result = await service.bulkUpdateTags(['doc-1'], ['new-tag'], 'user-1', 'replace');

      expect(result.successful.length).toBe(1);
    });
  });

  describe('bulkUpdateCategory', () => {
    it('should update category for multiple documents', async () => {
      const { knowledgeBaseService } = await import('./knowledgeBaseService');
      const mockDoc = {
        id: 'doc-1',
        title: 'Test',
        category: 'Procedure',
        content: 'test',
        contentHash: 'hash',
        fileType: 'md',
        fileSize: 100,
        uploadedAt: new Date(),
        updatedAt: new Date(),
        version: 1,
        tags: [],
        isActive: true,
        metadata: {},
        userId: 'user-1',
      };

      vi.mocked(knowledgeBaseService.updateDocumentMetadata).mockResolvedValue(mockDoc);

      const result = await service.bulkUpdateCategory(['doc-1', 'doc-2'], 'Procedure', 'user-1');

      expect(result.successful.length).toBe(2);
      expect(result.failed.length).toBe(0);
    });

    it('should handle update failures', async () => {
      const { knowledgeBaseService } = await import('./knowledgeBaseService');

      vi.mocked(knowledgeBaseService.updateDocumentMetadata)
        .mockResolvedValueOnce({
          id: 'doc-1',
          title: 'Test',
          category: 'Procedure',
          content: 'test',
          contentHash: 'hash',
          fileType: 'md',
          fileSize: 100,
          uploadedAt: new Date(),
          updatedAt: new Date(),
          version: 1,
          tags: [],
          isActive: true,
          metadata: {},
          userId: 'user-1',
        })
        .mockRejectedValueOnce(new Error('Update failed'));

      const result = await service.bulkUpdateCategory(['doc-1', 'doc-2'], 'Procedure', 'user-1');

      expect(result.successful.length).toBe(1);
      expect(result.failed.length).toBe(1);
    });
  });

  describe('getBulkOperationStatus', () => {
    it('should return operation status', async () => {
      const status = await service.getBulkOperationStatus('op-123');

      expect(status.operationId).toBe('op-123');
      expect(status.status).toBe('completed');
      expect(status.progress).toBe(100);
    });
  });
});
