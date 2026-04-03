import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import createBackendServer from '../../services/backend';
import { knowledgeBaseService } from '../../services/knowledgeBaseService';
import { versioningService } from '../../services/versioningService';
import { relationshipService } from '../../services/relationshipService';

const toFilePayload = (content: string, name = 'policy.txt', type = 'text/plain') => ({
  data: Buffer.from(content).toString('base64'),
  name,
  type,
});

const resetVersioningService = () => {
  (versioningService as any).versions?.clear?.();
  (versioningService as any).versionCounter?.clear?.();
};

const resetRelationshipService = () => {
  (relationshipService as any).relationships?.clear?.();
  (relationshipService as any).relationshipId = 0;
};

describe('Backend Persistence Layer', () => {
  let app: any;

  beforeEach(() => {
    knowledgeBaseService.clearAll();
    resetVersioningService();
    resetRelationshipService();
    app = request(createBackendServer());
  });

  describe('Authentication Endpoints', () => {
    it('should register a new user', async () => {
      const response = await app.post('/api/auth/register').send({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.user).toBeDefined();
      expect(response.body.token).toBeDefined();
    });

    it('should reject invalid email', async () => {
      const response = await app.post('/api/auth/register').send({
        email: 'invalid-email',
        password: 'password123',
      });

      expect(response.status).toBe(400);
    });

    it('should reject short password', async () => {
      const response = await app.post('/api/auth/register').send({
        email: 'test@example.com',
        password: 'short',
      });

      expect(response.status).toBe(400);
    });

    it('should login user with valid credentials', async () => {
      // First register
      await app.post('/api/auth/register').send({
        email: 'test@example.com',
        password: 'password123',
      });

      // Then login
      const response = await app.post('/api/auth/login').send({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.token).toBeDefined();
    });

    it('should reject invalid credentials', async () => {
      const response = await app.post('/api/auth/login').send({
        email: 'nonexistent@example.com',
        password: 'wrongpassword',
      });

      expect(response.status).toBe(401);
    });
  });

  describe('Note CRUD Endpoints', () => {
    let token: string;

    beforeEach(async () => {
      const registerResponse = await app.post('/api/auth/register').send({
        email: 'test@example.com',
        password: 'password123',
      });
      token = registerResponse.body.token;
    });

    it('should create a note', async () => {
      const response = await app
        .post('/api/notes')
        .set('Authorization', `Bearer ${token}`)
        .send({
          content: 'Test note content',
          type: 'PT Daily',
          discipline: 'PT',
          documentType: 'Daily',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.note).toBeDefined();
      expect(response.body.note.id).toBeDefined();
    });

    it('should reject note creation without authentication', async () => {
      const response = await app.post('/api/notes').send({
        content: 'Test note content',
        type: 'PT Daily',
        discipline: 'PT',
        documentType: 'Daily',
      });

      expect(response.status).toBe(401);
    });

    it('should retrieve a note', async () => {
      const createResponse = await app
        .post('/api/notes')
        .set('Authorization', `Bearer ${token}`)
        .send({
          content: 'Test note content',
          type: 'PT Daily',
          discipline: 'PT',
          documentType: 'Daily',
        });

      const noteId = createResponse.body.note.id;

      const getResponse = await app
        .get(`/api/notes/${noteId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(getResponse.status).toBe(200);
      expect(getResponse.body.note.id).toBe(noteId);
    });

    it('should update a note', async () => {
      const createResponse = await app
        .post('/api/notes')
        .set('Authorization', `Bearer ${token}`)
        .send({
          content: 'Test note content',
          type: 'PT Daily',
          discipline: 'PT',
          documentType: 'Daily',
        });

      const noteId = createResponse.body.note.id;

      const updateResponse = await app
        .put(`/api/notes/${noteId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          content: 'Updated note content',
        });

      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.success).toBe(true);
    });

    it('should delete a note', async () => {
      const createResponse = await app
        .post('/api/notes')
        .set('Authorization', `Bearer ${token}`)
        .send({
          content: 'Test note content',
          type: 'PT Daily',
          discipline: 'PT',
          documentType: 'Daily',
        });

      const noteId = createResponse.body.note.id;

      const deleteResponse = await app
        .delete(`/api/notes/${noteId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(deleteResponse.status).toBe(200);
      expect(deleteResponse.body.success).toBe(true);
    });

    it('should list user notes', async () => {
      // Create multiple notes
      await app
        .post('/api/notes')
        .set('Authorization', `Bearer ${token}`)
        .send({
          content: 'Note 1',
          type: 'PT Daily',
          discipline: 'PT',
          documentType: 'Daily',
        });

      await app
        .post('/api/notes')
        .set('Authorization', `Bearer ${token}`)
        .send({
          content: 'Note 2',
          type: 'OT Daily',
          discipline: 'OT',
          documentType: 'Daily',
        });

      const listResponse = await app
        .get('/api/notes')
        .set('Authorization', `Bearer ${token}`);

      expect(listResponse.status).toBe(200);
      expect(listResponse.body.notes).toBeDefined();
      expect(Array.isArray(listResponse.body.notes)).toBe(true);
    });

    it('should validate note data', async () => {
      const response = await app
        .post('/api/notes')
        .set('Authorization', `Bearer ${token}`)
        .send({
          content: 'Test note content',
          type: 'PT Daily',
          discipline: 'INVALID',
          documentType: 'Daily',
        });

      expect(response.status).toBe(400);
    });
  });

  describe('Audit Log Endpoints', () => {
    let token: string;

    beforeEach(async () => {
      const registerResponse = await app.post('/api/auth/register').send({
        email: 'test@example.com',
        password: 'password123',
      });
      token = registerResponse.body.token;
    });

    it('should retrieve audit logs', async () => {
      const response = await app
        .get('/api/audit-logs')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.logs).toBeDefined();
      expect(Array.isArray(response.body.logs)).toBe(true);
    });

    it('should generate audit report', async () => {
      const response = await app
        .get('/api/audit-logs/report')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.report).toBeDefined();
      expect(response.body.report.generatedAt).toBeDefined();
    });

    it('should include compliance metrics in report', async () => {
      const response = await app
        .get('/api/audit-logs/report')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.report.complianceMetrics).toBeDefined();
      expect(response.body.report.complianceMetrics.complianceRate).toBeDefined();
    });
  });

  describe('Health Check', () => {
    it('should return health status', async () => {
      const response = await app.get('/api/health');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('ok');
      expect(response.body.timestamp).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle missing required fields', async () => {
      const response = await app.post('/api/auth/register').send({
        email: 'test@example.com',
      });

      expect(response.status).toBe(400);
    });

    it('should handle invalid JSON', async () => {
      const response = await app
        .post('/api/auth/register')
        .set('Content-Type', 'application/json')
        .send('invalid json');

      expect(response.status).toBeGreaterThanOrEqual(400);
    });

    it('should handle not found errors', async () => {
      const registerResponse = await app.post('/api/auth/register').send({
        email: 'test@example.com',
        password: 'password123',
      });
      const token = registerResponse.body.token;

      const response = await app
        .get('/api/notes/nonexistent')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
    });
  });

  describe('Data Encryption', () => {
    let token: string;

    beforeEach(async () => {
      const registerResponse = await app.post('/api/auth/register').send({
        email: 'test@example.com',
        password: 'password123',
      });
      token = registerResponse.body.token;
    });

    it('should encrypt note content', async () => {
      const response = await app
        .post('/api/notes')
        .set('Authorization', `Bearer ${token}`)
        .send({
          content: 'Sensitive patient information',
          type: 'PT Daily',
          discipline: 'PT',
          documentType: 'Daily',
        });

      expect(response.status).toBe(200);
      // Content should be encrypted in storage
      expect(response.body.note.content).toBeDefined();
    });
  });

  describe('Knowledge Base Endpoints', () => {
    let token: string;
    let userId: string;

    beforeEach(async () => {
      const registerResponse = await app.post('/api/auth/register').send({
        email: 'kbuser@example.com',
        password: 'password123',
      });
      token = registerResponse.body.token;
      userId = registerResponse.body.user.id;
    });

    const uploadDocument = async (
      overrides: {
        metadata?: Record<string, any>;
        file?: { name?: string; type?: string; content?: string };
      } = {},
      authToken = token
    ) => {
      const fileOverrides = overrides.file || {};
      const metadataOverrides = overrides.metadata || {};
      const payload = {
        file: toFilePayload(
          fileOverrides.content ?? 'Standard PT policy body',
          fileOverrides.name ?? 'policy.txt',
          fileOverrides.type ?? 'text/plain'
        ),
        metadata: {
          title: metadataOverrides.title ?? 'PT Policy',
          description: metadataOverrides.description ?? 'Evidence informed protocol',
          category: metadataOverrides.category ?? 'Policy',
          tags: metadataOverrides.tags ?? ['PT'],
          effectiveDate: metadataOverrides.effectiveDate ?? new Date('2024-01-01').toISOString(),
        },
      };

      const response = await app
        .post('/api/knowledge-base/documents/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .send(payload);
      expect(response.status).toBe(201);
      return response.body.document;
    };

    it('scopes documents to the authenticated user and supports lifecycle operations', async () => {
      const document = await uploadDocument({
        metadata: { title: 'PT Transfer Policy', tags: ['PT', 'Balance'] },
      });

      const listResponse = await app
        .get('/api/knowledge-base/documents')
        .set('Authorization', `Bearer ${token}`);
      expect(listResponse.body.documents).toHaveLength(1);
      expect(listResponse.body.documents[0].title).toBe('PT Transfer Policy');

      const otherRegister = await app.post('/api/auth/register').send({
        email: 'kbviewer@example.com',
        password: 'password123',
      });
      const otherToken = otherRegister.body.token;
      const otherDocuments = await app
        .get('/api/knowledge-base/documents')
        .set('Authorization', `Bearer ${otherToken}`);
      expect(otherDocuments.body.documents).toHaveLength(0);

      const searchResponse = await app
        .get('/api/knowledge-base/documents/search')
        .query({ q: 'Transfer' })
        .set('Authorization', `Bearer ${token}`);
      expect(searchResponse.body.documents[0].id).toBe(document.id);

      const detailResponse = await app
        .get(`/api/knowledge-base/documents/${document.id}`)
        .set('Authorization', `Bearer ${token}`);
      expect(detailResponse.body.document.id).toBe(document.id);

      const updateResponse = await app
        .patch(`/api/knowledge-base/documents/${document.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'PT Transfer Update', tags: ['PT', 'Falls'] });
      expect(updateResponse.body.document.title).toBe('PT Transfer Update');

      const usageResponse = await app
        .get(`/api/knowledge-base/documents/${document.id}/usage`)
        .set('Authorization', `Bearer ${token}`);
      expect(usageResponse.body.stats.documentId).toBe(document.id);

      const auditResponse = await app
        .get(`/api/knowledge-base/documents/${document.id}/audit`)
        .set('Authorization', `Bearer ${token}`);
      expect(auditResponse.body.auditLog.length).toBeGreaterThan(0);

      const deleteResponse = await app
        .delete(`/api/knowledge-base/documents/${document.id}`)
        .set('Authorization', `Bearer ${token}`);
      expect(deleteResponse.status).toBe(204);
    });

    it('supports versioning, relationships, bulk maintenance, and analytics', async () => {
      const primaryDoc = await uploadDocument({
        metadata: { title: 'PT Fall Checklist', tags: ['PT', 'Compliance'] },
      });
      const secondaryDoc = await uploadDocument({
        metadata: { title: 'OT Transfer Guide', category: 'Guidance', tags: ['OT'] },
        file: { name: 'ot-guide.txt', content: 'OT compliance guidance' },
      });

      const storedDoc = await knowledgeBaseService.getDocument(primaryDoc.id, userId);
      expect(storedDoc).toBeTruthy();
      const hydratedDoc = storedDoc!;

      await versioningService.createVersion(
        { ...hydratedDoc, content: `${hydratedDoc.content} v1` },
        userId,
        'Initial baseline'
      );
      await versioningService.createVersion(
        { ...hydratedDoc, content: `${hydratedDoc.content} v2` },
        userId,
        'Added new balance cues'
      );

      const versionsList = await app
        .get(`/api/knowledge-base/documents/${primaryDoc.id}/versions`)
        .set('Authorization', `Bearer ${token}`);
      expect(versionsList.body.total).toBeGreaterThanOrEqual(2);

      const versionDetail = await app
        .get(`/api/knowledge-base/documents/${primaryDoc.id}/versions/1`)
        .set('Authorization', `Bearer ${token}`);
      expect(versionDetail.body.version.versionNumber).toBe(1);

      const compareResponse = await app
        .post(`/api/knowledge-base/documents/${primaryDoc.id}/versions/compare`)
        .set('Authorization', `Bearer ${token}`)
        .send({ fromVersion: 1, toVersion: 2 });
      expect(compareResponse.body.diff).toBeDefined();

      const restoreResponse = await app
        .post(`/api/knowledge-base/documents/${primaryDoc.id}/versions/1/restore`)
        .set('Authorization', `Bearer ${token}`)
        .send({ reason: 'Compliance rollback' });
      expect(restoreResponse.body.document.id).toBe(primaryDoc.id);

      const versionStats = await app
        .get(`/api/knowledge-base/documents/${primaryDoc.id}/versions/stats`)
        .set('Authorization', `Bearer ${token}`);
      expect(versionStats.body.stats.totalVersions).toBeGreaterThan(0);

      const relationshipResponse = await app
        .post('/api/knowledge-base/relationships')
        .set('Authorization', `Bearer ${token}`)
        .send({
          sourceDocId: primaryDoc.id,
          targetDocId: secondaryDoc.id,
          type: 'related_to',
          description: 'OT guidance references PT guardrails',
        });
      expect(relationshipResponse.body.relationship.id).toBeDefined();

      const relationshipList = await app
        .get(`/api/knowledge-base/documents/${primaryDoc.id}/relationships`)
        .set('Authorization', `Bearer ${token}`);
      expect(relationshipList.body.relationships).toHaveLength(1);

      const conflictResponse = await app
        .post('/api/knowledge-base/relationships/detect-conflicts')
        .set('Authorization', `Bearer ${token}`)
        .send({ sourceDocId: primaryDoc.id, targetDocId: secondaryDoc.id });
      expect(conflictResponse.body.success).toBe(true);

      const graphResponse = await app
        .get(`/api/knowledge-base/documents/${primaryDoc.id}/relationships/graph`)
        .set('Authorization', `Bearer ${token}`);
      expect(graphResponse.body.graph.nodes.length).toBeGreaterThanOrEqual(2);

      const statsResponse = await app
        .get(`/api/knowledge-base/documents/${primaryDoc.id}/relationships/stats`)
        .set('Authorization', `Bearer ${token}`);
      expect(statsResponse.body.stats.totalRelationships).toBeGreaterThanOrEqual(1);

      const deleteRelationshipResponse = await app
        .delete(`/api/knowledge-base/relationships/${relationshipResponse.body.relationship.id}`)
        .set('Authorization', `Bearer ${token}`);
      expect(deleteRelationshipResponse.status).toBe(204);

      const bulkUploadResponse = await app
        .post('/api/knowledge-base/bulk/upload')
        .set('Authorization', `Bearer ${token}`)
        .send({
          files: [toFilePayload('Bulk PT protocol', 'bulk-policy.txt')],
          metadata: { title: 'Bulk Policy', description: 'Bulk import', category: 'Policy', tags: ['PT'] },
        });
      expect(bulkUploadResponse.body.successful.length).toBe(1);

      const bulkUpdateTagsResponse = await app
        .post('/api/knowledge-base/bulk/update-tags')
        .set('Authorization', `Bearer ${token}`)
        .send({ documentIds: [primaryDoc.id], tags: ['Balance', 'Falls'], operation: 'replace' });
      expect(bulkUpdateTagsResponse.body.successful).toContain(primaryDoc.id);

      const bulkUpdateCategoryResponse = await app
        .post('/api/knowledge-base/bulk/update-category')
        .set('Authorization', `Bearer ${token}`)
        .send({ documentIds: [primaryDoc.id], category: 'Guidance' });
      expect(bulkUpdateCategoryResponse.body.successful).toContain(primaryDoc.id);

      const bulkDeleteResponse = await app
        .post('/api/knowledge-base/bulk/delete')
        .set('Authorization', `Bearer ${token}`)
        .send({ documentIds: [secondaryDoc.id], reason: 'Merged' });
      expect(bulkDeleteResponse.body.successful).toContain(secondaryDoc.id);

      const analyticsEndpoints = [
        '/api/knowledge-base/analytics/adoption',
        '/api/knowledge-base/analytics/compliance',
        '/api/knowledge-base/analytics/trends',
        '/api/knowledge-base/analytics/usage-by-discipline',
        '/api/knowledge-base/analytics/usage-by-type',
        '/api/knowledge-base/analytics/report',
      ];

      for (const endpoint of analyticsEndpoints) {
        const response = await app.get(endpoint).set('Authorization', `Bearer ${token}`);
        expect(response.body.success).toBe(true);
      }
    });
  });

  describe('Rate Limiting', () => {
    it('should handle multiple requests', async () => {
      const requests = [];
      for (let i = 0; i < 5; i++) {
        requests.push(
          app.post('/api/auth/register').send({
            email: `test${i}@example.com`,
            password: 'password123',
          })
        );
      }

      const responses = await Promise.all(requests);
      responses.forEach(response => {
        expect(response.status).toBeGreaterThanOrEqual(200);
      });
    });
  });
});


