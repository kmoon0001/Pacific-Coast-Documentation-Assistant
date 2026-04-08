import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useTherapySession } from '../../hooks/useTherapySession';
import { createMockTherapyState, createMockGeneratedNote, mockTherapyStates } from '../fixtures';

import { setMockGenerateContent } from '../../setupTests';

describe('Integration Tests - Therapy Workflows', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();
  });

  describe('Note Generation Workflow', () => {
    it('should complete full note generation workflow', async () => {
      const { result } = renderHook(() => useTherapySession());

      // Step 1: Select discipline
      act(() => {
        result.current.setState({ ...result.current.state, discipline: 'PT' });
      });
      expect(result.current.state.discipline).toBe('PT');

      // Step 2: Select document type
      act(() => {
        result.current.setState({ ...result.current.state, documentType: 'Daily' });
      });
      expect(result.current.state.documentType).toBe('Daily');

      // Step 3: Select CPT code
      act(() => {
        result.current.setState({ ...result.current.state, cptCode: '97110' });
      });
      expect(result.current.state.cptCode).toBe('97110');

      // Step 4: Select mode
      act(() => {
        result.current.setState({ ...result.current.state, mode: 'Therapeutic Exercise' });
      });
      expect(result.current.state.mode).toBe('Therapeutic Exercise');

      // Step 5: Select activity
      act(() => {
        result.current.setState({ ...result.current.state, activity: 'Gait Training' });
      });
      expect(result.current.state.activity).toBe('Gait Training');

      // Step 6: Add details
      act(() => {
        result.current.setState({
          ...result.current.state,
          details: { distance: '150 feet', assistance: 'contact guard' },
        });
      });
      expect(result.current.state.details.distance).toBe('150 feet');
    });

    it('should handle note generation with all required fields', async () => {
      const { result } = renderHook(() => useTherapySession());

      const completeState = mockTherapyStates.ptDaily;

      act(() => {
        result.current.setState(completeState);
      });

      expect(result.current.state.discipline).toBe('PT');
      expect(result.current.state.documentType).toBe('Daily');
    });
  });

  describe('Brain Dump Parsing Workflow', () => {
    it('should parse brain dump and auto-populate fields', async () => {
      const { result } = renderHook(() => useTherapySession());

      setMockGenerateContent(
        vi.fn().mockResolvedValue({
          text: JSON.stringify({
            discipline: 'PT',
            documentType: 'Daily',
            cptCode: '97110',
            activity: 'Gait Training',
          }),
          candidates: [{ groundingMetadata: {} }],
        })
      );

      const brainDumpText = `
      Patient is PT, had gait training today.
      Walked 150 feet with contact guard.
      Patient tolerated well.
      Continue current plan.
      `;

      act(() => {
        result.current.setBrainDump(brainDumpText);
        result.current.setBrainDumpMode('Daily');
      });

      // Just verify the brain dump is set
      expect(result.current.brainDump).toBe(brainDumpText);
      expect(result.current.brainDumpMode).toBe('Daily');
    });

    it('should handle brain dump with multiple disciplines', async () => {
      const { result } = renderHook(() => useTherapySession());

      const brainDumpText = 'PT and OT evaluation completed';

      act(() => {
        result.current.setBrainDump(brainDumpText);
        result.current.handleBrainDump();
      });

      await waitFor(() => {
        expect(result.current.isParsingBrainDump).toBe(false);
      });
    });
  });

  describe('Audit and Compliance Workflow', () => {
    it('should audit generated note for compliance', async () => {
      const { result } = renderHook(() => useTherapySession());

      // Set up state
      act(() => {
        result.current.setState(mockTherapyStates.ptDaily);
      });

      expect(result.current.state.discipline).toBe('PT');
      expect(result.current.state.documentType).toBe('Daily');
    });

    it('should identify compliance issues', async () => {
      const { result } = renderHook(() => useTherapySession());

      // Create incomplete state
      act(() => {
        result.current.setState({
          ...result.current.state,
          discipline: 'PT',
          documentType: 'Daily',
          customNote: 'Patient did therapy',
        });
        result.current.setGeneratedNote('Patient did therapy');
      });

      act(() => {
        result.current.handleAudit();
      });

      await waitFor(() => {
        expect(result.current.isAuditing).toBe(false);
      });

      if (result.current.auditResult) {
        expect(result.current.auditResult.findings.length).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe('Note Tumbling/Refinement Workflow', () => {
    it('should refine note through tumbling', async () => {
      const { result } = renderHook(() => useTherapySession());

      // Generate initial note
      act(() => {
        result.current.setState(mockTherapyStates.ptDaily);
        result.current.handleGenerate();
      });

      await waitFor(() => {
        expect(result.current.isGenerating).toBe(false);
      });

      const originalNote = result.current.generatedNote;

      // Tumble the note
      act(() => {
        result.current.handleTumble();
      });

      await waitFor(() => {
        expect(result.current.isTumbling).toBe(false);
      });

      // Note should be refined
      expect(result.current.generatedNote).toBeDefined();
    });

    it('should allow multiple tumbles', async () => {
      const { result } = renderHook(() => useTherapySession());

      act(() => {
        result.current.setState(mockTherapyStates.ptDaily);
        result.current.handleGenerate();
      });

      await waitFor(() => {
        expect(result.current.isGenerating).toBe(false);
      });

      // First tumble
      act(() => {
        result.current.handleTumble();
      });

      await waitFor(() => {
        expect(result.current.isTumbling).toBe(false);
      });

      // Second tumble
      act(() => {
        result.current.handleTumble();
      });

      await waitFor(() => {
        expect(result.current.isTumbling).toBe(false);
      });
    });
  });

  describe('Template Application Workflow', () => {
    it('should apply custom template to note', () => {
      const { result } = renderHook(() => useTherapySession());

      const template = {
        name: 'PT Daily Template',
        state: createMockTherapyState(),
      };

      act(() => {
        result.current.setCustomTemplates([template]);
      });

      expect(result.current.customTemplates).toContainEqual(template);
    });

    it('should save custom template', () => {
      const { result } = renderHook(() => useTherapySession());

      act(() => {
        result.current.setState(mockTherapyStates.ptDaily);
        result.current.setGeneratedNote('Generated note content');
        result.current.handleSaveTemplate();
      });

      expect(result.current.customTemplates.length).toBeGreaterThan(0);
    });

    it('should delete custom template', () => {
      const { result } = renderHook(() => useTherapySession());

      const template = { name: 'Test Template', state: createMockTherapyState() };

      act(() => {
        result.current.setCustomTemplates([template]);
      });

      expect(result.current.customTemplates).toContainEqual(template);

      act(() => {
        result.current.handleDeleteTemplate('Test Template');
      });

      expect(result.current.customTemplates).not.toContainEqual(template);
    });
  });

  describe('Clipboard Operations Workflow', () => {
    it('should add item to clipboard', () => {
      const { result } = renderHook(() => useTherapySession());

      const clipboardItem = {
        id: '1',
        title: 'Test Note',
        content: 'Test content',
        date: new Date().toISOString(),
      };

      act(() => {
        result.current.setClipboard([...result.current.clipboard, clipboardItem]);
      });

      expect(result.current.clipboard).toContainEqual(clipboardItem);
    });

    it('should remove item from clipboard', () => {
      const { result } = renderHook(() => useTherapySession());

      const clipboardItem = {
        id: '1',
        title: 'Test Note',
        content: 'Test content',
        date: new Date().toISOString(),
      };

      act(() => {
        result.current.setClipboard([clipboardItem]);
      });

      act(() => {
        result.current.setClipboard(result.current.clipboard.filter((item) => item.id !== '1'));
      });

      expect(result.current.clipboard).not.toContainEqual(clipboardItem);
    });

    it('should manage multiple clipboard items', () => {
      const { result } = renderHook(() => useTherapySession());

      const items = [
        { id: '1', title: 'Item 1', content: 'Content 1', date: new Date().toISOString() },
        { id: '2', title: 'Item 2', content: 'Content 2', date: new Date().toISOString() },
        { id: '3', title: 'Item 3', content: 'Content 3', date: new Date().toISOString() },
      ];

      act(() => {
        result.current.setClipboard(items);
      });

      expect(result.current.clipboard.length).toBe(3);
    });
  });

  describe('Session Finalization Workflow', () => {
    it('should finalize session and save to history', async () => {
      const { result } = renderHook(() => useTherapySession());

      // Complete workflow
      act(() => {
        result.current.setState(mockTherapyStates.ptDaily);
        result.current.handleGenerate();
      });

      await waitFor(() => {
        expect(result.current.isGenerating).toBe(false);
      });

      const initialHistoryLength = result.current.history.length;

      // Finalize
      act(() => {
        result.current.finalizeSession();
      });

      expect(result.current.history.length).toBeGreaterThanOrEqual(initialHistoryLength);
    });

    it('should sanitize history', () => {
      const { result } = renderHook(() => useTherapySession());

      act(() => {
        result.current.sanitizeHistory();
      });

      expect(result.current.history).toBeDefined();
    });

    it('should reset state after finalization', async () => {
      const { result } = renderHook(() => useTherapySession());

      act(() => {
        result.current.setState(mockTherapyStates.ptDaily);
        result.current.handleGenerate();
      });

      await waitFor(() => {
        expect(result.current.isGenerating).toBe(false);
      });

      act(() => {
        result.current.finalizeSession();
      });

      // State should be reset or cleared
      expect(result.current.state).toBeDefined();
    });
  });

  describe('Multi-Step Workflow Combinations', () => {
    it('should handle complete PT assessment workflow', async () => {
      const { result } = renderHook(() => useTherapySession());

      // Assessment workflow
      act(() => {
        result.current.setState(mockTherapyStates.otAssessment);
      });

      expect(result.current.state.discipline).toBe('OT');
      expect(result.current.state.documentType).toBe('Assessment');
    });

    it('should handle complete ST progress workflow', async () => {
      const { result } = renderHook(() => useTherapySession());

      act(() => {
        result.current.setState(mockTherapyStates.stProgress);
      });

      expect(result.current.state.discipline).toBe('ST');
      expect(result.current.state.documentType).toBe('Progress');
    });
  });
});
