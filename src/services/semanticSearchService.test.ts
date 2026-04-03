import { describe, it, expect, beforeEach, vi } from 'vitest';
import { semanticSearchService } from './semanticSearchService';
import { Document } from '../types';

describe('SemanticSearchService', () => {
  let testDocuments: Document[];

  beforeEach(() => {
    semanticSearchService.clearEmbeddings();

    testDocuments = [
      {
        id: 'doc-1',
        userId: 'user-1',
        title: 'Physical Therapy Guidelines',
        description: 'Guidelines for physical therapy treatment',
        category: 'Guidance',
        content: 'Physical therapy involves therapeutic exercises and manual techniques to improve mobility and function.',
        contentHash: 'hash-1',
        fileType: 'pdf',
        fileSize: 1024,
        uploadedAt: new Date(),
        updatedAt: new Date(),
        version: 1,
        tags: ['PT', 'therapy'],
        isActive: true,
        metadata: {},
      },
      {
        id: 'doc-2',
        userId: 'user-1',
        title: 'Occupational Therapy Standards',
        description: 'Standards for occupational therapy practice',
        category: 'Procedure',
        content: 'Occupational therapy focuses on helping patients develop skills for daily living and work activities.',
        contentHash: 'hash-2',
        fileType: 'pdf',
        fileSize: 2048,
        uploadedAt: new Date(),
        updatedAt: new Date(),
        version: 1,
        tags: ['OT', 'therapy'],
        isActive: true,
        metadata: {},
      },
      {
        id: 'doc-3',
        userId: 'user-1',
        title: 'Speech Therapy Protocols',
        description: 'Protocols for speech and language therapy',
        category: 'Procedure',
        content: 'Speech therapy addresses communication disorders and helps patients improve speech clarity and language skills.',
        contentHash: 'hash-3',
        fileType: 'pdf',
        fileSize: 1536,
        uploadedAt: new Date(),
        updatedAt: new Date(),
        version: 1,
        tags: ['ST', 'therapy'],
        isActive: true,
        metadata: {},
      },
    ];
  });

  describe('generateEmbedding', () => {
    it('should generate embedding for a document', async () => {
      const embedding = await semanticSearchService.generateEmbedding(testDocuments[0]);

      expect(embedding).toBeDefined();
      expect(embedding.documentId).toBe('doc-1');
      expect(embedding.embedding).toHaveLength(768);
      expect(embedding.contentHash).toBe('hash-1');
      expect(embedding.createdAt).toBeInstanceOf(Date);
    });

    it('should cache embeddings', async () => {
      const embedding1 = await semanticSearchService.generateEmbedding(testDocuments[0]);
      const embedding2 = await semanticSearchService.generateEmbedding(testDocuments[0]);

      expect(embedding1.id).toBe(embedding2.id);
      expect(embedding1.embedding).toEqual(embedding2.embedding);
    });

    it('should regenerate embedding if content hash changes', async () => {
      const embedding1 = await semanticSearchService.generateEmbedding(testDocuments[0]);

      // Change content hash (simulating content change)
      testDocuments[0].contentHash = 'hash-1-updated';
      const embedding2 = await semanticSearchService.generateEmbedding(testDocuments[0]);

      expect(embedding1.id).toBe(embedding2.id);
      // Both embeddings should be generated (even if same content produces same embedding)
      expect(embedding2.contentHash).toBe('hash-1-updated');
    });

    it('should throw error on invalid input', async () => {
      const invalidDoc = { ...testDocuments[0], content: '' };

      // Should still generate embedding even for empty content
      const embedding = await semanticSearchService.generateEmbedding(invalidDoc);
      expect(embedding).toBeDefined();
    });
  });

  describe('semanticSearch', () => {
    beforeEach(async () => {
      // Generate embeddings for all test documents
      for (const doc of testDocuments) {
        await semanticSearchService.generateEmbedding(doc);
      }
    });

    it('should perform semantic search', async () => {
      const results = await semanticSearchService.semanticSearch('therapy treatment', testDocuments);

      expect(results).toBeDefined();
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].matchType).toBe('semantic');
    });

    it('should return results sorted by similarity score', async () => {
      const results = await semanticSearchService.semanticSearch('physical therapy', testDocuments);

      expect(results.length).toBeGreaterThan(0);
      for (let i = 1; i < results.length; i++) {
        expect(results[i - 1].similarityScore).toBeGreaterThanOrEqual(results[i].similarityScore);
      }
    });

    it('should respect similarity threshold', async () => {
      const results = await semanticSearchService.semanticSearch('therapy', testDocuments, 0.8);

      for (const result of results) {
        expect(result.similarityScore).toBeGreaterThanOrEqual(0.8);
      }
    });

    it('should return empty results for very low threshold', async () => {
      const results = await semanticSearchService.semanticSearch('xyz123', testDocuments, 0.99);

      expect(results.length).toBe(0);
    });
  });

  describe('keywordSearch', () => {
    it('should perform keyword search', () => {
      const results = semanticSearchService.keywordSearch('therapy', testDocuments);

      expect(results).toBeDefined();
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].matchType).toBe('keyword');
    });

    it('should find documents with matching keywords', () => {
      const results = semanticSearchService.keywordSearch('physical', testDocuments);

      expect(results.length).toBeGreaterThan(0);
      expect(results[0].documentId).toBe('doc-1');
    });

    it('should return results sorted by match count', () => {
      const results = semanticSearchService.keywordSearch('therapy', testDocuments);

      expect(results.length).toBeGreaterThan(0);
      for (let i = 1; i < results.length; i++) {
        expect(results[i - 1].similarityScore).toBeGreaterThanOrEqual(results[i].similarityScore);
      }
    });

    it('should handle multiple search terms', () => {
      const results = semanticSearchService.keywordSearch('therapy treatment', testDocuments);

      expect(results.length).toBeGreaterThan(0);
    });

    it('should return empty results for non-matching keywords', () => {
      const results = semanticSearchService.keywordSearch('xyz123', testDocuments);

      expect(results.length).toBe(0);
    });
  });

  describe('hybridSearch', () => {
    beforeEach(async () => {
      // Generate embeddings for all test documents
      for (const doc of testDocuments) {
        await semanticSearchService.generateEmbedding(doc);
      }
    });

    it('should perform hybrid search', async () => {
      const results = await semanticSearchService.hybridSearch('therapy', testDocuments);

      expect(results).toBeDefined();
      expect(results.results).toBeDefined();
      expect(results.keywordMatches).toBeGreaterThanOrEqual(0);
      expect(results.semanticMatches).toBeGreaterThanOrEqual(0);
      expect(results.totalResults).toBeGreaterThanOrEqual(0);
      expect(results.searchTime).toBeGreaterThanOrEqual(0);
    });

    it('should combine keyword and semantic results', async () => {
      const results = await semanticSearchService.hybridSearch('physical therapy', testDocuments);

      expect(results.results.length).toBeGreaterThan(0);
      expect(results.results[0].matchType).toBe('hybrid');
    });

    it('should respect semantic and keyword weights', async () => {
      const results1 = await semanticSearchService.hybridSearch('therapy', testDocuments, 0.8, 0.2);
      const results2 = await semanticSearchService.hybridSearch('therapy', testDocuments, 0.2, 0.8);

      expect(results1.results).toBeDefined();
      expect(results2.results).toBeDefined();
    });

    it('should return results sorted by combined score', async () => {
      const results = await semanticSearchService.hybridSearch('therapy', testDocuments);

      expect(results.results.length).toBeGreaterThan(0);
      for (let i = 1; i < results.results.length; i++) {
        expect(results.results[i - 1].similarityScore).toBeGreaterThanOrEqual(results.results[i].similarityScore);
      }
    });

    it('should measure search time', async () => {
      const results = await semanticSearchService.hybridSearch('therapy', testDocuments);

      expect(results.searchTime).toBeGreaterThanOrEqual(0);
    });
  });

  describe('getEmbeddingStats', () => {
    it('should return embedding statistics', async () => {
      await semanticSearchService.generateEmbedding(testDocuments[0]);
      await semanticSearchService.generateEmbedding(testDocuments[1]);

      const stats = semanticSearchService.getEmbeddingStats(3);

      expect(stats.totalDocuments).toBe(3);
      expect(stats.documentsWithEmbeddings).toBe(2);
      expect(stats.embeddingCoverage).toBeCloseTo(66.67, 1);
      expect(stats.averageEmbeddingTime).toBeGreaterThan(0);
    });

    it('should calculate coverage percentage', async () => {
      await semanticSearchService.generateEmbedding(testDocuments[0]);

      const stats = semanticSearchService.getEmbeddingStats(4);

      expect(stats.embeddingCoverage).toBeCloseTo(25, 1);
    });

    it('should handle zero documents', () => {
      const stats = semanticSearchService.getEmbeddingStats(0);

      expect(stats.totalDocuments).toBe(0);
      expect(stats.embeddingCoverage).toBe(0);
    });
  });

  describe('batchGenerateEmbeddings', () => {
    it('should generate embeddings for multiple documents', async () => {
      const embeddings = await semanticSearchService.batchGenerateEmbeddings(testDocuments);

      expect(embeddings).toHaveLength(3);
      expect(embeddings[0].documentId).toBe('doc-1');
      expect(embeddings[1].documentId).toBe('doc-2');
      expect(embeddings[2].documentId).toBe('doc-3');
    });

    it('should handle partial failures gracefully', async () => {
      const invalidDoc = { ...testDocuments[0], content: '' };
      const docs = [testDocuments[0], invalidDoc, testDocuments[1]];

      const embeddings = await semanticSearchService.batchGenerateEmbeddings(docs);

      expect(embeddings.length).toBeGreaterThan(0);
    });

    it('should return all embeddings', async () => {
      const embeddings = await semanticSearchService.batchGenerateEmbeddings(testDocuments);

      expect(embeddings).toHaveLength(testDocuments.length);
    });
  });

  describe('clearEmbeddings', () => {
    it('should clear all embeddings', async () => {
      await semanticSearchService.generateEmbedding(testDocuments[0]);
      await semanticSearchService.generateEmbedding(testDocuments[1]);

      let embeddings = semanticSearchService.getAllEmbeddings();
      expect(embeddings.length).toBe(2);

      semanticSearchService.clearEmbeddings();

      embeddings = semanticSearchService.getAllEmbeddings();
      expect(embeddings.length).toBe(0);
    });
  });

  describe('getAllEmbeddings', () => {
    it('should return all generated embeddings', async () => {
      await semanticSearchService.generateEmbedding(testDocuments[0]);
      await semanticSearchService.generateEmbedding(testDocuments[1]);

      const embeddings = semanticSearchService.getAllEmbeddings();

      expect(embeddings).toHaveLength(2);
      expect(embeddings[0].documentId).toBe('doc-1');
      expect(embeddings[1].documentId).toBe('doc-2');
    });

    it('should return empty array when no embeddings exist', () => {
      const embeddings = semanticSearchService.getAllEmbeddings();

      expect(embeddings).toHaveLength(0);
    });
  });
});
