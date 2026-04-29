import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { professionConfigs } from '../../config/professionConfig';
import { SessionStart } from '../SessionStart';
import { SettingsModal } from '../SettingsModal';
import { Toolkit } from '../Toolkit';
import { TurnCounter } from '../TurnCounter';
import { ErrorBanner } from '../ErrorBanner';
import { ProfessionSelect } from '../ProfessionSelect';
import { LoadingSession } from '../LoadingSession';

describe('basic components', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders and starts sessions from SessionStart', () => {
    const onStart = vi.fn();
    const { rerender } = render(
      <SessionStart professionConfig={professionConfigs.nurse} isLoading={false} onStart={onStart} />,
    );

    fireEvent.click(screen.getByRole('button', { name: /start new patient session/i }));
    expect(onStart).toHaveBeenCalledOnce();

    rerender(<SessionStart professionConfig={professionConfigs.nurse} isLoading onStart={onStart} />);
    expect(screen.getByRole('button', { name: /generating patient/i })).toBeDisabled();
  });

  it('edits, saves, cancels, and syncs SettingsModal drafts', () => {
    const onChange = vi.fn();
    const onClose = vi.fn();
    const config = {
      apiUrl: 'http://localhost:1234/v1',
      apiKey: '',
      modelName: 'model-a',
    };
    const { rerender, container } = render(<SettingsModal config={config} onChange={onChange} onClose={onClose} />);
    const [apiUrlInput, apiKeyInput, modelInput] = Array.from(container.querySelectorAll('input'));

    fireEvent.change(apiUrlInput, { target: { value: 'https://api.example.test/v1' } });
    fireEvent.change(apiKeyInput, { target: { value: 'secret' } });
    fireEvent.change(modelInput, { target: { value: 'model-b' } });
    fireEvent.click(screen.getByRole('button', { name: /save changes/i }));

    expect(onChange).toHaveBeenCalledWith({
      apiUrl: 'https://api.example.test/v1',
      apiKey: 'secret',
      modelName: 'model-b',
    });
    expect(onClose).toHaveBeenCalledOnce();

    rerender(
      <SettingsModal
        config={{ apiUrl: 'https://next.test/v1', apiKey: 'next-key', modelName: 'model-c' }}
        onChange={onChange}
        onClose={onClose}
      />,
    );
    expect(screen.getByDisplayValue('https://next.test/v1')).toBeInTheDocument();

    fireEvent.click(screen.getByText(/api settings/i));
    expect(onClose).toHaveBeenCalledOnce();
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onClose).toHaveBeenCalledTimes(2);

    rerender(<SettingsModal config={config} onChange={onChange} onClose={onClose} />);
    fireEvent.click(screen.getByRole('button', { name: '×' }));
    expect(onClose).toHaveBeenCalledTimes(3);
  });

  it('renders toolkit sections and disables assessments while loading', () => {
    const onAssessment = vi.fn();
    const sections = [
      {
        title: 'Vitals',
        items: [{ id: 'bp', label: 'Blood Pressure', emoji: 'BP', assessmentType: 'vitals', assessmentName: 'Blood Pressure' }],
      },
      {
        title: 'Comprehensive',
        items: [{ id: 'h2t', label: 'Head-to-Toe', emoji: 'H2T', assessmentType: 'full', assessmentName: 'Head-to-Toe' }],
      },
    ];
    const { rerender } = render(<Toolkit sections={sections} isLoading={false} onAssessment={onAssessment} />);

    fireEvent.click(screen.getByRole('button', { name: /blood pressure/i }));
    expect(onAssessment).toHaveBeenCalledWith('vitals', 'Blood Pressure');
    expect(screen.getByRole('button', { name: /head-to-toe/i })).toHaveClass('toolkit-btn-full');

    rerender(<Toolkit sections={sections} isLoading onAssessment={onAssessment} />);
    expect(screen.getByRole('button', { name: /blood pressure/i })).toBeDisabled();
  });

  it('shows TurnCounter colors, warnings, and force submit states', () => {
    const onForceSubmit = vi.fn();
    const { rerender } = render(<TurnCounter turnsUsed={4} maxTurns={10} onForceSubmit={onForceSubmit} />);
    expect(screen.getByText('6')).toHaveStyle({ color: 'var(--success)' });
    expect(screen.queryByText(/turns left/i)).not.toBeInTheDocument();

    rerender(<TurnCounter turnsUsed={5} maxTurns={10} onForceSubmit={onForceSubmit} />);
    expect(screen.getByText('5')).toHaveStyle({ color: 'var(--warning)' });

    rerender(<TurnCounter turnsUsed={9} maxTurns={10} onForceSubmit={onForceSubmit} />);
    expect(screen.getByText('1')).toHaveStyle({ color: 'var(--error)' });
    expect(screen.getByText('Last turn!')).toBeInTheDocument();

    rerender(<TurnCounter turnsUsed={8} maxTurns={10} onForceSubmit={onForceSubmit} />);
    expect(screen.getByText('2 turns left')).toBeInTheDocument();

    rerender(<TurnCounter turnsUsed={10} maxTurns={10} onForceSubmit={onForceSubmit} />);
    fireEvent.click(screen.getByRole('button', { name: /submit now/i }));
    expect(onForceSubmit).toHaveBeenCalledOnce();
  });

  it('toggles ErrorBanner details and dismisses', () => {
    const onDismiss = vi.fn();
    const { rerender } = render(
      <ErrorBanner error={{ title: 'Failed', message: 'Something happened', details: 'Stack trace' }} onDismiss={onDismiss} />,
    );

    fireEvent.click(screen.getByRole('button', { name: /details/i }));
    expect(screen.getByText('Stack trace')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /hide details/i }));
    expect(screen.queryByText('Stack trace')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /dismiss error/i }));
    expect(onDismiss).toHaveBeenCalledOnce();

    rerender(<ErrorBanner error={{ title: 'Failed', message: 'Something happened' }} onDismiss={onDismiss} />);
    expect(screen.queryByRole('button', { name: /details/i })).not.toBeInTheDocument();
  });

  it('selects professions and header actions in ProfessionSelect', () => {
    const onSelect = vi.fn();
    const onOpenSettings = vi.fn();
    const onOpenProgress = vi.fn();
    const { rerender } = render(
      <ProfessionSelect
        onSelect={onSelect}
        onOpenSettings={onOpenSettings}
        onOpenProgress={onOpenProgress}
        sessionCount={2}
      />,
    );

    fireEvent.click(screen.getByTitle('View Progress'));
    fireEvent.click(screen.getByTitle('Settings'));
    fireEvent.click(screen.getByRole('button', { name: /nurse/i }));
    expect(onOpenProgress).toHaveBeenCalledOnce();
    expect(onOpenSettings).toHaveBeenCalledOnce();
    expect(onSelect).toHaveBeenCalledWith('nurse');
    expect(screen.getByText('2')).toHaveClass('badge');

    rerender(
      <ProfessionSelect
        onSelect={onSelect}
        onOpenSettings={onOpenSettings}
        onOpenProgress={onOpenProgress}
        sessionCount={0}
      />,
    );
    expect(screen.queryByText('2')).not.toBeInTheDocument();
  });

  it('advances loading steps, rotates tips, and cancels', () => {
    const onCancel = vi.fn();
    render(<LoadingSession professionConfig={professionConfigs.nurse} onCancel={onCancel} />);

    expect(screen.getByText('Generating scenario')).toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(1500);
    });
    expect(screen.getByText('Parsing case details').closest('.loading-step')).toHaveClass('current');
    act(() => {
      vi.advanceTimersByTime(1500);
    });
    expect(screen.getByText('Preparing conversation').closest('.loading-step')).toHaveClass('current');
    act(() => {
      vi.advanceTimersByTime(1500);
    });
    expect(screen.getByText('Starting session').closest('.loading-step')).toHaveClass('current');
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(screen.getByText('Use the Assessment Toolkit to perform physical examinations.')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onCancel).toHaveBeenCalledOnce();

    const steps = screen.getAllByText(/Generating scenario|Parsing case details|Preparing conversation|Starting session/);
    expect(within(steps[0].closest('.loading-step') as HTMLElement).getByText('✓')).toBeInTheDocument();
  });
});
