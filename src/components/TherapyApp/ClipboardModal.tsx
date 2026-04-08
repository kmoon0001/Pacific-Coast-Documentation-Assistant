import React from 'react';
import { X, ClipboardList, Trash2, Copy, Clock } from 'lucide-react';

interface ClipboardModalProps {
  clipboard: { id: string; title: string; content: string; date: string }[];
  onClose: () => void;
  onAdd: (item: any) => void;
  onDelete: (id: string) => void;
}

export function ClipboardModal({ clipboard, onClose, onDelete }: ClipboardModalProps) {
  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/20 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="w-full max-w-lg bg-white rounded-[2rem] shadow-2xl shadow-zinc-950/10 flex flex-col max-h-[85vh] overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-4 md:p-5 border-b border-zinc-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 bg-zinc-950 rounded-xl flex items-center justify-center shrink-0">
              <ClipboardList className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-black tracking-tighter text-zinc-950 truncate">
                Note Clipboard
              </h2>
              <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-400 truncate">
                Store & reuse snippets
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-zinc-100 rounded-full transition-colors shrink-0"
          >
            <X className="w-4 h-4 text-zinc-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-5 custom-scrollbar">
          {clipboard.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8">
              <div className="w-16 h-16 bg-zinc-50 rounded-2xl flex items-center justify-center mb-4">
                <ClipboardList className="w-7 h-7 text-zinc-200" />
              </div>
              <h3 className="text-base font-black tracking-tight text-zinc-950 mb-2">
                Clipboard is Empty
              </h3>
              <p className="text-[10px] font-medium text-zinc-400 max-w-[220px] leading-relaxed">
                Save snippets from your notes to quickly reuse them in future sessions.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {clipboard.map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-2xl bg-zinc-50 border border-zinc-100 group hover:border-zinc-200 transition-all"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-6 h-6 bg-white rounded-lg flex items-center justify-center shadow-sm shrink-0">
                        <Clock className="w-3 h-3 text-zinc-400" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-black text-zinc-950 truncate">{item.title}</h4>
                        <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest">
                          {item.date}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <button
                        onClick={() => handleCopy(item.content)}
                        className="p-1.5 bg-white text-zinc-600 rounded-lg hover:bg-zinc-100 transition-all border border-zinc-100"
                        title="Copy content"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => onDelete(item.id)}
                        className="p-1.5 bg-white text-red-500 rounded-lg hover:bg-red-50 transition-all border border-zinc-100"
                        title="Delete snippet"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  <p className="text-[10px] font-medium text-zinc-500 leading-relaxed line-clamp-3">
                    {item.content}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
