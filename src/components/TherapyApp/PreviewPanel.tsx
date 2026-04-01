import React from 'react';
import { 
  RefreshCw, 
  Wand2, 
  CheckCircle2, 
  AlertCircle, 
  Copy, 
  Save, 
  Trash2, 
  ChevronRight, 
  X,
  ShieldCheck,
  FileText
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { AuditResult, TherapyState } from '../../types';
import DOMPurify from 'dompurify';
import ReactMarkdown from 'react-markdown';

interface PreviewPanelProps {
  generatedNote: string | null;
  editedNote: string;
  isGenerating: boolean;
  isTumbling: boolean;
  isAuditing: boolean;
  isEditing: boolean;
  auditResult?: AuditResult;
  onEdit: (val: boolean) => void;
  onEditedNoteChange: (val: string) => void;
  onTumble: (instruction?: string) => void;
  onAudit: () => void;
  onSaveTemplate: () => void;
  onFinalize: () => void;
  onCopy: () => void;
  tumbleInstructions: string;
  onTumbleInstructionsChange: (val: string) => void;
  showTumbleOptions: boolean;
  onToggleTumbleOptions: (val: boolean) => void;
  error: string | null;
  groundingMetadata?: any;
  SNFTemplates: any[];
  generateNursingHandOff: (note: string, state: TherapyState) => string;
  state: TherapyState;
}

export function PreviewPanel({
  generatedNote,
  editedNote,
  isGenerating,
  isTumbling,
  isAuditing,
  isEditing,
  auditResult,
  onEdit,
  onEditedNoteChange,
  onTumble,
  onAudit,
  onSaveTemplate,
  onFinalize,
  onCopy,
  tumbleInstructions,
  onTumbleInstructionsChange,
  showTumbleOptions,
  onToggleTumbleOptions,
  error,
  groundingMetadata,
  SNFTemplates,
  generateNursingHandOff,
  state
}: PreviewPanelProps) {
  if (isGenerating) {
    return (
      <div className="w-full md:w-[480px] h-full bg-zinc-50 border-l border-zinc-100 flex flex-col items-center justify-center p-12 text-center">
        <div className="relative mb-10">
          <div className="w-24 h-24 border-4 border-zinc-200 border-t-zinc-950 rounded-full animate-spin" />
          <Wand2 className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 text-zinc-950" />
        </div>
        <h2 className="text-2xl font-black tracking-tighter text-zinc-950 mb-4">Drafting Clinical Note</h2>
        <p className="text-sm font-medium text-zinc-500 leading-relaxed max-w-xs">
          Our AI is synthesizing your inputs with Medicare guidelines and clinical best practices...
        </p>
      </div>
    );
  }

  if (!generatedNote) {
    return (
      <div className="w-full md:w-[480px] h-full bg-zinc-50 border-l border-zinc-100 flex flex-col items-center justify-center p-12 text-center">
        <div className="w-20 h-20 bg-white rounded-[2rem] flex items-center justify-center shadow-xl shadow-zinc-200 mb-10">
          <FileText className="w-8 h-8 text-zinc-200" />
        </div>
        <h2 className="text-xl font-black tracking-tighter text-zinc-950 mb-4">No Note Generated</h2>
        <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest leading-relaxed max-w-[200px]">
          Complete the steps to the left to generate your clinical documentation.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full md:w-[480px] h-full bg-zinc-50 border-l border-zinc-100 flex flex-col overflow-hidden">
      <div className="p-4 md:p-8 border-b border-zinc-100 bg-white">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-4 md:mb-8 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-zinc-950 rounded-lg flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-sm font-black tracking-tight text-zinc-950 uppercase tracking-widest">Clinical Preview</h2>
          </div>
          <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
            <button 
              onClick={onCopy}
              className="p-2.5 bg-zinc-50 text-zinc-600 rounded-xl hover:bg-zinc-100 transition-all shrink-0"
              title="Copy to clipboard"
            >
              <Copy className="w-4 h-4" />
            </button>
            <button 
              onClick={onSaveTemplate}
              className="p-2.5 bg-zinc-50 text-zinc-600 rounded-xl hover:bg-zinc-100 transition-all shrink-0"
              title="Save as template"
            >
              <Save className="w-4 h-4" />
            </button>
            <button 
              onClick={() => {
                const handOff = generateNursingHandOff(editedNote || generatedNote || "", state);
                navigator.clipboard.writeText(handOff);
                alert("Nursing Hand-off (SBAR) copied to clipboard.");
              }}
              className="px-4 py-2.5 bg-zinc-50 text-zinc-600 rounded-xl hover:bg-zinc-100 transition-all shrink-0 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest"
              title="Nursing Hand-off (SBAR)"
            >
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">Nursing Hand-off</span>
            </button>
          </div>
        </div>

        {/* SNF Templates */}
        <div className="mb-6">
          <h3 className="text-[8px] font-black uppercase tracking-widest text-zinc-400 mb-2">SNF Templates</h3>
          <div className="grid grid-cols-3 gap-2">
            {SNFTemplates.map(template => (
              <button
                key={template.id}
                onClick={() => onEditedNoteChange((editedNote || generatedNote || "") + "\n\n" + template.content)}
                className="text-[9px] font-bold text-zinc-600 bg-zinc-50 hover:bg-zinc-100 p-2 rounded-lg transition-all text-center"
              >
                {template.name}
              </button>
            ))}
          </div>
        </div>

        {auditResult && (
          <div className="p-6 rounded-3xl bg-zinc-950 text-white shadow-2xl shadow-zinc-200 mb-2">
            <div className="flex items-center justify-between mb-6">
              <div className="flex flex-col">
                <span className="text-[8px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-1">Compliance Score</span>
                <span className="text-3xl font-black tracking-tighter">{auditResult.complianceScore}%</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span className="text-[10px] font-black uppercase tracking-widest">Verified</span>
              </div>
            </div>
            
            <div className="space-y-3">
              {auditResult.findings.slice(0, 2).map((finding, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                  <AlertCircle className="w-3 h-3 text-amber-400 shrink-0 mt-0.5" />
                  <p className="text-[10px] font-medium leading-relaxed opacity-80">{finding}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
        <div className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-zinc-100 min-h-full relative group">
          <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
            <button 
              onClick={() => onEdit(!isEditing)}
              className="text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-zinc-950"
            >
              {isEditing ? 'Save View' : 'Edit Text'}
            </button>
          </div>

          {isEditing ? (
            <textarea
              className="w-full h-full min-h-[400px] text-sm font-medium leading-relaxed text-zinc-600 outline-none resize-none"
              value={editedNote}
              onChange={(e) => onEditedNoteChange(e.target.value)}
            />
          ) : (
            <div className="prose prose-zinc prose-sm max-w-none">
              <ReactMarkdown>{DOMPurify.sanitize(editedNote || generatedNote || "")}</ReactMarkdown>
            </div>
          )}
        </div>

        {groundingMetadata?.groundingChunks && (
          <div className="mt-8 p-6 rounded-3xl bg-zinc-50 border border-zinc-100">
            <div className="flex items-center gap-2 mb-4">
              <ShieldCheck className="w-4 h-4 text-zinc-400" />
              <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Sources & Clinical Knowledge</h3>
            </div>
            <div className="space-y-2">
              {groundingMetadata.groundingChunks.map((chunk: any, idx: number) => {
                const source = chunk.web || chunk.maps;
                if (!source) return null;
                return (
                  <a 
                    key={idx}
                    href={source.uri}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-xl bg-white border border-zinc-100 hover:border-zinc-950 transition-all group"
                  >
                    <div className="w-6 h-6 bg-zinc-50 rounded-lg flex items-center justify-center group-hover:bg-zinc-950 transition-all">
                      <ChevronRight className="w-3 h-3 text-zinc-400 group-hover:text-white transition-all" />
                    </div>
                    <div className="flex flex-col overflow-hidden">
                      <span className="text-[10px] font-bold text-zinc-950 truncate">{source.title || 'Clinical Reference'}</span>
                      <span className="text-[8px] font-medium text-zinc-400 truncate">{source.uri}</span>
                    </div>
                  </a>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="p-4 md:p-8 bg-white border-t border-zinc-100">
        <div className="flex flex-col gap-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Refine note..."
                className="w-full pl-4 md:pl-5 pr-10 md:pr-12 py-3 md:py-4 rounded-2xl bg-zinc-50 border-2 border-transparent focus:border-zinc-950 outline-none text-[10px] md:text-xs font-bold transition-all"
                value={tumbleInstructions}
                onChange={(e) => onTumbleInstructionsChange(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && onTumble()}
              />
              <button 
                onClick={() => onTumble()}
                disabled={isTumbling || !tumbleInstructions.trim()}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-zinc-400 hover:text-zinc-950 disabled:opacity-30 transition-all"
              >
                {isTumbling ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
            <button 
              onClick={() => onToggleTumbleOptions(!showTumbleOptions)}
              className="p-3 md:p-4 bg-zinc-50 text-zinc-600 rounded-2xl hover:bg-zinc-100 transition-all shrink-0"
            >
              <RefreshCw className={cn("w-4 h-4", isTumbling && "animate-spin")} />
            </button>
          </div>

          {showTumbleOptions && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[
                "Make it more concise",
                "Add more skilled terminology",
                "Focus more on safety",
                "Expand on functional impact"
              ].map(opt => (
                <button
                  key={opt}
                  onClick={() => onTumble(opt)}
                  className="text-[10px] font-bold text-zinc-500 bg-zinc-50 hover:bg-zinc-100 p-3 rounded-xl transition-all text-left"
                >
                  {opt}
                </button>
              ))}
            </div>
          )}

          <button 
            onClick={onFinalize}
            className="w-full py-4 md:py-5 bg-zinc-950 text-white rounded-2xl font-black text-xs md:text-sm shadow-xl shadow-zinc-200 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
          >
            <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5" />
            Finalize & Start Next Session
          </button>
        </div>
      </div>
      
      {error && (
        <div className="absolute bottom-8 left-8 right-8 p-4 bg-zinc-950 text-white rounded-2xl shadow-2xl flex items-center justify-between animate-in fade-in slide-in-from-bottom-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-4 h-4 text-red-400" />
            <span className="text-xs font-bold">{error}</span>
          </div>
          <button onClick={() => {}} className="p-1 hover:bg-white/10 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

// Add missing imports
import { Send } from 'lucide-react';
