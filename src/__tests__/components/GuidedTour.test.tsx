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
  });

  it('renders the first step when active', () => {
    render(<GuidedTour {...baseProps} />);

    expect(screen.getByText(/welcome to theradoc/i)).toBeInTheDocument();
    expect(screen.getByText('1 / 4')).toBeInTheDocument();
  });

  it('does not render when the tour is inactive', () => {
    render(<GuidedTour {...baseProps} isActive={false} />);

    expect(screen.queryByText(/welcome to theradoc/i)).not.toBeInTheDocument();
  });

  it('advances and reverses steps with the navigation buttons', async () => {
    render(<GuidedTour {...baseProps} />);

    await userEvent.click(screen.getByRole('button', { name: /next/i }));
    expect(screen.getByText(/sidebar/i)).toBeInTheDocument();
    expect(screen.getByText('2 / 4')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /previous/i }));
    expect(screen.getByText(/welcome to theradoc/i)).toBeInTheDocument();
  });

  it('finishes the tour on the last step', async () => {
    render(<GuidedTour {...baseProps} />);

    for (let i = 0; i < 3; i += 1) {
      await userEvent.click(screen.getByRole('button', { name: /next/i }));
    }

    await userEvent.click(screen.getByRole('button', { name: /finish/i }));
    expect(baseProps.onClose).toHaveBeenCalled();
  });

  it('allows closing the tour from the header button', async () => {
    render(<GuidedTour {...baseProps} />);

    await userEvent.click(screen.getByRole('button', { name: /close guided tour/i }));
    expect(baseProps.onClose).toHaveBeenCalled();
  });
});
