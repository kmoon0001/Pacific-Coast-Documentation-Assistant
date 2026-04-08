import { describe, it, expect } from 'vitest';
import {
  validateTherapyState,
  validateGeneratedNote,
  validateClipboardItem,
  TherapyStateSchema,
  DisciplineSchema,
  DocumentTypeSchema,
} from './validation';
import {
  createMockTherapyState,
  createMockGeneratedNote,
  createMockClipboardItem,
} from '../__tests__/fixtures';

describe('Validation Module', () => {
  describe('DisciplineSchema', () => {
    it('should validate PT discipline', () => {
      const result = DisciplineSchema.safeParse('PT');
      expect(result.success).toBe(true);
    });

    it('should validate OT discipline', () => {
      const result = DisciplineSchema.safeParse('OT');
      expect(result.success).toBe(true);
    });

    it('should validate ST discipline', () => {
      const result = DisciplineSchema.safeParse('ST');
      expect(result.success).toBe(true);
    });

    it('should reject invalid discipline', () => {
      const result = DisciplineSchema.safeParse('INVALID');
      expect(result.success).toBe(false);
    });
  });

  describe('DocumentTypeSchema', () => {
    it('should validate Daily document type', () => {
      const result = DocumentTypeSchema.safeParse('Daily');
      expect(result.success).toBe(true);
    });

    it('should validate Progress document type', () => {
      const result = DocumentTypeSchema.safeParse('Progress');
      expect(result.success).toBe(true);
    });

    it('should validate Assessment document type', () => {
      const result = DocumentTypeSchema.safeParse('Assessment');
      expect(result.success).toBe(true);
    });

    it('should validate Discharge document type', () => {
      const result = DocumentTypeSchema.safeParse('Discharge');
      expect(result.success).toBe(true);
    });

    it('should validate Recertification document type', () => {
      const result = DocumentTypeSchema.safeParse('Recertification');
      expect(result.success).toBe(true);
    });

    it('should reject invalid document type', () => {
      const result = DocumentTypeSchema.safeParse('INVALID');
      expect(result.success).toBe(false);
    });
  });

  describe('validateTherapyState', () => {
    it('should validate complete therapy state', () => {
      const state = createMockTherapyState({
        discipline: 'PT',
        documentType: 'Daily',
        cptCode: '97110',
      });

      const result = validateTherapyState(state);
      expect(result.success).toBe(true);
    });

    it('should validate minimal therapy state', () => {
      const state = {
        documentType: 'Daily',
        details: {},
        customNote: '',
      };

      const result = validateTherapyState(state);
      expect(result.success).toBe(true);
    });

    it('should reject invalid discipline', () => {
      const state = {
        discipline: 'INVALID',
        documentType: 'Daily',
        details: {},
        customNote: '',
      };

      const result = validateTherapyState(state);
      expect(result.success).toBe(false);
    });

    it('should reject missing documentType', () => {
      const state = {
        discipline: 'PT',
        details: {},
        customNote: '',
      };

      const result = validateTherapyState(state);
      expect(result.success).toBe(false);
    });

    it('should provide error details on validation failure', () => {
      const state = {
        discipline: 'INVALID',
        documentType: 'Daily',
        details: {},
        customNote: '',
      };

      const result = validateTherapyState(state);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeDefined();
        expect(result.error.issues.length).toBeGreaterThan(0);
      }
    });

    it('should validate optional fields', () => {
      const state = createMockTherapyState({
        discipline: 'PT',
        documentType: 'Assessment',
        sessionDate: '2024-01-15',
        goals: ['Improve gait', 'Reduce pain'],
        icd10Codes: ['M25.5', 'R26.2'],
      });

      const result = validateTherapyState(state);
      expect(result.success).toBe(true);
    });

    it('should validate plan of care structure', () => {
      const state = createMockTherapyState({
        documentType: 'Assessment',
        planOfCare: {
          frequency: '3x/week',
          duration: '4 weeks',
          longTermGoals: 'Improve functional mobility',
        },
      });

      const result = validateTherapyState(state);
      expect(result.success).toBe(true);
    });

    it('should validate audit result structure', () => {
      const state = createMockTherapyState({
        auditResult: {
          complianceScore: 85,
          findings: ['Finding 1'],
          checklist: {
            'Skilled Intervention Demonstrated': true,
          },
        },
      });

      const result = validateTherapyState(state);
      expect(result.success).toBe(true);
    });
  });

  describe('validateGeneratedNote', () => {
    it('should validate complete generated note', () => {
      const note = createMockGeneratedNote({
        content: 'Note content',
        timestamp: new Date().toLocaleString(),
        type: 'PT Daily',
      });

      const result = validateGeneratedNote(note);
      expect(result.success).toBe(true);
    });

    it('should reject missing content', () => {
      const note = {
        timestamp: new Date().toLocaleString(),
        type: 'PT Daily',
      };

      const result = validateGeneratedNote(note);
      expect(result.success).toBe(false);
    });

    it('should reject missing timestamp', () => {
      const note = {
        content: 'Note content',
        type: 'PT Daily',
      };

      const result = validateGeneratedNote(note);
      expect(result.success).toBe(false);
    });

    it('should reject missing type', () => {
      const note = {
        content: 'Note content',
        timestamp: new Date().toLocaleString(),
      };

      const result = validateGeneratedNote(note);
      expect(result.success).toBe(false);
    });
  });

  describe('validateClipboardItem', () => {
    it('should validate complete clipboard item', () => {
      const item = createMockClipboardItem({
        id: '1',
        title: 'Test Note',
        content: 'Test content',
        date: new Date().toISOString(),
      });

      const result = validateClipboardItem(item);
      expect(result.success).toBe(true);
    });

    it('should reject missing id', () => {
      const item = {
        title: 'Test Note',
        content: 'Test content',
        date: new Date().toISOString(),
      };

      const result = validateClipboardItem(item);
      expect(result.success).toBe(false);
    });

    it('should reject missing title', () => {
      const item = {
        id: '1',
        content: 'Test content',
        date: new Date().toISOString(),
      };

      const result = validateClipboardItem(item);
      expect(result.success).toBe(false);
    });

    it('should reject missing content', () => {
      const item = {
        id: '1',
        title: 'Test Note',
        date: new Date().toISOString(),
      };

      const result = validateClipboardItem(item);
      expect(result.success).toBe(false);
    });

    it('should reject missing date', () => {
      const item = {
        id: '1',
        title: 'Test Note',
        content: 'Test content',
      };

      const result = validateClipboardItem(item);
      expect(result.success).toBe(false);
    });
  });

  describe('Schema Constraints', () => {
    it('should enforce compliance score between 0-100', () => {
      const state = createMockTherapyState({
        auditResult: {
          complianceScore: 150,
          findings: [],
        },
      });

      const result = validateTherapyState(state);
      expect(result.success).toBe(false);
    });

    it('should accept compliance score of 0', () => {
      const state = createMockTherapyState({
        auditResult: {
          complianceScore: 0,
          findings: [],
        },
      });

      const result = validateTherapyState(state);
      expect(result.success).toBe(true);
    });

    it('should accept compliance score of 100', () => {
      const state = createMockTherapyState({
        auditResult: {
          complianceScore: 100,
          findings: [],
        },
      });

      const result = validateTherapyState(state);
      expect(result.success).toBe(true);
    });
  });
});
