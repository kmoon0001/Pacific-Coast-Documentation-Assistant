import { z } from 'zod';

/**
 * Validation schemas for TheraDoc using Zod
 * Provides runtime type checking and validation for all data structures
 */

export const DisciplineSchema = z.enum(['PT', 'OT', 'ST']);
export const DocumentTypeSchema = z.enum([
  'Daily',
  'Progress',
  'Assessment',
  'Discharge',
  'Recertification',
]);

export const DetailOptionSchema = z.object({
  label: z.string(),
  type: z.enum(['select', 'number', 'text', 'multi-select']),
  options: z.array(z.string()).optional(),
  unit: z.string().optional(),
});

export const ActivitySchema = z.object({
  name: z.string(),
  details: z.array(DetailOptionSchema),
});

export const ModeSchema = z.object({
  name: z.string(),
  activities: z.array(ActivitySchema),
});

export const CPTCodeSchema = z.object({
  code: z.string(),
  description: z.string(),
  modes: z.array(ModeSchema),
});

export const GapQuestionSchema = z.object({
  id: z.string(),
  question: z.string(),
  suggestedAnswers: z.array(z.string()),
});

export const PlanOfCareSchema = z.object({
  frequency: z.string().optional(),
  duration: z.string().optional(),
  longTermGoals: z.string().optional(),
});

export const AuditResultSchema = z.object({
  complianceScore: z.number().min(0).max(100),
  findings: z.array(z.string()),
  checklist: z.record(z.boolean()).optional(),
});

export const TherapyStateSchema = z.object({
  discipline: DisciplineSchema.optional(),
  cptCode: z.string().optional(),
  mode: z.string().optional(),
  activity: z.string().optional(),
  details: z.record(z.any()).default({}),
  customNote: z.string().default(''),
  documentType: DocumentTypeSchema,
  reportingPeriod: z.string().optional(),
  previousNotesToSummarize: z.string().optional(),
  gapQuestions: z.array(GapQuestionSchema).optional(),
  gapAnswersMap: z.record(z.string()).optional(),
  reasonForReferral: z.string().optional(),
  clinicalImpressions: z.string().optional(),
  skilledInterventionJustification: z.string().optional(),
  medicalNecessityStatement: z.string().optional(),
  impactOfNoSkilledServices: z.string().optional(),
  responseToIntervention: z.string().optional(),
  progressStatement: z.string().optional(),
  planOfCare: PlanOfCareSchema.optional(),
  dischargeReason: z.string().optional(),
  remainingDeficits: z.string().optional(),
  sessionDate: z.string().optional(),
  goals: z.array(z.string()).optional(),
  icd10Codes: z.array(z.string()).optional(),
  auditResult: AuditResultSchema.optional(),
  gapAnalysis: z.string().optional(),
  gapAnswers: z.string().optional(),
  userStyleSamples: z.array(z.string()).optional(),
  isLocalMode: z.boolean().optional(),
});

export const GeneratedNoteSchema = z.object({
  content: z.string(),
  timestamp: z.string(),
  type: z.string(),
});

export const ClipboardItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  content: z.string(),
  date: z.string(),
});

/**
 * Validation helper functions
 */
export function validateTherapyState(data: unknown) {
  return TherapyStateSchema.safeParse(data);
}

export function validateGeneratedNote(data: unknown) {
  return GeneratedNoteSchema.safeParse(data);
}

export function validateClipboardItem(data: unknown) {
  return ClipboardItemSchema.safeParse(data);
}

/**
 * Type exports for use in components
 */
export type Discipline = z.infer<typeof DisciplineSchema>;
export type DocumentType = z.infer<typeof DocumentTypeSchema>;
export type TherapyState = z.infer<typeof TherapyStateSchema>;
export type GeneratedNote = z.infer<typeof GeneratedNoteSchema>;
export type ClipboardItem = z.infer<typeof ClipboardItemSchema>;
export type AuditResult = z.infer<typeof AuditResultSchema>;
