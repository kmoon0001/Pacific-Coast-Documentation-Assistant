import { Discipline } from '../types';

export interface DisciplinePhrases {
  medicalNecessity: string[];
  riskOfDecline: string[];
  skilledJustification: string[];
  narrativeSuggestions: string[];
}

export const DISCIPLINE_CONTENT: Record<Discipline, DisciplinePhrases> = {
  PT: {
    medicalNecessity: [
      'Pt requires skilled PT to safely progress with functional mobility.',
      'Pt presents with complex gait and balance deficits requiring PT expertise.',
      'Skilled PT is necessary to address high fall risk and mobility impairments.',
      'Therapeutic exercise is required to improve LE strength for safe transfers.'
    ],
    riskOfDecline: [
      'Risk of further functional decline in ambulation and transfers.',
      'High risk of falls and safety compromise during mobility tasks.',
      'Risk of permanent loss of independent mobility without skilled PT.',
      'Risk of contractures and skin breakdown due to immobility.'
    ],
    skilledJustification: [
      'Therapist skills required to assess and mitigate fall risk during gait.',
      'Skilled intervention needed to design and progress LE strengthening program.',
      'Therapist expertise required for manual techniques and gait retraining.',
      'Skilled monitoring of vitals and tolerance during aerobic conditioning.'
    ],
    narrativeSuggestions: [
      'APTA CPG: Pt demonstrated improved gait safety and reduced fall risk.',
      'Pt performed therapeutic exercises to improve functional mobility.',
      'Pt required skilled verbal and tactile cues for proper gait mechanics.',
      'Pt demonstrated improved dynamic balance during reaching tasks.',
      'Pt tolerated LE strengthening with minimal fatigue.'
    ]
  },
  OT: {
    medicalNecessity: [
      'Pt requires skilled OT to improve independence with ADLs and IADLs.',
      'Pt presents with fine motor and cognitive deficits impacting self-care.',
      'Skilled OT is necessary to implement adaptive strategies for daily living.',
      'Therapeutic activities are required to improve UE function for ADL participation.'
    ],
    riskOfDecline: [
      'Risk of further decline in ADL independence and self-care safety.',
      'Risk of safety compromise during home management and meal prep.',
      'Risk of loss of functional independence without skilled OT intervention.',
      'Risk of social isolation due to inability to perform meaningful occupations.'
    ],
    skilledJustification: [
      'Therapist skills required to assess and adapt ADL tasks for safety.',
      'Skilled intervention needed for fine motor retraining and dexterity.',
      'Therapist expertise required for cognitive-perceptual retraining.',
      'Skilled instruction in energy conservation and joint protection.'
    ],
    narrativeSuggestions: [
      'AOTA EBP: Pt demonstrated improved ADL independence with adaptive equipment.',
      'Pt utilized energy conservation strategies for functional tasks.',
      'Pt participated in upper body dressing training with minimal assistance.',
      'Pt demonstrated improved fine motor coordination during pegboard tasks.',
      'Pt utilized compensatory strategies for memory during IADL tasks.'
    ]
  },
  ST: {
    medicalNecessity: [
      'Pt requires skilled ST to address swallowing safety and dysphagia.',
      'Pt presents with cognitive-communication deficits impacting safety.',
      'Skilled ST is necessary to improve functional communication and swallow safety.',
      'Therapeutic intervention is required to address word retrieval and language processing.'
    ],
    riskOfDecline: [
      'Risk of worsening swallowing deficits and potential for aspiration.',
      'Risk of safety compromise due to cognitive-communication impairments.',
      'Risk of malnutrition and dehydration without skilled dysphagia therapy.',
      'Risk of social withdrawal due to severe communication barriers.'
    ],
    skilledJustification: [
      'Therapist skills required to assess and mitigate aspiration risk.',
      'Skilled intervention needed for cognitive-communication retraining.',
      'Therapist expertise required for motor speech and articulation therapy.',
      'Skilled monitoring of swallow safety during diet modification trials.'
    ],
    narrativeSuggestions: [
      'ASHA Evidence Map: Pt utilized compensatory strategies for swallow safety.',
      'Pt demonstrated improved cognitive-communication for ADL participation.',
      'Pt utilized word retrieval strategies during functional conversation.',
      'Pt demonstrated improved safety awareness during mealtime trials.',
      'Pt performed lingual strengthening exercises with moderate accuracy.'
    ]
  }
};
