import React from 'react';
import { 
  Settings, 
  Trash2, 
  ShieldCheck, 
  Clock, 
  ClipboardList, 
  FileText,
  HelpCircle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { GeneratedNote } from '../../types';

interface SidebarProps {
  history: GeneratedNote[];
  clipboard: any[];
  isLocalMode: boolean;
  onToggleLocalMode: (val: boolean) => void;
  onSanitizeHistory: () => void;
  onShowStyleSettings: () => void;
  onOpenClipboard: () => void;
  onStartTour: () => void;
  modelDownloadProgress: number | null;
  isMinimized: boolean;
  onToggleMinimize: () => void;
}

export function Sidebar({ 
  history, 
  clipboard, 
  isLocalMode, 
  onToggleLocalMode, 
  onSanitizeHistory, 
  onShowStyleSettings,
  onOpenClipboard,
  onStartTour,
  modelDownloadProgress,
  isMinimized,
  onToggleMinimize
}: SidebarProps) {
  return (
    <div className={cn("border-r border-zinc-100 flex flex-col bg-white transition-all duration-300 h-full", isMinimized ? "w-20" : "w-80 md:w-80 w-full")}>
      <div className="p-4 md:p-8 border-b border-zinc-100">
        <div className="flex items-center justify-between mb-4 md:mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-zinc-950 rounded-xl flex items-center justify-center shadow-lg shadow-zinc-200 shrink-0">
              <FileText className="w-5 h-5 text-white" />
            </div>
            {(!isMinimized || window.innerWidth < 768) && (
              <div>
                <h1 className="text-xl font-black tracking-tighter text-zinc-950">TheraDoc</h1>
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">v2.5 Pro</span>
              </div>
            )}
          </div>
          <button onClick={onToggleMinimize} className="hidden md:block p-2 rounded-lg hover:bg-zinc-100 shrink-0">
            {isMinimized ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {(!isMinimized || window.innerWidth < 768) && (
          <div className="space-y-3">
            <button 
              onClick={onShowStyleSettings}
              className="w-full flex items-center gap-3 p-4 rounded-2xl text-xs font-bold text-zinc-600 hover:bg-zinc-50 transition-all border border-transparent hover:border-zinc-100"
            >
              <Settings className="w-4 h-4" />
              Style Settings
            </button>
            <button 
              onClick={onStartTour}
              className="w-full flex items-center gap-3 p-4 rounded-2xl text-xs font-bold text-zinc-600 hover:bg-zinc-50 transition-all border border-transparent hover:border-zinc-100"
            >
              <HelpCircle className="w-4 h-4" />
              Guided Tour
            </button>
            <button 
              onClick={onOpenClipboard}
              className="w-full flex items-center justify-between p-4 rounded-2xl text-xs font-bold text-zinc-600 hover:bg-zinc-50 transition-all border border-transparent hover:border-zinc-100"
            >
              <div className="flex items-center gap-3">
                <ClipboardList className="w-4 h-4" />
                Note Clipboard
              </div>
              {clipboard.length > 0 && (
                <span className="bg-zinc-950 text-white text-[8px] px-1.5 py-0.5 rounded-full">{clipboard.length}</span>
              )}
            </button>
            <button 
              onClick={onSanitizeHistory}
              className="w-full flex items-center gap-3 p-4 rounded-2xl text-xs font-bold text-red-500 hover:bg-red-50 transition-all border border-transparent hover:border-red-100"
            >
              <Trash2 className="w-4 h-4" />
              Sanitize Data
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
        {(!isMinimized || window.innerWidth < 768) && (
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 flex items-center gap-2">
              <Clock className="w-3 h-3" />
              Recent History
            </h2>
            <span className="text-[8px] font-bold text-zinc-300">{history.length} items</span>
          </div>
        )}
        
        <div className="space-y-4">
          {history.length === 0 ? (
            (!isMinimized || window.innerWidth < 768) && (
              <div className="p-8 rounded-3xl border-2 border-dashed border-zinc-100 flex flex-col items-center justify-center text-center">
                <Clock className="w-8 h-8 text-zinc-100 mb-3" />
                <p className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest">No history yet</p>
              </div>
            )
          ) : (
            history.map((item, idx) => (
              <div key={idx} className={cn("p-5 rounded-2xl bg-zinc-50 border border-zinc-100 hover:border-zinc-200 transition-all group cursor-default", (isMinimized && window.innerWidth >= 768) && "flex justify-center")}>
                {(isMinimized && window.innerWidth >= 768) ? (
                  <Clock className="w-4 h-4 text-zinc-400" />
                ) : (
                  <>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[8px] font-black uppercase tracking-widest text-zinc-400">{item.type}</span>
                      <span className="text-[8px] font-medium text-zinc-300">{item.timestamp}</span>
                    </div>
                    <p className="text-[11px] font-medium text-zinc-600 line-clamp-2 leading-relaxed">{item.content}</p>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      <div className="p-4 md:p-8 bg-zinc-50 border-t border-zinc-100">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className={cn("w-4 h-4", isLocalMode ? "text-emerald-500" : "text-zinc-300")} />
            {(!isMinimized || window.innerWidth < 768) && <span className="text-[10px] font-black uppercase tracking-widest text-zinc-900">Local Mode</span>}
          </div>
          <button
            aria-label="Toggle local mode"
            onClick={() => onToggleLocalMode(!isLocalMode)}
            className={cn(
              "w-10 h-5 rounded-full transition-all relative shrink-0",
              isLocalMode ? "bg-emerald-500" : "bg-zinc-200"
            )}
          >
            <div className={cn(
              "absolute top-1 w-3 h-3 bg-white rounded-full transition-all",
              isLocalMode ? "right-1" : "left-1"
            )} />
          </button>
        </div>
        {(!isMinimized || window.innerWidth < 768) && (
          <>
            <p className="text-[9px] font-medium text-zinc-400 leading-relaxed">
              {isLocalMode 
                ? "HIPAA Secure: All processing happens on your device. No data leaves this browser." 
                : "Cloud Enhanced: Using AWS Bedrock for deep clinical reasoning and Medicare compliance."}
            </p>
            {modelDownloadProgress !== null && (
              <div className="mt-4">
                <div className="flex justify-between text-[8px] font-black uppercase tracking-widest mb-1.5">
                  <span className="text-zinc-400">Downloading Model</span>
                  <span className="text-zinc-900">{Math.round(modelDownloadProgress)}%</span>
                </div>
                <div className="h-1 bg-zinc-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-zinc-950 transition-all duration-300" 
                    style={{ width: `${modelDownloadProgress}%` }}
                  />
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

