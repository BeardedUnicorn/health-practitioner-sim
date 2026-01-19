import ReactMarkdown from 'react-markdown';
import { Message as MessageType } from '../types';

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

interface TypingIndicatorProps {
  patientLabel: string;
  patientEmoji: string;
}

export function TypingIndicator({ patientLabel, patientEmoji }: TypingIndicatorProps) {
  return (
    <div className="message assistant">
      <div className="message-label">{patientEmoji} {patientLabel}</div>
      <div className="message-content typing">Thinking</div>
    </div>
  );
}