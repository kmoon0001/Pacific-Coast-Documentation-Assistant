import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Sidebar } from '../../components/TherapyApp/Sidebar';
import { createMockGeneratedNote } from '../fixtures';

const mockProps = {
  history: [
    createMockGeneratedNote({ content: 'Note 1' }),
    createMockGeneratedNote({ content: 'Note 2' }),
  ],
  clipboard: [],
  isLocalMode: false,
  onToggleLocalMode: vi.fn(),
  onSanitizeHistory: vi.fn(),
  onShowStyleSettings: vi.fn(),
  onOpenClipboard: vi.fn(),
  onStartTour: vi.fn(),
  modelDownloadProgress: null,
  isMinimized: false,
  onToggleMinimize: vi.fn(),
};

describe('Sidebar Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the product chrome and key sections', () => {
    render(<Sidebar {...mockProps} />);

    expect(screen.getByText(/theradoc/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /recent history/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /note clipboard/i })).toBeInTheDocument();
  });

  it('lists out existing history entries and empty state messaging', () => {
    render(<Sidebar {...mockProps} />);

    mockProps.history.forEach((item) => {
      expect(screen.getByText(item.content)).toBeInTheDocument();
    });

    render(<Sidebar {...mockProps} history={[]} />);
    expect(screen.getByText(/no history yet/i)).toBeInTheDocument();
  });

  it('exposes the local mode toggle with the correct callback', async () => {
    const user = userEvent.setup();
    render(<Sidebar {...mockProps} />);

    const toggle = screen.getByRole('button', { name: /toggle local mode/i });
    await user.click(toggle);
    expect(mockProps.onToggleLocalMode).toHaveBeenCalledWith(true);
  });

  it('provides access to settings, tours, and hygiene actions', () => {
    render(<Sidebar {...mockProps} />);

    expect(screen.getByRole('button', { name: /style settings/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /guided tour/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sanitize data/i })).toBeInTheDocument();
  });
});
