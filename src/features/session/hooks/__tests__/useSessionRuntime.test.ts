import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { professionConfigs } from '../../../../config/professionConfig';
import { ApiConfig, CaseSetup, LlmStreamEvent, PatientSession, Profession } from '../../../../types';
import { INITIAL_SESSION_STATE, SessionAction, SessionState } from '../../state/session-reducer';
import { useSessionRuntime } from '../useSessionRuntime';

const requestCompletionMock = vi.hoisted(() => vi.fn());
const streamCompletionMock = vi.hoisted(() => vi.fn());

vi.mock('../../../../shared/llm/client', () => ({
  requestCompletion: requestCompletionMock,
  streamCompletion: streamCompletionMock,
}));

const apiConfig: ApiConfig = {
  apiUrl: 'http://localhost:1234/v1',
  apiKey: '',
  modelName: 'model-a',
};

const setup: CaseSetup = {
  profession: 'nurse',
  category: 'Cardiology',
  difficulty: 'beginner',
  setting: 'clinic',
  timePressureEnabled: false,
  maxTurns: null,
  mode: 'guided',
  createdAt: 1,
};

const session: PatientSession = {
  diagnosis: 'Pneumonia',
  conversationHistory: [
    { role: 'system', content: 'system prompt' },
    { role: 'assistant', content: 'Hello' },
  ],
  caseSetup: setup,
  turnsUsed: 0,
  mode: 'guided',
};

function state(overrides: Partial<SessionState> = {}): SessionState {
  return {
    ...INITIAL_SESSION_STATE,
    session,
    ...overrides,
  };
}

function renderRuntime(
  currentState: SessionState,
  profession: Profession | null = 'nurse',
  professionConfig = profession ? professionConfigs[profession] : null,
) {
  const dispatch = vi.fn();
  const hook = renderHook((nextState: SessionState) => useSessionRuntime({
    apiConfig,
    profession,
    professionConfig,
    state: nextState,
    dispatch,
  }), {
    initialProps: currentState,
  });

  return { ...hook, dispatch };
}

async function* streamEvents(events: LlmStreamEvent[]) {
  for (const event of events) {
    yield event;
  }
}

function isStreamEvent(value: unknown): value is LlmStreamEvent {
  void value;
  return false;
}

async function* throwFromStream(error: unknown): AsyncGenerator<LlmStreamEvent> {
  if (isStreamEvent(error)) {
    yield error;
  }
  throw error;
}

function last<T>(items: T[]): T | undefined {
  return items[items.length - 1];
}

function actionsOf<T extends SessionAction['type']>(
  dispatch: ReturnType<typeof vi.fn>,
  type: T,
): Extract<SessionAction, { type: T }>[] {
  return dispatch.mock.calls
    .map(([action]) => action as SessionAction)
    .filter((action): action is Extract<SessionAction, { type: T }> => action.type === type);
}

