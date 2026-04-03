import { useState, useEffect, useMemo, useCallback } from 'react';
import { TherapyState, GeneratedNote, AuditResult } from '../types';
import { STEPS, DEFAULT_STATE } from '../constants';
import { generateTherapyNote, auditNoteWithAI, analyzeGaps, parseBrainDump, tumbleNote, summarizeProgress } from '../services/gemini';
import { ClinicalKnowledgeBase } from '../services/clinicalKnowledgeBase';
import { SNFTemplates } from '../services/snfTemplates';
import { generateNursingHandOff } from '../services/nursingHandOff';

export function useTherapySession(initialStateOverride?: TherapyState) {
  const [step, setStep] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [state, setState] = useState<TherapyState>(() => {
    if (initialStateOverride) {
      return initialStateOverride;
    }
    const saved = sessionStorage.getItem('therapy_draft');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // ignore corrupted drafts
      }
    }
    return DEFAULT_STATE;
  });

  const currentSteps = useMemo(() => {
    return STEPS.filter(s => {
      if (s === 'ICD-10 Codes' && state.documentType !== 'Assessment') return false;
      return true;
    });
  }, [state.documentType]);

  useEffect(() => {
    sessionStorage.setItem('therapy_draft', JSON.stringify(state));
  }, [state]);

  const [brainDump, setBrainDump] = useState('');
  const [brainDumpMode, setBrainDumpMode] = useState<'Daily' | 'Assessment' | 'Progress' | 'Recertification' | 'Discharge'>('Daily');
  const [isParsingBrainDump, setIsParsingBrainDump] = useState(false);

  const [generatedNote, setGeneratedNote] = useState<string | null>(null);
  const [history, setHistory] = useState<GeneratedNote[]>(() => JSON.parse(sessionStorage.getItem('noteHistory') || '[]'));
  const [isGenerating, setIsGenerating] = useState(false);
  const [isTumbling, setIsTumbling] = useState(false);
  const [isAuditing, setIsAuditing] = useState(false);
  const [isAnalyzingGaps, setIsAnalyzingGaps] = useState(false);
  const [isSummarizingProgress, setIsSummarizingProgress] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedNote, setEditedNote] = useState('');
  const [previousNote, setPreviousNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [userStyle, setUserStyle] = useState(() => localStorage.getItem('userStyle') || '');
  const [userStyleSamples, setUserStyleSamples] = useState<string[]>(() => JSON.parse(sessionStorage.getItem('userStyleSamples') || '[]'));
  const [tumbleInstructions, setTumbleInstructions] = useState('');
  const [showStyleSettings, setShowStyleSettings] = useState(false);
  const [showTumbleOptions, setShowTumbleOptions] = useState(false);
  const [modelDownloadProgress, setModelDownloadProgress] = useState<number | null>(null);
  const [icdSearch, setIcdSearch] = useState('');
  const [icdCat, setIcdCat] = useState<string | null>(null);
  const [clipboard, setClipboard] = useState<{id: string, title: string, content: string, date: string}[]>(() => JSON.parse(sessionStorage.getItem('noteClipboard') || '[]'));
  const [isClipboardOpen, setIsClipboardOpen] = useState(false);
  const [isTourActive, setIsTourActive] = useState(false);
  const [customGapInputs, setCustomGapInputs] = useState<Record<string, boolean>>({});
  const [customTemplates, setCustomTemplates] = useState<{name: string, state: TherapyState}[]>(() => JSON.parse(localStorage.getItem('customTemplates') || '[]'));
  const [groundingMetadata, setGroundingMetadata] = useState<any>(null);

  const handleNext = useCallback(() => setStep(s => Math.min(s + 1, currentSteps.length - 1)), [currentSteps.length]);
  const handleBack = useCallback(() => setStep(s => Math.max(s - 1, 0)), []);

  const finalizeSession = useCallback(() => {
    if (editedNote || generatedNote) {
      const note = editedNote || generatedNote!;
      const newHistory: GeneratedNote[] = [{
        content: note,
        timestamp: new Date().toLocaleString(),
        type: `${state.discipline} ${state.documentType}`
      }, ...history].slice(0, 10);
      setHistory(newHistory);
      sessionStorage.setItem('noteHistory', JSON.stringify(newHistory));
    }
    
    setState({
      ...DEFAULT_STATE,
      discipline: state.discipline,
      isLocalMode: state.isLocalMode
    });
    setGeneratedNote(null);
    setEditedNote('');
    setPreviousNote(null);
    setBrainDump('');
    setStep(0);
    sessionStorage.removeItem('therapy_draft');
    setError("Session finalized. Ready for next patient.");
    setTimeout(() => setError(null), 3000);
  }, [editedNote, generatedNote, history, state.discipline, state.documentType, state.isLocalMode]);

  const sanitizeHistory = useCallback(() => {
    setHistory([]);
    sessionStorage.removeItem('noteHistory');
    setClipboard([]);
    sessionStorage.removeItem('noteClipboard');
    sessionStorage.removeItem('therapy_draft');
    sessionStorage.removeItem('userStyleSamples');
    setUserStyleSamples([]);
    setError("All session history and clipboard data have been sanitized.");
    setTimeout(() => setError(null), 3000);
  }, []);

  const delayedNext = useCallback((id: string, updateState: () => void) => {
    setSelectedId(id);
    updateState();
    setTimeout(() => {
      handleNext();
      setSelectedId(null);
    }, 400);
  }, [handleNext]);

  const handleAnalyzeGaps = async () => {
    setIsAnalyzingGaps(true);
    setError(null);
    try {
      const result = await analyzeGaps(state, state.isLocalMode);
      setState({ ...state, gapQuestions: result.data, gapAnswersMap: {} });
      if (result.groundingMetadata) setGroundingMetadata(result.groundingMetadata);
    } catch (error: any) {
      console.error(error);
      const isQuota = error.message?.includes("Quota");
      setError(error.message || "Failed to analyze gaps. Please try again.");
      if (isQuota) {
        setTimeout(() => setError("Tip: Try enabling 'Local Mode' in settings if AI limits are reached."), 4000);
      }
    } finally {
      setIsAnalyzingGaps(false);
    }
  };

  const handleSummarizeProgress = async () => {
    setIsSummarizingProgress(true);
    setError(null);
    try {
      const summary = await summarizeProgress(state, state.isLocalMode);
      setState({ ...state, progressStatement: summary });
    } catch (error: any) {
      console.error(error);
      setError(error.message || "Failed to summarize progress. Please try again.");
    } finally {
      setIsSummarizingProgress(false);
    }
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    setGroundingMetadata(null);
    try {
      const missingFields = [];
      if (!state.discipline) missingFields.push("Discipline");
      if (!state.documentType) missingFields.push("Document Type");
      if (!state.cptCode) missingFields.push("CPT Code");
      if (state.documentType === 'Assessment' && (!state.icd10Codes || state.icd10Codes.length === 0)) {
        missingFields.push("ICD-10 Codes");
      }

      const noteResult = await generateTherapyNote({ ...state, userStyleSamples }, userStyle);
      const note = noteResult.text || "";
      if (noteResult.groundingMetadata) setGroundingMetadata(noteResult.groundingMetadata);

      const auditResultRaw = await auditNoteWithAI(note, state.documentType, state.isLocalMode);
      const aiAudit = auditResultRaw.data;
      const localAudit = ClinicalKnowledgeBase.auditNote({ ...state, customNote: note });
      
      const auditResult: AuditResult = {
        complianceScore: Math.round((aiAudit.complianceScore + localAudit.complianceScore) / 2),
        findings: [...new Set([...aiAudit.findings, ...localAudit.findings])],
        checklist: { ...aiAudit.checklist, ...localAudit.checklist }
      };

      if (missingFields.length > 0) {
        auditResult.complianceScore = Math.max(0, auditResult.complianceScore - (missingFields.length * 10));
        auditResult.findings.push(`⚠️ COMPLIANCE WARNING: You skipped critical fields (${missingFields.join(', ')}). This may lead to claim denials or audit failures.`);
      }
      
      setState({ ...state, auditResult });
      setGeneratedNote(note);
      setEditedNote(note);
      
      const newHistory: GeneratedNote[] = [{
        content: note,
        timestamp: new Date().toLocaleString(),
        type: `${state.discipline} ${state.documentType}`
      }, ...history].slice(0, 5);
      setHistory(newHistory);
      sessionStorage.setItem('noteHistory', JSON.stringify(newHistory));
      sessionStorage.removeItem('therapy_draft');
      setStep(currentSteps.length - 1);
    } catch (error: any) {
      console.error(error);
      const isQuota = error.message?.includes("Quota");
      setError(error.message || "Failed to generate note. Please try again.");
      if (isQuota) {
        setTimeout(() => setError("Tip: Try enabling 'Local Mode' in settings to use on-device AI."), 4000);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleTumble = async (instruction?: string) => {
    if (!generatedNote) return;
    setIsTumbling(true);
    setError(null);
    setGroundingMetadata(null);
    setShowTumbleOptions(false);
    setPreviousNote(editedNote || generatedNote);
    try {
      const note = await tumbleNote(editedNote || generatedNote, instruction || tumbleInstructions, state.isLocalMode);
      const auditResultRaw = await auditNoteWithAI(note, state.documentType, state.isLocalMode);
      const aiAudit = auditResultRaw.data;
      if (auditResultRaw.groundingMetadata) setGroundingMetadata(auditResultRaw.groundingMetadata);
      
      const localAudit = ClinicalKnowledgeBase.auditNote({ ...state, customNote: note });
      
      const auditResult: AuditResult = {
        complianceScore: Math.round((aiAudit.complianceScore + localAudit.complianceScore) / 2),
        findings: [...new Set([...aiAudit.findings, ...localAudit.findings])],
        checklist: { ...aiAudit.checklist, ...localAudit.checklist }
      };

      setState({ ...state, auditResult });
      setGeneratedNote(note);
      setEditedNote(note);
      setTumbleInstructions('');
      setIsEditing(false);
    } catch (error: any) {
      console.error(error);
      setError(error.message || "Failed to refine note. Please try again.");
    } finally {
      setIsTumbling(false);
    }
  };

  const handleAudit = async () => {
    if (editedNote || generatedNote) {
      setIsAuditing(true);
      setGroundingMetadata(null);
      try {
        const auditResultRaw = await auditNoteWithAI(editedNote || generatedNote!, state.documentType, state.isLocalMode);
        const aiAudit = auditResultRaw.data;
        if (auditResultRaw.groundingMetadata) setGroundingMetadata(auditResultRaw.groundingMetadata);
        
        const localAudit = ClinicalKnowledgeBase.auditNote({ ...state, customNote: editedNote || generatedNote! });
        
        const auditResult: AuditResult = {
          complianceScore: Math.round((aiAudit.complianceScore + localAudit.complianceScore) / 2),
          findings: [...new Set([...aiAudit.findings, ...localAudit.findings])],
          checklist: { ...aiAudit.checklist, ...localAudit.checklist }
        };
        setState({ ...state, auditResult });
      } catch (e: any) {
        console.error(e);
        setError(e.message || "Audit failed.");
      } finally {
        setIsAuditing(false);
      }
    }
  };

  const handleBrainDump = async () => {
    if (!brainDump.trim()) return;
    setIsParsingBrainDump(true);
    setError(null);
    try {
      const parsed = await parseBrainDump(brainDump, { ...state, documentType: brainDumpMode });
      setState(s => ({
        ...s,
        ...parsed,
        documentType: brainDumpMode,
        customNote: (s.customNote ? s.customNote + '\n\n' : '') + (parsed.customNote || '')
      }));
      setBrainDump('');
      setStep(2); 
    } catch (e: any) {
      console.error(e);
      const msg = e.message || "Brain dump failed.";
      setError(msg);
      if (msg.toLowerCase().includes('quota')) {
        setError(msg + " Tip: Enable 'Local Mode' in settings to continue without cloud services.");
      }
    } finally {
      setIsParsingBrainDump(false);
    }
  };

  const handleQuickGenerate = async () => {
    if (!brainDump.trim()) return;
    setIsParsingBrainDump(true);
    setGroundingMetadata(null);
    try {
      const parsed = await parseBrainDump(brainDump, { ...state, documentType: brainDumpMode });
      const newState = {
        ...state,
        ...parsed,
        documentType: brainDumpMode,
        customNote: (state.customNote ? state.customNote + '\n\n' : '') + (parsed.customNote || '')
      };
      setState(newState);
      setBrainDump('');
      setStep(currentSteps.length - 1);
      
      setIsGenerating(true);
      setError(null);
      const noteResult = await generateTherapyNote(newState, userStyle);
      const note = noteResult.text || "";
      if (noteResult.groundingMetadata) setGroundingMetadata(noteResult.groundingMetadata);

      setGeneratedNote(note);
      setEditedNote(note);
      setHistory(prev => {
        const newHistory: GeneratedNote[] = [{
          content: note,
          timestamp: new Date().toLocaleString(),
          type: `${newState.discipline} ${newState.documentType}`
        }, ...prev].slice(0, 10);
        sessionStorage.setItem('noteHistory', JSON.stringify(newHistory));
        return newHistory;
      });
      sessionStorage.removeItem('therapy_draft');
    } catch (e: any) {
      console.error(e);
      const msg = e.message || "Failed to quick generate note. Please try again.";
      setError(msg);
      if (msg.toLowerCase().includes('quota')) {
        setError(msg + " Tip: Enable 'Local Mode' in settings to continue without cloud services.");
      }
    } finally {
      setIsParsingBrainDump(false);
      setIsGenerating(false);
    }
  };

  const handleSaveTemplate = () => {
    const name = prompt("Enter a name for this custom template:");
    if (name) {
      const { customNote: _customNote, previousNotesToSummarize: _previousNotesToSummarize, ...stateToSave } = state;
      const newTemplates = [...customTemplates, { name, state: stateToSave as TherapyState }];
      setCustomTemplates(newTemplates);
      localStorage.setItem('customTemplates', JSON.stringify(newTemplates));
    }
  };

  const handleDeleteTemplate = (name: string) => {
    const newTemplates = customTemplates.filter(t => t.name !== name);
    setCustomTemplates(newTemplates);
    localStorage.setItem('customTemplates', JSON.stringify(newTemplates));
  };

  const saveUserStyleSample = (sample: string) => {
    const newSamples = [...userStyleSamples, sample].slice(-5);
    setUserStyleSamples(newSamples);
    sessionStorage.setItem('userStyleSamples', JSON.stringify(newSamples));
  };

  return {
    step, setStep,
    selectedId, setSelectedId,
    state, setState,
    currentSteps,
    brainDump, setBrainDump,
    brainDumpMode, setBrainDumpMode,
    isParsingBrainDump,
    generatedNote, setGeneratedNote,
    history, setHistory,
    isGenerating,
    isTumbling,
    isAuditing,
    isAnalyzingGaps,
    isSummarizingProgress,
    isEditing, setIsEditing,
    editedNote, setEditedNote,
    previousNote, setPreviousNote,
    error, setError,
    userStyle, setUserStyle,
    userStyleSamples, setUserStyleSamples,
    saveUserStyleSample,
    tumbleInstructions, setTumbleInstructions,
    showStyleSettings, setShowStyleSettings,
    showTumbleOptions, setShowTumbleOptions,
    modelDownloadProgress, setModelDownloadProgress,
    icdSearch, setIcdSearch,
    icdCat, setIcdCat,
    clipboard, setClipboard,
    isClipboardOpen, setIsClipboardOpen,
    isTourActive, setIsTourActive,
    customGapInputs, setCustomGapInputs,
    customTemplates, setCustomTemplates,
    handleNext, handleBack,
    finalizeSession, sanitizeHistory,
    delayedNext, handleAnalyzeGaps,
    handleSummarizeProgress, handleGenerate,
    handleTumble, handleAudit,
    handleBrainDump, handleQuickGenerate,
    handleSaveTemplate, handleDeleteTemplate,
    SNFTemplates,
    generateNursingHandOff,
    isLocalMode: state.isLocalMode,
    auditResult: state.auditResult,
    groundingMetadata
  };
}
