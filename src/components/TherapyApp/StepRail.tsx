import React from 'react';
import { motion } from 'motion/react';
import { CheckCircle2 } from 'lucide-react';
import { cn } from '../../lib/utils';

interface StepRailProps {
  currentSteps: string[];
  step: number;
  setStep: (step: number) => void;
}

export const StepRail: React.FC<StepRailProps> = ({ currentSteps, step, setStep }) => {
  return (
    <div className="relative w-full md:h-full md:w-auto flex md:flex-col justify-center items-center px-4 md:px-0 py-4 md:py-0">
      <div className="flex flex-row md:flex-col justify-between items-center w-full md:h-full gap-8 md:gap-16 relative">
        {currentSteps.map((s, i) => (
          <button 
            key={s} 
            onClick={() => i < step && setStep(i)}
            disabled={i > step}
            className="group flex flex-col md:flex-row items-center gap-2 md:gap-4 relative z-10 shrink-0"
          >
            <div className={cn(
              "w-8 h-8 md:w-10 md:h-10 rounded-2xl flex items-center justify-center text-[10px] md:text-xs font-black transition-all duration-500 border-2 bg-white",
              i < step ? "border-zinc-950 text-zinc-950" : 
              i === step ? "border-zinc-950 text-zinc-950 shadow-xl scale-110" : 
              "border-zinc-200 text-zinc-400"
            )}>
              {i < step ? <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5" /> : i + 1}
            </div>
            
            {/* Label for Mobile (Below icon) */}
            <div className="md:hidden absolute -bottom-6 flex flex-col items-center whitespace-nowrap">
              <span className={cn(
                "text-[8px] font-black uppercase tracking-[0.2em] transition-all duration-500",
                i === step ? "text-zinc-950 opacity-100" : "text-zinc-400 opacity-0 group-hover:opacity-100"
              )}>
                {s}
              </span>
            </div>

            {/* Label for Desktop (Right of icon) */}
            <div className="hidden md:flex absolute left-14 flex-col items-start whitespace-nowrap">
              <span className={cn(
                "text-[9px] font-black uppercase tracking-[0.2em] transition-all duration-500",
                i === step ? "text-zinc-950 opacity-100" : "text-zinc-400 opacity-0 group-hover:opacity-100"
              )}>
                {s}
              </span>
              {i === step && (
                <motion.span 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-[7px] font-bold text-zinc-400 uppercase tracking-widest mt-0.5"
                >
                  ~{Math.max(1, (currentSteps.length - i) * 0.5)}m left
                </motion.span>
              )}
            </div>
          </button>
        ))}
        
        {/* Connecting Line (Horizontal for Mobile) */}
        <div className="md:hidden absolute top-[15px] left-8 right-8 h-[2px] bg-zinc-200 -z-10">
          <motion.div 
            className="h-full bg-zinc-950"
            initial={{ width: 0 }}
            animate={{ width: `${(step / (currentSteps.length - 1)) * 100}%` }}
            transition={{ duration: 0.8, ease: "circOut" }}
          />
        </div>

        {/* Connecting Line (Vertical for Desktop) */}
        <div className="hidden md:block absolute left-5 top-5 bottom-5 w-[2px] bg-zinc-200 -z-10">
          <motion.div 
            className="w-full bg-zinc-950"
            initial={{ height: 0 }}
            animate={{ height: `${(step / (currentSteps.length - 1)) * 100}%` }}
            transition={{ duration: 0.8, ease: "circOut" }}
          />
        </div>
      </div>
    </div>
  );
};
