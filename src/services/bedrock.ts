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
import {
  getBrainDumpPrompt,
  getGenerateNotePrompt,
  getAnalyzeGapsPrompt,
  getSummarizeProgressPrompt,
  getTumbleNotePrompt,
  getAuditNotePrompt,
} from './prompts';
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
    {
      id: 'anthropic.claude-3-sonnet-20240229-v1:0',
      name: 'Claude 3 Sonnet',
      provider: 'Anthropic',
    },
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
    availableModels: getAvailableModels(),
  };
}

/**
 * Make AWS Bedrock API call using native browser fetch
 */
async function callBedrock(
  modelId: string,
  prompt: string,
  options: {
    temperature?: number;
    maxTokens?: number;
    system?: string;
  } = {}
): Promise<string> {
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
      messages: [{ role: 'user', content: prompt }],
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
      },
    };
  }

  const auth = btoa(`${AWS_CONFIG.accessKeyId}:${AWS_CONFIG.secretAccessKey}`);

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${auth}`,
    },
    body: JSON.stringify(body),
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

  let message = 'An AI service error occurred.';
  const errorStr = error?.message?.toLowerCase() || '';

  if (errorStr.includes('accessdenied') || errorStr.includes('unauthorized')) {
    message = 'AWS authentication failed. Please check your AWS credentials in settings.';
  } else if (errorStr.includes('throttling')) {
    message = 'AWS rate limit exceeded. Please try again later.';
  } else if (errorStr.includes('validation')) {
    message = 'AWS request validation failed. Check model ID and parameters.';
  } else if (!isAWSConfigured()) {
    message = 'AWS is not configured. Please add AWS credentials to use AI features.';
  } else {
    message = `AI Error: ${error?.message || 'Unknown error'}`;
  }

  const err = new Error(message);
  (err as any).originalError = error;
  (err as any).context = context;
  throw err;
}

export async function parseBrainDump(
  text: string,
  currentState: TherapyState
): Promise<Partial<TherapyState>> {
  if (currentState.isLocalMode || !isAWSConfigured()) {
    return {};
  }

  const modeInstructions = {
    Daily:
      'Focus on extracting specific interventions (e.g., gait training, therapeutic exercise), objective measurements (e.g., distance, reps, assist level), and patient response/tolerance.',
    Assessment:
      'Focus on extracting reason for referral, prior level of function (PLOF), medical history, specific functional deficits, standardized test results, and initial clinical impressions.',
    Progress:
      "Focus on comparing current status to baseline, identifying specific goal progress (e.g., 'Met goal 1', 'Improving in gait'), and identifying barriers to progress.",
    Recertification:
      'Focus on justifying the need for continued skilled services, identifying remaining deficits, and updating the plan of care (frequency/duration).',
    Discharge:
      'Focus on the reason for discharge, final functional status vs. baseline, remaining deficits, and follow-up recommendations (HEP, equipment).',
  };

  const { scrubbed } = scrubPII(text);
  const prompt = getBrainDumpPrompt(
    scrubbed,
    currentState,
    modeInstructions[currentState.documentType as keyof typeof modeInstructions] || ''
  );

  try {
    const response = await callBedrock(AWS_CONFIG.modelId, prompt, {
      system:
        'You are a medical documentation assistant. Extract structured clinical information from notes. Return valid JSON only.',
      maxTokens: 2048,
    });

    return JSON.parse(response || '{}');
  } catch (e) {
    if (currentState.isLocalMode) return {};
    if (e instanceof SyntaxError) {
      console.warn('Failed to parse brain dump JSON', e);
      return {};
    }
    return handleAIError(e, 'parseBrainDump');
  }
}

/**
 * Get discipline-specific intervention examples
 */
function getDisciplineSpecificInterventions(discipline?: string, activity?: string): string {
  if (!discipline) return 'therapeutic activities';
  
  const interventions = {
    PT: {
      default: 'gait training, therapeutic exercise, balance activities, and transfer training',
      'Gait Training': 'ambulation training with appropriate assistive device, focusing on proper gait mechanics, weight-bearing status, and safety',
      'Therapeutic Exercise': 'lower extremity strengthening, range of motion exercises, and neuromuscular re-education',
      'Balance Activities': 'static and dynamic balance training, postural control exercises, and fall prevention strategies',
      'Transfer Training': 'sit-to-stand transfers, bed mobility, and wheelchair transfers with appropriate assist level'
    },
    OT: {
      default: 'ADL training, upper extremity strengthening, fine motor activities, and adaptive equipment training',
      'ADL Training': 'dressing, grooming, bathing, and toileting training with adaptive strategies and equipment',
      'Upper Extremity': 'upper extremity strengthening, range of motion, and functional reaching activities',
      'Fine Motor': 'fine motor coordination, manipulation tasks, and hand strengthening exercises',
      'Cognitive': 'cognitive retraining, memory strategies, and problem-solving activities'
    },
    ST: {
      default: 'swallowing therapy, communication strategies, and cognitive-linguistic training',
      'Swallowing': 'dysphagia management including oral motor exercises, compensatory swallowing strategies, and diet texture modifications',
      'Communication': 'speech articulation exercises, language therapy, and communication strategy training',
      'Cognitive-Communication': 'cognitive-linguistic training including memory, attention, and problem-solving tasks',
      'Voice': 'voice therapy including vocal exercises and breath support training'
    }
  };
  
  const disciplineInterventions = interventions[discipline as keyof typeof interventions];
  if (!disciplineInterventions) return 'therapeutic activities';
  
  // Try to match activity to specific intervention
  if (activity) {
    for (const [key, value] of Object.entries(disciplineInterventions)) {
      if (activity.toLowerCase().includes(key.toLowerCase())) {
        return value;
      }
    }
  }
  
  return disciplineInterventions.default;
}

/**
 * Get discipline-specific measurements and outcomes
 */
function getDisciplineSpecificOutcomes(discipline?: string, details?: any): string {
  if (!discipline) return 'functional progress';
  
  const outcomes = {
    PT: `improved gait mechanics, increased ambulation distance, enhanced balance and postural control, and decreased assist level for functional mobility`,
    OT: `increased independence in ADLs, improved upper extremity function and coordination, enhanced fine motor skills, and successful use of adaptive equipment`,
    ST: `improved swallow safety, increased diet tolerance, enhanced communication effectiveness, and improved cognitive-linguistic function`
  };
  
  return outcomes[discipline as keyof typeof outcomes] || 'functional progress';
}

/**
 * Generate enhanced fallback note with Medicare-compliant structure and discipline-specific content
 */
function generateEnhancedFallbackNote(state: TherapyState): string {
  const { discipline, documentType, cptCode, activity, details, goals, sessionDate } = state;
  
  // Get assist level and other details
  const assistLevel = details?.assistLevel || 'supervision';
  const duration = details?.duration || '30 minutes';
  const distance = details?.distance || 'functional distances';
  const reps = details?.reps || 'therapeutic repetitions';
  
  // Get discipline-specific content
  const interventions = getDisciplineSpecificInterventions(discipline, activity);
  const outcomes = getDisciplineSpecificOutcomes(discipline, details);
  
  if (documentType === 'Daily') {
    // Include specific distance if provided
    const distanceText = details?.distance ? ` for ${details.distance}` : '';
    
    return `INTERVENTION: Pt participated in skilled ${discipline} intervention focusing on ${interventions}. Treatment included ${activity || interventions} with ${assistLevel} for ${duration}${distanceText}. Skilled instruction provided for proper technique, safety awareness, and compensatory strategies specific to ${discipline} scope of practice. CPT Code: ${cptCode || '97110'}. Therapeutic techniques applied to address functional deficits and promote independence.

