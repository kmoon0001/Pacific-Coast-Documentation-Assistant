import { CPTCode } from '../types';

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
              { label: 'Consistency', type: 'select', options: ['Puree', 'Soft', 'Regular', 'Nectar Thick', 'Honey Thick'] },
              { label: 'Cueing Level', type: 'select', options: ['Min', 'Mod', 'Max', 'Total', 'Independent'] },
              { label: 'Cueing Type', type: 'multi-select', options: ['Verbal', 'Tactile', 'Visual', 'Demonstration'] }
            ]
          },
          {
            name: 'Mastication Training',
            details: [
              { label: 'Duration (min)', type: 'number' },
              { label: 'Technique', type: 'select', options: ['Cyclic tracking', 'Lateralization', 'Bolus placement'] },
              { label: 'Cueing Level', type: 'select', options: ['Min', 'Mod', 'Max', 'Independent'] }
            ]
          },
          {
            name: 'Labial/Lingual Strengthening',
            details: [
              { label: 'Exercise Type', type: 'select', options: ['Resistance', 'Range of Motion', 'Coordination'] },
              { label: 'Target', type: 'select', options: ['Lips', 'Tongue', 'Jaw', 'Cheeks'] },
              { label: 'Reps', type: 'number' },
              { label: 'Sets', type: 'number' }
            ]
          }
        ]
      },
      {
        name: 'Pharyngeal Phase Retraining',
        activities: [
          {
            name: 'Mendelsohn Maneuver',
            details: [
              { label: 'Reps', type: 'number' },
              { label: 'Hold Time (sec)', type: 'number' },
              { label: 'Cueing Level', type: 'select', options: ['Min', 'Mod', 'Max'] }
            ]
          },
          {
            name: 'Masako Maneuver',
            details: [
              { label: 'Reps', type: 'number' },
              { label: 'Sets', type: 'number' }
            ]
          },
          {
            name: 'Supraglottic Swallow',
            details: [
              { label: 'Reps', type: 'number' },
              { label: 'Cueing', type: 'select', options: ['Min', 'Mod', 'Max'] }
            ]
          },
          {
            name: 'Effortful Swallow',
            details: [
              { label: 'Reps', type: 'number' },
              { label: 'Sets', type: 'number' },
              { label: 'Cueing', type: 'select', options: ['Min', 'Mod', 'Max'] }
            ]
          },
          {
            name: 'Shaker Exercises',
            details: [
              { label: 'Reps', type: 'number' },
              { label: 'Hold Time (sec)', type: 'number' }
            ]
          }
        ]
      },
      {
        name: 'Compensatory Strategies',
        activities: [
          {
            name: 'Postural Changes',
            details: [
              { label: 'Posture', type: 'select', options: ['Chin Tuck', 'Head Rotation Left', 'Head Rotation Right', 'Head Tilt'] },
              { label: 'Consistency', type: 'select', options: ['Thin', 'Nectar', 'Honey', 'Puree'] },
              { label: 'Success Rate (%)', type: 'select', options: ['<50%', '50-75%', '75-90%', '>90%', '100%'] }
            ]
          },
          {
            name: 'Diet Modification Trials',
            details: [
              { label: 'Liquid Consistency', type: 'select', options: ['Thin', 'Nectar Thick', 'Honey Thick', 'Pudding Thick'] },
              { label: 'Solid Consistency', type: 'select', options: ['Regular', 'Mechanical Soft', 'Puree', 'Liquidized'] },
              { label: 'Tolerance', type: 'select', options: ['Good', 'Fair', 'Poor', 'Signs of Aspiration'] }
            ]
          },
          {
            name: 'Safe Swallowing Strategies',
            details: [
              { label: 'Strategy', type: 'multi-select', options: ['Small bites/sips', 'Alternating liquids/solids', 'Multiple swallows per bolus', 'Slow pace'] },
              { label: 'Cueing Level', type: 'select', options: ['Min', 'Mod', 'Max', 'Independent'] }
            ]
          }
        ]
      }
    ]
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
              { label: 'Task', type: 'select', options: ['Problem Solving', 'Sequencing', 'Safety Awareness', 'Money Management'] },
              { label: 'Accuracy (%)', type: 'select', options: ['<50%', '50-75%', '75-90%', '>90%', '100%'] },
              { label: 'Cueing Level', type: 'select', options: ['Min', 'Mod', 'Max'] }
            ]
          },
          {
            name: 'Memory Strategies',
            details: [
              { label: 'Strategy', type: 'select', options: ['Spaced Retrieval', 'External Aids', 'Mnemonics', 'Chunking', 'Visual Imagery'] },
              { label: 'Success Rate (%)', type: 'select', options: ['<50%', '50-75%', '75-90%', '>90%', '100%'] }
            ]
          },
          {
            name: 'Attention Training',
            details: [
              { label: 'Type', type: 'select', options: ['Sustained', 'Selective', 'Alternating', 'Divided'] },
              { label: 'Duration (min)', type: 'number' },
              { label: 'Distractions', type: 'select', options: ['None', 'Minimal', 'Moderate', 'High'] }
            ]
          },
          {
            name: 'Safety Awareness Training',
            details: [
              { label: 'Scenario', type: 'select', options: ['Home Safety', 'Medication Management', 'Emergency Procedures', 'Fall Prevention'] },
              { label: 'Cueing Level', type: 'select', options: ['Min', 'Mod', 'Max'] },
              { label: 'Accuracy (%)', type: 'select', options: ['<50%', '50-75%', '75-90%', '>90%', '100%'] }
            ]
          }
        ]
      },
      {
        name: 'Language Expression/Reception',
        activities: [
          {
            name: 'Word Retrieval',
            details: [
              { label: 'Strategy', type: 'select', options: ['Semantic Feature Analysis', 'Phonemic Cueing', 'Circumlocution'] },
              { label: 'Accuracy (%)', type: 'select', options: ['<50%', '50-75%', '75-90%', '>90%', '100%'] }
            ]
          },
          {
            name: 'Auditory Comprehension',
            details: [
              { label: 'Complexity', type: 'select', options: ['Single Words', 'Short Sentences', 'Complex Commands', 'Paragraphs', 'Conversation'] },
              { label: 'Accuracy (%)', type: 'select', options: ['<50%', '50-75%', '75-90%', '>90%', '100%'] }
            ]
          },
          {
            name: 'Reading Comprehension',
            details: [
              { label: 'Complexity', type: 'select', options: ['Single Words', 'Sentences', 'Paragraphs', 'Articles'] },
              { label: 'Accuracy (%)', type: 'select', options: ['<50%', '50-75%', '75-90%', '>90%', '100%'] }
            ]
          },
          {
            name: 'Written Expression',
            details: [
              { label: 'Task', type: 'select', options: ['Copying', 'Dictation', 'Spontaneous Sentences', 'Paragraphs'] },
              { label: 'Legibility/Accuracy', type: 'select', options: ['Poor', 'Fair', 'Good', 'Excellent'] }
            ]
          }
        ]
      },
      {
        name: 'Voice/Resonance',
        activities: [
          {
            name: 'Vocal Hygiene',
            details: [
              { label: 'Strategy', type: 'multi-select', options: ['Hydration', 'Vocal Rest', 'Avoidance of Irritants', 'Eliminate Throat Clearing'] },
              { label: 'Compliance', type: 'select', options: ['Good', 'Fair', 'Poor'] }
            ]
          },
          {
            name: 'Resonance Training',
            details: [
              { label: 'Technique', type: 'select', options: ['Forward Focus', 'Resonant Voice', 'Laryngeal Massage'] },
              { label: 'Cueing Level', type: 'select', options: ['Min', 'Mod', 'Max'] }
            ]
          },
          {
            name: 'Phonation Exercises',
            details: [
              { label: 'Technique', type: 'select', options: ['Vocal Function Exercises', 'Lee Silverman Voice Treatment (LSVT)', 'Pitch Glides'] },
              { label: 'Duration (min)', type: 'number' }
            ]
          }
        ]
      },
      {
        name: 'Fluency',
        activities: [
          {
            name: 'Stuttering Modification',
            details: [
              { label: 'Technique', type: 'select', options: ['Cancellations', 'Pull-outs', 'Preparatory Sets'] },
              { label: 'Success Rate (%)', type: 'select', options: ['<50%', '50-75%', '75-90%', '>90%', '100%'] }
            ]
          },
          {
            name: 'Rate Control',
            details: [
              { label: 'Technique', type: 'select', options: ['Pausing', 'Phrasing', 'Easy Onset', 'Pacing Board'] },
              { label: 'Success Rate (%)', type: 'select', options: ['<50%', '50-75%', '75-90%', '>90%', '100%'] }
            ]
          }
        ]
      },
      {
        name: 'Motor Speech',
        activities: [
          {
            name: 'Articulation Therapy',
            details: [
              { label: 'Technique', type: 'select', options: ['Phonetic Placement', 'Minimal Pairs', 'Overarticulation'] },
              { label: 'Target', type: 'select', options: ['Consonants', 'Vowels', 'Blends', 'Multisyllabic Words'] },
              { label: 'Accuracy (%)', type: 'select', options: ['<50%', '50-75%', '75-90%', '>90%', '100%'] }
            ]
          },
          {
            name: 'Prosody Training',
            details: [
              { label: 'Technique', type: 'select', options: ['Contrastive Stress', 'Intonation Profiles', 'Breath Grouping'] },
              { label: 'Cueing Level', type: 'select', options: ['Min', 'Mod', 'Max'] }
            ]
          }
        ]
      },
      {
        name: 'AAC',
        activities: [
          {
            name: 'Device Training',
            details: [
              { label: 'Task', type: 'select', options: ['Requesting', 'Commenting', 'Social Interaction', 'Navigating Menus'] },
              { label: 'Cueing Level', type: 'select', options: ['Min', 'Mod', 'Max', 'Independent'] }
            ]
          },
          {
            name: 'Picture Exchange',
            details: [
              { label: 'Phase', type: 'select', options: ['1', '2', '3', '4', '5', '6'] },
              { label: 'Accuracy (%)', type: 'select', options: ['<50%', '50-75%', '75-90%', '>90%', '100%'] }
            ]
          }
        ]
      }
    ]
  }
];

