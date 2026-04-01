export type Discipline = 'PT' | 'OT' | 'ST';

export interface ValidationResult {
  isValid: boolean;
  message?: string;
}

export interface AuditResult {
  complianceScore: number;
  findings: string[];
  checklist?: Record<string, boolean>;
}

export interface CPTCode {
  code: string;
  description: string;
  modes: Mode[];
}

export interface Mode {
  name: string;
  activities: Activity[];
}

export interface Activity {
  name: string;
  details: DetailOption[];
}

export interface DetailOption {
  label: string;
  type: 'select' | 'number' | 'text' | 'multi-select';
  options?: string[];
  unit?: string;
}

export interface GapQuestion {
  id: string;
  question: string;
  suggestedAnswers: string[];
}

export interface TherapyState {
  discipline?: Discipline;
  cptCode?: string;
  mode?: string;
  activity?: string;
  details: Record<string, any>;
  customNote: string;
  documentType: 'Daily' | 'Progress' | 'Assessment' | 'Discharge' | 'Recertification';
  // New fields
  reportingPeriod?: string;
  previousNotesToSummarize?: string;
  gapQuestions?: GapQuestion[];
  gapAnswersMap?: Record<string, string>;
  reasonForReferral?: string;
  clinicalImpressions?: string;
  skilledInterventionJustification?: string;
  medicalNecessityStatement?: string;
  impactOfNoSkilledServices?: string;
  responseToIntervention?: string;
  progressStatement?: string;
  planOfCare?: {
    frequency: string;
    duration: string;
    longTermGoals: string;
  };
  dischargeReason?: string;
  remainingDeficits?: string;
  sessionDate?: string;
  goals?: string[];
  icd10Codes?: string[];
  // Audit fields
  auditResult?: AuditResult;
  // Gap analysis fields
  gapAnalysis?: string;
  gapAnswers?: string;
  // User Style & Local Mode
  userStyleSamples?: string[];
  isLocalMode?: boolean;
}

export interface GeneratedNote {
  content: string;
  timestamp: string;
  type: string;
}

export interface StepContentProps {
  step: number;
  state: TherapyState;
  setState: (state: any) => void;
  currentData: any;
  currentSteps: string[];
  handleNext: () => void;
  handleBack: () => void;
  handleGenerate: () => void;
  handleTumble: () => void;
  setStep: (step: number) => void;
  generatedNote: string | null;
  setGeneratedNote: (note: string | null) => void;
  editedNote: string;
  setEditedNote: (note: string) => void;
  isGenerating: boolean;
  isTumbling: boolean;
  isAuditing: boolean;
  auditResult: AuditResult | undefined;
  handleAudit: () => void;
  previousNote: any;
  setPreviousNote: (note: any) => void;
  history: GeneratedNote[];
  clipboard: any[];
  setClipboard: (clipboard: any[]) => void;
  brainDump: string;
  setBrainDump: (dump: string) => void;
  brainDumpMode: 'Daily' | 'Assessment' | 'Progress' | 'Recertification' | 'Discharge';
  setBrainDumpMode: (mode: 'Daily' | 'Assessment' | 'Progress' | 'Recertification' | 'Discharge') => void;
  isParsingBrainDump: boolean;
  handleBrainDump: () => void;
  customTemplates: any[];
  setCustomTemplates: (templates: any[]) => void;
  finalizeSession: () => void;
  sanitizeHistory: () => void;
  isLocalMode: boolean;
  modelDownloadProgress: number | null;
  selectedId: string | null;
  delayedNext: (id: string, updateState: () => void) => void;
  handleDeleteTemplate: (name: string) => void;
  handleSaveTemplate: () => void;
  handleQuickGenerate: () => void;
  icdSearch: string;
  setIcdSearch: (search: string) => void;
  icdCat: string;
  setIcdCat: (cat: string) => void;
  handleSummarizeProgress: () => void;
  isSummarizingProgress: boolean;
  handleAnalyzeGaps: () => void;
  isAnalyzingGaps: boolean;
  customGapInputs: Record<string, boolean>;
  setCustomGapInputs: (inputs: Record<string, boolean>) => void;
}
