import { describe, it, expect } from 'vitest';
import { scrubPII } from './security';

describe('Security Module', () => {
  describe('scrubPII', () => {
    it('should scrub SSN patterns', () => {
      const text = 'Patient SSN: 123-45-6789';
      const { scrubbed, hasPII } = scrubPII(text);
      expect(scrubbed).toBe('Patient SSN: [REDACTED]');
      expect(hasPII).toBe(true);
    });

    it('should scrub email addresses', () => {
      const text = 'Contact: patient@example.com';
      const { scrubbed, hasPII } = scrubPII(text);
      expect(scrubbed).toBe('Contact: [REDACTED]');
      expect(hasPII).toBe(true);
    });

    it('should scrub phone numbers', () => {
      const text = 'Phone: 555-123-4567';
      const { scrubbed, hasPII } = scrubPII(text);
      expect(scrubbed).toBe('Phone: [REDACTED]');
      expect(hasPII).toBe(true);
    });

    it('should scrub multiple PII patterns', () => {
      const text = 'Patient: John Doe, SSN: 123-45-6789, Email: john@example.com, Phone: 555-123-4567';
      const { scrubbed, hasPII } = scrubPII(text);
      expect(scrubbed).toContain('[REDACTED]');
      expect(hasPII).toBe(true);
      expect(scrubbed).not.toContain('123-45-6789');
      expect(scrubbed).not.toContain('john@example.com');
      expect(scrubbed).not.toContain('555-123-4567');
    });

    it('should not flag text without PII', () => {
      const text = 'Patient participated in physical therapy session';
      const { scrubbed, hasPII } = scrubPII(text);
      expect(scrubbed).toBe(text);
      expect(hasPII).toBe(false);
    });

    it('should handle empty strings', () => {
      const { scrubbed, hasPII } = scrubPII('');
      expect(scrubbed).toBe('');
      expect(hasPII).toBe(false);
    });

    it('should be case-insensitive for email', () => {
      const text = 'Contact: PATIENT@EXAMPLE.COM';
      const { scrubbed, hasPII } = scrubPII(text);
      expect(scrubbed).toBe('Contact: [REDACTED]');
      expect(hasPII).toBe(true);
    });
  });
});
