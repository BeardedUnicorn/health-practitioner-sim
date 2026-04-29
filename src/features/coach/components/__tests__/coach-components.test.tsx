import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CoachSuggestion } from '../../../../types';
import { CoachPanel } from '../CoachPanel';
import { InlineCoach } from '../InlineCoach';

const selectSuggestion = vi.fn();
const refresh = vi.fn();
const mockUseCoachSuggestions = vi.fn();

vi.mock('../../state/coach-context', () => ({
  useCoachContext: () => ({
    actions: {
      selectSuggestion,
    },
  }),
}));

vi.mock('../../hooks/useCoachSuggestions', () => ({
  useCoachSuggestions: () => mockUseCoachSuggestions(),
}));

const apiConfig = {
  apiUrl: 'http://localhost:1234/v1',
  apiKey: '',
  modelName: 'model-a',
};

const conversationHistory = [{ role: 'assistant' as const, content: 'Hello' }];

const suggestions: CoachSuggestion[] = [
  { id: 'q', text: 'Question text', type: 'question', shortLabel: 'Question', fullText: 'Ask a question' },
  { id: 'a', text: 'Assessment text', type: 'assessment', shortLabel: 'Assess', fullText: 'Assess now' },
  { id: 'c', text: 'Consider text', type: 'consideration', shortLabel: 'Consider', fullText: 'Consider this' },
  { id: 'f', text: 'Followup text', type: 'followup', shortLabel: 'Follow', fullText: 'Follow up' },
];

function setCoachState(overrides: Partial<ReturnType<typeof baseCoachState>> = {}) {
  mockUseCoachSuggestions.mockReturnValue({
    ...baseCoachState(),
    ...overrides,
  });
}

function baseCoachState() {
  return {
    suggestions: [] as CoachSuggestion[],
    summary: '',
    missingAreas: [] as string[],
    isLoading: false,
    error: null as string | null,
    refresh,
  };
}

describe('coach components', () => {
  beforeEach(() => {
    selectSuggestion.mockClear();
    refresh.mockClear();
    mockUseCoachSuggestions.mockReset();
    setCoachState();
  });

  it('renders inline coach states and selects a suggestion', () => {
    const { rerender } = render(
      <InlineCoach
        profession="nurse"
        conversationHistory={conversationHistory}
        apiConfig={apiConfig}
        enabled={false}
        trainingMode="guided"
      />,
    );
    expect(screen.queryByText('Suggested questions')).not.toBeInTheDocument();

    setCoachState({ isLoading: true });
    rerender(
      <InlineCoach
        profession="nurse"
        conversationHistory={conversationHistory}
        apiConfig={apiConfig}
        enabled
        trainingMode="guided"
      />,
    );
    expect(screen.getByText('Analyzing conversation...')).toBeInTheDocument();
    expect(screen.getByText('updating')).toBeInTheDocument();

    setCoachState({ suggestions: [suggestions[0]], isLoading: false });
    rerender(
      <InlineCoach
        profession="nurse"
        conversationHistory={conversationHistory}
        apiConfig={apiConfig}
        enabled
        trainingMode="guided"
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Question' }));
    expect(selectSuggestion).toHaveBeenCalledWith('Ask a question');

    setCoachState({ suggestions: [] });
    rerender(
      <InlineCoach
        profession="nurse"
        conversationHistory={conversationHistory}
        apiConfig={apiConfig}
        enabled
        trainingMode="guided"
      />,
    );
    expect(screen.getByText('No suggestions yet')).toBeInTheDocument();
  });

  it('renders coach panel loading, error, empty, data, refresh, and exam hint states', () => {
    const onClose = vi.fn();
    const onRevealHint = vi.fn();
    setCoachState({ isLoading: true });
    const { rerender } = render(
      <CoachPanel
        profession="nurse"
        conversationHistory={conversationHistory}
        apiConfig={apiConfig}
        onClose={onClose}
        trainingMode="guided"
        hintsUsed={0}
        onRevealHint={onRevealHint}
      />,
    );
    expect(screen.getByText('Analyzing conversation...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /analyzing/i })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: '×' }));
    expect(onClose).toHaveBeenCalledOnce();

    setCoachState({ error: 'Unable to generate coaching advice' });
    rerender(
      <CoachPanel
        profession="nurse"
        conversationHistory={conversationHistory}
        apiConfig={apiConfig}
        onClose={onClose}
        trainingMode="guided"
        hintsUsed={0}
        onRevealHint={onRevealHint}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /retry/i }));
    expect(refresh).toHaveBeenCalledOnce();

    setCoachState({ suggestions, summary: 'Focus next.', missingAreas: ['History'], isLoading: true });
    rerender(
      <CoachPanel
        profession="nurse"
        conversationHistory={conversationHistory}
        apiConfig={apiConfig}
        onClose={onClose}
        trainingMode="guided"
        hintsUsed={0}
        onRevealHint={onRevealHint}
      />,
    );
    expect(screen.getByText('Updating suggestions...')).toBeInTheDocument();
    expect(screen.getByText('Focus next.')).toBeInTheDocument();
    expect(screen.getByText('History')).toBeInTheDocument();

    setCoachState({ suggestions, summary: 'Focus next.', missingAreas: ['History'], isLoading: false });
    rerender(
      <CoachPanel
        profession="nurse"
        conversationHistory={conversationHistory}
        apiConfig={apiConfig}
        onClose={onClose}
        trainingMode="guided"
        hintsUsed={0}
        onRevealHint={onRevealHint}
      />,
    );
    fireEvent.click(screen.getByTitle('Assess now'));
    expect(selectSuggestion).toHaveBeenCalledWith('Assess now');

    setCoachState();
    rerender(
      <CoachPanel
        profession="nurse"
        conversationHistory={conversationHistory}
        apiConfig={apiConfig}
        onClose={onClose}
        trainingMode="guided"
        hintsUsed={0}
        onRevealHint={onRevealHint}
      />,
    );
    expect(screen.getByText('Start the conversation to receive coaching guidance.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /refresh/i }));
    expect(refresh).toHaveBeenCalledTimes(2);

    rerender(
      <CoachPanel
        profession="nurse"
        conversationHistory={conversationHistory}
        apiConfig={apiConfig}
        onClose={onClose}
        trainingMode="exam"
        hintsUsed={2}
        onRevealHint={onRevealHint}
      />,
    );
    expect(screen.getByText('Click "Get Another Hint" to receive more suggestions.')).toBeInTheDocument();
    expect(screen.getByText('🎓 Coach (Hint 2)')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /get another hint/i }));
    expect(onRevealHint).toHaveBeenCalledOnce();
  });
});
