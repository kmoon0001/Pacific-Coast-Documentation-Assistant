import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ICD10Step } from '../../../components/TherapyApp/steps/ICD10Step';
import { renderWithTherapySession } from '../../fixtures';

describe('ICD10Step Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the heading and search box', () => {
    renderWithTherapySession(<ICD10Step />);

    expect(screen.getByRole('heading', { name: /icd-10 codes/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/search diagnosis or code/i)).toBeInTheDocument();
  });

  it('filters the diagnosis list based on the search term', async () => {
    const user = userEvent.setup();
    renderWithTherapySession(<ICD10Step />);

    const searchInput = screen.getByPlaceholderText(/search diagnosis or code/i);
    await user.type(searchInput, 'G20');

    expect(await screen.findByRole('button', { name: /parkinson's disease/i })).toBeInTheDocument();
  });

  it('allows selecting and clearing ICD-10 codes', async () => {
    const user = userEvent.setup();
    renderWithTherapySession(<ICD10Step />);

    const codeButton = await screen.findByRole('button', { name: /I63\.9/i });
    await user.click(codeButton);
    expect(codeButton).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText(/selected diagnoses \(1\)/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /clear all/i }));
    expect(screen.queryByText(/selected diagnoses \(1\)/i)).not.toBeInTheDocument();
  });
});
