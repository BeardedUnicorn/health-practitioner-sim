import { ApiConfig, Message, Profession, SuggestionType, TrainingMode } from '../../../types';
import { useCoachContext } from '../state/coach-context';
import { useCoachSuggestions } from '../hooks/useCoachSuggestions';
import '../../../components/Coach.css';

interface CoachPanelProps {
  profession: Profession;
  conversationHistory: Message[];
  apiConfig: ApiConfig;
  onClose: () => void;
  trainingMode: TrainingMode;
  hintsUsed: number;
  onRevealHint: () => void;
}

const SUGGESTION_TYPE_INFO: Record<SuggestionType, { emoji: string; label: string; color: string }> = {
  question: { emoji: '❓', label: 'Question', color: 'var(--accent-primary)' },
  assessment: { emoji: '🩺', label: 'Assessment', color: 'var(--success)' },
  consideration: { emoji: '💭', label: 'Consider', color: 'var(--warning)' },
  followup: { emoji: '➡️', label: 'Follow-up', color: 'var(--accent-secondary)' },
};

export function CoachPanel({
  profession,
  conversationHistory,
  apiConfig,
  onClose,
  trainingMode,
  hintsUsed,
}: CoachPanelProps) {
  const { actions } = useCoachContext();
  const { suggestions, summary, missingAreas, isLoading, error, refresh } = useCoachSuggestions({
    mode: 'panel',
    enabled: true,
    trainingMode,
    hintsUsed,
    profession,
    conversationHistory,
    apiConfig,
  });

  const hasData = suggestions.length > 0 || summary || missingAreas.length > 0;

  const showEmptyState = !hasData && !isLoading && !error;

  const refreshButtonText = () => {
    if (isLoading) {
      return (
        <>
          <span className="btn-spinner"></span>
          {hasData ? 'Updating...' : 'Analyzing...'}
        </>
      );
    }
    if (trainingMode === 'exam') {
      return '🔄 Get Another Hint';
    }
    return '🔄 Refresh';
  };

  return (
    <>
      <div className="side-panel-header">
        <div className="coach-header-left">
          <h3>{trainingMode === 'exam' ? `🎓 Coach (Hint ${hintsUsed})` : '🎓 Coach'}</h3>
          {isLoading && (
            <span className="coach-header-status">
              <span className="coach-status-dot"></span>
              {hasData ? 'Updating...' : 'Analyzing...'}
            </span>
          )}
        </div>
        <button onClick={onClose} className="panel-close">×</button>
      </div>

      <div className={`side-panel-content coach-content ${isLoading && hasData ? 'coach-refreshing' : ''}`}>
        {isLoading && !hasData && (
          <div className="coach-loading-full">
            <div className="coach-loading-spinner"></div>
            <p>Analyzing conversation...</p>
          </div>
        )}

        {error && !hasData && (
          <div className="coach-error">
            <p>⚠️ {error}</p>
            <button onClick={refresh} className="btn-secondary btn-small">
              🔄 Retry
            </button>
          </div>
        )}

        {hasData && (
          <>
            {isLoading && (
              <div className="coach-updating-banner">
                <span className="coach-updating-spinner"></span>
                <span>Updating suggestions...</span>
              </div>
            )}

            {summary && (
              <div className="coach-summary">
                <div className="coach-summary-icon">💡</div>
                <p>{summary}</p>
              </div>
            )}

            {suggestions.length > 0 && (
              <div className="coach-suggestions-section">
                <h4>Suggested Next Steps</h4>
                <div className="coach-suggestions">
                  {suggestions.map((suggestion) => (
                    <button
                      key={suggestion.id}
                      className={`coach-suggestion-chip type-${suggestion.type}`}
                      onClick={() => actions.selectSuggestion(suggestion.fullText)}
                      title={suggestion.fullText}
                      disabled={isLoading}
                    >
                      <span className="chip-icon">{SUGGESTION_TYPE_INFO[suggestion.type].emoji}</span>
                      <span className="chip-label">{suggestion.shortLabel}</span>
                      <span className="chip-arrow">→</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {missingAreas.length > 0 && (
              <div className="coach-missing-section">
                <h4>📋 Areas to Explore</h4>
                <ul className="coach-missing-list">
                  {missingAreas.map((area, index) => (
                    <li key={index}>{area}</li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}

        {showEmptyState && trainingMode === 'guided' && (
          <div className="coach-empty">
            <p>Start the conversation to receive coaching guidance.</p>
          </div>
        )}

        {showEmptyState && trainingMode === 'exam' && (
           <div className="coach-empty">
             <p>Click "Get Another Hint" to receive more suggestions.</p>
           </div>
        )}
      </div>

      <div className="side-panel-footer">
        <button
          onClick={() => {
            if (trainingMode === 'exam') {
              onRevealHint();
            } else {
              refresh();
            }
          }}
          disabled={isLoading}
          className="btn-secondary"
        >
          {refreshButtonText()}
        </button>
      </div>
    </>
  );
}
