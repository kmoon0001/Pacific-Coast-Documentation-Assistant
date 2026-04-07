import { describe, it, expect, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DetailsStep } from '../../../components/TherapyApp/steps/DetailsStep';
import { renderWithTherapySession, createMockTherapyState } from '../../fixtures';
import { Discipline, TherapyState } from '../../../types';

const seedTemplates = (templates: Array<{ name: string; state: TherapyState }>) => {
  localStorage.setItem('customTemplates', JSON.stringify(templates));
};

const defaultSessionState: Partial<TherapyState> = {
  discipline: 'PT' as Discipline,
  documentType: 'Daily' as const,
  cptCode: '97110',
  mode: 'Lower Extremity Strengthening',
  activity: 'Closed Kinetic Chain',
  details: {},
};

const renderDetails = (overrides: Partial<TherapyState> = {}) =>
  renderWithTherapySession(<DetailsStep />, {
    initialState: createMockTherapyState({ ...defaultSessionState, ...overrides }),
  });

describe('DetailsStep Component', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('only renders templates that match the current discipline and activity fingerprint', () => {
    seedTemplates([
      {
        name: 'PT Strength Template',
        state: createMockTherapyState({
          ...defaultSessionState,
        }),
      },
      {
        name: 'OT Dressing Flow',
        state: createMockTherapyState({
          discipline: 'OT',
          documentType: 'Assessment',
          cptCode: '97165',
          mode: 'Adaptive Equipment Training',
          activity: 'Dressing Aids',
          details: {},
        }),
      },
    ]);

    renderDetails();

    expect(screen.getByRole('button', { name: /pt strength template/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /ot dressing flow/i })).not.toBeInTheDocument();
  });

  it('loads stored detail values when a template is applied', async () => {
    seedTemplates([
      {
        name: 'PT Strength Template',
        state: createMockTherapyState({
          ...defaultSessionState,
          details: {
            Exercise: ['Squats', 'Leg Press'],
            Reps: '15',
          },
        }),
      },
    ]);

    const user = userEvent.setup();
    renderDetails();

    await user.click(screen.getByRole('button', { name: /pt strength template/i }));

    const repsInput = screen.getByPlaceholderText(/enter reps/i) as HTMLInputElement;
    expect(repsInput.value).toBe('15');
    const squatsChip = screen.getByRole('button', { name: /squats/i });
    const legPressChip = screen.getByRole('button', { name: /leg press/i });
    expect(squatsChip.className).toContain('bg-zinc-950');
    expect(legPressChip.className).toContain('bg-zinc-950');
  });

  it('supports toggling multi-select activity chips without leaking disciplines', async () => {
    renderDetails();
    const user = userEvent.setup();

    const squatsChip = screen.getByRole('button', { name: /squats/i });
    const legPressChip = screen.getByRole('button', { name: /leg press/i });

    await user.click(squatsChip);
    await user.click(legPressChip);

    expect(squatsChip.className).toContain('bg-zinc-950');
    expect(legPressChip.className).toContain('bg-zinc-950');

    await user.click(squatsChip);
    expect(squatsChip.className).not.toContain('bg-zinc-950');
  });
});
