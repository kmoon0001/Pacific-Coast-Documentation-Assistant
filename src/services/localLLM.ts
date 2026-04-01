import { pipeline, env } from '@xenova/transformers';

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
      }
    });
    return generator;
  } catch (error) {
    console.error("Failed to initialize local LLM:", error);
    throw error;
  }
}

export async function generateLocalNote(prompt: string): Promise<string> {
  const gen = await initLocalLLM();
  
  const messages = [
    { role: 'system', content: 'You are a professional Speech-Language Pathologist, Physical Therapist, and Occupational Therapist assistant. Generate concise, compliant medical notes based on the provided clinical data.' },
    { role: 'user', content: prompt }
  ];

  // Format for TinyLlama Chat
  const formattedPrompt = `<|system|>\n${messages[0].content}</s>\n<|user|>\n${messages[1].content}</s>\n<|assistant|>\n`;

  const output = await gen(formattedPrompt, {
    max_new_tokens: 512,
    temperature: 0.7,
    do_sample: true,
    top_k: 50,
  });

  return output[0].generated_text.split('<|assistant|>\n')[1] || output[0].generated_text;
}
