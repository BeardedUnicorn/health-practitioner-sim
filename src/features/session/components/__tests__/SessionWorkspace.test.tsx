import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { professionConfigs } from '../../../../config/professionConfig';
import { SessionWorkspace } from '../SessionWorkspace';
import { SessionContextValue } from '../../state/session-context';

const mockUseSessionContext = vi.fn();

vi.mock('../../state/session-context', () => ({
  useSessionContext: () => mockUseSessionContext(),
}));

vi.mock('../../../coach/components/InlineCoach', () => ({
  InlineCoach: () => <div data-testid="inline-coach" />,
}));

vi.mock('../../../coach/components/CoachPanel', () => ({
  CoachPanel: () => <div data-testid="coach-panel" />,
}));

function createSessionContextValue(turnsExhausted: boolean): SessionContextValue {
  return {
    state: {
      session: {
        diagnosis: 'Condition A',
        conversationHistory: [
          { role: 'system', content: 'system' },
          { role: 'assistant', content: 'Hello there' },
        ],
        turnsUsed: 1,
        caseSetup: {
          profession: 'nurse',
          category: 'Cardiovascular',
          difficulty: 'beginner',
          setting: 'clinic',
          timePressureEnabled: turnsExhausted,
          maxTurns: turnsExhausted ? 1 : null,
          createdAt: Date.now(),
        },
      },
      currentMessage: '',
      isLoading: false,
      feedback: null,
      showAnswer: false,
      showToolkit: false,
      showCoach: false,
      inlineCoachEnabled: true,
      performingAssessment: false,
      isStreaming: false,
      streamingContent: '',
      showEvaluation: false,
      userFinalAnswer: '',
    },
    actions: {
      setCurrentMessage: vi.fn(),
      setShowAnswer: vi.fn(),
      setShowToolkit: vi.fn(),
      setShowCoach: vi.fn(),
      setInlineCoachEnabled: vi.fn(),
      setShowEvaluation: vi.fn(),
      applyCoachSuggestion: vi.fn(),
      startSessionWithSetup: vi.fn(async () => true),
      sendMessage: vi.fn(async () => undefined),
      performAssessment: vi.fn(async () => undefined),
      forceSubmit: vi.fn(),
      stopStreaming: vi.fn(),
      resetSessionState: vi.fn(),
      cancelLoading: vi.fn(),
      endSession: vi.fn(),
    },
    meta: {
      turnsExhausted,
    },
  };
}

describe('SessionWorkspace', () => {
  it('renders interactive composer when turns are available', () => {
    mockUseSessionContext.mockReturnValue(createSessionContextValue(false));

    render(
      <SessionWorkspace
        profession="nurse"
        professionConfig={professionConfigs.nurse}
        apiConfig={{ apiUrl: 'http://localhost:1234/v1', apiKey: '', modelName: 'model' }}
        coachWidth={350}
        onCoachWidthChange={vi.fn()}
        onNewSession={vi.fn()}
      />,
    );

    expect(screen.getByPlaceholderText('Ask the patient a question...')).toBeInTheDocument();
    expect(screen.getByTestId('inline-coach')).toBeInTheDocument();
  });

  it('renders summary composer when turns are exhausted', () => {
    mockUseSessionContext.mockReturnValue(createSessionContextValue(true));

    render(
      <SessionWorkspace
        profession="nurse"
        professionConfig={professionConfigs.nurse}
        apiConfig={{ apiUrl: 'http://localhost:1234/v1', apiKey: '', modelName: 'model' }}
        coachWidth={350}
        onCoachWidthChange={vi.fn()}
        onNewSession={vi.fn()}
      />,
    );

    expect(screen.getByText('⏱️ Time\'s up! Submit your session summary now.')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Submit your session summary...')).toBeInTheDocument();
  });
});
