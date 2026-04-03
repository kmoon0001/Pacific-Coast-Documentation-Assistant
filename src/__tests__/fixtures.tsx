import { TherapyState, GeneratedNote, AuditResult } from '../types';
import { DEFAULT_STATE } from '../constants';

/**
 * Test fixtures and factories for consistent test data
 */

export const createMockTherapyState = (overrides?: Partial<TherapyState>): TherapyState => ({
  discipline: 'PT',
  documentType: 'Daily',
  details: {},
  customNote: '',
  isLocalMode: false,
  ...overrides,
});

export const createMockGeneratedNote = (overrides?: Partial<GeneratedNote>): GeneratedNote => ({
  content: 'Mock therapy note content',
  timestamp: new Date().toLocaleString(),
  type: 'PT Daily',
  ...overrides,
});

export const createMockAuditResult = (overrides?: Partial<AuditResult>): AuditResult => ({
  complianceScore: 85,
  findings: ['Consider adding more specific measurements'],
  checklist: {
    'Skilled Intervention Demonstrated': true,
    'Medical Necessity Established': true,
    'Impact of No Treatment Stated': false,
    'SMART Goals Included': true,
    'Standardized Outcome Measures Used': false,
    'ICD-10 & CPT Alignment': true,
    'Succinct Narrative Form': true,
    'Professional Terminology': true,
  },
  ...overrides,
});

export const createMockClipboardItem = (overrides?: any) => ({
  id: '1',
  title: 'Test Note',
  content: 'Test content',
  date: new Date().toISOString(),
  ...overrides,
});

export const mockTherapyStates = {
  ptDaily: createMockTherapyState({
    discipline: 'PT',
    documentType: 'Daily',
    cptCode: '97110',
    mode: 'Lower Extremity Strengthening',
    activity: 'Active Range of Motion',
    sessionDate: new Date().toISOString().split('T')[0],
    goals: ['Improve gait distance', 'Reduce fall risk'],
  }),
  otAssessment: createMockTherapyState({
    discipline: 'OT',
    documentType: 'Assessment',
    cptCode: '97161',
    reasonForReferral: 'Post-stroke evaluation',
    clinicalImpressions: 'Patient presents with left-sided weakness',
  }),
  stProgress: createMockTherapyState({
    discipline: 'ST',
    documentType: 'Progress',
    cptCode: '92507',
    progressStatement: 'Patient showing improvement in swallowing function',
  }),
};

export const mockGeneratedNotes = {
  ptDaily: createMockGeneratedNote({
    type: 'PT Daily',
    content: `Patient participated in skilled physical therapy for gait training and therapeutic exercise. 
    Patient ambulated 150 feet with contact guard assistance and verbal cuing for safety. 
    Patient demonstrated improved weight shifting and step length compared to previous session. 
    Patient tolerated activity well without complaints of pain or shortness of breath. 
    Plan: Continue current frequency and intensity. Patient to continue home exercise program.`,
  }),
  otAssessment: createMockGeneratedNote({
    type: 'OT Assessment',
    content: `Patient presents with left-sided weakness secondary to recent stroke. 
    Functional assessment reveals limitations in ADL performance, particularly dressing and grooming. 
    Patient demonstrates fair plus upper extremity strength on left side. 
    Occupational therapy is indicated to address functional deficits and improve independence in ADLs. 
    Plan: Initiate skilled occupational therapy 3x/week for 4 weeks.`,
  }),
};

export const mockAuditResults = {
  compliant: createMockAuditResult({
    complianceScore: 95,
    findings: [],
    checklist: {
      'Skilled Intervention Demonstrated': true,
      'Medical Necessity Established': true,
      'Impact of No Treatment Stated': true,
      'SMART Goals Included': true,
      'Standardized Outcome Measures Used': true,
      'ICD-10 & CPT Alignment': true,
      'Succinct Narrative Form': true,
      'Professional Terminology': true,
    },
  }),
  nonCompliant: createMockAuditResult({
    complianceScore: 45,
    findings: [
      'Missing skilled intervention justification',
      'Insufficient medical necessity statement',
      'No outcome measures documented',
      'Vague functional descriptions',
    ],
    checklist: {
      'Skilled Intervention Demonstrated': false,
      'Medical Necessity Established': false,
      'Impact of No Treatment Stated': false,
      'SMART Goals Included': false,
      'Standardized Outcome Measures Used': false,
      'ICD-10 & CPT Alignment': true,
      'Succinct Narrative Form': false,
      'Professional Terminology': true,
    },
  }),
};