RESPONSE: Pt demonstrated ${details?.response || outcomes} during treatment session. Tolerated intervention well with ${details?.tolerance || 'good endurance'} throughout ${duration} session. ${details?.safety || 'No safety concerns noted'}. Pt required ${assistLevel} to maintain proper form and safety. ${details?.progress || `Pt making steady progress toward ${discipline} functional goals`}. Skilled ${discipline} intervention remains medically necessary to address ongoing functional deficits. Plan: Continue skilled ${discipline} intervention per plan of care.`;
  }
  
  if (documentType === 'Assessment') {
    const disciplineSpecificDeficits = {
      PT: 'balance, strength, endurance, gait mechanics, and functional mobility',
      OT: 'ADL performance, upper extremity function, fine motor coordination, and cognitive function',
      ST: 'swallowing safety, communication effectiveness, cognitive-linguistic function, and diet tolerance'
    };
    
    const disciplineSpecificGoals = {
      PT: `1. Pt will improve functional ambulation with ${assistLevel} or less\n2. Pt will demonstrate improved balance and postural control\n3. Pt will increase independence in functional mobility and transfers`,
      OT: `1. Pt will increase independence in ADLs with ${assistLevel} or less\n2. Pt will improve upper extremity function and coordination\n3. Pt will demonstrate effective use of adaptive equipment and strategies`,
      ST: `1. Pt will improve swallow safety and diet tolerance\n2. Pt will enhance communication effectiveness\n3. Pt will demonstrate improved cognitive-linguistic function`
    };
    
    const deficits = disciplineSpecificDeficits[discipline as keyof typeof disciplineSpecificDeficits] || 'functional deficits';
    const defaultGoals = disciplineSpecificGoals[discipline as keyof typeof disciplineSpecificGoals] || `1. Pt will improve functional status\n2. Pt will demonstrate improved safety\n3. Pt will increase independence`;
    
    // Use specific activity if provided, otherwise use interventions
    const activityText = activity || interventions;
    
    return `REASON FOR REFERRAL: ${state.reasonForReferral || `Pt referred for ${discipline} evaluation to assess ${deficits} and establish plan of care.`}

