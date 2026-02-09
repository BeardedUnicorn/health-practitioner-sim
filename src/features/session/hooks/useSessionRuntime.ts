import { Dispatch, useCallback, useRef } from 'react';
import {
  ApiConfig,
  CaseSetup,
  Message,
  PatientSession,
  Profession,
  ProfessionConfig,
} from '../../../types';
import { requestCompletion, streamCompletion } from '../../../shared/llm/client';
import { SessionAction, SessionFeedback, SessionState } from '../state/session-reducer';

interface UseSessionRuntimeParams {
  apiConfig: ApiConfig;
  profession: Profession | null;
  professionConfig: ProfessionConfig | null;
  state: SessionState;
  dispatch: Dispatch<SessionAction>;
}

export function useSessionRuntime({
  apiConfig,
  profession,
  professionConfig,
  state,
  dispatch,
}: UseSessionRuntimeParams) {
  const setupAbortRef = useRef<AbortController | null>(null);
  const streamAbortRef = useRef<AbortController | null>(null);

  const abortStream = useCallback(() => {
    if (streamAbortRef.current) {
      streamAbortRef.current.abort();
      streamAbortRef.current = null;
    }
  }, []);

  const stopStreaming = useCallback(() => {
    if (state.isStreaming && state.streamingContent.trim()) {
      abortStream();
      dispatch({
        type: 'update-session',
        payload: (session) => {
          if (!session) return null;
          return {
            ...session,
            conversationHistory: [
              ...session.conversationHistory,
              { role: 'assistant', content: state.streamingContent },
            ],
          };
        },
      });
    } else {
      abortStream();
    }

    dispatch({ type: 'set-streaming', payload: false });
    dispatch({ type: 'set-streaming-content', payload: '' });
    dispatch({ type: 'set-loading', payload: false });
  }, [abortStream, dispatch, state.isStreaming, state.streamingContent]);

  const resetSessionState = useCallback(() => {
    abortStream();

    if (setupAbortRef.current) {
      setupAbortRef.current.abort();
      setupAbortRef.current = null;
    }

    dispatch({ type: 'reset-session' });
  }, [abortStream, dispatch]);

  const cancelLoading = useCallback(() => {
    if (setupAbortRef.current) {
      setupAbortRef.current.abort();
      setupAbortRef.current = null;
    }
    dispatch({ type: 'set-loading', payload: false });
  }, [dispatch]);

  const startSessionWithSetup = useCallback(
    async (setup: CaseSetup): Promise<boolean> => {
      if (!professionConfig) {
        return false;
      }

      setupAbortRef.current = new AbortController();

      dispatch({ type: 'set-feedback', payload: null });
      dispatch({ type: 'set-show-answer', payload: false });
      dispatch({ type: 'set-show-coach', payload: false });
      dispatch({ type: 'set-show-evaluation', payload: false });
      dispatch({ type: 'set-user-final-answer', payload: '' });
      dispatch({ type: 'set-streaming', payload: false });
      dispatch({ type: 'set-streaming-content', payload: '' });

      try {
        const setupPrompt = professionConfig.getSetupPrompt(
          setup.category,
          setup.difficulty,
          setup.setting,
        );

        const setupResponse = await requestCompletion(
          apiConfig,
          {
            model: apiConfig.modelName,
            messages: [{ role: 'user', content: setupPrompt }],
            temperature: 0.9,
          },
          setupAbortRef.current.signal,
        );

        const setupContent = setupResponse.choices?.[0]?.message?.content ?? '';

        let diagnosis = 'Unknown Condition';
        const diagnosisPatterns = [
          /DIAGNOSIS:\s*(.+?)(?:\n|$)/i,
          /UNDERLYING_NEED:\s*(.+?)(?:\n|$)/i,
          /SITUATION:\s*(.+?)(?:\n|$)/i,
        ];

        for (const pattern of diagnosisPatterns) {
          const match = setupContent.match(pattern);
          if (match && match[1].trim()) {
            diagnosis = match[1].trim();
            break;
          }
        }

        const systemPrompt = professionConfig.getSystemPrompt(
          setupContent,
          setup.difficulty,
          setup.setting,
        );

        let initialGreeting = "Hello, I'm not feeling well. I think I need help...";

        switch (profession) {
          case 'psychologist':
          case 'therapist':
            initialGreeting = "Hi... thanks for seeing me. I'm not really sure where to start...";
            break;
          case 'pregnancyPartner':
            initialGreeting = '*sighs* Hey...';
            break;
          case 'doula':
            initialGreeting = "I'm so glad you're here...";
            break;
          case 'couplesTherapist': {
            const partnerAMatch = setupContent.match(/PARTNER_A_NAME:\s*(\w+)/i);
            const partnerBMatch = setupContent.match(/PARTNER_B_NAME:\s*(\w+)/i);
            const partnerAName = partnerAMatch ? partnerAMatch[1] : 'Partner A';
            const partnerBName = partnerBMatch ? partnerBMatch[1] : 'Partner B';
            initialGreeting = `[Partner A - ${partnerAName}]: *sits down, looking tense* Thanks for seeing us.\n\n[Partner B - ${partnerBName}]: *nods, sitting slightly apart* Yeah... we've been meaning to do this for a while.`;
            break;
          }
          default:
            break;
        }

        const initialHistory: Message[] = [
          { role: 'system', content: systemPrompt },
          { role: 'assistant', content: initialGreeting },
        ];

        const nextSession: PatientSession = {
          diagnosis,
          conversationHistory: initialHistory,
          caseSetup: setup,
          turnsUsed: 0,
        };

        dispatch({ type: 'set-session', payload: nextSession });
        setupAbortRef.current = null;
        return true;
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          return false;
        }

        const message = error instanceof Error ? error.message : String(error);
        alert(`Error starting session: ${message}`);

        setupAbortRef.current = null;
        return false;
      }
    },
    [apiConfig, dispatch, profession, professionConfig],
  );

  const sendMessage = useCallback(async () => {
    if (!state.currentMessage.trim() || !state.session || !professionConfig) {
      return;
    }

    if (state.isStreaming) {
      stopStreaming();
      return;
    }

    if (state.isLoading) {
      return;
    }

    const userMessage = state.currentMessage.trim();
    dispatch({ type: 'set-current-message', payload: '' });

    const currentSession = state.session;
    const newTurnsUsed = (currentSession.turnsUsed || 0) + 1;
    const updatedHistoryWithUserMessage: Message[] = [
      ...currentSession.conversationHistory,
      { role: 'user', content: userMessage },
    ];

    dispatch({
      type: 'set-session',
      payload: {
        ...currentSession,
        conversationHistory: updatedHistoryWithUserMessage,
        turnsUsed: newTurnsUsed,
      },
    });

    const diagnosisMatch = userMessage.match(professionConfig.diagnosisPattern);

    if (diagnosisMatch) {
      const userDiagnosis = diagnosisMatch[1].trim();
      const isCorrect =
        userDiagnosis.toLowerCase().includes(currentSession.diagnosis.toLowerCase()) ||
        currentSession.diagnosis.toLowerCase().includes(userDiagnosis.toLowerCase());

      dispatch({ type: 'set-user-final-answer', payload: userDiagnosis });

      const feedback: SessionFeedback = {
        correct: isCorrect,
        message: isCorrect
          ? `✅ Correct! The ${professionConfig.patientLabel.toLowerCase()}'s condition is ${currentSession.diagnosis}.`
          : `❌ Incorrect. The ${professionConfig.patientLabel.toLowerCase()}'s condition is ${currentSession.diagnosis}, not ${userDiagnosis}.`,
      };

      dispatch({ type: 'set-feedback', payload: feedback });

      window.setTimeout(() => {
        dispatch({ type: 'set-show-evaluation', payload: true });
      }, 500);

      return;
    }

    if (
      currentSession.caseSetup?.timePressureEnabled &&
      currentSession.caseSetup.maxTurns &&
      newTurnsUsed >= currentSession.caseSetup.maxTurns
    ) {
      return;
    }

    const controller = new AbortController();
    streamAbortRef.current = controller;

    dispatch({ type: 'set-loading', payload: true });
    dispatch({ type: 'set-streaming', payload: false });
    dispatch({ type: 'set-streaming-content', payload: '' });

    try {
      dispatch({ type: 'set-loading', payload: false });
      dispatch({ type: 'set-streaming', payload: true });

      let fullContent = '';
      for await (const event of streamCompletion(
        apiConfig,
        {
          model: apiConfig.modelName,
          messages: updatedHistoryWithUserMessage.map((message) => ({
            role: message.role,
            content: message.content,
          })),
          temperature: 0.7,
        },
        controller.signal,
      )) {
        if (event.type === 'delta') {
          fullContent += event.content;
          dispatch({ type: 'set-streaming-content', payload: fullContent });
        }
      }

      if (fullContent) {
        dispatch({
          type: 'update-session',
          payload: (session) => {
            if (!session) return null;
            return {
              ...session,
              conversationHistory: [
                ...session.conversationHistory,
                { role: 'assistant', content: fullContent },
              ],
            };
          },
        });
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return;
      }

      const message = error instanceof Error ? error.message : String(error);
      alert(`Error sending message: ${message}`);
    } finally {
      dispatch({ type: 'set-streaming', payload: false });
      dispatch({ type: 'set-streaming-content', payload: '' });
      dispatch({ type: 'set-loading', payload: false });
      streamAbortRef.current = null;
    }
  }, [apiConfig, dispatch, professionConfig, state, stopStreaming]);

  const forceSubmit = useCallback(() => {
    if (!state.session || !professionConfig) {
      return;
    }

    if (state.isStreaming) {
      stopStreaming();
    }

    dispatch({ type: 'set-user-final-answer', payload: 'Time ran out - no diagnosis submitted' });
    dispatch({
      type: 'set-feedback',
      payload: {
        correct: false,
        message: `⏱️ Time ran out! The ${professionConfig.patientLabel.toLowerCase()}'s condition was ${state.session.diagnosis}.`,
      },
    });

    window.setTimeout(() => {
      dispatch({ type: 'set-show-evaluation', payload: true });
    }, 500);
  }, [dispatch, professionConfig, state.isStreaming, state.session, stopStreaming]);

  const performAssessment = useCallback(
    async (assessmentType: string, assessmentName: string) => {
      if (!state.session || !professionConfig || state.performingAssessment) {
        return;
      }

      if (state.isStreaming) {
        stopStreaming();
      }

      dispatch({ type: 'set-performing-assessment', payload: true });

      const currentSession = state.session;
      const newTurnsUsed = (currentSession.turnsUsed || 0) + 1;
      const assessmentAction: Message = {
        role: 'user',
        content: `[Performed ${assessmentName}]`,
      };

      dispatch({
        type: 'set-session',
        payload: {
          ...currentSession,
          conversationHistory: [...currentSession.conversationHistory, assessmentAction],
          turnsUsed: newTurnsUsed,
        },
      });

      if (
        currentSession.caseSetup?.timePressureEnabled &&
        currentSession.caseSetup.maxTurns &&
        newTurnsUsed >= currentSession.caseSetup.maxTurns
      ) {
        dispatch({ type: 'set-performing-assessment', payload: false });
        return;
      }

      const assessmentPrompt = professionConfig.getAssessmentPrompt(
        currentSession.diagnosis,
        assessmentName,
        assessmentType,
      );

      const controller = new AbortController();
      streamAbortRef.current = controller;

      dispatch({ type: 'set-loading', payload: true });

      try {
        dispatch({ type: 'set-loading', payload: false });
        dispatch({ type: 'set-streaming', payload: true });
        dispatch({ type: 'set-streaming-content', payload: `📋 ${assessmentName}: ` });

        let fullContent = '';
        for await (const event of streamCompletion(
          apiConfig,
          {
            model: apiConfig.modelName,
            messages: [
              { role: 'system', content: currentSession.conversationHistory[0].content },
              { role: 'user', content: assessmentPrompt },
            ],
            temperature: 0.5,
          },
          controller.signal,
        )) {
          if (event.type === 'delta') {
            fullContent += event.content;
            dispatch({
              type: 'set-streaming-content',
              payload: `📋 ${assessmentName}: ${fullContent}`,
            });
          }
        }

        const assessmentMessage = `📋 ${assessmentName}: ${fullContent}`;
        dispatch({
          type: 'update-session',
          payload: (session) => {
            if (!session) return null;
            return {
              ...session,
              conversationHistory: [
                ...session.conversationHistory,
                { role: 'assistant', content: assessmentMessage },
              ],
            };
          },
        });
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          return;
        }

        const message = error instanceof Error ? error.message : String(error);
        alert(`Error performing assessment: ${message}`);
      } finally {
        dispatch({ type: 'set-streaming', payload: false });
        dispatch({ type: 'set-streaming-content', payload: '' });
        dispatch({ type: 'set-loading', payload: false });
        dispatch({ type: 'set-performing-assessment', payload: false });
        streamAbortRef.current = null;
      }
    },
    [apiConfig, dispatch, professionConfig, state, stopStreaming],
  );

  return {
    abortStream,
    stopStreaming,
    resetSessionState,
    cancelLoading,
    startSessionWithSetup,
    sendMessage,
    forceSubmit,
    performAssessment,
  };
}
