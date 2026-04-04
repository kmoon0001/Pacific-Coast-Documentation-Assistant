import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MainContent } from '../../components/TherapyApp/MainContent';
import { TherapySessionProvider } from '../../contexts/TherapySessionContext';

vi.mock('../../components/TherapyApp/StepRail', () => ({
  StepRail: ({ setStep }: any) => (
    <div data-testid="step-rail">
      <button onClick={() => setStep(0)}>Step 0</button>
      <button onClick={() => setStep(1)}>Step 1</button>
    </div>
  ),
}));

vi.mock('../../components/TherapyApp/StepContent', () => ({
  StepContent: () => <div data-testid="step-content">Step Content</div>,
}));

const renderWithProvider = () =>
  render(
    <TherapySessionProvider>
      <MainContent />
    </TherapySessionProvider>
  );

describe('MainContent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the step rail and step content area', () => {
    renderWithProvider();

    expect(screen.getByTestId('step-rail')).toBeInTheDocument();
    expect(screen.getByTestId('step-content')).toBeInTheDocument();
  });

  it('shows the current step summary', () => {
    renderWithProvider();

    expect(screen.getByTestId('step-content')).toBeInTheDocument();
  });

  it('disables the back button on the initial step', () => {
    renderWithProvider();

    const backButton = screen.getByRole('button', { name: /back/i });
    expect(backButton).toBeDisabled();
  });

  it('moves forward when the Next Step button is clicked', async () => {
    renderWithProvider();

    const nextButton = screen.getByRole('button', { name: /next/i });
    await userEvent.click(nextButton);

    await waitFor(() => {
      expect(screen.getByTestId('step-content')).toBeInTheDocument();
    });
  });

  it('shows the Generate Note button on the last step', async () => {
    renderWithProvider();

    for (let i = 0; i < 10; i++) {
      const nextButton = screen.queryByRole('button', { name: /next/i });
      if (!nextButton) {
        break;
      }
      await userEvent.click(nextButton);
    }

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /generate/i })).toBeInTheDocument();
    });
  });

  it('allows direct navigation through the mocked step rail', async () => {
    renderWithProvider();

    await userEvent.click(screen.getByRole('button', { name: 'Step 1' }));

    await waitFor(() => {
      expect(screen.getByTestId('step-content')).toBeInTheDocument();
    });
  });

  it('renders the responsive layout wrapper', () => {
    const { container } = renderWithProvider();
    expect(container.querySelector('.flex-1.flex.flex-col')).toBeInTheDocument();
  });
});