MEDICAL HISTORY: ${state.details?.medicalHistory || 'Pt presents with functional deficits requiring skilled intervention.'}

PRIOR LEVEL OF FUNCTION: ${state.details?.priorFunction || `Pt previously independent in ${discipline === 'PT' ? 'mobility and functional ambulation' : discipline === 'OT' ? 'ADLs and IADLs' : 'communication and swallowing function'} prior to current condition.`}

CURRENT FUNCTIONAL STATUS: Pt presents with impaired ${activityText} requiring ${assistLevel}. Deficits noted in ${deficits} impacting functional independence.

ASSESSMENT FINDINGS: Objective testing reveals functional limitations requiring skilled ${discipline} intervention. Pt demonstrates potential for improvement with skilled therapeutic intervention specific to ${discipline} scope of practice.

SKILLED NECESSITY: Pt requires the skills of a licensed ${discipline} therapist due to complexity of condition, need for skilled assessment, therapeutic intervention prescription, patient/caregiver education, and safety training. Without skilled ${discipline} intervention, pt at risk for further functional decline and loss of independence.

GOALS (${state.planOfCare?.duration || '4 weeks'}):
${goals && goals.length > 0 ? goals.map((g, i) => `${i + 1}. ${g}`).join('\n') : defaultGoals}

PLAN OF CARE: Skilled ${discipline} intervention ${state.planOfCare?.frequency || '5x/week'} for ${state.planOfCare?.duration || '4 weeks'}. Treatment will focus on ${activityText} and progression toward functional independence.`;
  }
  
  if (documentType === 'Progress') {
    // Use specific activity if provided, otherwise use interventions
    const activityText = activity || interventions;
    
    return `PROGRESS SUMMARY: Pt has participated in skilled ${discipline} intervention ${state.reportingPeriod || 'over the past reporting period'}. Treatment has focused on ${activityText} to address ${discipline}-specific functional deficits.

