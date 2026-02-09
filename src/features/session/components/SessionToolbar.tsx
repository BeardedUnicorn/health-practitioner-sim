import { ProfessionConfig } from '../../../types';

interface SessionToolbarProps {
  professionConfig: ProfessionConfig;
  isLoading: boolean;
  isStreaming: boolean;
  showToolkit: boolean;
  showAnswer: boolean;
  hasFeedback: boolean;
  onNewSession: () => void;
  onToggleToolkit: () => void;
  onToggleAnswer: () => void;
  onShowEvaluation: () => void;
  onOpenSettings: () => void;
  onEndSession: () => void;
}

export function SessionToolbar({
  professionConfig,
  isLoading,
  isStreaming,
  showToolkit,
  showAnswer,
  hasFeedback,
  onNewSession,
  onToggleToolkit,
  onToggleAnswer,
  onShowEvaluation,
  onOpenSettings,
  onEndSession,
}: SessionToolbarProps) {
  return (
    <div className="header">
      <h1>{professionConfig.emoji} {professionConfig.title}</h1>
      <div className="header-buttons">
        <button onClick={onNewSession} className="btn-secondary" disabled={isLoading || isStreaming}>
          🔄 New {professionConfig.patientLabel}
        </button>
        <button onClick={onToggleToolkit} className={showToolkit ? 'btn-secondary active' : 'btn-secondary'}>
          🩺 Assessment Toolkit
        </button>
        <button onClick={onToggleAnswer} className={showAnswer ? 'btn-secondary active' : 'btn-secondary'}>
          {showAnswer ? '🙈 Hide Answer' : '👁️ Reveal Answer'}
        </button>
        {hasFeedback && (
          <button onClick={onShowEvaluation} className="btn-secondary">
            📊 View Evaluation
          </button>
        )}
        <button onClick={onOpenSettings} className="btn-secondary">
          ⚙️ Settings
        </button>
        <button onClick={onEndSession} className="btn-secondary">
          ✖️ End Session
        </button>
      </div>
    </div>
  );
}
