import React from 'react';
import { DisciplineStep } from './steps/DisciplineStep';
import { DocumentTypeStep } from './steps/DocumentTypeStep';
import { CPTCodeStep } from './steps/CPTCodeStep';
import { ICD10Step } from './steps/ICD10Step';
import { ModeStep } from './steps/ModeStep';
import { ActivityStep } from './steps/ActivityStep';
import { DetailsStep } from './steps/DetailsStep';
import { GenerateStep } from './steps/GenerateStep';
import { useSession } from '../../contexts/TherapySessionContext';

export const StepContent: React.FC = () => {
  const { step, currentSteps } = useSession();
  const currentStepName = currentSteps[step];

  switch (currentStepName) {
    case 'Discipline':
      return <DisciplineStep />;
    case 'Document Type':
      return <DocumentTypeStep />;
    case 'CPT Code':
      return <CPTCodeStep />;
    case 'ICD-10 Codes':
      return <ICD10Step />;
    case 'Mode':
      return <ModeStep />;
    case 'Activity':
      return <ActivityStep />;
    case 'Details':
      return <DetailsStep />;
    case 'Generate':
      return <GenerateStep />;
    default:
      return null;
  }
};
