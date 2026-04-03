import { GoogleGenAI, Type } from "@google/genai";
import { TherapyState, Document, PolicyContext } from "../types";
import { generateLocalNote } from "./localLLM";
import { getBrainDumpPrompt, getGenerateNotePrompt, getAnalyzeGapsPrompt, getSummarizeProgressPrompt, getTumbleNotePrompt, getAuditNotePrompt } from "./prompts";
import { scrubPII } from "../lib/security";
import { policyIntegrationService } from "./policyIntegrationService";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

/**
 * Enhanced error handler for AI services to provide context and support graceful degradation.
 */
function handleAIError(error: any, context: string): never {
  console.error(`AI Service Error [${context}]:`, error);
  
  let message = "An AI service error occurred.";
  const errorStr = error?.message?.toLowerCase() || "";
  
  if (errorStr.includes("quota")) {
    message = "AI Quota exceeded. Please try again later or switch to Local Mode.";
  } else if (errorStr.includes("safety")) {
    message = "The content was flagged by safety filters. Please rephrase your input.";
  } else if (errorStr.includes("auth") || errorStr.includes("key") || errorStr.includes("unauthorized")) {
    message = "Authentication error with Gemini API. Please ensure your API key is correctly configured in the settings.";
  } else if (!process.env.GEMINI_API_KEY) {
    message = "Gemini API key is missing. Please check your environment configuration.";
  } else {
    message = `AI Error: ${error?.message || "Unknown error"}`;
  }
  
  const err = new Error(message);
  (err as any).originalError = error;
  (err as any).context = context;
  throw err;
}

export async function parseBrainDump(text: string, currentState: TherapyState): Promise<Partial<TherapyState>> {
  if (currentState.isLocalMode) {
    return {};
  }

  const modeInstructions = {
    'Daily': "Focus on extracting specific interventions (e.g., gait training, therapeutic exercise), objective measurements (e.g., distance, reps, assist level), and patient response/tolerance.",
    'Assessment': "Focus on extracting reason for referral, prior level of function (PLOF), medical history, specific functional deficits, standardized test results, and initial clinical impressions.",
    'Progress': "Focus on comparing current status to baseline, identifying specific goal progress (e.g., 'Met goal 1', 'Improving in gait'), and identifying barriers to progress.",
    'Recertification': "Focus on justifying the need for continued skilled services, identifying remaining deficits, and updating the plan of care (frequency/duration).",
    'Discharge': "Focus on the reason for discharge, final functional status vs. baseline, remaining deficits, and follow-up recommendations (HEP, equipment)."
  };

  const { scrubbed } = scrubPII(text);
  const prompt = getBrainDumpPrompt(
    scrubbed, 
    currentState, 
    modeInstructions[currentState.documentType as keyof typeof modeInstructions] || ""
  );
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ parts: [{ text: prompt }] }],
      config: { responseMimeType: "application/json" }
    });
    
    return JSON.parse(response.text || "{}");
  } catch (e) {
    if (currentState.isLocalMode) return {};
    // If it's a syntax error in JSON, we just return empty
    if (e instanceof SyntaxError) {
      console.warn("Failed to parse brain dump JSON", e);
      return {};
    }
    // For other AI errors (quota, etc), use the handler
    return handleAIError(e, "parseBrainDump");
  }
}

export async function generateTherapyNote(state: TherapyState, userStyle?: string, customPolicies?: Document[]) {
  if (state.isLocalMode) {
    try {
      const prompt = `Generate a ${state.discipline} ${state.documentType} note. 
      CPT: ${state.cptCode}. 
      Activity: ${state.activity}. 
      Details: ${JSON.stringify(state.details)}.
      User Style: ${userStyle || 'Clinical and concise'}.
      Provide two paragraphs: Intervention and Response.`;
      
      return { text: await generateLocalNote(prompt), appliedPolicies: [] };
    } catch (e) {
      console.warn("Local LLM failed, falling back to simplified local logic", e);
      return { text: `[LOCAL MODE - FALLBACK] ${state.discipline} ${state.documentType} Note\n\nIntervention: Patient performed ${state.activity}. CPT Code: ${state.cptCode}.\n\nResponse: Patient demonstrated progress in functional mobility. Safety was maintained throughout the session.`, appliedPolicies: [] };
    }
  }

  const model = "gemini-3-flash-preview";
  const { scrubbed } = scrubPII(JSON.stringify(state));
  
  // Build policy context if policies provided
  let policyContext: PolicyContext | null = null;
  let appliedPolicies: string[] = [];
  
  if (customPolicies && customPolicies.length > 0) {
    try {
      
      policyContext = await policyIntegrationService.buildPolicyContext(
        state.discipline,
        state.documentType,
        '',
        customPolicies
      );
      appliedPolicies = policyContext.policies.map(p => p.id);
    } catch (e) {
      console.warn("Failed to build policy context, continuing without policies", e);
    }
  }
  
  const prompt = getGenerateNotePrompt({ ...state, details: JSON.parse(scrubbed) }, userStyle, policyContext);

  try {
    const response = await ai.models.generateContent({
      model,
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        // Only use search if not in local mode and we have a key
        tools: process.env.GEMINI_API_KEY ? [{ googleSearch: {} }] : []
      }
    });

    return {
      text: response.text,
      groundingMetadata: response.candidates?.[0]?.groundingMetadata,
      appliedPolicies
    };
  } catch (e) {
    const isQuota = e?.message?.includes("quota");
    const isSafety = e?.message?.includes("safety");
    
    if (isQuota || isSafety) {
       console.warn(`AI error (${isQuota ? 'Quota' : 'Safety'}), attempting fallback to local...`, e);
       try {
         const localText = await generateLocalNote(prompt);
         return { text: `[AI ERROR - FALLBACK] ${localText}`, appliedPolicies };
       } catch (localE) {
         console.error("Local fallback failed", localE);
         throw new Error(`AI Error (${isQuota ? 'Quota' : 'Safety'}): ${e.message}. Fallback to local also failed.`);
       }
    }
    
    return handleAIError(e, "generateTherapyNote");
  }
}

