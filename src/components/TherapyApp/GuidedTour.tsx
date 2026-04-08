import React from 'react';
import { SpeechBubble } from '../Tour/SpeechBubble';
import { TourOverlay } from '../Tour/TourOverlay';
import { useTour } from '../../hooks/useTour';

interface GuidedTourProps {
  isActive: boolean;
  onClose: () => void;
}

export function GuidedTour({ isActive, onClose }: GuidedTourProps) {
  const {
    currentStep,
    currentStepIndex,
    totalSteps,
    targetElement,
    isFirstStep,
    isLastStep,
    handleNext,
    handlePrevious,
    handleSkip,
  } = useTour(isActive);

  if (!isActive || !currentStep) return null;

  const handleSkipTour = () => {
    handleSkip();
    onClose();
  };

  const handleNextStep = () => {
    if (isLastStep) {
      handleSkipTour();
    } else {
      handleNext();
    }
  };

  return (
    <>
      <TourOverlay targetElement={targetElement} allowInteraction={currentStep.allowInteraction} />
      <SpeechBubble
        title={currentStep.title}
        content={currentStep.content}
        position={currentStep.position}
        targetElement={targetElement}
        currentStep={currentStepIndex + 1}
        totalSteps={totalSteps}
        onNext={handleNextStep}
        onPrevious={handlePrevious}
        onSkip={handleSkipTour}
        showPrevious={!isFirstStep}
        showNext={true}
      />
    </>
  );
}
