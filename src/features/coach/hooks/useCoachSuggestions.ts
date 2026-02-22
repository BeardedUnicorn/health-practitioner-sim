import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ApiConfig,
  CoachResponsePayload,
  CoachSuggestion,
  Message,
  Profession,
  SuggestionType,
} from '../../../types';
import { professionConfigs } from '../../../config/professionConfig';
import { requestCompletionText } from '../../../shared/llm/client';
import { parseJsonArray, parseJsonObject } from '../../../shared/llm/json-parser';

type Mode = 'panel' | 'inline';

type InlineCoachSuggestion = {
  shortLabel?: string;
  fullText?: string;
};

function getConversationFingerprint(messages: Message[]): string {
  if (messages.length === 0) {
    return '';
  }

  const nonSystemMessages = messages.filter((message) => message.role !== 'system');
  const lastMessage = nonSystemMessages[nonSystemMessages.length - 1];

  return `${nonSystemMessages.length}:${lastMessage?.role || ''}:${(lastMessage?.content || '').slice(0, 100)}`;
}

function createPanelPrompt(profession: Profession, conversationHistory: Message[]): string {
  const professionConfig = professionConfigs[profession];

  const conversationText = conversationHistory
    .filter((message) => message.role !== 'system')
    .map((message) =>
      `${message.role === 'user' ? professionConfig.userLabel : professionConfig.patientLabel}: ${message.content}`,
    )
    .join('\n');

  return `You are an expert ${professionConfig.name} educator providing real-time coaching to a trainee.

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
}

function createInlinePrompt(profession: Profession, conversationHistory: Message[]): string {
  const professionConfig = professionConfigs[profession];

  const conversationText = conversationHistory
    .filter((message) => message.role !== 'system')
    .slice(-6)
    .map((message) =>
      `${message.role === 'user' ? professionConfig.userLabel : professionConfig.patientLabel}: ${message.content}`,
    )
    .join('\n');

  return `You are a ${professionConfig.name} coach helping a trainee. You do NOT know the ${professionConfig.patientLabel.toLowerCase()}'s condition.

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
}

interface UseCoachSuggestionsParams {
  mode: Mode;
  enabled?: boolean;
  profession: Profession;
  conversationHistory: Message[];
  apiConfig: ApiConfig;
  onError?: (error: { title: string; message: string; details: string; isAuthError: boolean }) => void;
}

interface UseCoachSuggestionsResult {
  suggestions: CoachSuggestion[];
  summary: string;
  missingAreas: string[];
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useCoachSuggestions({
  mode,
  enabled = true,
  profession,
  conversationHistory,
  apiConfig,
  onError,
}: UseCoachSuggestionsParams): UseCoachSuggestionsResult {
  const [suggestions, setSuggestions] = useState<CoachSuggestion[]>([]);
  const [summary, setSummary] = useState('');
  const [missingAreas, setMissingAreas] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);

  const abortControllerRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef(0);
  const lastFingerprintRef = useRef('');

  const fingerprint = useMemo(
    () => getConversationFingerprint(conversationHistory),
    [conversationHistory],
  );

  const refresh = useCallback(() => {
    lastFingerprintRef.current = '';
    setRefreshToken((current) => current + 1);
  }, []);

  useEffect(() => {
    if (!enabled) {
      setSuggestions([]);
      setSummary('');
      setMissingAreas([]);
      setIsLoading(false);
      setError(null);
      lastFingerprintRef.current = '';
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      return;
    }

    if (!fingerprint || fingerprint === lastFingerprintRef.current) {
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;
    const requestId = ++requestIdRef.current;

    setIsLoading(true);
    setError(null);

    const prompt =
      mode === 'panel'
        ? createPanelPrompt(profession, conversationHistory)
        : createInlinePrompt(profession, conversationHistory);

    requestCompletionText(
      apiConfig,
      {
        model: apiConfig.modelName,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
      },
      controller.signal,
    )
      .then((content) => {
        if (requestId !== requestIdRef.current) {
          return;
        }

        if (mode === 'panel') {
          const parsed = parseJsonObject<CoachResponsePayload>(content);
          const nextSuggestions: CoachSuggestion[] = (parsed.suggestions ?? []).map((suggestion, index) => ({
            id: `suggestion-${Date.now()}-${index}`,
            text: suggestion.text,
            type: (suggestion.type ?? 'question') as SuggestionType,
            shortLabel: suggestion.shortLabel,
            fullText: suggestion.fullText,
          }));

          setSuggestions(nextSuggestions);
          setSummary(parsed.summary ?? '');
          setMissingAreas(parsed.missingAreas ?? []);
        } else {
          const parsed = parseJsonArray<InlineCoachSuggestion>(content);
          const nextSuggestions: CoachSuggestion[] = parsed.slice(0, 3).map((suggestion, index) => ({
            id: `quick-${Date.now()}-${index}`,
            text: suggestion.fullText ?? '',
            type: 'question',
            shortLabel: suggestion.shortLabel ?? '',
            fullText: suggestion.fullText ?? '',
          }));

          setSuggestions(nextSuggestions);
          setSummary('');
          setMissingAreas([]);
        }

        lastFingerprintRef.current = fingerprint;
        setError(null);
      })
      .catch((fetchError) => {
        if (fetchError instanceof Error && fetchError.name === 'AbortError') {
          return;
        }

        if (requestId === requestIdRef.current) {
          setError('Unable to generate coaching advice');
          
          if (onError) {
            const message = fetchError instanceof Error ? fetchError.message : String(fetchError);
            const isAuthError = message.includes('401') || message.includes('403') || message.toLowerCase().includes('unauthorized') || message.toLowerCase().includes('api key');

            onError({
              title: 'Coach failed',
              message: 'Unable to generate coaching advice.',
              details: `Error: ${message}\nModel: ${apiConfig.modelName}\nEndpoint: ${apiConfig.apiUrl}`,
              isAuthError,
            });
          }
        }
      })
      .finally(() => {
        if (requestId === requestIdRef.current) {
          setIsLoading(false);
        }
      });

    return () => {
      controller.abort();
    };
  }, [apiConfig, conversationHistory, enabled, fingerprint, mode, profession, refreshToken, onError]);

  return {
    suggestions,
    summary,
    missingAreas,
    isLoading,
    error,
    refresh,
  };
}
