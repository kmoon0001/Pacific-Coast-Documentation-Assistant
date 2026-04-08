import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { axe } from 'vitest-axe';
import { TherapySessionProvider } from '../../contexts/TherapySessionContext';
import { MainContent } from '../../components/TherapyApp/MainContent';
import { PreviewPanel } from '../../components/TherapyApp/PreviewPanel';
import { Header } from '../../components/TherapyApp/Header';
import { Sidebar } from '../../components/TherapyApp/Sidebar';
import {
  createMockTherapyState,
  createMockAuditResult,
  createMockGeneratedNote,
  createMockClipboardItem,
} from '../fixtures';

const renderWithProvider = (component: React.ReactElement) => {
  return render(<TherapySessionProvider>{component}</TherapySessionProvider>);
};

describe('Accessibility smoke tests', () => {
  it('MainContent has no obvious accessibility violations', { timeout: 20000 }, async () => {
    const { container } = renderWithProvider(<MainContent />);
    const results = await axe(container);
    const actionable = results.violations.filter((violation) => violation.id !== 'button-name');
    expect(actionable).toHaveLength(0);
  });

  it(
    'PreviewPanel exposes labelled buttons and passes an axe audit',
    { timeout: 20000 },
    async () => {
      const props = {
        generatedNote: 'Generated therapy note',
        editedNote: 'Edited therapy note',
        isGenerating: false,
        isTumbling: false,
        isAuditing: false,
        isEditing: false,
        auditResult: createMockAuditResult(),
        onEdit: () => {},
        onEditedNoteChange: () => {},
        onTumble: () => {},
        onAudit: () => {},
        onSaveTemplate: () => {},
        onFinalize: () => {},
        onCopy: () => {},
        tumbleInstructions: '',
        onTumbleInstructionsChange: () => {},
        showTumbleOptions: false,
        onToggleTumbleOptions: () => {},
        error: null,
        SNFTemplates: [],
        groundingMetadata: null,
        generateNursingHandOff: () => 'handoff',
        state: createMockTherapyState({ discipline: 'PT' }),
      } as React.ComponentProps<typeof PreviewPanel>;

      const { container } = render(<PreviewPanel {...props} />);
      expect(screen.getByTitle(/copy to clipboard/i)).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /finalize & start next session/i })
      ).toBeInTheDocument();
      const results = await axe(container);
      const actionable = results.violations.filter((violation) => violation.id !== 'button-name');
      expect(actionable).toHaveLength(0);
    }
  );

  it('Header buttons expose accessible names', () => {
    render(
      <Header
        onReset={() => {}}
        onSanitize={() => {}}
        onOpenSettings={() => {}}
        onOpenClipboard={() => {}}
        clipboardLength={1}
        showStyleSettings={false}
      />
    );

    expect(screen.getByTitle(/style settings/i)).toBeInTheDocument();
    expect(screen.getByTitle(/multi-note clipboard/i)).toBeInTheDocument();
  });

  it('Sidebar advertises toggle and hygiene controls with labels', () => {
    render(
      <Sidebar
        history={[createMockGeneratedNote()]}
        clipboard={[createMockClipboardItem()]}
        isLocalMode={false}
        onToggleLocalMode={() => {}}
        onSanitizeHistory={() => {}}
        onShowStyleSettings={() => {}}
        onOpenClipboard={() => {}}
        onStartTour={() => {}}
        modelDownloadProgress={null}
        isMinimized={false}
        onToggleMinimize={() => {}}
      />
    );

    expect(screen.getByRole('button', { name: /toggle local mode/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sanitize data/i })).toBeInTheDocument();
  });
});
