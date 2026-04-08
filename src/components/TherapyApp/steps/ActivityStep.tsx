import React from 'react';
import { Clock, Activity } from 'lucide-react';
import { useSession } from '../../../contexts/TherapySessionContext';
import { ST_DATA, OT_DATA, PT_DATA } from '../../../data/therapyData';
import { cn } from '../../../lib/utils';

export const ActivityStep: React.FC = () => {
  const { state, setState, handleNext } = useSession();
  const therapyCatalog =
    state.discipline === 'ST' ? ST_DATA : state.discipline === 'OT' ? OT_DATA : PT_DATA;
  const currentCpt = therapyCatalog.find((code) => code.code === state.cptCode);
  const availableModes = currentCpt?.modes ?? [];
  const resolvedMode = availableModes.find((mode) => mode.name === state.mode) ?? availableModes[0];
  const activities = resolvedMode?.activities ?? [];

  const header = (
    <div className="space-y-4">
      <h2 className="text-4xl font-black tracking-tight text-zinc-950 uppercase italic">
        Clinical <span className="text-zinc-300 not-italic">Activity</span>
      </h2>
      <p className="text-sm font-bold text-zinc-400 uppercase tracking-widest">
        Specific intervention focus
      </p>
    </div>
  );

  if (!currentCpt) {
    return (
      <div className="space-y-12">
        {header}
        <div className="p-8 rounded-[2rem] border-2 border-dashed border-zinc-200 text-center bg-white">
          <p className="text-sm font-bold text-zinc-500">
            Select a CPT code before choosing an activity.
          </p>
          <p className="text-[10px] uppercase tracking-widest text-zinc-400 mt-2">
            Your CPT choice unlocks the appropriate clinical activities.
          </p>
        </div>
      </div>
    );
  }

  if (!activities.length) {
    return (
      <div className="space-y-12">
        {header}
        <div className="p-8 rounded-[2rem] border-2 border-dashed border-amber-200 bg-amber-50">
          <p className="text-sm font-bold text-amber-700">
            No activities available for {resolvedMode?.name ?? 'this mode'}.
          </p>
          <p className="text-[10px] uppercase tracking-widest text-amber-600 mt-2">
            Update your therapy data catalog to continue.
          </p>
        </div>
      </div>
    );
  }

  const handleActivitySelect = (activityName: string) => {
    setState({ ...state, activity: activityName });
    handleNext();
  };

  return (
    <div className="space-y-12">
      {header}
      <div className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
        <Clock className="w-3 h-3" />
        Showing activities for {resolvedMode?.name ?? 'selected mode'}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {activities.map((activity) => {
          const isSelected = state.activity === activity.name;
          return (
            <button
              key={activity.name}
              onClick={() => handleActivitySelect(activity.name)}
              className={cn(
                'group p-8 rounded-[2rem] border-2 transition-all duration-500 text-left relative overflow-hidden',
                isSelected
                  ? 'bg-zinc-950 border-zinc-950 text-white shadow-2xl scale-[1.02]'
                  : 'bg-white border-zinc-100 text-zinc-600 hover:border-zinc-950 hover:scale-[1.02]'
              )}
              aria-pressed={isSelected}
            >
              <div
                className={cn(
                  'w-12 h-12 rounded-2xl flex items-center justify-center mb-6 transition-all duration-500',
                  isSelected
                    ? 'bg-white/10 text-white'
                    : 'bg-zinc-50 text-zinc-950 group-hover:bg-zinc-950 group-hover:text-white'
                )}
              >
                <Activity className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black uppercase tracking-tight mb-2">{activity.name}</h3>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-relaxed">
                {activity.name === 'Therapeutic Exercise'
                  ? 'Strengthening & ROM'
                  : activity.name === 'Neuromuscular Re-ed'
                    ? 'Balance & Coordination'
                    : activity.name === 'Therapeutic Activities'
                      ? 'Functional Tasks'
                      : 'Clinical intervention focus'}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
};
