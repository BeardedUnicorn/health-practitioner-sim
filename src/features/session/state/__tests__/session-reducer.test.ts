import { describe, expect, it } from 'vitest';
import { INITIAL_SESSION_STATE, sessionReducer } from '../session-reducer';
import { PatientSession } from '../../../../types';

const session: PatientSession = {
  diagnosis: 'Condition A',
  conversationHistory: [{ role: 'system', content: 'system prompt' }],
  turnsUsed: 0,
};

describe('sessionReducer', () => {
  it('sets every primitive session state field', () => {
    expect(sessionReducer(INITIAL_SESSION_STATE, { type: 'set-session', payload: session }).session).toBe(session);
    expect(sessionReducer(INITIAL_SESSION_STATE, { type: 'set-current-message', payload: 'draft' }).currentMessage).toBe('draft');
    expect(sessionReducer(INITIAL_SESSION_STATE, { type: 'set-loading', payload: true }).isLoading).toBe(true);
    expect(sessionReducer(INITIAL_SESSION_STATE, {
      type: 'set-feedback',
      payload: { correct: true, message: 'Correct' },
    }).feedback).toEqual({ correct: true, message: 'Correct' });
    expect(sessionReducer(INITIAL_SESSION_STATE, { type: 'set-show-answer', payload: true }).showAnswer).toBe(true);
    expect(sessionReducer(INITIAL_SESSION_STATE, { type: 'set-show-toolkit', payload: true }).showToolkit).toBe(true);
    expect(sessionReducer(INITIAL_SESSION_STATE, { type: 'set-show-coach', payload: true }).showCoach).toBe(true);
    expect(sessionReducer(INITIAL_SESSION_STATE, { type: 'set-inline-coach-enabled', payload: true }).inlineCoachEnabled).toBe(true);
    expect(sessionReducer(INITIAL_SESSION_STATE, { type: 'set-performing-assessment', payload: true }).performingAssessment).toBe(true);
    expect(sessionReducer(INITIAL_SESSION_STATE, { type: 'set-streaming', payload: true }).isStreaming).toBe(true);
    expect(sessionReducer(INITIAL_SESSION_STATE, { type: 'set-streaming-content', payload: 'hello' }).streamingContent).toBe('hello');
    expect(sessionReducer(INITIAL_SESSION_STATE, { type: 'set-show-evaluation', payload: true }).showEvaluation).toBe(true);
    expect(sessionReducer(INITIAL_SESSION_STATE, { type: 'set-user-final-answer', payload: 'answer' }).userFinalAnswer).toBe('answer');
  });

  it('updates conversation state via update-session action', () => {
    const seededState = sessionReducer(INITIAL_SESSION_STATE, {
      type: 'set-session',
      payload: session,
    });

    const nextState = sessionReducer(seededState, {
      type: 'update-session',
      payload: (session) => {
        if (!session) return null;
        return {
          ...session,
          turnsUsed: (session.turnsUsed || 0) + 1,
          conversationHistory: [
            ...session.conversationHistory,
            { role: 'user', content: 'Hello' },
          ],
        };
      },
    });

    expect(nextState.session?.turnsUsed).toBe(1);
    expect(nextState.session?.conversationHistory).toHaveLength(2);
  });

  it('increments hints when a session exists and leaves null sessions untouched', () => {
    expect(sessionReducer(INITIAL_SESSION_STATE, { type: 'increment-hints-used' })).toBe(INITIAL_SESSION_STATE);

    const firstHint = sessionReducer({ ...INITIAL_SESSION_STATE, session }, { type: 'increment-hints-used' });
    expect(firstHint.session?.hintsUsed).toBe(1);

    const nextHint = sessionReducer(firstHint, { type: 'increment-hints-used' });
    expect(nextHint.session?.hintsUsed).toBe(2);
  });

  it('resets state to defaults', () => {
    const dirtyState = {
      ...INITIAL_SESSION_STATE,
      currentMessage: 'draft',
      isLoading: true,
      showCoach: true,
    };

    const nextState = sessionReducer(dirtyState, { type: 'reset-session' });

    expect(nextState).toEqual(INITIAL_SESSION_STATE);
  });

  it('returns the same state for unknown actions', () => {
    const nextState = sessionReducer(INITIAL_SESSION_STATE, { type: 'unknown' } as never);

    expect(nextState).toBe(INITIAL_SESSION_STATE);
  });
});
