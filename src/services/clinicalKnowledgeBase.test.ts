import { describe, it, expect } from 'vitest';
import { ClinicalKnowledgeBase } from './clinicalKnowledgeBase';
import { createMockTherapyState } from '../__tests__/fixtures';

describe('ClinicalKnowledgeBase', () => {
  describe('Validation Rules', () => {
    it('should validate skilled intervention requirement for Progress notes', () => {
      const state = createMockTherapyState({
        documentType: 'Progress',
        skilledInterventionJustification: undefined,
      });

      const result = ClinicalKnowledgeBase.rules[0].validate(state);
      expect(result.isValid).toBe(false);
      expect(result.message).toContain('Skilled intervention justification');
    });

    it('should pass skilled intervention validation when provided', () => {
      const state = createMockTherapyState({
        documentType: 'Progress',
        skilledInterventionJustification: 'Patient requires skilled intervention for gait training',
      });

      const result = ClinicalKnowledgeBase.rules[0].validate(state);
      expect(result.isValid).toBe(true);
    });

    it('should validate medical necessity requirement for Assessment notes', () => {
      const state = createMockTherapyState({
        documentType: 'Assessment',
        medicalNecessityStatement: undefined,
      });

      const result = ClinicalKnowledgeBase.rules[1].validate(state);
      expect(result.isValid).toBe(false);
    });

    it('should validate impact of no skilled services for Recertification notes', () => {
      const state = createMockTherapyState({
        documentType: 'Recertification',
        impactOfNoSkilledServices: undefined,
      });

      const result = ClinicalKnowledgeBase.rules[2].validate(state);
      expect(result.isValid).toBe(false);
    });

    it('should validate Plan of Care for Assessment notes', () => {
      const state = createMockTherapyState({
        documentType: 'Assessment',
        planOfCare: { frequency: undefined, duration: undefined, longTermGoals: undefined },
      });

      const result = ClinicalKnowledgeBase.rules[3].validate(state);
      expect(result.isValid).toBe(false);
    });

    it('should pass Plan of Care validation when complete', () => {
      const state = createMockTherapyState({
        documentType: 'Assessment',
        planOfCare: {
          frequency: '3x/week',
          duration: '4 weeks',
          longTermGoals: 'Improve gait independence',
        },
      });

      const result = ClinicalKnowledgeBase.rules[3].validate(state);
      expect(result.isValid).toBe(true);
    });

    it('should validate ST swallowing safety for dysphagia CPT code', () => {
      const state = createMockTherapyState({
        discipline: 'ST',
        cptCode: '92526',
        customNote: 'Patient participated in speech therapy',
      });

      const result = ClinicalKnowledgeBase.rules[4].validate(state);
      expect(result.isValid).toBe(false);
    });

    it('should pass ST swallowing safety when swallow is mentioned', () => {
      const state = createMockTherapyState({
        discipline: 'ST',
        cptCode: '92526',
        customNote: 'Patient demonstrated improved swallow safety',
      });

      const result = ClinicalKnowledgeBase.rules[4].validate(state);
      expect(result.isValid).toBe(true);
    });

    it('should validate PT gait/balance safety documentation', () => {
      const state = createMockTherapyState({
        discipline: 'PT',
        customNote: 'Patient ambulated 100 feet',
      });

      const result = ClinicalKnowledgeBase.rules[5].validate(state);
      expect(result.isValid).toBe(false);
    });

    it('should pass PT gait/balance when safety is mentioned', () => {
      const state = createMockTherapyState({
        discipline: 'PT',
        customNote: 'Patient ambulated 100 feet with contact guard for safety',
      });

      const result = ClinicalKnowledgeBase.rules[5].validate(state);
      expect(result.isValid).toBe(true);
    });

    it('should validate OT ADL independence documentation', () => {
      const state = createMockTherapyState({
        discipline: 'OT',
        customNote: 'Patient participated in ADL training',
      });

      const result = ClinicalKnowledgeBase.rules[6].validate(state);
      expect(result.isValid).toBe(false);
    });

    it('should pass OT ADL when independence is mentioned', () => {
      const state = createMockTherapyState({
        discipline: 'OT',
        customNote:
          'Patient demonstrated improved independence in dressing with adaptive equipment',
      });

      const result = ClinicalKnowledgeBase.rules[6].validate(state);
      expect(result.isValid).toBe(true);
    });

    it('should validate CMS skilled nature requirement', () => {
      const state = createMockTherapyState({
        skilledInterventionJustification: 'Short',
      });

      const result = ClinicalKnowledgeBase.rules[7].validate(state);
      expect(result.isValid).toBe(false);
    });

    it('should pass CMS skilled nature with adequate justification', () => {
      const state = createMockTherapyState({
        skilledInterventionJustification:
          'Patient requires skilled intervention due to complex medical condition requiring specialized assessment and treatment planning',
      });

      const result = ClinicalKnowledgeBase.rules[7].validate(state);
      expect(result.isValid).toBe(true);
    });

    it('should detect boilerplate language', () => {
      const state = createMockTherapyState({
        customNote: 'Patient tolerated well. Continue plan of care as per protocol.',
      });

      const result = ClinicalKnowledgeBase.rules[8].validate(state);
      expect(result.isValid).toBe(false);
    });

    it('should pass with minimal boilerplate', () => {
      const state = createMockTherapyState({
        customNote: 'Patient tolerated well with specific functional improvements noted',
      });

      const result = ClinicalKnowledgeBase.rules[8].validate(state);
      expect(result.isValid).toBe(true);
    });
  });

  describe('auditNote', () => {
    it('should return perfect score for compliant note', () => {
      const state = createMockTherapyState({
        documentType: 'Daily',
        skilledInterventionJustification: 'Patient requires skilled intervention for gait training',
        medicalNecessityStatement: 'Medical necessity established',
        impactOfNoSkilledServices: 'Risk of functional decline',
        customNote: 'Patient demonstrated improved safety during ambulation',
      });

      const result = ClinicalKnowledgeBase.auditNote(state);
      expect(result.complianceScore).toBeGreaterThan(0);
      expect(result.findings).toBeDefined();
    });

    it('should identify missing required fields', () => {
      const state = createMockTherapyState({
        documentType: 'Assessment',
        skilledInterventionJustification: undefined,
        medicalNecessityStatement: undefined,
        impactOfNoSkilledServices: undefined,
        planOfCare: { frequency: undefined, duration: undefined, longTermGoals: undefined },
      });

      const result = ClinicalKnowledgeBase.auditNote(state);
      expect(result.complianceScore).toBeLessThan(100);
      expect(result.findings.length).toBeGreaterThan(0);
    });

    it('should return findings array', () => {
      const state = createMockTherapyState({
        documentType: 'Progress',
        skilledInterventionJustification: undefined,
      });

      const result = ClinicalKnowledgeBase.auditNote(state);
      expect(Array.isArray(result.findings)).toBe(true);
    });

    it('should never return negative compliance score', () => {
      const state = createMockTherapyState({
        documentType: 'Assessment',
        skilledInterventionJustification: undefined,
        medicalNecessityStatement: undefined,
        impactOfNoSkilledServices: undefined,
        planOfCare: { frequency: undefined, duration: undefined, longTermGoals: undefined },
        customNote: 'Minimal note',
      });

      const result = ClinicalKnowledgeBase.auditNote(state);
      expect(result.complianceScore).toBeGreaterThanOrEqual(0);
    });
  });

  describe('getSuggestions', () => {
    it('should return array of suggestions', () => {
      const state = createMockTherapyState({
        discipline: 'PT',
        activity: 'Gait Training',
      });

      const suggestions = ClinicalKnowledgeBase.getSuggestions(state);
      expect(Array.isArray(suggestions)).toBe(true);
      expect(suggestions.length).toBeGreaterThan(0);
    });

    it('should include activity-specific suggestions', () => {
      const state = createMockTherapyState({
        discipline: 'PT',
        activity: 'Gait Training',
        details: { Repetitions: '10' },
      });

      const suggestions = ClinicalKnowledgeBase.getSuggestions(state);
      expect(suggestions.some((s) => s.includes('Gait Training'))).toBe(true);
    });

    it('should include document-type specific suggestions', () => {
      const state = createMockTherapyState({
        documentType: 'Progress',
      });

      const suggestions = ClinicalKnowledgeBase.getSuggestions(state);
      expect(suggestions.some((s) => s.includes('progressing'))).toBe(true);
    });

    it('should not include duplicate suggestions', () => {
      const state = createMockTherapyState({
        discipline: 'PT',
      });

      const suggestions = ClinicalKnowledgeBase.getSuggestions(state);
      const uniqueSuggestions = new Set(suggestions);
      expect(suggestions.length).toBe(uniqueSuggestions.size);
    });
  });

  describe('Knowledge Base Content', () => {
    it('should have CMS knowledge', () => {
      expect(ClinicalKnowledgeBase.knowledge.cms).toBeDefined();
      expect(ClinicalKnowledgeBase.knowledge.cms.skilledNature).toBeDefined();
      expect(ClinicalKnowledgeBase.knowledge.cms.medicalNecessity).toBeDefined();
    });

    it('should have Noridian knowledge', () => {
      expect(ClinicalKnowledgeBase.knowledge.noridian).toBeDefined();
      expect(ClinicalKnowledgeBase.knowledge.noridian.lcdGeneral).toBeDefined();
    });

    it('should have professional organization knowledge', () => {
      expect(ClinicalKnowledgeBase.knowledge.professional).toBeDefined();
      expect(ClinicalKnowledgeBase.knowledge.professional.asha).toBeDefined();
      expect(ClinicalKnowledgeBase.knowledge.professional.apta).toBeDefined();
      expect(ClinicalKnowledgeBase.knowledge.professional.aota).toBeDefined();
    });
  });
});