export const OT_DATA: CPTCode[] = [
  {
    code: '97530',
    description: 'Therapeutic Activities',
    modes: [
      {
        name: 'Functional Mobility',
        activities: [
          {
            name: 'Bed Mobility',
            details: [
              { label: 'Task', type: 'select', options: ['Rolling', 'Supine to Sit', 'Scooting', 'Bridging'] },
              { label: 'Assistance', type: 'select', options: ['Min A', 'Mod A', 'Max A', 'Total A', 'SBA', 'Independent'] },
              { label: 'Cueing', type: 'select', options: ['Verbal', 'Visual', 'Tactile'] }
            ]
          },
          {
            name: 'Toilet Transfers',
            details: [
              { label: 'Assistance', type: 'select', options: ['Min A', 'Mod A', 'Max A', 'Total A', 'SBA', 'Independent'] },
              { label: 'Equipment', type: 'select', options: ['Raised Toilet Seat', 'Grab Bars', 'Commode', 'None'] }
            ]
          },
          {
            name: 'Tub/Shower Transfers',
            details: [
              { label: 'Assistance', type: 'select', options: ['Min A', 'Mod A', 'Max A', 'Total A', 'SBA', 'Independent'] },
              { label: 'Equipment', type: 'select', options: ['Shower Chair', 'Transfer Bench', 'Grab Bars', 'None'] }
            ]
          },
          {
            name: 'Car Transfers',
            details: [
              { label: 'Assistance', type: 'select', options: ['Min A', 'Mod A', 'Max A', 'Total A', 'SBA', 'Independent'] },
              { label: 'Technique', type: 'select', options: ['Stand Pivot', 'Squat Pivot', 'Slide Board'] }
            ]
          }
        ]
      },
      {
        name: 'Fine Motor / Dexterity',
        activities: [
          {
            name: 'Coordination',
            details: [
              { label: 'Task', type: 'select', options: ['Pegboard', 'Stacking', 'Sorting', 'In-hand manipulation', 'Lacing'] },
              { label: 'Accuracy (%)', type: 'select', options: ['<50%', '50-75%', '75-90%', '>90%', '100%'] },
              { label: 'Duration (min)', type: 'number' }
            ]
          },
          {
            name: 'Handwriting',
            details: [
              { label: 'Task', type: 'select', options: ['Copying', 'Writing Name', 'Writing Sentences', 'Dictation'] },
              { label: 'Legibility', type: 'select', options: ['Good', 'Fair', 'Poor'] },
              { label: 'Grip', type: 'select', options: ['Dynamic Tripod', 'Lateral Tripod', 'Cross Thumb', 'Palmar'] }
            ]
          }
        ]
      },
      {
        name: 'IADLs',
        activities: [
          {
            name: 'Meal Preparation',
            details: [
              { label: 'Task', type: 'select', options: ['Simple cold meal', 'Microwave meal', 'Complex hot meal', 'Kitchen Safety'] },
              { label: 'Cueing', type: 'select', options: ['Min', 'Mod', 'Max', 'Independent'] },
              { label: 'Safety Awareness', type: 'select', options: ['Good', 'Fair', 'Poor'] }
            ]
          },
          {
            name: 'Home Management',
            details: [
              { label: 'Task', type: 'select', options: ['Cleaning', 'Laundry', 'Organization', 'Sweeping/Vacuuming'] },
              { label: 'Endurance (min)', type: 'number' },
              { label: 'Assistance', type: 'select', options: ['Min A', 'Mod A', 'Max A', 'SBA', 'Independent'] }
            ]
          },
          {
            name: 'Medication Management',
            details: [
              { label: 'Task', type: 'select', options: ['Pill Organizer', 'Reading Labels', 'Timing/Scheduling'] },
              { label: 'Accuracy (%)', type: 'select', options: ['<50%', '50-75%', '75-90%', '>90%', '100%'] }
            ]
          },
          {
            name: 'Financial Management',
            details: [
              { label: 'Task', type: 'select', options: ['Budgeting', 'Paying Bills', 'Writing Checks', 'Counting Change'] },
              { label: 'Accuracy (%)', type: 'select', options: ['<50%', '50-75%', '75-90%', '>90%', '100%'] }
            ]
          }
        ]
      }
    ]
  },
  {
    code: '97535',
    description: 'Self-Care/Home Management',
    modes: [
      {
        name: 'ADL Training',
        activities: [
          {
            name: 'Upper Body Dressing',
            details: [
              { label: 'Task', type: 'multi-select', options: ['Don/Doff shirt', 'Fasteners', 'Bra', 'Jacket'] },
              { label: 'Assistance', type: 'select', options: ['Min A', 'Mod A', 'Max A', 'Total A', 'SBA', 'Independent'] },
              { label: 'Cueing', type: 'select', options: ['Verbal', 'Visual', 'Tactile'] }
            ]
          },
          {
            name: 'Lower Body Dressing',
            details: [
              { label: 'Task', type: 'multi-select', options: ['Don/Doff pants', 'Socks', 'Shoes', 'AFO/Brace'] },
              { label: 'Assistance', type: 'select', options: ['Min A', 'Mod A', 'Max A', 'Total A', 'SBA', 'Independent'] }
            ]
          },
          {
            name: 'Grooming/Hygiene',
            details: [
              { label: 'Task', type: 'multi-select', options: ['Oral Care', 'Hair Care', 'Shaving', 'Face Washing', 'Deodorant'] },
              { label: 'Assistance', type: 'select', options: ['Min A', 'Mod A', 'Max A', 'Total A', 'SBA', 'Independent'] }
            ]
          },
          {
            name: 'Toileting',
            details: [
              { label: 'Task', type: 'multi-select', options: ['Clothing management', 'Hygiene/Wiping', 'Transfers'] },
              { label: 'Assistance', type: 'select', options: ['Min A', 'Mod A', 'Max A', 'Total A', 'SBA', 'Independent'] }
            ]
          },
          {
            name: 'Bathing',
            details: [
              { label: 'Task', type: 'multi-select', options: ['Washing upper body', 'Washing lower body', 'Washing back', 'Drying'] },
              { label: 'Assistance', type: 'select', options: ['Min A', 'Mod A', 'Max A', 'Total A', 'SBA', 'Independent'] }
            ]
          },
          {
            name: 'Feeding',
            details: [
              { label: 'Task', type: 'multi-select', options: ['Utensil use', 'Cup drinking', 'Cutting food', 'Opening packages'] },
              { label: 'Assistance', type: 'select', options: ['Min A', 'Mod A', 'Max A', 'Total A', 'SBA', 'Independent'] }
            ]
          }
        ]
      },
      {
        name: 'Adaptive Equipment Training',
        activities: [
          {
            name: 'Dressing Aids',
            details: [
              { label: 'Equipment', type: 'multi-select', options: ['Reacher', 'Sock Aid', 'Shoe Horn', 'Button Hook', 'Dressing Stick'] },
              { label: 'Proficiency', type: 'select', options: ['Good', 'Fair', 'Poor'] },
              { label: 'Cueing', type: 'select', options: ['Min', 'Mod', 'Max'] }
            ]
          },
          {
            name: 'Bathing/Toileting Aids',
            details: [
              { label: 'Equipment', type: 'multi-select', options: ['Long-handled sponge', 'Shower chair', 'Grab bars', 'Raised toilet seat', 'Commode'] },
              { label: 'Proficiency', type: 'select', options: ['Good', 'Fair', 'Poor'] }
            ]
          }
        ]
      }
    ]
  },
  {
    code: '97110',
    description: 'Therapeutic Exercise',
    modes: [
      {
        name: 'Upper Extremity Strengthening',
        activities: [
          {
            name: 'Active Range of Motion',
            details: [
              { label: 'Joint', type: 'multi-select', options: ['Shoulder', 'Elbow', 'Wrist', 'Digits'] },
              { label: 'Reps', type: 'number' },
              { label: 'Sets', type: 'number' }
            ]
          },
          {
            name: 'Resistive Exercise',
            details: [
              { label: 'Resistance', type: 'select', options: ['Yellow', 'Red', 'Green', 'Blue', 'Black', 'Dumbbells (1-5lbs)'] },
              { label: 'Reps', type: 'number' },
              { label: 'Sets', type: 'number' }
            ]
          },
          {
            name: 'Core Stabilization',
            details: [
              { label: 'Task', type: 'select', options: ['Seated balance', 'Reaching out of base of support', 'Trunk rotation'] },
              { label: 'Duration (min)', type: 'number' },
              { label: 'Assistance', type: 'select', options: ['Min A', 'Mod A', 'Max A', 'SBA', 'Independent'] }
            ]
          }
        ]
      },
      {
        name: 'Endurance Training',
        activities: [
          {
            name: 'Upper Body Ergometer (UBE)',
            details: [
              { label: 'Duration (min)', type: 'number' },
              { label: 'Resistance Level', type: 'number' },
              { label: 'Rest Breaks', type: 'number' }
            ]
          },
          {
            name: 'Sustained Activity Tolerance',
            details: [
              { label: 'Activity', type: 'select', options: ['Standing task', 'Seated task', 'Dynamic task'] },
              { label: 'Duration (min)', type: 'number' },
              { label: 'Fatigue Level', type: 'select', options: ['Mild', 'Moderate', 'Severe'] }
            ]
          }
        ]
      }
    ]
  },
  {
    code: '97112',
    description: 'Neuromuscular Re-education',
    modes: [
      {
        name: 'Postural Control',
        activities: [
          {
            name: 'Seated Postural Alignment',
            details: [
              { label: 'Task', type: 'select', options: ['Anterior/Posterior Pelvic Tilt', 'Lateral Weight Shift', 'Midline Orientation'] },
              { label: 'Cueing', type: 'select', options: ['Verbal', 'Visual', 'Tactile'] },
              { label: 'Duration (min)', type: 'number' }
            ]
          },
          {
            name: 'Standing Postural Alignment',
            details: [
              { label: 'Task', type: 'select', options: ['Weight distribution', 'Symmetry', 'Midline Orientation'] },
              { label: 'Cueing', type: 'select', options: ['Verbal', 'Visual', 'Tactile'] },
              { label: 'Duration (min)', type: 'number' }
            ]
          }
        ]
      },
      {
        name: 'Sensory Integration',
        activities: [
          {
            name: 'Desensitization',
            details: [
              { label: 'Technique', type: 'select', options: ['Texture', 'Pressure', 'Temperature', 'Vibration'] },
              { label: 'Tolerance', type: 'select', options: ['Good', 'Fair', 'Poor'] },
              { label: 'Duration (min)', type: 'number' }
            ]
          },
          {
            name: 'Proprioceptive Activities',
            details: [
              { label: 'Task', type: 'select', options: ['Weight Bearing', 'Joint Compression', 'Heavy Work'] },
              { label: 'Duration (min)', type: 'number' }
            ]
          },
          {
            name: 'Visual-Perceptual Training',
            details: [
              { label: 'Task', type: 'select', options: ['Scanning', 'Figure-ground', 'Spatial relations', 'Visual closure'] },
              { label: 'Accuracy (%)', type: 'select', options: ['<50%', '50-75%', '75-90%', '>90%', '100%'] }
            ]
          }
        ]
      }
    ]
  }
];

