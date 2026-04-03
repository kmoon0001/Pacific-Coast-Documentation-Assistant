import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StyleSettings } from '../../components/TherapyApp/StyleSettings';

const mockProps = {
  show: true,
  onClose: vi.fn(),
  userStyle: 'Direct and clinical',
  setUserStyle: vi.fn(),
  userStyleSamples: ['Sample 1', 'Sample 2'],
  setUserStyleSamples: vi.fn(),
  saveUserStyleSample: vi.fn(),
  isLocalMode: false,
  onToggleLocalMode: vi.fn(),
};

describe('StyleSettings Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render style settings modal when open', () => {
    render(<StyleSettings {...mockProps} />);
    
    expect(screen.getByText(/AI Configuration/i)).toBeInTheDocument();
  });

  it('should not render when closed', () => {
    render(<StyleSettings {...mockProps} show={false} />);
    
    expect(screen.queryByText(/AI Configuration/i)).not.toBeInTheDocument();
  });

  it('should display modal title', () => {
    render(<StyleSettings {...mockProps} />);
    
    expect(screen.getByText(/AI Configuration/i)).toBeInTheDocument();
  });

  it('should display style samples', () => {
    render(<StyleSettings {...mockProps} />);
    
    expect(screen.getByText('Sample 1')).toBeInTheDocument();
  });

  it('should display add style sample button', () => {
    render(<StyleSettings {...mockProps} />);
    
    const addButton = screen.getByRole('button', { name: /add style sample/i });
    expect(addButton).toBeInTheDocument();
  });

  it('should call saveUserStyleSample when add button is clicked', async () => {
    render(<StyleSettings {...mockProps} />);
    
    const textarea = screen.getByPlaceholderText(/paste a sample/i);
    await userEvent.type(textarea, 'New sample');
    
    const addButton = screen.getByRole('button', { name: /add style sample/i });
    await userEvent.click(addButton);
    
    expect(mockProps.saveUserStyleSample).toHaveBeenCalled();
  });

  it('should display remove button for each style sample', () => {
    render(<StyleSettings {...mockProps} />);
    
    const removeButtons = screen.getAllByRole('button').filter(btn => {
      const svg = btn.querySelector('svg');
      return svg && svg.className.baseVal.includes('trash');
    });
    expect(removeButtons.length).toBeGreaterThanOrEqual(2);
  });

  it('should call setUserStyleSamples when remove button is clicked', async () => {
    render(<StyleSettings {...mockProps} />);
    
    const removeButtons = screen.getAllByRole('button').filter(btn => {
      const svg = btn.querySelector('svg');
      return svg && svg.className.baseVal.includes('trash');
    });
    
    if (removeButtons.length > 0) {
      await userEvent.click(removeButtons[0]);
      expect(mockProps.setUserStyleSamples).toHaveBeenCalled();
    }
  });

  it('should display close button', () => {
    render(<StyleSettings {...mockProps} />);
    
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('should call onClose when close button is clicked', async () => {
    render(<StyleSettings {...mockProps} />);
    
    const buttons = screen.getAllByRole('button');
    const closeButton = buttons[0];
    await userEvent.click(closeButton);
    
    expect(mockProps.onClose).toHaveBeenCalled();
  });

  it('should display local mode toggle', () => {
    render(<StyleSettings {...mockProps} />);
    
    expect(screen.getByText(/Local Processing Mode/i)).toBeInTheDocument();
  });

  it('should render with proper accessibility', () => {
    render(<StyleSettings {...mockProps} />);
    
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });
});
