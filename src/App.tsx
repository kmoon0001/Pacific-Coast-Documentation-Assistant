import React, { useEffect, useState, lazy, Suspense } from 'react';
import ErrorBoundary from './components/ErrorBoundary';
import { Menu, FileText, X } from 'lucide-react';
import { cn } from './lib/utils';
import { TherapySessionProvider, useSession } from './contexts/TherapySessionContext';

// Lazy load heavy components for better performance
const Sidebar = lazy(() =>
  import('./components/TherapyApp/Sidebar').then((m) => ({ default: m.Sidebar }))
);
const MainContent = lazy(() =>
  import('./components/TherapyApp/MainContent').then((m) => ({ default: m.MainContent }))
);
const PreviewPanel = lazy(() =>
  import('./components/TherapyApp/PreviewPanel').then((m) => ({ default: m.PreviewPanel }))
);
const StyleSettings = lazy(() =>
  import('./components/TherapyApp/StyleSettings').then((m) => ({ default: m.StyleSettings }))
);
const ClipboardModal = lazy(() =>
  import('./components/TherapyApp/ClipboardModal').then((m) => ({ default: m.ClipboardModal }))
);
const GuidedTour = lazy(() =>
  import('./components/TherapyApp/GuidedTour').then((m) => ({ default: m.GuidedTour }))
);

// Loading fallback component
const LoadingFallback = () => (
  <div className="flex items-center justify-center h-full">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-950"></div>
  </div>
);

export default function App() {
  return (
    <ErrorBoundary>
      <TherapySessionProvider>
        <TheraDocApp />
      </TherapySessionProvider>
    </ErrorBoundary>
  );
}

