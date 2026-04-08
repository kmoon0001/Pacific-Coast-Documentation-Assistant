import { CPTCode } from '../../types';

// Speech-Language Pathology (ST) therapy data
// CPT codes: 92526, 92507
export const ST_DATA: CPTCode[] = [
  {
    code: '92526',
    description: 'Oral Function/Swallowing Therapy',
    modes: [
      {
        name: 'Oral Phase Retraining',
        activities: [
          {
            name: 'Bolus Management Exercises',
            details: [
              { label: 'Reps', type: 'number' },
              { label: 'Sets', type: 'number' },
              {
                label: 'Consistency',
                type: 'select',
                options: ['Puree', 'Soft', 'Regular', 'Nectar Thick', 'Honey Thick'],
              },
              {
                label: 'Cueing Level',
                type: 'select',
                options: ['Min', 'Mod', 'Max', 'Total', 'Independent'],
              },
              {
                label: 'Cueing Type',
                type: 'multi-select',
                options: ['Verbal', 'Tactile', 'Visual', 'Demonstration'],
              },
            ],
          },
          {
            name: 'Mastication Training',
            details: [
              { label: 'Duration (min)', type: 'number' },
              {
                label: 'Technique',
                type: 'select',
                options: ['Cyclic tracking', 'Lateralization', 'Bolus placement'],
              },
              {
                label: 'Cueing Level',
                type: 'select',
                options: ['Min', 'Mod', 'Max', 'Independent'],
              },
            ],
          },
          {
            name: 'Labial/Lingual Strengthening',
            details: [
              {
                label: 'Exercise Type',
                type: 'select',
                options: ['Resistance', 'Range of Motion', 'Coordination'],
              },
              { label: 'Target', type: 'select', options: ['Lips', 'Tongue', 'Jaw', 'Cheeks'] },
              { label: 'Reps', type: 'number' },
              { label: 'Sets', type: 'number' },
            ],
          },
        ],
      },
      {
        name: 'Pharyngeal Phase Retraining',
        activities: [
          {
            name: 'Mendelsohn Maneuver',
            details: [
              { label: 'Reps', type: 'number' },
              { label: 'Hold Time (sec)', type: 'number' },
              { label: 'Cueing Level', type: 'select', options: ['Min', 'Mod', 'Max'] },
            ],
          },
          {
            name: 'Masako Maneuver',
            details: [
              { label: 'Reps', type: 'number' },
              { label: 'Sets', type: 'number' },
            ],
          },
          {
            name: 'Supraglottic Swallow',
            details: [
              { label: 'Reps', type: 'number' },
              { label: 'Cueing', type: 'select', options: ['Min', 'Mod', 'Max'] },
            ],
          },
          {
            name: 'Effortful Swallow',
            details: [
              { label: 'Reps', type: 'number' },
              { label: 'Sets', type: 'number' },
              { label: 'Cueing', type: 'select', options: ['Min', 'Mod', 'Max'] },
            ],
          },
          {
            name: 'Shaker Exercises',
            details: [
              { label: 'Reps', type: 'number' },
              { label: 'Hold Time (sec)', type: 'number' },
            ],
          },
        ],
      },
      {
        name: 'Compensatory Strategies',
        activities: [
          {
            name: 'Postural Changes',
            details: [
              {
                label: 'Posture',
                type: 'select',
                options: ['Chin Tuck', 'Head Rotation Left', 'Head Rotation Right', 'Head Tilt'],
              },
              {
                label: 'Consistency',
                type: 'select',
                options: ['Thin', 'Nectar', 'Honey', 'Puree'],
              },
              {
                label: 'Success Rate (%)',
                type: 'select',
                options: ['<50%', '50-75%', '75-90%', '>90%', '100%'],
              },
            ],
          },
          {
            name: 'Diet Modification Trials',
            details: [
              {
                label: 'Liquid Consistency',
                type: 'select',
                options: ['Thin', 'Nectar Thick', 'Honey Thick', 'Pudding Thick'],
              },
              {
                label: 'Solid Consistency',
                type: 'select',
                options: ['Regular', 'Mechanical Soft', 'Puree', 'Liquidized'],
              },
              {
                label: 'Tolerance',
                type: 'select',
                options: ['Good', 'Fair', 'Poor', 'Signs of Aspiration'],
              },
            ],
          },
          {
            name: 'Safe Swallowing Strategies',
            details: [
              {
                label: 'Strategy',
                type: 'multi-select',
                options: [
                  'Small bites/sips',
                  'Alternating liquids/solids',
                  'Multiple swallows per bolus',
                  'Slow pace',
                ],
              },
              {
                label: 'Cueing Level',
                type: 'select',
                options: ['Min', 'Mod', 'Max', 'Independent'],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    code: '92507',
    description: 'Speech/Language/Cognitive Treatment',
    modes: [
      {
        name: 'Cognitive-Communication',
        activities: [
          {
            name: 'Executive Function Training',
            details: [
              {
                label: 'Task',
                type: 'select',
                options: ['Problem Solving', 'Sequencing', 'Safety Awareness', 'Money Management'],
              },
              {
                label: 'Accuracy (%)',
                type: 'select',
                options: ['<50%', '50-75%', '75-90%', '>90%', '100%'],
              },
              { label: 'Cueing Level', type: 'select', options: ['Min', 'Mod', 'Max'] },
            ],
          },
          {
            name: 'Memory Strategies',
            details: [
              {
                label: 'Strategy',
                type: 'select',
                options: [
                  'Spaced Retrieval',
                  'External Aids',
                  'Mnemonics',
                  'Chunking',
                  'Visual Imagery',
                ],
              },
              {
                label: 'Success Rate (%)',
                type: 'select',
                options: ['<50%', '50-75%', '75-90%', '>90%', '100%'],
              },
            ],
          },
          {
            name: 'Attention Training',
            details: [
              {
                label: 'Type',
                type: 'select',
                options: ['Sustained', 'Selective', 'Alternating', 'Divided'],
              },
              { label: 'Duration (min)', type: 'number' },
              {
                label: 'Distractions',
                type: 'select',
                options: ['None', 'Minimal', 'Moderate', 'High'],
              },
            ],
          },
          {
            name: 'Safety Awareness Training',
            details: [
              {
                label: 'Scenario',
                type: 'select',
                options: [
                  'Home Safety',
                  'Medication Management',
                  'Emergency Procedures',
                  'Fall Prevention',
                ],
              },
              { label: 'Cueing Level', type: 'select', options: ['Min', 'Mod', 'Max'] },
              {
                label: 'Accuracy (%)',
                type: 'select',
                options: ['<50%', '50-75%', '75-90%', '>90%', '100%'],
              },
            ],
          },
        ],
      },
      {
        name: 'Language Expression/Reception',
        activities: [
          {
            name: 'Word Retrieval',
            details: [
              {
                label: 'Strategy',
                type: 'select',
                options: ['Semantic Feature Analysis', 'Phonemic Cueing', 'Circumlocution'],
              },
              {
                label: 'Accuracy (%)',
                type: 'select',
                options: ['<50%', '50-75%', '75-90%', '>90%', '100%'],
              },
            ],
          },
          {
            name: 'Auditory Comprehension',
            details: [
              {
                label: 'Complexity',
                type: 'select',
                options: [
                  'Single Words',
                  'Short Sentences',
                  'Complex Commands',
                  'Paragraphs',
                  'Conversation',
                ],
              },
              {
                label: 'Accuracy (%)',
                type: 'select',
                options: ['<50%', '50-75%', '75-90%', '>90%', '100%'],
              },
            ],
          },
          {
            name: 'Reading Comprehension',
            details: [
              {
                label: 'Complexity',
                type: 'select',
                options: ['Single Words', 'Sentences', 'Paragraphs', 'Articles'],
              },
              {
                label: 'Accuracy (%)',
                type: 'select',
                options: ['<50%', '50-75%', '75-90%', '>90%', '100%'],
              },
            ],
          },
          {
            name: 'Written Expression',
            details: [
              {
                label: 'Task',
                type: 'select',
                options: ['Copying', 'Dictation', 'Spontaneous Sentences', 'Paragraphs'],
              },
              {
                label: 'Legibility/Accuracy',
                type: 'select',
                options: ['Poor', 'Fair', 'Good', 'Excellent'],
              },
            ],
          },
        ],
      },
      {
        name: 'Voice/Resonance',
        activities: [
          {
            name: 'Vocal Hygiene',
            details: [
              {
                label: 'Strategy',
                type: 'multi-select',
                options: [
                  'Hydration',
                  'Vocal Rest',
                  'Avoidance of Irritants',
                  'Eliminate Throat Clearing',
                ],
              },
              { label: 'Compliance', type: 'select', options: ['Good', 'Fair', 'Poor'] },
            ],
          },
          {
            name: 'Resonance Training',
            details: [
              {
                label: 'Technique',
                type: 'select',
                options: ['Forward Focus', 'Resonant Voice', 'Laryngeal Massage'],
              },
              { label: 'Cueing Level', type: 'select', options: ['Min', 'Mod', 'Max'] },
            ],
          },
          {
            name: 'Phonation Exercises',
            details: [
              {
                label: 'Technique',
                type: 'select',
                options: [
                  'Vocal Function Exercises',
                  'Lee Silverman Voice Treatment (LSVT)',
                  'Pitch Glides',
                ],
              },
              { label: 'Duration (min)', type: 'number' },
            ],
          },
        ],
      },
      {
        name: 'Fluency',
        activities: [
          {
            name: 'Stuttering Modification',
            details: [
              {
                label: 'Technique',
                type: 'select',
                options: ['Cancellations', 'Pull-outs', 'Preparatory Sets'],
              },
              {
                label: 'Success Rate (%)',
                type: 'select',
                options: ['<50%', '50-75%', '75-90%', '>90%', '100%'],
              },
            ],
          },
          {
            name: 'Rate Control',
            details: [
              {
                label: 'Technique',
                type: 'select',
                options: ['Pausing', 'Phrasing', 'Easy Onset', 'Pacing Board'],
              },
              {
                label: 'Success Rate (%)',
                type: 'select',
                options: ['<50%', '50-75%', '75-90%', '>90%', '100%'],
              },
            ],
          },
        ],
      },
      {
        name: 'Motor Speech',
        activities: [
          {
            name: 'Articulation Therapy',
            details: [
              {
                label: 'Technique',
                type: 'select',
                options: ['Phonetic Placement', 'Minimal Pairs', 'Overarticulation'],
              },
              {
                label: 'Target',
                type: 'select',
                options: ['Consonants', 'Vowels', 'Blends', 'Multisyllabic Words'],
              },
              {
                label: 'Accuracy (%)',
                type: 'select',
                options: ['<50%', '50-75%', '75-90%', '>90%', '100%'],
              },
            ],
          },
          {
            name: 'Prosody Training',
            details: [
              {
                label: 'Technique',
                type: 'select',
                options: ['Contrastive Stress', 'Intonation Profiles', 'Breath Grouping'],
              },
              { label: 'Cueing Level', type: 'select', options: ['Min', 'Mod', 'Max'] },
            ],
          },
        ],
      },
      {
        name: 'AAC',
        activities: [
          {
            name: 'Device Training',
            details: [
              {
                label: 'Task',
                type: 'select',
                options: ['Requesting', 'Commenting', 'Social Interaction', 'Navigating Menus'],
              },
              {
                label: 'Cueing Level',
                type: 'select',
                options: ['Min', 'Mod', 'Max', 'Independent'],
              },
            ],
          },
          {
            name: 'Picture Exchange',
            details: [
              { label: 'Phase', type: 'select', options: ['1', '2', '3', '4', '5', '6'] },
              {
                label: 'Accuracy (%)',
                type: 'select',
                options: ['<50%', '50-75%', '75-90%', '>90%', '100%'],
              },
            ],
          },
        ],
      },
    ],
  },
];
