import { Document, DocumentVersion, VersionDiff } from '../types';
import { auditLog } from '../lib/auditLogger';

/**
 * Service for managing document versioning and version history
 */
export class VersioningService {
  private versions: Map<string, DocumentVersion[]> = new Map();
  private versionCounter: Map<string, number> = new Map();

  /**
   * Create a new version of a document
   */
  async createVersion(
    document: Document,
    userId: string,
    changeDescription: string
  ): Promise<DocumentVersion> {
    const documentId = document.id;
    const currentCount = this.versionCounter.get(documentId) || 0;
    const versionNumber = currentCount + 1;

    const version: DocumentVersion = {
      id: `${documentId}-v${versionNumber}`,
      documentId,
      versionNumber,
      content: document.content,
      metadata: document.metadata,
      title: document.title,
      description: document.description,
      createdAt: new Date(),
      createdBy: userId,
      changeDescription,
      contentHash: this.hashContent(document.content),
    };

    // Store version
    const docVersions = this.versions.get(documentId) || [];
    docVersions.push(version);
    this.versions.set(documentId, docVersions);
    this.versionCounter.set(documentId, versionNumber);

    // Audit log
    await auditLog({
      action: 'CREATE_VERSION',
      resourceType: 'Document',
      resourceId: documentId,
      userId,
      details: {
        versionNumber,
        changeDescription,
      },
      status: 'success',
      timestamp: new Date(),
    });

    return version;
  }

  /**
   * Get a specific version of a document
   */
  async getDocumentVersion(
    documentId: string,
    versionNumber: number
  ): Promise<DocumentVersion | null> {
    const versions = this.versions.get(documentId);
    if (!versions) return null;

    return versions.find(v => v.versionNumber === versionNumber) || null;
  }

  /**
   * Get the latest version of a document
   */
  async getLatestVersion(documentId: string): Promise<DocumentVersion | null> {
    const versions = this.versions.get(documentId);
    if (!versions || versions.length === 0) return null;

    return versions[versions.length - 1];
  }

  /**
   * List all versions of a document
   */
  async listDocumentVersions(
    documentId: string,
    options?: {
      limit?: number;
      offset?: number;
      sortBy?: 'date' | 'version';
      sortOrder?: 'asc' | 'desc';
    }
  ): Promise<{
    versions: DocumentVersion[];
    total: number;
  }> {
    const versions = this.versions.get(documentId) || [];
    const limit = options?.limit || 10;
    const offset = options?.offset || 0;
    const sortBy = options?.sortBy || 'version';
    const sortOrder = options?.sortOrder || 'desc';

    // Sort versions
    const sorted = [...versions];
    if (sortBy === 'date') {
      sorted.sort((a, b) => {
        const comparison = a.createdAt.getTime() - b.createdAt.getTime();
        return sortOrder === 'asc' ? comparison : -comparison;
      });
    } else {
      sorted.sort((a, b) => {
        const comparison = a.versionNumber - b.versionNumber;
        return sortOrder === 'asc' ? comparison : -comparison;
      });
    }

    // Paginate
    const paginated = sorted.slice(offset, offset + limit);

    return {
      versions: paginated,
      total: versions.length,
    };
  }

  /**
   * Compare two versions of a document
   */
  async compareVersions(
    documentId: string,
    versionNumber1: number,
    versionNumber2: number
  ): Promise<VersionDiff | null> {
    const version1 = await this.getDocumentVersion(documentId, versionNumber1);
    const version2 = await this.getDocumentVersion(documentId, versionNumber2);

    if (!version1 || !version2) return null;

    const diff: VersionDiff = {
      documentId,
      fromVersion: versionNumber1,
      toVersion: versionNumber2,
      titleChanged: version1.title !== version2.title,
      titleOld: version1.title,
      titleNew: version2.title,
      descriptionChanged: version1.description !== version2.description,
      descriptionOld: version1.description,
      descriptionNew: version2.description,
      contentChanged: version1.contentHash !== version2.contentHash,
      contentLengthOld: version1.content.length,
      contentLengthNew: version2.content.length,
      metadataChanged: JSON.stringify(version1.metadata) !== JSON.stringify(version2.metadata),
      metadataOld: version1.metadata,
      metadataNew: version2.metadata,
      createdAt: new Date(),
    };

    return diff;
  }

  /**
   * Restore a document to a previous version
   */
  async restoreVersion(
    documentId: string,
    versionNumber: number,
    userId: string,
    reason: string
  ): Promise<Document | null> {
    const version = await this.getDocumentVersion(documentId, versionNumber);
    if (!version) return null;

    // Create a new version with restored content
    const restoredDocument: Document = {
      id: documentId,
      userId,
      title: version.title,
      description: version.description,
      category: 'Policy',
      content: version.content,
      contentHash: version.contentHash,
      fileType: 'md',
      fileSize: version.content.length,
      uploadedAt: new Date(),
      updatedAt: new Date(),
      version: (this.versionCounter.get(documentId) || 0) + 1,
      tags: [],
      isActive: true,
      metadata: version.metadata,
    };

    // Create new version entry
    await this.createVersion(
      restoredDocument,
      userId,
      `Restored from version ${versionNumber}. Reason: ${reason}`
    );

    // Audit log
    await auditLog({
      action: 'access',
      resourceType: 'system',
      resourceId: documentId,
      userId,
      details: {
        operation: 'RESTORE_VERSION',
        restoredFromVersion: versionNumber,
        reason,
      },
      timestamp: new Date(),
      status: 'success',
    });

    return restoredDocument;
  }

  /**
   * Delete all versions of a document
   */
  async deleteAllVersions(documentId: string, userId: string): Promise<void> {
    this.versions.delete(documentId);
    this.versionCounter.delete(documentId);

    await auditLog({
      action: 'access',
      resourceType: 'system',
      resourceId: documentId,
      userId,
      details: {
        operation: 'DELETE_ALL_VERSIONS',
      },
      timestamp: new Date(),
      status: 'success',
    });
  }

  /**
   * Get version statistics
   */
  async getVersionStats(documentId: string): Promise<{
    totalVersions: number;
    latestVersion: number;
    oldestVersion: DocumentVersion | null;
    newestVersion: DocumentVersion | null;
    averageChangeSize: number;
  }> {
    const versions = this.versions.get(documentId) || [];
    if (versions.length === 0) {
      return {
        totalVersions: 0,
        latestVersion: 0,
        oldestVersion: null,
        newestVersion: null,
        averageChangeSize: 0,
      };
    }

    const oldestVersion = versions[0];
    const newestVersion = versions[versions.length - 1];

    // Calculate average change size
    let totalChangeSize = 0;
    for (let i = 1; i < versions.length; i++) {
      const prev = versions[i - 1];
      const curr = versions[i];
      const changeSize = Math.abs(curr.content.length - prev.content.length);
      totalChangeSize += changeSize;
    }
    const averageChangeSize = versions.length > 1 ? totalChangeSize / (versions.length - 1) : 0;

    return {
      totalVersions: versions.length,
      latestVersion: newestVersion.versionNumber,
      oldestVersion,
      newestVersion,
      averageChangeSize,
    };
  }

  /**
   * Hash content for comparison
   */
  private hashContent(content: string): string {
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString(16);
  }
}

export const versioningService = new VersioningService();