GOAL PROGRESS:
${goals && goals.length > 0 ? goals.map((g, i) => `Goal ${i + 1}: ${g} - ${state.progressStatement || 'Progressing as expected'}`).join('\n') : `Pt making steady progress toward established ${discipline} functional goals.`}

CURRENT FUNCTIONAL STATUS: Pt currently requires ${assistLevel} for ${activityText}. ${state.progressStatement || `Functional improvements noted in ${outcomes}.`}

BARRIERS TO PROGRESS: ${state.details?.barriers || 'No significant barriers identified. Pt motivated and participating well in therapy.'}

SKILLED NECESSITY: Continued skilled ${discipline} intervention remains medically necessary due to ongoing functional deficits requiring skilled assessment, therapeutic intervention progression, safety training, and patient/caregiver education specific to ${discipline} scope of practice. Without continued skilled services, pt at risk for functional decline and loss of independence.

PLAN: Continue skilled ${discipline} intervention per current plan of care. ${state.planOfCare?.frequency || '5x/week'} for ${state.planOfCare?.duration || 'continued duration'}. Will continue to progress ${discipline}-specific therapeutic activities and monitor for achievement of functional goals.`;
  }
  
  if (documentType === 'Recertification') {
    // Use specific activity if provided, otherwise use interventions
    const activityText = activity || interventions;
    
    // Add discipline-specific terminology to deficits
    const disciplineDeficits = {
      PT: 'strength, balance, endurance, and gait mechanics',
      OT: 'ADL performance, upper extremity function, and fine motor coordination',
      ST: 'swallowing safety (dysphagia), communication effectiveness, and cognitive-linguistic function'
    };
    
    const deficitsText = disciplineDeficits[discipline as keyof typeof disciplineDeficits] || 'functional deficits';
    
    return `RECERTIFICATION SUMMARY: Pt has participated in skilled ${discipline} intervention and continues to demonstrate need for skilled services to address ongoing ${discipline}-specific functional deficits.

PROGRESS TO DATE: ${state.progressStatement || `Pt has made functional progress in ${outcomes} but continues to require skilled intervention to achieve optimal functional outcomes.`}

REMAINING DEFICITS: Pt continues to present with functional limitations in ${activityText} requiring ${assistLevel}. Deficits in ${deficitsText} continue to impact functional independence.

MEDICAL NECESSITY FOR CONTINUED SERVICES: Skilled ${discipline} intervention remains medically necessary due to:
1. Complexity of patient's condition requiring skilled ${discipline} assessment and treatment modification
2. Need for continued therapeutic intervention progression and functional training specific to ${discipline} scope
3. Ongoing safety concerns requiring skilled instruction and supervision
4. Potential for continued functional improvement with skilled ${discipline} intervention

Without continued skilled services, pt at risk for functional plateau, decline, and loss of independence.

UPDATED GOALS (${state.planOfCare?.duration || 'next 4 weeks'}):
${goals && goals.length > 0 ? goals.map((g, i) => `${i + 1}. ${g}`).join('\n') : `1. Pt will achieve modified independence in ${discipline === 'PT' ? 'functional mobility' : discipline === 'OT' ? 'ADLs' : 'communication and swallowing'}\n2. Pt will demonstrate improved safety during all functional tasks\n3. Pt will increase independence to prior level of function`}

