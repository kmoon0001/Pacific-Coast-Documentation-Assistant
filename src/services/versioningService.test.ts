import { describe, it, expect, beforeEach, vi } from 'vitest';
import { VersioningService } from './versioningService';
import { Document, DocumentVersion } from '../types';

// Mock auditLog at top level
vi.mock('../lib/auditLogger', () => ({
  auditLog: vi.fn().mockResolvedValue(undefined),
}));

describe('VersioningService', () => {
  let service: VersioningService;
  let mockDocument: Document;

  beforeEach(() => {
    service = new VersioningService();
    mockDocument = {
      id: 'doc-1',
      userId: 'user-1',
      title: 'Test Policy',
      description: 'A test policy document',
      category: 'Policy',
      content: 'This is the original content',
      contentHash: 'hash1',
      fileType: 'md',
      fileSize: 100,
      uploadedAt: new Date(),
      updatedAt: new Date(),
      version: 1,
      tags: ['test'],
      isActive: true,
      metadata: { key: 'value' },
    };
  });

  describe('createVersion', () => {
    it('should create a new version of a document', async () => {
      const version = await service.createVersion(mockDocument, 'user-1', 'Initial version');

      expect(version).toBeDefined();
      expect(version.versionNumber).toBe(1);
      expect(version.documentId).toBe('doc-1');
      expect(version.content).toBe(mockDocument.content);
      expect(version.changeDescription).toBe('Initial version');
    });

    it('should increment version numbers sequentially', async () => {
      const v1 = await service.createVersion(mockDocument, 'user-1', 'v1');
      expect(v1.versionNumber).toBe(1);

      const updatedDoc = { ...mockDocument, content: 'Updated content' };
      const v2 = await service.createVersion(updatedDoc, 'user-1', 'v2');
      expect(v2.versionNumber).toBe(2);

      const v3 = await service.createVersion(updatedDoc, 'user-1', 'v3');
      expect(v3.versionNumber).toBe(3);
    });

    it('should store version metadata correctly', async () => {
      const version = await service.createVersion(mockDocument, 'user-1', 'Test version');

      expect(version.title).toBe(mockDocument.title);
      expect(version.description).toBe(mockDocument.description);
      expect(version.metadata).toEqual(mockDocument.metadata);
      expect(version.createdBy).toBe('user-1');
    });

    it('should generate unique version IDs', async () => {
      const v1 = await service.createVersion(mockDocument, 'user-1', 'v1');
      const v2 = await service.createVersion(mockDocument, 'user-1', 'v2');

      expect(v1.id).not.toBe(v2.id);
      expect(v1.id).toContain('doc-1-v1');
      expect(v2.id).toContain('doc-1-v2');
    });
  });

  describe('getDocumentVersion', () => {
    it('should retrieve a specific version', async () => {
      await service.createVersion(mockDocument, 'user-1', 'v1');
      const retrieved = await service.getDocumentVersion('doc-1', 1);

      expect(retrieved).toBeDefined();
      expect(retrieved?.versionNumber).toBe(1);
      expect(retrieved?.content).toBe(mockDocument.content);
    });

    it('should return null for non-existent version', async () => {
      const retrieved = await service.getDocumentVersion('doc-1', 999);
      expect(retrieved).toBeNull();
    });

    it('should return null for non-existent document', async () => {
      const retrieved = await service.getDocumentVersion('non-existent', 1);
      expect(retrieved).toBeNull();
    });
  });

  describe('getLatestVersion', () => {
    it('should return the latest version', async () => {
      await service.createVersion(mockDocument, 'user-1', 'v1');
      const updated = { ...mockDocument, content: 'Updated' };
      await service.createVersion(updated, 'user-1', 'v2');

      const latest = await service.getLatestVersion('doc-1');
      expect(latest?.versionNumber).toBe(2);
      expect(latest?.content).toBe('Updated');
    });

    it('should return null for non-existent document', async () => {
      const latest = await service.getLatestVersion('non-existent');
      expect(latest).toBeNull();
    });
  });

  describe('listDocumentVersions', () => {
    beforeEach(async () => {
      for (let i = 1; i <= 5; i++) {
        const doc = { ...mockDocument, content: `Content v${i}` };
        await service.createVersion(doc, 'user-1', `Version ${i}`);
      }
    });

    it('should list all versions', async () => {
      const result = await service.listDocumentVersions('doc-1');
      expect(result.total).toBe(5);
      expect(result.versions.length).toBe(5);
    });

    it('should support pagination', async () => {
      const result = await service.listDocumentVersions('doc-1', {
        limit: 2,
        offset: 0,
      });

      expect(result.versions.length).toBe(2);
      expect(result.total).toBe(5);
    });

    it('should support sorting by version', async () => {
      const asc = await service.listDocumentVersions('doc-1', {
        sortBy: 'version',
        sortOrder: 'asc',
      });

      expect(asc.versions[0].versionNumber).toBe(1);
      expect(asc.versions[asc.versions.length - 1].versionNumber).toBe(5);
    });

    it('should support sorting by date', async () => {
      const asc = await service.listDocumentVersions('doc-1', {
        sortBy: 'date',
        sortOrder: 'asc',
      });

      expect(asc.versions[0].versionNumber).toBe(1);
      expect(asc.versions[asc.versions.length - 1].versionNumber).toBe(5);
    });

    it('should return empty list for non-existent document', async () => {
      const result = await service.listDocumentVersions('non-existent');
      expect(result.total).toBe(0);
      expect(result.versions.length).toBe(0);
    });
  });

  describe('compareVersions', () => {
    it('should compare two versions', async () => {
      await service.createVersion(mockDocument, 'user-1', 'v1');

      const updated = {
        ...mockDocument,
        content: 'Updated content',
        title: 'Updated Title',
      };
      await service.createVersion(updated, 'user-1', 'v2');

      const diff = await service.compareVersions('doc-1', 1, 2);

      expect(diff).toBeDefined();
      expect(diff?.titleChanged).toBe(true);
      expect(diff?.titleOld).toBe('Test Policy');
      expect(diff?.titleNew).toBe('Updated Title');
      expect(diff?.contentChanged).toBe(true);
    });

    it('should detect unchanged fields', async () => {
      await service.createVersion(mockDocument, 'user-1', 'v1');
      await service.createVersion(mockDocument, 'user-1', 'v2');

      const diff = await service.compareVersions('doc-1', 1, 2);

      expect(diff?.titleChanged).toBe(false);
      expect(diff?.descriptionChanged).toBe(false);
    });

    it('should return null for non-existent versions', async () => {
      const diff = await service.compareVersions('doc-1', 1, 999);
      expect(diff).toBeNull();
    });

    it('should calculate content length differences', async () => {
      await service.createVersion(mockDocument, 'user-1', 'v1');

      const updated = {
        ...mockDocument,
        content: 'Much longer updated content with more information',
      };
      await service.createVersion(updated, 'user-1', 'v2');

      const diff = await service.compareVersions('doc-1', 1, 2);

      expect(diff?.contentLengthOld).toBe(mockDocument.content.length);
      expect(diff?.contentLengthNew).toBeGreaterThan(diff?.contentLengthOld || 0);
    });
  });

  describe('restoreVersion', () => {
    it('should restore a document to a previous version', async () => {
      await service.createVersion(mockDocument, 'user-1', 'v1');

      const updated = {
        ...mockDocument,
        content: 'Updated content',
        title: 'Updated Title',
      };
      await service.createVersion(updated, 'user-1', 'v2');

      const restored = await service.restoreVersion('doc-1', 1, 'user-2', 'Revert to v1');

      expect(restored).toBeDefined();
      expect(restored?.content).toBe(mockDocument.content);
      expect(restored?.title).toBe('Test Policy');
    });

    it('should create a new version when restoring', async () => {
      await service.createVersion(mockDocument, 'user-1', 'v1');
      await service.createVersion(mockDocument, 'user-1', 'v2');

      await service.restoreVersion('doc-1', 1, 'user-2', 'Revert');

      const v3 = await service.getDocumentVersion('doc-1', 3);
      expect(v3).toBeDefined();
      expect(v3?.changeDescription).toContain('Restored from version 1');
    });

    it('should return null for non-existent version', async () => {
      const restored = await service.restoreVersion('doc-1', 999, 'user-1', 'Revert');
      expect(restored).toBeNull();
    });
  });

  describe('deleteAllVersions', () => {
    it('should delete all versions of a document', async () => {
      await service.createVersion(mockDocument, 'user-1', 'v1');
      await service.createVersion(mockDocument, 'user-1', 'v2');

      await service.deleteAllVersions('doc-1', 'user-1');

      const versions = await service.listDocumentVersions('doc-1');
      expect(versions.total).toBe(0);
    });

    it('should not affect other documents', async () => {
      await service.createVersion(mockDocument, 'user-1', 'v1');

      const doc2 = { ...mockDocument, id: 'doc-2' };
      await service.createVersion(doc2, 'user-1', 'v1');

      await service.deleteAllVersions('doc-1', 'user-1');

      const doc2Versions = await service.listDocumentVersions('doc-2');
      expect(doc2Versions.total).toBe(1);
    });
  });

  describe('getVersionStats', () => {
    it('should return version statistics', async () => {
      for (let i = 1; i <= 3; i++) {
        const doc = { ...mockDocument, content: `Content v${i}` };
        await service.createVersion(doc, 'user-1', `Version ${i}`);
      }

      const stats = await service.getVersionStats('doc-1');

      expect(stats.totalVersions).toBe(3);
      expect(stats.latestVersion).toBe(3);
      expect(stats.oldestVersion?.versionNumber).toBe(1);
      expect(stats.newestVersion?.versionNumber).toBe(3);
    });

    it('should calculate average change size', async () => {
      await service.createVersion(mockDocument, 'user-1', 'v1');

      const doc2 = { ...mockDocument, content: 'Updated content' };
      await service.createVersion(doc2, 'user-1', 'v2');

      const stats = await service.getVersionStats('doc-1');

      expect(stats.averageChangeSize).toBeGreaterThanOrEqual(0);
    });

    it('should return zero stats for non-existent document', async () => {
      const stats = await service.getVersionStats('non-existent');

      expect(stats.totalVersions).toBe(0);
      expect(stats.latestVersion).toBe(0);
      expect(stats.oldestVersion).toBeNull();
      expect(stats.newestVersion).toBeNull();
      expect(stats.averageChangeSize).toBe(0);
    });
  });
});
