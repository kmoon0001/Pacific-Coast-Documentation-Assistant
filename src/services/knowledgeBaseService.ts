import { logger } from '../lib/logger';
import {
  Document,
  DocumentFilters,
  DocumentMetadata,
  DocumentSearchResult,
  PolicyRequirement,
  UsageStats,
  DocumentUsageEntry,
  DocumentAuditEntry,
} from '../types';
import crypto from 'crypto';

/**
 * Generate a UUID v4
 */
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Knowledge Base Service
 * Manages document upload, storage, search, and retrieval
 */
class KnowledgeBaseService {
  private documents: Map<string, Document> = new Map();
  private documentUsage: Map<string, DocumentUsageEntry[]> = new Map();
  private documentAuditLog: Map<string, DocumentAuditEntry[]> = new Map();
  private policyRequirements: Map<string, PolicyRequirement[]> = new Map();
  private searchIndex: Map<string, Set<string>> = new Map(); // keyword -> documentIds

  /**
   * Upload a document
   */
  async uploadDocument(
    file: File,
    metadata: DocumentMetadata,
    userId: string,
    organizationId?: string
  ): Promise<Document> {
    try {
      const documentId = generateUUID();
      const content = await this.extractTextFromFile(file);
      const contentHash = this.hashContent(content);

      const document: Document = {
        id: documentId,
        userId,
        organizationId,
        title: metadata.title,
        description: metadata.description,
        category: metadata.category,
        content,
        contentHash,
        fileType: this.getFileType(file.name),
        fileSize: file.size,
        uploadedAt: new Date(),
        updatedAt: new Date(),
        effectiveDate: metadata.effectiveDate,
        expiryDate: metadata.expiryDate,
        version: 1,
        tags: metadata.tags || [],
        isActive: true,
        metadata: {
          originalFileName: file.name,
          uploadedBy: userId,
        },
      };

      // Store document
      this.documents.set(documentId, document);

      // Index for search
      await this.indexDocument(document);

      // Log audit event
      this.logAuditEvent(documentId, userId, 'upload', {
        fileName: file.name,
        fileSize: file.size,
        category: metadata.category,
      });

      logger.info({
        message: 'Document uploaded',
        documentId,
        userId,
        fileName: file.name,
      });

      return document;
    } catch (error) {
      logger.error({
        message: 'Document upload failed',
        error,
      });
      throw error;
    }
  }

  /**
   * Delete a document
   */
  async deleteDocument(documentId: string, userId: string): Promise<void> {
    try {
      const document = this.documents.get(documentId);
      if (!document) {
        throw new Error(`Document not found: ${documentId}`);
      }

      // Check authorization
      if (document.userId !== userId) {
        throw new Error('Unauthorized to delete this document');
      }

      // Remove from storage
      this.documents.delete(documentId);

      // Remove from search index
      this.removeFromSearchIndex(documentId);

      // Log audit event
      this.logAuditEvent(documentId, userId, 'delete', {
        title: document.title,
        category: document.category,
      });

      logger.info({
        message: 'Document deleted',
        documentId,
        userId,
      });
    } catch (error) {
      logger.error({
        message: 'Document deletion failed',
        error,
      });
      throw error;
    }
  }

  /**
   * Get a document by ID
   */
  async getDocument(documentId: string, userId: string): Promise<Document | null> {
    try {
      const document = this.documents.get(documentId);
      if (!document) {
        return null;
      }

      // Check authorization
      if (document.userId !== userId && document.organizationId) {
        // Allow organization members to view
        // In production, check RBAC service
      }

      // Log audit event
      this.logAuditEvent(documentId, userId, 'view', {});

      return document;
    } catch (error) {
      logger.error({
        message: 'Document retrieval failed',
        error,
      });
      throw error;
    }
  }

  /**
   * Update document metadata
   */
  async updateDocumentMetadata(
    documentId: string,
    userId: string,
    updates: Partial<DocumentMetadata>
  ): Promise<Document> {
    try {
      const document = this.documents.get(documentId);
      if (!document) {
        throw new Error(`Document not found: ${documentId}`);
      }

      // Check authorization
      if (document.userId !== userId) {
        throw new Error('Unauthorized to update this document');
      }

      // Update metadata
      if (updates.title) document.title = updates.title;
      if (updates.description) document.description = updates.description;
      if (updates.category) document.category = updates.category;
      if (updates.effectiveDate) document.effectiveDate = updates.effectiveDate;
      if (updates.expiryDate) document.expiryDate = updates.expiryDate;
      if (updates.tags) document.tags = updates.tags;

      document.updatedAt = new Date();
      document.version++;

      // Re-index document
      this.removeFromSearchIndex(documentId);
      await this.indexDocument(document);

      // Log audit event
      this.logAuditEvent(documentId, userId, 'update', {
        updates,
      });

      logger.info({
        message: 'Document metadata updated',
        documentId,
        userId,
      });

      return document;
    } catch (error) {
      logger.error({
        message: 'Document metadata update failed',
        error,
      });
      throw error;
    }
  }

