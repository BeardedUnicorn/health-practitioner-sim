import { useState, useEffect, useRef, useCallback } from 'react';
import './App.css';
import { Profession, PatientSession, ApiConfig, Message, ProgressData, CaseSetup } from './types';
import { professionConfigs } from './config/professionConfig';
import { ProfessionSelect } from './components/ProfessionSelect';
import { SettingsModal } from './components/SettingsModal';
import { ErrorBanner, AppError } from './components/ErrorBanner';
import { SessionStart } from './components/SessionStart';
import { ChatContainer } from './components/ChatContainer';
import { Toolkit } from './components/Toolkit';
import { Coach } from './components/Coach';
import { LoadingSession } from './components/LoadingSession';
import { SessionEvaluation } from './components/SessionEvaluation';
import { ProgressScreen } from './components/ProgressScreen';
import { CaseSetupModal } from './components/CaseSetupModal';
import { TurnCounter } from './components/TurnCounter';
import { loadProgress, getProfessionPreferences } from './utils/progressStorage';

type AppState = 'profession-select' | 'ready' | 'case-setup' | 'loading-session' | 'session' | 'progress';

function App() {
  // App state
  const [appState, setAppState] = useState<AppState>('profession-select');
  const [profession, setProfession] = useState<Profession | null>(null);
  const [professionConfig, setProfessionConfig] = useState(profession ? professionConfigs[profession] : null);
  const [showSettings, setShowSettings] = useState(false);
  const [showEvaluation, setShowEvaluation] = useState(false);
  const [progress, setProgress] = useState<ProgressData>(loadProgress());

  // API config
  const [apiConfig, setApiConfig] = useState<ApiConfig>(() => {
    const saved = localStorage.getItem('apiConfig');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // Ignore parse errors and fall back to defaults
      }
    }
    return {
      apiUrl: 'http://localhost:1234/v1',
      apiKey: '',
      modelName: 'qwen/qwen3-4b-2507'
    };
  });

  const [session, setSession] = useState<PatientSession | null>(null);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ correct: boolean; message: string } | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [showToolkit, setShowToolkit] = useState(false);
  const [showCoach, setShowCoach] = useState(false);
  const [inlineCoachEnabled, setInlineCoachEnabled] = useState(false);
  const [performingAssessment, setPerformingAssessment] = useState(false);
  const [coachWidth, setCoachWidth] = useState(350);
  const [appError, setAppError] = useState<AppError | null>(null);

  // Streaming state
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');

  // Refs for AbortControllers
  const abortControllerRef = useRef<AbortController | null>(null);
  const streamAbortRef = useRef<AbortController | null>(null);

  // Save API config to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('apiConfig', JSON.stringify(apiConfig));
  }, [apiConfig]);

  // Update profession config when profession changes
  useEffect(() => {
    if (profession) {
      setProfessionConfig(professionConfigs[profession]);
    } else {
      setProfessionConfig(null);
    }
  }, [profession]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (streamAbortRef.current) {
        streamAbortRef.current.abort();
      }
    };
  }, []);

  const refreshProgress = () => {
    setProgress(loadProgress());
  };

  const showError = useCallback((title: string, message: string, details?: string) => {
    console.error(`[${title}] ${message}`, details);
    setAppError({ title, message, details });
  }, []);

  const dismissError = useCallback(() => setAppError(null), []);

  // Abort current stream
  const abortStream = useCallback(() => {
    if (streamAbortRef.current) {
      streamAbortRef.current.abort();
      streamAbortRef.current = null;
    }
  }, []);

  // Handle stop streaming and commit partial content
  const handleStopStreaming = useCallback(() => {
    // If we were streaming and have content, add it as the assistant message
    if (isStreaming && streamingContent && session) {
      setSession((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          conversationHistory: [
            ...prev.conversationHistory,
            { role: 'assistant', content: streamingContent }
          ]
        };
      });
    } else {
      abortStream();
    }
    setIsStreaming(false);
    setStreamingContent('');
    setIsLoading(false);
  }, [isStreaming, streamingContent, session, abortStream]);

  const handleProfessionSelect = (selectedProfession: Profession) => {
    setProfession(selectedProfession);
    setAppState('ready');
    setSession(null);
    setFeedback(null);
    setShowAnswer(false);
    setShowToolkit(false);
    setShowCoach(false);
    setInlineCoachEnabled(false);
    setShowEvaluation(false);
    setCurrentMessage('');
  };

  const handleBackToProfessionSelect = () => {
    setProfession(null);
    setAppState('profession-select');
    setSession(null);
    setFeedback(null);
    setShowAnswer(false);
    setShowToolkit(false);
    setShowCoach(false);
    setInlineCoachEnabled(false);
    setShowEvaluation(false);
    setCurrentMessage('');
  };

  const handleOpenCaseSetup = () => {
    // Reset any prior session state before starting
    setSession(null);
    setFeedback(null);
    setShowAnswer(false);
    setShowToolkit(false);
    setShowCoach(false);
    setInlineCoachEnabled(false);
    setShowEvaluation(false);
    setCurrentMessage('');

    setAppState('case-setup');
  };

  const handleCloseCaseSetup = () => {
    setAppState('ready');
  };

  // Start session with chosen setup (from modal)
  const handleStartWithSetup = (setup: CaseSetup) => {
    dismissError();
    setAppState('loading-session');
    startNewSessionWithSetup(setup);
  };

  // Start a random session (from modal)
  const handleStartRandom = () => {
    if (!professionConfig) return;

    // Generate random setup using preferences if available
    const prefs = profession ? getProfessionPreferences(profession) : null;
    const difficulty = prefs?.preferredDifficulty ?? professionConfig.defaultDifficulty;
    const setting = prefs?.preferredSetting ?? professionConfig.defaultSetting;

    const setup: CaseSetup = {
      difficulty,
      setting
    };

    handleStartWithSetup(setup);
  };

  const startNewSessionWithSetup = async (setup: CaseSetup) => {
    if (!profession || !professionConfig) return;

    setIsLoading(true);
    setFeedback(null);
    setShowAnswer(false);
    setShowToolkit(false);
    setShowCoach(false);
    setInlineCoachEnabled(false);
    setShowEvaluation(false);
    setCurrentMessage('');

    // Abort any existing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      // Prepare initial system prompt with setup context
      const systemPrompt = professionConfig.systemPrompt(setup);

      // Call the model to generate a new case (answer + initial patient message)
      const response = await fetch(`${apiConfig.apiUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(apiConfig.apiKey ? { Authorization: `Bearer ${apiConfig.apiKey}` } : {})
        },
        body: JSON.stringify({
          model: apiConfig.modelName,
          messages: [
            { role: 'system', content: systemPrompt }
          ],
          temperature: 0.8
        }),
        signal: abortController.signal
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`API request failed (${response.status}): ${text}`);
      }

      const data = await response.json();
      const content = data?.choices?.[0]?.message?.content ?? '';

      // Expect format:
      // ANSWER: ...
      // PATIENT: ...
      const answerMatch = content.match(/ANSWER:\s*([\s\S]*?)\nPATIENT:/i);
      const patientMatch = content.match(/PATIENT:\s*([\s\S]*)/i);

      const diagnosis = answerMatch ? answerMatch[1].trim() : '';
      const initialPatientMessage = patientMatch ? patientMatch[1].trim() : content.trim();

      const initialConversation: Message[] = [
        { role: 'system', content: systemPrompt },
        { role: 'assistant', content: initialPatientMessage }
      ];

      const newSession: PatientSession = {
        profession,
        caseSetup: setup,
        diagnosis,
        conversationHistory: initialConversation,
        turnsUsed: 0
      };

      setSession(newSession);
      setAppState('session');
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('Request was cancelled');
        return;
      }

      const message = error instanceof Error ? error.message : String(error);
      showError('Error starting session', message);

      abortControllerRef.current = null;

      setAppState('ready');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCoachSuggestionClick = async (suggestion: string) => {
    if (!session || !professionConfig) return;

    // Add suggestion as user message and stream response
    setCurrentMessage(suggestion);
    await sendMessageWithText(suggestion);
  };

  const sendMessage = async () => {
    dismissError();
    if (!currentMessage.trim() || !session || !professionConfig) return;
    const messageText = currentMessage.trim();
    setCurrentMessage('');
    await sendMessageWithText(messageText);
  };

  const sendMessageWithText = async (messageText: string) => {
    if (!session || !professionConfig) return;

    // Stop streaming if currently streaming, and commit partial content first
    if (isStreaming) {
      handleStopStreaming();
    }

    setIsLoading(true);
    setIsStreaming(true);
    setStreamingContent('');

    // Abort any existing stream
    abortStream();

    const abortController = new AbortController();
    streamAbortRef.current = abortController;

    try {
      // Add user message to conversation
      const updatedHistory: Message[] = [
        ...session.conversationHistory,
        { role: 'user', content: messageText }
      ];

      setSession((prev) => prev ? { ...prev, conversationHistory: updatedHistory } : prev);

      // Stream assistant response
      const response = await fetch(`${apiConfig.apiUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(apiConfig.apiKey ? { Authorization: `Bearer ${apiConfig.apiKey}` } : {})
        },
        body: JSON.stringify({
          model: apiConfig.modelName,
          messages: updatedHistory,
          temperature: 0.7,
          stream: true
        }),
        signal: abortController.signal
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`API request failed (${response.status}): ${text}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body reader available');
      }

      const decoder = new TextDecoder('utf-8');
      let fullContent = '';

      let done = false;
      while (!done) {
        const result = await reader.read();
        done = result.done;
        if (done) break;

        const chunk = decoder.decode(result.value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data:')) continue;

          const data = trimmed.slice(5).trim();
          if (data === '[DONE]') {
            break;
          }
          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              fullContent += content;
              setStreamingContent(fullContent);
            }
          } catch {
            // Skip malformed JSON chunks
          }
        }
      }

      // Streaming complete - add full message to conversation
      setSession((prev) => {
        if (!prev) return null;

        const nextTurns = prev.turnsUsed + 1;

        return {
          ...prev,
          conversationHistory: [
            ...prev.conversationHistory,
            { role: 'assistant', content: fullContent }
          ],
          turnsUsed: nextTurns
        };
      });

    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'AbortError') {
        // Streaming cancelled, already handled by handleStopStreaming
        console.log('Streaming cancelled');
        return;
      }

      const message = error instanceof Error ? error.message : String(error);
      showError('Error sending message', message);
    } finally {
      setIsStreaming(false);
      setStreamingContent('');
      setIsLoading(false);
      streamAbortRef.current = null;
    }
  };

  const handlePerformAssessment = async (assessmentType: string, assessmentName: string) => {
    dismissError();
    if (!session || !professionConfig) return;

    setPerformingAssessment(true);
    setIsLoading(true);

    // Stop any current streaming
    if (isStreaming) {
      handleStopStreaming();
    }

    try {
      await performAssessment(assessmentType, assessmentName);
    } finally {
      setIsLoading(false);
      setPerformingAssessment(false);
    }
  };

  const performAssessment = async (assessmentType: string, assessmentName: string) => {
    dismissError();
    if (!session || !professionConfig) return;

    setIsStreaming(true);
    setStreamingContent('');

    // Abort any existing stream
    abortStream();

    const abortController = new AbortController();
    streamAbortRef.current = abortController;

    try {
      // Build assessment prompt
      const prompt = professionConfig.assessmentPrompt(assessmentType, assessmentName, session.conversationHistory);

      const messages: Message[] = [
        { role: 'system', content: prompt }
      ];

      // Stream assistant response
      const response = await fetch(`${apiConfig.apiUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(apiConfig.apiKey ? { Authorization: `Bearer ${apiConfig.apiKey}` } : {})
        },
        body: JSON.stringify({
          model: apiConfig.modelName,
          messages,
          temperature: 0.5,
          stream: true
        }),
        signal: abortController.signal
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`API request failed (${response.status}): ${text}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body reader available');
      }

      const decoder = new TextDecoder('utf-8');
      let fullContent = '';

      let done = false;
      while (!done) {
        const result = await reader.read();
        done = result.done;
        if (done) break;

        const chunk = decoder.decode(result.value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data:')) continue;

          const data = trimmed.slice(5).trim();
          if (data === '[DONE]') {
            break;
          }
          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              fullContent += content;
              setStreamingContent(fullContent);
            }
          } catch {
            // Skip malformed JSON chunks
          }
        }
      }

      // Add assessment result as assistant message
      setSession((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          conversationHistory: [
            ...prev.conversationHistory,
            { role: 'assistant', content: `🩺 ${assessmentName}\n\n${fullContent}` }
          ]
        };
      });

    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('Assessment streaming cancelled');
        return;
      }
      const message = error instanceof Error ? error.message : String(error);
      showError('Error performing assessment', message);
    } finally {
      setIsStreaming(false);
      setStreamingContent('');
      setIsLoading(false);
      setPerformingAssessment(false);
      streamAbortRef.current = null;
    }
  };

  const handleSubmitDiagnosis = async (answer: string) => {
    if (!session || !professionConfig) return;

    // Stop any streaming
    if (isStreaming) {
      handleStopStreaming();
    }

    setIsLoading(true);

    try {
      const evaluationPrompt = professionConfig.evaluationPrompt(session.diagnosis, answer, session.conversationHistory);

      const response = await fetch(`${apiConfig.apiUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(apiConfig.apiKey ? { Authorization: `Bearer ${apiConfig.apiKey}` } : {})
        },
        body: JSON.stringify({
          model: apiConfig.modelName,
          messages: [
            { role: 'system', content: evaluationPrompt }
          ],
          temperature: 0.2
        })
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`API request failed (${response.status}): ${text}`);
      }

      const data = await response.json();
      const content = data?.choices?.[0]?.message?.content ?? '';

      // Parse evaluation response. Expected format:
      // RESULT: CORRECT/INCORRECT
      // FEEDBACK: ...
      const resultMatch = content.match(/RESULT:\s*(CORRECT|INCORRECT)/i);
      const feedbackMatch = content.match(/FEEDBACK:\s*([\s\S]*)/i);

      const correct = resultMatch ? resultMatch[1].toUpperCase() === 'CORRECT' : false;
      const message = feedbackMatch ? feedbackMatch[1].trim() : content.trim();

      setFeedback({ correct, message });
      setShowEvaluation(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseEvaluation = () => {
    setShowEvaluation(false);
  };

  const handleCancelLoading = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setAppState('ready');
    setIsLoading(false);
  };

  const handleShowProgress = () => {
    setAppState('progress');
  };

  const handleBackFromProgress = () => {
    if (profession) {
      setAppState('ready');
    } else {
      setAppState('profession-select');
    }
  };

  const handleChangeProfession = () => {
    // Stop streaming before leaving session
    if (isStreaming) {
      handleStopStreaming();
    }

    // Reset session state
    setSession(null);
    setFeedback(null);
    setShowAnswer(false);
    setShowToolkit(false);
    setShowCoach(false);
    setInlineCoachEnabled(false);
    setShowEvaluation(false);
    setCurrentMessage('');

    setProfession(null);
    setAppState('profession-select');
  };

  const userFinalAnswer = session?.diagnosis || '';

  const canSubmitDiagnosis = Boolean(
    session &&
    professionConfig &&
    session.turnsUsed >= (professionConfig?.minTurnsBeforeDiagnosis ?? 0) &&
    session.caseSetup?.maxTurns &&
    (session?.turnsUsed || 0) >= session.caseSetup.maxTurns &&
    !feedback
  );

  return (
    <div className="app">
      {appError && (
        <ErrorBanner error={appError} onDismiss={dismissError} />
      )}
      {/* Settings Modal */}
      {showSettings && (
        <SettingsModal
          config={apiConfig}
          onChange={setApiConfig}
          onClose={() => setShowSettings(false)}
        />
      )}

      {/* Case Setup Modal */}
      {appState === 'case-setup' && professionConfig && profession && (
        <CaseSetupModal
          profession={profession}
          professionConfig={professionConfig}
          onStart={handleStartWithSetup}
          onStartRandom={handleStartRandom}
          onClose={handleCloseCaseSetup}
        />
      )}

      {/* Evaluation Modal */}
      {showEvaluation && professionConfig && session && (
        <SessionEvaluation
          professionConfig={professionConfig}
          apiConfig={apiConfig}
          conversationHistory={session.conversationHistory}
          diagnosis={session.diagnosis}
          userAnswer={userFinalAnswer}
          wasCorrect={feedback?.correct ?? false}
          caseSetup={session.caseSetup}
          turnsUsed={session.turnsUsed}
          onNewSession={() => {
            setShowEvaluation(false);
            handleOpenCaseSetup();
          }}
          onClose={handleCloseEvaluation}
          onProgressSaved={refreshProgress}
        />
      )}

      {/* Progress Screen */}
      {appState === 'progress' && (
        <ProgressScreen
          progress={progress}
          onBack={handleBackFromProgress}
          onRefresh={refreshProgress}
        />
      )}

      {/* Profession Selection Screen */}
      {appState === 'profession-select' && (
        <ProfessionSelect
          onSelect={handleProfessionSelect}
          onOpenSettings={() => setShowSettings(true)}
          onOpenProgress={handleShowProgress}
          sessionCount={progress.sessions.length}
        />
      )}

      {/* Ready to Start Screen */}
      {appState === 'ready' && professionConfig && (
        <>
          <div className="header">
            <h1>{professionConfig.emoji} {professionConfig.title}</h1>
            <div className="header-buttons">
              <button onClick={handleShowProgress} className="btn-secondary">
                📊 Progress
              </button>
              <button onClick={() => setShowSettings(true)} className="btn-secondary">
                ⚙️ Settings
              </button>
              <button onClick={handleBackToProfessionSelect} className="btn-secondary">
                🔄 Change Profession
              </button>
            </div>
          </div>
          <SessionStart
            professionConfig={professionConfig}
            isLoading={false}
            onStart={handleOpenCaseSetup}
          />
        </>
      )}

      {/* Loading Session Screen */}
      {appState === 'loading-session' && professionConfig && (
        <>
          <div className="header">
            <h1>{professionConfig.emoji} {professionConfig.title}</h1>
            <div className="header-buttons">
              <button onClick={() => setShowSettings(true)} className="btn-secondary">
                ⚙️ Settings
              </button>
            </div>
          </div>
          <LoadingSession
            professionConfig={professionConfig}
            onCancel={handleCancelLoading}
          />
        </>
      )}

      {/* Active Session Screen */}
      {appState === 'session' && professionConfig && session && (
        <>
          <div className="header">
            <h1>{professionConfig.emoji} {professionConfig.title}</h1>
            <div className="header-buttons">
              <button onClick={handleChangeProfession} className="btn-secondary">
                🔄 Change
              </button>
              <button
                onClick={() => setShowCoach(!showCoach)}
                className={showCoach ? "btn-secondary active" : "btn-secondary"}
              >
                🧠 Coach
              </button>
              <button
                onClick={() => setInlineCoachEnabled(!inlineCoachEnabled)}
                className={inlineCoachEnabled ? "btn-secondary active" : "btn-secondary"}
              >
                💡 Inline Coach
              </button>
              <button
                onClick={() => setShowToolkit(!showToolkit)}
                className={showToolkit ? "btn-secondary active" : "btn-secondary"}
              >
                🩺 Assessment Toolkit
              </button>
              <button
                onClick={() => setShowAnswer(!showAnswer)}
                className={showAnswer ? "btn-secondary active" : "btn-secondary"}
              >
                {showAnswer ? '🙈 Hide Answer' : '👁️ Reveal Answer'}
              </button>
              {feedback && (
                <button
                  onClick={() => setShowEvaluation(true)}
                  className="btn-secondary"
                >
                  📋 Evaluation
                </button>
              )}
            </div>
          </div>

          <div className="session-layout">
            <div className="session-main">
              <ChatContainer
                conversationHistory={session.conversationHistory}
                currentMessage={currentMessage}
                setCurrentMessage={setCurrentMessage}
                onSend={sendMessage}
                onStopStreaming={handleStopStreaming}
                isLoading={isLoading}
                isStreaming={isStreaming}
                streamingContent={streamingContent}
                showAnswer={showAnswer}
                diagnosis={session.diagnosis}
                feedback={feedback}
                onSubmitDiagnosis={handleSubmitDiagnosis}
                canSubmitDiagnosis={canSubmitDiagnosis}
              />
              <div className="session-footer">
                <TurnCounter
                  turnsUsed={session.turnsUsed}
                  maxTurns={session.caseSetup?.maxTurns ?? 0}
                  minTurnsBeforeDiagnosis={professionConfig.minTurnsBeforeDiagnosis ?? 0}
                />
              </div>
            </div>

            {showToolkit && (
              <Toolkit
                professionConfig={professionConfig}
                onPerformAssessment={handlePerformAssessment}
                disabled={performingAssessment || isLoading}
              />
            )}

            {showCoach && (
              <Coach
                professionConfig={professionConfig}
                session={session}
                apiConfig={apiConfig}
                onSuggestionClick={handleCoachSuggestionClick}
                inlineCoachEnabled={inlineCoachEnabled}
                width={coachWidth}
                onResize={setCoachWidth}
              />
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default App;
