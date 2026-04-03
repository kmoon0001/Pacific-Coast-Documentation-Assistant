import { DocumentRelationship, RelationshipConflict } from '../types';
import { auditLog } from '../lib/auditLogger';

/**
 * Service for managing document relationships and dependencies
 */
export class RelationshipService {
  private relationships: Map<string, DocumentRelationship[]> = new Map();
  private relationshipId: number = 0;

  /**
   * Add a relationship between two documents
   */
  async addRelationship(
    sourceDocId: string,
    targetDocId: string,
    type: 'supersedes' | 'related_to' | 'depends_on',
    userId: string,
    description?: string
  ): Promise<DocumentRelationship> {
    if (sourceDocId === targetDocId) {
      throw new Error('Cannot create relationship between document and itself');
    }

    const relationship: DocumentRelationship = {
      id: `rel_${++this.relationshipId}`,
      sourceDocumentId: sourceDocId,
      targetDocumentId: targetDocId,
      type,
      description,
      createdAt: new Date(),
      createdBy: userId,
      isActive: true,
    };

    // Store relationship
    const sourceRels = this.relationships.get(sourceDocId) || [];
    sourceRels.push(relationship);
    this.relationships.set(sourceDocId, sourceRels);

    // Audit log
    await auditLog({
      action: 'CREATE_RELATIONSHIP',
      resourceType: 'DocumentRelationship',
      resourceId: relationship.id,
      userId,
      details: {
        sourceDocId,
        targetDocId,
        type,
        description,
      },
      timestamp: new Date(),
    });

    return relationship;
  }

  /**
   * Get all relationships for a document
   */
  async getDocumentRelationships(
    documentId: string,
    direction?: 'outgoing' | 'incoming' | 'both'
  ): Promise<DocumentRelationship[]> {
    const dir = direction || 'both';
    const relationships: DocumentRelationship[] = [];

    if (dir === 'outgoing' || dir === 'both') {
      const outgoing = this.relationships.get(documentId) || [];
      relationships.push(...outgoing);
    }

    if (dir === 'incoming' || dir === 'both') {
      // Find all relationships pointing to this document
      for (const [, rels] of this.relationships) {
        const incoming = rels.filter(r => r.targetDocumentId === documentId);
        relationships.push(...incoming);
      }
    }

    return relationships.filter(r => r.isActive);
  }

  /**
   * Get related documents
   */
  async getRelatedDocuments(
    documentId: string,
    type?: 'supersedes' | 'related_to' | 'depends_on'
  ): Promise<string[]> {
    const relationships = await this.getDocumentRelationships(documentId);
    
    let filtered = relationships;
    if (type) {
      filtered = relationships.filter(r => r.type === type);
    }

    return filtered.map(r => r.targetDocumentId);
  }

  /**
   * Detect conflicts between documents
   */
  async detectConflicts(
    sourceDocId: string,
    targetDocId: string
  ): Promise<RelationshipConflict[]> {
    const conflicts: RelationshipConflict[] = [];

    // Check for circular dependencies - can target reach source?
    const canReach = await this.canReachDocument(targetDocId, sourceDocId);
    if (canReach) {
      conflicts.push({
        type: 'circular_dependency',
        severity: 'high',
        description: `Creating this relationship would create a circular dependency`,
        affectedDocuments: [sourceDocId, targetDocId],
      });
    }

    // Check for conflicting supersedes relationships
    const sourceRels = await this.getDocumentRelationships(sourceDocId);
    const targetRels = await this.getDocumentRelationships(targetDocId);

    const sourceSupersedesTarget = sourceRels.some(
      r => r.type === 'supersedes' && r.targetDocumentId === targetDocId
    );
    const targetSupersedesSource = targetRels.some(
      r => r.type === 'supersedes' && r.targetDocumentId === sourceDocId
    );

    if (sourceSupersedesTarget && targetSupersedesSource) {
      conflicts.push({
        type: 'conflicting_supersedes',
        severity: 'high',
        description: 'Both documents claim to supersede each other',
        affectedDocuments: [sourceDocId, targetDocId],
      });
    }

    // Check for multiple supersedes relationships
    const sourceSupersedesCount = sourceRels.filter(r => r.type === 'supersedes').length;
    if (sourceSupersedesCount > 0) {
      conflicts.push({
        type: 'multiple_supersedes',
        severity: 'medium',
        description: `Document already supersedes ${sourceSupersedesCount} other document(s)`,
        affectedDocuments: sourceRels
          .filter(r => r.type === 'supersedes')
          .map(r => r.targetDocumentId),
      });
    }

    return conflicts;
  }

