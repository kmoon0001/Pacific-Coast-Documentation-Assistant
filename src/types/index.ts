export type Discipline = 'PT' | 'OT' | 'ST';

// Knowledge Base Types
export type DocumentCategory = 'Policy' | 'Procedure' | 'Guidance' | 'Regulation';
export type DocumentFileType = 'pdf' | 'docx' | 'txt' | 'md';
export type DocumentPriority = 'high' | 'medium' | 'low';

export interface Document {
  id: string;
  userId: string;
  organizationId?: string;
  title: string;
  description: string;
  category: DocumentCategory;
  content: string;
  contentHash: string;
  fileType: DocumentFileType;
  fileSize: number;
  uploadedAt: Date;
  updatedAt: Date;
  effectiveDate?: Date;
  expiryDate?: Date;
  version: number;
  tags: string[];
  isActive: boolean;
  metadata: Record<string, any>;
  encryptionKeyId?: string;
}

export interface DocumentSearchResult {
  documents: Document[];
  total: number;
  page: number;
  pageSize: number;
}

export interface DocumentFilters {
  category?: DocumentCategory;
  tags?: string[];
  isActive?: boolean;
  dateRange?: {
    start: Date;
    end: Date;
  };
  search?: string;
  page?: number;
  pageSize?: number;
  sortBy?: 'name' | 'date' | 'relevance' | 'usage';
  sortOrder?: 'asc' | 'desc';
}

export interface PolicyRequirement {
  id: string;
  documentId: string;
  requirement: string;
  priority: DocumentPriority;
  applicableTo: string[];
  complianceChecks: string[];
  createdAt: Date;
}

export interface DocumentMetadata {
  title: string;
  description: string;
  category: DocumentCategory;
  effectiveDate?: Date;
  expiryDate?: Date;
  tags?: string[];
}

export interface DocumentStructure {
  title: string;
  sections: Section[];
  keyPoints: string[];
  summary: string;
}

export interface Section {
  heading: string;
  content: string;
  subsections: Section[];
  keyPoints: string[];
}

export interface PolicyContext {
  policies: Document[];
  requirements: PolicyRequirement[];
  styleGuides: Document[];
  complianceRules: string[];
}

export interface PromptEnhancement {
  originalPrompt: string;
  enhancedPrompt: string;
  injectedPolicies: string[];
  injectedRequirements: string[];
}

export interface ComplianceValidation {
  complianceScore: number;
  violations: string[];
  appliedPolicies: string[];
  recommendations: string[];
}

export interface UsageStats {
  documentId: string;
  totalUsages: number;
  lastUsed?: Date;
  usageByDiscipline: Record<string, number>;
  usageByDocumentType: Record<string, number>;
  recentNotes: string[];
}

export interface DocumentUsageEntry {
  id: string;
  documentId: string;
  noteId: string;
  userId: string;
  usedAt: Date;
  context: Record<string, any>;
}

export interface DocumentAuditEntry {
  id: string;
  documentId: string;
  userId: string;
  action: 'upload' | 'update' | 'delete' | 'view' | 'search';
  details: Record<string, any>;
  createdAt: Date;
}

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

// Document Versioning Types
export interface DocumentVersion {
  id: string;
  documentId: string;
  versionNumber: number;
  content: string;
  metadata: Record<string, any>;
  title: string;
  description: string;
  createdAt: Date;
  createdBy: string;
  changeDescription: string;
  contentHash: string;
}

export interface VersionDiff {
  documentId: string;
  fromVersion: number;
  toVersion: number;
  titleChanged: boolean;
  titleOld: string;
  titleNew: string;
  descriptionChanged: boolean;
  descriptionOld: string;
  descriptionNew: string;
  contentChanged: boolean;
  contentLengthOld: number;
  contentLengthNew: number;
  metadataChanged: boolean;
  metadataOld: Record<string, any>;
  metadataNew: Record<string, any>;
  createdAt: Date;
}

export interface VersionStats {
  totalVersions: number;
  latestVersion: number;
  oldestVersion: DocumentVersion | null;
  newestVersion: DocumentVersion | null;
  averageChangeSize: number;
}

// Document Relationship Types
export interface DocumentRelationship {
  id: string;
  sourceDocumentId: string;
  targetDocumentId: string;
  type: 'supersedes' | 'related_to' | 'depends_on';
  description?: string;
  createdAt: Date;
  createdBy: string;
  isActive: boolean;
}

export interface RelationshipConflict {
  type: 'circular_dependency' | 'conflicting_supersedes' | 'multiple_supersedes';
  severity: 'high' | 'medium' | 'low';
  description: string;
  affectedDocuments: string[];
}

export interface RelationshipGraph {
  nodes: Array<{ id: string; type: string }>;
  edges: Array<{ source: string; target: string; type: string }>;
}

export interface RelationshipStats {
  totalRelationships: number;
  outgoing: number;
  incoming: number;
  byType: Record<string, number>;
  conflicts: number;
}

// Semantic Search & Embeddings Types
export interface DocumentEmbedding {
  id: string;
  documentId: string;
  embedding: number[];
  contentHash: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SemanticSearchResult {
  documentId: string;
  document: Document;
  similarityScore: number;
  matchType: 'semantic' | 'keyword' | 'hybrid';
}

export interface HybridSearchResults {
  results: SemanticSearchResult[];
  keywordMatches: number;
  semanticMatches: number;
  totalResults: number;
  searchTime: number;
}

export interface EmbeddingStats {
  totalDocuments: number;
  documentsWithEmbeddings: number;
  embeddingCoverage: number;
  lastGeneratedAt?: Date;
  averageEmbeddingTime: number;
}

// Caching Types
export interface CacheEntry<T> {
  key: string;
  value: T;
  createdAt: Date;
  expiresAt: Date;
  hits: number;
}

export interface CacheStats {
  totalEntries: number;
  hits: number;
  misses: number;
  hitRate: number;
  averageEntrySize: number;
  totalSize: number;
}

// Performance Monitoring Types
export interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: Date;
}

export interface PerformanceStats {
  p50: number;
  p95: number;
  p99: number;
  min: number;
  max: number;
  average: number;
  count: number;
}

export interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: Date;
  metrics: Record<string, PerformanceStats>;
  issues: string[];
}
