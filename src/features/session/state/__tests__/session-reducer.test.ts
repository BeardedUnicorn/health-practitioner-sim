import { describe, expect, it } from 'vitest';
import { INITIAL_SESSION_STATE, sessionReducer } from '../session-reducer';

describe('sessionReducer', () => {
  it('updates conversation state via update-session action', () => {
    const seededState = sessionReducer(INITIAL_SESSION_STATE, {
      type: 'set-session',
      payload: {
        diagnosis: 'Condition A',
        conversationHistory: [{ role: 'system', content: 'system prompt' }],
        turnsUsed: 0,
      },
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
});
