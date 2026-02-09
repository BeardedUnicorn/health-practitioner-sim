/* eslint-disable react-refresh/only-export-components */
import { createContext, ReactNode, use, useMemo, useReducer } from 'react';

interface CoachState {
  selectedSuggestionText: string | null;
  lastSelectionAt: number | null;
}

interface CoachActions {
  selectSuggestion: (text: string) => void;
  clearSelection: () => void;
}

interface CoachMeta {
  selectionCount: number;
}

interface CoachContextValue {
  state: CoachState;
  actions: CoachActions;
  meta: CoachMeta;
}

type CoachAction =
  | { type: 'select'; payload: string }
  | { type: 'clear' };

const INITIAL_STATE: CoachState = {
  selectedSuggestionText: null,
  lastSelectionAt: null,
};

function coachReducer(state: CoachState, action: CoachAction): CoachState {
  switch (action.type) {
    case 'select':
      return {
        selectedSuggestionText: action.payload,
        lastSelectionAt: Date.now(),
      };
    case 'clear':
      return INITIAL_STATE;
    default:
      return state;
  }
}

const CoachContext = createContext<CoachContextValue | null>(null);

interface CoachProviderProps {
  children: ReactNode;
  onSuggestionSelected?: (text: string) => void;
}

export function CoachProvider({ children, onSuggestionSelected }: CoachProviderProps) {
  const [state, dispatch] = useReducer(coachReducer, INITIAL_STATE);

  const value = useMemo<CoachContextValue>(
    () => ({
      state,
      actions: {
        selectSuggestion: (text) => {
          dispatch({ type: 'select', payload: text });
          onSuggestionSelected?.(text);
        },
        clearSelection: () => {
          dispatch({ type: 'clear' });
        },
      },
      meta: {
        selectionCount: state.lastSelectionAt ? 1 : 0,
      },
    }),
    [onSuggestionSelected, state],
  );

  return <CoachContext value={value}>{children}</CoachContext>;
}

export function useCoachContext(): CoachContextValue {
  const context = use(CoachContext);
  if (!context) {
    throw new Error('useCoachContext must be used within CoachProvider');
  }
  return context;
}
