import { describe, it, expect, beforeEach } from 'vitest';
import { auditLogger, auditLog } from '../../lib/auditLogger';

describe('Audit Logger', () => {
  beforeEach(() => {
    auditLogger.clearEvents();
  });

  describe('Note Generation Logging', () => {
    it('should log note generation event', () => {
      auditLogger.logNoteGenerated(
        'user123',
        'note456',
        'PT',
        'Daily',
        { cptCode: '97110', mode: 'Therapeutic Exercise' }
      );

      const events = auditLogger.getAllEvents();
      expect(events.length).toBe(1);
      expect(events[0].action).toBe('note_generated');
      expect(events[0].userId).toBe('user123');
      expect(events[0].resourceId).toBe('note456');
    });

    it('should include discipline and document type', () => {
      auditLogger.logNoteGenerated(
        'user123',
        'note456',
        'OT',
        'Assessment',
        {}
      );

      const events = auditLogger.getAllEvents();
      expect(events[0].details.discipline).toBe('OT');
      expect(events[0].details.documentType).toBe('Assessment');
    });

    it('should track additional details', () => {
      const details = {
        cptCode: '97110',
        mode: 'Therapeutic Exercise',
        activity: 'Gait Training',
      };

      auditLogger.logNoteGenerated('user123', 'note456', 'PT', 'Daily', details);

      const events = auditLogger.getAllEvents();
      expect(events[0].details.cptCode).toBe('97110');
      expect(events[0].details.mode).toBe('Therapeutic Exercise');
    });
  });

  describe('Note Modification Logging', () => {
    it('should log note modification event', () => {
      const changes = { content: 'Updated content' };
      auditLogger.logNoteModified('user123', 'note456', changes, 'Compliance fix');

      const events = auditLogger.getAllEvents();
      expect(events.length).toBe(1);
      expect(events[0].action).toBe('note_modified');
      expect(events[0].details.changes).toEqual(changes);
      expect(events[0].details.reason).toBe('Compliance fix');
    });

    it('should track multiple modifications', () => {
      auditLogger.logNoteModified('user123', 'note456', { content: 'v1' });
      auditLogger.logNoteModified('user123', 'note456', { content: 'v2' });
      auditLogger.logNoteModified('user123', 'note456', { content: 'v3' });

      const events = auditLogger.getAllEvents();
      expect(events.length).toBe(3);
      expect(events[0].details.changes.content).toBe('v1');
      expect(events[1].details.changes.content).toBe('v2');
      expect(events[2].details.changes.content).toBe('v3');
    });
  });

  describe('Note Deletion Logging', () => {
    it('should log note deletion event', () => {
      auditLogger.logNoteDeleted('user123', 'note456', 'User requested deletion');

      const events = auditLogger.getAllEvents();
      expect(events.length).toBe(1);
      expect(events[0].action).toBe('note_deleted');
      expect(events[0].details.reason).toBe('User requested deletion');
    });
  });

  describe('User Access Logging', () => {
    it('should log user login', () => {
      auditLogger.logUserAccess('user123', 'login', '192.168.1.1');

      const events = auditLogger.getAllEvents();
      expect(events.length).toBe(1);
      expect(events[0].action).toBe('user_login');
      expect(events[0].ipAddress).toBe('192.168.1.1');
    });

    it('should log user logout', () => {
      auditLogger.logUserAccess('user123', 'logout');

      const events = auditLogger.getAllEvents();
      expect(events.length).toBe(1);
      expect(events[0].action).toBe('user_logout');
    });
  });

  describe('Audit Run Logging', () => {
    it('should log successful audit', () => {
      auditLogger.logAuditRun('user123', 'note456', 95, []);

      const events = auditLogger.getAllEvents();
      expect(events.length).toBe(1);
      expect(events[0].action).toBe('audit_run');
      expect(events[0].details.complianceScore).toBe(95);
      expect(events[0].status).toBe('success');
    });

    it('should log failed audit', () => {
      auditLogger.logAuditRun('user123', 'note456', 45, ['Finding 1', 'Finding 2']);

      const events = auditLogger.getAllEvents();
      expect(events.length).toBe(1);
      expect(events[0].details.complianceScore).toBe(45);
      expect(events[0].details.findings.length).toBe(2);
      expect(events[0].status).toBe('failure');
    });
  });

  describe('Export Logging', () => {
    it('should log export event', () => {
      auditLogger.logExport('user123', 'note456', 'PDF');

      const events = auditLogger.getAllEvents();
      expect(events.length).toBe(1);
      expect(events[0].action).toBe('export');
      expect(events[0].details.format).toBe('PDF');
    });

    it('should track different export formats', () => {
      auditLogger.logExport('user123', 'note456', 'PDF');
      auditLogger.logExport('user123', 'note456', 'DOCX');
      auditLogger.logExport('user123', 'note456', 'HL7');

      const events = auditLogger.getAllEvents();
      expect(events.length).toBe(3);
      expect(events[0].details.format).toBe('PDF');
      expect(events[1].details.format).toBe('DOCX');
      expect(events[2].details.format).toBe('HL7');
    });
  });

  describe('Event Retrieval', () => {
    beforeEach(() => {
      auditLogger.logNoteGenerated('user1', 'note1', 'PT', 'Daily', {});
      auditLogger.logNoteGenerated('user2', 'note2', 'OT', 'Daily', {});
      auditLogger.logNoteModified('user1', 'note1', {});
      auditLogger.logUserAccess('user1', 'login');
    });

    it('should retrieve user events', () => {
      const userEvents = auditLogger.getUserEvents('user1');
      expect(userEvents.length).toBe(3);
      expect(userEvents.every(e => e.userId === 'user1')).toBe(true);
    });

    it('should retrieve note events', () => {
      const noteEvents = auditLogger.getNoteEvents('note1');
      expect(noteEvents.length).toBe(2);
      expect(noteEvents.every(e => e.resourceId === 'note1')).toBe(true);
    });

    it('should respect limit parameter', () => {
      const userEvents = auditLogger.getUserEvents('user1', 2);
      expect(userEvents.length).toBeLessThanOrEqual(2);
    });

    it('should sort events by timestamp descending', () => {
      const userEvents = auditLogger.getUserEvents('user1');
      for (let i = 0; i < userEvents.length - 1; i++) {
        expect(userEvents[i].timestamp.getTime()).toBeGreaterThanOrEqual(
          userEvents[i + 1].timestamp.getTime()
        );
      }
    });
  });

  describe('Report Generation', () => {
    beforeEach(() => {
      const now = new Date();
      auditLogger.logNoteGenerated('user1', 'note1', 'PT', 'Daily', {});
      auditLogger.logNoteGenerated('user2', 'note2', 'OT', 'Daily', {});
      auditLogger.logNoteModified('user1', 'note1', {});
      auditLogger.logAuditRun('user1', 'note1', 95, []);
      auditLogger.logAuditRun('user2', 'note2', 45, ['Finding']);
    });

    it('should generate audit report', () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 1);
      const endDate = new Date();

      const report = auditLogger.generateReport(startDate, endDate);

      expect(report.generatedAt).toBeDefined();
      expect(report.period.start).toEqual(startDate);
      expect(report.period.end).toEqual(endDate);
      expect(report.totalEvents).toBeGreaterThan(0);
    });

    it('should count events by action', () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 1);
      const endDate = new Date();

      const report = auditLogger.generateReport(startDate, endDate);

      expect(report.eventsByAction.note_generated).toBe(2);
      expect(report.eventsByAction.note_modified).toBe(1);
      expect(report.eventsByAction.audit_run).toBe(2);
    });

    it('should count events by user', () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 1);
      const endDate = new Date();

      const report = auditLogger.generateReport(startDate, endDate);

      expect(report.eventsByUser.user1).toBeGreaterThan(0);
      expect(report.eventsByUser.user2).toBeGreaterThan(0);
    });

    it('should calculate compliance metrics', () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 1);
      const endDate = new Date();

      const report = auditLogger.generateReport(startDate, endDate);

      expect(report.complianceMetrics.notesGenerated).toBe(2);
      expect(report.complianceMetrics.notesModified).toBe(1);
      expect(report.complianceMetrics.auditsPassed).toBe(1);
      expect(report.complianceMetrics.auditsFailed).toBe(1);
      expect(report.complianceMetrics.complianceRate).toBe(50);
    });

    it('should include access log in report', () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 1);
      const endDate = new Date();

      const report = auditLogger.generateReport(startDate, endDate);

      expect(report.accessLog).toBeDefined();
      expect(Array.isArray(report.accessLog)).toBe(true);
    });
  });

  describe('Log Retention', () => {
    it('should cleanup old logs', () => {
      auditLogger.logNoteGenerated('user1', 'note1', 'PT', 'Daily', {});
      expect(auditLogger.getAllEvents().length).toBe(1);

      auditLogger.setRetentionPolicy(0);
      auditLogger.cleanupOldLogs();

      expect(auditLogger.getAllEvents().length).toBe(0);
    });

    it('should respect retention policy', () => {
      auditLogger.setRetentionPolicy(90);
      auditLogger.logNoteGenerated('user1', 'note1', 'PT', 'Daily', {});

      expect(auditLogger.getAllEvents().length).toBe(1);
    });
  });

  describe('Log Export', () => {
    beforeEach(() => {
      auditLogger.logNoteGenerated('user1', 'note1', 'PT', 'Daily', {});
      auditLogger.logNoteModified('user1', 'note1', {});
    });

    it('should export logs as JSON', () => {
      const json = auditLogger.exportLogs('json');
      const parsed = JSON.parse(json);

      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed.length).toBe(2);
    });

    it('should export logs as CSV', () => {
      const csv = auditLogger.exportLogs('csv');

      expect(csv).toContain('ID');
      expect(csv).toContain('Timestamp');
      expect(csv).toContain('User ID');
      expect(csv).toContain('Action');
    });

    it('should include all event data in export', () => {
      const json = auditLogger.exportLogs('json');
      const parsed = JSON.parse(json);

      expect(parsed[0].id).toBeDefined();
      expect(parsed[0].timestamp).toBeDefined();
      expect(parsed[0].userId).toBeDefined();
      expect(parsed[0].action).toBeDefined();
    });
  });

  describe('Event Timestamps', () => {
    it('should record event timestamps', () => {
      const before = new Date();
      auditLogger.logNoteGenerated('user1', 'note1', 'PT', 'Daily', {});
      const after = new Date();

      const events = auditLogger.getAllEvents();
      expect(events[0].timestamp.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(events[0].timestamp.getTime()).toBeLessThanOrEqual(after.getTime());
    });
  });

  describe('Event IDs', () => {
    it('should generate unique event IDs', () => {
      auditLogger.logNoteGenerated('user1', 'note1', 'PT', 'Daily', {});
      auditLogger.logNoteGenerated('user1', 'note2', 'PT', 'Daily', {});

      const events = auditLogger.getAllEvents();
      expect(events[0].id).not.toBe(events[1].id);
    });
  });

  describe('Compliance Rate Calculation', () => {
    it('should calculate compliance rate when no audits exist', () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 1);
      const endDate = new Date();

      const report = auditLogger.generateReport(startDate, endDate);

      expect(report.complianceMetrics.complianceRate).toBe(0);
      expect(report.complianceMetrics.auditsPassed).toBe(0);
      expect(report.complianceMetrics.auditsFailed).toBe(0);
    });

    it('should handle events without userId in CSV export', () => {
      // Create an event without userId using the auditLog function
      const event = {
        action: 'access' as const,
        resourceType: 'system' as const,
        resourceId: 'system-1',
        details: {},
        status: 'success' as const,
      };
      
      auditLogger.logCustomEvent({
        id: 'test-id',
        timestamp: new Date(),
        ...event,
      });

      const csv = auditLogger.exportLogs('csv');
      expect(csv).toContain('""'); // Empty userId field
    });
  });

  describe('Audit Log Function', () => {
    it('should log event with provided id and timestamp', async () => {
      const customId = 'custom-id-123';
      const customTimestamp = new Date('2024-01-01');
      
      await auditLog({
        id: customId,
        timestamp: customTimestamp,
        action: 'access',
        resourceType: 'system',
        resourceId: 'sys-1',
        details: {},
        status: 'success',
      });

      const events = auditLogger.getAllEvents();
      const lastEvent = events[events.length - 1];
      expect(lastEvent.id).toBe(customId);
      expect(lastEvent.timestamp).toEqual(customTimestamp);
    });

    it('should generate id and timestamp when not provided', async () => {
      await auditLog({
        action: 'access',
        resourceType: 'system',
        resourceId: 'sys-2',
        details: {},
        status: 'success',
      });

      const events = auditLogger.getAllEvents();
      const lastEvent = events[events.length - 1];
      expect(lastEvent.id).toBeDefined();
      expect(lastEvent.timestamp).toBeDefined();
      expect(lastEvent.id).toMatch(/^audit_/);
    });
  });
});
