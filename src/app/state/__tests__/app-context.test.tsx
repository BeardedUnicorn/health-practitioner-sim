import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppProvider, useAppContext } from '../app-context';

function AppContextProbe() {
  const { state, actions, meta } = useAppContext();

  return (
    <div>
      <div data-testid="screen">{state.screen}</div>
      <div data-testid="profession">{state.profession ?? 'none'}</div>
      <div data-testid="settings">{String(state.showSettings)}</div>
      <div data-testid="model">{state.apiConfig.modelName}</div>
      <div data-testid="sessions">{state.progress.sessions.length}</div>
      <div data-testid="coach-width">{state.coachWidth}</div>
      <div data-testid="profession-config">{meta.professionConfig?.id ?? 'none'}</div>
      <button onClick={() => actions.setScreen('progress')}>screen</button>
      <button onClick={() => actions.selectProfession('nurse')}>select</button>
      <button onClick={actions.resetProfession}>reset</button>
      <button onClick={actions.openSettings}>open settings</button>
      <button onClick={actions.closeSettings}>close settings</button>
      <button onClick={() => actions.setApiConfig({
        apiUrl: 'https://api.test/v1',
        apiKey: 'secret',
        modelName: 'model-b',
      })}
      >
        api
      </button>
      <button onClick={actions.refreshProgress}>progress</button>
      <button onClick={() => actions.setCoachWidth(512)}>coach width</button>
    </div>
  );
}

function AppContextOutsideProvider() {
  useAppContext();
  return null;
}

describe('AppProvider', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.setSystemTime(new Date('2026-04-29T12:00:00Z'));
  });

  it('exposes state, actions, and derived profession config', () => {
    localStorage.setItem('healthcare-trainer-progress', JSON.stringify({
      sessions: [],
      lastUpdated: 1,
    }));

    render(
      <AppProvider>
        <AppContextProbe />
      </AppProvider>,
    );

    expect(screen.getByTestId('screen')).toHaveTextContent('profession-select');
    expect(screen.getByTestId('profession-config')).toHaveTextContent('none');

    fireEvent.click(screen.getByRole('button', { name: 'screen' }));
    expect(screen.getByTestId('screen')).toHaveTextContent('progress');

    fireEvent.click(screen.getByRole('button', { name: 'select' }));
    expect(screen.getByTestId('profession')).toHaveTextContent('nurse');
    expect(screen.getByTestId('screen')).toHaveTextContent('ready');
    expect(screen.getByTestId('profession-config')).toHaveTextContent('nurse');

    fireEvent.click(screen.getByRole('button', { name: 'open settings' }));
    expect(screen.getByTestId('settings')).toHaveTextContent('true');
    fireEvent.click(screen.getByRole('button', { name: 'close settings' }));
    expect(screen.getByTestId('settings')).toHaveTextContent('false');

    fireEvent.click(screen.getByRole('button', { name: 'api' }));
    expect(screen.getByTestId('model')).toHaveTextContent('model-b');

    localStorage.setItem('healthcare-trainer-progress', JSON.stringify({
      sessions: [{ id: 'session-1' }],
      lastUpdated: 2,
    }));
    fireEvent.click(screen.getByRole('button', { name: 'progress' }));
    expect(screen.getByTestId('sessions')).toHaveTextContent('1');

    fireEvent.click(screen.getByRole('button', { name: 'coach width' }));
    expect(screen.getByTestId('coach-width')).toHaveTextContent('512');

    fireEvent.click(screen.getByRole('button', { name: 'reset' }));
    expect(screen.getByTestId('profession')).toHaveTextContent('none');
    expect(screen.getByTestId('screen')).toHaveTextContent('profession-select');
  });

  it('throws when useAppContext is outside AppProvider', () => {
    expect(() => render(<AppContextOutsideProvider />)).toThrow('useAppContext must be used within AppProvider');
  });
});
