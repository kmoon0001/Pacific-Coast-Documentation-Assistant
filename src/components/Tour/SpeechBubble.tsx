import React, { useEffect, useRef } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

export interface SpeechBubbleProps {
  title: string;
  content: string;
  position: 'top' | 'bottom' | 'left' | 'right' | 'center';
  targetElement?: HTMLElement | null;
  currentStep: number;
  totalSteps: number;
  onNext: () => void;
  onPrevious: () => void;
  onSkip: () => void;
  showPrevious?: boolean;
  showNext?: boolean;
}

export const SpeechBubble: React.FC<SpeechBubbleProps> = ({
  title,
  content,
  position,
  targetElement,
  currentStep,
  totalSteps,
  onNext,
  onPrevious,
  onSkip,
  showPrevious = true,
  showNext = true,
}) => {
  const bubbleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (bubbleRef.current && targetElement) {
      const bubble = bubbleRef.current;
      const target = targetElement.getBoundingClientRect();
      const bubbleRect = bubble.getBoundingClientRect();

      let top = 0;
      let left = 0;

      switch (position) {
        case 'top':
          top = target.top - bubbleRect.height - 20;
          left = target.left + target.width / 2 - bubbleRect.width / 2;
          break;
        case 'bottom':
          top = target.bottom + 20;
          left = target.left + target.width / 2 - bubbleRect.width / 2;
          break;
        case 'left':
          top = target.top + target.height / 2 - bubbleRect.height / 2;
          left = target.left - bubbleRect.width - 20;
          break;
        case 'right':
          top = target.top + target.height / 2 - bubbleRect.height / 2;
          left = target.right + 20;
          break;
        case 'center':
          top = window.innerHeight / 2 - bubbleRect.height / 2;
          left = window.innerWidth / 2 - bubbleRect.width / 2;
          break;
      }

      // Keep bubble within viewport
      top = Math.max(20, Math.min(top, window.innerHeight - bubbleRect.height - 20));
      left = Math.max(20, Math.min(left, window.innerWidth - bubbleRect.width - 20));

      bubble.style.top = `${top}px`;
      bubble.style.left = `${left}px`;
    }
  }, [targetElement, position]);

  const getArrowClass = () => {
    const baseClass = 'absolute w-0 h-0 border-solid';
    switch (position) {
      case 'top':
        return `${baseClass} border-t-[12px] border-t-white border-x-[12px] border-x-transparent bottom-[-12px] left-1/2 -translate-x-1/2`;
      case 'bottom':
        return `${baseClass} border-b-[12px] border-b-white border-x-[12px] border-x-transparent top-[-12px] left-1/2 -translate-x-1/2`;
      case 'left':
        return `${baseClass} border-l-[12px] border-l-white border-y-[12px] border-y-transparent right-[-12px] top-1/2 -translate-y-1/2`;
      case 'right':
        return `${baseClass} border-r-[12px] border-r-white border-y-[12px] border-y-transparent left-[-12px] top-1/2 -translate-y-1/2`;
      default:
        return '';
    }
  };

  return (
    <div
      ref={bubbleRef}
      className="fixed z-[10000] bg-white rounded-2xl shadow-2xl border-2 border-zinc-950 max-w-md animate-in fade-in zoom-in duration-300"
      style={{ position: 'fixed' }}
    >
      {/* Arrow */}
      {position !== 'center' && <div className={getArrowClass()} />}

      {/* Content */}
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                Step {currentStep} of {totalSteps}
              </span>
            </div>
            <h3 className="text-xl font-bold text-zinc-950">{title}</h3>
          </div>
          <button
            onClick={onSkip}
            className="p-1 hover:bg-zinc-100 rounded-lg transition-colors"
            title="Skip tour"
            aria-label="Skip tour"
          >
            <X className="w-5 h-5 text-zinc-600" />
          </button>
        </div>

        {/* Body */}
        <p className="text-zinc-700 leading-relaxed mb-6">{content}</p>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="h-1 bg-zinc-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-zinc-950 transition-all duration-300"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between">
          <button
            onClick={onPrevious}
            disabled={!showPrevious}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Previous step"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </button>

          <div className="flex gap-1">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full transition-colors ${
                  i < currentStep ? 'bg-zinc-950' : 'bg-zinc-200'
                }`}
              />
            ))}
          </div>

          <button
            onClick={onNext}
            disabled={!showNext}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-zinc-950 hover:bg-zinc-800 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Next step"
          >
            {currentStep === totalSteps ? 'Finish' : 'Next'}
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