UPDATED PLAN OF CARE: Continue skilled ${discipline} intervention ${state.planOfCare?.frequency || '5x/week'} for ${state.planOfCare?.duration || '4 weeks'}. Treatment will focus on continued ${activityText} to achieve optimal functional outcomes.`;
  }
  
  if (documentType === 'Discharge') {
    const disciplineSpecificSummary = {
      PT: 'Skilled PT intervention included therapeutic exercise, gait training, balance activities, transfer training, strengthening exercises, patient/caregiver education, and safety training. Treatment focused on improving strength, endurance, balance, gait mechanics, and functional mobility.',
      OT: 'Skilled OT intervention included ADL training, upper extremity strengthening, fine motor activities, adaptive equipment training, cognitive retraining, patient/caregiver education, and compensatory strategy training. Treatment focused on improving ADL independence, upper extremity function, and cognitive function.',
      ST: 'Skilled ST intervention included swallowing therapy, dysphagia management, communication strategies, speech articulation exercises, cognitive-linguistic training, patient/caregiver education, and compensatory strategy training. Treatment focused on improving swallow safety, communication effectiveness, and cognitive-linguistic function.'
    };
    
    const interventionSummary = disciplineSpecificSummary[discipline as keyof typeof disciplineSpecificSummary] || `Skilled ${discipline} intervention included therapeutic activities and patient education.`;
    
    return `DISCHARGE SUMMARY

REASON FOR DISCHARGE: ${state.dischargeReason || `Pt has achieved ${discipline} functional goals and is appropriate for discharge from skilled therapy services.`}

BASELINE STATUS: ${state.details?.baseline || `Pt initially required ${assistLevel} for ${discipline === 'PT' ? 'functional mobility and ambulation' : discipline === 'OT' ? 'ADLs and functional tasks' : 'communication and swallowing function'}.`}

FINAL STATUS: ${state.progressStatement || `Pt has made significant functional progress and now demonstrates improved independence in ${discipline === 'PT' ? 'mobility and functional ambulation' : discipline === 'OT' ? 'ADLs and functional tasks' : 'communication and swallowing function'}.`} Pt currently requires ${details?.finalAssistLevel || 'minimal assistance or supervision'} for functional tasks.

INTERVENTIONS PROVIDED: ${interventionSummary}

REMAINING DEFICITS: ${state.remainingDeficits || 'Pt continues to present with mild functional limitations but is appropriate for discharge with home program and activity recommendations.'}

HOME ${discipline === 'ST' ? 'PROGRAM' : 'EXERCISE PROGRAM'}: ${state.details?.hep || `Pt provided with written home ${discipline === 'ST' ? 'program' : 'exercise program'} including ${discipline === 'PT' ? 'strengthening, balance, and functional mobility exercises' : discipline === 'OT' ? 'ADL strategies, upper extremity exercises, and adaptive techniques' : 'swallowing strategies, communication exercises, and cognitive activities'}. Pt/caregiver educated on proper technique and safety precautions.`}

EQUIPMENT RECOMMENDATIONS: ${state.details?.equipment || `Current ${discipline === 'PT' ? 'assistive devices and DME' : discipline === 'OT' ? 'adaptive equipment' : 'communication aids and diet modifications'} appropriate for safe functional ${discipline === 'PT' ? 'mobility' : discipline === 'OT' ? 'ADL performance' : 'communication and swallowing'}.`}

FOLLOW-UP RECOMMENDATIONS: ${state.details?.followUp || `Pt to continue home ${discipline === 'ST' ? 'program' : 'exercise program'} as instructed. Follow up with physician as scheduled. May return to ${discipline} therapy if functional decline noted or new deficits develop.`}`;
  }
  
  // Default fallback
  return `${discipline} ${documentType} Note

Pt participated in skilled ${discipline} intervention focusing on ${interventions}. Treatment included skilled assessment, ${interventions}, and patient/caregiver education specific to ${discipline} scope of practice. CPT Code: ${cptCode || '97110'}.

Pt demonstrated ${outcomes} during treatment session. Skilled ${discipline} intervention remains medically necessary to address ongoing functional deficits and promote safe independence.

