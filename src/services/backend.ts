import express, { Express, Request, Response } from 'express';
import { z } from 'zod';
import crypto from 'crypto';
import { logger } from '../lib/logger';
import { knowledgeBaseService } from './knowledgeBaseService';

/**
 * Backend persistence layer for TheraDoc
 * Handles encrypted storage, authentication, and audit logging
 */

// Type definitions
export interface User {
  id: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
  lastLogin?: Date;
}

export interface StoredNote {
  id: string;
  userId: string;
  content: string;
  type: string;
  discipline: string;
  documentType: string;
  auditResult?: any;
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
}

export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  resourceType: string;
  resourceId: string;
  changes?: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
  status: 'success' | 'failure';
}

// Validation schemas
const UserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const NoteSchema = z.object({
  content: z.string(),
  type: z.string(),
  discipline: z.enum(['PT', 'OT', 'ST']),
  documentType: z.enum(['Daily', 'Progress', 'Assessment', 'Discharge', 'Recertification']),
  auditResult: z.any().optional(),
});


const usersById = new Map<string, User>();
const usersByEmail = new Map<string, User>();
const notesById = new Map<string, StoredNote>();
const auditLogs: AuditLog[] = [];
const activeTokens = new Map<string, { userId: string; expiresAt: number }>();

const TOKEN_TTL_MS = 1000 * 60 * 60; // 1 hour session lifetime
const ENCRYPTION_KEY = crypto
  .createHash('sha256')
  .update(process.env.BACKEND_SECRET || 'theradoc_test_secret')
  .digest();
const ENCRYPTION_IV_LENGTH = 12;
const PBKDF2_ITERATIONS =
  process.env.PBKDF2_ITERATIONS
    ? Number(process.env.PBKDF2_ITERATIONS)
    : process.env.NODE_ENV === 'test'
      ? 1000
      : 310000;

function resetInMemoryStore() {
  usersById.clear();
  usersByEmail.clear();
  notesById.clear();
  auditLogs.length = 0;
  activeTokens.clear();
}

/**
 * Initialize Express backend server
 */
