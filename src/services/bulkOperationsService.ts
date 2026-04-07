import { Document, DocumentMetadata } from '../types';
import { knowledgeBaseService } from './knowledgeBaseService';
import { auditLog } from '../lib/auditLogger';

/**
 * Service for bulk operations on documents
 */
export class BulkOperationsService {
  /**
   * Bulk upload documents
   */
  async bulkUpload(
    files: File[],
    metadata: Record<string, any> | Partial<DocumentMetadata>,
    userId: string,
    onProgress?: (current: number, total: number) => void
  ): Promise<{
    successful: Document[];
    failed: Array<{ file: string; error: string }>;
    total: number;
  }> {
    const successful: Document[] = [];
    const failed: Array<{ file: string; error: string }> = [];

    for (let i = 0; i < files.length; i++) {
      try {
        const doc = await knowledgeBaseService.uploadDocument(
          files[i],
          metadata as DocumentMetadata,
          userId
        );
        successful.push(doc);
      } catch (error: any) {
        failed.push({
          file: files[i].name,
          error: error.message || 'Upload failed',
        });
      }

      if (onProgress) {
        onProgress(i + 1, files.length);
      }
    }

    // Audit log
    await auditLog({
      action: 'BULK_UPLOAD',
      resourceType: 'Document',
      resourceId: 'bulk',
      userId,
      details: {
        successful: successful.length,
        failed: failed.length,
        total: files.length,
      },
      status: 'success',
      timestamp: new Date(),
    });

    return { successful, failed, total: files.length };
  }

  /**
   * Bulk delete documents
   */
  async bulkDelete(
    documentIds: string[],
    userId: string,
    reason?: string
  ): Promise<{
    successful: string[];
    failed: Array<{ id: string; error: string }>;
    total: number;
  }> {
    const successful: string[] = [];
    const failed: Array<{ id: string; error: string }> = [];

    for (const docId of documentIds) {
      try {
        await knowledgeBaseService.deleteDocument(docId, userId);
        successful.push(docId);
      } catch (error: any) {
        failed.push({
          id: docId,
          error: error.message || 'Delete failed',
        });
      }
    }

    // Audit log
    await auditLog({
      action: 'BULK_DELETE',
      resourceType: 'Document',
      resourceId: 'bulk',
      userId,
      details: {
        successful: successful.length,
        failed: failed.length,
        total: documentIds.length,
        reason,
      },
      status: 'success',
      timestamp: new Date(),
    });

    return { successful, failed, total: documentIds.length };
  }

  /**
   * Bulk update tags
   */
  async bulkUpdateTags(
    documentIds: string[],
    tags: string[],
    userId: string,
    operation: 'add' | 'remove' | 'replace' = 'add'
  ): Promise<{
    successful: string[];
    failed: Array<{ id: string; error: string }>;
    total: number;
  }> {
    const successful: string[] = [];
    const failed: Array<{ id: string; error: string }> = [];

    for (const docId of documentIds) {
      try {
        const doc = await knowledgeBaseService.getDocument(docId, userId);
        if (!doc) {
          throw new Error('Document not found');
        }

        let newTags = doc.tags || [];
        if (operation === 'add') {
          newTags = [...new Set([...newTags, ...tags])];
        } else if (operation === 'remove') {
          newTags = newTags.filter(t => !tags.includes(t));
        } else if (operation === 'replace') {
          newTags = tags;
        }

        await knowledgeBaseService.updateDocumentMetadata(docId, userId, {
          tags: newTags,
        });
        successful.push(docId);
      } catch (error: any) {
        failed.push({
          id: docId,
          error: error.message || 'Update failed',
        });
      }
    }

    // Audit log
    await auditLog({
      action: 'BULK_UPDATE_TAGS',
      resourceType: 'Document',
      resourceId: 'bulk',
      userId,
      details: {
        successful: successful.length,
        failed: failed.length,
        total: documentIds.length,
        operation,
        tags,
      },
      status: 'success',
      timestamp: new Date(),
    });

    return { successful, failed, total: documentIds.length };
  }

  /**
   * Bulk update category
   */
  async bulkUpdateCategory(
    documentIds: string[],
    category: string,
    userId: string
  ): Promise<{
    successful: string[];
    failed: Array<{ id: string; error: string }>;
    total: number;
  }> {
    const successful: string[] = [];
    const failed: Array<{ id: string; error: string }> = [];

    for (const docId of documentIds) {
      try {
        await knowledgeBaseService.updateDocumentMetadata(docId, userId, {
          category: category as any,
        });
        successful.push(docId);
      } catch (error: any) {
        failed.push({
          id: docId,
          error: error.message || 'Update failed',
        });
      }
    }

    // Audit log
    await auditLog({
      action: 'BULK_UPDATE_CATEGORY',
      resourceType: 'Document',
      resourceId: 'bulk',
      userId,
      details: {
        successful: successful.length,
        failed: failed.length,
        total: documentIds.length,
        category,
      },
      status: 'success',
      timestamp: new Date(),
    });

    return { successful, failed, total: documentIds.length };
  }

  /**
   * Get bulk operation status
   */
  async getBulkOperationStatus(operationId: string): Promise<{
    operationId: string;
    status: 'pending' | 'in_progress' | 'completed' | 'failed';
    progress: number;
    successful: number;
    failed: number;
    total: number;
    errors: Array<{ item: string; error: string }>;
  }> {
    // In production, this would query a database
    // For now, return a mock response
    return {
      operationId,
      status: 'completed',
      progress: 100,
      successful: 0,
      failed: 0,
      total: 0,
      errors: [],
    };
  }
}

export const bulkOperationsService = new BulkOperationsService();
