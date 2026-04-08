/**
 * Tests for discipline-specific note generation
 * Ensures notes are always accurate to PT, OT, or ST disciplines
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateTherapyNote } from '../bedrock';
import { TherapyState } from '../../types';

// Mock the AWS configuration check
vi.mock('../bedrock', async () => {
  const actual = await vi.importActual('../bedrock');
  return {
    ...actual,
    isAIConfigured: () => false, // Force local mode for testing
  };
});

describe('Discipline-Specific Note Generation', () => {
  describe('Physical Therapy (PT) Notes', () => {
    it('should generate PT-specific daily note with gait training terminology', async () => {
      const state: TherapyState = {
        discipline: 'PT',
        documentType: 'Daily',
        cptCode: '97110',
        activity: 'Gait Training',
        details: {
          assistLevel: 'SBA',
          duration: '30 minutes',
          distance: '150 feet',
        },
        customNote: '',
        isLocalMode: true,
      };

      const result = await generateTherapyNote(state);

      expect(result.text).toContain('PT');
      expect(result.text).toContain('gait');
      expect(result.text).toContain('ambulation');
      expect(result.text).toContain('SBA');
      expect(result.text).toContain('150 feet');
      // Should NOT contain OT or ST terminology
      expect(result.text).not.toContain('ADL training');
      expect(result.text).not.toContain('swallowing');
      expect(result.text).not.toContain('dysphagia');
    });

    it('should generate PT-specific assessment with mobility focus', async () => {
      const state: TherapyState = {
        discipline: 'PT',
        documentType: 'Assessment',
        reasonForReferral: 'Decreased mobility s/p hip fracture',
        details: {
          assistLevel: 'Mod A',
          priorFunction: 'Independent ambulation',
        },
        goals: ['Pt will ambulate 100 feet with SBA', 'Pt will improve balance'],
        customNote: '',
        isLocalMode: true,
      };

      const result = await generateTherapyNote(state);

      expect(result.text).toContain('PT');
      expect(result.text).toContain('mobility');
      expect(result.text).toContain('ambulation');
      expect(result.text).toContain('balance');
      expect(result.text).toContain('gait');
      // Should NOT contain OT or ST terminology
      expect(result.text).not.toContain('fine motor');
      expect(result.text).not.toContain('communication');
    });

    it('should include PT-specific interventions in progress notes', async () => {
      const state: TherapyState = {
        discipline: 'PT',
        documentType: 'Progress',
        activity: 'Therapeutic Exercise',
        details: {
          assistLevel: 'Min A',
        },
        progressStatement: 'Improved lower extremity strength',
        customNote: '',
        isLocalMode: true,
      };

      const result = await generateTherapyNote(state);

      expect(result.text).toContain('PT');
      expect(result.text.toLowerCase()).toContain('therapeutic exercise');
      expect(result.text).toContain('strength');
      expect(result.text).toContain('lower extremity');
      // Should NOT contain OT or ST terminology
      expect(result.text).not.toContain('upper extremity');
      expect(result.text).not.toContain('swallow');
    });
  });

  describe('Occupational Therapy (OT) Notes', () => {
    it('should generate OT-specific daily note with ADL terminology', async () => {
      const state: TherapyState = {
        discipline: 'OT',
        documentType: 'Daily',
        cptCode: '97535',
        activity: 'ADL Training',
        details: {
          assistLevel: 'Min A',
          duration: '30 minutes',
        },
        customNote: '',
        isLocalMode: true,
      };

      const result = await generateTherapyNote(state);

      expect(result.text).toContain('OT');
      expect(result.text).toContain('ADL');
      expect(result.text).toContain('upper extremity');
      expect(result.text).toContain('Min A');
      // Should NOT contain PT or ST terminology
      expect(result.text).not.toContain('gait training');
      expect(result.text).not.toContain('ambulation');
      expect(result.text).not.toContain('swallowing');
      expect(result.text).not.toContain('dysphagia');
    });

    it('should generate OT-specific assessment with ADL focus', async () => {
      const state: TherapyState = {
        discipline: 'OT',
        documentType: 'Assessment',
        reasonForReferral: 'Decreased independence in ADLs s/p CVA',
        details: {
          assistLevel: 'Mod A',
          priorFunction: 'Independent in all ADLs',
        },
        goals: ['Pt will dress independently', 'Pt will improve fine motor skills'],
        customNote: '',
        isLocalMode: true,
      };

      const result = await generateTherapyNote(state);

      expect(result.text).toContain('OT');
      expect(result.text).toContain('ADL');
      expect(result.text).toContain('upper extremity');
      expect(result.text).toContain('fine motor');
      // Should NOT contain PT or ST terminology
      expect(result.text).not.toContain('gait');
      expect(result.text).not.toContain('ambulation');
      expect(result.text).not.toContain('communication');
    });

    it('should include OT-specific interventions in discharge notes', async () => {
      const state: TherapyState = {
        discipline: 'OT',
        documentType: 'Discharge',
        dischargeReason: 'Goals met',
        details: {
          finalAssistLevel: 'supervision',
        },
        customNote: '',
        isLocalMode: true,
      };

      const result = await generateTherapyNote(state);

      expect(result.text).toContain('OT');
      expect(result.text).toContain('ADL');
      expect(result.text).toContain('upper extremity');
      expect(result.text).toContain('adaptive equipment');
      // Should NOT contain PT or ST terminology
      expect(result.text).not.toContain('gait training');
      expect(result.text).not.toContain('swallowing therapy');
    });
  });

  describe('Speech Therapy (ST) Notes', () => {
    it('should generate ST-specific daily note with swallowing terminology', async () => {
      const state: TherapyState = {
        discipline: 'ST',
        documentType: 'Daily',
        cptCode: '92526',
        activity: 'Swallowing Therapy',
        details: {
          duration: '30 minutes',
          dietLevel: 'Mechanical soft',
        },
        customNote: '',
        isLocalMode: true,
      };

      const result = await generateTherapyNote(state);

      expect(result.text).toContain('ST');
      expect(result.text).toContain('swallow');
      expect(result.text).toContain('dysphagia');
      expect(result.text).toContain('communication');
      // Should NOT contain PT or OT terminology
      expect(result.text).not.toContain('gait training');
      expect(result.text).not.toContain('ambulation');
      expect(result.text).not.toContain('ADL training');
      expect(result.text).not.toContain('fine motor');
    });

    it('should generate ST-specific assessment with communication focus', async () => {
      const state: TherapyState = {
        discipline: 'ST',
        documentType: 'Assessment',
        reasonForReferral: 'Dysphagia and aphasia s/p CVA',
        details: {
          dietLevel: 'NPO',
          priorFunction: 'Independent communication and oral intake',
        },
        goals: [
          'Pt will improve swallow safety',
          'Pt will increase communication effectiveness',
        ],
        customNote: '',
        isLocalMode: true,
      };

      const result = await generateTherapyNote(state);

      expect(result.text).toContain('ST');
      expect(result.text).toContain('swallow');
      expect(result.text).toContain('communication');
      expect(result.text.toLowerCase()).toContain('dysphagia');
      // Should NOT contain PT or OT terminology
      expect(result.text).not.toContain('gait');
      expect(result.text).not.toContain('balance');
      expect(result.text).not.toContain('ADL training');
    });

    it('should include ST-specific interventions in recertification notes', async () => {
      const state: TherapyState = {
        discipline: 'ST',
        documentType: 'Recertification',
        progressStatement: 'Improved swallow safety with compensatory strategies',
        details: {
          dietLevel: 'Pureed',
        },
        customNote: '',
        isLocalMode: true,
      };

      const result = await generateTherapyNote(state);

      expect(result.text).toContain('ST');
      expect(result.text).toContain('swallow');
      expect(result.text.toLowerCase()).toContain('dysphagia');
      expect(result.text).toContain('communication');
      expect(result.text).toContain('cognitive-linguistic');
      // Should NOT contain PT or OT terminology
      expect(result.text).not.toContain('therapeutic exercise');
      expect(result.text).not.toContain('upper extremity');
    });
  });

  describe('Cross-Discipline Validation', () => {
    it('should never mix PT and OT terminology', async () => {
      const ptState: TherapyState = {
        discipline: 'PT',
        documentType: 'Daily',
        activity: 'Gait Training',
        customNote: '',
        isLocalMode: true,
        details: {},
      };

      const ptResult = await generateTherapyNote(ptState);

      // PT note should not contain OT-specific terms
      expect(ptResult.text).not.toContain('ADL training');
      expect(ptResult.text).not.toContain('fine motor');
      expect(ptResult.text).not.toContain('adaptive equipment training');

      const otState: TherapyState = {
        discipline: 'OT',
        documentType: 'Daily',
        activity: 'ADL Training',
        customNote: '',
        isLocalMode: true,
        details: {},
      };

      const otResult = await generateTherapyNote(otState);

      // OT note should not contain PT-specific terms
      expect(otResult.text).not.toContain('gait training');
      expect(otResult.text).not.toContain('ambulation');
      expect(otResult.text).not.toContain('lower extremity strengthening');
    });

    it('should never mix PT and ST terminology', async () => {
      const ptState: TherapyState = {
        discipline: 'PT',
        documentType: 'Daily',
        activity: 'Balance Activities',
        customNote: '',
        isLocalMode: true,
        details: {},
      };

      const ptResult = await generateTherapyNote(ptState);

      // PT note should not contain ST-specific terms
      expect(ptResult.text).not.toContain('swallowing');
      expect(ptResult.text).not.toContain('dysphagia');
      expect(ptResult.text).not.toContain('speech articulation');

      const stState: TherapyState = {
        discipline: 'ST',
        documentType: 'Daily',
        activity: 'Communication Strategies',
        customNote: '',
        isLocalMode: true,
        details: {},
      };

      const stResult = await generateTherapyNote(stState);

      // ST note should not contain PT-specific terms
      expect(stResult.text).not.toContain('gait');
      expect(stResult.text).not.toContain('balance activities');
      expect(stResult.text).not.toContain('transfer training');
    });

    it('should never mix OT and ST terminology', async () => {
      const otState: TherapyState = {
        discipline: 'OT',
        documentType: 'Daily',
        activity: 'Fine Motor Activities',
        customNote: '',
        isLocalMode: true,
        details: {},
      };

      const otResult = await generateTherapyNote(otState);

      // OT note should not contain ST-specific terms
      expect(otResult.text).not.toContain('swallowing therapy');
      expect(otResult.text).not.toContain('dysphagia management');
      expect(otResult.text).not.toContain('speech');

      const stState: TherapyState = {
        discipline: 'ST',
        documentType: 'Daily',
        activity: 'Swallowing Therapy',
        customNote: '',
        isLocalMode: true,
        details: {},
      };

      const stResult = await generateTherapyNote(stState);

      // ST note should not contain OT-specific terms
      expect(stResult.text).not.toContain('ADL training');
      expect(stResult.text).not.toContain('fine motor');
      expect(stResult.text).not.toContain('upper extremity strengthening');
    });
  });

  describe('Discipline-Specific Measurements', () => {
    it('should use PT-specific measurements', async () => {
      const state: TherapyState = {
        discipline: 'PT',
        documentType: 'Daily',
        activity: 'Gait Training',
        details: {
          distance: '200 feet',
          assistLevel: 'CGA',
        },
        customNote: '',
        isLocalMode: true,
      };

      const result = await generateTherapyNote(state);

      expect(result.text).toContain('feet');
      expect(result.text).toContain('CGA');
      expect(result.text).toMatch(/gait|ambulation|mobility/i);
    });

    it('should use OT-specific measurements', async () => {
      const state: TherapyState = {
        discipline: 'OT',
        documentType: 'Daily',
        activity: 'Upper Extremity Strengthening',
        details: {
          gripStrength: '15 pounds',
          assistLevel: 'Min A',
        },
        customNote: '',
        isLocalMode: true,
      };

      const result = await generateTherapyNote(state);

      expect(result.text).toContain('upper extremity');
      expect(result.text).toContain('Min A');
      expect(result.text).toMatch(/ADL|fine motor|coordination/i);
    });

    it('should use ST-specific measurements', async () => {
      const state: TherapyState = {
        discipline: 'ST',
        documentType: 'Daily',
        activity: 'Swallowing Therapy',
        details: {
          dietLevel: 'Nectar thick liquids',
          duration: '30 minutes',
        },
        customNote: '',
        isLocalMode: true,
      };

      const result = await generateTherapyNote(state);

      expect(result.text).toMatch(/swallow|dysphagia|diet/i);
      expect(result.text).toMatch(/communication|cognitive/i);
    });
  });

  describe('All Document Types Discipline Accuracy', () => {
    const disciplines: Array<'PT' | 'OT' | 'ST'> = ['PT', 'OT', 'ST'];
    const documentTypes: Array<
      'Daily' | 'Assessment' | 'Progress' | 'Recertification' | 'Discharge'
    > = ['Daily', 'Assessment', 'Progress', 'Recertification', 'Discharge'];

    disciplines.forEach((discipline) => {
      documentTypes.forEach((documentType) => {
        it(`should generate discipline-specific ${discipline} ${documentType} note`, async () => {
          const state: TherapyState = {
            discipline,
            documentType,
            customNote: '',
            isLocalMode: true,
            details: {},
          };

          const result = await generateTherapyNote(state);

          // Should always contain the discipline
          expect(result.text).toContain(discipline);

          // Should contain discipline-appropriate terminology
          if (discipline === 'PT') {
            expect(result.text).toMatch(/gait|mobility|ambulation|balance|transfer/i);
          } else if (discipline === 'OT') {
            expect(result.text).toMatch(/ADL|upper extremity|fine motor|adaptive/i);
          } else if (discipline === 'ST') {
            expect(result.text).toMatch(/swallow|communication|dysphagia|cognitive/i);
          }
        });
      });
    });
  });
});
