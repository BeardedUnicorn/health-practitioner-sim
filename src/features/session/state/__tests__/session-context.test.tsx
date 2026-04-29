import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SessionProvider, useSessionContext } from '../session-context';
import { CaseSetup } from '../../../../types';

const runtime = {
  startSessionWithSetup: vi.fn(async (setupArg: CaseSetup) => {
    void setupArg;
    return true;
  }),
  sendMessage: vi.fn(async () => undefined),
  performAssessment: vi.fn(async () => undefined),
  forceSubmit: vi.fn(),
  stopStreaming: vi.fn(),
  resetSessionState: vi.fn(),
  cancelLoading: vi.fn(),
};

vi.mock('../../../../app/state/app-context', () => ({
  useAppContext: () => ({
    state: {
      apiConfig: {
        apiUrl: 'http://localhost:1234/v1',
        apiKey: '',
        modelName: 'model-a',
      },
      profession: 'nurse',
    },
    meta: {
      professionConfig: {
        id: 'nurse',
        patientLabel: 'Patient',
      },
    },
  }),
}));

vi.mock('../../hooks/useSessionRuntime', () => ({
  useSessionRuntime: ({ dispatch }: { dispatch: (action: unknown) => void }) => ({
    ...runtime,
    startSessionWithSetup: async (nextSetup: CaseSetup) => {
      const started = await runtime.startSessionWithSetup(nextSetup);
      dispatch({
        type: 'set-session',
        payload: {
          diagnosis: 'Condition A',
          conversationHistory: [{ role: 'system', content: 'system' }],
          caseSetup: nextSetup,
          turnsUsed: nextSetup.category === 'In progress' ? 0 : nextSetup.maxTurns ?? 0,
          mode: nextSetup.mode,
          hintsUsed: nextSetup.mode === 'exam' ? 0 : undefined,
        },
      });
      return started;
    },
  }),
}));

const setup = {
  profession: 'nurse' as const,
  category: 'Cardiology',
  difficulty: 'beginner' as const,
  setting: 'clinic' as const,
  timePressureEnabled: true,
  maxTurns: 1,
  mode: 'exam' as const,
  createdAt: 1,
};

function SessionProbe() {
  const { state, actions, meta } = useSessionContext();

  return (
    <div>
      <div data-testid="message">{state.currentMessage}</div>
      <div data-testid="session">{state.session?.diagnosis ?? 'none'}</div>
      <div data-testid="answer">{String(state.showAnswer)}</div>
      <div data-testid="toolkit">{String(state.showToolkit)}</div>
      <div data-testid="coach">{String(state.showCoach)}</div>
      <div data-testid="inline">{String(state.inlineCoachEnabled)}</div>
      <div data-testid="evaluation">{String(state.showEvaluation)}</div>
      <div data-testid="hints">{state.session?.hintsUsed ?? 'none'}</div>
      <div data-testid="exhausted">{String(meta.turnsExhausted)}</div>
      <button onClick={() => actions.setCurrentMessage('draft')}>message</button>
      <button onClick={() => actions.setShowAnswer(true)}>answer</button>
      <button onClick={() => actions.setShowToolkit(true)}>toolkit</button>
      <button onClick={() => actions.setShowCoach(true)}>coach</button>
      <button onClick={() => actions.setInlineCoachEnabled(true)}>inline</button>
      <button onClick={() => actions.setShowEvaluation(true)}>evaluation</button>
      <button onClick={() => actions.applyCoachSuggestion('suggestion')}>suggestion</button>
      <button onClick={actions.revealHint}>hint</button>
      <button onClick={() => actions.startSessionWithSetup(setup)}>start</button>
      <button onClick={() => actions.startSessionWithSetup({ ...setup, category: 'In progress' })}>start in progress</button>
      <button onClick={actions.sendMessage}>send</button>
      <button onClick={() => actions.performAssessment('vitals', 'Blood Pressure')}>assessment</button>
      <button onClick={actions.forceSubmit}>force</button>
      <button onClick={actions.stopStreaming}>stop</button>
      <button onClick={actions.resetSessionState}>reset</button>
      <button onClick={actions.cancelLoading}>cancel</button>
      <button onClick={actions.endSession}>end</button>
    </div>
  );
}

function SessionOutsideProvider() {
  useSessionContext();
  return null;
}

describe('SessionProvider', () => {
  beforeEach(() => {
    Object.values(runtime).forEach((fn) => fn.mockClear());
  });

  it('exposes local dispatch actions and runtime actions', async () => {
    render(
      <SessionProvider>
        <SessionProbe />
      </SessionProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'message' }));
    expect(screen.getByTestId('message')).toHaveTextContent('draft');
    fireEvent.click(screen.getByRole('button', { name: 'answer' }));
    fireEvent.click(screen.getByRole('button', { name: 'toolkit' }));
    fireEvent.click(screen.getByRole('button', { name: 'coach' }));
    fireEvent.click(screen.getByRole('button', { name: 'inline' }));
    fireEvent.click(screen.getByRole('button', { name: 'evaluation' }));
    expect(screen.getByTestId('answer')).toHaveTextContent('true');
    expect(screen.getByTestId('toolkit')).toHaveTextContent('true');
    expect(screen.getByTestId('coach')).toHaveTextContent('true');
    expect(screen.getByTestId('inline')).toHaveTextContent('true');
    expect(screen.getByTestId('evaluation')).toHaveTextContent('true');

    fireEvent.click(screen.getByRole('button', { name: 'suggestion' }));
    expect(screen.getByTestId('message')).toHaveTextContent('suggestion');

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'start' }));
    });
    fireEvent.click(screen.getByRole('button', { name: 'send' }));
    fireEvent.click(screen.getByRole('button', { name: 'assessment' }));
    fireEvent.click(screen.getByRole('button', { name: 'force' }));
    fireEvent.click(screen.getByRole('button', { name: 'stop' }));
    fireEvent.click(screen.getByRole('button', { name: 'reset' }));
    fireEvent.click(screen.getByRole('button', { name: 'cancel' }));
    fireEvent.click(screen.getByRole('button', { name: 'end' }));

    await waitFor(() => expect(runtime.startSessionWithSetup).toHaveBeenCalledWith(setup));
    expect(runtime.sendMessage).toHaveBeenCalledOnce();
    expect(runtime.performAssessment).toHaveBeenCalledWith('vitals', 'Blood Pressure');
    expect(runtime.forceSubmit).toHaveBeenCalledOnce();
    expect(runtime.stopStreaming).toHaveBeenCalledOnce();
    expect(runtime.resetSessionState).toHaveBeenCalledTimes(2);
    expect(runtime.cancelLoading).toHaveBeenCalledOnce();
  });

  it('reveals hints and computes turns exhausted', async () => {
    render(
      <SessionProvider>
        <SessionProbe />
      </SessionProvider>,
    );

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'start' }));
    });
    await waitFor(() => expect(screen.getByTestId('session')).toHaveTextContent('Condition A'));
    expect(screen.getByTestId('exhausted')).toHaveTextContent('true');

    fireEvent.click(screen.getByRole('button', { name: 'hint' }));
    expect(screen.getByTestId('hints')).toHaveTextContent('1');
    expect(screen.getByTestId('coach')).toHaveTextContent('true');

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'start in progress' }));
    });
    await waitFor(() => expect(screen.getByTestId('exhausted')).toHaveTextContent('false'));
  });

  it('throws when useSessionContext is outside SessionProvider', () => {
    expect(() => render(<SessionOutsideProvider />)).toThrow('useSessionContext must be used within SessionProvider');
  });
});
