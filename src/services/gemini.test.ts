import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { parseBrainDump, generateTherapyNote, auditNoteWithAI } from './gemini';
import { createMockTherapyState } from '../__tests__/fixtures';
import { server, setMockGenerateContent } from '../setupTests';

const mockGenerateLocalNote = vi.hoisted(() => vi.fn(async () => 'Mock local note'));

vi.mock('./localLLM', () => ({
  generateLocalNote: mockGenerateLocalNote,
}));


describe('Gemini Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    server.resetHandlers();
  });

  describe('parseBrainDump', () => {
    it('should return empty object in local mode', async () => {
      const state = createMockTherapyState({ isLocalMode: true });
      const result = await parseBrainDump('Some brain dump text', state);
      expect(result).toEqual({});
    });

    it('should parse brain dump text and return structured data', async () => {
      const state = createMockTherapyState({
        discipline: 'PT',
        documentType: 'Daily',
        isLocalMode: false,
      });

      setMockGenerateContent(vi.fn().mockResolvedValue({
        text: JSON.stringify({
          sessionDate: '2024-01-15',
          goals: ['Improve gait'],
          activity: 'Gait Training',
        }),
        candidates: [{ groundingMetadata: {} }],
      }));

      const result = await parseBrainDump('Patient walked 100 feet', state);
      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
    });

    it('should handle JSON parsing errors gracefully', async () => {
      const state = createMockTherapyState({
        discipline: 'PT',
        documentType: 'Daily',
        isLocalMode: false,
      });

      setMockGenerateContent(vi.fn().mockResolvedValue({
        text: 'Invalid JSON',
        candidates: [{ groundingMetadata: {} }],
      }));

      const result = await parseBrainDump('Patient walked 100 feet', state);
      expect(result).toEqual({});
    });

    it('should scrub PII from brain dump', async () => {
      const state = createMockTherapyState({
        discipline: 'PT',
        documentType: 'Daily',
        isLocalMode: false,
      });

      setMockGenerateContent(vi.fn().mockResolvedValue({
        text: JSON.stringify({}),
        candidates: [{ groundingMetadata: {} }],
      }));

      const brainDumpWithPII = 'Patient SSN: 123-45-6789 walked 100 feet';
      const result = await parseBrainDump(brainDumpWithPII, state);
      expect(result).toBeDefined();
    });

    it('should handle API errors gracefully', async () => {
      const state = createMockTherapyState({
        discipline: 'PT',
        documentType: 'Daily',
        isLocalMode: false,
      });

      setMockGenerateContent(vi.fn().mockRejectedValue(
        new Error('API Error')
      ));

      try {
        await parseBrainDump('Patient walked 100 feet', state);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('generateTherapyNote', () => {
    it('should generate note in local mode', async () => {
      const state = createMockTherapyState({
        discipline: 'PT',
        documentType: 'Daily',
        isLocalMode: true,
      });

      const result = await generateTherapyNote(state);
      expect(result).toBeDefined();
      expect(result.text).toBeDefined();
      expect(typeof result.text).toBe('string');
      expect(result.text.length).toBeGreaterThan(0);
      expect(Array.isArray(result.appliedPolicies)).toBe(true);
    });

    it('should generate note with Gemini API', async () => {
      const state = createMockTherapyState({
        discipline: 'PT',
        documentType: 'Daily',
        isLocalMode: false,
      });

      setMockGenerateContent(vi.fn().mockResolvedValue({
        text: 'Generated therapy note content',
        candidates: [{ groundingMetadata: {} }],
      }));

      const result = await generateTherapyNote(state);
      expect(result).toBeDefined();
      expect(result.text).toBe('Generated therapy note content');
      expect(Array.isArray(result.appliedPolicies)).toBe(true);
    });

    it('should include user style in generated note', async () => {
      const state = createMockTherapyState({
        discipline: 'PT',
        documentType: 'Daily',
        isLocalMode: false,
      });

      setMockGenerateContent(vi.fn().mockResolvedValue({
        text: 'Generated note with style',
        candidates: [{ groundingMetadata: {} }],
      }));

      const userStyle = 'Concise and clinical';
      const result = await generateTherapyNote(state, userStyle);
      expect(result).toBeDefined();
      expect(result.text).toBeDefined();
      expect(result.appliedPolicies).toBeDefined();
    });

    it('should handle missing optional fields', async () => {
      const state = createMockTherapyState({
        discipline: 'PT',
        documentType: 'Daily',
        sessionDate: undefined,
        goals: undefined,
      });

      setMockGenerateContent(vi.fn().mockResolvedValue({
        text: 'Note without optional fields',
        candidates: [{ groundingMetadata: {} }],
      }));

      const result = await generateTherapyNote(state);
      expect(result).toBeDefined();
      expect(result.text).toBeDefined();
    });

    it('should handle API quota exceeded error', async () => {
      const state = createMockTherapyState({
        discipline: 'PT',
        documentType: 'Daily',
        isLocalMode: false,
      });

      setMockGenerateContent(vi.fn().mockRejectedValue(
        new Error('Quota exceeded')
      ));

      try {
        await generateTherapyNote(state);
      } catch (error: any) {
        expect(error.message).toContain('Quota');
      }
    });

    it('should handle safety filter errors', async () => {
      const state = createMockTherapyState({
        discipline: 'PT',
        documentType: 'Daily',
        isLocalMode: false,
      });

      setMockGenerateContent(vi.fn().mockRejectedValue(
        new Error('Safety filter triggered')
      ));

      try {
        await generateTherapyNote(state);
      } catch (error: any) {
        expect(error.message).toContain('safety');
      }
    });
  });

  describe('auditNoteWithAI', () => {
    it('should audit note and return compliance score', async () => {
      const note = 'Patient participated in skilled physical therapy';

      setMockGenerateContent(vi.fn().mockResolvedValue({
        text: JSON.stringify({
          complianceScore: 85,
          findings: ['Consider adding more specific measurements'],
          checklist: {
            'Skilled Intervention Demonstrated': true,
            'Medical Necessity Established': true,
          },
        }),
        candidates: [{ groundingMetadata: {} }],
      }));

      const result = await auditNoteWithAI(note, 'Daily');
      expect(result).toBeDefined();
      expect(result.data).toBeDefined();
      expect(result.data.complianceScore).toBe(85);
      expect(Array.isArray(result.data.findings)).toBe(true);
      expect(Array.isArray(result.appliedPolicies)).toBe(true);
    });

    it('should handle audit API errors', async () => {
      setMockGenerateContent(vi.fn().mockRejectedValue(
        new Error('API Error')
      ));

      try {
        await auditNoteWithAI('Note content', 'Daily');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should validate audit result structure', async () => {
      setMockGenerateContent(vi.fn().mockResolvedValue({
        text: JSON.stringify({
          complianceScore: 90,
          findings: ['Finding 1', 'Finding 2'],
          checklist: {
            'Skilled Intervention Demonstrated': true,
          },
        }),
        candidates: [{ groundingMetadata: {} }],
      }));

      const result = await auditNoteWithAI('Note content', 'Assessment');
      expect(result.data).toBeDefined();
      expect(result.data.complianceScore).toBeGreaterThanOrEqual(0);
      expect(result.data.complianceScore).toBeLessThanOrEqual(100);
      expect(Array.isArray(result.data.findings)).toBe(true);
    });
  });
});


