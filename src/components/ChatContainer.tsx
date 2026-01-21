import { useRef, useEffect, useCallback } from 'react';
import { PatientSession, ProfessionConfig, Profession, ApiConfig } from '../types';
import { Message, StreamingMessage, TypingIndicator } from './Message';
import { InlineCoach } from './Coach';
import './ChatContainer.css';

interface ChatContainerProps {
  session: PatientSession;
  profession: Profession;
  professionConfig: ProfessionConfig;
  currentMessage: string;
  isLoading: boolean;
  isStreaming: boolean;
  streamingContent: string;
  feedback: { correct: boolean; message: string } | null;
  showCoach: boolean;
  disabled?: boolean;
  inlineCoachEnabled: boolean;
  apiConfig: ApiConfig;
  onMessageChange: (message: string) => void;
  onSend: () => void;
  onNewSession: () => void;
  onToggleCoach: () => void;
  onToggleInlineCoach: () => void;
  onStopStreaming?: () => void;
}

export function ChatContainer({
  session,
  profession,
  professionConfig,
  currentMessage,
  isLoading,
  isStreaming,
  streamingContent,
  feedback,
  showCoach,
  disabled = false,
  inlineCoachEnabled,
  apiConfig,
  onMessageChange,
  onSend,
  onNewSession,
  onToggleCoach,
  onToggleInlineCoach,
  onStopStreaming
}: ChatContainerProps) {
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const shouldAutoScrollRef = useRef(true);
  const lastScrollTopRef = useRef(0);

  // Check if scrolled to bottom (within threshold)
  const isNearBottom = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return true;
    const threshold = 150;
    return container.scrollHeight - container.scrollTop - container.clientHeight < threshold;
  }, []);

  // Scroll to bottom smoothly
  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    if (shouldAutoScrollRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior });
    }
  }, []);

  // Handle user scroll
  const handleScroll = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const currentScrollTop = container.scrollTop;
    const isScrollingUp = currentScrollTop < lastScrollTopRef.current;
    lastScrollTopRef.current = currentScrollTop;

    // If user scrolls up during streaming, disable auto-scroll
    if (isScrollingUp && isStreaming) {
      shouldAutoScrollRef.current = false;
    }

    // If user scrolls to bottom, re-enable auto-scroll
    if (isNearBottom()) {
      shouldAutoScrollRef.current = true;
    }
  }, [isStreaming, isNearBottom]);

  // When streaming starts, check if we should auto-scroll
  useEffect(() => {
    if (isStreaming) {
      shouldAutoScrollRef.current = isNearBottom();
    }
  }, [isStreaming, isNearBottom]);

  // Auto-scroll during streaming
  useEffect(() => {
    if (isStreaming && streamingContent) {
      scrollToBottom();
    }
  }, [streamingContent, isStreaming, scrollToBottom]);

  // Scroll when new messages are added (non-streaming)
  useEffect(() => {
    if (!isStreaming && !isLoading) {
      // Small delay to let React render the new message
      requestAnimationFrame(() => {
        if (isNearBottom()) {
          scrollToBottom();
        }
      });
    }
  }, [session.conversationHistory.length, isStreaming, isLoading, scrollToBottom, isNearBottom]);

  // Reset auto-scroll when user sends a message
  useEffect(() => {
    if (isLoading && !isStreaming) {
      shouldAutoScrollRef.current = true;
      scrollToBottom();
    }
  }, [isLoading, isStreaming, scrollToBottom]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  const handleSuggestionClick = (text: string) => {
    onMessageChange(text);
  };

  const isInputDisabled = (isLoading && !isStreaming) || !!feedback || disabled;

  return (
    <div className="chat-container">
      <div 
        className="messages" 
        ref={messagesContainerRef}
        onScroll={handleScroll}
      >
        {session.conversationHistory
          .filter(msg => msg.role !== 'system')
          .map((msg, idx) => (
            <Message
              key={idx}
              message={msg}
              userLabel={professionConfig.userLabel}
              userEmoji={professionConfig.userEmoji}
              patientLabel={professionConfig.patientLabel}
              patientEmoji={professionConfig.patientEmoji}
            />
          ))}
        
        {/* Show typing indicator while waiting for first token */}
        {isLoading && !isStreaming && (
          <TypingIndicator
            patientLabel={professionConfig.patientLabel}
            patientEmoji={professionConfig.patientEmoji}
          />
        )}
        
        {/* Show streaming message */}
        {isStreaming && (
          <StreamingMessage
            content={streamingContent}
            patientLabel={professionConfig.patientLabel}
            patientEmoji={professionConfig.patientEmoji}
          />
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {feedback && (
        <div className={`feedback ${feedback.correct ? 'correct' : 'incorrect'}`}>
          {feedback.message}
          <button onClick={onNewSession} className="btn-primary" style={{ marginLeft: '1rem' }}>
            New {professionConfig.patientLabel}
          </button>
        </div>
      )}

      {disabled && !feedback && (
        <div className="feedback warning">
          ⏱️ Time's up! Submit your diagnosis now.
        </div>
      )}

      {/* Inline Coach Suggestions */}
      {!feedback && !disabled && (
        <InlineCoach
          profession={profession}
          conversationHistory={session.conversationHistory}
          apiConfig={apiConfig}
          onSuggestionClick={handleSuggestionClick}
          enabled={inlineCoachEnabled}
        />
      )}

      <div className="input-container">
        <div className="input-left-buttons">
          <button 
            onClick={onToggleCoach} 
            className={`btn-coach ${showCoach ? 'active' : ''}`}
            title="Toggle Coach Panel"
          >
            🎓
          </button>
          <button
            onClick={onToggleInlineCoach}
            className={`btn-inline-coach ${inlineCoachEnabled ? 'active' : ''}`}
            title={inlineCoachEnabled ? 'Disable Quick Suggestions' : 'Enable Quick Suggestions'}
          >
            💡
          </button>
        </div>
        <input
          type="text"
          value={currentMessage}
          onChange={(e) => onMessageChange(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={disabled 
            ? 'Submit your diagnosis...' 
            : `Ask the ${professionConfig.patientLabel.toLowerCase()} a question...`
          }
          disabled={isInputDisabled && !disabled}
        />
        {isStreaming ? (
          <button 
            onClick={onStopStreaming} 
            className="btn-secondary btn-stop"
            title="Stop generating"
          >
            ⏹️ Stop
          </button>
        ) : (
          <button 
            onClick={onSend} 
            disabled={isLoading || !currentMessage.trim() || !!feedback} 
            className="btn-primary"
          >
            Send
          </button>
        )}
      </div>
      
      <div className="hint">
        {professionConfig.diagnosisHint}
      </div>
    </div>
  );
}