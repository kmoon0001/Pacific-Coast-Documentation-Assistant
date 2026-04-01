import React from 'react';
import { Activity, ClipboardList, Trash2, Settings, ShieldCheck } from 'lucide-react';

interface HeaderProps {
  onReset: () => void;
  onSanitize: () => void;
  onOpenSettings: () => void;
  onOpenClipboard: () => void;
  clipboardLength: number;
  showStyleSettings: boolean;
}

export const Header: React.FC<HeaderProps> = ({ 
  onReset, 
  onSanitize,
  onOpenSettings, 
  onOpenClipboard, 
  clipboardLength,
  showStyleSettings
}) => {
  return (
    <header className="fixed top-0 left-0 right-0 h-20 bg-white/80 backdrop-blur-xl border-b border-zinc-100 z-50">
      <div className="max-w-[100rem] mx-auto px-8 h-full flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-zinc-950 rounded-xl flex items-center justify-center shadow-lg shadow-zinc-200">
            <Activity className="text-white w-5 h-5" />
          </div>
          <div>
            <h1 className="font-black text-xl tracking-tighter uppercase">TheraDoc <span className="text-emerald-500">AI</span></h1>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">v2026.1 Clinical AI</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={onSanitize}
            className="p-3 hover:bg-red-50 rounded-xl transition-all text-zinc-400 hover:text-red-600 group relative"
            title="HIPAA Sanitization (Clear History)"
          >
            <ShieldCheck className="w-5 h-5 transition-transform group-hover:scale-110" />
            <span className="absolute -bottom-8 right-0 bg-zinc-900 text-white text-[8px] font-black px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">HIPAA CLEAN</span>
          </button>
          <button 
            onClick={onOpenClipboard}
            className="relative p-3 hover:bg-zinc-100 rounded-xl transition-all text-zinc-400 hover:text-zinc-950 group"
            title="Multi-Note Clipboard"
          >
            <ClipboardList className="w-5 h-5 transition-transform group-hover:scale-110" />
            {clipboardLength > 0 && (
              <span className="absolute top-2 right-2 w-2 h-2 bg-emerald-500 rounded-full" />
            )}
          </button>
          <button 
            onClick={onReset}
            className="p-3 hover:bg-zinc-100 rounded-xl transition-all text-zinc-400 hover:text-red-500 group"
            title="Reset Form"
          >
            <Trash2 className="w-5 h-5 transition-transform group-hover:rotate-12" />
          </button>
          <button 
            onClick={onOpenSettings}
            className="p-3 hover:bg-zinc-100 rounded-xl transition-all group"
            title="Style Settings"
          >
            <Settings className={`w-5 h-5 transition-transform group-hover:rotate-90 ${showStyleSettings ? 'text-zinc-950' : 'text-zinc-600'}`} />
          </button>
        </div>
      </div>
    </header>
  );
};
