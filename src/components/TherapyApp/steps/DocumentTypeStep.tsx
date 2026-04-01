import React from 'react';
import { motion } from 'motion/react';
import { FileText, Wand2, ChevronRight, Sparkles, Star, Trash2, Mic } from 'lucide-react';
import { StepContentProps } from '../../../types';
import { cn } from '../../../lib/utils';
import { useVoiceDictation } from '../../../hooks/useVoiceDictation';

export const DocumentTypeStep: React.FC<StepContentProps> = ({ 
  state, 
  setState, 
  handleNext, 
  brainDump, 
  setBrainDump, 
  brainDumpMode,
  setBrainDumpMode,
  isParsingBrainDump, 
  handleBrainDump,
  customTemplates,
  handleDeleteTemplate
}) => {
  const { isListening, toggleListening } = useVoiceDictation((transcript) => {
    setBrainDump(brainDump + ' ' + transcript);
  });

  const docTypes: { id: typeof state.documentType; label: string; desc: string }[] = [
    { id: 'Daily', label: 'Daily Note', desc: 'Standard treatment session documentation' },
    { id: 'Progress', label: 'Progress Report', desc: 'Periodic summary of patient progress' },
    { id: 'Assessment', label: 'Assessment', desc: 'Initial evaluation or re-evaluation' },
    { id: 'Recertification', label: 'Recertification', desc: 'Plan of care renewal documentation' },
    { id: 'Discharge', label: 'Discharge Note', desc: 'Final summary and transition plan' }
  ];

  return (
    <div className="space-y-12">
      <div className="space-y-4">
        <h2 className="text-4xl font-black tracking-tight text-zinc-950 uppercase italic">Document <span className="text-zinc-300 not-italic">Type</span></h2>
        <p className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Clinical documentation context</p>
      </div>
      
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

          {/* Mode Selection for Brain Dump */}
          <div className="flex flex-wrap gap-2">
            {docTypes.map(t => (
              <button
                key={t.id}
                onClick={() => setBrainDumpMode(t.id)}
                className={cn(
                  "px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest transition-all border-2",
                  brainDumpMode === t.id 
                    ? "bg-emerald-500 border-emerald-500 text-zinc-950" 
                    : "bg-white/5 border-white/10 text-zinc-400 hover:border-white/20"
                )}
              >
                {t.label}
              </button>
            ))}
          </div>

          <textarea
            className="w-full p-8 rounded-3xl bg-white/5 border-2 border-white/10 focus:border-emerald-500/50 outline-none transition-all text-sm font-medium min-h-[160px] resize-none placeholder:text-zinc-600"
            placeholder={`Paste or dictate your raw ${brainDumpMode} notes here. The AI will intelligently extract the discipline, document type, CPT codes, and clinical details for you...`}
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
          <div className="flex items-center gap-6 text-[9px] font-bold text-zinc-500 uppercase tracking-widest">
            <span className="flex items-center gap-2"><div className="w-1 h-1 bg-emerald-500 rounded-full" /> Auto-Discipline</span>
            <span className="flex items-center gap-2"><div className="w-1 h-1 bg-emerald-500 rounded-full" /> Auto-CPT</span>
            <span className="flex items-center gap-2"><div className="w-1 h-1 bg-emerald-500 rounded-full" /> Clinical Extraction</span>
          </div>
        </div>
      </div>

      <div className="space-y-8">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Standard Templates</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {docTypes.map((t) => (
            <button
              key={t.id}
              onClick={() => {
                setState({ 
                  ...state, 
                  documentType: t.id,
                  gapAnalysis: '',
                  gapAnswers: ''
                });
                handleNext();
              }}
              className={cn(
                "group p-8 rounded-[2rem] border-2 transition-all duration-500 text-left",
                state.documentType === t.id 
                  ? "bg-zinc-950 border-zinc-950 text-white shadow-2xl scale-[1.02]" 
                  : "bg-white border-zinc-100 text-zinc-600 hover:border-zinc-950 hover:scale-[1.02]"
              )}
            >
              <div className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center mb-6 transition-all duration-500",
                state.documentType === t.id ? "bg-white/10 text-white" : "bg-zinc-50 text-zinc-950 group-hover:bg-zinc-950 group-hover:text-white"
              )}>
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black uppercase tracking-tight mb-2">{t.label}</h3>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-relaxed">{t.desc}</p>
            </button>
          ))}
        </div>
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

