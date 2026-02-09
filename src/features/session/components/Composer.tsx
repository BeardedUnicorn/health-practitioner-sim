interface ComposerBaseProps {
  currentMessage: string;
  onMessageChange: (message: string) => void;
  onSend: () => void;
  onToggleCoach: () => void;
  onToggleInlineCoach: () => void;
  showCoach: boolean;
  inlineCoachEnabled: boolean;
  isLoading: boolean;
  isStreaming: boolean;
  hasFeedback: boolean;
  onStopStreaming: () => void;
}

interface InteractiveComposerProps extends ComposerBaseProps {
  placeholder: string;
}

interface SummaryRequiredComposerProps extends ComposerBaseProps {
  placeholder: string;
}

function ComposerFrame({
  children,
}: {
  children: ReactNode;
}) {
  return <div className="input-container">{children}</div>;
}

function ComposerControls({
  onToggleCoach,
  onToggleInlineCoach,
  showCoach,
  inlineCoachEnabled,
}: {
  onToggleCoach: () => void;
  onToggleInlineCoach: () => void;
  showCoach: boolean;
  inlineCoachEnabled: boolean;
}) {
  return (
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
  );
}

function ComposerInput({
  currentMessage,
  onMessageChange,
  onSend,
  placeholder,
  disabled,
}: {
  currentMessage: string;
  onMessageChange: (message: string) => void;
  onSend: () => void;
  placeholder: string;
  disabled: boolean;
}) {
  return (
    <input
      type="text"
      value={currentMessage}
      onChange={(event) => onMessageChange(event.target.value)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
          event.preventDefault();
          onSend();
        }
      }}
      placeholder={placeholder}
      disabled={disabled}
    />
  );
}

function ComposerActionButton({
  isStreaming,
  isLoading,
  currentMessage,
  hasFeedback,
  onSend,
  onStopStreaming,
}: {
  isStreaming: boolean;
  isLoading: boolean;
  currentMessage: string;
  hasFeedback: boolean;
  onSend: () => void;
  onStopStreaming: () => void;
}) {
  if (isStreaming) {
    return (
      <button onClick={onStopStreaming} className="btn-secondary btn-stop" title="Stop generating">
        ⏹️ Stop
      </button>
    );
  }

  return (
    <button
      onClick={onSend}
      disabled={isLoading || !currentMessage.trim() || hasFeedback}
      className="btn-primary"
    >
      Send
    </button>
  );
}

export function InteractiveComposer({
  currentMessage,
  onMessageChange,
  onSend,
  onToggleCoach,
  onToggleInlineCoach,
  showCoach,
  inlineCoachEnabled,
  isLoading,
  isStreaming,
  hasFeedback,
  onStopStreaming,
  placeholder,
}: InteractiveComposerProps) {
  const isInputDisabled = (isLoading && !isStreaming) || hasFeedback;

  return (
    <ComposerFrame>
      <ComposerControls
        onToggleCoach={onToggleCoach}
        onToggleInlineCoach={onToggleInlineCoach}
        showCoach={showCoach}
        inlineCoachEnabled={inlineCoachEnabled}
      />
      <ComposerInput
        currentMessage={currentMessage}
        onMessageChange={onMessageChange}
        onSend={onSend}
        placeholder={placeholder}
        disabled={isInputDisabled}
      />
      <ComposerActionButton
        isStreaming={isStreaming}
        isLoading={isLoading}
        currentMessage={currentMessage}
        hasFeedback={hasFeedback}
        onSend={onSend}
        onStopStreaming={onStopStreaming}
      />
    </ComposerFrame>
  );
}

export function SummaryRequiredComposer({
  currentMessage,
  onMessageChange,
  onSend,
  onToggleCoach,
  onToggleInlineCoach,
  showCoach,
  inlineCoachEnabled,
  isLoading,
  isStreaming,
  hasFeedback,
  onStopStreaming,
  placeholder,
}: SummaryRequiredComposerProps) {
  const isInputDisabled = (isLoading && !isStreaming) || hasFeedback;

  return (
    <ComposerFrame>
      <ComposerControls
        onToggleCoach={onToggleCoach}
        onToggleInlineCoach={onToggleInlineCoach}
        showCoach={showCoach}
        inlineCoachEnabled={inlineCoachEnabled}
      />
      <ComposerInput
        currentMessage={currentMessage}
        onMessageChange={onMessageChange}
        onSend={onSend}
        placeholder={placeholder}
        disabled={isInputDisabled}
      />
      <ComposerActionButton
        isStreaming={isStreaming}
        isLoading={isLoading}
        currentMessage={currentMessage}
        hasFeedback={hasFeedback}
        onSend={onSend}
        onStopStreaming={onStopStreaming}
      />
    </ComposerFrame>
  );
}
import { ReactNode } from 'react';
