import { TherapyState } from '../types';

const GEMINI_API_KEY = import.meta.env.GEMINI_API_KEY || '';
const GEMINI_API_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
  }>;
}

export async function generateWithGemini(prompt: string): Promise<string> {
  if (!GEMINI_API_KEY) {
    throw new Error('Gemini API key not configured');
  }

  const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              text: prompt,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2048,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gemini API error: ${response.status} - ${error}`);
  }

  const data: GeminiResponse = await response.json();

  if (!data.candidates || data.candidates.length === 0) {
    throw new Error('No response from Gemini');
  }

  return data.candidates[0].content.parts[0].text;
}

export async function generateTherapyNoteWithGemini(
  state: TherapyState,
  userStyle?: string
): Promise<string> {
  const prompt = `You are a professional ${state.discipline === 'PT' ? 'Physical Therapist' : state.discipline === 'OT' ? 'Occupational Therapist' : 'Speech-Language Pathologist'}.

Generate a Medicare-compliant ${state.documentType} note with the following information:

**Patient Information:**
- Discipline: ${state.discipline}
- Document Type: ${state.documentType}
- CPT Code: ${state.cptCode}
- ICD-10 Codes: ${state.icd10Codes?.join(', ') || 'Not specified'}
- Mode: ${state.mode}
- Activity: ${state.activity}

**Session Details:**
${JSON.stringify(state.details, null, 2)}

**Writing Style:** ${userStyle || 'Professional, concise, and clinically appropriate'}

**Requirements:**
1. Use skilled terminology appropriate for ${state.discipline}
2. Include objective measurements and functional outcomes
3. Demonstrate medical necessity
4. Follow Medicare documentation guidelines
5. Be specific about patient performance and progress
6. Include safety considerations if relevant

Generate a complete clinical note with these sections:
- **Intervention:** Describe what was done during the session
- **Response:** Document patient's performance, progress, and functional outcomes
- **Plan:** Next steps and recommendations

Format the note professionally and ensure it meets compliance standards.`;

  return await generateWithGemini(prompt);
}
