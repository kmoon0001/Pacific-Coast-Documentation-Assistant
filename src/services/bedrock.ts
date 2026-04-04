/**
 * AI Service - AWS Bedrock Edition
 * 
 * This module provides AI-powered clinical documentation using AWS Bedrock.
 * Supports Claude (Anthropic), Llama (Meta), Mistral, and Titan models.
 * 
 * Features:
 * - SHAP-inspired fact-checking
 * - Medicare compliance validation
 * - Multi-model support
 * - Local fallback mode
 */

import { TherapyState, Document, PolicyContext } from '../types';
import { generateLocalNote } from './localLLM';
import { getBrainDumpPrompt, getGenerateNotePrompt, getAnalyzeGapsPrompt, getSummarizeProgressPrompt, getTumbleNotePrompt, getAuditNotePrompt } from './prompts';
import { scrubPII } from '../lib/security';
import { policyIntegrationService } from './policyIntegrationService';
import { factCheckNote, validateInputState, enhanceAuditWithSHAP } from './shapFactCheck';

// AWS Configuration from environment
const AWS_CONFIG = {
  region: process.env.AWS_REGION || 'us-east-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  modelId: process.env.AWS_MODEL_ID || 'anthropic.claude-3-sonnet-20240229-v1:0',
};

/**
 * Check if AWS Bedrock is properly configured
 */
function isAWSConfigured(): boolean {
  return !!(AWS_CONFIG.accessKeyId && AWS_CONFIG.secretAccessKey);
}

/**
 * Public function to check if AI is configured
 */
export function isAIConfigured(): boolean {
  return isAWSConfigured();
}

/**
 * Get available AWS Bedrock models
 */
export function getAvailableModels(): { id: string; name: string; provider: string }[] {
  return [
    { id: 'anthropic.claude-3-sonnet-20240229-v1:0', name: 'Claude 3 Sonnet', provider: 'Anthropic' },
    { id: 'anthropic.claude-3-haiku-20240307-v1:0', name: 'Claude 3 Haiku', provider: 'Anthropic' },
    { id: 'meta.llama3-70b-instruct-v1:0', name: 'Llama 3 70B', provider: 'Meta' },
    { id: 'meta.llama3-8b-instruct-v1:0', name: 'Llama 3 8B', provider: 'Meta' },
    { id: 'mistral.mistral-large-2407-v1:0', name: 'Mistral Large', provider: 'Mistral' },
    { id: 'amazon.titan-text-express-v1', name: 'Titan Text Express', provider: 'Amazon' },
  ];
}

/**
 * Get current AI configuration status
 */
export function getAIStatus() {
  return {
    configured: isAIConfigured(),
    provider: 'AWS Bedrock',
    model: AWS_CONFIG.modelId,
    region: AWS_CONFIG.region,
    availableModels: getAvailableModels()
  };
}

/**
 * Make AWS Bedrock API call using native browser fetch
 */
async function callBedrock(modelId: string, prompt: string, options: {
  temperature?: number;
  maxTokens?: number;
  system?: string;
} = {}): Promise<string> {
  const endpoint = `https://bedrock-runtime.${AWS_CONFIG.region}.amazonaws.com/model/${modelId}/invoke`;
  
  // Prepare request body based on model provider
  let body: any;
  const isClaude = modelId.includes('anthropic');
  
  if (isClaude) {
    body = {
      anthropic_version: 'bedrock-2023-05-31',
      max_tokens: options.maxTokens || 4096,
      temperature: options.temperature || 0.7,
      system: options.system || '',
      messages: [{ role: 'user', content: prompt }]
    };
  } else if (modelId.includes('meta')) {
    body = {
      prompt: `<|begin_of_text|>${prompt}<|end_of_text|>`,
      temperature: options.temperature || 0.7,
      max_gen_length: options.maxTokens || 2048,
    };
  } else if (modelId.includes('mistral')) {
    body = {
      prompt: prompt,
      temperature: options.temperature || 0.7,
      max_tokens: options.maxTokens || 2048,
    };
  } else {
    // Titan
    body = {
      inputText: prompt,
      textGenerationConfig: {
        temperature: options.temperature || 0.7,
        maxTokenCount: options.maxTokens || 2048,
        stopSequences: [],
      }
    };
  }

  const auth = btoa(`${AWS_CONFIG.accessKeyId}:${AWS_CONFIG.secretAccessKey}`);
  
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${auth}`
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`AWS Bedrock error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  
  // Parse response based on model
  if (isClaude) {
    return data.content?.[0]?.text || data.completion || '';
  } else if (modelId.includes('meta')) {
    return data.outputs?.[0]?.text || data.generation || '';
  } else if (modelId.includes('mistral')) {
    return data.outputs?.[0]?.text || data.generation || '';
  } else {
    // Titan
    return data.results?.[0]?.outputText || data.generation || '';
  }
}