export async function analyzeGaps(state: TherapyState, isLocalMode?: boolean, customPolicies?: Document[]) {
  if (isLocalMode) {
    return {
      data: [
        {
          id: "local_1",
          question: "Local mode cannot perform complex gap analysis. Please manually provide any missing functional deficits, prior level of function, or specific evaluation findings.",
          suggestedAnswers: ["Acknowledged"]
        }
      ],
      appliedPolicies: []
    };
  }

  const model = "gemini-3-flash-preview";
  
  // Build policy context if policies provided
  let policyContext: PolicyContext | null = null;
  let appliedPolicies: string[] = [];
  
  if (customPolicies && customPolicies.length > 0) {
    try {
      
      policyContext = await policyIntegrationService.buildPolicyContext(
        state.discipline,
        state.documentType,
        '',
        customPolicies
      );
      appliedPolicies = policyContext.policies.map(p => p.id);
    } catch (e) {
      console.warn("Failed to build policy context, continuing without policies", e);
    }
  }
  
  const prompt = getAnalyzeGapsPrompt(state, policyContext);

  try {
    const response = await ai.models.generateContent({
      model,
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        tools: process.env.GEMINI_API_KEY ? [{ googleSearch: {} }] : [],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              question: { type: Type.STRING },
              suggestedAnswers: { 
                type: Type.ARRAY, 
                items: { type: Type.STRING }
              }
            },
            required: ["id", "question", "suggestedAnswers"]
          }
        }
      }
    });

    return {
      data: JSON.parse(response.text),
      groundingMetadata: response.candidates?.[0]?.groundingMetadata,
      appliedPolicies
    };
  } catch (e) {
    if (e instanceof SyntaxError) {
      console.error("Failed to parse gap analysis JSON", e);
      return { data: [], appliedPolicies };
    }
    return handleAIError(e, "analyzeGaps");
  }
}

export async function summarizeProgress(state: TherapyState, isLocalMode?: boolean) {
  if (isLocalMode) {
    return "Local mode cannot summarize notes. Please manually write the progress summary.";
  }

  const model = "gemini-3-flash-preview";
  const prompt = getSummarizeProgressPrompt(state);

  try {
    const response = await ai.models.generateContent({
      model,
      contents: [{ parts: [{ text: prompt }] }],
    });

    return response.text;
  } catch (e) {
    return handleAIError(e, "summarizeProgress");
  }
}

export async function tumbleNote(currentNote: string, instructions: string, isLocalMode?: boolean) {
  if (isLocalMode) {
    try {
      const prompt = `Refine or "tumble" the following medical note based on these instructions: "${instructions}". 
      Original Note: ${currentNote}`;
      return await generateLocalNote(prompt);
    } catch (e) {
      console.warn("Local tumble failed", e);
      return currentNote;
    }
  }

  const model = "gemini-3-flash-preview";
  const { scrubbed } = scrubPII(currentNote);
  const prompt = getTumbleNotePrompt(scrubbed, instructions);

  try {
    const response = await ai.models.generateContent({
      model,
      contents: [{ parts: [{ text: prompt }] }],
    });

    return response.text;
  } catch (e) {
    return handleAIError(e, "tumbleNote");
  }
}

export async function auditNoteWithAI(note: string, documentType: string, isLocalMode?: boolean, customPolicies?: Document[]) {
  if (isLocalMode) {
    return {
      data: {
        complianceScore: 85,
        findings: ["[LOCAL MODE] Audit is simplified. Use cloud mode for deep Medicare/CMS analysis."],
        checklist: {
          "Skilled Intervention Demonstrated": true,
          "Medical Necessity Established": true,
          "Impact of No Treatment Stated": false,
          "SMART Goals Included": true,
          "Standardized Measures Used": false,
          "ICD-10 & CPT Alignment": true,
          "Succinct Narrative Form": true,
          "Professional Terminology": true
        }
      },
      appliedPolicies: []
    };
  }

  const model = "gemini-3-flash-preview";
  const { scrubbed } = scrubPII(note);
  
  // Build policy context if policies provided
  let policyContext: PolicyContext | null = null;
  let appliedPolicies: string[] = [];
  
  if (customPolicies && customPolicies.length > 0) {
    try {
      
      policyContext = await policyIntegrationService.buildPolicyContext(
        undefined,
        documentType,
        '',
        customPolicies
      );
      appliedPolicies = policyContext.policies.map(p => p.id);
    } catch (e) {
      console.warn("Failed to build policy context, continuing without policies", e);
    }
  }
  
  const prompt = getAuditNotePrompt(scrubbed, documentType, policyContext);

  try {
    const response = await ai.models.generateContent({
      model,
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        tools: process.env.GEMINI_API_KEY ? [{ googleSearch: {} }] : [],
        responseMimeType: "application/json",
      },
    });

    return {
      data: JSON.parse(response.text || "{}"),
      groundingMetadata: response.candidates?.[0]?.groundingMetadata,
      appliedPolicies
    };
  } catch (e) {
    if (e instanceof SyntaxError) {
      console.error("Failed to parse audit result", e);
      return { 
        data: {
          complianceScore: 0, 
          findings: ["Failed to audit note due to response format error."],
          checklist: {}
        },
        appliedPolicies
      };
    }
    return handleAIError(e, "auditNoteWithAI");
  }
}
