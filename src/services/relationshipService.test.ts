import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RelationshipService } from './relationshipService';

// Mock auditLog at top level
vi.mock('../lib/auditLogger', () => ({
  auditLog: vi.fn().mockResolvedValue(undefined),
}));

describe('RelationshipService', () => {
  let service: RelationshipService;

  beforeEach(() => {
    service = new RelationshipService();
  });

  describe('addRelationship', () => {
    it('should create a relationship between two documents', async () => {
      const rel = await service.addRelationship(
        'doc-1',
        'doc-2',
        'supersedes',
        'user-1',
        'Updated policy'
      );

      expect(rel).toBeDefined();
      expect(rel.sourceDocumentId).toBe('doc-1');
      expect(rel.targetDocumentId).toBe('doc-2');
      expect(rel.type).toBe('supersedes');
      expect(rel.description).toBe('Updated policy');
      expect(rel.isActive).toBe(true);
    });

    it('should throw error for self-referential relationship', async () => {
      await expect(
        service.addRelationship('doc-1', 'doc-1', 'supersedes', 'user-1')
      ).rejects.toThrow('Cannot create relationship between document and itself');
    });

    it('should support different relationship types', async () => {
      const supersedes = await service.addRelationship(
        'doc-1',
        'doc-2',
        'supersedes',
        'user-1'
      );
      const relatedTo = await service.addRelationship(
        'doc-1',
        'doc-3',
        'related_to',
        'user-1'
      );
      const dependsOn = await service.addRelationship(
        'doc-1',
        'doc-4',
        'depends_on',
        'user-1'
      );

      expect(supersedes.type).toBe('supersedes');
      expect(relatedTo.type).toBe('related_to');
      expect(dependsOn.type).toBe('depends_on');
    });

    it('should generate unique relationship IDs', async () => {
      const rel1 = await service.addRelationship('doc-1', 'doc-2', 'supersedes', 'user-1');
      const rel2 = await service.addRelationship('doc-1', 'doc-3', 'supersedes', 'user-1');

      expect(rel1.id).not.toBe(rel2.id);
    });
  });

  describe('getDocumentRelationships', () => {
    beforeEach(async () => {
      await service.addRelationship('doc-1', 'doc-2', 'supersedes', 'user-1');
      await service.addRelationship('doc-1', 'doc-3', 'related_to', 'user-1');
      await service.addRelationship('doc-4', 'doc-1', 'depends_on', 'user-1');
    });

    it('should get outgoing relationships', async () => {
      const rels = await service.getDocumentRelationships('doc-1', 'outgoing');
      expect(rels.length).toBe(2);
      expect(rels.every(r => r.sourceDocumentId === 'doc-1')).toBe(true);
    });

    it('should get incoming relationships', async () => {
      const rels = await service.getDocumentRelationships('doc-1', 'incoming');
      expect(rels.length).toBe(1);
      expect(rels[0].targetDocumentId).toBe('doc-1');
    });

    it('should get all relationships (both directions)', async () => {
      const rels = await service.getDocumentRelationships('doc-1', 'both');
      expect(rels.length).toBe(3);
    });

    it('should return empty array for document with no relationships', async () => {
      const rels = await service.getDocumentRelationships('doc-99');
      expect(rels.length).toBe(0);
    });
  });

  describe('getRelatedDocuments', () => {
    beforeEach(async () => {
      await service.addRelationship('doc-1', 'doc-2', 'supersedes', 'user-1');
      await service.addRelationship('doc-1', 'doc-3', 'related_to', 'user-1');
      await service.addRelationship('doc-1', 'doc-4', 'depends_on', 'user-1');
    });

    it('should get all related documents', async () => {
      const related = await service.getRelatedDocuments('doc-1');
      expect(related).toContain('doc-2');
      expect(related).toContain('doc-3');
      expect(related).toContain('doc-4');
    });

    it('should filter by relationship type', async () => {
      const supersedes = await service.getRelatedDocuments('doc-1', 'supersedes');
      expect(supersedes).toEqual(['doc-2']);

      const relatedTo = await service.getRelatedDocuments('doc-1', 'related_to');
      expect(relatedTo).toEqual(['doc-3']);

      const dependsOn = await service.getRelatedDocuments('doc-1', 'depends_on');
      expect(dependsOn).toEqual(['doc-4']);
    });
  });

  describe('detectConflicts', () => {
    it('should detect circular dependencies', async () => {
      await service.addRelationship('doc-1', 'doc-2', 'depends_on', 'user-1');
      await service.addRelationship('doc-2', 'doc-3', 'depends_on', 'user-1');

      const conflicts = await service.detectConflicts('doc-3', 'doc-1');
      expect(conflicts.length).toBeGreaterThan(0);
      expect(conflicts[0].type).toBe('circular_dependency');
    });

    it('should detect conflicting supersedes relationships', async () => {
      await service.addRelationship('doc-1', 'doc-2', 'supersedes', 'user-1');
      await service.addRelationship('doc-2', 'doc-1', 'supersedes', 'user-1');

      const conflicts = await service.detectConflicts('doc-1', 'doc-2');
      expect(conflicts.length).toBeGreaterThan(0);
      expect(conflicts.some(c => c.type === 'conflicting_supersedes')).toBe(true);
    });

    it('should detect multiple supersedes relationships', async () => {
      await service.addRelationship('doc-1', 'doc-2', 'supersedes', 'user-1');
      await service.addRelationship('doc-1', 'doc-3', 'supersedes', 'user-1');

      const conflicts = await service.detectConflicts('doc-1', 'doc-4');
      expect(conflicts.length).toBeGreaterThan(0);
      expect(conflicts.some(c => c.type === 'multiple_supersedes')).toBe(true);
    });

    it('should return empty array for no conflicts', async () => {
      const conflicts = await service.detectConflicts('doc-1', 'doc-2');
      expect(conflicts.length).toBe(0);
    });
  });

  describe('removeRelationship', () => {
    it('should remove a relationship', async () => {
      const rel = await service.addRelationship('doc-1', 'doc-2', 'supersedes', 'user-1');
      const removed = await service.removeRelationship(rel.id, 'user-1');

      expect(removed).toBe(true);

      const rels = await service.getDocumentRelationships('doc-1');
      expect(rels.length).toBe(0);
    });

    it('should return false for non-existent relationship', async () => {
      const removed = await service.removeRelationship('non-existent', 'user-1');
      expect(removed).toBe(false);
    });
  });

  describe('getRelationshipGraph', () => {
    beforeEach(async () => {
      await service.addRelationship('doc-1', 'doc-2', 'supersedes', 'user-1');
      await service.addRelationship('doc-2', 'doc-3', 'related_to', 'user-1');
      await service.addRelationship('doc-1', 'doc-4', 'depends_on', 'user-1');
    });

    it('should generate relationship graph', async () => {
      const graph = await service.getRelationshipGraph('doc-1');

      expect(graph.nodes).toBeDefined();
      expect(graph.edges).toBeDefined();
      expect(graph.nodes.length).toBeGreaterThan(0);
      expect(graph.edges.length).toBeGreaterThan(0);
    });

    it('should include all connected documents', async () => {
      const graph = await service.getRelationshipGraph('doc-1');
      const nodeIds = graph.nodes.map(n => n.id);

      expect(nodeIds).toContain('doc-1');
      expect(nodeIds).toContain('doc-2');
      expect(nodeIds).toContain('doc-3');
      expect(nodeIds).toContain('doc-4');
    });

    it('should include all relationships as edges', async () => {
      const graph = await service.getRelationshipGraph('doc-1');

      expect(graph.edges.some(e => e.source === 'doc-1' && e.target === 'doc-2')).toBe(true);
      expect(graph.edges.some(e => e.source === 'doc-2' && e.target === 'doc-3')).toBe(true);
      expect(graph.edges.some(e => e.source === 'doc-1' && e.target === 'doc-4')).toBe(true);
    });
  });

  describe('getRelationshipStats', () => {
    beforeEach(async () => {
      await service.addRelationship('doc-1', 'doc-2', 'supersedes', 'user-1');
      await service.addRelationship('doc-1', 'doc-3', 'related_to', 'user-1');
      await service.addRelationship('doc-4', 'doc-1', 'depends_on', 'user-1');
    });

    it('should return relationship statistics', async () => {
      const stats = await service.getRelationshipStats('doc-1');

      expect(stats.totalRelationships).toBe(3);
      expect(stats.outgoing).toBe(2);
      expect(stats.incoming).toBe(1);
    });

    it('should count relationships by type', async () => {
      const stats = await service.getRelationshipStats('doc-1');

      expect(stats.byType.supersedes).toBe(1);
      expect(stats.byType.related_to).toBe(1);
      expect(stats.byType.depends_on).toBe(1);
    });

    it('should return zero stats for document with no relationships', async () => {
      const stats = await service.getRelationshipStats('doc-99');

      expect(stats.totalRelationships).toBe(0);
      expect(stats.outgoing).toBe(0);
      expect(stats.incoming).toBe(0);
    });
  });

  describe('updateRelationshipDescription', () => {
    it('should update relationship description', async () => {
      const rel = await service.addRelationship('doc-1', 'doc-2', 'supersedes', 'user-1');
      const updated = await service.updateRelationshipDescription(
        rel.id,
        'Updated description',
        'user-1'
      );

      expect(updated?.description).toBe('Updated description');
    });

    it('should return null for non-existent relationship', async () => {
      const updated = await service.updateRelationshipDescription(
        'non-existent',
        'New description',
        'user-1'
      );

      expect(updated).toBeNull();
    });
  });

  describe('getAllRelationships', () => {
    it('should return all relationships', async () => {
      await service.addRelationship('doc-1', 'doc-2', 'supersedes', 'user-1');
      await service.addRelationship('doc-3', 'doc-4', 'related_to', 'user-1');
      await service.addRelationship('doc-5', 'doc-6', 'depends_on', 'user-1');

      const all = await service.getAllRelationships();
      expect(all.length).toBe(3);
    });

    it('should not include inactive relationships', async () => {
      const rel = await service.addRelationship('doc-1', 'doc-2', 'supersedes', 'user-1');
      await service.removeRelationship(rel.id, 'user-1');

      const all = await service.getAllRelationships();
      expect(all.length).toBe(0);
    });
  });
});
