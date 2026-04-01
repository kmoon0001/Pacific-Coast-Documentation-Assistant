export interface ICD10Code {
  code: string;
  description: string;
  category: string;
}

export const ICD10_LIBRARY: ICD10Code[] = [
  // Neurological
  { code: 'I63.9', description: 'Cerebral infarction, unspecified', category: 'Neurological' },
  { code: 'G30.9', description: 'Alzheimer\'s disease, unspecified', category: 'Neurological' },
  { code: 'G20', description: 'Parkinson\'s disease', category: 'Neurological' },
  { code: 'G35', description: 'Multiple sclerosis', category: 'Neurological' },
  { code: 'I69.351', description: 'Hemiplegia and hemiparesis following cerebral infarction affecting right dominant side', category: 'Neurological' },
  { code: 'I69.354', description: 'Hemiplegia and hemiparesis following cerebral infarction affecting left non-dominant side', category: 'Neurological' },
  { code: 'I69.320', description: 'Aphasia following cerebral infarction', category: 'Neurological' },
  { code: 'I69.391', description: 'Dysphagia following cerebral infarction', category: 'Neurological' },
  { code: 'I69.322', description: 'Dysarthria following cerebral infarction', category: 'Neurological' },
  
  // Orthopedic
  { code: 'M17.11', description: 'Unilateral primary osteoarthritis, right knee', category: 'Orthopedic' },
  { code: 'M17.12', description: 'Unilateral primary osteoarthritis, left knee', category: 'Orthopedic' },
  { code: 'M16.11', description: 'Unilateral primary osteoarthritis, right hip', category: 'Orthopedic' },
  { code: 'M16.12', description: 'Unilateral primary osteoarthritis, left hip', category: 'Orthopedic' },
  { code: 'S72.001A', description: 'Fracture of unspecified part of neck of right femur, initial encounter', category: 'Orthopedic' },
  { code: 'S72.002A', description: 'Fracture of unspecified part of neck of left femur, initial encounter', category: 'Orthopedic' },
  { code: 'Z96.641', description: 'Presence of right artificial hip joint', category: 'Orthopedic' },
  { code: 'Z96.642', description: 'Presence of left artificial hip joint', category: 'Orthopedic' },
  { code: 'Z96.651', description: 'Presence of right artificial knee joint', category: 'Orthopedic' },
  { code: 'Z96.652', description: 'Presence of left artificial knee joint', category: 'Orthopedic' },
  
  // General/Functional
  { code: 'R26.81', description: 'Unsteadiness on feet', category: 'Functional' },
  { code: 'R26.89', description: 'Other abnormalities of gait and mobility', category: 'Functional' },
  { code: 'R26.2', description: 'Difficulty in walking, not elsewhere classified', category: 'Functional' },
  { code: 'R29.6', description: 'Repeated falls', category: 'Functional' },
  { code: 'M62.81', description: 'Muscle weakness (generalized)', category: 'Functional' },
  { code: 'R53.1', description: 'Weakness', category: 'Functional' },
  { code: 'R41.841', description: 'Cognitive communication deficit', category: 'Cognitive' },
  { code: 'R41.3', description: 'Other amnesia (Memory loss)', category: 'Cognitive' },
  { code: 'R13.10', description: 'Dysphagia, unspecified', category: 'Swallowing' },
  { code: 'R13.12', description: 'Dysphagia, oropharyngeal phase', category: 'Swallowing' },
  { code: 'R47.1', description: 'Dysarthria and anarthria', category: 'Speech' },
  { code: 'R47.01', description: 'Aphasia', category: 'Speech' },
  
  // Medical/Other
  { code: 'J44.9', description: 'Chronic obstructive pulmonary disease, unspecified', category: 'Medical' },
  { code: 'I50.9', description: 'Heart failure, unspecified', category: 'Medical' },
  { code: 'E11.9', description: 'Type 2 diabetes mellitus without complications', category: 'Medical' },
  { code: 'Z74.01', description: 'Bed confinement status', category: 'Medical' }
];
