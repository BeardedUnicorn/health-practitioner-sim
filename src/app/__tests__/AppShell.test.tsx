import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { professionConfigs } from '../../config/professionConfig';
import { PatientSession, Profession, ProfessionConfig } from '../../types';
import { AppShell } from '../AppShell';

const state = vi.hoisted(() => ({
  appContext: {
    state: {
      screen: 'profession-select',
      profession: null as Profession | null,
      showSettings: false,
      apiConfig: {
        apiUrl: 'http://localhost:1234/v1',
        apiKey: '',
        modelName: 'model-a',
      },
      progress: {
        sessions: [],
        lastUpdated: 1,
      },
      coachWidth: 350,
    },
    actions: {
      setScreen: vi.fn(),
      selectProfession: vi.fn(),
      resetProfession: vi.fn(),
      openSettings: vi.fn(),
      closeSettings: vi.fn(),
      setApiConfig: vi.fn(),
      refreshProgress: vi.fn(),
      setCoachWidth: vi.fn(),
    },
    meta: {
      professionConfig: null as ProfessionConfig | null,
    },
  },
  sessionContext: {
    state: {
      session: null as PatientSession | null,
      currentMessage: '',
      isLoading: false,
      feedback: null as { correct: boolean; message: string } | null,
      showAnswer: false,
      showToolkit: false,
      showCoach: false,
      inlineCoachEnabled: false,
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
      revealHint: vi.fn(),
      startSessionWithSetup: vi.fn(async () => true),
      sendMessage: vi.fn(async () => undefined),
      performAssessment: vi.fn(async () => undefined),
      forceSubmit: vi.fn(),
      stopStreaming: vi.fn(),
      resetSessionState: vi.fn(),
      cancelLoading: vi.fn(),
      endSession: vi.fn(),
    },
  },
}));

vi.mock('../state/app-context', () => ({
  useAppContext: () => state.appContext,
}));

vi.mock('../../features/session/state/session-context', () => ({
  useSessionContext: () => state.sessionContext,
}));

vi.mock('../../components/SettingsModal', () => ({
  SettingsModal: ({ onChange, onClose }: { onChange: (value: unknown) => void; onClose: () => void }) => (
    <div data-testid="settings-modal">
      <button onClick={() => onChange({ modelName: 'model-b' })}>change settings</button>
      <button onClick={onClose}>close settings modal</button>
    </div>
  ),
}));

vi.mock('../../components/SessionEvaluation', () => ({
  SessionEvaluation: ({
    onNewSession,
    onClose,
    onProgressSaved,
  }: {
    onNewSession: () => void;
    onClose: () => void;
    onProgressSaved?: () => void;
  }) => (
    <div data-testid="evaluation">
      <button onClick={onNewSession}>new evaluation session</button>
      <button onClick={onClose}>close evaluation</button>
      <button onClick={onProgressSaved}>progress saved</button>
    </div>
  ),
}));

vi.mock('../../components/ProgressScreen', () => ({
  ProgressScreen: ({ onBack, onRefresh }: { onBack: () => void; onRefresh: () => void }) => (
    <div data-testid="progress-screen">
      <button onClick={onBack}>back progress</button>
      <button onClick={onRefresh}>refresh progress</button>
    </div>
  ),
}));

vi.mock('../../components/ProfessionSelect', () => ({
  ProfessionSelect: ({
    onSelect,
    onOpenSettings,
    onOpenProgress,
  }: {
    onSelect: (profession: string) => void;
    onOpenSettings: () => void;
    onOpenProgress: () => void;
  }) => (
    <div data-testid="profession-select">
      <button onClick={() => onSelect('nurse')}>select profession</button>
      <button onClick={onOpenSettings}>profession settings</button>
      <button onClick={onOpenProgress}>profession progress</button>
    </div>
  ),
}));

vi.mock('../../components/SessionStart', () => ({
  SessionStart: ({ onStart }: { onStart: () => void }) => <button onClick={onStart}>start session</button>,
}));

