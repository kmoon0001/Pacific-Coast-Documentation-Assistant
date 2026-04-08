import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ActivityStep } from '../../../components/TherapyApp/steps/ActivityStep';
import { renderWithTherapySession } from '../../fixtures';

const renderActivityStep = (initialState: Record<string, any> = {}) =>
  renderWithTherapySession(<ActivityStep />, {
    initialState: {
      discipline: 'PT',
      cptCode: '97110',
      mode: 'Lower Extremity Strengthening',
      activity: 'Closed Kinetic Chain',
      ...initialState,
    },
  });

describe('ActivityStep Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('surfaces the available activities for the selected mode', () => {
    renderActivityStep({ activity: undefined });

    expect(screen.getByRole('heading', { name: /clinical activity/i })).toBeInTheDocument();
    expect(
      screen.getByText(/showing activities for lower extremity strengthening/i)
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /closed kinetic chain/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /open kinetic chain/i })).toBeInTheDocument();
  });

  it('highlights whichever activity is stored in session state', () => {
    renderActivityStep({ activity: 'Closed Kinetic Chain' });

    const selected = screen.getByRole('button', { name: /closed kinetic chain/i });
    expect(selected).toHaveAttribute('aria-pressed', 'true');
    expect(selected.className).toContain('bg-zinc-950');
  });

  it('allows clinicians to change the activity selection', async () => {
    renderActivityStep({ activity: 'Closed Kinetic Chain' });

    const option = screen.getByRole('button', { name: /open kinetic chain/i });
    await userEvent.click(option);

    expect(option).toHaveAttribute('aria-pressed', 'true');
    expect(option.className).toContain('bg-zinc-950');
  });
});
