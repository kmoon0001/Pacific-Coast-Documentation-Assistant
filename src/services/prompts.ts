import { TherapyState, PolicyContext } from "../types";
import { ClinicalKnowledgeBase } from "./clinicalKnowledgeBase";

export const getBrainDumpPrompt = (text: string, currentState: TherapyState, modeInstructions: string) => `
    You are an expert ${currentState.discipline} therapist. 
    Extract clinical information from the following "brain dump" text and map it to the structured therapy state.
    
    Current Discipline: ${currentState.discipline}
    Document Type: ${currentState.documentType}
    
    ${modeInstructions}
    
    Brain Dump Text:
    "${text}"
    
    Return ONLY a JSON object that matches the Partial<TherapyState> interface.
    Focus on: sessionDate, goals, icd10Codes, cptCode, activity, details, clinicalImpressions, responseToIntervention.
`;

const getDocumentTypeInstructions = (type: string) => {
  switch (type) {
    case 'Assessment':
      return "Focus on medical history, prior level of function, specific functional deficits, and initial clinical impressions. Ensure a clear baseline is established.";
    case 'Daily':
      return "Focus on the specific skilled interventions provided during this session and the patient's immediate response. Use the two-paragraph narrative format (Intervention and Response).";
    case 'Progress':
      return "Compare current status to baseline/previous report. Identify progress toward specific goals and any barriers to further progress.";
    case 'Recertification':
      return "Justify the continued need for skilled therapy. Update the plan of care, including frequency and duration.";
    case 'Discharge':
      return "Summarize the entire episode of care. Compare final status to baseline. Provide clear follow-up recommendations.";
    default:
      return "";
  }
};

