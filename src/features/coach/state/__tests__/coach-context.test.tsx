import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CoachProvider, coachReducer, useCoachContext } from '../coach-context';

function CoachProbe() {
  const { state, actions, meta } = useCoachContext();

  return (
    <div>
      <div data-testid="selection">{state.selectedSuggestionText ?? 'none'}</div>
      <div data-testid="selected-at">{state.lastSelectionAt ?? 'none'}</div>
      <div data-testid="selection-count">{meta.selectionCount}</div>
      <button onClick={() => actions.selectSuggestion('Ask about pain')}>select</button>
      <button onClick={actions.clearSelection}>clear</button>
    </div>
  );
}

function CoachOutsideProvider() {
  useCoachContext();
  return null;
}

describe('CoachProvider', () => {
  beforeEach(() => {
    vi.setSystemTime(new Date('2026-04-29T12:00:00Z'));
  });

  it('tracks selected suggestions and invokes callbacks', () => {
    const onSuggestionSelected = vi.fn();
    render(
      <CoachProvider onSuggestionSelected={onSuggestionSelected}>
        <CoachProbe />
      </CoachProvider>,
    );

    expect(screen.getByTestId('selection-count')).toHaveTextContent('0');
    fireEvent.click(screen.getByRole('button', { name: 'select' }));
    expect(screen.getByTestId('selection')).toHaveTextContent('Ask about pain');
    expect(screen.getByTestId('selected-at')).toHaveTextContent(String(Date.now()));
    expect(screen.getByTestId('selection-count')).toHaveTextContent('1');
    expect(onSuggestionSelected).toHaveBeenCalledWith('Ask about pain');

    fireEvent.click(screen.getByRole('button', { name: 'clear' }));
    expect(screen.getByTestId('selection')).toHaveTextContent('none');
    expect(screen.getByTestId('selection-count')).toHaveTextContent('0');
  });

  it('throws when useCoachContext is outside CoachProvider', () => {
    expect(() => render(<CoachOutsideProvider />)).toThrow('useCoachContext must be used within CoachProvider');
  });

  it('returns current state for unknown reducer actions', () => {
    const state = { selectedSuggestionText: 'Text', lastSelectionAt: 1 };

    expect(coachReducer(state, { type: 'unknown' } as never)).toBe(state);
  });
});
