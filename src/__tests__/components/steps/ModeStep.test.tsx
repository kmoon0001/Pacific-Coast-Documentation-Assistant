import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ModeStep } from '../../../components/TherapyApp/steps/ModeStep';
import { renderWithTherapySession } from '../../fixtures';

const renderModeStep = (initialState: Record<string, any> = {}) =>
  renderWithTherapySession(<ModeStep />, {
    initialState: {
      discipline: 'PT',
      cptCode: '97110',
      ...initialState,
    },
  });

describe('ModeStep Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('lists the available PT mode options for the selected CPT code', () => {
    renderModeStep();

    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(1);
    expect(buttons.some((btn) => /flexibility\/stretching/i.test(btn.textContent || ''))).toBe(
      true
    );
  });

  it('highlights the currently selected mode', () => {
    renderModeStep({ mode: 'Flexibility/Stretching' });

    const selected = screen.getByRole('button', { name: /flexibility\/stretching/i });
    expect(selected.className).toContain('bg-zinc-950');
  });

  it('allows the clinician to pick a new mode', async () => {
    renderModeStep({ mode: 'Flexibility/Stretching' });

    const target = screen.getByRole('button', { name: /aerobic conditioning/i });
    await userEvent.click(target);

    const updated = screen.getByRole('button', { name: /aerobic conditioning/i });
    expect(updated.className).toContain('bg-zinc-950');
  });
});