export const getGenerateNotePrompt = (state: TherapyState, userStyle?: string, policyContext?: PolicyContext) => `
    You are an elite, meticulous Skilled Nursing Facility (SNF) therapist and clinical documentation specialist. 
    Generate a professional, narrative-form medical note that is short, succinct, highly detailed, and defensible against Medicare audits.
    
    CRITICAL INSTRUCTION REGARDING MISSING INFO (OPTIONAL FIELDS):
    The user may have skipped providing certain optional inputs. You must write the best possible note using ONLY the information provided. 
    - Do NOT hallucinate patient data, measurements, specific interventions, or dates if they were not provided. 
    - Use clinical phrasing to bridge gaps (e.g., "Patient participated in skilled therapy..." instead of making up a specific exercise).
    - If specific measurements (e.g., gait distance, ROM) are missing, use functional descriptors (e.g., "household distances", "functional range of motion") based on the context provided in the brain dump or activity details.
    
    COMPLIANCE WARNING LOGIC:
    If critical information required for Medicare compliance is missing, you MUST prepend the note with a section titled "**⚠️ COMPLIANCE WARNING:**". 
    Clearly state exactly which inputs were skipped and why they are required for billing/compliance. 
    
    GROUNDING & COMPLIANCE:
    Your output must strictly adhere to and be grounded in:
    - Medicare Benefits Policy Manual (Chapter 15, Section 220 & 230)
    - CMS Documentation Guidelines
    - Noridian Local Coverage Determinations (LCDs)
    - Medicare Part B Guidelines for Outpatient/SNF Therapy
    
    AUTHORITATIVE KNOWLEDGE CONTEXT:
    ${JSON.stringify(ClinicalKnowledgeBase.knowledge, null, 2)}
    
    ${policyContext && policyContext.policies.length > 0 ? `
    CUSTOM ORGANIZATIONAL POLICIES:
    ${policyContext.policies.map(p => `- ${p.title}: ${p.description}`).join('\n')}
    
    POLICY COMPLIANCE REQUIREMENTS:
    ${policyContext.requirements.map(r => `- [${r.priority.toUpperCase()}] ${r.requirement}`).join('\n')}
    
    POLICY COMPLIANCE INSTRUCTIONS:
    Ensure the generated note complies with all uploaded organizational policies listed above.
    Reference applicable policies in the note where relevant.
    ` : ''}
    
    Use standard medical abbreviations (e.g., Pt, SBA, Min A, Mod A, c/o, s/p).
    
    All notes must demonstrate:
    1. Skilled intervention (clear rationale for why a licensed therapist is required).
    2. Medical necessity (complexity of the patient's condition requires the skills of a therapist).
    3. Impact of no skilled intervention (specific risks to the patient).
    4. SMART Goals (Specific, Measurable, Achievable, Relevant, Time-bound) where applicable.
    5. Standardized outcome measures (e.g., FIM, Barthel, GDS, etc.) if applicable.
    
    Specific Instructions for ${state.documentType}:
    ${getDocumentTypeInstructions(state.documentType)}
    
    Data:
    - Discipline: ${state.discipline}
    - Document Type: ${state.documentType}
    - Reporting Period: ${state.reportingPeriod || 'N/A'}
    - Session Date: ${state.sessionDate || 'N/A'}
    - Goals: ${state.goals?.join('; ') || 'N/A'}
    - ICD-10 Codes: ${state.icd10Codes?.join(', ') || 'N/A'}
    - CPT Code: ${state.cptCode || 'N/A'}
    - Mode: ${state.mode || 'N/A'}
    - Activity: ${state.activity || 'N/A'}
    - Details: ${JSON.stringify(state.details || {})}
    - Reason for Referral: ${state.reasonForReferral || 'N/A'}
    - Medical Files / Acute Hospital Records / Previous Notes: ${state.previousNotesToSummarize || 'N/A'}
    - Therapist Answers to Missing Info (Gap Analysis): ${state.gapAnswersMap ? JSON.stringify(state.gapAnswersMap) : 'N/A'}
    - Clinical Impressions: ${state.clinicalImpressions || 'N/A'}
    - Skilled Intervention Justification: ${state.skilledInterventionJustification || 'N/A'}
    - Medical Necessity Statement: ${state.medicalNecessityStatement || 'N/A'}
    - Impact of No Skilled Services: ${state.impactOfNoSkilledServices || 'N/A'}
    - Response to Intervention: ${state.responseToIntervention || 'N/A'}
    - Progress Statement: ${state.progressStatement || 'N/A'}
    - Plan of Care: Frequency: ${state.planOfCare?.frequency || 'N/A'}, Duration: ${state.planOfCare?.duration || 'N/A'}, Long-Term Goals: ${state.planOfCare?.longTermGoals || 'N/A'}
    - Discharge Reason: ${state.dischargeReason || 'N/A'}
    - Remaining Deficits: ${state.remainingDeficits || 'N/A'}
    - Personalized Notes: ${state.customNote || 'N/A'}
    
    ${userStyle ? `User Style Preference: ${userStyle}` : ""}
    
    ${state.userStyleSamples && state.userStyleSamples.length > 0 
      ? `USER STYLE SAMPLES (Mimic this writing style, tone, and structure):
         ${state.userStyleSamples.join('\n---\n')}` 
      : ""}
    
    ${state.documentType === 'Daily' 
      ? "CRITICAL: The note MUST be exactly two paragraphs (Paragraph 1: Intervention, Paragraph 2: Response). Do not include extra sections, headings, bullet points, or separate lines for goals, plan of care, or medical necessity statements. Integrate all necessary clinical information into the two paragraphs."
      : "CRITICAL: Ensure the note strictly follows the section headings and structure outlined in the Specific Instructions above."
    }
    
    ${['Assessment', 'Progress', 'Recertification'].includes(state.documentType)
      ? `CRITICAL: Include a mandatory "Skilled Necessity" section. Explicitly justify why the patient requires the skills of a licensed therapist for the interventions provided. Link the intervention directly to a functional deficit and explain the impact of no skilled intervention.`
      : ""
    }
`;

