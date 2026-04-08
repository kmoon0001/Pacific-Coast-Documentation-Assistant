import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CPTCodeStep } from '../../../components/TherapyApp/steps/CPTCodeStep';
import { renderWithTherapySession } from '../../fixtures';

describe('CPTCodeStep Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the heading and helper copy', () => {
    renderWithTherapySession(<CPTCodeStep />);
    expect(screen.getByRole('heading', { name: /cpt code/i })).toBeInTheDocument();
    expect(screen.getByText(/billing & intervention category/i)).toBeInTheDocument();
  });

  it('lists the CPT codes for the active discipline', () => {
    renderWithTherapySession(<CPTCodeStep />);
    expect(screen.getByRole('button', { name: /97110/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /97530/i })).toBeInTheDocument();
  });

  it('allows the clinician to select a CPT code', async () => {
    const user = userEvent.setup();
    renderWithTherapySession(<CPTCodeStep />);

    const codeButton = screen.getByRole('button', { name: /97110/i });
    await user.click(codeButton);
    expect(codeButton).toHaveAttribute('aria-pressed', 'true');
  });
});
