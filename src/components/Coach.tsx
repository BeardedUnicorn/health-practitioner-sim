import { useState, useEffect, useRef, useCallback } from 'react';
import { Profession, ApiConfig, CoachData, CoachSuggestion, SuggestionType, Message } from '../types';
import { professionConfigs } from '../config/professionConfig';

interface CoachProps {
  profession: Profession;
  conversationHistory: Message[];
  apiConfig: ApiConfig;
  onClose: () => void;
  onSuggestionClick: (text: string) => void;
}

const SUGGESTION_TYPE_INFO: Record<SuggestionType, { emoji: string; label: string; color: string }> = {
  question: { emoji: '❓', label: 'Question', color: 'var(--accent-primary)' },
  assessment: { emoji: '🩺', label: 'Assessment', color: 'var(--success)' },
  consideration: { emoji: '💭', label: 'Consider', color: 'var(--warning)' },
  followup: { emoji: '➡️', label: 'Follow-up', color: 'var(--accent-secondary)' }
};

export function Coach({ 
  profession, 
  conversationHistory,
  apiConfig, 
  onClose,
  onSuggestionClick 
}: CoachProps) {
  const [coachData, setCoachData] = useState<CoachData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastConversationLengthRef = useRef<number>(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  const professionConfig = professionConfigs[profession];

  // Build conversation text for the prompt (excluding system message)
  const buildConversationText = useCallback(() => {
    return conversationHistory
      .filter(msg => msg.role !== 'system')
      .map(msg => `${msg.role === 'user' ? professionConfig.userLabel : professionConfig.patientLabel}: ${msg.content}`)
      .join('\n');
  }, [conversationHistory, professionConfig]);

  const generateCoachAdvice = useCallback(async (forceRefresh = false) => {
    const currentLength = conversationHistory.length;
    
    // Don't regenerate if conversation hasn't changed (unless forced)
    if (!forceRefresh && currentLength === lastConversationLengthRef.current && coachData) {
      return;
    }
    
    lastConversationLengthRef.current = currentLength;
    
    // Cancel any pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    
    setIsLoading(true);
    setError(null);

    const conversationText = buildConversationText();
    
    const coachPrompt = `You are an expert ${professionConfig.name} educator providing real-time coaching to a trainee.

IMPORTANT: You do NOT know what condition the ${professionConfig.patientLabel.toLowerCase()} has. Your job is to help the trainee use proper clinical reasoning to figure it out themselves.

The trainee is practicing with a simulated ${professionConfig.patientLabel.toLowerCase()}. Here is the conversation so far:

${conversationText || '(Conversation just started - the trainee has not asked any questions yet)'}

Based on what has been discussed (or not discussed yet), provide coaching guidance to help the trainee:
1. Identify what information they should gather next
2. Suggest systematic assessment approaches
3. Point out areas they haven't explored yet
4. Guide their clinical reasoning WITHOUT revealing any diagnosis

You MUST respond in EXACTLY this JSON format (no other text, just valid JSON):
{
  "suggestions": [
    {
      "text": "<description of what to ask/do>",
      "type": "<one of: question, assessment, consideration, followup>",
      "shortLabel": "<2-4 word label for the chip>",
      "fullText": "<the exact question or statement to say, ready to send>"
    }
  ],
  "summary": "<1-2 sentence overview of what the trainee should focus on next, based on clinical reasoning principles>",
  "missingAreas": [
    "<important clinical area not yet explored>",
    "<another area to consider>"
  ]
}

Guidelines:
- Provide 3-5 suggestions prioritized by clinical importance
- "question" type: Questions to ask the ${professionConfig.patientLabel.toLowerCase()} to gather more information
- "assessment" type: Physical or mental assessments to perform
- "consideration" type: Clinical reasoning points to keep in mind
- "followup" type: Follow-up questions based on what was already discussed

Focus on PROCESS not ANSWERS:
- What symptoms should be clarified?
- What history is missing?
- What systems haven't been reviewed?
- What red flags should be ruled out?
- What assessments would help narrow things down?

DO NOT suggest specific diagnoses or treatments. Help the trainee gather information systematically.`;

    try {
      const response = await fetch(`${apiConfig.apiUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiConfig.apiKey}`
        },
        body: JSON.stringify({
          model: apiConfig.modelName,
          messages: [{ role: 'user', content: coachPrompt }],
          temperature: 0.7
        }),
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) {
        throw new Error('Failed to get coach advice');
      }

      const data = await response.json();
      let content = data.choices[0].message.content;
      
      // Handle markdown code blocks
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        content = jsonMatch[1];
      }
      
      const parsed = JSON.parse(content.trim());
      
      // Add IDs to suggestions
      const suggestionsWithIds: CoachSuggestion[] = parsed.suggestions.map((s: any, idx: number) => ({
        ...s,
        id: `suggestion-${Date.now()}-${idx}`
      }));
      
      setCoachData({
        suggestions: suggestionsWithIds,
        summary: parsed.summary,
        missingAreas: parsed.missingAreas || [],
        timestamp: Date.now()
      });
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return; // Request was cancelled, don't update state
      }
      console.error('Coach error:', err);
      setError('Unable to generate coaching advice');
    } finally {
      setIsLoading(false);
    }
  }, [conversationHistory, buildConversationText, apiConfig, professionConfig, coachData]);

  // Auto-refresh when conversation changes
  useEffect(() => {
    if (conversationHistory.length > 0) {
      generateCoachAdvice();
    }
    
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [conversationHistory.length, generateCoachAdvice]);

  const handleSuggestionClick = (suggestion: CoachSuggestion) => {
    onSuggestionClick(suggestion.fullText);
  };

  const handleRefresh = () => {
    generateCoachAdvice(true);
  };

  return (
    <>
      <div className="side-panel-header">
        <div className="coach-header-left">
          <h3>🎓 {professionConfig.name} Coach</h3>
          {isLoading && (
            <span className="coach-header-status">
              <span className="coach-status-dot"></span>
              Analyzing...
            </span>
          )}
        </div>
        <button onClick={onClose} className="panel-close">×</button>
      </div>
      
      <div className={`side-panel-content coach-content ${isLoading ? 'coach-loading' : ''}`}>
        {/* Full-panel loading state for initial load */}
        {isLoading && !coachData && (
          <div className="coach-loading-full">
            <div className="coach-loading-spinner"></div>
            <p>Analyzing conversation...</p>
          </div>
        )}
        
        {error && !coachData && (
          <div className="coach-error">
            <p>⚠️ {error}</p>
            <button onClick={handleRefresh} className="btn-secondary btn-small">
              🔄 Retry
            </button>
          </div>
        )}
        
        {coachData && (
          <>
            {/* Loading overlay for refresh */}
            {isLoading && (
              <div className="coach-updating-banner">
                <span className="coach-updating-spinner"></span>
                <span>Updating suggestions...</span>
              </div>
            )}
            
            {/* Summary */}
            <div className="coach-summary">
              <div className="coach-summary-icon">💡</div>
              <p>{coachData.summary}</p>
            </div>
            
            {/* Suggestions */}
            <div className="coach-suggestions-section">
              <h4>Suggested Next Steps</h4>
              <div className="coach-suggestions">
                {coachData.suggestions.map((suggestion) => (
                  <button
                    key={suggestion.id}
                    className={`coach-suggestion-chip type-${suggestion.type}`}
                    onClick={() => handleSuggestionClick(suggestion)}
                    title={suggestion.fullText}
                    disabled={isLoading}
                  >
                    <span className="chip-icon">
                      {SUGGESTION_TYPE_INFO[suggestion.type].emoji}
                    </span>
                    <span className="chip-label">{suggestion.shortLabel}</span>
                    <span className="chip-arrow">→</span>
                  </button>
                ))}
              </div>
            </div>
            
            {/* Missing Areas */}
            {coachData.missingAreas.length > 0 && (
              <div className="coach-missing-section">
                <h4>📋 Areas to Explore</h4>
                <ul className="coach-missing-list">
                  {coachData.missingAreas.map((area, idx) => (
                    <li key={idx}>{area}</li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
        
        {!coachData && !isLoading && !error && (
          <div className="coach-empty">
            <p>Start the conversation to receive coaching guidance.</p>
          </div>
        )}
      </div>
      
      <div className="side-panel-footer">
        <button 
          onClick={handleRefresh} 
          disabled={isLoading} 
          className="btn-secondary"
        >
          {isLoading ? (
            <>
              <span className="btn-spinner"></span>
              Analyzing...
            </>
          ) : (
            '🔄 Refresh'
          )}
        </button>
      </div>
    </>
  );
}

// Inline Coach component for showing suggestions under the input
interface InlineCoachProps {
  profession: Profession;
  conversationHistory: Message[];
  apiConfig: ApiConfig;
  onSuggestionClick: (text: string) => void;
  enabled: boolean;
}

export function InlineCoach({
  profession,
  conversationHistory,
  apiConfig,
  onSuggestionClick,
  enabled
}: InlineCoachProps) {
  const [suggestions, setSuggestions] = useState<CoachSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const lastConversationLengthRef = useRef<number>(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  const professionConfig = professionConfigs[profession];

  const generateQuickSuggestions = useCallback(async () => {
    if (!enabled) return;
    
    const currentLength = conversationHistory.length;
    if (currentLength === lastConversationLengthRef.current && suggestions.length > 0) {
      return;
    }
    
    lastConversationLengthRef.current = currentLength;
    
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    
    setIsLoading(true);

    const conversationText = conversationHistory
      .filter(msg => msg.role !== 'system')
      .slice(-6)
      .map(msg => `${msg.role === 'user' ? professionConfig.userLabel : professionConfig.patientLabel}: ${msg.content}`)
      .join('\n');
    
    const quickPrompt = `You are a ${professionConfig.name} coach helping a trainee. You do NOT know the ${professionConfig.patientLabel.toLowerCase()}'s condition.

Conversation so far:
${conversationText || '(Just started)'}

Suggest 3 good questions the trainee should ask next to gather important clinical information. Focus on systematic assessment - what's missing from the history?

Return ONLY a JSON array:
[
  {"shortLabel": "2-3 word label", "fullText": "complete question to ask"},
  {"shortLabel": "2-3 word label", "fullText": "complete question to ask"},
  {"shortLabel": "2-3 word label", "fullText": "complete question to ask"}
]

Focus on gathering information, NOT diagnosing. No other text.`;

    try {
      const response = await fetch(`${apiConfig.apiUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiConfig.apiKey}`
        },
        body: JSON.stringify({
          model: apiConfig.modelName,
          messages: [{ role: 'user', content: quickPrompt }],
          temperature: 0.7
        }),
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) throw new Error('Failed');

      const data = await response.json();
      let content = data.choices[0].message.content;
      
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        content = jsonMatch[1];
      }
      
      // Try to find JSON array in content
      const arrayMatch = content.match(/\[[\s\S]*\]/);
      if (arrayMatch) {
        content = arrayMatch[0];
      }
      
      const parsed = JSON.parse(content.trim());
      
      const quickSuggestions: CoachSuggestion[] = parsed.slice(0, 3).map((s: any, idx: number) => ({
        id: `quick-${Date.now()}-${idx}`,
        text: s.fullText,
        type: 'question' as SuggestionType,
        shortLabel: s.shortLabel,
        fullText: s.fullText
      }));
      
      setSuggestions(quickSuggestions);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      console.log('Inline coach error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [conversationHistory, apiConfig, professionConfig, enabled, suggestions.length]);

  useEffect(() => {
    if (enabled && conversationHistory.length > 0) {
      generateQuickSuggestions();
    }
    
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [conversationHistory.length, enabled, generateQuickSuggestions]);

  // Reset suggestions when disabled
  useEffect(() => {
    if (!enabled) {
      setSuggestions([]);
      lastConversationLengthRef.current = 0;
    }
  }, [enabled]);

  if (!enabled) return null;

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
            onClick={() => onSuggestionClick(suggestion.fullText)}
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