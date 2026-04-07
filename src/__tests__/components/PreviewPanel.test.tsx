import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PreviewPanel } from '../../components/TherapyApp/PreviewPanel';
import { createMockTherapyState, createMockAuditResult } from '../fixtures';

type PreviewPanelProps = React.ComponentProps<typeof PreviewPanel>;

const createProps = (overrides: Partial<PreviewPanelProps> = {}): PreviewPanelProps => ({
  generatedNote: 'Generated therapy note',
  editedNote: 'Edited therapy note',
  isGenerating: false,
  isTumbling: false,
  isAuditing: false,
  isEditing: false,
  auditResult: createMockAuditResult(),
  onEdit: vi.fn(),
  onEditedNoteChange: vi.fn(),
  onTumble: vi.fn(),
  onAudit: vi.fn(),
  onSaveTemplate: vi.fn(),
  onFinalize: vi.fn(),
  onCopy: vi.fn(),
  tumbleInstructions: '',
  onTumbleInstructionsChange: vi.fn(),
  showTumbleOptions: false,
  onToggleTumbleOptions: vi.fn(),
  error: null,
  groundingMetadata: undefined,
  SNFTemplates: [
    { id: 'template-1', name: 'Safety', content: 'Add fall-prevention cues.' },
  ],
  generateNursingHandOff: vi.fn(() => 'Handoff summary'),
  state: createMockTherapyState({
    discipline: 'PT',
    cptCode: '97110',
    mode: 'Lower Extremity Strengthening',
    activity: 'Active Range of Motion',
  }),
  ...overrides,
});

const renderPanel = (overrides: Partial<PreviewPanelProps> = {}) => {
  const props = createProps(overrides);
  return {
    props,
    user: userEvent.setup(),
    ...render(<PreviewPanel {...props} />),
  };
};

describe('PreviewPanel Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows the generating placeholder while a note is being created', () => {
    renderPanel({ isGenerating: true });

    expect(screen.getByText(/drafting clinical note/i)).toBeInTheDocument();
    expect(screen.queryByText(/clinical preview/i)).not.toBeInTheDocument();
  });

  it('shows the empty state when no note exists yet', () => {
    renderPanel({ generatedNote: null, editedNote: '' });

    expect(screen.getByText(/no note generated/i)).toBeInTheDocument();
  });

  it('renders the generated note content and audit summary', () => {
    renderPanel();

    expect(screen.getByText(/clinical preview/i)).toBeInTheDocument();
    expect(screen.getByText(/compliance score/i)).toBeInTheDocument();
    expect(screen.getByText(/edited therapy note/i)).toBeInTheDocument();
  });

  it('triggers toolbar actions including the nursing hand-off shortcut', async () => {
    const { props, user } = renderPanel();

    const clipboardSpy = vi.spyOn(navigator.clipboard, 'writeText');

    await user.click(screen.getByRole('button', { name: /copy to clipboard/i }));
    expect(props.onCopy).toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: /save as template/i }));
    expect(props.onSaveTemplate).toHaveBeenCalled();

    await user.click(screen.getByTitle(/nursing hand-off/i));
    expect(props.generateNursingHandOff).toHaveBeenCalledWith(expect.any(String), expect.any(Object));
    expect(clipboardSpy).toHaveBeenCalledWith('Handoff summary');
    clipboardSpy.mockRestore();
    expect(globalThis.alert).toHaveBeenCalled();
  });

  it('handles refinement controls, templates, and finalization', async () => {
    const { props, user } = renderPanel({ tumbleInstructions: 'Refine tone' });

    const refineInput = screen.getByPlaceholderText(/refine note/i);
    await user.type(refineInput, '!');
    expect(props.onTumbleInstructionsChange).toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: /apply refinement/i }));
    expect(props.onTumble).toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: /toggle refinement presets/i }));
    expect(props.onToggleTumbleOptions).toHaveBeenCalledWith(true);

    await user.click(screen.getByText('Safety'));
    expect(props.onEditedNoteChange).toHaveBeenCalledWith(expect.stringContaining('Add fall-prevention cues.'));

    await user.click(screen.getByText(/edit text/i));
    expect(props.onEdit).toHaveBeenCalledWith(true);

    await user.click(screen.getByRole('button', { name: /finalize & start next session/i }));
    expect(props.onFinalize).toHaveBeenCalled();
  });

  it('surfaces inline error messaging when provided', () => {
    renderPanel({ error: 'Network failure' });

    expect(screen.getByText('Network failure')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /dismiss alert/i })).toBeInTheDocument();
  });
});