Plan: Continue skilled ${discipline} intervention per plan of care.`;
}

export async function generateTherapyNote(
  state: TherapyState,
  userStyle?: string,
  customPolicies?: Document[]
) {
  if (state.isLocalMode || !isAWSConfigured()) {
    try {
      // Build detailed Medicare-compliant prompt for local mode with discipline-specific guidance
      const documentTypeInstructions = {
        Daily: 'Generate a two-paragraph narrative note. Paragraph 1 (Intervention): Describe the specific skilled interventions provided, including activity, assist level, equipment used, and any modifications. Paragraph 2 (Response): Document the patient\'s response, tolerance, progress indicators, and any safety concerns or barriers.',
        Assessment: 'Generate a comprehensive initial evaluation including: Reason for Referral, Medical History, Prior Level of Function (PLOF), Current Functional Status, Specific Deficits, Standardized Test Results (if applicable), Clinical Impressions, Skilled Necessity Justification, Goals (SMART format), and Plan of Care.',
        Progress: 'Generate a progress note comparing current status to baseline. Include: Progress toward each goal (quantified), Functional improvements, Barriers to progress, Updated clinical impressions, Skilled necessity justification, and Updated plan of care.',
        Recertification: 'Generate a recertification note justifying continued skilled services. Include: Summary of progress to date, Remaining functional deficits requiring skilled intervention, Medical necessity for continued therapy, Updated goals, and Updated plan of care with frequency/duration.',
        Discharge: 'Generate a discharge summary including: Reason for discharge, Comparison of final status to baseline, Summary of interventions provided, Final functional status, Remaining deficits, Home exercise program, Equipment recommendations, and Follow-up recommendations.'
      };

      const instruction = documentTypeInstructions[state.documentType as keyof typeof documentTypeInstructions] || 'Generate a professional therapy note.';
      
      // Get discipline-specific interventions and outcomes
      const interventions = getDisciplineSpecificInterventions(state.discipline, state.activity);
      const outcomes = getDisciplineSpecificOutcomes(state.discipline, state.details);

      const prompt = `You are generating a ${state.discipline} ${state.documentType} note that must comply with Medicare guidelines and demonstrate skilled intervention.

${instruction}

CRITICAL DISCIPLINE-SPECIFIC REQUIREMENTS FOR ${state.discipline}:
- ALL interventions, activities, and measurements MUST be appropriate for ${state.discipline} therapy
- ${state.discipline === 'PT' ? 'Focus on: gait training, therapeutic exercise, balance activities, transfers, functional mobility, lower extremity strengthening' : state.discipline === 'OT' ? 'Focus on: ADL training, upper extremity function, fine motor skills, adaptive equipment, cognitive retraining, compensatory strategies' : 'Focus on: swallowing therapy, dysphagia management, communication strategies, speech articulation, cognitive-linguistic training, voice therapy'}
- Use ${state.discipline}-specific terminology and measurements
- ${state.discipline === 'PT' ? 'DO NOT use OT terms (ADL training, fine motor) or ST terms (swallowing, communication)' : state.discipline === 'OT' ? 'DO NOT use PT terms (gait training, ambulation) or ST terms (swallowing, dysphagia)' : 'DO NOT use PT terms (gait, transfers) or OT terms (ADL training, fine motor)'}

CRITICAL MEDICARE REQUIREMENTS:
- Demonstrate skilled intervention (why a licensed ${state.discipline} therapist is required)
- Establish medical necessity (patient complexity requires therapist skills)
- Document functional outcomes and patient response
- Use standard medical abbreviations (Pt, SBA, Min A, Mod A, CGA, c/o, s/p, w/, B, L, R)
- Include specific measurements when available (distance, time, reps, assist level)

PATIENT INFORMATION:
- Discipline: ${state.discipline}
- Document Type: ${state.documentType}
- Session Date: ${state.sessionDate || 'Current session'}
- CPT Code: ${state.cptCode || 'Not specified'}
- ICD-10 Codes: ${state.icd10Codes?.join(', ') || 'Not specified'}
- Activity: ${state.activity || interventions}

