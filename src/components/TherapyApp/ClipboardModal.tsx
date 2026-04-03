import React from 'react';
import { X, ClipboardList, Trash2, Copy, Clock } from 'lucide-react';

interface ClipboardModalProps {
  clipboard: {id: string, title: string, content: string, date: string}[];
  onClose: () => void;
  onAdd: (item: any) => void;
  onDelete: (id: string) => void;
}

export function ClipboardModal({ clipboard, onClose, onDelete }: ClipboardModalProps) {
  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-zinc-950/20 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl shadow-zinc-950/10 flex flex-col max-h-[80vh] overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-8 border-b border-zinc-100 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-zinc-950 rounded-xl flex items-center justify-center">
              <ClipboardList className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tighter text-zinc-950">Note Clipboard</h2>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">Store and reuse clinical snippets</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-zinc-100 rounded-full transition-colors">
            <X className="w-5 h-5 text-zinc-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          {clipboard.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-12">
              <div className="w-20 h-20 bg-zinc-50 rounded-[2rem] flex items-center justify-center mb-6">
                <ClipboardList className="w-8 h-8 text-zinc-200" />
              </div>
              <h3 className="text-lg font-black tracking-tight text-zinc-950 mb-2">Clipboard is Empty</h3>
              <p className="text-xs font-medium text-zinc-400 max-w-[240px] leading-relaxed">
                Save snippets from your notes to quickly reuse them in future sessions.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {clipboard.map((item) => (
                <div key={item.id} className="p-6 rounded-3xl bg-zinc-50 border border-zinc-100 group hover:border-zinc-200 transition-all">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm">
                        <Clock className="w-4 h-4 text-zinc-400" />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-zinc-950">{item.title}</h4>
                        <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">{item.date}</span>
                      </div>
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => handleCopy(item.content)}
                        className="p-2 bg-white text-zinc-600 rounded-lg hover:bg-zinc-100 transition-all border border-zinc-100"
                        title="Copy content"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={() => onDelete(item.id)}
                        className="p-2 bg-white text-red-500 rounded-lg hover:bg-red-50 transition-all border border-zinc-100"
                        title="Delete snippet"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <p className="text-xs font-medium text-zinc-500 leading-relaxed line-clamp-3">{item.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
