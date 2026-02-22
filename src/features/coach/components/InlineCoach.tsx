import { ApiConfig, Message, Profession } from '../../../types';
import { useCoachContext } from '../state/coach-context';
import { useSessionContext } from '../../session/state/session-context';
import { useCoachSuggestions } from '../hooks/useCoachSuggestions';
import '../../../components/Coach.css';

interface InlineCoachProps {
  profession: Profession;
  conversationHistory: Message[];
  apiConfig: ApiConfig;
  enabled: boolean;
}

export function InlineCoach({ profession, conversationHistory, apiConfig, enabled }: InlineCoachProps) {
  const { actions: coachActions } = useCoachContext();
  const { actions: sessionActions } = useSessionContext();
  const { suggestions, isLoading } = useCoachSuggestions({
    mode: 'inline',
    enabled,
    profession,
    conversationHistory,
    apiConfig,
    onError: sessionActions.setError,
  });

  if (!enabled) {
    return null;
  }

  return (
    <div className="inline-coach">
      <div className="inline-coach-header">
        <span className="inline-coach-icon">🎓</span>
        <span className="inline-coach-label">Suggested questions</span>
        {isLoading && (
          <span className="inline-coach-status">
            <span className="inline-coach-spinner"></span>
            updating
          </span>
        )}
      </div>

      <div className={`inline-coach-chips ${isLoading ? 'loading' : ''}`}>
        {suggestions.map((suggestion) => (
          <button
            key={suggestion.id}
            className="inline-coach-chip"
            onClick={() => coachActions.selectSuggestion(suggestion.fullText)}
            title={suggestion.fullText}
            disabled={isLoading}
          >
            {suggestion.shortLabel}
          </button>
        ))}

        {suggestions.length === 0 && isLoading && (
          <span className="inline-coach-empty">
            <span className="inline-coach-spinner"></span>
            Analyzing conversation...
          </span>
        )}

        {suggestions.length === 0 && !isLoading && (
          <span className="inline-coach-empty">No suggestions yet</span>
        )}
      </div>
    </div>
  );
}
