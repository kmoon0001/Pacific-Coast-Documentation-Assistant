import { Discipline, TherapyState, AuditResult } from '../types';
import { DISCIPLINE_CONTENT } from '../data/disciplineContent';

export interface ClinicalRule {
  id: string;
  discipline: Discipline | 'Global';
  description: string;
  validate: (state: TherapyState) => { isValid: boolean; message?: string };
}

export const ClinicalKnowledgeBase = {
  knowledge: {
    cms: {
      skilledNature: "CMS Benefit Policy Manual Chapter 15: Documentation must clearly reflect the skilled nature of the intervention. Services must be so inherently complex that they can be safely and effectively performed only by, or under the supervision of, a qualified therapist.",
      medicalNecessity: "CMS guidelines require that the services provided are reasonable and necessary for the treatment of the patient's condition. This includes the frequency, duration, and amount of therapy.",
      progressReports: "CMS requires progress reports at least once every 10 treatment days or once every 30 calendar days, whichever is less. Documentation must show progress towards goals or explain why progress is not occurring.",
      maintenanceTherapy: "Jimmo v. Sebelius: Skilled therapy is covered when it is necessary to maintain the patient's current condition or to prevent or slow further deterioration, even if improvement is not expected."
    },
    noridian: {
      lcdGeneral: "Noridian LCDs emphasize that documentation must support the medical necessity of each CPT code billed. Narratives should avoid 'boilerplate' language and be patient-specific.",
      stDysphagia: "Noridian ST LCD: For dysphagia (92526), documentation must include the specific swallowing deficit, the compensatory strategies used, and the patient's response/safety during the session.",
      ptGait: "Noridian PT LCD: For gait training (97116), documentation must specify the distance, surface, assistive device, and the specific skilled cues provided (e.g., 'cues for heel strike', 'balance recovery').",
      otAdl: "Noridian OT LCD: For self-care/ADL (97535), documentation must show how the activity relates to the patient's functional goals and the specific skilled assistance provided."
    },
    professional: {
      asha: "ASHA: Documentation should reflect the clinician's expertise in assessment, intervention, and management of communication and swallowing disorders.",
      apta: "APTA: Physical therapists must document the 'why' behind their interventions, linking impairments to functional limitations and goals.",
      aota: "AOTA: Occupational therapy documentation must focus on the patient's engagement in meaningful occupations and the impact on their daily life."
    }
  },
  rules: [
    {
      id: 'skilled-intervention-required',
      discipline: 'Global',
      description: 'Skilled intervention justification must be provided for Progress/Assessment/Recertification notes.',
      validate: (state: TherapyState) => {
        if (['Progress', 'Assessment', 'Recertification'].includes(state.documentType) && !state.skilledInterventionJustification) {
          return { isValid: false, message: 'Skilled intervention justification is required.' };
        }
        return { isValid: true };
      }
    },
    {
      id: 'medical-necessity-required',
      discipline: 'Global',
      description: 'Medical necessity statement must be provided for Progress/Assessment/Recertification notes.',
      validate: (state: TherapyState) => {
        if (['Progress', 'Assessment', 'Recertification'].includes(state.documentType) && !state.medicalNecessityStatement) {
          return { isValid: false, message: 'Medical necessity statement is required.' };
        }
        return { isValid: true };
      }
    },
    {
      id: 'impact-of-no-skilled-services-required',
      discipline: 'Global',
      description: 'Impact of no skilled services must be provided for Progress/Assessment/Recertification notes.',
      validate: (state: TherapyState) => {
        if (['Progress', 'Assessment', 'Recertification'].includes(state.documentType) && !state.impactOfNoSkilledServices) {
          return { isValid: false, message: 'Impact of no skilled services is required.' };
        }
        return { isValid: true };
      }
    },
    {
      id: 'poc-required',
      discipline: 'Global',
      description: 'Plan of Care must be provided for Assessment notes.',
      validate: (state: TherapyState) => {
        if (state.documentType === 'Assessment' && (!state.planOfCare?.frequency || !state.planOfCare?.duration || !state.planOfCare?.longTermGoals)) {
          return { isValid: false, message: 'Plan of Care (frequency, duration, goals) is required for Assessment.' };
        }
        return { isValid: true };
      }
    },
    {
      id: 'st-swallowing-safety',
      discipline: 'ST',
      description: 'ASHA Evidence Map: Swallowing safety must be addressed for dysphagia interventions.',
      validate: (state: TherapyState) => {
        if (state.cptCode === '92526' && !state.customNote.toLowerCase().includes('swallow')) {
          return { isValid: false, message: 'ASHA guidelines require documenting swallow safety for dysphagia therapy.' };
        }
        return { isValid: true };
      }
    },
    {
      id: 'pt-gait-balance',
      discipline: 'PT',
      description: 'APTA CPG: Gait/Balance interventions must document safety and fall risk.',
      validate: (state: TherapyState) => {
        if (state.discipline === 'PT' && !state.customNote.toLowerCase().includes('safety') && !state.customNote.toLowerCase().includes('fall')) {
          return { isValid: false, message: 'APTA CPG requires documenting safety/fall risk for gait/balance training.' };
        }
        return { isValid: true };
      }
    },
    {
      id: 'ot-adl-independence',
      discipline: 'OT',
      description: 'AOTA EBP: ADL interventions must document independence level and adaptive equipment.',
      validate: (state: TherapyState) => {
        if (state.discipline === 'OT' && !state.customNote.toLowerCase().includes('independence') && !state.customNote.toLowerCase().includes('adaptive')) {
          return { isValid: false, message: 'AOTA EBP requires documenting independence level or adaptive equipment for ADLs.' };
        }
        return { isValid: true };
      }
    },
    {
      id: 'cms-skilled-nature',
      discipline: 'Global',
      description: 'CMS Benefit Policy Manual: Documentation must clearly reflect the skilled nature of the intervention.',
      validate: (state: TherapyState) => {
        if (!state.skilledInterventionJustification || state.skilledInterventionJustification.length < 20) {
          return { isValid: false, message: 'CMS requires a detailed justification of skilled intervention.' };
        }
        return { isValid: true };
      }
    },
    {
      id: 'noridian-boilerplate-check',
      discipline: 'Global',
      description: 'Noridian LCD: Avoid boilerplate language. Documentation must be patient-specific.',
      validate: (state: TherapyState) => {
        const boilerplateTerms = ['tolerated well', 'continue plan of care', 'as per protocol'];
        const found = boilerplateTerms.filter(term => state.customNote.toLowerCase().includes(term));
        if (found.length > 1) {
          return { isValid: false, message: 'Noridian warns against excessive boilerplate language. Add more patient-specific details.' };
        }
        return { isValid: true };
      }
    }
  ] as ClinicalRule[],

  auditNote: (state: TherapyState): AuditResult => {
    const findings: string[] = [];
    let score = 100;

    ClinicalKnowledgeBase.rules.forEach(rule => {
      if (rule.discipline === 'Global' || rule.discipline === state.discipline) {
        const result = rule.validate(state);
        if (!result.isValid) {
          findings.push(result.message || rule.description);
          score -= 20;
        }
      }
    });

    return { complianceScore: Math.max(0, score), findings };
  },

  getSuggestions: (state: TherapyState): string[] => {
    const { discipline, activity, documentType, details } = state;
    const content = DISCIPLINE_CONTENT[discipline as Discipline];
    
    // Discipline-specific suggestions from centralized content
    let suggestions = [...content.narrativeSuggestions];
    
    // Authoritative phrases from CMS/Noridian
    suggestions.push('Skilled intervention is medically necessary to prevent functional decline.');
    suggestions.push('Risk of functional decline exists if skilled services are discontinued.');
    suggestions.push('Services are so inherently complex that they require a licensed therapist.');
    
    // Activity-specific
    if (activity) {
      suggestions.push(`Pt engaged in ${activity} with skilled therapist guidance.`);
      suggestions.push(`Pt required skilled intervention for ${activity} to ensure safety.`);
      if (details['Repetitions']) suggestions.push(`Pt completed ${details['Repetitions']} repetitions of ${activity}.`);
    }

    // Document-type specific (CMS Compliance)
    if (documentType === 'Progress') {
      suggestions.push('Pt is progressing towards goals per CMS guidelines.');
      suggestions.push('Documentation supports the medical necessity of continued therapy.');
    } else if (documentType === 'Assessment') {
      suggestions.push('Pt demonstrates significant functional deficits requiring skilled therapy.');
      suggestions.push('Evaluation findings support the need for a skilled plan of care.');
    } else if (documentType === 'Recertification') {
      suggestions.push('Pt continues to demonstrate significant functional deficits requiring skilled therapy for further progress.');
      suggestions.push('Continued skilled intervention is required to achieve functional goals.');
    }
    
    return [...new Set(suggestions)];
  }
};

