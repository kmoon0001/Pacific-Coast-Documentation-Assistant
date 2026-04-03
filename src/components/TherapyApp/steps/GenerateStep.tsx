import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  RefreshCw, 
  Copy, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  Save, 
  Clock, 
  Trash2
} from 'lucide-react';
import { useSession } from '../../../contexts/TherapySessionContext';
import { cn } from '../../../lib/utils';

export const GenerateStep: React.FC = () => {
  const {
    state,
    handleGenerate,
    handleTumble,
    generatedNote,
    setGeneratedNote,
    editedNote,
    setEditedNote,
    isGenerating,
    isTumbling,
    isAuditing,
    auditResult,
    handleAudit,
    history,
    clipboard,
    setClipboard,
    finalizeSession,
    sanitizeHistory
  } = useSession();
  return (
    <div className="space-y-12">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-4">
          <h2 className="text-4xl font-black tracking-tight text-zinc-950 uppercase italic">Clinical <span className="text-zinc-300 not-italic">Note</span></h2>
          <p className="text-sm font-bold text-zinc-400 uppercase tracking-widest">AI-generated documentation</p>
        </div>
        {!generatedNote && !isGenerating && (
          <button
            onClick={handleGenerate}
            className="w-full md:w-auto px-12 py-6 bg-zinc-950 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-zinc-950/20 flex items-center justify-center gap-4 group"
          >
            Generate Note
            <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
          </button>
        )}
      </div>

      {isGenerating ? (
        <div className="flex flex-col items-center justify-center py-32 space-y-8">
          <div className="relative">
            <div className="w-24 h-24 border-4 border-zinc-100 border-t-zinc-950 rounded-full animate-spin" />
            <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 text-zinc-950 animate-pulse" />
          </div>
          <div className="text-center space-y-3">
            <p className="text-lg font-black uppercase tracking-widest text-zinc-950">Synthesizing Clinical Data</p>
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.3em] animate-pulse">Applying Medicare Compliance Rules...</p>
          </div>
        </div>
      ) : generatedNote ? (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
          <div className="xl:col-span-8 space-y-8">
            <div className="bg-zinc-50 rounded-[2.5rem] p-10 border-2 border-zinc-100 relative group">
              <div className="absolute top-6 right-6 flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-all">
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(editedNote || generatedNote);
                  }}
                  className="p-3 bg-white hover:bg-zinc-950 text-zinc-400 hover:text-white rounded-xl border border-zinc-100 shadow-sm transition-all"
                  title="Copy to Clipboard"
                >
                  <Copy className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => {
                    const newNote = {
                      id: Date.now().toString(),
                      title: `${state.discipline} ${state.documentType} Note`,
                      content: editedNote || generatedNote,
                      date: new Date().toLocaleDateString()
                    };
                    const updated = [newNote, ...clipboard];
                    setClipboard(updated);
                    localStorage.setItem('noteClipboard', JSON.stringify(updated));
                  }}
                  className="p-3 bg-white hover:bg-zinc-950 text-zinc-400 hover:text-white rounded-xl border border-zinc-100 shadow-sm transition-all"
                  title="Add to Clipboard"
                >
                  <Save className="w-4 h-4" />
                </button>
              </div>
              <div className="prose prose-zinc prose-sm max-w-none">
                <textarea
                  className="w-full bg-transparent border-none focus:ring-0 text-zinc-950 font-medium leading-relaxed min-h-[500px] resize-none p-0"
                  value={editedNote || generatedNote}
                  onChange={(e) => setEditedNote(e.target.value)}
                  title="Edit note"
                  aria-label="Edit clinical note"
                  placeholder="Edit your clinical note here..."
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => handleTumble()}
                disabled={isTumbling}
                className="px-8 py-4 bg-white border-2 border-zinc-950 text-zinc-950 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-zinc-950 hover:text-white transition-all flex items-center gap-3 group disabled:opacity-50"
              >
                <RefreshCw className={cn("w-4 h-4 group-hover:rotate-180 transition-transform duration-700", isTumbling && "animate-spin")} />
                {isTumbling ? 'Tumbling...' : 'Tumble Style'}
              </button>
              <button
                onClick={handleAudit}
                disabled={isAuditing}
                className="px-8 py-4 bg-zinc-100 hover:bg-zinc-200 text-zinc-950 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center gap-3 group disabled:opacity-50"
              >
                <ShieldCheck className={cn("w-4 h-4", isAuditing && "animate-pulse text-emerald-500")} />
                {isAuditing ? 'Auditing...' : 'AI Compliance Audit'}
              </button>
              <button
                onClick={finalizeSession}
                className="px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 rounded-2xl font-black text-xs uppercase tracking-widest transition-all hover:scale-105 active:scale-95 flex items-center gap-3 shadow-xl shadow-emerald-500/20"
              >
                <CheckCircle2 className="w-4 h-4" />
                Finalize & New Session
              </button>
            </div>
          </div>

          <div className="xl:col-span-4 space-y-8">
            {/* Audit Results */}
            <AnimatePresence>
              {auditResult && (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-zinc-950 text-white rounded-[2rem] p-8 space-y-6 shadow-2xl shadow-zinc-950/20"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Compliance Audit</h3>
                    <div className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-[10px] font-black uppercase tracking-widest">
                      Score: {auditResult.complianceScore}%
                    </div>
                  </div>
                  <div className="space-y-4">
                    {auditResult.findings.map((f, i) => (
                      <div key={i} className="flex gap-4 group">
                        <div className="w-5 h-5 rounded-full bg-zinc-800 flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:bg-emerald-500/20 transition-colors">
                          <AlertCircle className="w-3 h-3 text-emerald-400" />
                        </div>
                        <p className="text-[11px] font-medium leading-relaxed text-zinc-300">{f}</p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Recent Sessions */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Recent Sessions</h3>
                <button 
                  onClick={sanitizeHistory}
                  className="p-2 hover:bg-red-50 text-zinc-300 hover:text-red-500 rounded-lg transition-all group"
                  title="Sanitize History (HIPAA)"
                >
                  <Trash2 className="w-4 h-4 transition-transform group-hover:scale-110" />
                </button>
              </div>
              <div className="space-y-4">
                {history.length === 0 ? (
                  <div className="p-8 rounded-3xl border-2 border-dashed border-zinc-100 text-center">
                    <Clock className="w-8 h-8 text-zinc-100 mx-auto mb-3" />
                    <p className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest">No history yet</p>
                  </div>
                ) : (
                  history.slice(0, 3).map((h, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setGeneratedNote(h.content);
                        setEditedNote(h.content);
                      }}
                      className="w-full p-6 bg-white border border-zinc-100 rounded-3xl text-left hover:border-zinc-950 transition-all group"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400">{h.timestamp}</span>
                        <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400">{h.type}</span>
                      </div>
                      <p className="text-xs font-bold text-zinc-950 line-clamp-2 group-hover:text-zinc-950 transition-colors">{h.content}</p>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-32 space-y-8 border-2 border-dashed border-zinc-100 rounded-[2.5rem]">
          <div className="w-20 h-20 bg-zinc-50 rounded-full flex items-center justify-center">
            <Sparkles className="w-10 h-10 text-zinc-200" />
          </div>
          <div className="text-center space-y-3">
            <p className="text-lg font-black uppercase tracking-widest text-zinc-300">Ready for Synthesis</p>
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.3em]">Click Generate to build clinical note</p>
          </div>
        </div>
      )}
    </div>
  );
};
