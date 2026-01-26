import { useState, useEffect, useRef, useCallback } from 'react';
import './App.css';
import { Profession, PatientSession, ApiConfig, Message, ProgressData, CaseSetup } from './types';
import { professionConfigs } from './config/professionConfig';
import { ProfessionSelect } from './components/ProfessionSelect';
import { SettingsModal } from './components/SettingsModal';
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
  const [appState, setAppState] = useState<AppState>('profession-select');
  const [profession, setProfession] = useState<Profession | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [apiConfig, setApiConfig] = useState<ApiConfig>({
    apiUrl: 'http://localhost:1234/v1',
    apiKey: '',
    modelName: 'qwen/qwen3-4b-2507'
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
  
  // Streaming state
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const streamAbortRef = useRef<AbortController | null>(null);
  
  // Case setup state
  const [pendingCaseSetup, setPendingCaseSetup] = useState<CaseSetup | null>(null);
  
  // Evaluation state
  const [showEvaluation, setShowEvaluation] = useState(false);
  const [userFinalAnswer, setUserFinalAnswer] = useState('');
  
  // Progress state
  const [progress, setProgress] = useState<ProgressData>({ sessions: [], lastUpdated: 0 });

  // Abort controller for canceling requests
  const abortControllerRef = useRef<AbortController | null>(null);

  const professionConfig = profession ? professionConfigs[profession] : null;

  // Load progress on mount
  useEffect(() => {
    setProgress(loadProgress());
  }, []);

  // Cleanup abort controllers on unmount
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

  // Abort current stream
  const abortStream = useCallback(() => {
    if (streamAbortRef.current) {
      streamAbortRef.current.abort();
      streamAbortRef.current = null;
    }
  }, []);

  // Stop streaming handler
  const handleStopStreaming = useCallback(() => {
    if (isStreaming && streamingContent.trim()) {
      abortStream();
      // Commit partial content to history
      setSession(prev => {
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
  }, [isStreaming, streamingContent, abortStream]);

  const handleProfessionSelect = (selectedProfession: Profession) => {
    setProfession(selectedProfession);
    setAppState('ready');
  };

  const handleChangeProfession = () => {
    abortStream();
    setSession(null);
    setFeedback(null);
    setShowAnswer(false);
    setShowToolkit(false);
    setShowCoach(false);
    setInlineCoachEnabled(false);
    setShowEvaluation(false);
    setUserFinalAnswer('');
    setPendingCaseSetup(null);
    setProfession(null);
    setIsStreaming(false);
    setStreamingContent('');
    setAppState('profession-select');
  };

  const handleShowProgress = () => {
    setAppState('progress');
  };

  const handleBackFromProgress = () => {
    if (profession) {
      if (session) {
        setAppState('session');
      } else {
        setAppState('ready');
      }
    } else {
      setAppState('profession-select');
    }
  };

  const handleCancelLoading = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setPendingCaseSetup(null);
    setAppState('ready');
  };

  const handleOpenCaseSetup = () => {
    setAppState('case-setup');
  };

  const handleCloseCaseSetup = () => {
    setAppState('ready');
  };

  const handleStartWithSetup = (setup: CaseSetup) => {
    setPendingCaseSetup(setup);
    setAppState('loading-session');
    startNewSessionWithSetup(setup);
  };

  const handleStartRandom = () => {
    if (!professionConfig || !profession) return;
    
    const prefs = getProfessionPreferences(profession);
    
    const setup: CaseSetup = {
      profession,
      category: professionConfig.categories[
        Math.floor(Math.random() * professionConfig.categories.length)
      ],
      difficulty: prefs.lastDifficulty || 'beginner',
      setting: prefs.lastSetting || professionConfig.defaultSetting,
      timePressureEnabled: prefs.lastTimePressure || false,
      maxTurns: prefs.lastMaxTurns || null,
      createdAt: Date.now()
    };
    
    setPendingCaseSetup(setup);
    setAppState('loading-session');
    startNewSessionWithSetup(setup);
  };

  const startNewSessionWithSetup = async (setup: CaseSetup) => {
    if (!professionConfig) return;
    
    abortControllerRef.current = new AbortController();
    
    setFeedback(null);
    setShowAnswer(false);
    setShowCoach(false);
    setShowEvaluation(false);
    setUserFinalAnswer('');
    setIsStreaming(false);
    setStreamingContent('');
    
    try {
      const setupPrompt = professionConfig.getSetupPrompt(
        setup.category,
        setup.difficulty,
        setup.setting
      );

      const setupResponse = await fetch(`${apiConfig.apiUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiConfig.apiKey}`
        },
        body: JSON.stringify({
          model: apiConfig.modelName,
          messages: [{ role: 'user', content: setupPrompt }],
          temperature: 0.9
        }),
        signal: abortControllerRef.current.signal
      });

      if (!setupResponse.ok) {
        throw new Error('Failed to connect to API');
      }

      const setupData = await setupResponse.json();
      const setupContent = setupData.choices[0].message.content;
      
      let diagnosis = 'Unknown Condition';
      
      const diagnosisPatterns = [
        /DIAGNOSIS:\s*(.+?)(?:\n|$)/i,
        /UNDERLYING_NEED:\s*(.+?)(?:\n|$)/i,
        /SITUATION:\s*(.+?)(?:\n|$)/i
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
        setup.setting
      );

      let initialGreeting: string;

      switch (profession) {
        case 'psychologist':
        case 'therapist':
          initialGreeting = "Hi... thanks for seeing me. I'm not really sure where to start...";
          break;
        case 'pregnancyPartner':
          initialGreeting = "*sighs* Hey...";
          break;
        case 'doula':
          initialGreeting = "I'm so glad you're here...";
          break;
        case 'couplesTherapist':
          // Parse partner names from setup content if possible
          const partnerAMatch = setupContent.match(/PARTNER_A_NAME:\s*(\w+)/i);
          const partnerBMatch = setupContent.match(/PARTNER_B_NAME:\s*(\w+)/i);
          const partnerAName = partnerAMatch ? partnerAMatch[1] : 'Partner A';
          const partnerBName = partnerBMatch ? partnerBMatch[1] : 'Partner B';
          initialGreeting = `[Partner A - ${partnerAName}]: *sits down, looking tense* Thanks for seeing us.\n\n[Partner B - ${partnerBName}]: *nods, sitting slightly apart* Yeah... we've been meaning to do this for a while.`;
          break;
        default:
          initialGreeting = "Hello, I'm not feeling well. I think I need help...";
      }

      const initialHistory: Message[] = [
        { role: 'system', content: systemPrompt },
        { role: 'assistant', content: initialGreeting }
      ];

      setSession({
        diagnosis: diagnosis,
        conversationHistory: initialHistory,
        caseSetup: setup,
        turnsUsed: 0
      });
      
      abortControllerRef.current = null;
      
      setAppState('session');
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('Request was cancelled');
        return;
      }
      
      const message = error instanceof Error ? error.message : String(error);
      alert(`Error starting session: ${message}`);
      
      abortControllerRef.current = null;
      
      setPendingCaseSetup(null);
      setAppState('ready');
    }
  };

  const handleCoachSuggestionClick = (text: string) => {
    setCurrentMessage(text);
  };

  const sendMessage = async () => {
    if (!currentMessage.trim() || !session || !professionConfig) return;
    
    // If currently streaming, stop and commit partial content first
    if (isStreaming) {
      handleStopStreaming();
      return; // Let user send on next click
    }
    
    if (isLoading) return;

    const userMessage = currentMessage.trim();
    setCurrentMessage('');

    const newTurnsUsed = (session.turnsUsed || 0) + 1;

    const updatedHistoryWithUserMessage: Message[] = [
      ...session.conversationHistory,
      { role: 'user', content: userMessage }
    ];

    setSession({
      ...session,
      conversationHistory: updatedHistoryWithUserMessage,
      turnsUsed: newTurnsUsed
    });

    const diagnosisMatch = userMessage.match(professionConfig.diagnosisPattern);

    if (diagnosisMatch) {
      const userDiagnosis = diagnosisMatch[1].trim();
      const isCorrect = userDiagnosis.toLowerCase().includes(session.diagnosis.toLowerCase()) ||
                        session.diagnosis.toLowerCase().includes(userDiagnosis.toLowerCase());
      
      setUserFinalAnswer(userDiagnosis);
      
      setFeedback({
        correct: isCorrect,
        message: isCorrect 
          ? `✅ Correct! The ${professionConfig.patientLabel.toLowerCase()}'s condition is ${session.diagnosis}.`
          : `❌ Incorrect. The ${professionConfig.patientLabel.toLowerCase()}'s condition is ${session.diagnosis}, not ${userDiagnosis}.`
      });
      
      setTimeout(() => {
        setShowEvaluation(true);
      }, 500);
      
      return;
    }

    if (session.caseSetup?.timePressureEnabled && 
        session.caseSetup.maxTurns && 
        newTurnsUsed >= session.caseSetup.maxTurns) {
      setSession(prev => prev ? { ...prev, turnsUsed: newTurnsUsed } : null);
      return;
    }

    // Start streaming response
    const controller = new AbortController();
    streamAbortRef.current = controller;
    setIsLoading(true);
    setIsStreaming(false);
    setStreamingContent('');

    try {
      const response = await fetch(`${apiConfig.apiUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiConfig.apiKey}`
        },
        body: JSON.stringify({
          model: apiConfig.modelName,
          messages: updatedHistoryWithUserMessage.map(msg => ({
            role: msg.role,
            content: msg.content
          })),
          temperature: 0.7,
          stream: true
        }),
        signal: controller.signal
      });

      if (!response.ok) {
        throw new Error('Failed to get response from API');
      }

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let fullContent = '';

      // Got first response, switch from loading to streaming
      setIsLoading(false);
      setIsStreaming(true);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('data: ')) {
            const data = trimmed.slice(6);
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
      }

      // Streaming complete - add full message to history
      if (fullContent) {
        setSession(prevSession => {
          if (!prevSession) return null;
          return {
            ...prevSession,
            conversationHistory: [
              ...prevSession.conversationHistory,
              { role: 'assistant', content: fullContent }
            ]
          };
        });
      }

    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        // Streaming was cancelled - partial content already handled by handleStopStreaming
        console.log('Streaming cancelled');
        return;
      }
      
      const message = error instanceof Error ? error.message : String(error);
      alert(`Error sending message: ${message}`);
    } finally {
      setIsStreaming(false);
      setStreamingContent('');
      setIsLoading(false);
      streamAbortRef.current = null;
    }
  };

  const handleForceSubmit = () => {
    if (!session || !professionConfig) return;
    
    // Stop any streaming
    if (isStreaming) {
      handleStopStreaming();
    }
    
    setUserFinalAnswer('Time ran out - no diagnosis submitted');
    setFeedback({
      correct: false,
      message: `⏱️ Time ran out! The ${professionConfig.patientLabel.toLowerCase()}'s condition was ${session.diagnosis}.`
    });
    
    setTimeout(() => {
      setShowEvaluation(true);
    }, 500);
  };

  const performAssessment = async (assessmentType: string, assessmentName: string) => {
    if (!session || !professionConfig || performingAssessment) return;

    // Stop any current streaming
    if (isStreaming) {
      handleStopStreaming();
    }

    setPerformingAssessment(true);

    const newTurnsUsed = (session.turnsUsed || 0) + 1;

    const assessmentAction: Message = { role: 'user', content: `[Performed ${assessmentName}]` };
    
    setSession(prevSession => {
      if (!prevSession) return null;
      return {
        ...prevSession,
        conversationHistory: [
          ...prevSession.conversationHistory,
          assessmentAction
        ],
        turnsUsed: newTurnsUsed
      };
    });

    if (session.caseSetup?.timePressureEnabled && 
        session.caseSetup.maxTurns && 
        newTurnsUsed >= session.caseSetup.maxTurns) {
      setPerformingAssessment(false);
      return;
    }

    const assessmentPrompt = professionConfig.getAssessmentPrompt(
      session.diagnosis, 
      assessmentName, 
      assessmentType
    );

    // Stream assessment response
    const controller = new AbortController();
    streamAbortRef.current = controller;
    setIsLoading(true);

    try {
      const response = await fetch(`${apiConfig.apiUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiConfig.apiKey}`
        },
        body: JSON.stringify({
          model: apiConfig.modelName,
          messages: [
            { role: 'system', content: session.conversationHistory[0].content },
            { role: 'user', content: assessmentPrompt }
          ],
          temperature: 0.5,
          stream: true
        }),
        signal: controller.signal
      });

      if (!response.ok) {
        throw new Error('Failed to get assessment results');
      }

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let fullContent = '';

      setIsLoading(false);
      setIsStreaming(true);
      setStreamingContent(`📋 ${assessmentName}: `);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('data: ')) {
            const data = trimmed.slice(6);
            if (data === '[DONE]') break;
            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                fullContent += content;
                setStreamingContent(`📋 ${assessmentName}: ${fullContent}`);
              }
            } catch {
              // Skip malformed JSON
            }
          }
        }
      }

      const assessmentMessage = `📋 ${assessmentName}: ${fullContent}`;
      
      setSession(prevSession => {
        if (!prevSession) return null;
        return {
          ...prevSession,
          conversationHistory: [
            ...prevSession.conversationHistory,
            { role: 'assistant', content: assessmentMessage }
          ]
        };
      });

    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('Assessment streaming cancelled');
        return;
      }
      const message = error instanceof Error ? error.message : String(error);
      alert(`Error performing assessment: ${message}`);
    } finally {
      setIsStreaming(false);
      setStreamingContent('');
      setIsLoading(false);
      setPerformingAssessment(false);
      streamAbortRef.current = null;
    }
  };

  const handleEndSession = () => {
    abortStream();
    setSession(null);
    setFeedback(null);
    setShowAnswer(false);
    setShowToolkit(false);
    setShowCoach(false);
    setInlineCoachEnabled(false);
    setShowEvaluation(false);
    setUserFinalAnswer('');
    setPendingCaseSetup(null);
    setIsStreaming(false);
    setStreamingContent('');
    setAppState('ready');
  };

  const handleCloseEvaluation = () => {
    setShowEvaluation(false);
  };

  const turnsExhausted = !!(
    session?.caseSetup?.timePressureEnabled && 
    session?.caseSetup?.maxTurns && 
    (session?.turnsUsed || 0) >= session.caseSetup.maxTurns &&
    !feedback
  );

  return (
    <div className="app">
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
              <button onClick={handleChangeProfession} className="btn-secondary">
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
              <button 
                onClick={handleOpenCaseSetup} 
                className="btn-secondary" 
                disabled={isLoading || isStreaming}
              >
                🔄 New {professionConfig.patientLabel}
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
                  📊 View Evaluation
                </button>
              )}
              <button onClick={() => setShowSettings(true)} className="btn-secondary">
                ⚙️ Settings
              </button>
              <button onClick={handleEndSession} className="btn-secondary">
                ✖️ End Session
              </button>
            </div>
          </div>

          {showAnswer && (
            <div className="answer-banner">
              <strong>⚠️ Answer:</strong> {session.diagnosis}
            </div>
          )}

          {/* Case Setup Info Banner */}
          {session.caseSetup && (
            <div className="case-setup-banner">
              <span className="setup-tag category">
                📋 {session.caseSetup.category.split('(')[0].trim()}
              </span>
              <span className={`setup-tag difficulty-${session.caseSetup.difficulty}`}>
                {session.caseSetup.difficulty === 'beginner' && '🟢'}
                {session.caseSetup.difficulty === 'intermediate' && '🟡'}
                {session.caseSetup.difficulty === 'advanced' && '🔴'}
                {' '}{session.caseSetup.difficulty.charAt(0).toUpperCase() + session.caseSetup.difficulty.slice(1)}
              </span>
              <span className="setup-tag setting">
                🏥 {session.caseSetup.setting.replace('_', ' ')}
              </span>
            </div>
          )}

          <div className="session-container">
            {showToolkit && (
              <div className="side-panel toolkit-panel">
                <div className="side-panel-header">
                  <h3>🩺 Assessment Tools</h3>
                  <button onClick={() => setShowToolkit(false)} className="panel-close">×</button>
                </div>
                <div className="side-panel-content">
                  <Toolkit
                    sections={professionConfig.toolkit}
                    isLoading={performingAssessment || isStreaming}
                    onAssessment={performAssessment}
                  />
                </div>
              </div>
            )}

            <ChatContainer
              session={session}
              profession={profession!}
              professionConfig={professionConfig}
              currentMessage={currentMessage}
              isLoading={isLoading}
              isStreaming={isStreaming}
              streamingContent={streamingContent}
              feedback={feedback}
              showCoach={showCoach}
              disabled={turnsExhausted}
              inlineCoachEnabled={inlineCoachEnabled}
              apiConfig={apiConfig}
              onMessageChange={setCurrentMessage}
              onSend={sendMessage}
              onNewSession={handleOpenCaseSetup}
              onToggleCoach={() => setShowCoach(!showCoach)}
              onToggleInlineCoach={() => setInlineCoachEnabled(!inlineCoachEnabled)}
              onStopStreaming={handleStopStreaming}
            />

            {/* Turn Counter for Time Pressure Mode */}
            {session.caseSetup?.timePressureEnabled && session.caseSetup.maxTurns && !feedback && (
              <div className="turn-counter-container">
                <TurnCounter
                  turnsUsed={session.turnsUsed || 0}
                  maxTurns={session.caseSetup.maxTurns}
                  onForceSubmit={handleForceSubmit}
                />
              </div>
            )}

            {showCoach && (
              <>
                <div 
                  className="resize-handle"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    const startX = e.clientX;
                    const startWidth = coachWidth;

                    const handleMouseMove = (e: MouseEvent) => {
                      const delta = startX - e.clientX;
                      const newWidth = Math.max(300, Math.min(600, startWidth + delta));
                      setCoachWidth(newWidth);
                    };

                    const handleMouseUp = () => {
                      document.removeEventListener('mousemove', handleMouseMove);
                      document.removeEventListener('mouseup', handleMouseUp);
                    };

                    document.addEventListener('mousemove', handleMouseMove);
                    document.addEventListener('mouseup', handleMouseUp);
                  }}
                />
                <div className="side-panel coach-panel" style={{ width: `${coachWidth}px` }}>
                  <Coach
                    profession={profession!}
                    conversationHistory={session.conversationHistory}
                    apiConfig={apiConfig}
                    onClose={() => setShowCoach(false)}
                    onSuggestionClick={handleCoachSuggestionClick}
                  />
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default App;