/**
 * Enhanced error handler for AI services
 */
function handleAIError(error: any, context: string): never {
  console.error(`AI Service Error [${context}]:`, error);
  
  let message = "An AI service error occurred.";
  const errorStr = error?.message?.toLowerCase() || "";
  
  if (errorStr.includes("accessdenied") || errorStr.includes("unauthorized")) {
    message = "AWS authentication failed. Please check your AWS credentials in settings.";
  } else if (errorStr.includes("throttling")) {
    message = "AWS rate limit exceeded. Please try again later.";
  } else if (errorStr.includes("validation")) {
    message = "AWS request validation failed. Check model ID and parameters.";
  } else if (!isAWSConfigured()) {
    message = "AWS is not configured. Please add AWS credentials to use AI features.";
  } else {
    message = `AI Error: ${error?.message || "Unknown error"}`;
  }
  
  const err = new Error(message);
  (err as any).originalError = error;
  (err as any).context = context;
  throw err;
}

export async function parseBrainDump(text: string, currentState: TherapyState): Promise<Partial<TherapyState>> {
  if (currentState.isLocalMode || !isAWSConfigured()) {
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
    const response = await callBedrock(AWS_CONFIG.modelId, prompt, {
      system: "You are a medical documentation assistant. Extract structured clinical information from notes. Return valid JSON only.",
      maxTokens: 2048
    });
    
    return JSON.parse(response || "{}");
  } catch (e) {
    if (currentState.isLocalMode) return {};
    if (e instanceof SyntaxError) {
      console.warn("Failed to parse brain dump JSON", e);
      return {};
    }
    return handleAIError(e, "parseBrainDump");
  }
}

export async function generateTherapyNote(state: TherapyState, userStyle?: string, customPolicies?: Document[]) {
  if (state.isLocalMode || !isAWSConfigured()) {
    try {
      const prompt = `Generate a ${state.discipline} ${state.documentType} note. 
      CPT: ${state.cptCode}. 
      Activity: ${state.activity}. 
      Details: ${JSON.stringify(state.details)}.
      User Style: ${userStyle || 'Clinical and concise'}.
      Provide two paragraphs: Intervention and Response.`;
      
      return { text: await generateLocalNote(prompt), appliedPolicies: [] };
    } catch (e) {
      return { text: `[LOCAL MODE - FALLBACK] ${state.discipline} ${state.documentType} Note\n\nIntervention: Patient performed ${state.activity}. CPT Code: ${state.cptCode}.\n\nResponse: Patient demonstrated progress in functional mobility.`, appliedPolicies: [] };
    }
  }

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
    const response = await callBedrock(AWS_CONFIG.modelId, prompt, {
      system: "You are a clinical documentation specialist. Generate accurate, Medicare-compliant therapy notes based on the provided information.",
      maxTokens: 4096
    });

    // Perform SHAP-inspired fact-check
    const factCheckResult = factCheckNote(state, response);
    
    return {
      text: response,
      appliedPolicies,
      factCheck: factCheckResult,
      modelProvider: 'AWS Bedrock',
      modelId: AWS_CONFIG.modelId
    };
  } catch (e) {
    // Fallback to local on error
    console.warn("AWS error, attempting fallback to local...", e);
    try {
      const localText = await generateLocalNote(prompt);
      return { text: `[AWS ERROR - FALLBACK] ${localText}`, appliedPolicies };
    } catch (localE) {
      console.error("Local fallback failed", localE);
      throw new Error(`AWS Error: ${(e as Error).message}. Fallback to local also failed.`);
    }
  }
}

