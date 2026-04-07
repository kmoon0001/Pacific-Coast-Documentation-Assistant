import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, Wand2, RefreshCw } from 'lucide-react';
import { StepRail } from './StepRail';
import { StepContent } from './StepContent';
import { useSession } from '../../contexts/TherapySessionContext';

export function MainContent() {
  const session = useSession();
  const {
    step,
    setStep,
    currentSteps,
    handleNext,
    handleBack,
    handleGenerate,
    isGenerating,
  } = session;

  return (
    <div className="flex-1 flex flex-col bg-white overflow-hidden relative">
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* StepRail: Horizontal on mobile, vertical on desktop */}
        <div className="md:w-20 border-b md:border-b-0 md:border-r border-zinc-100 flex md:flex-col items-center py-4 md:py-8 bg-zinc-50/30 overflow-x-auto md:overflow-x-visible scrollbar-hide">
          <div className="min-w-max px-4 md:px-0">
            <StepRail 
              step={step} 
              currentSteps={currentSteps} 
              setStep={setStep} 
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 custom-scrollbar">
          <div className="max-w-5xl mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              >
                <StepContent />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      <div className="p-3 md:p-6 border-t border-zinc-100 bg-white flex justify-between items-center px-4 md:px-8">
        <button
          onClick={handleBack}
          disabled={step === 0}
          className="flex items-center gap-2 text-xs md:text-sm font-black uppercase tracking-widest text-zinc-400 hover:text-zinc-950 disabled:opacity-20 transition-all group"
        >
          <div className="w-8 h-8 md:w-10 md:h-10 rounded-full border-2 border-zinc-100 flex items-center justify-center group-hover:border-zinc-950 transition-all">
            <ChevronLeft className="w-4 h-4 md:w-5 md:h-5" />
          </div>
          <span className="hidden sm:inline">Back</span>
        </button>

        <div className="flex items-center gap-3 md:gap-4">
          <div className="flex flex-col items-end hidden sm:flex">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Step {step + 1}/{currentSteps.length}</span>
            <span className="text-xs md:text-sm font-black text-zinc-950 truncate max-w-[120px]">{currentSteps[step]}</span>
          </div>
          
          {step === currentSteps.length - 1 ? (
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="bg-zinc-950 text-white px-4 md:px-8 py-2.5 md:py-4 rounded-2xl font-black text-xs shadow-2xl shadow-zinc-200 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 whitespace-nowrap"
            >
              {isGenerating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
              <span className="hidden sm:inline">Generate Note</span>
              <span className="sm:hidden">Generate</span>
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="bg-zinc-950 text-white px-4 md:px-8 py-2.5 md:py-4 rounded-2xl font-black text-xs shadow-2xl shadow-zinc-200 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 whitespace-nowrap"
            >
              <span className="hidden sm:inline">Next Step</span>
              <span className="sm:hidden">Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
