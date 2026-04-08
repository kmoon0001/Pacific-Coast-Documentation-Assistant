import { logger } from './logger';

/**
 * Audit logging system for TheraDoc
 * Tracks all note generation, modifications, and user access
 */

export interface AuditEvent {
  id: string;
  timestamp: Date;
  userId?: string;
  action:
    | 'note_generated'
    | 'note_modified'
    | 'note_deleted'
    | 'user_login'
    | 'user_logout'
    | 'audit_run'
    | 'export'
    | 'access'
    | 'BULK_UPLOAD'
    | 'BULK_DELETE'
    | 'BULK_UPDATE_TAGS'
    | 'BULK_UPDATE_CATEGORY'
    | 'CREATE_RELATIONSHIP'
    | 'DELETE_RELATIONSHIP'
    | 'UPDATE_RELATIONSHIP'
    | 'CREATE_VERSION'
    | 'RESTORE_VERSION';
  resourceType:
    | 'note'
    | 'user'
    | 'system'
    | 'Document'
    | 'DocumentRelationship'
    | 'DocumentVersion';
  resourceId: string;
  details: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  status: 'success' | 'failure';
}

export interface AuditReport {
  generatedAt: Date;
  period: {
    start: Date;
    end: Date;
  };
  totalEvents: number;
  eventsByAction: Record<string, number>;
  eventsByUser: Record<string, number>;
  complianceMetrics: {
    notesGenerated: number;
    notesModified: number;
    auditsPassed: number;
    auditsFailed: number;
    complianceRate: number;
  };
  accessLog: AuditEvent[];
}

class AuditLogger {
  private events: AuditEvent[] = [];
  private maxRetentionDays = 90;

  /**
   * Log a note generation event
   */
  logNoteGenerated(
    userId: string,
    noteId: string,
    discipline: string,
    documentType: string,
    details: any
  ): void {
    const event: AuditEvent = {
      id: `audit_${Date.now()}_${Math.random()}`,
      timestamp: new Date(),
      userId,
      action: 'note_generated',
      resourceType: 'note',
      resourceId: noteId,
      details: {
        discipline,
        documentType,
        ...details,
      },
      status: 'success',
    };

    this.events.push(event);
    logger.info({
      message: 'Note generated',
      auditEvent: event,
    });
  }

  /**
   * Log a note modification event
   */
  logNoteModified(
    userId: string,
    noteId: string,
    changes: Record<string, any>,
    reason?: string
  ): void {
    const event: AuditEvent = {
      id: `audit_${Date.now()}_${Math.random()}`,
      timestamp: new Date(),
      userId,
      action: 'note_modified',
      resourceType: 'note',
      resourceId: noteId,
      details: {
        changes,
        reason,
      },
      status: 'success',
    };

    this.events.push(event);
    logger.info({
      message: 'Note modified',
      auditEvent: event,
    });
  }

  /**
   * Log a note deletion event
   */
  logNoteDeleted(userId: string, noteId: string, reason?: string): void {
    const event: AuditEvent = {
      id: `audit_${Date.now()}_${Math.random()}`,
      timestamp: new Date(),
      userId,
      action: 'note_deleted',
      resourceType: 'note',
      resourceId: noteId,
      details: {
        reason,
      },
      status: 'success',
    };

    this.events.push(event);
    logger.info({
      message: 'Note deleted',
      auditEvent: event,
    });
  }

  /**
   * Log user access event
   */
  logUserAccess(userId: string, action: 'login' | 'logout', ipAddress?: string): void {
    const event: AuditEvent = {
      id: `audit_${Date.now()}_${Math.random()}`,
      timestamp: new Date(),
      userId,
      action: action === 'login' ? 'user_login' : 'user_logout',
      resourceType: 'user',
      resourceId: userId,
      details: {
        action,
      },
      ipAddress,
      status: 'success',
    };

    this.events.push(event);
    logger.info({
      message: `User ${action}`,
      auditEvent: event,
    });
  }

  /**
   * Log audit run event
   */
  logAuditRun(userId: string, noteId: string, complianceScore: number, findings: string[]): void {
    const event: AuditEvent = {
      id: `audit_${Date.now()}_${Math.random()}`,
      timestamp: new Date(),
      userId,
      action: 'audit_run',
      resourceType: 'note',
      resourceId: noteId,
      details: {
        complianceScore,
        findings,
      },
      status: complianceScore >= 80 ? 'success' : 'failure',
    };

    this.events.push(event);
    logger.info({
      message: 'Audit run completed',
      auditEvent: event,
    });
  }

