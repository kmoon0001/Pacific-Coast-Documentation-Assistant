import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DisciplineStep } from '../../../components/TherapyApp/steps/DisciplineStep';
import { renderWithTherapySession } from '../../fixtures';

describe('DisciplineStep Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderStep = () => renderWithTherapySession(<DisciplineStep />);

  it('renders the discipline cards with labels and descriptions', () => {
    renderStep();

    const grid = screen.getByTestId('discipline-grid');
    const headings = within(grid).getAllByRole('heading', { level: 3 });
    const labels = headings.map((node) => node.textContent);
    expect(labels).toEqual(expect.arrayContaining(['Physical Therapy', 'Occupational Therapy', 'Speech Therapy']));
    expect(screen.getByText(/mobility & function/i)).toBeInTheDocument();
  });

  it('updates the selected discipline when a card is clicked', async () => {
    const user = userEvent.setup();
    renderStep();

    const grid = screen.getByTestId('discipline-grid');
    const ptButton = within(grid).getByRole('button', { name: /physical therapy/i });
    await user.click(ptButton);

    expect(ptButton.className).toContain('bg-zinc-950');
  });
});