  /**
   * List documents with filtering and pagination
   */
  async listDocuments(userId: string, filters?: DocumentFilters): Promise<DocumentSearchResult> {
    try {
      let results = Array.from(this.documents.values()).filter(
        (doc) => doc.userId === userId && doc.isActive
      );

      // Apply filters
      if (filters?.category) {
        results = results.filter((doc) => doc.category === filters.category);
      }

      if (filters?.tags && filters.tags.length > 0) {
        results = results.filter((doc) => filters.tags!.some((tag) => doc.tags.includes(tag)));
      }

      if (filters?.dateRange) {
        results = results.filter(
          (doc) =>
            doc.uploadedAt >= filters.dateRange!.start && doc.uploadedAt <= filters.dateRange!.end
        );
      }

      // Apply sorting
      const sortBy = filters?.sortBy || 'date';
      const sortOrder = filters?.sortOrder || 'desc';

      results.sort((a, b) => {
        let comparison = 0;
        switch (sortBy) {
          case 'name':
            comparison = a.title.localeCompare(b.title);
            break;
          case 'date':
            comparison = a.uploadedAt.getTime() - b.uploadedAt.getTime();
            break;
          case 'usage': {
            const usageA = this.documentUsage.get(a.id)?.length || 0;
            const usageB = this.documentUsage.get(b.id)?.length || 0;
            comparison = usageA - usageB;
            break;
          }
          default:
            comparison = 0;
        }
        return sortOrder === 'asc' ? comparison : -comparison;
      });

      // Apply pagination
      const page = filters?.page || 1;
      const pageSize = filters?.pageSize || 20;
      const start = (page - 1) * pageSize;
      const end = start + pageSize;

      const paginatedResults = results.slice(start, end);

      return {
        documents: paginatedResults,
        total: results.length,
        page,
        pageSize,
      };
    } catch (error) {
      logger.error({
        message: 'Document listing failed',
        error,
      });
      throw error;
    }
  }

  /**
   * Search documents
   */
  async searchDocuments(
    userId: string,
    query: string,
    filters?: DocumentFilters
  ): Promise<DocumentSearchResult> {
    try {
      let results = Array.from(this.documents.values()).filter(
        (doc) => doc.userId === userId && doc.isActive
      );

      // Full-text search
      const queryTerms = query.toLowerCase().split(/\s+/);
      results = results.filter((doc) => {
        const searchableText =
          `${doc.title} ${doc.description} ${doc.tags.join(' ')}`.toLowerCase();
        return queryTerms.some((term) => searchableText.includes(term));
      });

      // Apply other filters
      if (filters?.category) {
        results = results.filter((doc) => doc.category === filters.category);
      }

      if (filters?.tags && filters.tags.length > 0) {
        results = results.filter((doc) => filters.tags!.some((tag) => doc.tags.includes(tag)));
      }

      if (filters?.dateRange) {
        results = results.filter(
          (doc) =>
            doc.uploadedAt >= filters.dateRange!.start && doc.uploadedAt <= filters.dateRange!.end
        );
      }

      // Log search audit event
      results.forEach((doc) => {
        this.logAuditEvent(doc.id, userId, 'search', { query });
      });

      // Apply sorting
      const sortBy = filters?.sortBy || 'relevance';
      const sortOrder = filters?.sortOrder || 'desc';

      if (sortBy === 'relevance') {
        // Simple relevance scoring: exact matches score higher
        results.sort((a, b) => {
          const aScore = queryTerms.filter((term) => a.title.toLowerCase().includes(term)).length;
          const bScore = queryTerms.filter((term) => b.title.toLowerCase().includes(term)).length;
          return sortOrder === 'asc' ? aScore - bScore : bScore - aScore;
        });
      } else {
        results.sort((a, b) => {
          let comparison = 0;
          switch (sortBy) {
            case 'name':
              comparison = a.title.localeCompare(b.title);
              break;
            case 'date':
              comparison = a.uploadedAt.getTime() - b.uploadedAt.getTime();
              break;
            case 'usage': {
              const usageA = this.documentUsage.get(a.id)?.length || 0;
              const usageB = this.documentUsage.get(b.id)?.length || 0;
              comparison = usageA - usageB;
              break;
            }
          }
          return sortOrder === 'asc' ? comparison : -comparison;
        });
      }

      // Apply pagination
      const page = filters?.page || 1;
      const pageSize = filters?.pageSize || 20;
      const start = (page - 1) * pageSize;
      const end = start + pageSize;

      const paginatedResults = results.slice(start, end);

      return {
        documents: paginatedResults,
        total: results.length,
        page,
        pageSize,
      };
    } catch (error) {
      logger.error({
        message: 'Document search failed',
        error,
      });
      throw error;
    }
  }

