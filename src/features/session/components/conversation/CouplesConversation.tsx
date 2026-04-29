/* eslint-disable react-refresh/only-export-components */
import ReactMarkdown from 'react-markdown';
import { Message } from '../../../../types';
import '../../../../components/Message.css';

interface ParsedPartnerMessage {
  partner: 'A' | 'B';
  name: string;
  content: string;
}

interface CouplesConversationProps {
  messages: Message[];
  isLoading: boolean;
  isStreaming: boolean;
  streamingContent: string;
  userLabel: string;
  userEmoji: string;
  partnerAEmoji?: string;
  partnerBEmoji?: string;
}

export function parseCouplesMessage(content: string): ParsedPartnerMessage[] | null {
  const partnerPattern = /\[Partner\s*(A|B)\s*(?:-\s*([^\]]+))?\]:\s*/gi;
  const matches = [...content.matchAll(partnerPattern)];

  if (matches.length === 0) {
    return null;
  }

  const parsedMessages: ParsedPartnerMessage[] = [];

  for (let index = 0; index < matches.length; index += 1) {
    const currentMatch = matches[index];
    const partner = currentMatch[1].toUpperCase() as 'A' | 'B';
    const name = currentMatch[2]?.trim() || `Partner ${partner}`;
    const startIndex = currentMatch.index! + currentMatch[0].length;
    const endIndex = matches[index + 1]?.index || content.length;
    const messageContent = content.slice(startIndex, endIndex).trim();

    if (messageContent) {
      parsedMessages.push({
        partner,
        name,
        content: messageContent,
      });
    }
  }

  return parsedMessages.length > 0 ? parsedMessages : null;
}

function renderPartnerMessages(
  parsedMessages: ParsedPartnerMessage[],
  partnerAEmoji?: string,
  partnerBEmoji?: string,
  isStreaming = false,
) {
  return (
    <div className={`couples-message-container ${isStreaming ? 'streaming' : ''}`}>
      {parsedMessages.map((parsedMessage, index) => (
        <div
          key={`${parsedMessage.partner}-${index}`}
          className={`message assistant partner-${parsedMessage.partner.toLowerCase()}`}
        >
          <div className="message-label">
            {parsedMessage.partner === 'A'
              ? `${partnerAEmoji || '🧑'} ${parsedMessage.name}`
              : `${partnerBEmoji || '👩'} ${parsedMessage.name}`}
          </div>
          <div className="message-content">
            <ReactMarkdown>{parsedMessage.content}</ReactMarkdown>
            {isStreaming && index === parsedMessages.length - 1 && <span className="streaming-cursor" />}
          </div>
        </div>
      ))}
    </div>
  );
}

export function CouplesConversation({
  messages,
  isLoading,
  isStreaming,
  streamingContent,
  userLabel,
  userEmoji,
  partnerAEmoji,
  partnerBEmoji,
}: CouplesConversationProps) {
  return (
    <>
      {messages
        .filter((message) => message.role !== 'system')
        .map((message, index) => {
          if (message.role === 'user') {
            return (
              <div key={`user-${index}`} className="message user">
                <div className="message-label">{userEmoji} {userLabel}</div>
                <div className="message-content">
                  <ReactMarkdown>{message.content}</ReactMarkdown>
                </div>
              </div>
            );
          }

          const parsedMessages = parseCouplesMessage(message.content);
          if (parsedMessages && parsedMessages.length > 0) {
            return (
              <div key={`assistant-${index}`}>
                {renderPartnerMessages(parsedMessages, partnerAEmoji, partnerBEmoji)}
              </div>
            );
          }

          return (
            <div key={`assistant-${index}`} className="message assistant">
              <div className="message-label">{partnerAEmoji || '🧑'} &amp; {partnerBEmoji || '👩'}</div>
              <div className="message-content">
                <ReactMarkdown>{message.content}</ReactMarkdown>
              </div>
            </div>
          );
        })}

      {isLoading && !isStreaming && (
        <div className="couples-typing-indicator">
          <div className="message assistant partner-a">
            <div className="message-label">{partnerAEmoji || '🧑'} &amp; {partnerBEmoji || '👩'}</div>
            <div className="message-content typing">
              <span className="typing-dots">
                <span></span>
                <span></span>
                <span></span>
              </span>
            </div>
          </div>
        </div>
      )}

      {isStreaming && (() => {
        const parsedMessages = parseCouplesMessage(streamingContent);
        if (parsedMessages && parsedMessages.length > 0) {
          return renderPartnerMessages(parsedMessages, partnerAEmoji, partnerBEmoji, true);
        }

        return (
          <div className="message assistant">
            <div className="message-label">{partnerAEmoji || '🧑'} &amp; {partnerBEmoji || '👩'}</div>
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
        );
      })()}
    </>
  );
}
