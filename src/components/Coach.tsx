import { useState, useEffect, useRef, useCallback } from 'react';
import { Profession, ApiConfig, CoachData, CoachSuggestion, SuggestionType } from '../types';
import { professionConfigs } from '../config/professionConfig';

interface CoachProps {
  profession: Profession;
  sessionContext: string;
  conversationHistory: string;
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
  sessionContext, 
  conversationHistory, 
  apiConfig, 
  onClose,
  onSuggestionClick 
}: CoachProps) {
  const [coachData, setCoachData] = useState<CoachData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastConversationRef = useRef<string>('');
  const abortControllerRef = useRef<AbortController | null>(null);

  const professionConfig = professionConfigs[profession];

  const generateCoachAdvice = useCallback(async () => {
    // Don't regenerate if conversation hasn't changed
    if (conversationHistory === lastConversationRef.current && coachData) {
      return;
    }
    
    lastConversationRef.current = conversationHistory;
    
    // Cancel any pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    
    setIsLoading(true);
    setError(null);
    
    const coachPrompt = `You are an expert ${professionConfig.name} educator and coach providing real-time guidance.

Based on this ${professionConfig.patientLabel.toLowerCase()} case context:
${sessionContext}

Recent conversation:
${conversationHistory}

Analyze the conversation and provide actionable coaching guidance.

You MUST respond in EXACTLY this JSON format (no other text, just valid JSON):
{
  "suggestions": [
    {
      "text": "<exact question or action to take - written as if the clinician would say/do it>",
      "type": "<one of: question, assessment, consideration, followup>",
      "shortLabel": "<2-4 word label for the chip>",
      "fullText": "<the complete question/statement to insert, ready to send>"
    }
  ],
  "summary": "<1-2 sentence overview of current status and what's most important to address>",
  "missingAreas": [
    "<brief description of area not yet explored>",
    "<another missing area>"
  ]
}

Guidelines for suggestions:
- Provide 3-5 suggestions, prioritized by importance
- "question" type: Direct questions to ask the ${professionConfig.patientLabel.toLowerCase()}
- "assessment" type: Physical/mental assessments to perform (for toolkit use)
- "consideration" type: Important factors to keep in mind
- "followup" type: Follow-up questions based on previous answers

Make suggestions specific to THIS case and conversation state. The "fullText" should be copy-paste ready.`;

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
  }, [conversationHistory, sessionContext, apiConfig, professionConfig]);

  // Auto-refresh when conversation changes
  useEffect(() => {
    if (conversationHistory) {
      generateCoachAdvice();
    }
    
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [conversationHistory, generateCoachAdvice]);

  const handleSuggestionClick = (suggestion: CoachSuggestion) => {
    onSuggestionClick(suggestion.fullText);
  };

  return (
    <>
      <div className="side-panel-header">
        <h3>🎓 {professionConfig.name} Coach</h3>
        <button onClick={onClose} className="panel-close">×</button>
      </div>
      
      <div className="side-panel-content coach-content">
        {/* Loading indicator */}
        {isLoading && (
          <div className="coach-loading-bar">
            <div className="coach-loading-progress"></div>
          </div>
        )}
        
        {error && !coachData && (
          <div className="coach-error">
            <p>⚠️ {error}</p>
            <button onClick={generateCoachAdvice} className="btn-secondary btn-small">
              🔄 Retry
            </button>
          </div>
        )}
        
        {coachData && (
          <>
            {/* Summary */}
            <div className="coach-summary">
              <div className="coach-summary-icon">💡</div>
              <p>{coachData.summary}</p>
            </div>
            
            {/* Suggestions */}
            <div className="coach-suggestions-section">
              <h4>Suggested Actions</h4>
              <div className="coach-suggestions">
                {coachData.suggestions.map((suggestion) => (
                  <button
                    key={suggestion.id}
                    className={`coach-suggestion-chip type-${suggestion.type}`}
                    onClick={() => handleSuggestionClick(suggestion)}
                    title={suggestion.fullText}
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
            <p>Start the conversation to receive coaching suggestions.</p>
          </div>
        )}
      </div>
      
      <div className="side-panel-footer">
        <button 
          onClick={generateCoachAdvice} 
          disabled={isLoading} 
          className="btn-secondary"
        >
          {isLoading ? '⏳ Analyzing...' : '🔄 Refresh'}
        </button>
      </div>
    </>
  );
}

// Inline Coach component for showing suggestions under the input
interface InlineCoachProps {
  profession: Profession;
  sessionContext: string;
  conversationHistory: string;
  apiConfig: ApiConfig;
  onSuggestionClick: (text: string) => void;
  enabled: boolean;
}

export function InlineCoach({
  profession,
  sessionContext,
  conversationHistory,
  apiConfig,
  onSuggestionClick,
  enabled
}: InlineCoachProps) {
  const [suggestions, setSuggestions] = useState<CoachSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const lastConversationRef = useRef<string>('');
  const abortControllerRef = useRef<AbortController | null>(null);

  const professionConfig = professionConfigs[profession];

  const generateQuickSuggestions = useCallback(async () => {
    if (!enabled) return;
    if (conversationHistory === lastConversationRef.current && suggestions.length > 0) {
      return;
    }
    
    lastConversationRef.current = conversationHistory;
    
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    
    setIsLoading(true);
    
    const quickPrompt = `You are a ${professionConfig.name} coach. Based on this conversation:

${conversationHistory}

Case context: ${sessionContext}

Suggest the 3 most important questions to ask next. Return ONLY a JSON array:
[
  {"shortLabel": "2-3 word label", "fullText": "complete question to ask"},
  {"shortLabel": "2-3 word label", "fullText": "complete question to ask"},
  {"shortLabel": "2-3 word label", "fullText": "complete question to ask"}
]

Make questions specific and ready to send. No other text.`;

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
      // Silently fail for inline coach - it's supplementary
      console.log('Inline coach error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [conversationHistory, sessionContext, apiConfig, professionConfig, enabled, suggestions.length]);

  useEffect(() => {
    if (enabled && conversationHistory) {
      generateQuickSuggestions();
    }
    
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [conversationHistory, enabled, generateQuickSuggestions]);

  if (!enabled) return null;

  return (
    <div className="inline-coach">
      <div className="inline-coach-header">
        <span className="inline-coach-icon">🎓</span>
        <span className="inline-coach-label">Quick suggestions</span>
        {isLoading && <span className="inline-coach-loading">•••</span>}
      </div>
      <div className="inline-coach-chips">
        {suggestions.map((suggestion) => (
          <button
            key={suggestion.id}
            className="inline-coach-chip"
            onClick={() => onSuggestionClick(suggestion.fullText)}
            title={suggestion.fullText}
          >
            {suggestion.shortLabel}
          </button>
        ))}
        {suggestions.length === 0 && !isLoading && (
          <span className="inline-coach-empty">Analyzing conversation...</span>
        )}
      </div>
    </div>
  );
}