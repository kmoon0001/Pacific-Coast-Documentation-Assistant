import React from 'react';
import { Mic } from 'lucide-react';
import { useVoiceDictation } from '../../hooks/useVoiceDictation';
import { cn } from '../../lib/utils';

export const VoiceInput = ({ onTranscript }: { onTranscript: (t: string) => void }) => {
  const { isListening, toggleListening } = useVoiceDictation(onTranscript);
  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        toggleListening();
      }}
      className={cn(
        "p-2 rounded-full transition-all",
        isListening ? "bg-red-500 text-white" : "bg-zinc-100 text-zinc-400 hover:bg-zinc-200"
      )}
    >
      <Mic className="w-4 h-4" />
    </button>
  );
};
