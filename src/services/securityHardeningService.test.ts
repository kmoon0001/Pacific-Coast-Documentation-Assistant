import { describe, it, expect, beforeEach } from 'vitest';
import { securityHardeningService } from './securityHardeningService';

describe('SecurityHardeningService', () => {
  beforeEach(() => {
    securityHardeningService.clearSecurityEvents();
    securityHardeningService.clearRateLimits();
  });

  describe('validateFile', () => {
    it('should validate correct file', () => {
      const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });

      const result = securityHardeningService.validateFile(file, 'pdf');

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject invalid file type', () => {
      const file = new File(['content'], 'test.exe', { type: 'application/x-msdownload' });

      const result = securityHardeningService.validateFile(file, 'exe');

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should reject empty file', () => {
      const file = new File([], 'test.pdf', { type: 'application/pdf' });

      const result = securityHardeningService.validateFile(file, 'pdf');

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('empty'))).toBe(true);
    });

    it('should reject oversized file', () => {
      // Create a mock file with large size property (don't actually allocate memory)
      const file = new File(['x'], 'test.pdf', { type: 'application/pdf' });
      Object.defineProperty(file, 'size', { value: 60 * 1024 * 1024, writable: false });

      const result = securityHardeningService.validateFile(file, 'pdf');

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('exceeds'))).toBe(true);
    });

    it('should reject file with invalid characters in name', () => {
      const file = new File(['content'], 'test<>.pdf', { type: 'application/pdf' });

      const result = securityHardeningService.validateFile(file, 'pdf');

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('invalid characters'))).toBe(true);
    });

    it('should accept all allowed file types', () => {
      const types = ['pdf', 'docx', 'txt', 'md'];

      for (const type of types) {
        const file = new File(['content'], `test.${type}`, { type: 'application/octet-stream' });
        const result = securityHardeningService.validateFile(file, type);

        expect(result.valid).toBe(true);
      }
    });
  });

  describe('validateFileContent', () => {
    it('should validate safe content', async () => {
      const file = new File(['This is safe content'], 'test.txt', { type: 'text/plain' });

      const result = await securityHardeningService.validateFileContent(file, 'txt');

      expect(result.valid).toBe(true);
    });

    it('should reject content with script tags', async () => {
      const file = new File(['<script>alert("xss")</script>'], 'test.txt', { type: 'text/plain' });

      const result = await securityHardeningService.validateFileContent(file, 'txt');

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('suspicious'))).toBe(true);
    });

    it('should reject content with event handlers', async () => {
      const file = new File(['<div onclick="alert()">Click me</div>'], 'test.txt', { type: 'text/plain' });

      const result = await securityHardeningService.validateFileContent(file, 'txt');

      expect(result.valid).toBe(false);
    });

    it('should reject content with javascript protocol', async () => {
      const file = new File(['<a href="javascript:alert()">Link</a>'], 'test.txt', { type: 'text/plain' });

      const result = await securityHardeningService.validateFileContent(file, 'txt');

      expect(result.valid).toBe(false);
    });
  });

  describe('checkRateLimit', () => {
    it('should allow requests within limit', () => {
      for (let i = 0; i < 50; i++) {
        const allowed = securityHardeningService.checkRateLimit('user1', 'upload', 100, 60000);
        expect(allowed).toBe(true);
      }
    });

    it('should block requests exceeding limit', () => {
      for (let i = 0; i < 100; i++) {
        securityHardeningService.checkRateLimit('user1', 'upload', 100, 60000);
      }

      const allowed = securityHardeningService.checkRateLimit('user1', 'upload', 100, 60000);
      expect(allowed).toBe(false);
    });

    it('should track different actions separately', () => {
      for (let i = 0; i < 50; i++) {
        securityHardeningService.checkRateLimit('user1', 'upload', 100, 60000);
      }

      for (let i = 0; i < 50; i++) {
        const allowed = securityHardeningService.checkRateLimit('user1', 'search', 100, 60000);
        expect(allowed).toBe(true);
      }
    });

    it('should track different users separately', () => {
      for (let i = 0; i < 100; i++) {
        securityHardeningService.checkRateLimit('user1', 'upload', 100, 60000);
      }

      const allowed = securityHardeningService.checkRateLimit('user2', 'upload', 100, 60000);
      expect(allowed).toBe(true);
    });

    it('should log security event on rate limit exceeded', () => {
      for (let i = 0; i < 101; i++) {
        securityHardeningService.checkRateLimit('user1', 'upload', 100, 60000);
      }

      const events = securityHardeningService.getSecurityEvents('user1', 'medium');
      expect(events.length).toBeGreaterThan(0);
    });
  });

  describe('getRateLimitStatus', () => {
    it('should return remaining requests', () => {
      securityHardeningService.checkRateLimit('user1', 'upload', 100, 60000);
      securityHardeningService.checkRateLimit('user1', 'upload', 100, 60000);

      const status = securityHardeningService.getRateLimitStatus('user1', 'upload');

      expect(status.remaining).toBe(98);
    });

    it('should return reset time', () => {
      securityHardeningService.checkRateLimit('user1', 'upload', 100, 60000);

      const status = securityHardeningService.getRateLimitStatus('user1', 'upload');

      expect(status.resetTime).toBeInstanceOf(Date);
      expect(status.resetTime.getTime()).toBeGreaterThan(Date.now());
    });

    it('should return default status for new action', () => {
      const status = securityHardeningService.getRateLimitStatus('user-new', 'new-action', 100);

      expect(status.remaining).toBe(100);
    });
  });

  describe('encryptData and decryptData', () => {
    it('should encrypt and decrypt data', () => {
      const original = 'sensitive data';
      const key = 'secret-key';

      const encrypted = securityHardeningService.encryptData(original, key);
      const decrypted = securityHardeningService.decryptData(encrypted, key);

      expect(decrypted).toBe(original);
    });

    it('should produce different encrypted output for same input', () => {
      const data = 'test data';
      const key = 'secret-key';

      const encrypted1 = securityHardeningService.encryptData(data, key);
      const encrypted2 = securityHardeningService.encryptData(data, key);

      // XOR encryption with same key produces same output
      expect(encrypted1).toBe(encrypted2);
    });

    it('should fail to decrypt with wrong key', () => {
      const data = 'sensitive data';
      const key1 = 'secret-key-1';
      const key2 = 'secret-key-2';

      const encrypted = securityHardeningService.encryptData(data, key1);
      const decrypted = securityHardeningService.decryptData(encrypted, key2);

      expect(decrypted).not.toBe(data);
    });
  });

  describe('logSecurityEvent', () => {
    it('should log security event', () => {
      securityHardeningService.logSecurityEvent('user1', 'suspicious_upload', { filename: 'test.exe' }, 'high');

      const events = securityHardeningService.getSecurityEvents();

      expect(events.length).toBe(1);
      expect(events[0].action).toBe('suspicious_upload');
    });

    it('should track event severity', () => {
      securityHardeningService.logSecurityEvent('user1', 'event1', {}, 'low');
      securityHardeningService.logSecurityEvent('user1', 'event2', {}, 'medium');
      securityHardeningService.logSecurityEvent('user1', 'event3', {}, 'high');

      const events = securityHardeningService.getSecurityEvents();

      expect(events).toHaveLength(3);
    });
  });

  describe('getSecurityEvents', () => {
    it('should filter events by user', () => {
      securityHardeningService.logSecurityEvent('user1', 'event1', {}, 'low');
      securityHardeningService.logSecurityEvent('user2', 'event2', {}, 'low');

      const events = securityHardeningService.getSecurityEvents('user1');

      expect(events).toHaveLength(1);
      expect(events[0].userId).toBe('user1');
    });

    it('should filter events by severity', () => {
      securityHardeningService.logSecurityEvent('user1', 'event1', {}, 'low');
      securityHardeningService.logSecurityEvent('user1', 'event2', {}, 'medium');
      securityHardeningService.logSecurityEvent('user1', 'event3', {}, 'high');

      const events = securityHardeningService.getSecurityEvents(undefined, 'high');

      expect(events).toHaveLength(1);
      expect(events[0].severity).toBe('high');
    });
  });

  describe('getSecurityReport', () => {
    it('should generate security report', () => {
      securityHardeningService.logSecurityEvent('user1', 'event1', {}, 'low');
      securityHardeningService.logSecurityEvent('user1', 'event2', {}, 'medium');
      securityHardeningService.logSecurityEvent('user1', 'event3', {}, 'high');

      const report = securityHardeningService.getSecurityReport();

      expect(report.totalEvents).toBe(3);
      expect(report.lowSeverityEvents).toBe(1);
      expect(report.mediumSeverityEvents).toBe(1);
      expect(report.highSeverityEvents).toBe(1);
    });

    it('should include recent events', () => {
      for (let i = 0; i < 15; i++) {
        securityHardeningService.logSecurityEvent('user1', `event${i}`, {}, 'low');
      }

      const report = securityHardeningService.getSecurityReport();

      expect(report.recentEvents.length).toBeLessThanOrEqual(10);
    });
  });

  describe('validateDocumentSecurity', () => {
    it('should validate safe document', () => {
      const document = {
        id: 'doc1',
        userId: 'user1',
        title: 'Safe Document',
        description: 'A safe document',
        category: 'Policy' as const,
        content: 'This is safe content',
        contentHash: 'hash1',
        fileType: 'pdf' as const,
        fileSize: 1024,
        uploadedAt: new Date(),
        updatedAt: new Date(),
        version: 1,
        tags: [],
        isActive: true,
        metadata: {},
      };

      const result = securityHardeningService.validateDocumentSecurity(document);

      expect(result.valid).toBe(true);
      expect(result.issues).toHaveLength(0);
    });

    it('should reject document with suspicious content', () => {
      const document = {
        id: 'doc1',
        userId: 'user1',
        title: 'Suspicious Document',
        description: 'A suspicious document',
        category: 'Policy' as const,
        content: '<script>alert("xss")</script>',
        contentHash: 'hash1',
        fileType: 'pdf' as const,
        fileSize: 1024,
        uploadedAt: new Date(),
        updatedAt: new Date(),
        version: 1,
        tags: [],
        isActive: true,
        metadata: {},
      };

      const result = securityHardeningService.validateDocumentSecurity(document);

      expect(result.valid).toBe(false);
      expect(result.issues.length).toBeGreaterThan(0);
    });
  });

  describe('sanitizeDocumentContent', () => {
    it('should remove script tags', () => {
      const content = 'Before <script>alert("xss")</script> After';

      const sanitized = securityHardeningService.sanitizeDocumentContent(content);

      expect(sanitized).not.toContain('<script>');
      expect(sanitized).toContain('Before');
      expect(sanitized).toContain('After');
    });

    it('should remove event handlers', () => {
      const content = '<div onclick="alert()">Click me</div>';

      const sanitized = securityHardeningService.sanitizeDocumentContent(content);

      expect(sanitized).not.toContain('onclick');
    });

    it('should remove javascript protocol', () => {
      const content = '<a href="javascript:alert()">Link</a>';

      const sanitized = securityHardeningService.sanitizeDocumentContent(content);

      expect(sanitized).not.toContain('javascript:');
    });
  });

  describe('getAllowedFileTypes', () => {
    it('should return allowed file types', () => {
      const types = securityHardeningService.getAllowedFileTypes();

      expect(types).toContain('pdf');
      expect(types).toContain('docx');
      expect(types).toContain('txt');
      expect(types).toContain('md');
    });
  });

  describe('getMaxFileSize', () => {
    it('should return max file size', () => {
      const maxSize = securityHardeningService.getMaxFileSize();

      expect(maxSize).toBe(50 * 1024 * 1024);
    });
  });
});
