import { useState, useEffect, useCallback } from 'react';
import { tourSteps } from '../data/tourSteps';

export function useTour(isActive: boolean) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);

  const currentStep = tourSteps[currentStepIndex];
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === tourSteps.length - 1;

  // Define handlers first
  const handleNext = useCallback(() => {
    if (currentStepIndex < tourSteps.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    }
  }, [currentStepIndex]);

  const handlePrevious = useCallback(() => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  }, [currentStepIndex]);

  const handleSkip = useCallback(() => {
    setCurrentStepIndex(0);
    // Save that user has completed/skipped tour
    localStorage.setItem('tourCompleted', 'true');
  }, []);

  const handleGoToStep = useCallback((index: number) => {
    if (index >= 0 && index < tourSteps.length) {
      setCurrentStepIndex(index);
    }
  }, []);

  const resetTour = useCallback(() => {
    setCurrentStepIndex(0);
    localStorage.removeItem('tourCompleted');
  }, []);

  // Find and set target element
  useEffect(() => {
    if (isActive && currentStep) {
      const element = document.querySelector(currentStep.target) as HTMLElement;
      setTargetElement(element);

      // Add highlight class to target
      if (element && currentStep.highlight) {
        element.classList.add('tour-highlight');
        element.style.position = 'relative';
        element.style.zIndex = '10000';
      }

      return () => {
        if (element && currentStep.highlight) {
          element.classList.remove('tour-highlight');
          element.style.position = '';
          element.style.zIndex = '';
        }
      };
    }
  }, [isActive, currentStep]);

  // Keyboard navigation
  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          handleSkip();
          break;
        case 'ArrowRight':
          if (!isLastStep) handleNext();
          break;
        case 'ArrowLeft':
          if (!isFirstStep) handlePrevious();
          break;
        case 'Enter':
          if (isLastStep) handleSkip();
          else handleNext();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isActive, currentStepIndex, isFirstStep, isLastStep, handleNext, handlePrevious, handleSkip]);

  return {
    currentStep,
    currentStepIndex,
    totalSteps: tourSteps.length,
    targetElement,
    isFirstStep,
    isLastStep,
    handleNext,
    handlePrevious,
    handleSkip,
    handleGoToStep,
    resetTour,
  };
}
