import { useCallback, useEffect, useRef } from 'react';
import { ApiConfig, Profession, ProfessionConfig } from '../../../types';
import { Toolkit } from '../../../components/Toolkit';
import { TurnCounter } from '../../../components/TurnCounter';
import { CoachPanel } from '../../coach/components/CoachPanel';
import { InlineCoach } from '../../coach/components/InlineCoach';
import { useSessionContext } from '../state/session-context';
import { CouplesConversation } from './conversation/CouplesConversation';
import { SinglePatientConversation } from './conversation/SinglePatientConversation';
import { InteractiveComposer, SummaryRequiredComposer } from './Composer';
import '../../../components/ChatContainer.css';

interface SessionWorkspaceProps {
  profession: Profession;
  professionConfig: ProfessionConfig;
  apiConfig: ApiConfig;
  coachWidth: number;
  onCoachWidthChange: (width: number) => void;
  onNewSession: () => void;
}

export function SessionWorkspace({
  profession,
  professionConfig,
  apiConfig,
  coachWidth,
  onCoachWidthChange,
  onNewSession,
}: SessionWorkspaceProps) {
  const { state, actions, meta } = useSessionContext();
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const shouldAutoScrollRef = useRef(true);
  const lastScrollTopRef = useRef(0);

  const session = state.session;

  const isCouplesTherapy = !!professionConfig.isCouplesTherapy;

  const isNearBottom = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return true;
    const threshold = 150;
    return container.scrollHeight - container.scrollTop - container.clientHeight < threshold;
  }, []);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    if (shouldAutoScrollRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior });
    }
  }, []);

  const handleScroll = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const currentScrollTop = container.scrollTop;
    const isScrollingUp = currentScrollTop < lastScrollTopRef.current;
    lastScrollTopRef.current = currentScrollTop;

    if (isScrollingUp && state.isStreaming) {
      shouldAutoScrollRef.current = false;
    }

    if (isNearBottom()) {
      shouldAutoScrollRef.current = true;
    }
  }, [isNearBottom, state.isStreaming]);

  useEffect(() => {
    if (state.isStreaming) {
      shouldAutoScrollRef.current = isNearBottom();
    }
  }, [isNearBottom, state.isStreaming]);

  useEffect(() => {
    if (state.isStreaming && state.streamingContent) {
      scrollToBottom();
    }
  }, [scrollToBottom, state.isStreaming, state.streamingContent]);

  useEffect(() => {
    if (!state.isStreaming && !state.isLoading) {
      requestAnimationFrame(() => {
        if (isNearBottom()) {
          scrollToBottom();
        }
      });
    }
  }, [isNearBottom, scrollToBottom, session?.conversationHistory.length, state.isLoading, state.isStreaming]);

  useEffect(() => {
    if (state.isLoading && !state.isStreaming) {
      shouldAutoScrollRef.current = true;
      scrollToBottom();
    }
  }, [scrollToBottom, state.isLoading, state.isStreaming]);

  const interactivePlaceholder = isCouplesTherapy
    ? 'Speak to the couple...'
    : `Ask the ${professionConfig.patientLabel.toLowerCase()} a question...`;

  if (!session) {
    return null;
  }

  return (
    <>
      {state.showAnswer && (
        <div className="answer-banner">
          <strong>⚠️ Answer:</strong> {session.diagnosis}
        </div>
      )}

      {session.caseSetup && (
        <div className="case-setup-banner">
          <span className="setup-tag category">📋 {session.caseSetup.category.split('(')[0].trim()}</span>
          <span className={`setup-tag difficulty-${session.caseSetup.difficulty}`}>
            {session.caseSetup.difficulty === 'beginner' && '🟢'}
            {session.caseSetup.difficulty === 'intermediate' && '🟡'}
            {session.caseSetup.difficulty === 'advanced' && '🔴'}
            {' '}
            {session.caseSetup.difficulty.charAt(0).toUpperCase() + session.caseSetup.difficulty.slice(1)}
          </span>
          <span className="setup-tag setting">🏥 {session.caseSetup.setting.replace('_', ' ')}</span>
        </div>
      )}

      <div className="session-container">
        {state.showToolkit && (
          <div className="side-panel toolkit-panel">
            <div className="side-panel-header">
              <h3>🩺 Assessment Tools</h3>
              <button onClick={() => actions.setShowToolkit(false)} className="panel-close">×</button>
            </div>
            <div className="side-panel-content">
              <Toolkit
                sections={professionConfig.toolkit}
                isLoading={state.performingAssessment || state.isStreaming}
                onAssessment={actions.performAssessment}
              />
            </div>
          </div>
        )}

        <div className="chat-container">
          <div className="messages" ref={messagesContainerRef} onScroll={handleScroll}>
            {isCouplesTherapy ? (
              <CouplesConversation
                messages={session.conversationHistory}
                isLoading={state.isLoading}
                isStreaming={state.isStreaming}
                streamingContent={state.streamingContent}
                userLabel={professionConfig.userLabel}
                userEmoji={professionConfig.userEmoji}
                partnerAEmoji={professionConfig.partnerAEmoji}
                partnerBEmoji={professionConfig.partnerBEmoji}
              />
            ) : (
              <SinglePatientConversation
                messages={session.conversationHistory}
                isLoading={state.isLoading}
                isStreaming={state.isStreaming}
                streamingContent={state.streamingContent}
                userLabel={professionConfig.userLabel}
                userEmoji={professionConfig.userEmoji}
                patientLabel={professionConfig.patientLabel}
                patientEmoji={professionConfig.patientEmoji}
              />
            )}
            <div ref={messagesEndRef} />
          </div>

          {state.feedback && (
            <div className={`feedback ${state.feedback.correct ? 'correct' : 'incorrect'}`}>
              {state.feedback.message}
              <button onClick={onNewSession} className="btn-primary" style={{ marginLeft: '1rem' }}>
                New {isCouplesTherapy ? 'Couple' : professionConfig.patientLabel}
              </button>
            </div>
          )}

          {meta.turnsExhausted && !state.feedback && (
            <div className="feedback warning">⏱️ Time&apos;s up! Submit your session summary now.</div>
          )}

          {!state.feedback && !meta.turnsExhausted && (
            <InlineCoach
              profession={profession}
              conversationHistory={session.conversationHistory}
              apiConfig={apiConfig}
              enabled={state.inlineCoachEnabled && state.session?.mode !== 'exam'}
              trainingMode={session.mode || 'guided'}
            />
          )}

          {!state.feedback && !meta.turnsExhausted && state.session?.mode === 'exam' && !state.showCoach && (
            <div className="reveal-hint-container">
              <button onClick={actions.revealHint} className="btn-secondary">
                Reveal Hint ({state.session.hintsUsed} used)
              </button>
            </div>
          )}

          {meta.turnsExhausted ? (
            <SummaryRequiredComposer
              currentMessage={state.currentMessage}
              onMessageChange={actions.setCurrentMessage}
              onSend={actions.sendMessage}
              onToggleCoach={() => actions.setShowCoach(!state.showCoach)}
              onToggleInlineCoach={() => actions.setInlineCoachEnabled(!state.inlineCoachEnabled)}
              showCoach={state.showCoach}
              inlineCoachEnabled={state.inlineCoachEnabled}
              isLoading={state.isLoading}
              isStreaming={state.isStreaming}
              hasFeedback={!!state.feedback}
              onStopStreaming={actions.stopStreaming}
              placeholder="Submit your session summary..."
            />
          ) : (
            <InteractiveComposer
              currentMessage={state.currentMessage}
              onMessageChange={actions.setCurrentMessage}
              onSend={actions.sendMessage}
              onToggleCoach={() => actions.setShowCoach(!state.showCoach)}
              onToggleInlineCoach={() => actions.setInlineCoachEnabled(!state.inlineCoachEnabled)}
              showCoach={state.showCoach}
              inlineCoachEnabled={state.inlineCoachEnabled}
              isLoading={state.isLoading}
              isStreaming={state.isStreaming}
              hasFeedback={!!state.feedback}
              onStopStreaming={actions.stopStreaming}
              placeholder={interactivePlaceholder}
            />
          )}

          <div className="hint">{professionConfig.diagnosisHint}</div>
        </div>

        {session.caseSetup?.timePressureEnabled && session.caseSetup.maxTurns && !state.feedback && (
          <div className="turn-counter-container">
            <TurnCounter
              turnsUsed={session.turnsUsed || 0}
              maxTurns={session.caseSetup.maxTurns}
              onForceSubmit={actions.forceSubmit}
            />
          </div>
        )}

        {state.showCoach && (
          <>
            <div
              className="resize-handle"
              onMouseDown={(event) => {
                event.preventDefault();
                const startX = event.clientX;
                const startWidth = coachWidth;

                const handleMouseMove = (moveEvent: MouseEvent) => {
                  const delta = startX - moveEvent.clientX;
                  const newWidth = Math.max(300, Math.min(600, startWidth + delta));
                  onCoachWidthChange(newWidth);
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
              <CoachPanel
                profession={profession}
                conversationHistory={session.conversationHistory}
                apiConfig={apiConfig}
                onClose={() => actions.setShowCoach(false)}
                trainingMode={session.mode || 'guided'}
                hintsUsed={session.hintsUsed || 0}
                onRevealHint={actions.revealHint}
              />
            </div>
          </>
        )}
      </div>
    </>
  );
}
