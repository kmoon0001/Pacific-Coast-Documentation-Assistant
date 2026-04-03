import { describe, it, expect, beforeEach, vi } from 'vitest';
import createBackendServer, { backendInternals } from './backend';

describe('backendInternals', () => {
  it('exposes the backend factory', () => {
    expect(typeof createBackendServer).toBe('function');
  });

  beforeEach(() => {
    backendInternals.resetInMemoryStore();
    vi.useRealTimers();
  });

  it('hashes passwords and validates credentials', async () => {
    const user = await backendInternals.createUser('internals@example.com', 'supersecret1');
    const authUser = await backendInternals.authenticateUser('internals@example.com', 'supersecret1');
    expect(authUser?.id).toBe(user.id);
    expect(await backendInternals.authenticateUser('internals@example.com', 'wrong')).toBeNull();

    const digest = backendInternals.hashPassword('another-secret');
    expect(backendInternals.verifyPassword('another-secret', digest)).toBe(true);
    expect(backendInternals.verifyPassword('nope', digest)).toBe(false);
  });

  it('issues short-lived session tokens', () => {
    const token = backendInternals.generateJWT('user-123');
    expect(backendInternals.verifyJWT(token)).toBe('user-123');

    vi.useFakeTimers();
    const now = Date.now();
    vi.setSystemTime(now + 1000 * 60 * 60 + 1);
    expect(() => backendInternals.verifyJWT(token)).toThrow('Token expired');
    vi.useRealTimers();
  });

  it('encrypts note payloads in storage', () => {
    const ciphertext = backendInternals.encryptData('sensitive payload');
    expect(ciphertext).not.toContain('sensitive payload');
    expect(backendInternals.decryptData(ciphertext)).toBe('sensitive payload');
  });

  it('records audit events and builds compliance reports', async () => {
    const user = await backendInternals.createUser('audit@example.com', 'compliance123');
    const note = await backendInternals.createNote(user.id, {
      content: 'Document body',
      type: 'PT Daily',
      discipline: 'PT',
      documentType: 'Daily',
      auditResult: { complianceScore: 92 },
    });

    const req = { ip: '127.0.0.1', get: () => 'vitest-agent' } as any;
    await backendInternals.logAuditEvent(user.id, 'note_created', 'note', note.id, req);
    await backendInternals.logAuditEvent(user.id, 'note_updated', 'note', note.id, req, { content: 'Updated' });

    const logs = await backendInternals.getAuditLogs(user.id);
    expect(logs).toHaveLength(2);
    expect(logs[0].ipAddress).toBe('127.0.0.1');

    const report = await backendInternals.generateAuditReport(user.id);
    expect(report.totalNotes).toBe(1);
    expect(report.totalModifications).toBe(1);
    expect(report.complianceMetrics.complianceRate).toBe(100);
    expect(report.eventsByAction.note_created).toBe(1);
  });
});
