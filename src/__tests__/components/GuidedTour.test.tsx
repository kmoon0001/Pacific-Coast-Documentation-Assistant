import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GuidedTour } from '../../components/TherapyApp/GuidedTour';

const baseProps = {
  isActive: true,
  onClose: vi.fn(),
};

describe('GuidedTour Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock scrollIntoView for all elements
    Element.prototype.scrollIntoView = vi.fn();
  });

  it('renders the first step when active', () => {
    render(<GuidedTour {...baseProps} />);

    expect(screen.getByText(/welcome to theradoc/i)).toBeInTheDocument();
    expect(screen.getByText(/Step 1 of/i)).toBeInTheDocument();
  });

  it('does not render when the tour is inactive', () => {
    render(<GuidedTour {...baseProps} isActive={false} />);

    expect(screen.queryByText(/welcome to theradoc/i)).not.toBeInTheDocument();
  });

  it('advances and reverses steps with the navigation buttons', async () => {
    render(<GuidedTour {...baseProps} />);

    await userEvent.click(screen.getByRole('button', { name: /next/i }));
    expect(screen.getByText(/three main areas/i)).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /previous/i }));
    expect(screen.getByText(/welcome to theradoc/i)).toBeInTheDocument();
  });

  it('allows closing the tour from the skip button', async () => {
    render(<GuidedTour {...baseProps} />);

    await userEvent.click(screen.getByRole('button', { name: /skip tour/i }));
    expect(baseProps.onClose).toHaveBeenCalled();
  });
});
