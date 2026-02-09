/* eslint-disable react-refresh/only-export-components */
import { createContext, ReactNode, use, useMemo, useReducer } from 'react';
import { CaseSetup } from '../../../types';
import { useAppContext } from '../../../app/state/app-context';
import { INITIAL_SESSION_STATE, SessionState, sessionReducer } from './session-reducer';
import { useSessionRuntime } from '../hooks/useSessionRuntime';

interface SessionActions {
  setCurrentMessage: (message: string) => void;
  setShowAnswer: (value: boolean) => void;
  setShowToolkit: (value: boolean) => void;
  setShowCoach: (value: boolean) => void;
  setInlineCoachEnabled: (value: boolean) => void;
  setShowEvaluation: (value: boolean) => void;
  applyCoachSuggestion: (text: string) => void;
  startSessionWithSetup: (setup: CaseSetup) => Promise<boolean>;
  sendMessage: () => Promise<void>;
  performAssessment: (assessmentType: string, assessmentName: string) => Promise<void>;
  forceSubmit: () => void;
  stopStreaming: () => void;
  resetSessionState: () => void;
  cancelLoading: () => void;
  endSession: () => void;
}

interface SessionMeta {
  turnsExhausted: boolean;
}

export interface SessionContextValue {
  state: SessionState;
  actions: SessionActions;
  meta: SessionMeta;
}

const SessionContext = createContext<SessionContextValue | null>(null);

interface SessionProviderProps {
  children: ReactNode;
}

export function SessionProvider({ children }: SessionProviderProps) {
  const [state, dispatch] = useReducer(sessionReducer, INITIAL_SESSION_STATE);
  const { state: appState, meta: appMeta } = useAppContext();

  const runtime = useSessionRuntime({
    apiConfig: appState.apiConfig,
    profession: appState.profession,
    professionConfig: appMeta.professionConfig,
    state,
    dispatch,
  });

  const turnsExhausted = !!(
    state.session?.caseSetup?.timePressureEnabled &&
    state.session?.caseSetup?.maxTurns &&
    (state.session?.turnsUsed || 0) >= state.session.caseSetup.maxTurns &&
    !state.feedback
  );

  const value = useMemo<SessionContextValue>(
    () => ({
      state,
      actions: {
        setCurrentMessage: (message) => dispatch({ type: 'set-current-message', payload: message }),
        setShowAnswer: (value) => dispatch({ type: 'set-show-answer', payload: value }),
        setShowToolkit: (value) => dispatch({ type: 'set-show-toolkit', payload: value }),
        setShowCoach: (value) => dispatch({ type: 'set-show-coach', payload: value }),
        setInlineCoachEnabled: (value) => dispatch({ type: 'set-inline-coach-enabled', payload: value }),
        setShowEvaluation: (value) => dispatch({ type: 'set-show-evaluation', payload: value }),
        applyCoachSuggestion: (text) => dispatch({ type: 'set-current-message', payload: text }),
        startSessionWithSetup: runtime.startSessionWithSetup,
        sendMessage: runtime.sendMessage,
        performAssessment: runtime.performAssessment,
        forceSubmit: runtime.forceSubmit,
        stopStreaming: runtime.stopStreaming,
        resetSessionState: runtime.resetSessionState,
        cancelLoading: runtime.cancelLoading,
        endSession: runtime.resetSessionState,
      },
      meta: {
        turnsExhausted,
      },
    }),
    [runtime, state, turnsExhausted],
  );

  return <SessionContext value={value}>{children}</SessionContext>;
}

export function useSessionContext(): SessionContextValue {
  const context = use(SessionContext);
  if (!context) {
    throw new Error('useSessionContext must be used within SessionProvider');
  }
  return context;
}
