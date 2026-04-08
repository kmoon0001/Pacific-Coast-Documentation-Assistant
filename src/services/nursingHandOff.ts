import { TherapyState } from '../types';

/**
 * Generates a concise SBAR (Situation, Background, Assessment, Recommendation)
 * hand-off summary for nursing staff based on the therapy note.
 *
 * SBAR is the industry-standard framework for interdisciplinary communication.
 */
export function generateNursingHandOff(note: string, state: TherapyState): string {
  // This is a simplified SBAR generation based on the note.
  // In a production app, this would be a dedicated LLM prompt.
  const discipline = state.discipline ?? 'therapy';
  const activity = state.activity ?? 'skilled intervention';
  const trimmedNote = note?.trim() || 'No additional assessment provided.';
  const assessment = trimmedNote.length > 150 ? `${trimmedNote.substring(0, 150)}...` : trimmedNote;

  return `
[NURSING HAND-OFF SUMMARY (SBAR)]

S: Patient ${discipline} session completed.
B: Patient is receiving skilled therapy for ${activity}.
A: ${assessment}
R: Please ensure the patient follows the recommended precautions/strategies discussed in the full note.
`;
}
