import React from 'react';
import { motion } from 'motion/react';
import { ChevronRight, Clock } from 'lucide-react';
import { StepContentProps } from '../../../types';
import { cn } from '../../../lib/utils';

export const ActivityStep: React.FC<Pick<StepContentProps, 'state' | 'setState' | 'handleNext' | 'currentData'>> = ({ state, setState, handleNext, currentData }) => {
  const currentCpt = currentData.cptCodes.find((c: any) => c.code === state.cptCode);
  const currentMode = currentCpt?.modes.find((m: any) => m.name === state.mode);

  return (
    <div className="space-y-12">
      <div className="space-y-4">
        <h2 className="text-4xl font-black tracking-tight text-zinc-950 uppercase italic">Clinical <span className="text-zinc-300 not-italic">Activity</span></h2>
        <p className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Specific intervention focus</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {currentMode?.activities.map((a: any) => (
          <button
            key={a.name}
            onClick={() => {
              setState({ ...state, activity: a.name });
              handleNext();
            }}
            className={cn(
              "group p-8 rounded-[2rem] border-2 transition-all duration-500 text-left relative overflow-hidden",
              state.activity === a.name 
                ? "bg-zinc-950 border-zinc-950 text-white shadow-2xl scale-[1.02]" 
                : "bg-white border-zinc-100 text-zinc-600 hover:border-zinc-950 hover:scale-[1.02]"
            )}
          >
            <div className={cn(
              "w-12 h-12 rounded-2xl flex items-center justify-center mb-6 transition-all duration-500",
              state.activity === a.name ? "bg-white/10 text-white" : "bg-zinc-50 text-zinc-950 group-hover:bg-zinc-950 group-hover:text-white"
            )}>
              <Activity className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black uppercase tracking-tight mb-2">{a.name}</h3>
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-relaxed">
              {a.name === 'Therapeutic Exercise' ? 'Strengthening & ROM' : 
               a.name === 'Neuromuscular Re-ed' ? 'Balance & Coordination' :
               a.name === 'Therapeutic Activities' ? 'Functional Tasks' :
               'Clinical intervention focus'}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
};

import { Activity } from 'lucide-react';
