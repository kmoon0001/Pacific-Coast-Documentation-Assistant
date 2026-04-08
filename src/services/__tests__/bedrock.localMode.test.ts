import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { TherapyState } from '../../types';

// Mock the localLLM module to simulate TinyLlama behavior
const mockGenerateLocalNote = vi.fn();
vi.mock('../localLLM', () => ({
  generateLocalNote: mockGenerateLocalNote,
}));

// Mock the gemini module to ensure we use local mode
vi.mock('../gemini', () => ({
  generateWithGemini: vi.fn().mockRejectedValue(new Error('No API key')),
}));

describe('Bedrock Service - Local Mode Enhancements', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock returns a realistic note
    mockGenerateLocalNote.mockResolvedValue(
      'INTERVENTION: Pt participated in skilled therapy. RESPONSE: Pt tolerated well.'
    );
  });

  describe('generateTherapyNote - Local Mode Prompts', () => {
    it('should send detailed Medicare-compliant prompt for Daily notes', async () => {
      const { generateTherapyNote } = await import('../bedrock');
      
      const state: TherapyState = {
        discipline: 'PT',
        documentType: 'Daily',
        cptCode: '97116',
        activity: 'Gait Training',
        details: {
          assistLevel: 'supervision',
          duration: '30 minutes',
        },
        isLocalMode: true,
      };

      await generateTherapyNote(state);

      // Verify detailed prompt was sent
      expect(mockGenerateLocalNote).toHaveBeenCalledWith(
        expect.stringContaining('Medicare')
      );
      expect(mockGenerateLocalNote).toHaveBeenCalledWith(
        expect.stringContaining('skilled intervention')
      );
      expect(mockGenerateLocalNote).toHaveBeenCalledWith(
        expect.stringContaining('PT')
      );
      expect(mockGenerateLocalNote).toHaveBeenCalledWith(
        expect.stringContaining('Daily')
      );
      expect(mockGenerateLocalNote).toHaveBeenCalledWith(
        expect.stringContaining('Gait Training')
      );
    });

    it('should include document-type-specific instructions for Assessment', async () => {
      const { generateTherapyNote } = await import('../bedrock');
      
      const state: TherapyState = {
        discipline: 'OT',
        documentType: 'Assessment',
        reasonForReferral: 'Decreased functional mobility',
        isLocalMode: true,
      };

      await generateTherapyNote(state);

      const promptCall = mockGenerateLocalNote.mock.calls[0][0];
      expect(promptCall).toContain('Assessment');
      expect(promptCall).toContain('comprehensive initial evaluation');
      expect(promptCall).toContain('Prior Level of Function');
    });

    it('should include all clinical details in prompt', async () => {
      const { generateTherapyNote } = await import('../bedrock');
      
      const state: TherapyState = {
        discipline: 'ST',
        documentType: 'Progress',
        goals: ['Improve swallowing safety', 'Increase oral intake'],
        clinicalImpressions: 'Patient improving',
        responseToIntervention: 'Positive response',
        progressStatement: 'Making progress',
        reportingPeriod: 'Past 2 weeks',
        isLocalMode: true,
      };

      await generateTherapyNote(state);

      const promptCall = mockGenerateLocalNote.mock.calls[0][0];
      expect(promptCall).toContain('Improve swallowing safety');
      expect(promptCall).toContain('Increase oral intake');
      expect(promptCall).toContain('Patient improving');
      expect(promptCall).toContain('Positive response');
      expect(promptCall).toContain('Making progress');
    });

    it('should include Medicare requirements in prompt', async () => {
      const { generateTherapyNote } = await import('../bedrock');
      
      const state: TherapyState = {
        discipline: 'PT',
        documentType: 'Daily',
        isLocalMode: true,
      };

      await generateTherapyNote(state);

      const promptCall = mockGenerateLocalNote.mock.calls[0][0];
      expect(promptCall).toContain('CRITICAL MEDICARE REQUIREMENTS');
      expect(promptCall).toContain('Demonstrate skilled intervention');
      expect(promptCall).toContain('Establish medical necessity');
      expect(promptCall).toContain('Document functional outcomes');
    });

    it('should include standard medical abbreviations guidance', async () => {
      const { generateTherapyNote } = await import('../bedrock');
      
      const state: TherapyState = {
        discipline: 'OT',
        documentType: 'Daily',
        isLocalMode: true,
      };

      await generateTherapyNote(state);

      const promptCall = mockGenerateLocalNote.mock.calls[0][0];
      expect(promptCall).toContain('Pt');
      expect(promptCall).toContain('SBA');
      expect(promptCall).toContain('Min A');
      expect(promptCall).toContain('Mod A');
    });
  });

  describe('Enhanced Fallback Function', () => {
    it('should use fallback when TinyLlama fails - Daily note', async () => {
      mockGenerateLocalNote.mockRejectedValueOnce(new Error('TinyLlama failed'));

      const { generateTherapyNote } = await import('../bedrock');
      
      const state: TherapyState = {
        discipline: 'PT',
        documentType: 'Daily',
        cptCode: '97116',
        activity: 'Gait Training',
        details: {
          assistLevel: 'minimal assistance',
          duration: '45 minutes',
        },
        isLocalMode: true,
      };

      const result = await generateTherapyNote(state);

      // Should get enhanced fallback note
      expect(result.text).toBeTruthy();
      expect(result.text).toContain('INTERVENTION');
      expect(result.text).toContain('RESPONSE');
      expect(result.text).toContain('Gait Training');
      expect(result.text).toContain('skilled');
      expect(result.text.length).toBeGreaterThan(100);
    });

    it('should use fallback for Assessment with all required sections', async () => {
      mockGenerateLocalNote.mockRejectedValueOnce(new Error('Failed'));

      const { generateTherapyNote } = await import('../bedrock');
      
      const state: TherapyState = {
        discipline: 'OT',
        documentType: 'Assessment',
        reasonForReferral: 'Decreased ADL independence',
        goals: ['Improve ADL independence', 'Increase safety'],
        isLocalMode: true,
      };

      const result = await generateTherapyNote(state);

      expect(result.text).toContain('REASON FOR REFERRAL');
      expect(result.text).toContain('PRIOR LEVEL OF FUNCTION');
      expect(result.text).toContain('CURRENT FUNCTIONAL STATUS');
      expect(result.text).toContain('SKILLED NECESSITY');
      expect(result.text).toContain('GOALS');
      expect(result.text).toContain('PLAN OF CARE');
      expect(result.text).toContain('Improve ADL independence');
    });

    it('should use fallback for Progress with goal tracking', async () => {
      mockGenerateLocalNote.mockRejectedValueOnce(new Error('Failed'));

      const { generateTherapyNote } = await import('../bedrock');
      
      const state: TherapyState = {
        discipline: 'ST',
        documentType: 'Progress',
        goals: ['Improve swallowing safety', 'Increase oral intake'],
        reportingPeriod: 'Past 2 weeks',
        progressStatement: 'Patient making steady progress',
        isLocalMode: true,
      };

      const result = await generateTherapyNote(state);

      expect(result.text).toContain('PROGRESS');
      expect(result.text).toContain('GOAL');
      expect(result.text).toContain('SKILLED NECESSITY');
      expect(result.text).toContain('PLAN');
      expect(result.text).toContain('Past 2 weeks');
    });

    it('should use fallback for Recertification with justification', async () => {
      mockGenerateLocalNote.mockRejectedValueOnce(new Error('Failed'));

      const { generateTherapyNote } = await import('../bedrock');
      
      const state: TherapyState = {
        discipline: 'PT',
        documentType: 'Recertification',
        goals: ['Achieve modified independence'],
        planOfCare: {
          frequency: '5x/week',
          duration: '4 weeks',
        },
        isLocalMode: true,
      };

      const result = await generateTherapyNote(state);

      expect(result.text).toContain('RECERTIFICATION');
      expect(result.text).toContain('MEDICAL NECESSITY');
      expect(result.text).toContain('REMAINING DEFICITS');
      expect(result.text).toContain('UPDATED GOALS');
      expect(result.text).toContain('5x/week');
      expect(result.text).toContain('4 weeks');
      expect(result.text).toContain('Achieve modified independence');
    });

    it('should use fallback for Discharge with recommendations', async () => {
      mockGenerateLocalNote.mockRejectedValueOnce(new Error('Failed'));

      const { generateTherapyNote } = await import('../bedrock');
      
      const state: TherapyState = {
        discipline: 'OT',
        documentType: 'Discharge',
        dischargeReason: 'Goals met',
        remainingDeficits: 'Mild limitations in fine motor skills',
        isLocalMode: true,
      };

      const result = await generateTherapyNote(state);

      expect(result.text).toContain('DISCHARGE');
      expect(result.text).toContain('REASON FOR DISCHARGE');
      expect(result.text).toContain('Goals met');
      expect(result.text).toContain('REMAINING DEFICITS');
      expect(result.text).toContain('Mild limitations in fine motor skills');
      expect(result.text).toContain('HOME EXERCISE PROGRAM');
      expect(result.text).toContain('FOLLOW-UP');
    });

    it('should include provided details in fallback Daily note', async () => {
      mockGenerateLocalNote.mockRejectedValueOnce(new Error('Failed'));

      const { generateTherapyNote } = await import('../bedrock');
      
      const state: TherapyState = {
        discipline: 'PT',
        documentType: 'Daily',
        cptCode: '97530',
        activity: 'ADL Training',
        details: {
          assistLevel: 'standby assistance',
          duration: '45 minutes',
          response: 'good progress',
          tolerance: 'excellent endurance',
        },
        isLocalMode: true,
      };

      const result = await generateTherapyNote(state);

      expect(result.text).toContain('standby assistance');
      expect(result.text).toContain('45 minutes');
      expect(result.text).toContain('good progress');
      expect(result.text).toContain('excellent endurance');
    });

    it('should handle minimal state information gracefully', async () => {
      mockGenerateLocalNote.mockRejectedValueOnce(new Error('Failed'));

      const { generateTherapyNote } = await import('../bedrock');
      
      const state: TherapyState = {
        discipline: 'ST',
        documentType: 'Daily',
        isLocalMode: true,
      };

      const result = await generateTherapyNote(state);

      // Should still generate a valid note with defaults
      expect(result.text).toBeTruthy();
      expect(result.text.length).toBeGreaterThan(50);
      expect(result.text).toContain('skilled');
      expect(result.text).toContain('ST');
    });
  });

  describe('Local Mode Integration', () => {
    it('should return TinyLlama output when successful', async () => {
      mockGenerateLocalNote.mockResolvedValueOnce(
        'INTERVENTION: Detailed intervention paragraph. RESPONSE: Detailed response paragraph.'
      );

      const { generateTherapyNote } = await import('../bedrock');
      
      const state: TherapyState = {
        discipline: 'PT',
        documentType: 'Daily',
        isLocalMode: true,
      };

      const result = await generateTherapyNote(state);

      expect(result.text).toBe(
        'INTERVENTION: Detailed intervention paragraph. RESPONSE: Detailed response paragraph.'
      );
      expect(result.appliedPolicies).toEqual([]);
    });

    it('should apply user style preference in prompt', async () => {
      const { generateTherapyNote } = await import('../bedrock');
      
      const state: TherapyState = {
        discipline: 'PT',
        documentType: 'Daily',
        isLocalMode: true,
      };

      const userStyle = 'Concise and clinical';

      await generateTherapyNote(state, userStyle);

      const promptCall = mockGenerateLocalNote.mock.calls[0][0];
      expect(promptCall).toContain('Concise and clinical');
    });

    it('should not call TinyLlama when not in local mode', async () => {
      const { generateTherapyNote } = await import('../bedrock');
      
      const state: TherapyState = {
        discipline: 'PT',
        documentType: 'Daily',
        isLocalMode: false,
      };

      // This will fail because AWS is not configured, but that's expected
      try {
        await generateTherapyNote(state);
      } catch {
        // Expected to fail
      }

      // Should not have called local mode
      expect(mockGenerateLocalNote).not.toHaveBeenCalled();
    });
  });
});
