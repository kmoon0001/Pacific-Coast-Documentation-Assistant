import React from 'react';
import { Stethoscope, Activity, User, Star, Trash2, Wand2, Sparkles, Mic } from 'lucide-react';
import { Discipline } from '../../../types';
import { useSession } from '../../../contexts/TherapySessionContext';
import { cn } from '../../../lib/utils';
import { useVoiceDictation } from '../../../hooks/useVoiceDictation';

export const DisciplineStep: React.FC = () => {
  const {
    state,
    setState,
    handleNext,
    customTemplates,
    handleDeleteTemplate,
    brainDump,
    setBrainDump,
    isParsingBrainDump,
    handleBrainDump
  } = useSession();
  const { isListening, toggleListening } = useVoiceDictation((transcript) => {
    setBrainDump(brainDump + ' ' + transcript);
  });

  const disciplines: { id: Discipline; label: string; icon: any; color: string }[] = [
    { id: 'PT', label: 'Physical Therapy', icon: Activity, color: 'emerald' },
    { id: 'OT', label: 'Occupational Therapy', icon: Stethoscope, color: 'blue' },
    { id: 'ST', label: 'Speech Therapy', icon: User, color: 'purple' }
  ];

  return (
    <div className="space-y-12">
      {/* Brain Dump Section */}
      <div className="p-10 rounded-[2.5rem] bg-zinc-950 text-white shadow-2xl shadow-zinc-950/20 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -z-0 group-hover:scale-150 transition-all duration-1000" />
        <div className="relative z-10 space-y-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-xl shrink-0">
                <Wand2 className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-lg font-black uppercase tracking-tight">Clinical Brain Dump</h3>
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">AI-Powered Auto-Extraction</p>
              </div>
            </div>
            <button 
              onClick={handleBrainDump}
              disabled={isParsingBrainDump || !brainDump.trim()}
              className="w-full md:w-auto px-8 py-4 bg-emerald-500 hover:bg-emerald-400 disabled:bg-zinc-800 disabled:text-zinc-500 text-zinc-950 rounded-2xl font-black text-xs uppercase tracking-widest transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-3"
            >
              {isParsingBrainDump ? (
                <>
                  <div className="w-4 h-4 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Auto-Extract
                </>
              )}
            </button>
          </div>

          <textarea
            className="w-full p-8 rounded-3xl bg-white/5 border-2 border-white/10 focus:border-emerald-500/50 outline-none transition-all text-sm font-medium min-h-[160px] resize-none placeholder:text-zinc-600"
            placeholder={`Paste or dictate your raw notes here. The AI will intelligently extract the discipline, document type, CPT codes, and clinical details for you...`}
            value={brainDump}
            onChange={(e) => setBrainDump(e.target.value)}
          />
          <button
            onClick={toggleListening}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest transition-all border-2",
              isListening ? "bg-red-500 border-red-500 text-white" : "bg-white/5 border-white/10 text-zinc-400 hover:border-white/20"
            )}
          >
            <Mic className="w-3 h-3" />
            {isListening ? 'Stop Dictation' : 'Start Dictation'}
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-4xl font-black tracking-tight text-zinc-950 uppercase italic">Select <span className="text-zinc-300 not-italic">Discipline</span></h2>
        <p className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Clinical specialization context</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6" data-testid="discipline-grid">
        {disciplines.map((d) => (
          <button
            key={d.id}
            onClick={() => {
              setState({ ...state, discipline: d.id });
              handleNext();
            }}
            className={cn(
              "group p-10 rounded-[2rem] border-2 transition-all duration-500 text-left relative overflow-hidden",
              state.discipline === d.id 
                ? "bg-zinc-950 border-zinc-950 text-white shadow-2xl scale-[1.02]" 
                : "bg-white border-zinc-100 text-zinc-600 hover:border-zinc-950 hover:scale-[1.02]"
            )}
          >
            <d.icon className={cn(
              "w-10 h-10 mb-6 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6",
              state.discipline === d.id ? "text-white" : "text-zinc-950"
            )} />
            <h3 className="text-lg font-black uppercase tracking-tight mb-2">{d.label}</h3>
            <p className={cn(
              "text-[10px] font-bold uppercase tracking-widest",
              state.discipline === d.id ? "text-zinc-400" : "text-zinc-400"
            )}>
              {d.id === 'PT' ? 'Mobility & Function' : d.id === 'OT' ? 'ADLs & Cognition' : 'Speech & Swallowing'}
            </p>
            <div className={cn(
              "absolute -bottom-4 -right-4 w-24 h-24 rounded-full blur-3xl opacity-20 transition-all duration-500 group-hover:scale-150",
              d.id === 'PT' ? 'bg-emerald-500' : d.id === 'OT' ? 'bg-blue-500' : 'bg-purple-500'
            )} />
          </button>
        ))}
      </div>

      {customTemplates.length > 0 && (
        <div className="space-y-8 pt-12 border-t border-zinc-100">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Your Custom Templates</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {customTemplates.map((t, i) => (
              <div key={i} className="relative group">
                <button
                  onClick={() => {
                    setState({ ...t.state, auditResult: undefined });
                    handleNext();
                  }}
                  className="w-full p-8 rounded-[2rem] border-2 border-zinc-100 bg-white text-left hover:border-zinc-950 hover:scale-[1.02] transition-all duration-500"
                >
                  <div className="w-12 h-12 rounded-2xl bg-zinc-50 flex items-center justify-center mb-6 group-hover:bg-zinc-950 group-hover:text-white transition-all">
                    <Star className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-black uppercase tracking-tight mb-2">{t.name}</h3>
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-relaxed">
                    {t.state.discipline} • {t.state.documentType}
                  </p>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteTemplate(t.name);
                  }}
                  className="absolute top-6 right-6 p-2 bg-red-50 text-red-500 rounded-xl opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 hover:text-white"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