function TheraDocApp() {
  const session = useSession();
  const {
    state,
    setState,
    history,
    clipboard,
    setClipboard,
    isLocalMode,
    finalizeSession,
    sanitizeHistory,
    showStyleSettings,
    setShowStyleSettings,
    userStyle,
    setUserStyle,
    userStyleSamples,
    setUserStyleSamples,
    saveUserStyleSample,
    isClipboardOpen,
    setIsClipboardOpen,
    isTourActive,
    setIsTourActive,
    modelDownloadProgress,
    setModelDownloadProgress,
    generatedNote,
    editedNote,
    setEditedNote,
    isGenerating,
    isTumbling,
    isAuditing,
    isEditing,
    setIsEditing,
    auditResult,
    handleTumble,
    handleAudit,
    handleSaveTemplate,
    tumbleInstructions,
    setTumbleInstructions,
    showTumbleOptions,
    setShowTumbleOptions,
    error,
    setError,
    groundingMetadata,
  } = session;

  const [isSidebarMinimized, setIsSidebarMinimized] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isMobilePreviewOpen, setIsMobilePreviewOpen] = useState(false);

  // Handle model download progress callback
  useEffect(() => {
    import('./services/localLLM').then((m) => {
      m.setProgressCallback((p) => {
        setModelDownloadProgress(p);
        if (p >= 100) {
          setTimeout(() => setModelDownloadProgress(null), 2000);
        }
      });
    });
  }, [setModelDownloadProgress]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        if (session.step < session.currentSteps.length - 1) {
          session.handleNext();
        } else if (session.step === session.currentSteps.length - 1 && !isGenerating) {
          session.handleGenerate();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [session, isGenerating]);

  const handleCopy = () => {
    const note = editedNote || generatedNote;
    if (note) {
      navigator.clipboard.writeText(note);
      setError('Note copied to clipboard.');
      setTimeout(() => setError(null), 3000);
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-screen bg-white text-zinc-950 font-sans selection:bg-zinc-950 selection:text-white overflow-hidden">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 border-b border-zinc-100 bg-white z-20">
        <button
          onClick={() => setIsMobileSidebarOpen(true)}
          className="p-2 -ml-2 text-zinc-600"
          title="Open menu"
          aria-label="Open menu"
        >
          <Menu className="w-6 h-6" />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-zinc-950 rounded-lg flex items-center justify-center shadow-md">
            <FileText className="w-4 h-4 text-white" />
          </div>
          <h1 className="text-lg font-black tracking-tighter text-zinc-950">TheraDoc</h1>
        </div>
        <button
          onClick={() => setIsMobilePreviewOpen(true)}
          className="p-2 -mr-2 text-zinc-600 relative"
          title="Open preview"
          aria-label="Open preview"
        >
          <FileText className="w-6 h-6" />
          {(generatedNote || isGenerating) && (
            <span className="absolute top-2 right-2 w-2 h-2 bg-emerald-500 rounded-full" />
          )}
        </button>
      </div>

      {/* Sidebar (Desktop & Mobile Drawer) */}
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 md:relative md:translate-x-0',
          isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <Suspense fallback={<LoadingFallback />}>
          <Sidebar
            history={history}
            clipboard={clipboard}
            isLocalMode={!!isLocalMode}
            onToggleLocalMode={(val) => setState({ ...state, isLocalMode: val })}
            onSanitizeHistory={sanitizeHistory}
            onShowStyleSettings={() => {
              setShowStyleSettings(true);
              setIsMobileSidebarOpen(false);
            }}
            onOpenClipboard={() => {
              setIsClipboardOpen(true);
              setIsMobileSidebarOpen(false);
            }}
            onStartTour={() => {
              setIsTourActive(true);
              setIsMobileSidebarOpen(false);
            }}
            modelDownloadProgress={modelDownloadProgress}
            isMinimized={isSidebarMinimized}
            onToggleMinimize={() => setIsSidebarMinimized(!isSidebarMinimized)}
          />
        </Suspense>
        {/* Mobile Sidebar Close Button */}
        <button
          onClick={() => setIsMobileSidebarOpen(false)}
          className="md:hidden absolute top-4 right-4 p-2 bg-zinc-100 rounded-full text-zinc-600"
          title="Close menu"
          aria-label="Close menu"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Mobile Sidebar Backdrop */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-40 md:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <Suspense fallback={<LoadingFallback />}>
        <MainContent />
      </Suspense>

      {/* Preview Panel (Desktop & Mobile Drawer) */}
      <div
        className={cn(
          'fixed inset-y-0 right-0 z-50 transform transition-transform duration-300 md:relative md:translate-x-0',
          isMobilePreviewOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        <Suspense fallback={<LoadingFallback />}>
          <PreviewPanel
            generatedNote={generatedNote}
            editedNote={editedNote}
            isGenerating={isGenerating}
            isTumbling={isTumbling}
            isAuditing={isAuditing}
            isEditing={isEditing}
            auditResult={auditResult}
            onEdit={setIsEditing}
            onEditedNoteChange={setEditedNote}
            onTumble={handleTumble}
            onAudit={handleAudit}
            onSaveTemplate={handleSaveTemplate}
            onFinalize={() => {
              finalizeSession();
              setIsMobilePreviewOpen(false);
            }}
            onCopy={handleCopy}
            tumbleInstructions={tumbleInstructions}
            onTumbleInstructionsChange={setTumbleInstructions}
            showTumbleOptions={showTumbleOptions}
            onToggleTumbleOptions={setShowTumbleOptions}
            error={error}
            groundingMetadata={groundingMetadata}
            SNFTemplates={session.SNFTemplates}
            generateNursingHandOff={session.generateNursingHandOff}
            state={state}
          />
        </Suspense>
        {/* Mobile Preview Close Button */}
        <button
          onClick={() => setIsMobilePreviewOpen(false)}
          className="md:hidden absolute top-4 left-4 p-2 bg-zinc-100 rounded-full text-zinc-600 z-50"
          title="Close preview"
          aria-label="Close preview"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Mobile Preview Backdrop */}
      {isMobilePreviewOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-40 md:hidden"
          onClick={() => setIsMobilePreviewOpen(false)}
        />
      )}

      {showStyleSettings && (
        <Suspense fallback={<LoadingFallback />}>
          <StyleSettings
            show={showStyleSettings}
            userStyle={userStyle}
            setUserStyle={(val) => {
              setUserStyle(val);
              localStorage.setItem('userStyle', val);
            }}
            userStyleSamples={userStyleSamples}
            setUserStyleSamples={(val) => {
              setUserStyleSamples(val);
              sessionStorage.setItem('userStyleSamples', JSON.stringify(val));
            }}
            saveUserStyleSample={saveUserStyleSample}
            isLocalMode={!!isLocalMode}
            onToggleLocalMode={() => setState({ ...state, isLocalMode: !isLocalMode })}
            onClose={() => setShowStyleSettings(false)}
          />
        </Suspense>
      )}

      {isClipboardOpen && (
        <Suspense fallback={<LoadingFallback />}>
          <ClipboardModal
            clipboard={clipboard}
            onClose={() => setIsClipboardOpen(false)}
            onAdd={(item) => {
              const newClipboard = [...clipboard, item];
              setClipboard(newClipboard);
              sessionStorage.setItem('noteClipboard', JSON.stringify(newClipboard));
            }}
            onDelete={(id) => {
              const newClipboard = clipboard.filter((i) => i.id !== id);
              setClipboard(newClipboard);
              sessionStorage.setItem('noteClipboard', JSON.stringify(newClipboard));
            }}
          />
        </Suspense>
      )}

      <Suspense fallback={null}>
        <GuidedTour isActive={isTourActive} onClose={() => setIsTourActive(false)} />
      </Suspense>
    </div>
  );
}
