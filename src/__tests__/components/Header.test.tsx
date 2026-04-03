import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Header } from '../../components/TherapyApp/Header';

const baseProps = {
  onReset: vi.fn(),
  onSanitize: vi.fn(),
  onOpenSettings: vi.fn(),
  onOpenClipboard: vi.fn(),
  clipboardLength: 0,
  showStyleSettings: false,
};

describe('Header component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the product name', () => {
    render(<Header {...baseProps} />);
    expect(screen.getByText(/TheraDoc/i)).toBeInTheDocument();
  });

  it('invokes sanitize callback', async () => {
    render(<Header {...baseProps} />);

    const sanitizeButton = screen.getByRole('button', { name: /hipaa/i });
    await userEvent.click(sanitizeButton);

    expect(baseProps.onSanitize).toHaveBeenCalledTimes(1);
  });

  it('invokes the clipboard callback and shows an indicator when notes exist', async () => {
    render(<Header {...baseProps} clipboardLength={2} />);

    const clipboardButton = screen.getByTitle(/clipboard/i);
    await userEvent.click(clipboardButton);

    expect(baseProps.onOpenClipboard).toHaveBeenCalled();
    expect(clipboardButton.querySelector('.w-2')).toBeInTheDocument();
  });

  it('invokes the reset callback', async () => {
    render(<Header {...baseProps} />);

    await userEvent.click(screen.getByTitle(/reset form/i));
    expect(baseProps.onReset).toHaveBeenCalled();
  });

  it('invokes the style settings callback and reflects the active state', async () => {
    const { rerender } = render(<Header {...baseProps} />);

    await userEvent.click(screen.getByTitle(/style settings/i));
    expect(baseProps.onOpenSettings).toHaveBeenCalled();

    rerender(<Header {...baseProps} showStyleSettings={true} />);
    const settingsIcon = screen.getByTitle(/style settings/i).querySelector('svg');
    expect(settingsIcon).toHaveClass('text-zinc-950');
  });
});