export const PT_DATA: CPTCode[] = [
  {
    code: '97110',
    description: 'Therapeutic Exercise',
    modes: [
      {
        name: 'Lower Extremity Strengthening',
        activities: [
          {
            name: 'Closed Kinetic Chain',
            details: [
              { label: 'Exercise', type: 'multi-select', options: ['Squats', 'Leg Press', 'Step-ups', 'Wall Slides', 'Heel Raises'] },
              { label: 'Reps', type: 'number' },
              { label: 'Sets', type: 'number' },
              { label: 'Resistance', type: 'select', options: ['Bodyweight', 'Light', 'Moderate', 'Heavy'] }
            ]
          },
          {
            name: 'Open Kinetic Chain',
            details: [
              { label: 'Exercise', type: 'multi-select', options: ['Ankle Pumps', 'Quad Sets', 'Long Arc Quads', 'Hamstring Curls', 'Straight Leg Raises'] },
              { label: 'Reps', type: 'number' },
              { label: 'Sets', type: 'number' },
              { label: 'Resistance', type: 'select', options: ['None', 'Yellow', 'Red', 'Green', 'Blue', 'Ankle Weights'] }
            ]
          }
        ]
      },
      {
        name: 'Flexibility/Stretching',
        activities: [
          {
            name: 'Passive Range of Motion (PROM)',
            details: [
              { label: 'Joint', type: 'multi-select', options: ['Hip', 'Knee', 'Ankle'] },
              { label: 'Duration (min)', type: 'number' }
            ]
          },
          {
            name: 'Active-Assisted Range of Motion (AAROM)',
            details: [
              { label: 'Joint', type: 'multi-select', options: ['Hip', 'Knee', 'Ankle'] },
              { label: 'Reps', type: 'number' },
              { label: 'Sets', type: 'number' }
            ]
          },
          {
            name: 'Sustained Stretching',
            details: [
              { label: 'Muscle Group', type: 'multi-select', options: ['Hamstrings', 'Calf/Gastroc', 'Hip Flexors', 'Quads'] },
              { label: 'Hold Time (sec)', type: 'select', options: ['15', '30', '45', '60'] },
              { label: 'Reps', type: 'number' }
            ]
          }
        ]
      },
      {
        name: 'Aerobic Conditioning',
        activities: [
          {
            name: 'Stationary Bike',
            details: [
              { label: 'Duration (min)', type: 'number' },
              { label: 'Resistance Level', type: 'number' },
              { label: 'RPE (0-10)', type: 'number' }
            ]
          },
          {
            name: 'Treadmill',
            details: [
              { label: 'Duration (min)', type: 'number' },
              { label: 'Speed (mph)', type: 'select', options: ['0.5', '1.0', '1.5', '2.0', '2.5+'] },
              { label: 'Incline (%)', type: 'number' },
              { label: 'RPE (0-10)', type: 'number' }
            ]
          },
          {
            name: 'NuStep / Recumbent Stepper',
            details: [
              { label: 'Duration (min)', type: 'number' },
              { label: 'Resistance Level', type: 'number' },
              { label: 'RPE (0-10)', type: 'number' }
            ]
          }
        ]
      }
    ]
  },
  {
    code: '97112',
    description: 'Neuromuscular Re-education',
    modes: [
      {
        name: 'Balance Training',
        activities: [
          {
            name: 'Static Standing Balance',
            details: [
              { label: 'Stance', type: 'select', options: ['Romberg', 'Tandem', 'Semi-Tandem', 'Single Leg Stance'] },
              { label: 'Duration (sec)', type: 'select', options: ['10', '20', '30', '45', '60'] },
              { label: 'Eyes', type: 'select', options: ['Open', 'Closed'] },
              { label: 'Assistance', type: 'select', options: ['Min A', 'Mod A', 'Max A', 'SBA', 'CGA', 'Independent'] }
            ]
          },
          {
            name: 'Dynamic Balance',
            details: [
              { label: 'Task', type: 'select', options: ['Weight Shifting', 'Reaching outside BOS', 'Stepping/Lunging', 'Braiding/Grapevine'] },
              { label: 'Assistance', type: 'select', options: ['Min A', 'Mod A', 'Max A', 'SBA', 'CGA'] },
              { label: 'Loss of Balance (LOB) events', type: 'number' }
            ]
          },
          {
            name: 'Surface Variations',
            details: [
              { label: 'Surface', type: 'select', options: ['Firm', 'Foam Pad', 'Uneven Terrain', 'Wobble Board', 'Dynadisc'] },
              { label: 'Duration (min)', type: 'number' },
              { label: 'Assistance', type: 'select', options: ['Min A', 'Mod A', 'Max A', 'SBA', 'CGA'] }
            ]
          }
        ]
      },
      {
        name: 'Proprioception/Kinesthesia',
        activities: [
          {
            name: 'Joint Position Sense Training',
            details: [
              { label: 'Joint', type: 'select', options: ['Ankle', 'Knee', 'Hip'] },
              { label: 'Accuracy (%)', type: 'select', options: ['<50%', '50-75%', '75-90%', '>90%', '100%'] }
            ]
          },
          {
            name: 'Postural Sway Training',
            details: [
              { label: 'Feedback', type: 'select', options: ['Visual (Mirror)', 'Tactile', 'Verbal'] },
              { label: 'Duration (min)', type: 'number' }
            ]
          }
        ]
      }
    ]
  },
  {
    code: '97116',
    description: 'Gait Training',
    modes: [
      {
        name: 'Over-ground Ambulation',
        activities: [
          {
            name: 'Level Surfaces',
            details: [
              { label: 'Distance (ft)', type: 'select', options: ['10-25', '25-50', '50-100', '100-150', '150-200', '200+'] },
              { label: 'Device', type: 'select', options: ['None', 'RW', 'PUW', 'SPC', 'Quad Cane', 'Hemi Walker'] },
              { label: 'Assistance', type: 'select', options: ['Min A', 'Mod A', 'Max A', 'SBA', 'CGA', 'Independent'] },
              { label: 'Gait Deviations', type: 'multi-select', options: ['Decreased step length', 'Decreased clearance', 'Festination', 'Antalgic', 'Foot drop', 'None'] }
            ]
          },
          {
            name: 'Uneven Terrain',
            details: [
              { label: 'Surface', type: 'select', options: ['Grass', 'Gravel', 'Ramps', 'Carpet to Tile'] },
              { label: 'Distance (ft)', type: 'select', options: ['10-25', '25-50', '50-100', '100+'] },
              { label: 'Assistance', type: 'select', options: ['Min A', 'Mod A', 'Max A', 'SBA', 'CGA'] }
            ]
          },
          {
            name: 'Obstacle Negotiation',
            details: [
              { label: 'Task', type: 'select', options: ['Stepping over cones', 'Weaving through cones', 'Turning 180 degrees', 'Turning 360 degrees'] },
              { label: 'Assistance', type: 'select', options: ['Min A', 'Mod A', 'Max A', 'SBA', 'CGA'] }
            ]
          }
        ]
      },
      {
        name: 'Assistive Device Training',
        activities: [
          {
            name: 'Progression/Regression',
            details: [
              { label: 'Previous Device', type: 'select', options: ['RW', 'PUW', 'SPC', 'Quad Cane', 'Hemi Walker'] },
              { label: 'New Device', type: 'select', options: ['None', 'RW', 'PUW', 'SPC', 'Quad Cane', 'Hemi Walker'] },
              { label: 'Proficiency', type: 'select', options: ['Good', 'Fair', 'Poor'] }
            ]
          },
          {
            name: 'Proper Sizing and Usage',
            details: [
              { label: 'Device', type: 'select', options: ['RW', 'PUW', 'SPC', 'Quad Cane', 'Hemi Walker'] },
              { label: 'Education Provided', type: 'select', options: ['Yes', 'No'] },
              { label: 'Return Demonstration', type: 'select', options: ['Accurate', 'Required cues', 'Unable'] }
            ]
          }
        ]
      },
      {
        name: 'Stair Negotiation',
        activities: [
          {
            name: 'Step-to Pattern',
            details: [
              { label: 'Number of Steps', type: 'number' },
              { label: 'Handrail Use', type: 'select', options: ['Bilateral', 'Unilateral', 'None'] },
              { label: 'Assistance', type: 'select', options: ['Min A', 'Mod A', 'Max A', 'SBA', 'CGA'] }
            ]
          },
          {
            name: 'Reciprocal Pattern',
            details: [
              { label: 'Number of Steps', type: 'number' },
              { label: 'Handrail Use', type: 'select', options: ['Bilateral', 'Unilateral', 'None'] },
              { label: 'Assistance', type: 'select', options: ['Min A', 'Mod A', 'Max A', 'SBA', 'CGA'] }
            ]
          },
          {
            name: 'Curb Negotiation',
            details: [
              { label: 'Height (inches)', type: 'select', options: ['2', '4', '6', '8'] },
              { label: 'Device', type: 'select', options: ['None', 'RW', 'PUW', 'SPC', 'Quad Cane'] },
              { label: 'Assistance', type: 'select', options: ['Min A', 'Mod A', 'Max A', 'SBA', 'CGA'] }
            ]
          }
        ]
      }
    ]
  },
  {
    code: '97530',
    description: 'Therapeutic Activities',
    modes: [
      {
        name: 'Functional Mobility',
        activities: [
          {
            name: 'Sit-to-Stand Transfers',
            details: [
              { label: 'Surface', type: 'select', options: ['Standard Chair', 'Low Bed', 'Toilet', 'Wheelchair'] },
              { label: 'Reps', type: 'number' },
              { label: 'Assistance', type: 'select', options: ['Min A', 'Mod A', 'Max A', 'Total A', 'SBA', 'CGA', 'Independent'] },
              { label: 'Cueing', type: 'select', options: ['Verbal', 'Visual', 'Tactile'] }
            ]
          },
          {
            name: 'Floor Transfers (Fall Recovery)',
            details: [
              { label: 'Technique', type: 'select', options: ['Half-kneel', 'Quadruped to chair', 'Side-sit to chair'] },
              { label: 'Assistance', type: 'select', options: ['Min A', 'Mod A', 'Max A', 'SBA', 'CGA'] },
              { label: 'Success', type: 'select', options: ['Yes', 'No'] }
            ]
          },
          {
            name: 'Bed Mobility',
            details: [
              { label: 'Task', type: 'select', options: ['Rolling', 'Supine to Sit', 'Scooting'] },
              { label: 'Assistance', type: 'select', options: ['Min A', 'Mod A', 'Max A', 'Total A', 'SBA', 'CGA', 'Independent'] }
            ]
          }
        ]
      },
      {
        name: 'Lifting/Carrying',
        activities: [
          {
            name: 'Proper Body Mechanics',
            details: [
              { label: 'Task', type: 'select', options: ['Floor to waist', 'Waist to crown', 'Carrying 10ft'] },
              { label: 'Weight (lbs)', type: 'select', options: ['1-5', '5-10', '10-20', '20+'] },
              { label: 'Technique', type: 'select', options: ['Good', 'Fair', 'Poor'] }
            ]
          },
          {
            name: 'Weighted Carries',
            details: [
              { label: 'Distance (ft)', type: 'select', options: ['10-25', '25-50', '50-100'] },
              { label: 'Weight (lbs)', type: 'select', options: ['1-5', '5-10', '10-20'] },
              { label: 'Assistance', type: 'select', options: ['Min A', 'Mod A', 'SBA', 'CGA'] }
            ]
          }
        ]
      }
    ]
  }
];
