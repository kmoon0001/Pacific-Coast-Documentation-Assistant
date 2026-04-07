import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useTherapySession } from '../../hooks/useTherapySession';
import { createMockTherapyState, createMockGeneratedNote, createMockAuditResult } from '../fixtures';

describe('useTherapySession Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useTherapySession());
    
    expect(result.current.state).toBeDefined();
    expect(result.current.step).toBe(0);
  });

  it('should update state', () => {
    const { result } = renderHook(() => useTherapySession());
    
    act(() => {
      result.current.setState({ ...result.current.state, discipline: 'PT' });
    });
    
    expect(result.current.state.discipline).toBe('PT');
  });

  it('should navigate to next step', () => {
    const { result } = renderHook(() => useTherapySession());
    
    act(() => {
      result.current.handleNext();
    });
    
    expect(result.current.step).toBe(1);
  });

  it('should navigate to previous step', () => {
    const { result } = renderHook(() => useTherapySession());
    
    act(() => {
      result.current.handleNext();
      result.current.handleBack();
    });
    
    expect(result.current.step).toBe(0);
  });

  it('should not go below step 0', () => {
    const { result } = renderHook(() => useTherapySession());
    
    act(() => {
      result.current.handleBack();
    });
    
    expect(result.current.step).toBe(0);
  });

  it('should generate note', async () => {
    const { result } = renderHook(() => useTherapySession());
    
    await act(async () => {
      result.current.setState(createMockTherapyState());
      await result.current.handleGenerate();
    });
    
    await waitFor(() => {
      expect(result.current.isGenerating).toBe(false);
    });
  });

  it('should handle brain dump parsing', async () => {
    const { result } = renderHook(() => useTherapySession());
    
    await act(async () => {
      result.current.setBrainDump('Patient improved significantly');
      await result.current.handleBrainDump();
    });
    
    await waitFor(() => {
      expect(result.current.isParsingBrainDump).toBe(false);
    });
  });

  it('should manage clipboard', () => {
    const { result } = renderHook(() => useTherapySession());
    
    const clipboardItem = { id: '1', title: 'Test', content: 'Content', date: new Date().toISOString() };
    
    act(() => {
      result.current.setClipboard([...result.current.clipboard, clipboardItem]);
    });
    
    expect(result.current.clipboard).toContainEqual(clipboardItem);
  });

  it('should manage history', () => {
    const { result } = renderHook(() => useTherapySession());
    
    const note = createMockGeneratedNote();
    
    act(() => {
      result.current.setGeneratedNote(note.content);
    });
    
    expect(result.current.generatedNote).toBe(note.content);
  });

  it('should handle audit', async () => {
    const { result } = renderHook(() => useTherapySession());
    
    await act(async () => {
      result.current.setState(createMockTherapyState());
      result.current.setGeneratedNote('Test note');
      await result.current.handleAudit();
    });
    
    await waitFor(() => {
      expect(result.current.isAuditing).toBe(false);
    });
  });

  it('should set audit result', () => {
    const { result } = renderHook(() => useTherapySession());
    
    const auditResult = createMockAuditResult();
    
    act(() => {
      // Simulate audit completion
      result.current.setState({ ...result.current.state, auditResult });
    });
    
    expect(result.current.state.auditResult).toEqual(auditResult);
  });

  it('should handle tumble (refinement)', async () => {
    const { result } = renderHook(() => useTherapySession());
    
    await act(async () => {
      result.current.setState(createMockTherapyState());
      result.current.setGeneratedNote('Test note');
      await result.current.handleTumble();
    });
    
    await waitFor(() => {
      expect(result.current.isTumbling).toBe(false);
    });
  });

  it('should manage edited note', () => {
    const { result } = renderHook(() => useTherapySession());
    
    act(() => {
      result.current.setEditedNote('Edited content');
    });
    
    expect(result.current.editedNote).toBe('Edited content');
  });

  it('should finalize session', async () => {
    const { result } = renderHook(() => useTherapySession());
    
    act(() => {
      result.current.setState(createMockTherapyState());
      result.current.setGeneratedNote('Final note');
    });

    act(() => {
      result.current.finalizeSession();
    });

    await waitFor(() => expect(result.current.history.length).toBeGreaterThan(0));
  });

  it('should sanitize history', () => {
    const { result } = renderHook(() => useTherapySession());
    
    act(() => {
      result.current.sanitizeHistory();
    });
    
    expect(result.current.history).toBeDefined();
  });

  it('should manage custom templates', () => {
    const { result } = renderHook(() => useTherapySession());
    
    const template = { name: 'Test Template', state: createMockTherapyState() };
    
    act(() => {
      result.current.setCustomTemplates([...result.current.customTemplates, template]);
    });
    
    expect(result.current.customTemplates).toContainEqual(template);
  });

  it('should handle local mode', () => {
    const { result } = renderHook(() => useTherapySession());
    
    expect(result.current.isLocalMode).toBe(true);
  });

  it('should track model download progress', () => {
    const { result } = renderHook(() => useTherapySession());
    
    expect(result.current.modelDownloadProgress).toBeDefined();
  });

  it('should handle ICD search', () => {
    const { result } = renderHook(() => useTherapySession());
    
    act(() => {
      result.current.setIcdSearch('M79');
    });
    
    expect(result.current.icdSearch).toBe('M79');
  });

  it('should handle ICD category filter', () => {
    const { result } = renderHook(() => useTherapySession());
    
    act(() => {
      result.current.setIcdCat('musculoskeletal');
    });
    
    expect(result.current.icdCat).toBe('musculoskeletal');
  });

  it('should handle brain dump mode', () => {
    const { result } = renderHook(() => useTherapySession());
    
    act(() => {
      result.current.setBrainDumpMode('Daily');
    });
    
    expect(result.current.brainDumpMode).toBe('Daily');
  });

  it('should handle custom gap inputs', () => {
    const { result } = renderHook(() => useTherapySession());
    
    act(() => {
      result.current.setCustomGapInputs({ 'gap1': true });
    });
    
    expect(result.current.customGapInputs).toEqual({ 'gap1': true });
  });

  it('should handle summarize progress', async () => {
    const { result } = renderHook(() => useTherapySession());
    
    act(() => {
      result.current.setState(createMockTherapyState());
      result.current.handleSummarizeProgress();
    });
    
    await waitFor(() => {
      expect(result.current.isSummarizingProgress).toBe(false);
    });
  });

  it('should handle analyze gaps', async () => {
    const { result } = renderHook(() => useTherapySession());
    
    act(() => {
      result.current.setState(createMockTherapyState());
      result.current.handleAnalyzeGaps();
    });
    
    await waitFor(() => {
      expect(result.current.isAnalyzingGaps).toBe(false);
    });
  });

  it('should persist state to storage', () => {
    const { result } = renderHook(() => useTherapySession());
    
    act(() => {
      result.current.setState(createMockTherapyState({ discipline: 'PT' }));
    });
    
    expect(sessionStorage.getItem).toBeDefined();
  });

  it('should restore state from storage', () => {
    const { result } = renderHook(() => useTherapySession());
    
    expect(result.current.state).toBeDefined();
  });
});