export function createBackendServer(): Express {
  const app = express();
  resetInMemoryStore();
  
  // Middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  
  // Request logging middleware
  app.use((req: Request, res: Response, next) => {
    logger.info({
      method: req.method,
      path: req.path,
      ip: req.ip,
    });
    next();
  });
  
  // Authentication endpoints
  app.post('/api/auth/register', async (req: Request, res: Response) => {
    try {
      const { email, password } = UserSchema.parse(req.body);
      
      // Hash password and create user
      const user = await createUser(email, password);
      
      logger.info({ action: 'user_registered', userId: user.id });
      
      res.json({ 
        success: true, 
        user: { id: user.id, email: user.email },
        token: generateJWT(user.id)
      });
    } catch (error) {
      logger.error({ action: 'registration_failed', error });
      res.status(400).json({ error: 'Registration failed' });
    }
  });
  
  app.post('/api/auth/login', async (req: Request, res: Response) => {
    try {
      const { email, password } = UserSchema.parse(req.body);
      
      const user = await authenticateUser(email, password);
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      
      logger.info({ action: 'user_login', userId: user.id });
      
      res.json({ 
        success: true,
        user: { id: user.id, email: user.email },
        token: generateJWT(user.id)
      });
    } catch (error) {
      logger.error({ action: 'login_failed', error });
      res.status(400).json({ error: 'Login failed' });
    }
  });
  
  // Note CRUD endpoints
  app.post('/api/notes', authenticateMiddleware, async (req: Request, res: Response) => {
    try {
      const note = NoteSchema.parse(req.body);
      const userId = (req as any).userId;
      
      const storedNote = await createNote(userId, note);
      
      logAuditEvent(userId, 'note_created', 'note', storedNote.id, req);
      
      res.json({ success: true, note: storedNote });
    } catch (error) {
      logger.error({ action: 'note_creation_failed', error });
      res.status(400).json({ error: 'Note creation failed' });
    }
  });
  
  app.get('/api/notes/:id', authenticateMiddleware, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId;
      const note = await getNote(req.params.id, userId);
      
      if (!note) {
        return res.status(404).json({ error: 'Note not found' });
      }
      
      logAuditEvent(userId, 'note_retrieved', 'note', note.id, req);
      
      res.json({ success: true, note });
    } catch (error) {
      logger.error({ action: 'note_retrieval_failed', error });
      res.status(400).json({ error: 'Note retrieval failed' });
    }
  });
  
  app.put('/api/notes/:id', authenticateMiddleware, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId;
      const updates = NoteSchema.partial().parse(req.body);
      
      const note = await updateNote(req.params.id, userId, updates);
      
      if (!note) {
        return res.status(404).json({ error: 'Note not found' });
      }
      
      logAuditEvent(userId, 'note_updated', 'note', note.id, req, updates);
      
      res.json({ success: true, note });
    } catch (error) {
      logger.error({ action: 'note_update_failed', error });
      res.status(400).json({ error: 'Note update failed' });
    }
  });
  
  app.delete('/api/notes/:id', authenticateMiddleware, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId;
      
      const success = await deleteNote(req.params.id, userId);
      
      if (!success) {
        return res.status(404).json({ error: 'Note not found' });
      }
      
      logAuditEvent(userId, 'note_deleted', 'note', req.params.id, req);
      
      res.json({ success: true });
    } catch (error) {
      logger.error({ action: 'note_deletion_failed', error });
      res.status(400).json({ error: 'Note deletion failed' });
    }
  });
  
  app.get('/api/notes', authenticateMiddleware, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId;
      const notes = await getUserNotes(userId);
      
      logAuditEvent(userId, 'notes_listed', 'note', 'all', req);
      
      res.json({ success: true, notes });
    } catch (error) {
      logger.error({ action: 'notes_list_failed', error });
      res.status(400).json({ error: 'Notes retrieval failed' });
    }
  });
  
  // Audit log endpoints
  app.get('/api/audit-logs', authenticateMiddleware, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId;
      const logs = await getAuditLogs(userId);
      
      res.json({ success: true, logs });
    } catch (error) {
      logger.error({ action: 'audit_logs_retrieval_failed', error });
      res.status(400).json({ error: 'Audit logs retrieval failed' });
    }
  });
  
  app.get('/api/audit-logs/report', authenticateMiddleware, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId;
      const report = await generateAuditReport(userId);
      
      res.json({ success: true, report });
    } catch (error) {
      logger.error({ action: 'audit_report_generation_failed', error });
      res.status(400).json({ error: 'Report generation failed' });
    }
  });
  
  // Knowledge Base endpoints
  app.post('/api/knowledge-base/documents/upload', authenticateMiddleware, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId;
      // In production, use multer for file handling
      // For now, accept file data in request body
      const { file, metadata } = req.body;
      
      if (!file || !metadata) {
        return res.status(400).json({ error: 'File and metadata required' });
      }

      // Convert base64 to File
      const buffer = Buffer.from(file.data, 'base64');
      const fileObj = new File([buffer], file.name, { type: file.type });

      const document = await knowledgeBaseService.uploadDocument(
        fileObj,
        metadata,
        userId
      );

      res.status(201).json({ 
        success: true, 
        document: {
          id: document.id,
          title: document.title,
          category: document.category,
          uploadedAt: document.uploadedAt,
          status: 'completed'
        }
      });
    } catch (error) {
      logger.error({ action: 'document_upload_failed', error });
      res.status(400).json({ error: 'Document upload failed' });
    }
  });

  app.get('/api/knowledge-base/documents', authenticateMiddleware, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId;
      const { category, tags, page, pageSize, sortBy, sortOrder } = req.query;

      const filters = {
        category: category as any,
        tags: tags ? (Array.isArray(tags) ? (tags as string[]) : [tags as string]) : undefined,
        page: page ? parseInt(page as string) : 1,
        pageSize: pageSize ? parseInt(pageSize as string) : 20,
        sortBy: (sortBy as any) || 'date',
        sortOrder: (sortOrder as any) || 'desc',
      };

      const result = await knowledgeBaseService.listDocuments(userId, filters);

      res.json({ success: true, ...result });
    } catch (error) {
      logger.error({ action: 'documents_list_failed', error });
      res.status(400).json({ error: 'Documents retrieval failed' });
    }
  });

  app.get('/api/knowledge-base/documents/search', authenticateMiddleware, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId;
      const { q, category, tags, page, pageSize, sortBy, sortOrder } = req.query;

      if (!q) {
        return res.status(400).json({ error: 'Search query required' });
      }

      const filters = {
        category: category as any,
        tags: tags ? (Array.isArray(tags) ? (tags as string[]) : [tags as string]) : undefined,
        page: page ? parseInt(page as string) : 1,
        pageSize: pageSize ? parseInt(pageSize as string) : 20,
        sortBy: (sortBy as any) || 'relevance',
        sortOrder: (sortOrder as any) || 'desc',
      };

      const result = await knowledgeBaseService.searchDocuments(
        userId,
        q as string,
        filters
      );

      res.json({ success: true, ...result });
    } catch (error) {
      logger.error({ action: 'document_search_failed', error });
      res.status(400).json({ error: 'Document search failed' });
    }
  });

  app.get('/api/knowledge-base/documents/:id', authenticateMiddleware, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId;
      const document = await knowledgeBaseService.getDocument(req.params.id, userId);

      if (!document) {
        return res.status(404).json({ error: 'Document not found' });
      }

      res.json({ success: true, document });
    } catch (error) {
      logger.error({ action: 'document_retrieval_failed', error });
      res.status(400).json({ error: 'Document retrieval failed' });
    }
  });

  app.patch('/api/knowledge-base/documents/:id', authenticateMiddleware, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId;
      const { title, description, category, effectiveDate, expiryDate, tags } = req.body;

      const document = await knowledgeBaseService.updateDocumentMetadata(
        req.params.id,
        userId,
        {
          title,
          description,
          category,
          effectiveDate,
          expiryDate,
          tags,
        }
      );

      res.json({ 
        success: true, 
        document: {
          id: document.id,
          title: document.title,
          updatedAt: document.updatedAt,
        }
      });
    } catch (error) {
      logger.error({ action: 'document_update_failed', error });
      res.status(400).json({ error: 'Document update failed' });
    }
  });

  app.delete('/api/knowledge-base/documents/:id', authenticateMiddleware, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId;
      await knowledgeBaseService.deleteDocument(req.params.id, userId);

      res.status(204).send();
    } catch (error) {
      logger.error({ action: 'document_deletion_failed', error });
      res.status(400).json({ error: 'Document deletion failed' });
    }
  });

  app.get('/api/knowledge-base/documents/:id/usage', authenticateMiddleware, async (req: Request, res: Response) => {
    try {
      const stats = await knowledgeBaseService.getDocumentUsageStats(req.params.id);

      res.json({ success: true, stats });
    } catch (error) {
      logger.error({ action: 'usage_stats_failed', error });
      res.status(400).json({ error: 'Usage statistics retrieval failed' });
    }
  });

  app.get('/api/knowledge-base/documents/:id/audit', authenticateMiddleware, async (req: Request, res: Response) => {
    try {
      const auditLog = await knowledgeBaseService.getDocumentAuditLog(req.params.id);

      res.json({ success: true, auditLog });
    } catch (error) {
      logger.error({ action: 'audit_log_failed', error });
      res.status(400).json({ error: 'Audit log retrieval failed' });
    }
  });

  // Document Versioning endpoints
  app.get('/api/knowledge-base/documents/:id/versions', authenticateMiddleware, async (req: Request, res: Response) => {
    try {
      const { limit, offset, sortBy, sortOrder } = req.query;
      const { versioningService } = await import('./versioningService');

      const result = await versioningService.listDocumentVersions(req.params.id, {
        limit: limit ? parseInt(limit as string) : 10,
        offset: offset ? parseInt(offset as string) : 0,
        sortBy: (sortBy as any) || 'version',
        sortOrder: (sortOrder as any) || 'desc',
      });

      res.json({ success: true, ...result });
    } catch (error) {
      logger.error({ action: 'versions_list_failed', error });
      res.status(400).json({ error: 'Versions retrieval failed' });
    }
  });

  app.get('/api/knowledge-base/documents/:id/versions/stats', authenticateMiddleware, async (req: Request, res: Response) => {
    try {
      const { versioningService } = await import('./versioningService');
      const stats = await versioningService.getVersionStats(req.params.id);

      res.json({ success: true, stats });
    } catch (error) {
      logger.error({ action: 'version_stats_failed', error });
      res.status(400).json({ error: 'Version statistics retrieval failed' });
    }
  });

  app.get('/api/knowledge-base/documents/:id/versions/:versionNumber', authenticateMiddleware, async (req: Request, res: Response) => {
    try {
      const { versioningService } = await import('./versioningService');
      const version = await versioningService.getDocumentVersion(
        req.params.id,
        parseInt(req.params.versionNumber)
      );

      if (!version) {
        return res.status(404).json({ error: 'Version not found' });
      }

      res.json({ success: true, version });
    } catch (error) {
      logger.error({ action: 'version_retrieval_failed', error });
      res.status(400).json({ error: 'Version retrieval failed' });
    }
  });

  app.post('/api/knowledge-base/documents/:id/versions/compare', authenticateMiddleware, async (req: Request, res: Response) => {
    try {
      const { fromVersion, toVersion } = req.body;
      const { versioningService } = await import('./versioningService');

      if (!fromVersion || !toVersion) {
        return res.status(400).json({ error: 'fromVersion and toVersion required' });
      }

      const diff = await versioningService.compareVersions(
        req.params.id,
        fromVersion,
        toVersion
      );

      if (!diff) {
        return res.status(404).json({ error: 'Versions not found' });
      }

      res.json({ success: true, diff });
    } catch (error) {
      logger.error({ action: 'version_comparison_failed', error });
      res.status(400).json({ error: 'Version comparison failed' });
    }
  });

  app.post('/api/knowledge-base/documents/:id/versions/:versionNumber/restore', authenticateMiddleware, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId;
      const { reason } = req.body;
      const { versioningService } = await import('./versioningService');

      if (!reason) {
        return res.status(400).json({ error: 'Reason required' });
      }

      const restored = await versioningService.restoreVersion(
        req.params.id,
        parseInt(req.params.versionNumber),
        userId,
        reason
      );

      if (!restored) {
        return res.status(404).json({ error: 'Version not found' });
      }

      res.json({ success: true, document: restored });
    } catch (error) {
      logger.error({ action: 'version_restore_failed', error });
      res.status(400).json({ error: 'Version restore failed' });
    }
  });

  // Document Relationship endpoints
  app.post('/api/knowledge-base/relationships', authenticateMiddleware, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId;
      const { sourceDocId, targetDocId, type, description } = req.body;

      if (!sourceDocId || !targetDocId || !type) {
        return res.status(400).json({ error: 'sourceDocId, targetDocId, and type required' });
      }

      const { relationshipService } = await import('./relationshipService');
      const relationship = await relationshipService.addRelationship(
        sourceDocId,
        targetDocId,
        type,
        userId,
        description
      );

      res.status(201).json({ success: true, relationship });
    } catch (error: any) {
      logger.error({ action: 'relationship_creation_failed', error });
      res.status(400).json({ error: error.message || 'Relationship creation failed' });
    }
  });

  app.get('/api/knowledge-base/documents/:id/relationships', authenticateMiddleware, async (req: Request, res: Response) => {
    try {
      const { direction } = req.query;
      const { relationshipService } = await import('./relationshipService');

      const relationships = await relationshipService.getDocumentRelationships(
        req.params.id,
        (direction as any) || 'both'
      );

      res.json({ success: true, relationships });
    } catch (error) {
      logger.error({ action: 'relationships_retrieval_failed', error });
      res.status(400).json({ error: 'Relationships retrieval failed' });
    }
  });

  app.post('/api/knowledge-base/relationships/detect-conflicts', authenticateMiddleware, async (req: Request, res: Response) => {
    try {
      const { sourceDocId, targetDocId } = req.body;

      if (!sourceDocId || !targetDocId) {
        return res.status(400).json({ error: 'sourceDocId and targetDocId required' });
      }

      const { relationshipService } = await import('./relationshipService');
      const conflicts = await relationshipService.detectConflicts(sourceDocId, targetDocId);

      res.json({ success: true, conflicts });
    } catch (error) {
      logger.error({ action: 'conflict_detection_failed', error });
      res.status(400).json({ error: 'Conflict detection failed' });
    }
  });

  app.delete('/api/knowledge-base/relationships/:id', authenticateMiddleware, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId;
      const { relationshipService } = await import('./relationshipService');

      const removed = await relationshipService.removeRelationship(req.params.id, userId);

      if (!removed) {
        return res.status(404).json({ error: 'Relationship not found' });
      }

      res.status(204).send();
    } catch (error) {
      logger.error({ action: 'relationship_deletion_failed', error });
      res.status(400).json({ error: 'Relationship deletion failed' });
    }
  });

  app.get('/api/knowledge-base/documents/:id/relationships/graph', authenticateMiddleware, async (req: Request, res: Response) => {
    try {
      const { relationshipService } = await import('./relationshipService');
      const graph = await relationshipService.getRelationshipGraph(req.params.id);

      res.json({ success: true, graph });
    } catch (error) {
      logger.error({ action: 'graph_retrieval_failed', error });
      res.status(400).json({ error: 'Graph retrieval failed' });
    }
  });

  app.get('/api/knowledge-base/documents/:id/relationships/stats', authenticateMiddleware, async (req: Request, res: Response) => {
    try {
      const { relationshipService } = await import('./relationshipService');
      const stats = await relationshipService.getRelationshipStats(req.params.id);

      res.json({ success: true, stats });
    } catch (error) {
      logger.error({ action: 'relationship_stats_failed', error });
      res.status(400).json({ error: 'Relationship statistics retrieval failed' });
    }
  });

  // Bulk Operations endpoints
  app.post('/api/knowledge-base/bulk/upload', authenticateMiddleware, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId;
      const { files, metadata } = req.body;

      if (!files || !Array.isArray(files)) {
        return res.status(400).json({ error: 'Files array required' });
      }

      const { bulkOperationsService } = await import('./bulkOperationsService');
      const fileObjects = files.map((f: any) => new File([Buffer.from(f.data, 'base64')], f.name, { type: f.type }));

      const result = await bulkOperationsService.bulkUpload(fileObjects, metadata || {}, userId);

      res.json({ success: true, ...result });
    } catch (error) {
      logger.error({ action: 'bulk_upload_failed', error });
      res.status(400).json({ error: 'Bulk upload failed' });
    }
  });

  app.post('/api/knowledge-base/bulk/delete', authenticateMiddleware, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId;
      const { documentIds, reason } = req.body;

      if (!documentIds || !Array.isArray(documentIds)) {
        return res.status(400).json({ error: 'documentIds array required' });
      }

      const { bulkOperationsService } = await import('./bulkOperationsService');
      const result = await bulkOperationsService.bulkDelete(documentIds, userId, reason);

      res.json({ success: true, ...result });
    } catch (error) {
      logger.error({ action: 'bulk_delete_failed', error });
      res.status(400).json({ error: 'Bulk delete failed' });
    }
  });

  app.post('/api/knowledge-base/bulk/update-tags', authenticateMiddleware, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId;
      const { documentIds, tags, operation } = req.body;

      if (!documentIds || !Array.isArray(documentIds) || !tags || !Array.isArray(tags)) {
        return res.status(400).json({ error: 'documentIds and tags arrays required' });
      }

      const { bulkOperationsService } = await import('./bulkOperationsService');
      const result = await bulkOperationsService.bulkUpdateTags(
        documentIds,
        tags,
        userId,
        operation || 'add'
      );

      res.json({ success: true, ...result });
    } catch (error) {
      logger.error({ action: 'bulk_update_tags_failed', error });
      res.status(400).json({ error: 'Bulk update tags failed' });
    }
  });

  app.post('/api/knowledge-base/bulk/update-category', authenticateMiddleware, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId;
      const { documentIds, category } = req.body;

      if (!documentIds || !Array.isArray(documentIds) || !category) {
        return res.status(400).json({ error: 'documentIds and category required' });
      }

      const { bulkOperationsService } = await import('./bulkOperationsService');
      const result = await bulkOperationsService.bulkUpdateCategory(documentIds, category, userId);

      res.json({ success: true, ...result });
    } catch (error) {
      logger.error({ action: 'bulk_update_category_failed', error });
      res.status(400).json({ error: 'Bulk update category failed' });
    }
  });

  // Analytics endpoints
  app.get('/api/knowledge-base/analytics/adoption', authenticateMiddleware, async (req: Request, res: Response) => {
    try {
      const { knowledgeBaseAnalyticsService } = await import('./knowledgeBaseAnalyticsService');
      const metrics = await knowledgeBaseAnalyticsService.getPolicyAdoptionMetrics();

      res.json({ success: true, metrics });
    } catch (error) {
      logger.error({ action: 'adoption_metrics_failed', error });
      res.status(400).json({ error: 'Adoption metrics retrieval failed' });
    }
  });

  app.get('/api/knowledge-base/analytics/compliance', authenticateMiddleware, async (req: Request, res: Response) => {
    try {
      const { knowledgeBaseAnalyticsService } = await import('./knowledgeBaseAnalyticsService');
      const metrics = await knowledgeBaseAnalyticsService.getComplianceMetrics();

      res.json({ success: true, metrics });
    } catch (error) {
      logger.error({ action: 'compliance_metrics_failed', error });
      res.status(400).json({ error: 'Compliance metrics retrieval failed' });
    }
  });

  app.get('/api/knowledge-base/analytics/trends', authenticateMiddleware, async (req: Request, res: Response) => {
    try {
      const { days } = req.query;
      const { knowledgeBaseAnalyticsService } = await import('./knowledgeBaseAnalyticsService');
      const analysis = await knowledgeBaseAnalyticsService.getTrendAnalysis(
        days ? parseInt(days as string) : 30
      );

      res.json({ success: true, analysis });
    } catch (error) {
      logger.error({ action: 'trend_analysis_failed', error });
      res.status(400).json({ error: 'Trend analysis failed' });
    }
  });

  app.get('/api/knowledge-base/analytics/usage-by-discipline', authenticateMiddleware, async (req: Request, res: Response) => {
    try {
      const { knowledgeBaseAnalyticsService } = await import('./knowledgeBaseAnalyticsService');
      const usage = await knowledgeBaseAnalyticsService.getUsageByDiscipline();

      res.json({ success: true, usage });
    } catch (error) {
      logger.error({ action: 'usage_by_discipline_failed', error });
      res.status(400).json({ error: 'Usage by discipline retrieval failed' });
    }
  });

  app.get('/api/knowledge-base/analytics/usage-by-type', authenticateMiddleware, async (req: Request, res: Response) => {
    try {
      const { knowledgeBaseAnalyticsService } = await import('./knowledgeBaseAnalyticsService');
      const usage = await knowledgeBaseAnalyticsService.getUsageByDocumentType();

      res.json({ success: true, usage });
    } catch (error) {
      logger.error({ action: 'usage_by_type_failed', error });
      res.status(400).json({ error: 'Usage by type retrieval failed' });
    }
  });

  app.get('/api/knowledge-base/analytics/report', authenticateMiddleware, async (req: Request, res: Response) => {
    try {
      const { knowledgeBaseAnalyticsService } = await import('./knowledgeBaseAnalyticsService');
      const report = await knowledgeBaseAnalyticsService.generateAnalyticsReport();

      res.json({ success: true, report });
    } catch (error) {
      logger.error({ action: 'analytics_report_failed', error });
      res.status(400).json({ error: 'Analytics report generation failed' });
    }
  });

  // Health check
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: new Date() });
  });
  
  return app;
}

