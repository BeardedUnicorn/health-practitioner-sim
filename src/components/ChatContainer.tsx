import { useRef, useEffect } from 'react';
import { PatientSession, ProfessionConfig, Profession } from '../types';
import { Message, TypingIndicator } from './Message';

interface ChatContainerProps {
  session: PatientSession;
  profession: Profession;
  professionConfig: ProfessionConfig;
  currentMessage: string;
  isLoading: boolean;
  feedback: { correct: boolean; message: string } | null;
  showCoach: boolean;
  onMessageChange: (message: string) => void;
  onSend: () => void;
  onNewSession: () => void;
  onToggleCoach: () => void;
}

export function ChatContainer({
  session,
  professionConfig,
  currentMessage,
  isLoading,
  feedback,
  showCoach,
  onMessageChange,
  onSend,
  onNewSession,
  onToggleCoach
}: ChatContainerProps) {
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [session.conversationHistory]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div className="chat-container">
      <div className="messages">
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
        {isLoading && (
          <TypingIndicator
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

      <div className="input-container">
        <button 
          onClick={onToggleCoach} 
          className={`btn-coach ${showCoach ? 'active' : ''}`}
          title="Toggle Coach"
        >
          🎓
        </button>
        <input
          type="text"
          value={currentMessage}
          onChange={(e) => onMessageChange(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={`Ask the ${professionConfig.patientLabel.toLowerCase()} a question...`}
          disabled={isLoading || !!feedback}
        />
        <button 
          onClick={onSend} 
          disabled={isLoading || !currentMessage.trim() || !!feedback} 
          className="btn-primary"
        >
          Send
        </button>
      </div>
      
      <div className="hint">
        {professionConfig.diagnosisHint}
      </div>
    </div>
  );
}