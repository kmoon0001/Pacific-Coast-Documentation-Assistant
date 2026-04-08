import { pipeline, env } from '@xenova/transformers';
import { generateWithGemini } from './gemini';

// Configure transformers.js to use local cache and avoid some issues in certain environments
env.allowLocalModels = false;
env.useBrowserCache = true;

let generator: any = null;
let progressCallback: ((progress: number) => void) | null = null;

export function setProgressCallback(cb: (progress: number) => void) {
  progressCallback = cb;
}

export async function initLocalLLM() {
  if (generator) return generator;

  const modelId = 'Xenova/TinyLlama-1.1B-Chat-v1.0';

  try {
    generator = await pipeline('text-generation', modelId, {
      progress_callback: (data: any) => {
        if (data.status === 'progress' && progressCallback) {
          progressCallback(data.progress);
        }
        if (data.status === 'done' && progressCallback) {
          progressCallback(100);
        }
      },
    });
    return generator;
  } catch (error) {
    console.error('Failed to initialize local LLM:', error);
    throw error;
  }
}

export async function generateLocalNote(prompt: string): Promise<string> {
  // Try Gemini first if API key is available
  const geminiKey = import.meta.env.GEMINI_API_KEY;
  if (geminiKey) {
    try {
      console.log('Using Gemini API for note generation');
      return await generateWithGemini(prompt);
    } catch (error) {
      console.warn('Gemini API failed, falling back to TinyLlama:', error);
    }
  }

  // Fallback to TinyLlama
  console.log('Using TinyLlama for note generation');
  const gen = await initLocalLLM();

  const messages = [
    {
      role: 'system',
      content:
        'You are an expert Skilled Nursing Facility (SNF) therapist and clinical documentation specialist. Generate professional, Medicare-compliant therapy notes that demonstrate skilled intervention, medical necessity, and functional outcomes. Follow Medicare Benefits Policy Manual guidelines and CMS documentation standards. Use standard medical abbreviations (Pt, SBA, Min A, Mod A, c/o, s/p). All notes must demonstrate: 1) Skilled intervention with clear rationale, 2) Medical necessity based on patient complexity, 3) Impact of no skilled intervention, 4) Functional outcomes and patient response. CRITICAL: All interventions, activities, and measurements must be discipline-specific and appropriate for the specified therapy discipline (PT, OT, or ST). PT focuses on gait, mobility, balance, transfers. OT focuses on ADLs, upper extremity function, fine motor skills. ST focuses on swallowing, communication, cognitive-linguistic function.',
    },
    { role: 'user', content: prompt },
  ];

  // Format for TinyLlama Chat
  const formattedPrompt = `<|system|>\n${messages[0].content}</s>\n<|user|>\n${messages[1].content}</s>\n<|assistant|>\n`;

  const output = await gen(formattedPrompt, {
    max_new_tokens: 800,
    temperature: 0.7,
    do_sample: true,
    top_k: 50,
    top_p: 0.9,
  });

  return output[0].generated_text.split('<|assistant|>\n')[1] || output[0].generated_text;
}