describe('useSessionRuntime', () => {
  beforeEach(() => {
    requestCompletionMock.mockReset();
    streamCompletionMock.mockReset();
    vi.useFakeTimers();
    vi.spyOn(window, 'alert').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('starts sessions and extracts diagnosis variants with profession-specific greetings', async () => {
    const cases: Array<[Profession, string, string]> = [
      ['nurse', 'DIAGNOSIS: Pneumonia\nPATIENT_PROFILE: adult', "Hello, I'm not feeling well"],
      ['psychologist', 'DIAGNOSIS: anxiety\nPATIENT_PROFILE: adult', "I'm not really sure where to start"],
      ['therapist', 'UNDERLYING_NEED: reassurance\nPATIENT_PROFILE: adult', "I'm not really sure where to start"],
      ['pregnancyPartner', 'SITUATION: contractions\nPATIENT_PROFILE: adult', '*sighs* Hey'],
      ['doula', 'PATIENT_PROFILE: adult', "I'm so glad you're here"],
      ['couplesTherapist', 'PARTNER_A_NAME: Alex\nPARTNER_B_NAME: Jordan\nNEGATIVE_CYCLE: pursue-withdraw', 'Alex'],
      ['couplesTherapist', 'NEGATIVE_CYCLE: pursue-withdraw', 'Partner A'],
    ];

    for (const [profession, setupContent, expectedGreeting] of cases) {
      requestCompletionMock.mockResolvedValueOnce({ choices: [{ message: { content: setupContent } }] });
      const currentSetup = { ...setup, profession, mode: profession === 'nurse' ? 'exam' as const : 'guided' as const };
      const { result, dispatch } = renderRuntime(state({ session: null }), profession, professionConfigs[profession]);

      let started: boolean | undefined;
      await act(async () => {
        started = await result.current.startSessionWithSetup(currentSetup);
      });
      expect(started).toBe(true);

      const setSession = last(actionsOf(dispatch, 'set-session'));
      expect(setSession?.payload?.conversationHistory[1].content).toContain(expectedGreeting);
      expect(setSession?.payload?.caseSetup).toBe(currentSetup);
      expect(last(requestCompletionMock.mock.calls)?.[1]).toMatchObject({
        model: 'model-a',
        temperature: 0.9,
      });
    }

    requestCompletionMock.mockResolvedValueOnce({ choices: [{ message: {} }] });
    const fallback = renderRuntime(state({ session: null }));
    await act(async () => {
      await fallback.result.current.startSessionWithSetup(setup);
    });
    expect(last(actionsOf(fallback.dispatch, 'set-session'))?.payload?.diagnosis).toBe('Unknown Condition');
  });

  it('handles setup guards, aborts, failures, reset, and cancel loading', async () => {
    const noConfig = renderRuntime(state({ session: null }), 'nurse', null);
    let noConfigStarted: boolean | undefined;
    await act(async () => {
      noConfigStarted = await noConfig.result.current.startSessionWithSetup(setup);
    });
    expect(noConfigStarted).toBe(false);

    const abortError = new Error('aborted');
    abortError.name = 'AbortError';
    requestCompletionMock.mockRejectedValueOnce(abortError);
    const aborting = renderRuntime(state({ session: null }));
    let abortStarted: boolean | undefined;
    await act(async () => {
      abortStarted = await aborting.result.current.startSessionWithSetup(setup);
    });
    expect(abortStarted).toBe(false);
    expect(window.alert).not.toHaveBeenCalled();

    requestCompletionMock.mockRejectedValueOnce('network down');
    const failing = renderRuntime(state({ session: null }));
    let failedStarted: boolean | undefined;
    await act(async () => {
      failedStarted = await failing.result.current.startSessionWithSetup(setup);
    });
    expect(failedStarted).toBe(false);
    expect(window.alert).toHaveBeenCalledWith('Error starting session: network down');

    requestCompletionMock.mockRejectedValueOnce(new Error('bad setup'));
    const errorFailing = renderRuntime(state({ session: null }));
    await act(async () => {
      failedStarted = await errorFailing.result.current.startSessionWithSetup(setup);
    });
    expect(failedStarted).toBe(false);
    expect(window.alert).toHaveBeenCalledWith('Error starting session: bad setup');

    let capturedSetupSignal: AbortSignal | undefined;
    requestCompletionMock.mockImplementationOnce((_api, _request, signal) => {
      capturedSetupSignal = signal;
      return new Promise((_resolve, reject) => {
        signal.addEventListener('abort', () => {
          const error = new Error('aborted');
          error.name = 'AbortError';
          reject(error);
        });
      });
    });
    const cancellable = renderRuntime(state({ session: null }));
    const startPromise = cancellable.result.current.startSessionWithSetup(setup);
    act(() => cancellable.result.current.cancelLoading());
    await startPromise;
    expect(capturedSetupSignal?.aborted).toBe(true);
    expect(last(actionsOf(cancellable.dispatch, 'set-loading'))?.payload).toBe(false);

    let capturedStreamSignal: AbortSignal | undefined;
    streamCompletionMock.mockImplementationOnce((_api, _request, signal) => {
      capturedStreamSignal = signal;
      return (async function* neverStream() {
        if (signal.aborted) {
          yield { type: 'done' as const };
        }
        await new Promise((_resolve, reject) => {
          signal.addEventListener('abort', () => {
            const error = new Error('aborted');
            error.name = 'AbortError';
            reject(error);
          });
        });
      })();
    });
    const resetting = renderRuntime(state({ currentMessage: 'question' }));
    const sendPromise = resetting.result.current.sendMessage();
    act(() => resetting.result.current.resetSessionState());
    await sendPromise;
    expect(capturedStreamSignal?.aborted).toBe(true);
    expect(actionsOf(resetting.dispatch, 'reset-session')).toHaveLength(1);

    let capturedResetSetupSignal: AbortSignal | undefined;
    requestCompletionMock.mockImplementationOnce((_api, _request, signal) => {
      capturedResetSetupSignal = signal;
      return new Promise((_resolve, reject) => {
        signal.addEventListener('abort', () => {
          const error = new Error('aborted');
          error.name = 'AbortError';
          reject(error);
        });
      });
    });
    const resetSetup = renderRuntime(state({ session: null }));
    const resetSetupPromise = resetSetup.result.current.startSessionWithSetup(setup);
    act(() => resetSetup.result.current.resetSessionState());
    await resetSetupPromise;
    expect(capturedResetSetupSignal?.aborted).toBe(true);
  });

  it('sends diagnosis answers, handles guards, and force submits', async () => {
    const empty = renderRuntime(state({ currentMessage: '   ' }));
    await act(() => empty.result.current.sendMessage());
    expect(empty.dispatch).not.toHaveBeenCalled();

    const noSession = renderRuntime(state({ session: null, currentMessage: 'hello' }));
    await act(() => noSession.result.current.sendMessage());
    expect(noSession.dispatch).not.toHaveBeenCalled();

    const loading = renderRuntime(state({ currentMessage: 'hello', isLoading: true }));
    await act(() => loading.result.current.sendMessage());
    expect(actionsOf(loading.dispatch, 'set-current-message')).toHaveLength(0);

    const alreadyStreaming = renderRuntime(state({
      currentMessage: 'hello',
      isStreaming: true,
      streamingContent: 'Partial',
    }));
    await act(() => alreadyStreaming.result.current.sendMessage());
    expect(actionsOf(alreadyStreaming.dispatch, 'update-session')).toHaveLength(1);

    const correct = renderRuntime(state({ currentMessage: 'You have pneumonia' }));
    await act(() => correct.result.current.sendMessage());
    expect(last(actionsOf(correct.dispatch, 'set-user-final-answer'))?.payload).toBe('pneumonia');
    expect(last(actionsOf(correct.dispatch, 'set-feedback'))?.payload?.correct).toBe(true);
    act(() => vi.advanceTimersByTime(500));
    expect(last(actionsOf(correct.dispatch, 'set-show-evaluation'))?.payload).toBe(true);

    const incorrect = renderRuntime(state({ currentMessage: 'You have migraine' }));
    await act(() => incorrect.result.current.sendMessage());
    expect(last(actionsOf(incorrect.dispatch, 'set-feedback'))?.payload?.correct).toBe(false);

    const timedOut = renderRuntime(state({
      currentMessage: 'What hurts?',
      session: {
        ...session,
        turnsUsed: 0,
        caseSetup: { ...setup, timePressureEnabled: true, maxTurns: 1 },
      },
    }));
    await act(() => timedOut.result.current.sendMessage());
    expect(streamCompletionMock).not.toHaveBeenCalled();

    const force = renderRuntime(state());
    act(() => force.result.current.forceSubmit());
    expect(last(actionsOf(force.dispatch, 'set-user-final-answer'))?.payload).toBe('Time ran out - no diagnosis submitted');
    expect(last(actionsOf(force.dispatch, 'set-feedback'))?.payload?.message).toContain('Time ran out');
    act(() => vi.advanceTimersByTime(500));
    expect(last(actionsOf(force.dispatch, 'set-show-evaluation'))?.payload).toBe(true);

    const forceGuard = renderRuntime(state({ session: null }));
    act(() => forceGuard.result.current.forceSubmit());
    expect(forceGuard.dispatch).not.toHaveBeenCalled();

    const forceStreaming = renderRuntime(state({ isStreaming: true, streamingContent: 'Partial' }));
    act(() => forceStreaming.result.current.forceSubmit());
    expect(actionsOf(forceStreaming.dispatch, 'update-session')).toHaveLength(1);
  });

  it('streams patient replies, stops streaming, and reports stream failures', async () => {
    streamCompletionMock.mockImplementationOnce(() => streamEvents([
      { type: 'delta', content: 'Hello' },
      { type: 'delta', content: ' there' },
      { type: 'done' },
    ]));
    const streaming = renderRuntime(state({ currentMessage: 'How are you?' }));

    await act(() => streaming.result.current.sendMessage());

    expect(actionsOf(streaming.dispatch, 'set-streaming-content').map((action) => action.payload)).toContain('Hello there');
    const update = last(actionsOf(streaming.dispatch, 'update-session'));
    expect(last(update?.payload(session)?.conversationHistory ?? [])).toEqual({ role: 'assistant', content: 'Hello there' });
    expect(update?.payload(null)).toBeNull();
    expect(last(streamCompletionMock.mock.calls[0][1].messages)).toEqual({ role: 'user', content: 'How are you?' });

    streamCompletionMock.mockImplementationOnce(() => streamEvents([{ type: 'done' }]));
    const emptyStream = renderRuntime(state({ currentMessage: 'Anything else?' }));
    await act(() => emptyStream.result.current.sendMessage());
    expect(actionsOf(emptyStream.dispatch, 'update-session')).toHaveLength(0);

    const stoppingWithContent = renderRuntime(state({
      isStreaming: true,
      streamingContent: 'Partial reply',
    }));
    act(() => stoppingWithContent.result.current.stopStreaming());
    const stoppedUpdate = last(actionsOf(stoppingWithContent.dispatch, 'update-session'));
    expect(last(stoppedUpdate?.payload(session)?.conversationHistory ?? [])).toEqual({
      role: 'assistant',
      content: 'Partial reply',
    });
    expect(stoppedUpdate?.payload(null)).toBeNull();

    const stoppingWithoutContent = renderRuntime(state({ isStreaming: true, streamingContent: '   ' }));
    act(() => stoppingWithoutContent.result.current.stopStreaming());
    expect(actionsOf(stoppingWithoutContent.dispatch, 'update-session')).toHaveLength(0);

    const abortError = new Error('aborted');
    abortError.name = 'AbortError';
    streamCompletionMock.mockImplementationOnce(() => throwFromStream(abortError));
    const aborted = renderRuntime(state({ currentMessage: 'Abort?' }));
    await act(() => aborted.result.current.sendMessage());
    expect(window.alert).not.toHaveBeenCalledWith(expect.stringContaining('Error sending message'));

    streamCompletionMock.mockImplementationOnce(() => throwFromStream(new Error('server down')));
    const failing = renderRuntime(state({ currentMessage: 'Fail?' }));
    await act(() => failing.result.current.sendMessage());
    expect(window.alert).toHaveBeenCalledWith('Error sending message: server down');

    streamCompletionMock.mockImplementationOnce(() => throwFromStream('string failure'));
    const stringFailing = renderRuntime(state({ currentMessage: 'String fail?' }));
    await act(() => stringFailing.result.current.sendMessage());
    expect(window.alert).toHaveBeenCalledWith('Error sending message: string failure');
  });

  it('performs assessments, time-pressure exits, guards, and failure paths', async () => {
    const guard = renderRuntime(state({ performingAssessment: true }));
    await act(() => guard.result.current.performAssessment('vitals', 'Blood Pressure'));
    expect(guard.dispatch).not.toHaveBeenCalled();

    const timePressure = renderRuntime(state({
      session: {
        ...session,
        turnsUsed: 0,
        caseSetup: { ...setup, timePressureEnabled: true, maxTurns: 1 },
      },
    }));
    await act(() => timePressure.result.current.performAssessment('vitals', 'Blood Pressure'));
    expect(actionsOf(timePressure.dispatch, 'set-performing-assessment').map((action) => action.payload)).toEqual([true, false]);
    expect(streamCompletionMock).not.toHaveBeenCalled();

    streamCompletionMock.mockImplementationOnce(() => streamEvents([
      { type: 'delta', content: 'BP 120/80' },
      { type: 'done' },
    ]));
    const success = renderRuntime(state({ isStreaming: true, streamingContent: 'Partial' }));
    await act(() => success.result.current.performAssessment('vitals', 'Blood Pressure'));
    expect(actionsOf(success.dispatch, 'set-streaming-content').map((action) => action.payload)).toContain('📋 Blood Pressure: BP 120/80');
    const assessmentUpdate = last(actionsOf(success.dispatch, 'update-session'));
    expect(last(assessmentUpdate?.payload(session)?.conversationHistory ?? [])).toEqual({
      role: 'assistant',
      content: '📋 Blood Pressure: BP 120/80',
    });
    expect(assessmentUpdate?.payload(null)).toBeNull();
    expect(last(streamCompletionMock.mock.calls)?.[1].temperature).toBe(0.5);

    const abortError = new Error('aborted');
    abortError.name = 'AbortError';
    streamCompletionMock.mockImplementationOnce(() => throwFromStream(abortError));
    const aborted = renderRuntime(state());
    await act(() => aborted.result.current.performAssessment('vitals', 'Blood Pressure'));
    expect(window.alert).not.toHaveBeenCalledWith(expect.stringContaining('Error performing assessment'));

    streamCompletionMock.mockImplementationOnce(() => throwFromStream(new Error('bad assessment')));
    const failing = renderRuntime(state());
    await act(() => failing.result.current.performAssessment('vitals', 'Blood Pressure'));
    expect(window.alert).toHaveBeenCalledWith('Error performing assessment: bad assessment');

    streamCompletionMock.mockImplementationOnce(() => throwFromStream('string assessment'));
    const stringFailing = renderRuntime(state());
    await act(() => stringFailing.result.current.performAssessment('vitals', 'Blood Pressure'));
    expect(window.alert).toHaveBeenCalledWith('Error performing assessment: string assessment');
  });
});