export async function analyzeGaps(state: TherapyState, isLocalMode?: boolean, customPolicies?: Document[]) {
  if (isLocalMode || !isAWSConfigured()) {
    return {
      data: [
        {
          id: "local_1",
          question: "Local mode or AWS not configured. Please provide any missing functional deficits, prior level of function, or specific evaluation findings.",
          suggestedAnswers: ["Acknowledged"]
        }
      ],
      appliedPolicies: []
    };
  }

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
      console.warn("Failed to build policy context", e);
    }
  }
  
  const prompt = getAnalyzeGapsPrompt(state, policyContext);

  try {
    const response = await callBedrock(AWS_CONFIG.modelId, prompt, {
      system: "You are a Medicare compliance specialist. Analyze therapy documentation for gaps. Return valid JSON array with id, question, and suggestedAnswers fields.",
      maxTokens: 2048
    });

    // Validate input state
    const validation = validateInputState(state);
    
    return {
      data: JSON.parse(response || "[]"),
      appliedPolicies,
      inputValidation: validation,
      modelProvider: 'AWS Bedrock'
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
  if (isLocalMode || !isAWSConfigured()) {
    return "Local mode or AWS not configured. Please manually write the progress summary.";
  }

  const prompt = getSummarizeProgressPrompt(state);

  try {
    const response = await callBedrock(AWS_CONFIG.modelId, prompt, {
      system: "You are a clinical documentation specialist. Summarize therapy progress concisely.",
      maxTokens: 1024
    });

    return response;
  } catch (e) {
    return handleAIError(e, "summarizeProgress");
  }
}

export async function tumbleNote(currentNote: string, instructions: string, isLocalMode?: boolean) {
  if (isLocalMode || !isAWSConfigured()) {
    try {
      const prompt = `Refine or "tumble" the following medical note based on these instructions: "${instructions}". 
      Original Note: ${currentNote}`;
      return await generateLocalNote(prompt);
    } catch (e) {
      console.warn("Local tumble failed", e);
      return currentNote;
    }
  }

  const { scrubbed } = scrubPII(currentNote);
  const prompt = getTumbleNotePrompt(scrubbed, instructions);

  try {
    const response = await callBedrock(AWS_CONFIG.modelId, prompt, {
      system: "You are a medical documentation editor. Refine notes according to instructions while maintaining clinical accuracy.",
      maxTokens: 2048
    });

    return response;
  } catch (e) {
    return handleAIError(e, "tumbleNote");
  }
}

export async function auditNoteWithAI(note: string, documentType: string, isLocalMode?: boolean, customPolicies?: Document[]) {
  if (isLocalMode || !isAWSConfigured()) {
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
      console.warn("Failed to build policy context", e);
    }
  }
  
  const prompt = getAuditNotePrompt(scrubbed, documentType, policyContext);

  try {
    const response = await callBedrock(AWS_CONFIG.modelId, prompt, {
      system: "You are a Medicare compliance auditor. Analyze therapy notes for compliance. Return valid JSON with complianceScore (0-100), findings array, and checklist object.",
      maxTokens: 2048
    });

    const auditData = JSON.parse(response || "{}");
    const enhancedAudit = enhanceAuditWithSHAP(auditData, { documentType } as TherapyState);
    
    return {
      data: enhancedAudit,
      appliedPolicies,
      modelProvider: 'AWS Bedrock'
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