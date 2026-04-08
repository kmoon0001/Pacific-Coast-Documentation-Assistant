import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useEffect } from 'react';
import { GenerateStep } from '../../../components/TherapyApp/steps/GenerateStep';
import { useSession } from '../../../contexts/TherapySessionContext';
import { renderWithTherapySession, mockAuditResults } from '../../fixtures';

const WithGeneratedNote = ({ note = 'Mock generated therapy note' }: { note?: string }) => {
  const session = useSession();
  useEffect(() => {
    session.setGeneratedNote(note);
    session.setEditedNote(note);
  }, [note, session]);
  return <GenerateStep />;
};

describe('GenerateStep Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the synthesis call-to-action when no note has been generated', () => {
    renderWithTherapySession(<GenerateStep />);

    expect(screen.getByRole('button', { name: /generate note/i })).toBeInTheDocument();
    expect(screen.getByText(/ready for synthesis/i)).toBeInTheDocument();
    expect(screen.getByText(/click generate to build clinical note/i)).toBeInTheDocument();
  });

  it('shows the editable note canvas and toolbar when a note exists', async () => {
    const user = userEvent.setup();
    renderWithTherapySession(<WithGeneratedNote />);

    const editor = await screen.findByRole('textbox', { name: /edit clinical note/i });
    expect(editor).toHaveValue('Mock generated therapy note');

    const writeSpy = vi.spyOn(navigator.clipboard, 'writeText');
    await user.click(screen.getByTitle(/copy to clipboard/i));
    expect(writeSpy).toHaveBeenCalledWith('Mock generated therapy note');
    writeSpy.mockRestore();
  });

  it('renders compliance findings when an audit result is available', async () => {
    renderWithTherapySession(<WithGeneratedNote />, {
      initialState: {
        auditResult: mockAuditResults.compliant,
      },
    });

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /compliance audit/i })).toBeInTheDocument();
    });
    expect(screen.getByText(/score: 95%/i)).toBeInTheDocument();
  });
  it('adds the generated note to the clipboard for cross-discipline reuse', async () => {
    const user = userEvent.setup();
    renderWithTherapySession(<WithGeneratedNote />);

    await user.click(screen.getByTitle(/add to clipboard/i));

    const clipboard = JSON.parse(localStorage.getItem('noteClipboard') || '[]');
    expect(clipboard).toHaveLength(1);
    expect(clipboard[0].content).toBe('Mock generated therapy note');
    expect(clipboard[0].title).toContain('PT Daily');
  });

  it('sanitizes stored history to keep disciplines fully separated', async () => {
    const history = [
      {
        content: 'Prior PT note about gait training',
        timestamp: '2024-03-01 10:00 AM',
        type: 'PT Daily',
      },
    ];
    sessionStorage.setItem('noteHistory', JSON.stringify(history));
    const user = userEvent.setup();

    renderWithTherapySession(<WithGeneratedNote />);

    expect(screen.getByText(/prior pt note about gait training/i)).toBeInTheDocument();
    await user.click(screen.getByTitle(/sanitize history \(hipaa\)/i));

    expect(await screen.findByText(/no history yet/i)).toBeInTheDocument();
    expect(sessionStorage.getItem('noteHistory')).toBeNull();
  });
});
