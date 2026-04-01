import { useState, useEffect, useRef, useCallback } from 'react';

export function useVoiceDictation(onTranscript: (transcript: string) => void) {
  const [isListening, setIsListening] = useState(false);
  const recognition = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognition.current = new SpeechRecognition();
      recognition.current.continuous = true;
      recognition.current.interimResults = true;
      recognition.current.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          transcript += event.results[i][0].transcript;
        }
        onTranscript(transcript);
      };
    }
  }, [onTranscript]);

  const toggleListening = useCallback(() => {
    if (isListening) {
      recognition.current?.stop();
    } else {
      recognition.current?.start();
    }
    setIsListening(!isListening);
  }, [isListening]);

  return { isListening, toggleListening };
}
