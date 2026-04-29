import { fireEvent, render, screen } from '@testing-library/react';
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
  CoachPanel: ({ onClose }: { onClose: () => void }) => (
    <div data-testid="coach-panel">
      <button onClick={onClose}>close coach panel</button>
    </div>
  ),
}));

function createSessionContextValue(
  turnsExhausted: boolean,
  overrides: Partial<SessionContextValue['state']> = {},
): SessionContextValue {
  const actions = {
    setCurrentMessage: vi.fn(),
    setShowAnswer: vi.fn(),
    setShowToolkit: vi.fn(),
    setShowCoach: vi.fn(),
    setInlineCoachEnabled: vi.fn(),
    setShowEvaluation: vi.fn(),
    applyCoachSuggestion: vi.fn(),
    revealHint: vi.fn(),
    startSessionWithSetup: vi.fn(async () => true),
    sendMessage: vi.fn(async () => undefined),
    performAssessment: vi.fn(async () => undefined),
    forceSubmit: vi.fn(),
    stopStreaming: vi.fn(),
    resetSessionState: vi.fn(),
    cancelLoading: vi.fn(),
    endSession: vi.fn(),
  };

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
          mode: 'guided',
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
      ...overrides,
    },
    actions,
    meta: {
      turnsExhausted,
    },
  };
}

