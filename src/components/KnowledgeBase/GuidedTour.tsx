import React, { useState, useEffect } from 'react';
import './GuidedTour.css';

export interface TourStep {
  id: string;
  title: string;
  description: string;
  target?: string; // CSS selector for element to highlight
  position?: 'top' | 'bottom' | 'left' | 'right';
  action?: () => void; // Optional action to perform
  highlightClass?: string;
}

export interface GuidedTourProps {
  isActive: boolean;
  onComplete: () => void;
  onSkip: () => void;
}

const TOUR_STEPS: TourStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Knowledge Base',
    description: 'This guided tour will show you how to use the Knowledge Base feature. You can upload, manage, and search clinical policies and procedures.',
    position: 'bottom',
  },
  {
    id: 'upload-section',
    title: 'Upload Documents',
    description: 'Click here to upload new documents (PDF, DOCX, TXT, MD). You can add metadata like title, description, category, and tags.',
    target: '[data-tour="upload-section"]',
    position: 'bottom',
  },
  {
    id: 'document-list',
    title: 'Document Library',
    description: 'View all your uploaded documents here. You can search, filter by category, sort, and manage documents.',
    target: '[data-tour="document-list"]',
    position: 'left',
  },
  {
    id: 'search-bar',
    title: 'Search Documents',
    description: 'Use the search bar to find documents by title, description, or content. Supports both keyword and semantic search.',
    target: '[data-tour="search-bar"]',
    position: 'bottom',
  },
  {
    id: 'filter-options',
    title: 'Filter & Sort',
    description: 'Filter documents by category (Policy, Procedure, Guidance, Regulation) and sort by name, date, or relevance.',
    target: '[data-tour="filter-options"]',
    position: 'bottom',
  },
  {
    id: 'document-preview',
    title: 'Preview Documents',
    description: 'Click on any document to preview its content, metadata, usage statistics, and audit history.',
    target: '[data-tour="document-preview"]',
    position: 'left',
  },
  {
    id: 'policy-panel',
    title: 'Policy Integration',
    description: 'View applicable policies for your current context. These policies are automatically injected into AI-generated notes.',
    target: '[data-tour="policy-panel"]',
    position: 'left',
  },
  {
    id: 'versioning',
    title: 'Document Versioning',
    description: 'Track document versions, compare changes, and restore previous versions. Each change is automatically recorded.',
    target: '[data-tour="versioning"]',
    position: 'bottom',
  },
  {
    id: 'relationships',
    title: 'Document Relationships',
    description: 'Link related documents (supersedes, related_to, depends_on). The system detects circular dependencies and conflicts.',
    target: '[data-tour="relationships"]',
    position: 'bottom',
  },
  {
    id: 'bulk-operations',
    title: 'Bulk Operations',
    description: 'Upload multiple documents, batch delete, or update tags and categories for multiple documents at once.',
    target: '[data-tour="bulk-operations"]',
    position: 'bottom',
  },
  {
    id: 'analytics',
    title: 'Analytics & Reporting',
    description: 'View usage statistics, policy adoption metrics, compliance scores, and trends over time.',
    target: '[data-tour="analytics"]',
    position: 'left',
  },
  {
    id: 'semantic-search',
    title: 'Semantic Search',
    description: 'Search using natural language. The system understands meaning, not just keywords, for better results.',
    target: '[data-tour="semantic-search"]',
    position: 'bottom',
  },
  {
    id: 'settings',
    title: 'Settings & Preferences',
    description: 'Configure cache settings, performance monitoring, security options, and restart this tour anytime.',
    target: '[data-tour="settings"]',
    position: 'left',
  },
  {
    id: 'completion',
    title: 'You\'re All Set!',
    description: 'You now understand the Knowledge Base features. Start by uploading your first document or exploring existing ones.',
    position: 'bottom',
  },
];

export const GuidedTour: React.FC<GuidedTourProps> = ({ isActive, onComplete, onSkip }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [highlightedElement, setHighlightedElement] = useState<HTMLElement | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });

  const step = TOUR_STEPS[currentStep];

  useEffect(() => {
    if (!isActive) return;

    // Highlight target element
    if (step.target) {
      const element = document.querySelector(step.target) as HTMLElement;
      if (element) {
        setHighlightedElement(element);
        element.classList.add('tour-highlight');
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });

        // Calculate tooltip position
        const rect = element.getBoundingClientRect();
        const position = step.position || 'bottom';

        let top = 0;
        let left = 0;

        switch (position) {
          case 'top':
            top = rect.top - 20;
            left = rect.left + rect.width / 2;
            break;
          case 'bottom':
            top = rect.bottom + 20;
            left = rect.left + rect.width / 2;
            break;
          case 'left':
            top = rect.top + rect.height / 2;
            left = rect.left - 20;
            break;
          case 'right':
            top = rect.top + rect.height / 2;
            left = rect.right + 20;
            break;
        }

        setTooltipPosition({ top, left });
      }
    }

    // Execute optional action
    if (step.action) {
      step.action();
    }

    return () => {
      if (highlightedElement) {
        highlightedElement.classList.remove('tour-highlight');
      }
    };
  }, [currentStep, highlightedElement, isActive, step]);

  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    onSkip();
  };

  if (!isActive) return null;

  return (
    <>
      {/* Overlay */}
      <div className="tour-overlay" onClick={handleSkip} />

      {/* Tooltip */}
      <div
        className={`tour-tooltip tour-tooltip-${step.position || 'bottom'}`}
        style={{
          top: `${tooltipPosition.top}px`,
          left: `${tooltipPosition.left}px`,
        }}
      >
        <div className="tour-tooltip-header">
          <h3 className="tour-tooltip-title">{step.title}</h3>
          <button className="tour-close" onClick={handleSkip}>
            ✕
          </button>
        </div>

        <p className="tour-tooltip-description">{step.description}</p>

        <div className="tour-tooltip-footer">
          <div className="tour-progress">
            Step {currentStep + 1} of {TOUR_STEPS.length}
          </div>

          <div className="tour-buttons">
            <button
              className="tour-btn tour-btn-secondary"
              onClick={handlePrevious}
              disabled={currentStep === 0}
            >
              ← Previous
            </button>

            <button
              className="tour-btn tour-btn-secondary"
              onClick={handleSkip}
            >
              Skip Tour
            </button>

            <button
              className="tour-btn tour-btn-primary"
              onClick={handleNext}
            >
              {currentStep === TOUR_STEPS.length - 1 ? 'Finish' : 'Next →'}
            </button>
          </div>
        </div>

        {/* Progress dots */}
        <div className="tour-dots">
          {TOUR_STEPS.map((_, index) => (
            <button
              key={index}
              className={`tour-dot ${index === currentStep ? 'active' : ''}`}
              onClick={() => setCurrentStep(index)}
              aria-label={`Go to step ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </>
  );
};

export default GuidedTour;
