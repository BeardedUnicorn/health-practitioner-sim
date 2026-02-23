import { PatientSession } from '../../../types';

export interface SessionFeedback {
  correct: boolean;
  message: string;
}

export interface SessionState {
  session: PatientSession | null;
  currentMessage: string;
  isLoading: boolean;
  feedback: SessionFeedback | null;
  showAnswer: boolean;
  showToolkit: boolean;
  showCoach: boolean;
  inlineCoachEnabled: boolean;
  performingAssessment: boolean;
  isStreaming: boolean;
  streamingContent: string;
  showEvaluation: boolean;
  userFinalAnswer: string;
}

export const INITIAL_SESSION_STATE: SessionState = {
  session: null,
  currentMessage: '',
  isLoading: false,
  feedback: null,
  showAnswer: false,
  showToolkit: false,
  showCoach: false,
  inlineCoachEnabled: false,
  performingAssessment: false,
  isStreaming: false,
  streamingContent: '',
  showEvaluation: false,
  userFinalAnswer: '',
};

export type SessionAction =
  | { type: 'set-session'; payload: PatientSession | null }
  | { type: 'update-session'; payload: (session: PatientSession | null) => PatientSession | null }
  | { type: 'set-current-message'; payload: string }
  | { type: 'set-loading'; payload: boolean }
  | { type: 'set-feedback'; payload: SessionFeedback | null }
  | { type: 'set-show-answer'; payload: boolean }
  | { type: 'set-show-toolkit'; payload: boolean }
  | { type: 'set-show-coach'; payload: boolean }
  | { type: 'set-inline-coach-enabled'; payload: boolean }
  | { type: 'set-performing-assessment'; payload: boolean }
  | { type: 'set-streaming'; payload: boolean }
  | { type: 'set-streaming-content'; payload: string }
  | { type: 'set-show-evaluation'; payload: boolean }
  | { type: 'set-user-final-answer'; payload: string }
  | { type: 'increment-hints-used' }
  | { type: 'reset-session' };

export function sessionReducer(state: SessionState, action: SessionAction): SessionState {
  switch (action.type) {
    case 'set-session':
      return {
        ...state,
        session: action.payload,
      };
    case 'update-session':
      return {
        ...state,
        session: action.payload(state.session),
      };
    case 'set-current-message':
      return {
        ...state,
        currentMessage: action.payload,
      };
    case 'set-loading':
      return {
        ...state,
        isLoading: action.payload,
      };
    case 'set-feedback':
      return {
        ...state,
        feedback: action.payload,
      };
    case 'set-show-answer':
      return {
        ...state,
        showAnswer: action.payload,
      };
    case 'set-show-toolkit':
      return {
        ...state,
        showToolkit: action.payload,
      };
    case 'set-show-coach':
      return {
        ...state,
        showCoach: action.payload,
      };
    case 'set-inline-coach-enabled':
      return {
        ...state,
        inlineCoachEnabled: action.payload,
      };
    case 'set-performing-assessment':
      return {
        ...state,
        performingAssessment: action.payload,
      };
    case 'set-streaming':
      return {
        ...state,
        isStreaming: action.payload,
      };
    case 'set-streaming-content':
      return {
        ...state,
        streamingContent: action.payload,
      };
    case 'set-show-evaluation':
      return {
        ...state,
        showEvaluation: action.payload,
      };
    case 'set-user-final-answer':
      return {
        ...state,
        userFinalAnswer: action.payload,
      };
    case 'increment-hints-used':
      if (!state.session) return state;
      return {
        ...state,
        session: {
          ...state.session,
          hintsUsed: (state.session.hintsUsed || 0) + 1,
        },
      };
    case 'reset-session':
      return {
        ...INITIAL_SESSION_STATE,
      };
    default:
      return state;
  }
}