describe('SessionWorkspace', () => {
  it('renders nothing without a session', () => {
    mockUseSessionContext.mockReturnValue(createSessionContextValue(false, { session: null }));

    const { container } = render(
      <SessionWorkspace
        profession="nurse"
        professionConfig={professionConfigs.nurse}
        apiConfig={{ apiUrl: 'http://localhost:1234/v1', apiKey: '', modelName: 'model' }}
        coachWidth={350}
        onCoachWidthChange={vi.fn()}
        onNewSession={vi.fn()}
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('renders interactive composer when turns are available', () => {
    const context = createSessionContextValue(false);
    mockUseSessionContext.mockReturnValue(context);

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
    fireEvent.click(screen.getByTitle('Toggle Coach Panel'));
    fireEvent.click(screen.getByTitle('Disable Quick Suggestions'));
    expect(context.actions.setShowCoach).toHaveBeenCalledWith(true);
    expect(context.actions.setInlineCoachEnabled).toHaveBeenCalledWith(false);
  });

  it('renders summary composer when turns are exhausted', () => {
    const context = createSessionContextValue(true);
    mockUseSessionContext.mockReturnValue(context);

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
    fireEvent.click(screen.getByTitle('Toggle Coach Panel'));
    fireEvent.click(screen.getByTitle('Disable Quick Suggestions'));
    expect(context.actions.setShowCoach).toHaveBeenCalledWith(true);
    expect(context.actions.setInlineCoachEnabled).toHaveBeenCalledWith(false);
  });

  it('renders answer, toolkit, feedback, coach panel, and time pressure controls', () => {
    const context = createSessionContextValue(false, {
      showAnswer: true,
      showToolkit: true,
      showCoach: true,
      feedback: { correct: true, message: 'Correct feedback' },
      session: {
        diagnosis: 'Condition A',
        conversationHistory: [
          { role: 'system', content: 'system' },
          { role: 'assistant', content: 'Hello there' },
        ],
        turnsUsed: 2,
        mode: 'guided',
        hintsUsed: 0,
        caseSetup: {
          profession: 'nurse',
          category: 'Cardiovascular (example)',
          difficulty: 'advanced',
          setting: 'emergency',
          timePressureEnabled: true,
          maxTurns: 5,
          mode: 'guided',
          createdAt: Date.now(),
        },
      },
    });
    mockUseSessionContext.mockReturnValue(context);
    const onNewSession = vi.fn();
    const onCoachWidthChange = vi.fn();
    const { container } = render(
      <SessionWorkspace
        profession="nurse"
        professionConfig={professionConfigs.nurse}
        apiConfig={{ apiUrl: 'http://localhost:1234/v1', apiKey: '', modelName: 'model' }}
        coachWidth={350}
        onCoachWidthChange={onCoachWidthChange}
        onNewSession={onNewSession}
      />,
    );

    expect(screen.getByText(/Answer:/)).toBeInTheDocument();
    expect(screen.getByText('Condition A')).toBeInTheDocument();
    expect(screen.getByText(/Cardiovascular/)).toBeInTheDocument();
    expect(screen.getByText(/Advanced/)).toBeInTheDocument();
    expect(screen.getByText(/emergency/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '×' }));
    expect(context.actions.setShowToolkit).toHaveBeenCalledWith(false);
    fireEvent.click(screen.getByRole('button', { name: /blood pressure/i }));
    expect(context.actions.performAssessment).toHaveBeenCalledWith('vitals', 'Blood Pressure');
    fireEvent.click(screen.getByRole('button', { name: /new patient/i }));
    expect(onNewSession).toHaveBeenCalledOnce();
    expect(screen.getByTestId('coach-panel')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /close coach panel/i }));
    expect(context.actions.setShowCoach).toHaveBeenCalledWith(false);

    fireEvent.mouseDown(container.querySelector('.resize-handle') as HTMLElement, { clientX: 500 });
    fireEvent.mouseMove(document, { clientX: 450 });
    expect(onCoachWidthChange).toHaveBeenCalledWith(400);
    fireEvent.mouseUp(document);
  });

  it('renders exam hints and couples placeholder', () => {
    const context = createSessionContextValue(false, {
      showCoach: false,
      session: {
        diagnosis: 'Cycle',
        conversationHistory: [
          { role: 'system', content: 'system' },
          { role: 'assistant', content: '[Partner A - Alex]: Hi' },
        ],
        turnsUsed: 0,
        mode: 'exam',
        hintsUsed: 1,
        caseSetup: {
          profession: 'couplesTherapist',
          category: 'Conflict',
          difficulty: 'intermediate',
          setting: 'telehealth',
          timePressureEnabled: false,
          maxTurns: null,
          mode: 'exam',
          createdAt: Date.now(),
        },
      },
    });
    mockUseSessionContext.mockReturnValue(context);

    render(
      <SessionWorkspace
        profession="couplesTherapist"
        professionConfig={professionConfigs.couplesTherapist}
        apiConfig={{ apiUrl: 'http://localhost:1234/v1', apiKey: '', modelName: 'model' }}
        coachWidth={350}
        onCoachWidthChange={vi.fn()}
        onNewSession={vi.fn()}
      />,
    );

    expect(screen.getByPlaceholderText('Speak to the couple...')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /reveal hint/i }));
    expect(context.actions.revealHint).toHaveBeenCalledOnce();
    expect(screen.getByText(/Intermediate/)).toBeInTheDocument();
  });

  it('renders couples feedback labels and coach defaults', () => {
    const context = createSessionContextValue(false, {
      showCoach: true,
      feedback: { correct: false, message: 'Needs repair' },
      session: {
        diagnosis: 'Cycle',
        conversationHistory: [
          { role: 'system', content: 'system' },
          { role: 'assistant', content: '[Partner A - Alex]: Hi' },
        ],
        caseSetup: {
          profession: 'couplesTherapist',
          category: 'Conflict',
          difficulty: 'beginner',
          setting: 'clinic',
          timePressureEnabled: false,
          maxTurns: null,
          mode: 'guided',
          createdAt: Date.now(),
        },
      },
    });
    mockUseSessionContext.mockReturnValue(context);

    render(
      <SessionWorkspace
        profession="couplesTherapist"
        professionConfig={professionConfigs.couplesTherapist}
        apiConfig={{ apiUrl: 'http://localhost:1234/v1', apiKey: '', modelName: 'model' }}
        coachWidth={350}
        onCoachWidthChange={vi.fn()}
        onNewSession={vi.fn()}
      />,
    );

    expect(screen.getByText('Needs repair')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /new couple/i })).toBeInTheDocument();
    expect(screen.getByTestId('coach-panel')).toBeInTheDocument();
  });

  it('handles scrolling, streaming auto-scroll, and missing turn count fallbacks', () => {
    const scrollIntoView = vi.fn();
    Object.defineProperty(window.HTMLElement.prototype, 'scrollIntoView', {
      configurable: true,
      value: scrollIntoView,
    });
    const context = createSessionContextValue(false, {
      isStreaming: true,
      isLoading: true,
      streamingContent: 'Streaming reply',
      session: {
        diagnosis: 'Condition A',
        conversationHistory: [
          { role: 'system', content: 'system' },
          { role: 'assistant', content: 'Hello there' },
        ],
        mode: 'guided',
        caseSetup: {
          profession: 'nurse',
          category: 'Cardiovascular',
          difficulty: 'beginner',
          setting: 'clinic',
          timePressureEnabled: true,
          maxTurns: 5,
          mode: 'guided',
          createdAt: Date.now(),
        },
      },
    });
    mockUseSessionContext.mockReturnValue(context);

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

    const messages = document.querySelector('.messages') as HTMLElement;
    Object.defineProperties(messages, {
      scrollHeight: { configurable: true, value: 1000 },
      clientHeight: { configurable: true, value: 100 },
      scrollTop: { configurable: true, writable: true, value: 200 },
    });
    fireEvent.scroll(messages);
    messages.scrollTop = 100;
    fireEvent.scroll(messages);
    messages.scrollTop = 950;
    fireEvent.scroll(messages);

    expect(document.querySelector('.turns-remaining')).toHaveTextContent('5');
    expect(document.querySelector('.turns-total')).toHaveTextContent('5');
  });

  it('auto-scrolls during non-streaming loading', () => {
    const scrollIntoView = vi.fn();
    Object.defineProperty(window.HTMLElement.prototype, 'scrollIntoView', {
      configurable: true,
      value: scrollIntoView,
    });
    mockUseSessionContext.mockReturnValue(createSessionContextValue(false, {
      isLoading: true,
      isStreaming: false,
    }));

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

    expect(scrollIntoView).toHaveBeenCalled();
  });
});
