import { describe, expect, it } from 'vitest';
import { appReducer } from '../app-reducer';
import { AppState } from '../app-types';

const baseState: AppState = {
  screen: 'profession-select',
  profession: null,
  showSettings: false,
  apiConfig: {
    apiUrl: 'http://localhost:1234/v1',
    apiKey: '',
    modelName: 'model-a',
  },
  progress: {
    sessions: [],
    lastUpdated: 1,
  },
  coachWidth: 350,
};

describe('appReducer', () => {
  it('handles every app action', () => {
    expect(appReducer(baseState, { type: 'set-screen', payload: 'progress' }).screen).toBe('progress');

    const selected = appReducer(baseState, { type: 'select-profession', payload: 'nurse' });
    expect(selected.profession).toBe('nurse');
    expect(selected.screen).toBe('ready');

    const reset = appReducer({ ...baseState, profession: 'nurse', screen: 'session' }, {
      type: 'reset-profession',
    });
    expect(reset.profession).toBeNull();
    expect(reset.screen).toBe('profession-select');

    expect(appReducer(baseState, { type: 'set-show-settings', payload: true }).showSettings).toBe(true);

    const apiConfig = {
      apiUrl: 'https://example.test/v1',
      apiKey: 'key',
      modelName: 'model-b',
    };
    expect(appReducer(baseState, { type: 'set-api-config', payload: apiConfig }).apiConfig).toBe(apiConfig);

    const progress = {
      sessions: [],
      lastUpdated: 99,
    };
    expect(appReducer(baseState, { type: 'set-progress', payload: progress }).progress).toBe(progress);
    expect(appReducer(baseState, { type: 'set-coach-width', payload: 420 }).coachWidth).toBe(420);
  });

  it('returns the same state for unknown actions', () => {
    const nextState = appReducer(baseState, { type: 'unknown' } as never);

    expect(nextState).toBe(baseState);
  });
});
