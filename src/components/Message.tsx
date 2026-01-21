import ReactMarkdown from 'react-markdown';
import { Message as MessageType } from '../types';
import './Message.css';

interface MessageProps {
  message: MessageType;
  userLabel: string;
  userEmoji: string;
  patientLabel: string;
  patientEmoji: string;
}

export function Message({ message, userLabel, userEmoji, patientLabel, patientEmoji }: MessageProps) {
  const isUser = message.role === 'user';
  
  return (
    <div className={`message ${message.role}`}>
      <div className="message-label">
        {isUser ? `${userEmoji} ${userLabel}` : `${patientEmoji} ${patientLabel}`}
      </div>
      <div className="message-content">
        <ReactMarkdown>{message.content}</ReactMarkdown>
      </div>
    </div>
  );
}

interface StreamingMessageProps {
  content: string;
  patientLabel: string;
  patientEmoji: string;
}

export function StreamingMessage({ content, patientLabel, patientEmoji }: StreamingMessageProps) {
  return (
    <div className="message assistant">
      <div className="message-label">{patientEmoji} {patientLabel}</div>
      <div className="message-content streaming">
        {content ? (
          <>
            <ReactMarkdown>{content}</ReactMarkdown>
            <span className="streaming-cursor" />
          </>
        ) : (
          <span className="streaming-cursor initial" />
        )}
      </div>
    </div>
  );
}

interface TypingIndicatorProps {
  patientLabel: string;
  patientEmoji: string;
}

export function TypingIndicator({ patientLabel, patientEmoji }: TypingIndicatorProps) {
  return (
    <div className="message assistant">
      <div className="message-label">{patientEmoji} {patientLabel}</div>
      <div className="message-content typing">
        <span className="typing-dots">
          <span></span>
          <span></span>
          <span></span>
        </span>
      </div>
    </div>
  );
}