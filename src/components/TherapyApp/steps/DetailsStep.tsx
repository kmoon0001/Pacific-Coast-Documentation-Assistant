import React from 'react';
import { ChevronLeft, Plus, X, Sparkles } from 'lucide-react';
import { useSession } from '../../../contexts/TherapySessionContext';
import { ST_DATA, OT_DATA, PT_DATA } from '../../../data/therapyData';
import { cn } from '../../../lib/utils';
import { VoiceInput } from '../VoiceInput';

export const DetailsStep: React.FC = () => {
  const {
    state,
    setState,
    handleNext,
    handleBack,
    customTemplates,
    handleDeleteTemplate,
    handleSaveTemplate
  } = useSession();
  const currentData = { cptCodes: state.discipline === 'ST' ? ST_DATA : state.discipline === 'OT' ? OT_DATA : PT_DATA };
  const currentCpt = currentData.cptCodes.find((c: any) => c.code === state.cptCode);
  const currentMode = currentCpt?.modes.find((m: any) => m.name === state.mode);
  const currentActivity = currentMode?.activities.find((a: any) => a.name === state.activity);

  const loadTemplate = (template: any) => {
    setState({
      ...state,
      details: template.state.details
    });
  };

  const matchingTemplates = customTemplates.filter(t => 
    t.state.discipline === state.discipline &&
    t.state.documentType === state.documentType &&
    t.state.cptCode === state.cptCode &&
    t.state.mode === state.mode &&
    t.state.activity === state.activity
  );

  return (
    <div className="space-y-12">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-4">
          <h2 className="text-4xl font-black tracking-tight text-zinc-950 uppercase italic">Clinical <span className="text-zinc-300 not-italic">Details</span></h2>
          <p className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Intervention parameters & observations</p>
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto">
          <button 
            onClick={handleSaveTemplate}
            className="w-full md:w-auto px-6 py-3 bg-white border-2 border-zinc-950 text-zinc-950 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-zinc-950 hover:text-white transition-all flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Save as Template
          </button>
        </div>
      </div>

      {matchingTemplates.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Your Templates</h3>
          <div className="flex flex-wrap gap-3">
            {matchingTemplates.map(t => (
              <button
                key={t.name}
                onClick={() => loadTemplate(t)}
                className="group px-6 py-3 bg-zinc-50 hover:bg-zinc-950 text-zinc-600 hover:text-white rounded-2xl border-2 border-transparent hover:border-zinc-950 transition-all flex items-center gap-3"
              >
                <span className="text-[10px] font-black uppercase tracking-widest">{t.name}</span>
                <X 
                  className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 hover:text-red-400 transition-all" 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteTemplate(t.name);
                  }}
                />
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {currentActivity?.details.map((d: any) => (
          <div key={d.label} className="space-y-4 group">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 group-focus-within:text-zinc-950 transition-colors">
              {d.label}
            </label>
            {d.type === 'select' ? (
              <div className="flex flex-wrap gap-3">
                {d.options.map((opt: string) => (
                  <button
                    key={opt}
                    onClick={() => setState({
                      ...state,
                      details: { ...state.details, [d.label]: opt }
                    })}
                    className={cn(
                      "px-4 py-2.5 rounded-xl border-2 transition-all duration-300 text-[10px] font-black uppercase tracking-widest truncate",
                      state.details[d.label] === opt
                        ? "bg-zinc-950 border-zinc-950 text-white shadow-xl scale-105"
                        : "bg-white border-zinc-100 text-zinc-400 hover:border-zinc-950 hover:text-zinc-950"
                    )}
                    title={opt}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            ) : d.type === 'multi-select' ? (
              <div className="flex flex-wrap gap-3">
                {d.options.map((opt: string) => {
                  const currentValues = state.details[d.label] || [];
                  const isSelected = currentValues.includes(opt);
                  return (
                    <button
                      key={opt}
                      onClick={() => {
                        const nextValues = isSelected
                          ? currentValues.filter((v: string) => v !== opt)
                          : [...currentValues, opt];
                        setState({
                          ...state,
                          details: { ...state.details, [d.label]: nextValues }
                        });
                      }}
                      className={cn(
                        "px-4 py-2.5 rounded-xl border-2 transition-all duration-300 text-[10px] font-black uppercase tracking-widest truncate",
                        isSelected
                          ? "bg-zinc-950 border-zinc-950 text-white shadow-xl scale-105"
                          : "bg-white border-zinc-100 text-zinc-400 hover:border-zinc-950 hover:text-zinc-950"
                      )}
                      title={opt}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="relative">
                <input
                  type={d.type === 'number' ? 'number' : 'text'}
                  className="w-full p-6 rounded-3xl bg-zinc-50 border-2 border-transparent focus:border-zinc-950 focus:bg-white outline-none transition-all text-sm font-bold"
                  placeholder={`Enter ${d.label.toLowerCase()}...`}
                  value={state.details[d.label] || ''}
                  onChange={(e) => setState({
                    ...state,
                    details: { ...state.details, [d.label]: e.target.value }
                  })}
                />
                <div className="absolute right-12 top-1/2 -translate-y-1/2">
                  <VoiceInput onTranscript={(t) => setState({
                    ...state,
                    details: { ...state.details, [d.label]: (state.details[d.label] || '') + ' ' + t }
                  })} />
                </div>
                {d.unit && (
                  <span className="absolute right-6 top-1/2 -translate-y-1/2 text-[10px] font-black uppercase tracking-widest text-zinc-400">
                    {d.unit}
                  </span>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex justify-between items-center pt-12 border-t border-zinc-100">
        <button
          onClick={handleBack}
          className="px-10 py-6 bg-white border-2 border-zinc-100 text-zinc-400 rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] hover:border-zinc-950 hover:text-zinc-950 transition-all flex items-center gap-4"
        >
          <ChevronLeft className="w-5 h-5" />
          Back
        </button>
        <button
          onClick={handleNext}
          className="px-12 py-6 bg-zinc-950 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-zinc-950/20 flex items-center gap-4 group"
        >
          Generate Note
          <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
        </button>
      </div>
    </div>
  );
};