export const getAnalyzeGapsPrompt = (state: TherapyState, policyContext?: PolicyContext) => `
    You are a world-class ${state.discipline} therapist. 
    Review the following provided records for a ${state.documentType} report:
    
    Records: ${state.previousNotesToSummarize || 'None provided.'}
    
    ${policyContext && policyContext.policies.length > 0 ? `
    ORGANIZATIONAL POLICIES TO CONSIDER:
    ${policyContext.policies.map(p => `- ${p.title}: ${p.description}`).join('\n')}
    
    POLICY-SPECIFIC REQUIREMENTS:
    ${policyContext.requirements.map(r => `- [${r.priority.toUpperCase()}] ${r.requirement}`).join('\n')}
    ` : ''}
    
    Identify 3 to 5 specific, critical gaps in information needed to complete a comprehensive, Medicare-compliant ${state.documentType} report.
    For an Assessment, this might be prior level of function, home setup, or specific deficits.
    For a Progress/Recertification, this might be current pain levels, specific goal progress, or barriers to progress.
    ${policyContext && policyContext.policies.length > 0 ? 'Also consider gaps related to organizational policy compliance.' : ''}
    
    For each gap, provide the question and 3-4 likely, common clinical answers that a therapist might select.
`;

export const getSummarizeProgressPrompt = (state: TherapyState) => `
    You are a world-class ${state.discipline} therapist. 
    Review the following previous therapy notes for the reporting period: ${state.reportingPeriod || 'the past period'}.
    
    Previous Notes:
    ${state.previousNotesToSummarize || 'None provided.'}
    
    Write a concise, professional clinical narrative summarizing the patient's progress over this period. 
    Highlight improvements in functional mobility, ADLs, communication, or swallowing (depending on discipline).
    Note any barriers to progress or areas where the patient has plateaued.
    Do not include introductory or concluding remarks, just the clinical summary paragraph.
`;

export const getTumbleNotePrompt = (currentNote: string, instructions: string) => `
    Refine or "tumble" the following medical note based on these instructions: "${instructions}"
    Maintain professional medical standards, narrative form, and grounding in Medicare/CMS guidelines.
    
    Current Note:
    ${currentNote}
`;

export const getAuditNotePrompt = (note: string, documentType: string, policyContext?: PolicyContext) => `
    You are a world-class clinical compliance auditor for SNF (Skilled Nursing Facility) therapy documentation.
    Audit the following ${documentType} note for compliance with:
    - Medicare Benefits Policy Manual
    - CMS Documentation Guidelines
    - Noridian LCDs
    - Medicare Part B Guidelines
    
    AUTHORITATIVE KNOWLEDGE CONTEXT:
    ${JSON.stringify(ClinicalKnowledgeBase.knowledge, null, 2)}
    
    ${policyContext && policyContext.policies.length > 0 ? `
    CUSTOM ORGANIZATIONAL POLICIES:
    ${policyContext.policies.map(p => `- ${p.title}: ${p.description}`).join('\n')}
    
    POLICY COMPLIANCE REQUIREMENTS:
    ${policyContext.requirements.map(r => `- [${r.priority.toUpperCase()}] ${r.requirement}`).join('\n')}
    
    POLICY COMPLIANCE INSTRUCTIONS:
    In addition to standard Medicare compliance, verify that the note complies with all organizational policies listed above.
    ` : ''}
    
    Return the result as a JSON object with:
    - complianceScore (number 0-100)
    - findings (array of strings - specific areas for improvement)
    - checklist (object where keys are component names and values are booleans indicating if fulfilled)
    
    Checklist components to evaluate:
    1. "Skilled Intervention Demonstrated"
    2. "Medical Necessity Established"
    3. "Impact of No Treatment Stated"
    4. "SMART Goals Included" (if applicable)
    5. "Standardized Outcome Measures Used" (if applicable)
    6. "ICD-10 & CPT Alignment"
    7. "Succinct Narrative Form"
    8. "Professional Terminology"
    ${policyContext && policyContext.policies.length > 0 ? '9. "Organizational Policy Compliance"' : ''}
    
    Note to audit:
    ${note}
`;