// Additional test data for Phase 2
export const mockBackendResponses = {
  userRegistration: {
    success: true,
    user: { id: 'user_123', email: 'test@example.com' },
    token: 'jwt_token_123',
  },
  userLogin: {
    success: true,
    user: { id: 'user_123', email: 'test@example.com' },
    token: 'jwt_token_123',
  },
  noteCreation: {
    success: true,
    note: {
      id: 'note_123',
      userId: 'user_123',
      content: 'Encrypted note content',
      type: 'PT Daily',
      discipline: 'PT',
      documentType: 'Daily',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  },
  auditReport: {
    success: true,
    report: {
      generatedAt: new Date().toISOString(),
      totalNotes: 10,
      totalModifications: 5,
      complianceScore: 92,
      eventsByAction: {
        note_generated: 10,
        note_modified: 5,
        audit_run: 8,
      },
    },
  },
};

export const mockAuditEvents = {
  noteGenerated: {
    id: 'audit_1',
    timestamp: new Date(),
    userId: 'user_123',
    action: 'note_generated' as const,
    resourceType: 'note' as const,
    resourceId: 'note_123',
    details: {
      discipline: 'PT',
      documentType: 'Daily',
      cptCode: '97110',
    },
    status: 'success' as const,
  },
  noteModified: {
    id: 'audit_2',
    timestamp: new Date(),
    userId: 'user_123',
    action: 'note_modified' as const,
    resourceType: 'note' as const,
    resourceId: 'note_123',
    details: {
      changes: { content: 'Updated content' },
      reason: 'Compliance fix',
    },
    status: 'success' as const,
  },
  userLogin: {
    id: 'audit_3',
    timestamp: new Date(),
    userId: 'user_123',
    action: 'user_login' as const,
    resourceType: 'user' as const,
    resourceId: 'user_123',
    details: { action: 'login' },
    ipAddress: '192.168.1.1',
    status: 'success' as const,
  },
};

export const mockAccessibilityIssues = [
  {
    id: 'color-contrast',
    description: 'Insufficient color contrast',
    element: 'button.primary',
    wcagLevel: 'AA',
    fix: 'Increase contrast ratio to 4.5:1',
  },
  {
    id: 'missing-alt-text',
    description: 'Missing alt text on image',
    element: 'img.logo',
    wcagLevel: 'A',
    fix: 'Add descriptive alt text',
  },
  {
    id: 'missing-label',
    description: 'Form input missing label',
    element: 'input#email',
    wcagLevel: 'A',
    fix: 'Add associated label element',
  },
];

export const mockKeyboardShortcuts = [
  { key: 'Ctrl+S', action: 'Save note', description: 'Save the current note' },
  { key: 'Ctrl+G', action: 'Generate', description: 'Generate note from current state' },
  { key: 'Ctrl+A', action: 'Audit', description: 'Run compliance audit' },
  { key: 'Escape', action: 'Close modal', description: 'Close any open modal' },
  { key: 'Tab', action: 'Navigate', description: 'Navigate between form fields' },
];

export const mockAriaLabels = {
  generateButton: 'Generate therapy note',
  auditButton: 'Run compliance audit',
  copyButton: 'Copy note to clipboard',
  downloadButton: 'Download note as PDF',
  settingsButton: 'Open settings',
  closeButton: 'Close dialog',
  deleteButton: 'Delete item',
  editButton: 'Edit item',
};

// Test wrapper for components that use TherapySessionContext
import React from 'react';
import { render as rtlRender, RenderOptions } from '@testing-library/react';
import { TherapySessionProvider } from '../contexts/TherapySessionContext';

interface RenderTherapySessionOptions extends Omit<RenderOptions, 'wrapper'> {
  initialState?: Partial<TherapyState>;
}

export const renderWithTherapySession = (
  component: React.ReactElement,
  options: RenderTherapySessionOptions = {}
) => {
  const { initialState, ...renderOptions } = options;
  const baseState: TherapyState = {
    ...DEFAULT_STATE,
    ...mockTherapyStates.ptDaily,
    ...initialState,
  };
  sessionStorage.setItem('therapy_draft', JSON.stringify(baseState));

  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <TherapySessionProvider initialState={baseState}>
      {children}
    </TherapySessionProvider>
  );
  
  return rtlRender(component, { wrapper: Wrapper, ...renderOptions });
};
