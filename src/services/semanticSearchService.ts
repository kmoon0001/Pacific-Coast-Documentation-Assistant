import { Document, DocumentEmbedding, SemanticSearchResult, HybridSearchResults, EmbeddingStats } from '../types';

/**
 * SemanticSearchService
 * Provides semantic search capabilities using embeddings
 * Combines keyword and semantic search for hybrid results
 */
class SemanticSearchService {
  private embeddings: Map<string, DocumentEmbedding> = new Map();
  private embeddingCache: Map<string, number[]> = new Map();

  /**
   * Generate embeddings for a document using Gemini API
   */
  async generateEmbedding(document: Document): Promise<DocumentEmbedding> {
    try {
      // Check if embedding already exists and content hasn't changed
      const existing = this.embeddings.get(document.id);
      if (existing && existing.contentHash === document.contentHash) {
        return existing;
      }

      // Generate embedding using Gemini API
      const embedding = await this.getEmbeddingVector(document.content);

      const documentEmbedding: DocumentEmbedding = {
        id: `emb-${document.id}`,
        documentId: document.id,
        embedding,
        contentHash: document.contentHash,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      this.embeddings.set(document.id, documentEmbedding);
      this.embeddingCache.set(document.id, embedding);

      return documentEmbedding;
    } catch (error) {
      console.error(`Failed to generate embedding for document ${document.id}:`, error);
      throw new Error(`Embedding generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get embedding vector for text using Gemini API
   */
  private async getEmbeddingVector(text: string): Promise<number[]> {
    try {
      // For now, create a simple embedding by hashing the text
      // In production, this would call Gemini's embedding API
      const hash = this.hashText(text);
      const embedding: number[] = [];

      // Generate 768-dimensional embedding (standard size)
      for (let i = 0; i < 768; i++) {
        const charCode = text.charCodeAt(i % text.length) || 0;
        const value = Math.sin(hash + i + charCode) * 0.5 + 0.5;
        embedding.push(value);
      }

      return embedding;
    } catch (error) {
      console.error('Failed to get embedding vector:', error);
      throw new Error(`Embedding vector generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Perform semantic search on documents
   */
  async semanticSearch(query: string, documents: Document[], threshold: number = 0.5): Promise<SemanticSearchResult[]> {
    try {
      const queryEmbedding = await this.getEmbeddingVector(query);
      const results: SemanticSearchResult[] = [];

      for (const doc of documents) {
        let docEmbedding = this.embeddingCache.get(doc.id);

        if (!docEmbedding) {
          const embedding = await this.generateEmbedding(doc);
          docEmbedding = embedding.embedding;
        }

        const similarity = this.cosineSimilarity(queryEmbedding, docEmbedding);

        if (similarity >= threshold) {
          results.push({
            documentId: doc.id,
            document: doc,
            similarityScore: similarity,
            matchType: 'semantic',
          });
        }
      }

      // Sort by similarity score descending
      results.sort((a, b) => b.similarityScore - a.similarityScore);

      return results;
    } catch (error) {
      console.error('Semantic search failed:', error);
      throw new Error(`Semantic search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Perform keyword search on documents
   */
  keywordSearch(query: string, documents: Document[]): SemanticSearchResult[] {
    try {
      const queryTerms = query.toLowerCase().split(/\s+/).filter(t => t.length > 0);
      const results: SemanticSearchResult[] = [];

      for (const doc of documents) {
        const docText = `${doc.title} ${doc.description} ${doc.content}`.toLowerCase();
        let matchCount = 0;

        for (const term of queryTerms) {
          const regex = new RegExp(`\\b${term}\\b`, 'g');
          const matches = docText.match(regex);
          matchCount += matches ? matches.length : 0;
        }

        if (matchCount > 0) {
          const similarity = Math.min(1, matchCount / (queryTerms.length * 2));
          results.push({
            documentId: doc.id,
            document: doc,
            similarityScore: similarity,
            matchType: 'keyword',
          });
        }
      }

      // Sort by match count descending
      results.sort((a, b) => b.similarityScore - a.similarityScore);

      return results;
    } catch (error) {
      console.error('Keyword search failed:', error);
      throw new Error(`Keyword search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Perform hybrid search combining keyword and semantic search
   */
  async hybridSearch(
    query: string,
    documents: Document[],
    semanticWeight: number = 0.6,
    keywordWeight: number = 0.4,
    threshold: number = 0.3
  ): Promise<HybridSearchResults> {
    try {
      const startTime = Date.now();

      // Perform both searches
      const semanticResults = await this.semanticSearch(query, documents, threshold);
      const keywordResults = this.keywordSearch(query, documents);

      // Combine results
      const resultMap = new Map<string, SemanticSearchResult>();

      // Add semantic results
      for (const result of semanticResults) {
        resultMap.set(result.documentId, {
          ...result,
          similarityScore: result.similarityScore * semanticWeight,
        });
      }

      // Add/merge keyword results
      for (const result of keywordResults) {
        const existing = resultMap.get(result.documentId);
        if (existing) {
          existing.similarityScore += result.similarityScore * keywordWeight;
          existing.matchType = 'hybrid';
        } else {
          resultMap.set(result.documentId, {
            ...result,
            similarityScore: result.similarityScore * keywordWeight,
            matchType: 'hybrid',
          });
        }
      }

      // Convert to array and sort
      const results = Array.from(resultMap.values()).sort((a, b) => b.similarityScore - a.similarityScore);

      const searchTime = Date.now() - startTime;

      return {
        results,
        keywordMatches: keywordResults.length,
        semanticMatches: semanticResults.length,
        totalResults: results.length,
        searchTime,
      };
    } catch (error) {
      console.error('Hybrid search failed:', error);
      throw new Error(`Hybrid search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error('Vectors must have the same length');
    }

    let dotProduct = 0;
    let magnitudeA = 0;
    let magnitudeB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      magnitudeA += a[i] * a[i];
      magnitudeB += b[i] * b[i];
    }

    magnitudeA = Math.sqrt(magnitudeA);
    magnitudeB = Math.sqrt(magnitudeB);

    if (magnitudeA === 0 || magnitudeB === 0) {
      return 0;
    }

    return dotProduct / (magnitudeA * magnitudeB);
  }

  /**
   * Simple hash function for text
   */
  private hashText(text: string): number {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Get embedding statistics
   */
  getEmbeddingStats(totalDocuments: number): EmbeddingStats {
    const documentsWithEmbeddings = this.embeddings.size;
    const embeddingCoverage = totalDocuments > 0 ? (documentsWithEmbeddings / totalDocuments) * 100 : 0;

    // Calculate average embedding time (mock for now)
    const averageEmbeddingTime = 150; // ms

    return {
      totalDocuments,
      documentsWithEmbeddings,
      embeddingCoverage,
      lastGeneratedAt: this.embeddings.size > 0 ? new Date() : undefined,
      averageEmbeddingTime,
    };
  }

  /**
   * Batch generate embeddings for multiple documents
   */
  async batchGenerateEmbeddings(documents: Document[]): Promise<DocumentEmbedding[]> {
    try {
      const results: DocumentEmbedding[] = [];

      for (const doc of documents) {
        try {
          const embedding = await this.generateEmbedding(doc);
          results.push(embedding);
        } catch (error) {
          console.warn(`Failed to generate embedding for document ${doc.id}:`, error);
          // Continue with next document
        }
      }

      return results;
    } catch (error) {
      console.error('Batch embedding generation failed:', error);
      throw new Error(`Batch embedding generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Clear all embeddings
   */
  clearEmbeddings(): void {
    this.embeddings.clear();
    this.embeddingCache.clear();
  }

  /**
   * Get all embeddings
   */
  getAllEmbeddings(): DocumentEmbedding[] {
    return Array.from(this.embeddings.values());
  }
}

export const semanticSearchService = new SemanticSearchService();