/**
 * Authentication middleware
 */
function authenticateMiddleware(req: Request, res: Response, next: any) {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  try {
    const userId = verifyJWT(token);
    (req as any).userId = userId;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

/**
 * Database operations (mock implementations)
 */
async function createUser(email: string, password: string): Promise<User> {
  if (usersByEmail.has(email)) {
    throw new Error('User already exists');
  }

  const user: User = {
    id: crypto.randomUUID(),
    email,
    passwordHash: hashPassword(password),
    createdAt: new Date(),
  };

  usersById.set(user.id, user);
  usersByEmail.set(email, user);
  return user;
}

async function authenticateUser(email: string, password: string): Promise<User | null> {
  const user = usersByEmail.get(email);
  if (!user) {
    return null;
  }

  if (!verifyPassword(password, user.passwordHash)) {
    return null;
  }

  user.lastLogin = new Date();
  return user;
}

async function createNote(userId: string, note: any): Promise<StoredNote> {
  const storedNote: StoredNote = {
    id: crypto.randomUUID(),
    userId,
    content: encryptData(note.content),
    type: note.type,
    discipline: note.discipline,
    documentType: note.documentType,
    auditResult: note.auditResult,
    createdAt: new Date(),
    updatedAt: new Date(),
    isDeleted: false,
  };

  notesById.set(storedNote.id, storedNote);
  return transformNoteForClient(storedNote);
}

async function getNote(id: string, userId: string): Promise<StoredNote | null> {
  const note = notesById.get(id);
  if (!note || note.userId !== userId || note.isDeleted) {
    return null;
  }

  return transformNoteForClient(note);
}

async function updateNote(id: string, userId: string, updates: any): Promise<StoredNote | null> {
  const existing = notesById.get(id);
  if (!existing || existing.userId !== userId || existing.isDeleted) {
    return null;
  }

  const updated: StoredNote = {
    ...existing,
    ...updates,
    content: updates.content ? encryptData(updates.content) : existing.content,
    auditResult: updates.auditResult ?? existing.auditResult,
    updatedAt: new Date(),
  };

  notesById.set(id, updated);
  return transformNoteForClient(updated);
}

async function deleteNote(id: string, userId: string): Promise<boolean> {
  const note = notesById.get(id);
  if (!note || note.userId !== userId || note.isDeleted) {
    return false;
  }

  note.isDeleted = true;
  notesById.set(id, note);
  return true;
}

async function getUserNotes(userId: string): Promise<StoredNote[]> {
  return Array.from(notesById.values())
    .filter(note => note.userId === userId && !note.isDeleted)
    .map(transformNoteForClient);
}

async function getAuditLogs(userId: string): Promise<AuditLog[]> {
  return auditLogs.filter(log => log.userId === userId);
}

async function generateAuditReport(userId: string): Promise<any> {
  const userNotes = await getUserNotes(userId);
  const userAuditLogs = await getAuditLogs(userId);

  const totalNotes = userNotes.length;
  const totalModifications = userAuditLogs.filter(log => log.action === 'note_updated').length;
  const complianceScores = userNotes
    .map(note => note.auditResult?.complianceScore)
    .filter((score): score is number => typeof score === 'number');

  const complianceScore = complianceScores.length
    ? Math.round(complianceScores.reduce((sum, score) => sum + score, 0) / complianceScores.length)
    : 0;

  const notesGenerated = userAuditLogs.filter(log => log.action === 'note_created').length;
  const notesModified = totalModifications;
  const auditsPassed = complianceScores.filter(score => score >= 85).length;
  const auditsFailed = complianceScores.filter(score => score < 85).length;
  const complianceRate = totalNotes === 0 ? 0 : Math.round((auditsPassed / totalNotes) * 100);

  const eventsByAction = userAuditLogs.reduce<Record<string, number>>((result, log) => {
    result[log.action] = (result[log.action] || 0) + 1;
    return result;
  }, {});

  return {
    userId,
    generatedAt: new Date(),
    totalNotes,
    totalModifications,
    complianceScore,
    complianceMetrics: {
      notesGenerated,
      notesModified,
      auditsPassed,
      auditsFailed,
      complianceRate,
    },
    eventsByAction,
  };
}

/**
 * Utility functions
 */
function hashPassword(password: string, salt = crypto.randomBytes(16).toString('hex')): string {
  const hash = crypto.pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, 32, 'sha256').toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, storedHash: string): boolean {
  const [salt, originalHash] = storedHash.split(':');
  if (!salt || !originalHash) {
    return false;
  }

  const hash = crypto.pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, 32, 'sha256').toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(originalHash, 'hex'));
}

