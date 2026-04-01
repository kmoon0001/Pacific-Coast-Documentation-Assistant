import React from 'react';
import { StepContentProps } from '../../types';
import { DisciplineStep } from './steps/DisciplineStep';
import { DocumentTypeStep } from './steps/DocumentTypeStep';
import { CPTCodeStep } from './steps/CPTCodeStep';
import { ICD10Step } from './steps/ICD10Step';
import { ModeStep } from './steps/ModeStep';
import { ActivityStep } from './steps/ActivityStep';
import { DetailsStep } from './steps/DetailsStep';
import { GenerateStep } from './steps/GenerateStep';

export const StepContent: React.FC<StepContentProps> = (props) => {
  const { step, currentSteps } = props;
  const currentStepName = currentSteps[step];

  switch (currentStepName) {
    case 'Discipline':
      return <DisciplineStep {...props} />;
    case 'Document Type':
      return <DocumentTypeStep {...props} />;
    case 'CPT Code':
      return <CPTCodeStep {...props} />;
    case 'ICD-10 Codes':
      return <ICD10Step {...props} />;
    case 'Mode':
      return <ModeStep {...props} />;
    case 'Activity':
      return <ActivityStep {...props} />;
    case 'Details':
      return <DetailsStep {...props} />;
    case 'Generate':
      return <GenerateStep {...props} />;
    default:
      return null;
  }
};
