import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Search, Plus, X, ChevronRight } from 'lucide-react';
import { StepContentProps } from '../../../types';
import { cn } from '../../../lib/utils';
import { ICD10_LIBRARY } from '../../../data/icd10Data';

export const ICD10Step: React.FC<Pick<StepContentProps, 'state' | 'setState' | 'handleNext'>> = ({ state, setState, handleNext }) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  const selectedCodes = state.icd10Codes || [];
  
  const filteredCodes = ICD10_LIBRARY.filter(c => 
    c.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.description.toLowerCase().includes(searchTerm.toLowerCase())
  ).slice(0, 10);

  const toggleCode = (code: string) => {
    const newCodes = selectedCodes.includes(code)
      ? selectedCodes.filter(c => c !== code)
      : [...selectedCodes, code];
    setState({ ...state, icd10Codes: newCodes });
  };

  return (
    <div className="space-y-12">
      <div className="space-y-4">
        <h2 className="text-4xl font-black tracking-tight text-zinc-950 uppercase italic">ICD-10 <span className="text-zinc-300 not-italic">Codes</span></h2>
        <p className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Medical diagnosis context</p>
      </div>

      <div className="space-y-8">
        <div className="relative group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-zinc-400 group-focus-within:text-zinc-950 transition-colors" />
          <input
            type="text"
            className="w-full pl-16 pr-8 py-8 rounded-[2rem] bg-zinc-50 border-2 border-transparent focus:border-zinc-950 focus:bg-white outline-none transition-all text-lg font-black uppercase tracking-tight placeholder:text-zinc-300"
            placeholder="Search diagnosis or code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredCodes.map((c) => (
            <button
              key={c.code}
              onClick={() => toggleCode(c.code)}
              className={cn(
                "p-6 rounded-2xl border-2 transition-all duration-300 text-left flex items-center justify-between group",
                selectedCodes.includes(c.code)
                  ? "bg-zinc-950 border-zinc-950 text-white shadow-xl"
                  : "bg-white border-zinc-100 text-zinc-600 hover:border-zinc-950"
              )}
            >
              <div className="flex-1 min-w-0 pr-4">
                <div className="flex items-center gap-3 mb-1">
                  <span className={cn(
                    "text-xs font-black uppercase tracking-widest",
                    selectedCodes.includes(c.code) ? "text-emerald-400" : "text-zinc-400"
                  )}>{c.code}</span>
                  <span className={cn(
                    "text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full",
                    selectedCodes.includes(c.code) ? "bg-white/10 text-white" : "bg-zinc-50 text-zinc-400"
                  )}>{c.category}</span>
                </div>
                <h3 className="text-sm font-bold truncate">{c.description}</h3>
              </div>
              <div className={cn(
                "w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-300",
                selectedCodes.includes(c.code) ? "bg-white/10 text-white rotate-45" : "bg-zinc-50 text-zinc-400 group-hover:bg-zinc-950 group-hover:text-white"
              )}>
                <Plus className="w-4 h-4" />
              </div>
            </button>
          ))}
        </div>

        {selectedCodes.length > 0 && (
          <div className="pt-8 border-t border-zinc-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Selected Diagnoses ({selectedCodes.length})</h3>
              <button 
                onClick={() => setState({ ...state, icd10Codes: [] })}
                className="text-[10px] font-black uppercase tracking-widest text-red-400 hover:text-red-600 transition-colors"
              >
                Clear All
              </button>
            </div>
            <div className="flex flex-wrap gap-3">
              {selectedCodes.map((code) => {
                const data = ICD10_LIBRARY.find(c => c.code === code);
                return (
                  <div key={code} className="flex items-center gap-3 px-4 py-2 bg-zinc-950 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-zinc-200">
                    <span>{code}</span>
                    <button onClick={() => toggleCode(code)} className="hover:text-red-400 transition-colors">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-end pt-12">
        <button
          onClick={handleNext}
          className="px-12 py-6 bg-zinc-950 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-zinc-950/20 flex items-center gap-4"
        >
          Continue
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