function generateJWT(userId: string): string {
  const token = crypto.randomUUID();
  activeTokens.set(token, { userId, expiresAt: Date.now() + TOKEN_TTL_MS });
  return token;
}

function verifyJWT(token: string): string {
  const session = activeTokens.get(token);
  if (!session) {
    throw new Error('Invalid token');
  }

  if (session.expiresAt < Date.now()) {
    activeTokens.delete(token);
    throw new Error('Token expired');
  }

  return session.userId;
}

function encryptData(data: string): string {
  const iv = crypto.randomBytes(ENCRYPTION_IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-gcm', ENCRYPTION_KEY, iv);
  const encrypted = Buffer.concat([cipher.update(data, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, authTag, encrypted]).toString('base64');
}

function decryptData(encrypted: string): string {
  const buffer = Buffer.from(encrypted, 'base64');
  const iv = buffer.subarray(0, ENCRYPTION_IV_LENGTH);
  const authTag = buffer.subarray(ENCRYPTION_IV_LENGTH, ENCRYPTION_IV_LENGTH + 16);
  const ciphertext = buffer.subarray(ENCRYPTION_IV_LENGTH + 16);
  const decipher = crypto.createDecipheriv('aes-256-gcm', ENCRYPTION_KEY, iv);
  decipher.setAuthTag(authTag);
  const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return decrypted.toString('utf8');
}

function transformNoteForClient(note: StoredNote): StoredNote {
  return {
    ...note,
    content: decryptData(note.content),
  };
}

async function logAuditEvent(
  userId: string,
  action: string,
  resourceType: string,
  resourceId: string,
  req: Request,
  changes?: any
): Promise<void> {
  const auditLog: AuditLog = {
    id: crypto.randomUUID(),
    userId,
    action,
    resourceType,
    resourceId,
    changes,
    ipAddress: req.ip || 'unknown',
    userAgent: req.get('user-agent') || 'unknown',
    timestamp: new Date(),
    status: 'success',
  };
  
  logger.info({ auditLog });
  auditLogs.push(auditLog);
}

export const backendInternals = {
  resetInMemoryStore,
  createUser,
  authenticateUser,
  createNote,
  getNote,
  updateNote,
  deleteNote,
  getUserNotes,
  getAuditLogs,
  generateAuditReport,
  hashPassword,
  verifyPassword,
  generateJWT,
  verifyJWT,
  encryptData,
  decryptData,
  transformNoteForClient,
  logAuditEvent,
};

export default createBackendServer;

