import ReactMarkdown from 'react-markdown';
import { Message } from '../../../../types';
import '../../../../components/Message.css';

interface SinglePatientConversationProps {
  messages: Message[];
  isLoading: boolean;
  isStreaming: boolean;
  streamingContent: string;
  userLabel: string;
  userEmoji: string;
  patientLabel: string;
  patientEmoji: string;
}

export function SinglePatientConversation({
  messages,
  isLoading,
  isStreaming,
  streamingContent,
  userLabel,
  userEmoji,
  patientLabel,
  patientEmoji,
}: SinglePatientConversationProps) {
  return (
    <>
      {messages
        .filter((message) => message.role !== 'system')
        .map((message, index) => {
          const isUser = message.role === 'user';

          return (
            <div key={`${message.role}-${index}`} className={`message ${message.role}`}>
              <div className="message-label">
                {isUser ? `${userEmoji} ${userLabel}` : `${patientEmoji} ${patientLabel}`}
              </div>
              <div className="message-content">
                <ReactMarkdown>{message.content}</ReactMarkdown>
              </div>
            </div>
          );
        })}

      {isLoading && !isStreaming && (
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
      )}

      {isStreaming && (
        <div className="message assistant">
          <div className="message-label">{patientEmoji} {patientLabel}</div>
          <div className="message-content streaming">
            {streamingContent ? (
              <>
                <ReactMarkdown>{streamingContent}</ReactMarkdown>
                <span className="streaming-cursor" />
              </>
            ) : (
              <span className="streaming-cursor initial" />
            )}
          </div>
        </div>
      )}
    </>
  );
}