  /**
   * Extract text from file
   */
  private async extractTextFromFile(file: File): Promise<string> {
    const fileType = this.getFileType(file.name);

    switch (fileType) {
      case 'txt':
      case 'md':
        return await file.text();
      case 'pdf':
        // In production, use pdf-parse library
        return await file.text();
      case 'docx':
        // In production, use docx library
        return await file.text();
      default:
        throw new Error(`Unsupported file type: ${fileType}`);
    }
  }

  /**
   * Get file type from filename
   */
  private getFileType(filename: string): 'pdf' | 'docx' | 'txt' | 'md' {
    const ext = filename.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'pdf':
        return 'pdf';
      case 'docx':
        return 'docx';
      case 'txt':
        return 'txt';
      case 'md':
        return 'md';
      default:
        throw new Error(`Unsupported file type: ${ext}`);
    }
  }

  /**
   * Hash document content for duplicate detection
   */
  private hashContent(content: string): string {
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  /**
   * Index document for search
   */
  private async indexDocument(document: Document): Promise<void> {
    const terms = this.extractSearchTerms(document);
    terms.forEach((term) => {
      if (!this.searchIndex.has(term)) {
        this.searchIndex.set(term, new Set());
      }
      this.searchIndex.get(term)!.add(document.id);
    });
  }

  /**
   * Extract search terms from document
   */
  private extractSearchTerms(document: Document): string[] {
    const text =
      `${document.title} ${document.description} ${document.tags.join(' ')}`.toLowerCase();
    return text.split(/\s+/).filter((term) => term.length > 2);
  }

  /**
   * Remove document from search index
   */
  private removeFromSearchIndex(documentId: string): void {
    this.searchIndex.forEach((docIds) => {
      docIds.delete(documentId);
    });
  }

  /**
   * Track document usage
   */
  async trackDocumentUsage(
    documentId: string,
    noteId: string,
    userId: string,
    context: Record<string, any>
  ): Promise<void> {
    try {
      const usageEntry: DocumentUsageEntry = {
        id: generateUUID(),
        documentId,
        noteId,
        userId,
        usedAt: new Date(),
        context,
      };

      if (!this.documentUsage.has(documentId)) {
        this.documentUsage.set(documentId, []);
      }
      this.documentUsage.get(documentId)!.push(usageEntry);

      logger.info({
        message: 'Document usage tracked',
        documentId,
        noteId,
        userId,
      });
    } catch (error) {
      logger.error({
        message: 'Document usage tracking failed',
        error,
      });
      throw error;
    }
  }

  /**
   * Get document usage statistics
   */
  async getDocumentUsageStats(documentId: string): Promise<UsageStats> {
    try {
      const usageEntries = this.documentUsage.get(documentId) || [];

      const usageByDiscipline: Record<string, number> = {};
      const usageByDocumentType: Record<string, number> = {};
      const recentNotes: string[] = [];

      usageEntries.forEach((entry) => {
        if (entry.context.discipline) {
          usageByDiscipline[entry.context.discipline] =
            (usageByDiscipline[entry.context.discipline] || 0) + 1;
        }
        if (entry.context.documentType) {
          usageByDocumentType[entry.context.documentType] =
            (usageByDocumentType[entry.context.documentType] || 0) + 1;
        }
        recentNotes.push(entry.noteId);
      });

      return {
        documentId,
        totalUsages: usageEntries.length,
        lastUsed: usageEntries[usageEntries.length - 1]?.usedAt,
        usageByDiscipline,
        usageByDocumentType,
        recentNotes: recentNotes.slice(-10),
      };
    } catch (error) {
      logger.error({
        message: 'Failed to get usage statistics',
        error,
      });
      throw error;
    }
  }

  /**
   * Get audit log for document
   */
  async getDocumentAuditLog(documentId: string): Promise<DocumentAuditEntry[]> {
    try {
      return this.documentAuditLog.get(documentId) || [];
    } catch (error) {
      logger.error({
        message: 'Failed to get audit log',
        error,
      });
      throw error;
    }
  }

  /**
   * Log audit event
   */
  private logAuditEvent(
    documentId: string,
    userId: string,
    action: 'upload' | 'update' | 'delete' | 'view' | 'search',
    details: Record<string, any>
  ): void {
    const entry: DocumentAuditEntry = {
      id: generateUUID(),
      documentId,
      userId,
      action,
      details,
      createdAt: new Date(),
    };

    if (!this.documentAuditLog.has(documentId)) {
      this.documentAuditLog.set(documentId, []);
    }
    this.documentAuditLog.get(documentId)!.push(entry);
  }

  /**
   * Get all documents (for testing)
   */
  getAllDocuments(): Document[] {
    return Array.from(this.documents.values());
  }

  /**
   * Clear all data (for testing)
   */
  clearAll(): void {
    this.documents.clear();
    this.documentUsage.clear();
    this.documentAuditLog.clear();
    this.policyRequirements.clear();
    this.searchIndex.clear();
  }
}

// Export singleton instance
export const knowledgeBaseService = new KnowledgeBaseService();

export default knowledgeBaseService;
