import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DocumentTypeStep } from '../../../components/TherapyApp/steps/DocumentTypeStep';
import { renderWithTherapySession } from '../../fixtures';

describe('DocumentTypeStep Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderStep = () => renderWithTherapySession(<DocumentTypeStep />);

  it('lists the available document type templates', () => {
    renderStep();
    const grid = screen.getByTestId('doc-type-grid');
    const labels = within(grid).getAllByRole('heading', { level: 3 });
    expect(labels.map((node) => node.textContent)).toEqual(
      expect.arrayContaining(['Daily Note', 'Progress Report', 'Assessment'])
    );
  });

  it('toggles the selected template when a card is clicked', async () => {
    const user = userEvent.setup();
    renderStep();

    const grid = screen.getByTestId('doc-type-grid');
    const [dailyCard] = within(grid).getAllByRole('button', { name: /daily note/i });
    await user.click(dailyCard);

    expect(dailyCard.className).toContain('bg-zinc-950');
  });

  it('shows the brain-dump mode toggles for all document types', () => {
    renderStep();

    const toggleChips = screen.getAllByRole('button', { name: /note|report|assessment/i });
    expect(toggleChips.length).toBeGreaterThanOrEqual(5);
  });
});