  /**
   * Log export event
   */
  logExport(userId: string, noteId: string, format: string): void {
    const event: AuditEvent = {
      id: `audit_${Date.now()}_${Math.random()}`,
      timestamp: new Date(),
      userId,
      action: 'export',
      resourceType: 'note',
      resourceId: noteId,
      details: {
        format,
      },
      status: 'success',
    };

    this.events.push(event);
    logger.info({
      message: 'Note exported',
      auditEvent: event,
    });
  }

  /**
   * Get audit events for a user
   */
  getUserEvents(userId: string, limit: number = 100): AuditEvent[] {
    return this.events
      .filter((event) => event.userId === userId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  /**
   * Get audit events for a note
   */
  getNoteEvents(noteId: string): AuditEvent[] {
    return this.events
      .filter((event) => event.resourceId === noteId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Generate audit report
   */
  generateReport(startDate: Date, endDate: Date): AuditReport {
    const periodEvents = this.events.filter(
      (event) => event.timestamp >= startDate && event.timestamp <= endDate
    );

    const eventsByAction: Record<string, number> = {};
    const eventsByUser: Record<string, number> = {};
    let notesGenerated = 0;
    let notesModified = 0;
    let auditsPassed = 0;
    let auditsFailed = 0;

    periodEvents.forEach((event) => {
      // Count by action
      eventsByAction[event.action] = (eventsByAction[event.action] || 0) + 1;

      // Count by user
      if (event.userId) {
        eventsByUser[event.userId] = (eventsByUser[event.userId] || 0) + 1;
      }

      // Compliance metrics
      if (event.action === 'note_generated') notesGenerated++;
      if (event.action === 'note_modified') notesModified++;
      if (event.action === 'audit_run') {
        if (event.status === 'success') auditsPassed++;
        else auditsFailed++;
      }
    });

    const totalAudits = auditsPassed + auditsFailed;
    const complianceRate = totalAudits > 0 ? (auditsPassed / totalAudits) * 100 : 0;

    return {
      generatedAt: new Date(),
      period: { start: startDate, end: endDate },
      totalEvents: periodEvents.length,
      eventsByAction,
      eventsByUser,
      complianceMetrics: {
        notesGenerated,
        notesModified,
        auditsPassed,
        auditsFailed,
        complianceRate,
      },
      accessLog: periodEvents,
    };
  }

  /**
   * Clean up old audit logs based on retention policy
   */
  cleanupOldLogs(): void {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.maxRetentionDays);

    const initialLength = this.events.length;
    this.events = this.events.filter((event) => event.timestamp > cutoffDate);

    const deletedCount = initialLength - this.events.length;
    if (deletedCount > 0) {
      logger.info({
        message: 'Audit logs cleaned up',
        deletedCount,
        retentionDays: this.maxRetentionDays,
      });
    }
  }

  /**
   * Export audit logs to file
   */
  exportLogs(format: 'json' | 'csv' = 'json'): string {
    if (format === 'json') {
      return JSON.stringify(this.events, null, 2);
    }

    // CSV format
    const headers = [
      'ID',
      'Timestamp',
      'User ID',
      'Action',
      'Resource Type',
      'Resource ID',
      'Status',
    ];
    const rows = this.events.map((event) => [
      event.id,
      event.timestamp.toISOString(),
      event.userId || '',
      event.action,
      event.resourceType,
      event.resourceId,
      event.status,
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(','))
      .join('\n');

    return csv;
  }

  /**
   * Set retention policy
   */
  setRetentionPolicy(days: number): void {
    this.maxRetentionDays = days;
    logger.info({
      message: 'Audit retention policy updated',
      retentionDays: days,
    });
  }

  /**
   * Get all events (for testing)
   */
  getAllEvents(): AuditEvent[] {
    return [...this.events];
  }

  /**
   * Clear all events (for testing)
   */
  clearEvents(): void {
    this.events = [];
  }

  logCustomEvent(event: AuditEvent): void {
    this.events.push(event);
    logger.info({
      message: 'Audit event recorded',
      auditEvent: event,
    });
  }
}

// Export singleton instance
export const auditLogger = new AuditLogger();

export const auditLog = async (
  event: Omit<AuditEvent, 'id' | 'timestamp'> & { id?: string; timestamp?: Date }
): Promise<void> => {
  const entry: AuditEvent = {
    id: event.id ?? `audit_${Date.now()}_${Math.random()}`,
    timestamp: event.timestamp ?? new Date(),
    ...event,
  };
  auditLogger.logCustomEvent(entry);
};

export default auditLogger;
