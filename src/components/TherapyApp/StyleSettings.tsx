import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight, Trash2 } from 'lucide-react';
import { cn } from '../../lib/utils';

interface StyleSettingsProps {
  show: boolean;
  onClose: () => void;
  userStyle: string;
  setUserStyle: (style: string) => void;
  userStyleSamples: string[];
  setUserStyleSamples: (samples: string[]) => void;
  saveUserStyleSample: (sample: string) => void;
  isLocalMode: boolean;
  onToggleLocalMode: () => void;
}

export const StyleSettings: React.FC<StyleSettingsProps> = ({
  show,
  onClose,
  userStyle,
  setUserStyle,
  userStyleSamples,
  setUserStyleSamples,
  saveUserStyleSample,
  isLocalMode,
  onToggleLocalMode,
}) => {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          className="fixed top-24 right-6 w-96 bg-white rounded-[2.5rem] shadow-2xl border border-zinc-100 p-10 z-50 overflow-hidden"
        >
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-xs uppercase tracking-[0.2em] text-zinc-900">
                AI Configuration
              </h3>
              <button onClick={onClose} className="text-zinc-400 hover:text-zinc-950">
                <ChevronRight className="w-5 h-5 rotate-90" />
              </button>
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                Writing Style Description
              </label>
              <textarea
                className="w-full p-6 rounded-3xl bg-zinc-50 border-2 border-transparent focus:border-zinc-950 focus:bg-white outline-none transition-all text-sm font-medium min-h-[120px] resize-none"
                placeholder="Describe your style (e.g., 'Direct and clinical', 'Detailed and descriptive')"
                value={userStyle}
                onChange={(e) => {
                  setUserStyle(e.target.value);
                }}
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                  Style Transfer Samples
                </label>
                <div className="flex items-center gap-3">
                  <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest">
                    {userStyleSamples.length}/5 Samples
                  </span>
                  {userStyleSamples.length > 0 && (
                    <button
                      onClick={() => {
                        setUserStyleSamples([]);
                      }}
                      className="text-[8px] font-black text-red-400 uppercase tracking-widest hover:text-red-600 transition-all"
                    >
                      Clear All
                    </button>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                {userStyleSamples.map((sample, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between bg-zinc-50 p-3 rounded-xl border border-zinc-100"
                  >
                    <span className="text-[10px] font-bold text-zinc-600 truncate max-w-[200px]">
                      {sample}
                    </span>
                    <button
                      onClick={() => {
                        const newSamples = userStyleSamples.filter((_, idx) => idx !== i);
                        setUserStyleSamples(newSamples);
                      }}
                      className="text-zinc-400 hover:text-red-500"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                {userStyleSamples.length < 5 && (
                  <div className="space-y-2">
                    <textarea
                      id="new-sample-input"
                      className="w-full p-4 rounded-2xl bg-zinc-50 border-2 border-zinc-100 text-[10px] font-medium outline-none focus:border-zinc-950 transition-all min-h-[80px] resize-none"
                      placeholder="Paste a sample of your writing style here..."
                    />
                    <button
                      onClick={() => {
                        const el = document.getElementById(
                          'new-sample-input'
                        ) as HTMLTextAreaElement;
                        if (el && el.value.trim()) {
                          saveUserStyleSample(el.value.trim());
                          el.value = '';
                        }
                      }}
                      className="w-full py-3 bg-zinc-950 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all"
                    >
                      Add Style Sample
                    </button>
                  </div>
                )}
              </div>
            </div>
            <div className="pt-6 border-t border-zinc-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-widest text-zinc-950">
                    Local Processing Mode
                  </p>
                  <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mt-1">
                    Reduce API dependency
                  </p>
                </div>
                <button
                  onClick={onToggleLocalMode}
                  className={cn(
                    'w-12 h-6 rounded-full transition-all relative',
                    isLocalMode ? 'bg-emerald-500' : 'bg-zinc-200'
                  )}
                >
                  <div
                    className={cn(
                      'absolute top-1 w-4 h-4 bg-white rounded-full transition-all',
                      isLocalMode ? 'right-1' : 'left-1'
                    )}
                  />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