vi.mock('../../components/CaseSetupModal', () => ({
  CaseSetupModal: ({
    onStart,
    onStartRandom,
    onClose,
  }: {
    onStart: (setup: unknown) => void;
    onStartRandom: () => void;
    onClose: () => void;
  }) => (
    <div data-testid="case-setup">
      <button onClick={() => onStart({
        profession: 'nurse',
        category: 'Cardiology',
        difficulty: 'beginner',
        setting: 'clinic',
        timePressureEnabled: false,
        maxTurns: null,
        mode: 'guided',
        createdAt: 1,
      })}
      >
        start setup
      </button>
      <button onClick={onStartRandom}>start random</button>
      <button onClick={onClose}>close setup</button>
    </div>
  ),
}));

vi.mock('../../components/LoadingSession', () => ({
  LoadingSession: ({ onCancel }: { onCancel: () => void }) => <button onClick={onCancel}>cancel loading</button>,
}));

vi.mock('../../features/session/components/SessionToolbar', () => ({
  SessionToolbar: ({
    onNewSession,
    onToggleToolkit,
    onToggleAnswer,
    onShowEvaluation,
    onOpenSettings,
    onEndSession,
  }: {
    onNewSession: () => void;
    onToggleToolkit: () => void;
    onToggleAnswer: () => void;
    onShowEvaluation: () => void;
    onOpenSettings: () => void;
    onEndSession: () => void;
  }) => (
    <div data-testid="toolbar">
      <button onClick={onNewSession}>toolbar new</button>
      <button onClick={onToggleToolkit}>toolbar toolkit</button>
      <button onClick={onToggleAnswer}>toolbar answer</button>
      <button onClick={onShowEvaluation}>toolbar evaluation</button>
      <button onClick={onOpenSettings}>toolbar settings</button>
      <button onClick={onEndSession}>toolbar end</button>
    </div>
  ),
}));

vi.mock('../../features/session/components/SessionWorkspace', () => ({
  SessionWorkspace: ({
    onCoachWidthChange,
    onNewSession,
  }: {
    onCoachWidthChange: (width: number) => void;
    onNewSession: () => void;
  }) => (
    <div data-testid="workspace">
      <button onClick={() => onCoachWidthChange(480)}>workspace width</button>
      <button onClick={onNewSession}>workspace new</button>
    </div>
  ),
}));

vi.mock('../../features/coach/state/coach-context', () => ({
  CoachProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="coach-provider">{children}</div>,
}));

const session: PatientSession = {
  diagnosis: 'Condition A',
  conversationHistory: [{ role: 'system' as const, content: 'system' }],
  turnsUsed: 0,
  mode: 'guided' as const,
};

function resetContext() {
  state.appContext.state = {
    screen: 'profession-select',
    profession: null as Profession | null,
    showSettings: false,
    apiConfig: {
      apiUrl: 'http://localhost:1234/v1',
      apiKey: '',
      modelName: 'model-a',
    },
    progress: {
      sessions: [],
      lastUpdated: 1,
    },
    coachWidth: 350,
  };
  state.appContext.meta = {
    professionConfig: null as ProfessionConfig | null,
  };
  state.sessionContext.state = {
    session: null as PatientSession | null,
    currentMessage: '',
    isLoading: false,
    feedback: null as { correct: boolean; message: string } | null,
    showAnswer: false,
    showToolkit: false,
    showCoach: false,
    inlineCoachEnabled: false,
    performingAssessment: false,
    isStreaming: false,
    streamingContent: '',
    showEvaluation: false,
    userFinalAnswer: '',
  };
  Object.values(state.appContext.actions).forEach((fn) => fn.mockClear());
  Object.values(state.sessionContext.actions).forEach((fn) => fn.mockClear());
}

