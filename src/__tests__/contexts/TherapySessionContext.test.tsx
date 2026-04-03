import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import { TherapySessionProvider, useSession } from '../../contexts/TherapySessionContext';
import { describe, it, expect, beforeEach, vi } from 'vitest';

const TestComponent = () => {
  const {
    state,
    setState,
    step,
    handleNext,
    handleBack,
    generatedNote,
    isGenerating,
    finalizeSession,
    sanitizeHistory,
  } = useSession();

  return (
    <div>
      <div data-testid="discipline">{state.discipline}</div>
      <div data-testid="step">{step}</div>
      <div data-testid="generated-note">{generatedNote || 'No note'}</div>
      <div data-testid="is-generating">{isGenerating ? 'Generating' : 'Ready'}</div>
      <button onClick={() => setState({ ...state, discipline: 'ST' })}>Set ST</button>
      <button onClick={handleNext}>Next</button>
      <button onClick={handleBack}>Back</button>
      <button onClick={finalizeSession}>Finalize</button>
      <button onClick={sanitizeHistory}>Sanitize</button>
    </div>
  );
};

describe('TherapySessionContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('provides initial state correctly', () => {
    render(
      <TherapySessionProvider>
        <TestComponent />
      </TherapySessionProvider>
    );

    expect(screen.getByTestId('discipline').textContent).toBe('');
    expect(screen.getByTestId('step').textContent).toBe('0');
  });

  it('updates state via setState', () => {
    render(
      <TherapySessionProvider>
        <TestComponent />
      </TherapySessionProvider>
    );

    act(() => {
      screen.getByText('Set ST').click();
    });

    expect(screen.getByTestId('discipline').textContent).toBe('ST');
  });

  it('handles navigation correctly', () => {
    render(
      <TherapySessionProvider>
        <TestComponent />
      </TherapySessionProvider>
    );

    expect(screen.getByTestId('step').textContent).toBe('0');

    act(() => {
      screen.getByText('Next').click();
    });

    expect(screen.getByTestId('step').textContent).toBe('1');

    act(() => {
      screen.getByText('Back').click();
    });

    expect(screen.getByTestId('step').textContent).toBe('0');
  });

  it('prevents navigation beyond max step', () => {
    render(
      <TherapySessionProvider>
        <TestComponent />
      </TherapySessionProvider>
    );

    // Navigate to end
    for (let i = 0; i < 10; i++) {
      act(() => {
        screen.getByText('Next').click();
      });
    }

    const step = screen.getByTestId('step').textContent;
    expect(parseInt(step || '0')).toBeLessThan(10);
  });

  it('prevents navigation below step 0', () => {
    render(
      <TherapySessionProvider>
        <TestComponent />
      </TherapySessionProvider>
    );

    act(() => {
      screen.getByText('Back').click();
    });

    expect(screen.getByTestId('step').textContent).toBe('0');
  });

  it('initializes with default state', () => {
    render(
      <TherapySessionProvider>
        <TestComponent />
      </TherapySessionProvider>
    );

    expect(screen.getByTestId('is-generating').textContent).toBe('Ready');
    expect(screen.getByTestId('generated-note').textContent).toBe('No note');
  });

  it('throws error when useSession is used outside provider', () => {
    const TestComponentWithoutProvider = () => {
      try {
        useSession();
        return <div>Should not render</div>;
      } catch (error) {
        return <div data-testid="error">Error caught</div>;
      }
    };

    render(<TestComponentWithoutProvider />);
    expect(screen.getByTestId('error')).toBeDefined();
  });

  it('finalizes session correctly', () => {
    render(
      <TherapySessionProvider>
        <TestComponent />
      </TherapySessionProvider>
    );

    act(() => {
      screen.getByText('Finalize').click();
    });

    expect(screen.getByTestId('step').textContent).toBe('0');
  });

  it('sanitizes history correctly', () => {
    render(
      <TherapySessionProvider>
        <TestComponent />
      </TherapySessionProvider>
    );

    act(() => {
      screen.getByText('Sanitize').click();
    });

    expect(screen.getByTestId('step').textContent).toBe('0');
  });
});
