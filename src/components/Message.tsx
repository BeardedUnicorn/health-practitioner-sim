import ReactMarkdown from 'react-markdown';
import { Message as MessageType } from '../types';
import './Message.css';

interface MessageProps {
  message: MessageType;
  userLabel: string;
  userEmoji: string;
  patientLabel: string;
  patientEmoji: string;
  isCouplesTherapy?: boolean;
  partnerALabel?: string;
  partnerAEmoji?: string;
  partnerBLabel?: string;
  partnerBEmoji?: string;
}

interface ParsedPartnerMessage {
  partner: 'A' | 'B';
  name: string;
  content: string;
}

function parseCouplesMessage(content: string, partnerALabel?: string, partnerBLabel?: string): ParsedPartnerMessage[] | null {
  // Match patterns like [Partner A - Name]: or [Partner B - Name]:
  const partnerPattern = /\[Partner\s*(A|B)\s*(?:-\s*([^\]]+))?\]:\s*/gi;
  const matches = [...content.matchAll(partnerPattern)];
  
  if (matches.length === 0) {
    return null; // Not a couples format message
  }
  
  const messages: ParsedPartnerMessage[] = [];
  
  for (let i = 0; i < matches.length; i++) {
    const match = matches[i];
    const partner = match[1].toUpperCase() as 'A' | 'B';
    const defaultName = partner === 'A' ? (partnerALabel || 'Partner A') : (partnerBLabel || 'Partner B');
    const name = match[2]?.trim() || defaultName;
    const startIndex = match.index! + match[0].length;
    const endIndex = matches[i + 1]?.index || content.length;
    const messageContent = content.slice(startIndex, endIndex).trim();
    
    if (messageContent) {
      messages.push({ partner, name, content: messageContent });
    }
  }
  
  return messages.length > 0 ? messages : null;
}

export function Message({ 
  message, 
  userLabel, 
  userEmoji, 
  patientLabel, 
  patientEmoji,
  isCouplesTherapy,
  partnerALabel,
  partnerAEmoji,
  partnerBLabel,
  partnerBEmoji
}: MessageProps) {
  const isUser = message.role === 'user';
  
  // For couples therapy assistant messages, try to parse partner dialogue
  if (!isUser && isCouplesTherapy) {
    const parsedMessages = parseCouplesMessage(message.content, partnerALabel, partnerBLabel);
    
    if (parsedMessages && parsedMessages.length > 0) {
      return (
        <div className="couples-message-container">
          {parsedMessages.map((pm, idx) => (
            <div 
              key={idx} 
              className={`message assistant partner-${pm.partner.toLowerCase()}`}
            >
              <div className="message-label">
                {pm.partner === 'A' 
                  ? `${partnerAEmoji || '🧑'} ${pm.name}`
                  : `${partnerBEmoji || '👩'} ${pm.name}`
                }
              </div>
              <div className="message-content">
                <ReactMarkdown>{pm.content}</ReactMarkdown>
              </div>
            </div>
          ))}
        </div>
      );
    }
  }
  
  // Standard single-person message
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
  isCouplesTherapy?: boolean;
  partnerALabel?: string;
  partnerAEmoji?: string;
  partnerBLabel?: string;
  partnerBEmoji?: string;
}

export function StreamingMessage({ 
  content, 
  patientLabel, 
  patientEmoji,
  isCouplesTherapy,
  partnerALabel,
  partnerAEmoji,
  partnerBLabel,
  partnerBEmoji
}: StreamingMessageProps) {
  // For couples therapy, try to parse the streaming content
  if (isCouplesTherapy && content) {
    const parsedMessages = parseCouplesMessage(content, partnerALabel, partnerBLabel);
    
    if (parsedMessages && parsedMessages.length > 0) {
      return (
        <div className="couples-message-container streaming">
          {parsedMessages.map((pm, idx) => (
            <div 
              key={idx} 
              className={`message assistant partner-${pm.partner.toLowerCase()}`}
            >
              <div className="message-label">
                {pm.partner === 'A' 
                  ? `${partnerAEmoji || '🧑'} ${pm.name}`
                  : `${partnerBEmoji || '👩'} ${pm.name}`
                }
              </div>
              <div className="message-content">
                <ReactMarkdown>{pm.content}</ReactMarkdown>
                {idx === parsedMessages.length - 1 && (
                  <span className="streaming-cursor" />
                )}
              </div>
            </div>
          ))}
        </div>
      );
    }
  }
  
  // Standard streaming message
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
  isCouplesTherapy?: boolean;
  partnerAEmoji?: string;
  partnerBEmoji?: string;
}

export function TypingIndicator({ 
  patientLabel, 
  patientEmoji,
  isCouplesTherapy,
  partnerAEmoji,
  partnerBEmoji
}: TypingIndicatorProps) {
  if (isCouplesTherapy) {
    return (
      <div className="couples-typing-indicator">
        <div className="message assistant partner-a">
          <div className="message-label">{partnerAEmoji || '🧑'} & {partnerBEmoji || '👩'}</div>
          <div className="message-content typing">
            <span className="typing-dots">
              <span></span>
              <span></span>
              <span></span>
            </span>
          </div>
        </div>
      </div>
    );
  }
  
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