CLINICAL DETAILS:
${state.details ? Object.entries(state.details).map(([key, value]) => `- ${key}: ${value}`).join('\n') : '- No additional details provided'}

${state.goals && state.goals.length > 0 ? `GOALS:\n${state.goals.map((g, i) => `${i + 1}. ${g}`).join('\n')}` : ''}

${state.clinicalImpressions ? `CLINICAL IMPRESSIONS: ${state.clinicalImpressions}` : ''}

${state.responseToIntervention ? `PATIENT RESPONSE: ${state.responseToIntervention}` : ''}

${state.reasonForReferral ? `REASON FOR REFERRAL: ${state.reasonForReferral}` : ''}

${state.progressStatement ? `PROGRESS: ${state.progressStatement}` : ''}

${state.planOfCare ? `PLAN OF CARE: Frequency: ${state.planOfCare.frequency || 'TBD'}, Duration: ${state.planOfCare.duration || 'TBD'}` : ''}

${userStyle ? `WRITING STYLE: ${userStyle}` : 'WRITING STYLE: Professional, clinical, and concise'}

Generate a complete, Medicare-compliant ${state.discipline} note based on the information provided. If specific measurements are missing, use functional descriptors (e.g., "household distances", "functional range", "modified independence"). Focus on demonstrating skilled ${state.discipline} intervention and functional outcomes. Ensure all content is appropriate for ${state.discipline} scope of practice.`;

      return { text: await generateLocalNote(prompt), appliedPolicies: [] };
    } catch {
      // Enhanced fallback with more clinical detail
      const fallbackNote = generateEnhancedFallbackNote(state);
      return {
        text: fallbackNote,
        appliedPolicies: [],
      };
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
      appliedPolicies = policyContext.policies.map((p) => p.id);
    } catch (e) {
      console.warn('Failed to build policy context, continuing without policies', e);
    }
  }

  const prompt = getGenerateNotePrompt(
    { ...state, details: JSON.parse(scrubbed) },
    userStyle,
    policyContext
  );

  try {
    const response = await callBedrock(AWS_CONFIG.modelId, prompt, {
      system:
        'You are a clinical documentation specialist. Generate accurate, Medicare-compliant therapy notes based on the provided information.',
      maxTokens: 4096,
    });

    // Perform SHAP-inspired fact-check
    const factCheckResult = factCheckNote(state, response);

    return {
      text: response,
      appliedPolicies,
      factCheck: factCheckResult,
      modelProvider: 'AWS Bedrock',
      modelId: AWS_CONFIG.modelId,
    };
  } catch (e) {
    // Fallback to local on error
    console.warn('AWS error, attempting fallback to local...', e);
    try {
      const localText = await generateLocalNote(prompt);
      return { text: `[AWS ERROR - FALLBACK] ${localText}`, appliedPolicies };
    } catch (localE) {
      console.error('Local fallback failed', localE);
      throw new Error(`AWS Error: ${(e as Error).message}. Fallback to local also failed.`);
    }
  }
}

export async function analyzeGaps(
  state: TherapyState,
  isLocalMode?: boolean,
  customPolicies?: Document[]
) {
  if (isLocalMode || !isAWSConfigured()) {
    return {
      data: [
        {
          id: 'local_1',
          question:
            'Local mode or AWS not configured. Please provide any missing functional deficits, prior level of function, or specific evaluation findings.',
          suggestedAnswers: ['Acknowledged'],
        },
      ],
      appliedPolicies: [],
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
      appliedPolicies = policyContext.policies.map((p) => p.id);
    } catch (e) {
      console.warn('Failed to build policy context', e);
    }
  }

  const prompt = getAnalyzeGapsPrompt(state, policyContext);

  try {
    const response = await callBedrock(AWS_CONFIG.modelId, prompt, {
      system:
        'You are a Medicare compliance specialist. Analyze therapy documentation for gaps. Return valid JSON array with id, question, and suggestedAnswers fields.',
      maxTokens: 2048,
    });

    // Validate input state
    const validation = validateInputState(state);

    return {
      data: JSON.parse(response || '[]'),
      appliedPolicies,
      inputValidation: validation,
      modelProvider: 'AWS Bedrock',
    };
  } catch (e) {
    if (e instanceof SyntaxError) {
      console.error('Failed to parse gap analysis JSON', e);
      return { data: [], appliedPolicies };
    }
    return handleAIError(e, 'analyzeGaps');
  }
}

export async function summarizeProgress(state: TherapyState, isLocalMode?: boolean) {
  if (isLocalMode || !isAWSConfigured()) {
    return 'Local mode or AWS not configured. Please manually write the progress summary.';
  }

  const prompt = getSummarizeProgressPrompt(state);

  try {
    const response = await callBedrock(AWS_CONFIG.modelId, prompt, {
      system: 'You are a clinical documentation specialist. Summarize therapy progress concisely.',
      maxTokens: 1024,
    });

    return response;
  } catch (e) {
    return handleAIError(e, 'summarizeProgress');
  }
}

export async function tumbleNote(currentNote: string, instructions: string, isLocalMode?: boolean) {
  if (isLocalMode || !isAWSConfigured()) {
    try {
      const prompt = `Refine or "tumble" the following medical note based on these instructions: "${instructions}". 
      Original Note: ${currentNote}`;
      return await generateLocalNote(prompt);
    } catch (e) {
      console.warn('Local tumble failed', e);
      return currentNote;
    }
  }

  const { scrubbed } = scrubPII(currentNote);
  const prompt = getTumbleNotePrompt(scrubbed, instructions);

  try {
    const response = await callBedrock(AWS_CONFIG.modelId, prompt, {
      system:
        'You are a medical documentation editor. Refine notes according to instructions while maintaining clinical accuracy.',
      maxTokens: 2048,
    });

    return response;
  } catch (e) {
    return handleAIError(e, 'tumbleNote');
  }
}

export async function auditNoteWithAI(
  note: string,
  documentType: string,
  isLocalMode?: boolean,
  customPolicies?: Document[]
) {
  if (isLocalMode || !isAWSConfigured()) {
    return {
      data: {
        complianceScore: 85,
        findings: [
          '[LOCAL MODE] Audit is simplified. Use cloud mode for deep Medicare/CMS analysis.',
        ],
        checklist: {
          'Skilled Intervention Demonstrated': true,
          'Medical Necessity Established': true,
          'Impact of No Treatment Stated': false,
          'SMART Goals Included': true,
          'Standardized Measures Used': false,
          'ICD-10 & CPT Alignment': true,
          'Succinct Narrative Form': true,
          'Professional Terminology': true,
        },
      },
      appliedPolicies: [],
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
      appliedPolicies = policyContext.policies.map((p) => p.id);
    } catch (e) {
      console.warn('Failed to build policy context', e);
    }
  }

  const prompt = getAuditNotePrompt(scrubbed, documentType, policyContext);

  try {
    const response = await callBedrock(AWS_CONFIG.modelId, prompt, {
      system:
        'You are a Medicare compliance auditor. Analyze therapy notes for compliance. Return valid JSON with complianceScore (0-100), findings array, and checklist object.',
      maxTokens: 2048,
    });

    const auditData = JSON.parse(response || '{}');
    const enhancedAudit = enhanceAuditWithSHAP(auditData, { documentType } as TherapyState);

    return {
      data: enhancedAudit,
      appliedPolicies,
      modelProvider: 'AWS Bedrock',
    };
  } catch (e) {
    if (e instanceof SyntaxError) {
      console.error('Failed to parse audit result', e);
      return {
        data: {
          complianceScore: 0,
          findings: ['Failed to audit note due to response format error.'],
          checklist: {},
        },
        appliedPolicies,
      };
    }
    return handleAIError(e, 'auditNoteWithAI');
  }
}
