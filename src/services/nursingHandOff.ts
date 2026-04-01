import { TherapyState } from "../types";

/**
 * Generates a concise SBAR (Situation, Background, Assessment, Recommendation) 
 * hand-off summary for nursing staff based on the therapy note.
 * 
 * SBAR is the industry-standard framework for interdisciplinary communication.
 */
export function generateNursingHandOff(note: string, state: TherapyState): string {
  // This is a simplified SBAR generation based on the note.
  // In a production app, this would be a dedicated LLM prompt.
  
  return `
[NURSING HAND-OFF SUMMARY (SBAR)]

S: Patient ${state.discipline} session completed.
B: Patient is receiving skilled therapy for ${state.activity}.
A: ${note.substring(0, 150)}...
R: Please ensure the patient follows the recommended precautions/strategies discussed in the full note.
`;
}
