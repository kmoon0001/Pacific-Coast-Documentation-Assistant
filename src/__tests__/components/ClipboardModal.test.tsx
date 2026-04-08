import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ClipboardModal } from '../../components/TherapyApp/ClipboardModal';
import { createMockClipboardItem } from '../fixtures';

const mockProps = {
  onClose: vi.fn(),
  clipboard: [
    createMockClipboardItem({ id: 'clipboard-1', title: 'Item 1', content: 'Content 1' }),
    createMockClipboardItem({ id: 'clipboard-2', title: 'Item 2', content: 'Content 2' }),
  ],
  onAdd: vi.fn(),
  onDelete: vi.fn(),
};

const renderModal = (overrides: Partial<typeof mockProps> = {}) =>
  render(<ClipboardModal {...mockProps} {...overrides} />);

describe('ClipboardModal Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows the stored snippets along with copy and delete controls', () => {
    renderModal();

    expect(screen.getByText(/note clipboard/i)).toBeInTheDocument();

    mockProps.clipboard.forEach((item) => {
      expect(screen.getByText(item.title)).toBeInTheDocument();
      expect(screen.getByText(item.content)).toBeInTheDocument();
    });

    expect(screen.getAllByTitle(/copy content/i).length).toBe(mockProps.clipboard.length);
    expect(screen.getAllByTitle(/delete snippet/i).length).toBe(mockProps.clipboard.length);
  });

  it('invokes the delete handler for an item', async () => {
    const user = userEvent.setup();
    renderModal();

    const deleteButtons = screen.getAllByTitle(/delete snippet/i);
    await user.click(deleteButtons[0]);
    expect(mockProps.onDelete).toHaveBeenCalledWith('clipboard-1');
  });

  it('renders the empty illustration when no snippets exist', () => {
    renderModal({ clipboard: [] });
    expect(screen.getByText(/clipboard is empty/i)).toBeInTheDocument();
  });
});
