import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';

interface GuidedTourProps {
  isActive: boolean;
  onClose: () => void;
}

const steps = [
  { title: "Welcome to TheraDoc", content: "This guided tour will help you get started with your clinical documentation." },
  { title: "Sidebar", content: "Access your history, clipboard, and style settings here." },
  { title: "Therapy Workflow", content: "Follow the steps to input patient data and generate your note." },
  { title: "Preview & Refine", content: "Review, edit, and refine your AI-generated note." }
];

export function GuidedTour({ isActive, onClose }: GuidedTourProps) {
  const [step, setStep] = useState(0);

  if (!isActive) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-zinc-950/50 z-50 flex items-center justify-center p-6"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-[2rem] p-8 max-w-md w-full shadow-2xl"
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-black">{steps[step].title}</h2>
            <button onClick={onClose} aria-label="Close guided tour" className="p-2 hover:bg-zinc-100 rounded-full"><X className="w-5 h-5" /></button>
          </div>
          <p className="text-zinc-600 mb-8">{steps[step].content}</p>
          <div className="flex justify-between items-center">
            <button onClick={() => setStep(s => Math.max(0, s - 1))} disabled={step === 0} className="px-4 py-2 text-sm font-bold disabled:opacity-30">Previous</button>
            <div className="text-xs font-bold text-zinc-400">{step + 1} / {steps.length}</div>
            <button onClick={() => step === steps.length - 1 ? onClose() : setStep(s => s + 1)} className="px-4 py-2 bg-zinc-950 text-white rounded-xl text-sm font-bold">
              {step === steps.length - 1 ? "Finish" : "Next"}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
