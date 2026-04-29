import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useCoachSuggestions } from '../useCoachSuggestions';

const requestCompletionTextMock = vi.hoisted(() => vi.fn());

vi.mock('../../../../shared/llm/client', () => ({
  requestCompletionText: requestCompletionTextMock,
}));

const apiConfig = {
  apiUrl: 'http://localhost:1234/v1',
  apiKey: '',
  modelName: 'model-a',
};

const userConversation = [
  { role: 'system' as const, content: 'system' },
  { role: 'assistant' as const, content: 'Hello' },
  { role: 'user' as const, content: 'I feel dizzy' },
];

const assistantConversation = [{ role: 'assistant' as const, content: 'Hello' }];
const systemOnlyConversation = [{ role: 'system' as const, content: 'system only' }];

function last<T>(items: T[]): T | undefined {
  return items[items.length - 1];
}

describe('useCoachSuggestions', () => {
  beforeEach(() => {
    requestCompletionTextMock.mockReset();
    requestCompletionTextMock.mockResolvedValue(JSON.stringify({
      suggestions: [],
      summary: 'Default',
      missingAreas: [],
    }));
    vi.spyOn(Date, 'now').mockReturnValue(1777478400000);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('does not run while disabled and clears existing state while aborting in-flight work', async () => {
    let capturedSignal: AbortSignal | undefined;
    requestCompletionTextMock.mockImplementationOnce((_api, _request, signal) => {
      capturedSignal = signal;
      return new Promise(() => undefined);
    });

    const { rerender } = renderHook((enabled: boolean) => useCoachSuggestions({
      mode: 'panel',
      enabled,
      trainingMode: 'guided',
      profession: 'nurse',
      conversationHistory: userConversation,
      apiConfig,
    }), {
      initialProps: true,
    });

    expect(requestCompletionTextMock).toHaveBeenCalledOnce();

    rerender(false);
    expect(capturedSignal?.aborted).toBe(true);
  });

  it('loads panel suggestions for guided user turns', async () => {
    requestCompletionTextMock.mockResolvedValueOnce(JSON.stringify({
      suggestions: [
        {
          text: 'Ask about onset',
          type: 'followup',
          shortLabel: 'Onset',
          fullText: 'When did this start?',
        },
      ],
      summary: 'Clarify symptom timing.',
      missingAreas: ['Onset'],
    }));

    const { result } = renderHook(() => useCoachSuggestions({
      mode: 'panel',
      enabled: true,
      trainingMode: 'guided',
      profession: 'nurse',
      conversationHistory: userConversation,
      apiConfig,
    }));

    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.suggestions).toHaveLength(1));
    expect(result.current.suggestions[0]).toEqual({
      id: `suggestion-${Date.now()}-0`,
      text: 'Ask about onset',
      type: 'followup',
      shortLabel: 'Onset',
      fullText: 'When did this start?',
    });
    expect(result.current.summary).toBe('Clarify symptom timing.');
    expect(result.current.missingAreas).toEqual(['Onset']);
    expect(result.current.error).toBeNull();
    expect(requestCompletionTextMock.mock.calls[0][1].messages[0].content).toContain('Nurse educator');
  });

  it('does not request suggestions for an empty conversation without a manual refresh', () => {
    renderHook(() => useCoachSuggestions({
      mode: 'panel',
      enabled: true,
      trainingMode: 'guided',
      profession: 'nurse',
      conversationHistory: [],
      apiConfig,
    }));

    expect(requestCompletionTextMock).not.toHaveBeenCalled();
  });

  it('loads inline suggestions and limits them to three', async () => {
    requestCompletionTextMock.mockResolvedValue(JSON.stringify([
      { shortLabel: 'Onset', fullText: 'When did this start?' },
      { shortLabel: 'Severity', fullText: 'How severe is it?' },
      { shortLabel: 'Triggers', fullText: 'What makes it worse?' },
      { shortLabel: 'Extra', fullText: 'Extra question?' },
    ]));

    const { result } = renderHook(() => useCoachSuggestions({
      mode: 'inline',
      enabled: true,
      trainingMode: 'guided',
      profession: 'nurse',
      conversationHistory: userConversation,
      apiConfig,
    }));

    await waitFor(() => expect(result.current.suggestions).toHaveLength(3));
    expect(result.current.suggestions.map((suggestion) => suggestion.id)).toEqual([
      `quick-${Date.now()}-0`,
      `quick-${Date.now()}-1`,
      `quick-${Date.now()}-2`,
    ]);
    expect(result.current.summary).toBe('');
    expect(result.current.missingAreas).toEqual([]);
    expect(requestCompletionTextMock.mock.calls[0][1].messages[0].content).toContain('Suggest 3 good questions');
  });

  it('supports manual refresh and hint-triggered requests', async () => {
    requestCompletionTextMock
      .mockResolvedValueOnce(JSON.stringify({ suggestions: [], summary: 'Manual', missingAreas: [] }))
      .mockResolvedValueOnce(JSON.stringify({ suggestions: [], summary: 'Hint', missingAreas: [] }));

    const { result, rerender } = renderHook((props: { hintsUsed?: number; trainingMode: 'guided' | 'exam' }) => useCoachSuggestions({
      mode: 'panel',
      enabled: true,
      trainingMode: props.trainingMode,
      hintsUsed: props.hintsUsed,
      profession: 'nurse',
      conversationHistory: assistantConversation,
      apiConfig,
    }), {
      initialProps: { trainingMode: 'guided' } as { hintsUsed?: number; trainingMode: 'guided' | 'exam' },
    });

    expect(requestCompletionTextMock).not.toHaveBeenCalled();
    act(() => result.current.refresh());
    await waitFor(() => expect(result.current.summary).toBe('Manual'));

    rerender({ trainingMode: 'exam', hintsUsed: 1 });
    await waitFor(() => expect(result.current.summary).toBe('Hint'));
  });

  it('handles empty conversation prompts and sparse response payloads', async () => {
    requestCompletionTextMock
      .mockResolvedValueOnce(JSON.stringify({
        suggestions: [{ text: 'Ask broadly', shortLabel: 'Broad', fullText: 'What else is going on?' }],
      }))
      .mockResolvedValueOnce(JSON.stringify({}))
      .mockResolvedValueOnce(JSON.stringify([
        {},
        { shortLabel: 'Pain' },
        { fullText: 'Where is the pain?' },
      ]));

    const panel = renderHook(() => useCoachSuggestions({
      mode: 'panel',
      enabled: true,
      trainingMode: 'exam',
      profession: 'nurse',
      conversationHistory: systemOnlyConversation,
      apiConfig,
    }));

    act(() => panel.result.current.refresh());
    await waitFor(() => expect(panel.result.current.suggestions).toHaveLength(1));
    expect(panel.result.current.suggestions[0]).toMatchObject({
      text: 'Ask broadly',
      type: 'question',
      shortLabel: 'Broad',
      fullText: 'What else is going on?',
    });
    expect(panel.result.current.summary).toBe('');
    expect(panel.result.current.missingAreas).toEqual([]);
    expect(last(requestCompletionTextMock.mock.calls)?.[1].messages[0].content).toContain('Conversation just started');

    act(() => panel.result.current.refresh());
    await waitFor(() => expect(panel.result.current.suggestions).toEqual([]));

    const inline = renderHook(() => useCoachSuggestions({
      mode: 'inline',
      enabled: true,
      trainingMode: 'exam',
      profession: 'nurse',
      conversationHistory: systemOnlyConversation,
      apiConfig,
    }));

    act(() => inline.result.current.refresh());
    await waitFor(() => expect(inline.result.current.suggestions).toHaveLength(3));
    expect(inline.result.current.suggestions[0]).toMatchObject({ text: '', shortLabel: '', fullText: '' });
    expect(inline.result.current.suggestions[1]).toMatchObject({ text: '', shortLabel: 'Pain', fullText: '' });
    expect(inline.result.current.suggestions[2]).toMatchObject({ text: 'Where is the pain?', shortLabel: '', fullText: 'Where is the pain?' });
    expect(last(requestCompletionTextMock.mock.calls)?.[1].messages[0].content).toContain('(Just started)');
  });

  it('reports errors and ignores stale responses', async () => {
    let resolveFirst: (value: string) => void = () => undefined;
    const firstHistory = [
      { role: 'assistant' as const, content: 'Hello' },
      { role: 'user' as const, content: 'First' },
    ];
    const secondHistory = [
      { role: 'assistant' as const, content: 'Hello' },
      { role: 'user' as const, content: 'Second' },
    ];
    requestCompletionTextMock
      .mockImplementationOnce(() => new Promise<string>((resolve) => {
        resolveFirst = resolve;
      }))
      .mockResolvedValueOnce('not json');

    const { result, rerender } = renderHook((conversationHistory: typeof firstHistory) => useCoachSuggestions({
      mode: 'panel',
      enabled: true,
      trainingMode: 'guided',
      profession: 'nurse',
      conversationHistory,
      apiConfig,
    }), {
      initialProps: firstHistory,
    });

    rerender(secondHistory);
    await waitFor(() => expect(result.current.error).toBe('Unable to generate coaching advice'));

    act(() => resolveFirst(JSON.stringify({ suggestions: [], summary: 'Stale', missingAreas: [] })));
    await Promise.resolve();
    expect(result.current.summary).not.toBe('Stale');
  });

  it('ignores abort errors', async () => {
    const abortError = new Error('aborted');
    abortError.name = 'AbortError';
    requestCompletionTextMock.mockRejectedValueOnce(abortError);

    const { result } = renderHook(() => useCoachSuggestions({
      mode: 'panel',
      enabled: true,
      trainingMode: 'guided',
      profession: 'nurse',
      conversationHistory: userConversation,
      apiConfig,
    }));

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.error).toBeNull();
  });
});
