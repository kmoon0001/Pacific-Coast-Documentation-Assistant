import React from 'react';
import { Clock } from 'lucide-react';
import { useSession } from '../../../contexts/TherapySessionContext';
import { ST_DATA, OT_DATA, PT_DATA } from '../../../data/therapyData';
import { cn } from '../../../lib/utils';

export const ModeStep: React.FC = () => {
  const { state, setState, handleNext } = useSession();
  const currentData = {
    cptCodes: state.discipline === 'ST' ? ST_DATA : state.discipline === 'OT' ? OT_DATA : PT_DATA,
  };
  const currentCpt = currentData.cptCodes.find((c: any) => c.code === state.cptCode);

  return (
    <div className="space-y-12">
      <div className="space-y-4">
        <h2 className="text-4xl font-black tracking-tight text-zinc-950 uppercase italic">
          Treatment <span className="text-zinc-300 not-italic">Mode</span>
        </h2>
        <p className="text-sm font-bold text-zinc-400 uppercase tracking-widest">
          Clinical delivery context
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6" data-tour="mode">
        {currentCpt?.modes.map((m: any) => (
          <button
            key={m.name}
            onClick={() => {
              setState({ ...state, mode: m.name });
              handleNext();
            }}
            className={cn(
              'group p-10 rounded-[2rem] border-2 transition-all duration-500 text-left relative overflow-hidden',
              state.mode === m.name
                ? 'bg-zinc-950 border-zinc-950 text-white shadow-2xl scale-[1.02]'
                : 'bg-white border-zinc-100 text-zinc-600 hover:border-zinc-950 hover:scale-[1.02]'
            )}
          >
            <div className="flex items-center justify-between mb-6">
              <div
                className={cn(
                  'w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-black transition-all duration-500',
                  state.mode === m.name
                    ? 'bg-white/10 text-white'
                    : 'bg-zinc-50 text-zinc-950 group-hover:bg-zinc-950 group-hover:text-white'
                )}
              >
                {m.name[0]}
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-zinc-400" />
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                  15 Min Unit
                </span>
              </div>
            </div>
            <h3 className="text-lg font-black uppercase tracking-tight mb-2">{m.name}</h3>
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-relaxed">
              {m.name === 'Individual'
                ? 'One-on-one skilled intervention'
                : m.name === 'Group'
                  ? 'Concurrent or group therapy session'
                  : 'Clinical delivery context'}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
};
