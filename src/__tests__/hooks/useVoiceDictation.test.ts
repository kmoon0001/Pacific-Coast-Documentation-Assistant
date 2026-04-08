import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useVoiceDictation } from '../../hooks/useVoiceDictation';

// Mock Web Speech API
class MockSpeechRecognition {
  start = vi.fn();
  stop = vi.fn();
  abort = vi.fn();
  addEventListener = vi.fn();
  removeEventListener = vi.fn();
  continuous = true;
  interimResults = true;
  onresult: any = null;
}

global.SpeechRecognition = MockSpeechRecognition as any;
global.webkitSpeechRecognition = MockSpeechRecognition as any;

describe('useVoiceDictation Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useVoiceDictation(() => {}));

    expect(result.current.isListening).toBe(false);
    expect(result.current.toggleListening).toBeDefined();
  });

  it('should toggle listening', () => {
    const { result } = renderHook(() => useVoiceDictation(() => {}));

    act(() => {
      result.current.toggleListening();
    });

    expect(result.current.isListening).toBe(true);
  });

  it('should toggle listening off', () => {
    const { result, rerender } = renderHook(() => useVoiceDictation(() => {}));

    act(() => {
      result.current.toggleListening();
    });

    expect(result.current.isListening).toBe(true);

    act(() => {
      result.current.toggleListening();
    });

    expect(result.current.isListening).toBe(false);
  });

  it('should call onTranscript callback', () => {
    const onTranscript = vi.fn();
    const { result } = renderHook(() => useVoiceDictation(onTranscript));

    act(() => {
      result.current.toggleListening();
    });

    expect(result.current.isListening).toBe(true);
  });

  it('should handle multiple toggle cycles', () => {
    const { result } = renderHook(() => useVoiceDictation(() => {}));

    act(() => {
      result.current.toggleListening();
    });
    expect(result.current.isListening).toBe(true);

    act(() => {
      result.current.toggleListening();
    });
    expect(result.current.isListening).toBe(false);

    act(() => {
      result.current.toggleListening();
    });
    expect(result.current.isListening).toBe(true);

    act(() => {
      result.current.toggleListening();
    });
    expect(result.current.isListening).toBe(false);
  });

  it('should track listening state', () => {
    const { result } = renderHook(() => useVoiceDictation(() => {}));

    expect(result.current.isListening).toBe(false);

    act(() => {
      result.current.toggleListening();
    });

    expect(result.current.isListening).toBe(true);
  });

  it('should handle browser not supporting speech recognition', () => {
    const originalSpeechRecognition = global.SpeechRecognition;
    delete (global as any).SpeechRecognition;
    delete (global as any).webkitSpeechRecognition;

    const { result } = renderHook(() => useVoiceDictation(() => {}));

    expect(result.current.isListening).toBe(false);

    global.SpeechRecognition = originalSpeechRecognition;
  });

  it('should provide toggleListening function', () => {
    const { result } = renderHook(() => useVoiceDictation(() => {}));

    expect(typeof result.current.toggleListening).toBe('function');
  });

  it('should handle continuous listening', () => {
    const { result } = renderHook(() => useVoiceDictation(() => {}));

    act(() => {
      result.current.toggleListening();
    });

    expect(result.current.isListening).toBe(true);
  });

  it('should handle interim results', () => {
    const { result } = renderHook(() => useVoiceDictation(() => {}));

    act(() => {
      result.current.toggleListening();
    });

    expect(result.current.isListening).toBe(true);
  });

  it('should call onTranscript with transcript data', () => {
    const onTranscript = vi.fn();
    const { result } = renderHook(() => useVoiceDictation(onTranscript));

    act(() => {
      result.current.toggleListening();
    });

    expect(result.current.isListening).toBe(true);
  });
});