describe('AppShell', () => {
  beforeEach(() => {
    resetContext();
    vi.spyOn(Math, 'random').mockReturnValue(0);
    vi.setSystemTime(new Date('2026-04-29T12:00:00Z'));
  });

  it('renders profession select and handles its actions', () => {
    render(<AppShell />);

    fireEvent.click(screen.getByRole('button', { name: 'select profession' }));
    expect(state.sessionContext.actions.resetSessionState).toHaveBeenCalledOnce();
    expect(state.appContext.actions.selectProfession).toHaveBeenCalledWith('nurse');

    fireEvent.click(screen.getByRole('button', { name: 'profession settings' }));
    expect(state.appContext.actions.openSettings).toHaveBeenCalledOnce();

    fireEvent.click(screen.getByRole('button', { name: 'profession progress' }));
    expect(state.appContext.actions.setScreen).toHaveBeenCalledWith('progress');
  });

  it('renders settings and evaluation overlays', () => {
    state.appContext.state.showSettings = true;
    state.appContext.meta.professionConfig = professionConfigs.nurse;
    state.sessionContext.state.showEvaluation = true;
    state.sessionContext.state.session = session;
    state.sessionContext.state.feedback = { correct: true, message: 'Correct' };
    const { rerender } = render(<AppShell />);

    fireEvent.click(screen.getByRole('button', { name: 'change settings' }));
    expect(state.appContext.actions.setApiConfig).toHaveBeenCalledWith({ modelName: 'model-b' });
    fireEvent.click(screen.getByRole('button', { name: 'close settings modal' }));
    expect(state.appContext.actions.closeSettings).toHaveBeenCalledOnce();

    fireEvent.click(screen.getByRole('button', { name: 'new evaluation session' }));
    expect(state.sessionContext.actions.setShowEvaluation).toHaveBeenCalledWith(false);
    expect(state.appContext.actions.setScreen).toHaveBeenCalledWith('case-setup');
    fireEvent.click(screen.getByRole('button', { name: 'close evaluation' }));
    expect(state.sessionContext.actions.setShowEvaluation).toHaveBeenCalledWith(false);
    fireEvent.click(screen.getByRole('button', { name: 'progress saved' }));
    expect(state.appContext.actions.refreshProgress).toHaveBeenCalledOnce();

    resetContext();
    state.appContext.meta.professionConfig = professionConfigs.nurse;
    state.sessionContext.state.showEvaluation = true;
    state.sessionContext.state.session = session;
    rerender(<AppShell />);
    expect(screen.getByTestId('evaluation')).toBeInTheDocument();
  });

  it('handles progress back branches', () => {
    state.appContext.state.screen = 'progress';
    const { rerender } = render(<AppShell />);
    fireEvent.click(screen.getByRole('button', { name: 'back progress' }));
    expect(state.appContext.actions.setScreen).toHaveBeenCalledWith('profession-select');

    resetContext();
    state.appContext.state.screen = 'progress';
    state.appContext.state.profession = 'nurse';
    state.appContext.meta.professionConfig = professionConfigs.nurse;
    rerender(<AppShell />);
    fireEvent.click(screen.getByRole('button', { name: 'back progress' }));
    expect(state.appContext.actions.setScreen).toHaveBeenCalledWith('ready');

    resetContext();
    state.appContext.state.screen = 'progress';
    state.appContext.state.profession = 'nurse';
    state.appContext.meta.professionConfig = professionConfigs.nurse;
    state.sessionContext.state.session = session;
    rerender(<AppShell />);
    fireEvent.click(screen.getByRole('button', { name: 'back progress' }));
    expect(state.appContext.actions.setScreen).toHaveBeenCalledWith('session');
  });

  it('handles ready, case setup, and loading flows', async () => {
    state.appContext.state.screen = 'ready';
    state.appContext.state.profession = 'nurse';
    state.appContext.meta.professionConfig = professionConfigs.nurse;
    const { rerender } = render(<AppShell />);

    fireEvent.click(screen.getByRole('button', { name: 'start session' }));
    expect(state.appContext.actions.setScreen).toHaveBeenCalledWith('case-setup');
    fireEvent.click(screen.getByRole('button', { name: /change profession/i }));
    expect(state.sessionContext.actions.resetSessionState).toHaveBeenCalledOnce();
    expect(state.appContext.actions.resetProfession).toHaveBeenCalledOnce();

    state.appContext.state.screen = 'case-setup';
    rerender(<AppShell />);
    fireEvent.click(screen.getByRole('button', { name: 'close setup' }));
    expect(state.appContext.actions.setScreen).toHaveBeenCalledWith('ready');

    fireEvent.click(screen.getByRole('button', { name: 'start setup' }));
    await waitFor(() => expect(state.sessionContext.actions.startSessionWithSetup).toHaveBeenCalled());
    expect(state.appContext.actions.setScreen).toHaveBeenCalledWith('loading-session');
    expect(state.appContext.actions.setScreen).toHaveBeenCalledWith('session');

    fireEvent.click(screen.getByRole('button', { name: 'start random' }));
    await waitFor(() => expect(state.sessionContext.actions.startSessionWithSetup).toHaveBeenCalledTimes(2));

    state.appContext.state.screen = 'loading-session';
    rerender(<AppShell />);
    fireEvent.click(screen.getByRole('button', { name: 'cancel loading' }));
    expect(state.sessionContext.actions.cancelLoading).toHaveBeenCalledOnce();
    expect(state.appContext.actions.setScreen).toHaveBeenCalledWith('ready');
  });

  it('handles failed setup without profession and session toolbar/workspace actions', async () => {
    state.sessionContext.actions.startSessionWithSetup.mockResolvedValueOnce(false);
    state.appContext.state.screen = 'case-setup';
    state.appContext.state.profession = 'nurse';
    state.appContext.meta.professionConfig = professionConfigs.nurse;
    const { rerender } = render(<AppShell />);
    fireEvent.click(screen.getByRole('button', { name: 'start setup' }));
    await waitFor(() => expect(state.appContext.actions.setScreen).toHaveBeenCalledWith('ready'));

    resetContext();
    state.sessionContext.actions.startSessionWithSetup.mockResolvedValueOnce(false);
    state.appContext.state.screen = 'case-setup';
    state.appContext.meta.professionConfig = professionConfigs.nurse;
    rerender(<AppShell />);
    expect(screen.queryByTestId('case-setup')).not.toBeInTheDocument();

    resetContext();
    state.appContext.state.screen = 'session';
    state.appContext.state.profession = 'nurse';
    state.appContext.meta.professionConfig = professionConfigs.nurse;
    state.sessionContext.state.session = session;
    rerender(<AppShell />);
    fireEvent.click(screen.getByRole('button', { name: 'toolbar new' }));
    fireEvent.click(screen.getByRole('button', { name: 'toolbar toolkit' }));
    fireEvent.click(screen.getByRole('button', { name: 'toolbar answer' }));
    fireEvent.click(screen.getByRole('button', { name: 'toolbar evaluation' }));
    fireEvent.click(screen.getByRole('button', { name: 'toolbar settings' }));
    fireEvent.click(screen.getByRole('button', { name: 'toolbar end' }));
    fireEvent.click(screen.getByRole('button', { name: 'workspace width' }));
    fireEvent.click(screen.getByRole('button', { name: 'workspace new' }));

    expect(state.appContext.actions.setScreen).toHaveBeenCalledWith('case-setup');
    expect(state.sessionContext.actions.setShowToolkit).toHaveBeenCalledWith(true);
    expect(state.sessionContext.actions.setShowAnswer).toHaveBeenCalledWith(true);
    expect(state.sessionContext.actions.setShowEvaluation).toHaveBeenCalledWith(true);
    expect(state.appContext.actions.openSettings).toHaveBeenCalledOnce();
    expect(state.sessionContext.actions.endSession).toHaveBeenCalledOnce();
    expect(state.appContext.actions.setScreen).toHaveBeenCalledWith('ready');
    expect(state.appContext.actions.setCoachWidth).toHaveBeenCalledWith(480);
  });
});