  /**
   * Check if one document can reach another through relationships
   */
  private async canReachDocument(
    fromDocId: string,
    toDocId: string,
    visited: Set<string> = new Set()
  ): Promise<boolean> {
    if (visited.has(fromDocId)) {
      return false;
    }

    visited.add(fromDocId);

    const relationships = this.relationships.get(fromDocId) || [];
    for (const rel of relationships) {
      if (rel.targetDocumentId === toDocId) {
        return true;
      }

      if (await this.canReachDocument(rel.targetDocumentId, toDocId, new Set(visited))) {
        return true;
      }
    }

    return false;
  }

  /**
   * Remove a relationship
   */
  async removeRelationship(
    relationshipId: string,
    userId: string
  ): Promise<boolean> {
    for (const [, rels] of this.relationships) {
      const index = rels.findIndex(r => r.id === relationshipId);
      if (index !== -1) {
        rels[index].isActive = false;

        await auditLog({
          action: 'DELETE_RELATIONSHIP',
          resourceType: 'DocumentRelationship',
          resourceId: relationshipId,
          userId,
          details: {},
          timestamp: new Date(),
        });

        return true;
      }
    }

    return false;
  }

  /**
   * Get relationship graph for a document
   */
  async getRelationshipGraph(documentId: string): Promise<{
    nodes: Array<{ id: string; type: string }>;
    edges: Array<{ source: string; target: string; type: string }>;
  }> {
    const visited = new Set<string>();
    const nodes: Array<{ id: string; type: string }> = [];
    const edges: Array<{ source: string; target: string; type: string }> = [];

    const queue = [documentId];
    visited.add(documentId);
    nodes.push({ id: documentId, type: 'document' });

    while (queue.length > 0) {
      const current = queue.shift()!;
      const relationships = this.relationships.get(current) || [];

      for (const rel of relationships) {
        if (!visited.has(rel.targetDocumentId)) {
          visited.add(rel.targetDocumentId);
          queue.push(rel.targetDocumentId);
          nodes.push({ id: rel.targetDocumentId, type: 'document' });
        }

        edges.push({
          source: rel.sourceDocumentId,
          target: rel.targetDocumentId,
          type: rel.type,
        });
      }
    }

    return { nodes, edges };
  }

  /**
   * Get relationship statistics
   */
  async getRelationshipStats(documentId: string): Promise<{
    totalRelationships: number;
    outgoing: number;
    incoming: number;
    byType: Record<string, number>;
    conflicts: number;
  }> {
    const relationships = await this.getDocumentRelationships(documentId);
    const outgoing = (this.relationships.get(documentId) || []).filter(r => r.isActive).length;
    
    let incoming = 0;
    for (const [, rels] of this.relationships) {
      incoming += rels.filter(r => r.targetDocumentId === documentId && r.isActive).length;
    }

    const byType: Record<string, number> = {
      supersedes: 0,
      related_to: 0,
      depends_on: 0,
    };

    for (const rel of relationships) {
      byType[rel.type]++;
    }

    // Count conflicts
    let conflictCount = 0;
    const relatedDocs = await this.getRelatedDocuments(documentId);
    for (const relatedDoc of relatedDocs) {
      const conflicts = await this.detectConflicts(documentId, relatedDoc);
      conflictCount += conflicts.length;
    }

    return {
      totalRelationships: relationships.length,
      outgoing,
      incoming,
      byType,
      conflicts: conflictCount,
    };
  }

  /**
   * Update relationship description
   */
  async updateRelationshipDescription(
    relationshipId: string,
    description: string,
    userId: string
  ): Promise<DocumentRelationship | null> {
    for (const [, rels] of this.relationships) {
      const rel = rels.find(r => r.id === relationshipId);
      if (rel) {
        rel.description = description;

        await auditLog({
          action: 'UPDATE_RELATIONSHIP',
          resourceType: 'DocumentRelationship',
          resourceId: relationshipId,
          userId,
          details: { description },
          timestamp: new Date(),
        });

        return rel;
      }
    }

    return null;
  }

  /**
   * Get all relationships
   */
  async getAllRelationships(): Promise<DocumentRelationship[]> {
    const all: DocumentRelationship[] = [];
    for (const [, rels] of this.relationships) {
      all.push(...rels.filter(r => r.isActive));
    }
    return all;
  }
}

export const relationshipService = new RelationshipService();
