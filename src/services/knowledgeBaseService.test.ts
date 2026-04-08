import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { knowledgeBaseService } from './knowledgeBaseService';
import { DocumentMetadata } from '../types';

describe('KnowledgeBaseService', () => {
  const userId = 'test-user-123';
  const organizationId = 'test-org-123';

  beforeEach(() => {
    knowledgeBaseService.clearAll();
  });

  afterEach(() => {
    knowledgeBaseService.clearAll();
  });

  describe('uploadDocument', () => {
    it('should upload a text document successfully', async () => {
      const file = new File(['Test content'], 'test.txt', { type: 'text/plain' });
      const metadata: DocumentMetadata = {
        title: 'Test Policy',
        description: 'A test policy document',
        category: 'Policy',
        tags: ['test', 'policy'],
      };

      const document = await knowledgeBaseService.uploadDocument(
        file,
        metadata,
        userId,
        organizationId
      );

      expect(document).toBeDefined();
      expect(document.id).toBeDefined();
      expect(document.title).toBe('Test Policy');
      expect(document.category).toBe('Policy');
      expect(document.userId).toBe(userId);
      expect(document.organizationId).toBe(organizationId);
      expect(document.version).toBe(1);
      expect(document.isActive).toBe(true);
      expect(document.tags).toContain('test');
    });

    it('should set correct file type for different formats', async () => {
      const formats = [
        { name: 'test.txt', type: 'text/plain' },
        { name: 'test.md', type: 'text/markdown' },
        { name: 'test.pdf', type: 'application/pdf' },
        {
          name: 'test.docx',
          type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        },
      ];

      for (const format of formats) {
        const file = new File(['content'], format.name, { type: format.type });
        const metadata: DocumentMetadata = {
          title: `Test ${format.name}`,
          description: 'Test',
          category: 'Policy',
        };

        const document = await knowledgeBaseService.uploadDocument(file, metadata, userId);

        expect(document.fileType).toBe(format.name.split('.').pop());
      }
    });

    it('should store document content', async () => {
      const content = 'Important policy content';
      const file = new File([content], 'policy.txt', { type: 'text/plain' });
      const metadata: DocumentMetadata = {
        title: 'Policy',
        description: 'Test',
        category: 'Policy',
      };

      const document = await knowledgeBaseService.uploadDocument(file, metadata, userId);

      expect(document.content).toBe(content);
      expect(document.fileSize).toBe(file.size);
    });

    it('should generate content hash for duplicate detection', async () => {
      const file = new File(['Same content'], 'test.txt', { type: 'text/plain' });
      const metadata: DocumentMetadata = {
        title: 'Test',
        description: 'Test',
        category: 'Policy',
      };

      const document = await knowledgeBaseService.uploadDocument(file, metadata, userId);

      expect(document.contentHash).toBeDefined();
      expect(document.contentHash).toMatch(/^[a-f0-9]{64}$/); // SHA256 hex
    });

    it('should set effective and expiry dates if provided', async () => {
      const file = new File(['content'], 'test.txt', { type: 'text/plain' });
      const effectiveDate = new Date('2024-01-01');
      const expiryDate = new Date('2024-12-31');

      const metadata: DocumentMetadata = {
        title: 'Test',
        description: 'Test',
        category: 'Policy',
        effectiveDate,
        expiryDate,
      };

      const document = await knowledgeBaseService.uploadDocument(file, metadata, userId);

      expect(document.effectiveDate).toEqual(effectiveDate);
      expect(document.expiryDate).toEqual(expiryDate);
    });

    it('should throw error for unsupported file types', async () => {
      const file = new File(['content'], 'test.exe', { type: 'application/x-msdownload' });
      const metadata: DocumentMetadata = {
        title: 'Test',
        description: 'Test',
        category: 'Policy',
      };

      await expect(knowledgeBaseService.uploadDocument(file, metadata, userId)).rejects.toThrow();
    });
  });

  describe('deleteDocument', () => {
    it('should delete a document successfully', async () => {
      const file = new File(['content'], 'test.txt', { type: 'text/plain' });
      const metadata: DocumentMetadata = {
        title: 'Test',
        description: 'Test',
        category: 'Policy',
      };

      const document = await knowledgeBaseService.uploadDocument(file, metadata, userId);

      await knowledgeBaseService.deleteDocument(document.id, userId);

      const retrieved = await knowledgeBaseService.getDocument(document.id, userId);
      expect(retrieved).toBeNull();
    });

    it('should throw error when deleting non-existent document', async () => {
      await expect(
        knowledgeBaseService.deleteDocument('non-existent-id', userId)
      ).rejects.toThrow();
    });

    it('should throw error when unauthorized user tries to delete', async () => {
      const file = new File(['content'], 'test.txt', { type: 'text/plain' });
      const metadata: DocumentMetadata = {
        title: 'Test',
        description: 'Test',
        category: 'Policy',
      };

      const document = await knowledgeBaseService.uploadDocument(file, metadata, userId);

      await expect(
        knowledgeBaseService.deleteDocument(document.id, 'different-user')
      ).rejects.toThrow('Unauthorized');
    });
  });

  describe('getDocument', () => {
    it('should retrieve a document by ID', async () => {
      const file = new File(['content'], 'test.txt', { type: 'text/plain' });
      const metadata: DocumentMetadata = {
        title: 'Test Policy',
        description: 'Test',
        category: 'Policy',
      };

      const uploaded = await knowledgeBaseService.uploadDocument(file, metadata, userId);

      const retrieved = await knowledgeBaseService.getDocument(uploaded.id, userId);

      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(uploaded.id);
      expect(retrieved?.title).toBe('Test Policy');
    });

    it('should return null for non-existent document', async () => {
      const retrieved = await knowledgeBaseService.getDocument('non-existent', userId);
      expect(retrieved).toBeNull();
    });
  });

  describe('updateDocumentMetadata', () => {
    it('should update document metadata', async () => {
      const file = new File(['content'], 'test.txt', { type: 'text/plain' });
      const metadata: DocumentMetadata = {
        title: 'Original Title',
        description: 'Original Description',
        category: 'Policy',
      };

      const document = await knowledgeBaseService.uploadDocument(file, metadata, userId);

      const updated = await knowledgeBaseService.updateDocumentMetadata(document.id, userId, {
        title: 'Updated Title',
        description: 'Updated Description',
        tags: ['updated', 'tag'],
      });

      expect(updated.title).toBe('Updated Title');
      expect(updated.description).toBe('Updated Description');
      expect(updated.tags).toContain('updated');
      expect(updated.version).toBe(2);
    });

    it('should throw error when unauthorized user tries to update', async () => {
      const file = new File(['content'], 'test.txt', { type: 'text/plain' });
      const metadata: DocumentMetadata = {
        title: 'Test',
        description: 'Test',
        category: 'Policy',
      };

      const document = await knowledgeBaseService.uploadDocument(file, metadata, userId);

      await expect(
        knowledgeBaseService.updateDocumentMetadata(document.id, 'different-user', {
          title: 'New Title',
        })
      ).rejects.toThrow('Unauthorized');
    });

    it('should increment version on update', async () => {
      const file = new File(['content'], 'test.txt', { type: 'text/plain' });
      const metadata: DocumentMetadata = {
        title: 'Test',
        description: 'Test',
        category: 'Policy',
      };

      const document = await knowledgeBaseService.uploadDocument(file, metadata, userId);

      expect(document.version).toBe(1);

      const updated1 = await knowledgeBaseService.updateDocumentMetadata(document.id, userId, {
        title: 'Updated 1',
      });
      expect(updated1.version).toBe(2);

      const updated2 = await knowledgeBaseService.updateDocumentMetadata(document.id, userId, {
        title: 'Updated 2',
      });
      expect(updated2.version).toBe(3);
    });
  });

  describe('listDocuments', () => {
    beforeEach(async () => {
      // Create test documents
      const categories: Array<'Policy' | 'Procedure' | 'Guidance' | 'Regulation'> = [
        'Policy',
        'Procedure',
        'Guidance',
      ];

      for (let i = 0; i < 5; i++) {
        const file = new File([`content ${i}`], `test${i}.txt`, { type: 'text/plain' });
        const metadata: DocumentMetadata = {
          title: `Document ${i}`,
          description: `Description ${i}`,
          category: categories[i % categories.length],
          tags: i % 2 === 0 ? ['tag1'] : ['tag2'],
        };

        await knowledgeBaseService.uploadDocument(file, metadata, userId);
      }
    });

    it('should list all documents for a user', async () => {
      const result = await knowledgeBaseService.listDocuments(userId);

      expect(result.documents.length).toBe(5);
      expect(result.total).toBe(5);
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(20);
    });

    it('should filter documents by category', async () => {
      const result = await knowledgeBaseService.listDocuments(userId, {
        category: 'Policy',
      });

      expect(result.documents.every((doc) => doc.category === 'Policy')).toBe(true);
    });

    it('should filter documents by tags', async () => {
      const result = await knowledgeBaseService.listDocuments(userId, {
        tags: ['tag1'],
      });

      expect(result.documents.every((doc) => doc.tags.includes('tag1'))).toBe(true);
    });

    it('should paginate results', async () => {
      const page1 = await knowledgeBaseService.listDocuments(userId, {
        pageSize: 2,
        page: 1,
      });

      expect(page1.documents.length).toBe(2);
      expect(page1.page).toBe(1);

      const page2 = await knowledgeBaseService.listDocuments(userId, {
        pageSize: 2,
        page: 2,
      });

      expect(page2.documents.length).toBe(2);
      expect(page2.page).toBe(2);
      expect(page1.documents[0].id).not.toBe(page2.documents[0].id);
    });

    it('should sort by name', async () => {
      const result = await knowledgeBaseService.listDocuments(userId, {
        sortBy: 'name',
        sortOrder: 'asc',
      });

      for (let i = 0; i < result.documents.length - 1; i++) {
        expect(result.documents[i].title <= result.documents[i + 1].title).toBe(true);
      }
    });

    it('should sort by date', async () => {
      const result = await knowledgeBaseService.listDocuments(userId, {
        sortBy: 'date',
        sortOrder: 'desc',
      });

      for (let i = 0; i < result.documents.length - 1; i++) {
        expect(result.documents[i].uploadedAt >= result.documents[i + 1].uploadedAt).toBe(true);
      }
    });
  });

  describe('searchDocuments', () => {
    beforeEach(async () => {
      const documents = [
        { title: 'Patient Privacy Policy', description: 'HIPAA compliance' },
        { title: 'Therapy Procedures Manual', description: 'Standard procedures' },
        { title: 'Clinical Guidelines', description: 'Best practices' },
      ];

      for (const doc of documents) {
        const file = new File(['content'], `${doc.title}.txt`, { type: 'text/plain' });
        const metadata: DocumentMetadata = {
          title: doc.title,
          description: doc.description,
          category: 'Policy',
        };

        await knowledgeBaseService.uploadDocument(file, metadata, userId);
      }
    });

    it('should search documents by keyword', async () => {
      const result = await knowledgeBaseService.searchDocuments(userId, 'Privacy');

      expect(result.documents.length).toBeGreaterThan(0);
      expect(result.documents.some((doc) => doc.title.includes('Privacy'))).toBe(true);
    });

    it('should search in title and description', async () => {
      const result = await knowledgeBaseService.searchDocuments(userId, 'HIPAA');

      expect(result.documents.length).toBeGreaterThan(0);
      expect(result.documents.some((doc) => doc.description.includes('HIPAA'))).toBe(true);
    });

    it('should return empty results for non-matching query', async () => {
      const result = await knowledgeBaseService.searchDocuments(userId, 'NonExistentTerm');

      expect(result.documents.length).toBe(0);
    });

    it('should rank results by relevance', async () => {
      const result = await knowledgeBaseService.searchDocuments(userId, 'Policy', {
        sortBy: 'relevance',
      });

      expect(result.documents.length).toBeGreaterThan(0);
      // Documents with "Policy" in title should rank higher
      expect(result.documents[0].title).toContain('Policy');
    });

    it('should apply pagination to search results', async () => {
      const result = await knowledgeBaseService.searchDocuments(userId, 'Policy', {
        pageSize: 1,
        page: 1,
      });

      expect(result.documents.length).toBeLessThanOrEqual(1);
      expect(result.page).toBe(1);
    });
  });

  describe('trackDocumentUsage', () => {
    it('should track document usage', async () => {
      const file = new File(['content'], 'test.txt', { type: 'text/plain' });
      const metadata: DocumentMetadata = {
        title: 'Test',
        description: 'Test',
        category: 'Policy',
      };

      const document = await knowledgeBaseService.uploadDocument(file, metadata, userId);

      await knowledgeBaseService.trackDocumentUsage(document.id, 'note-123', userId, {
        discipline: 'PT',
        documentType: 'Daily',
      });

      const stats = await knowledgeBaseService.getDocumentUsageStats(document.id);

      expect(stats.totalUsages).toBe(1);
      expect(stats.usageByDiscipline['PT']).toBe(1);
      expect(stats.usageByDocumentType['Daily']).toBe(1);
      expect(stats.recentNotes).toContain('note-123');
    });

    it('should accumulate multiple usages', async () => {
      const file = new File(['content'], 'test.txt', { type: 'text/plain' });
      const metadata: DocumentMetadata = {
        title: 'Test',
        description: 'Test',
        category: 'Policy',
      };

      const document = await knowledgeBaseService.uploadDocument(file, metadata, userId);

      await knowledgeBaseService.trackDocumentUsage(document.id, 'note-1', userId, {
        discipline: 'PT',
        documentType: 'Daily',
      });

      await knowledgeBaseService.trackDocumentUsage(document.id, 'note-2', userId, {
        discipline: 'OT',
        documentType: 'Progress',
      });

      const stats = await knowledgeBaseService.getDocumentUsageStats(document.id);

      expect(stats.totalUsages).toBe(2);
      expect(stats.usageByDiscipline['PT']).toBe(1);
      expect(stats.usageByDiscipline['OT']).toBe(1);
    });
  });

  describe('getDocumentAuditLog', () => {
    it('should track document operations in audit log', async () => {
      const file = new File(['content'], 'test.txt', { type: 'text/plain' });
      const metadata: DocumentMetadata = {
        title: 'Test',
        description: 'Test',
        category: 'Policy',
      };

      const document = await knowledgeBaseService.uploadDocument(file, metadata, userId);

      const auditLog = await knowledgeBaseService.getDocumentAuditLog(document.id);

      expect(auditLog.length).toBeGreaterThan(0);
      expect(auditLog[0].action).toBe('upload');
      expect(auditLog[0].userId).toBe(userId);
    });

    it('should log all document operations', async () => {
      const file = new File(['content'], 'test.txt', { type: 'text/plain' });
      const metadata: DocumentMetadata = {
        title: 'Test',
        description: 'Test',
        category: 'Policy',
      };

      const document = await knowledgeBaseService.uploadDocument(file, metadata, userId);

      await knowledgeBaseService.updateDocumentMetadata(document.id, userId, { title: 'Updated' });

      await knowledgeBaseService.getDocument(document.id, userId);

      const auditLog = await knowledgeBaseService.getDocumentAuditLog(document.id);

      expect(auditLog.length).toBeGreaterThanOrEqual(3);
      expect(auditLog.map((entry) => entry.action)).toContain('upload');
      expect(auditLog.map((entry) => entry.action)).toContain('update');
      expect(auditLog.map((entry) => entry.action)).toContain('view');
    });
  });

  describe('authorization', () => {
    it('should only show documents to authorized users', async () => {
      const file = new File(['content'], 'test.txt', { type: 'text/plain' });
      const metadata: DocumentMetadata = {
        title: 'Test',
        description: 'Test',
        category: 'Policy',
      };

      await knowledgeBaseService.uploadDocument(file, metadata, userId);

      const otherUserDocs = await knowledgeBaseService.listDocuments('other-user');

      expect(otherUserDocs.documents.length).toBe(0);
    });
  });
});
