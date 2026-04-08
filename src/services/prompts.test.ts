import { describe, it, expect } from 'vitest';
import {
  getBrainDumpPrompt,
  getGenerateNotePrompt,
  getAnalyzeGapsPrompt,
  getSummarizeProgressPrompt,
  getTumbleNotePrompt,
  getAuditNotePrompt,
} from './prompts';
import { createMockTherapyState, mockGeneratedNotes } from '../__tests__/fixtures';
import { PolicyContext } from '../types';

describe('prompt builders', () => {
  const policyContext: PolicyContext = {
    policies: [
      {
        id: 'doc-1',
        userId: 'user-1',
        title: 'Falls Prevention',
        description: 'PT must document balance cues',
        category: 'Policy',
        content: 'PT documentation must mention balance.',
        contentHash: 'hash',
        fileType: 'pdf',
        fileSize: 42,
        uploadedAt: new Date(),
        updatedAt: new Date(),
        version: 1,
        tags: ['PT'],
        isActive: true,
        metadata: {},
      },
    ],
    requirements: [
      {
        id: 'req-1',
        documentId: 'doc-1',
        requirement: 'Call out fall risk mitigation',
        priority: 'high',
        applicableTo: ['PT'],
        complianceChecks: ['Balance cues documented'],
        createdAt: new Date(),
      },
    ],
    styleGuides: [],
    complianceRules: ['Respect org templates'],
  };

  it('builds a brain dump parsing prompt scoped to the current discipline', () => {
    const state = createMockTherapyState({ discipline: 'OT', documentType: 'Assessment' });
    const prompt = getBrainDumpPrompt(
      'Patient performed grooming at sink.',
      state,
      'Focus on ADLs.'
    );

    expect(prompt).toContain('expert OT therapist');
    expect(prompt).toContain('Document Type: Assessment');
    expect(prompt).toContain('"Patient performed grooming at sink."');
  });

  it('injects document-type instructions and organizational policies for generation', () => {
    const state = createMockTherapyState({
      documentType: 'Progress',
      discipline: 'PT',
      goals: ['Improve gait distance'],
      icd10Codes: ['R26.81'],
      cptCode: '97110',
    });
    const prompt = getGenerateNotePrompt(state, 'Succinct tone', policyContext);

    expect(prompt).toContain('Specific Instructions for Progress');
    expect(prompt).toContain('CUSTOM ORGANIZATIONAL POLICIES');
    expect(prompt).toContain('Improve gait distance');
  });

  it('describes the most critical gaps when analyzing prompts', () => {
    const state = createMockTherapyState({
      discipline: 'ST',
      documentType: 'Discharge',
      previousNotesToSummarize: mockGeneratedNotes.otAssessment.content,
    });

    const prompt = getAnalyzeGapsPrompt(state, policyContext);
    expect(prompt).toContain('ORGANIZATIONAL POLICIES TO CONSIDER');
    expect(prompt).toContain('Medicare-compliant Discharge report');
  });

  it('summarizes progress with clear defaults when no historical notes exist', () => {
    const state = createMockTherapyState({
      discipline: 'PT',
      documentType: 'Progress',
      reportingPeriod: undefined,
    });
    const prompt = getSummarizeProgressPrompt(state);
    expect(prompt).toContain('the past period');
    expect(prompt).toContain('None provided');
  });

  it('wraps tumble instructions with the actionable note body', () => {
    const prompt = getTumbleNotePrompt('Initial PT note body', 'Keep discharge READY tone.');
    expect(prompt).toContain('Keep discharge READY tone');
    expect(prompt).toContain('Initial PT note body');
  });

  it('builds a compliance audit prompt that references policy requirements', () => {
    const prompt = getAuditNotePrompt('PT discharge summary text', 'Daily', policyContext);
    expect(prompt).toContain('CUSTOM ORGANIZATIONAL POLICIES');
    expect(prompt).toContain('POLICY COMPLIANCE REQUIREMENTS');
    expect(prompt).toContain('PT discharge summary text');
  });
});
