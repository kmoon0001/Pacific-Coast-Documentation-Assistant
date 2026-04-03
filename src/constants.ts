import { Discipline } from './types';

export const STEPS = ['Discipline', 'Document Type', 'CPT Code', 'ICD-10 Codes', 'Mode', 'Activity', 'Details', 'Generate'];

export const DISCIPLINE_ICD_CATEGORIES: Record<Discipline, string[]> = {
  'PT': ['Neurological', 'Orthopedic', 'Functional', 'Medical'],
  'OT': ['Neurological', 'Orthopedic', 'Functional', 'Cognitive', 'Medical'],
  'ST': ['Neurological', 'Cognitive', 'Swallowing', 'Speech', 'Medical']
};

export const DOCUMENT_TYPES = ['Daily', 'Progress', 'Assessment', 'Discharge', 'Recertification'] as const;

export const DEFAULT_STATE = {
  details: {},
  customNote: '',
  documentType: 'Daily' as const,
  sessionDate: new Date().toISOString().split('T')[0],
  isLocalMode: false as const,
};
