import { fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ProgressData, SessionRecord } from '../../types';
import { ProgressScreen } from '../ProgressScreen';

function record(overrides: Partial<SessionRecord>): SessionRecord {
  return {
    id: overrides.id ?? 'session',
    timestamp: overrides.timestamp ?? Date.now(),
    profession: overrides.profession ?? 'nurse',
    category: overrides.category ?? 'Cardiology (heart)',
    difficulty: overrides.difficulty ?? 'beginner',
    setting: overrides.setting ?? 'clinic',
    timePressureEnabled: overrides.timePressureEnabled,
    maxTurns: overrides.maxTurns,
    turnsUsed: overrides.turnsUsed,
    diagnosis: overrides.diagnosis ?? 'Condition A',
    userAnswer: overrides.userAnswer ?? 'Condition A',
    correct: overrides.correct ?? true,
    score: overrides.score ?? 90,
    summary: overrides.summary ?? 'Summary',
    strengths: overrides.strengths ?? [],
    gaps: overrides.gaps ?? [],
    safetyFlags: overrides.safetyFlags ?? [],
    mode: overrides.mode,
    hintsUsed: overrides.hintsUsed,
  };
}

const now = new Date('2026-04-29T12:00:00Z').getTime();
const progress: ProgressData = {
  lastUpdated: now,
  sessions: [
    record({ id: 'today', timestamp: now, profession: 'nurse', score: 95, correct: true }),
    record({
      id: 'yesterday',
      timestamp: new Date('2026-04-28T12:00:00Z').getTime(),
      profession: 'therapist',
      category: 'Anxiety',
      difficulty: 'advanced',
      setting: 'telehealth',
      score: 75,
      correct: false,
      diagnosis: 'Condition B',
      timePressureEnabled: true,
      turnsUsed: 3,
      maxTurns: 5,
    }),
    record({
      id: 'days',
      timestamp: new Date('2026-04-26T12:00:00Z').getTime(),
      profession: 'nurse',
      category: 'Respiratory',
      difficulty: 'intermediate',
      setting: 'emergency',
      score: 65,
      correct: true,
      diagnosis: 'Condition C',
    }),
    record({
      id: 'old',
      timestamp: new Date('2026-04-01T12:00:00Z').getTime(),
      profession: 'nurse',
      category: 'Random',
      score: 55,
      correct: false,
      diagnosis: 'Condition D',
    }),
  ],
};

describe('ProgressScreen', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(now);
    localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders empty progress and starts training', () => {
    const onBack = vi.fn();
    render(<ProgressScreen progress={{ sessions: [], lastUpdated: now }} onBack={onBack} onRefresh={vi.fn()} />);

    expect(screen.getByText('No sessions yet')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /clear data/i })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: /by profession/i }));
    expect(screen.getByText('No data yet')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /history/i }));
    expect(screen.getByText('Complete your first training session to see it here.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /overview/i }));
    fireEvent.click(screen.getByRole('button', { name: /start training/i }));
    expect(onBack).toHaveBeenCalledOnce();
  });

  it('renders overview stats and clears progress after confirmation', () => {
    const onBack = vi.fn();
    const onRefresh = vi.fn();
    render(<ProgressScreen progress={progress} onBack={onBack} onRefresh={onRefresh} />);

    expect(screen.getAllByText('4').length).toBeGreaterThan(0);
    expect(screen.getByText('50%')).toBeInTheDocument();
    expect(screen.getByText('73')).toBeInTheDocument();
    expect(screen.getByText('0h 40m')).toBeInTheDocument();
    expect(screen.getByText('Last 4 sessions')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /back/i }));
    expect(onBack).toHaveBeenCalledOnce();

    fireEvent.click(screen.getByRole('button', { name: /clear data/i }));
    expect(screen.getByText(/Clear All Progress\?/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '×' }));
    expect(screen.queryByText(/Clear All Progress\?/)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /clear data/i }));
    fireEvent.click(document.querySelector('.modal-overlay') as HTMLElement);
    expect(screen.queryByText(/Clear All Progress\?/)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /clear data/i }));
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(screen.queryByText(/Clear All Progress\?/)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /clear data/i }));
    fireEvent.click(screen.getByRole('button', { name: /clear all data/i }));
    expect(onRefresh).toHaveBeenCalledOnce();
  });

  it('renders profession stats including empty professions', () => {
    render(<ProgressScreen progress={progress} onBack={vi.fn()} onRefresh={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: /by profession/i }));
    expect(screen.getByText('Nurse')).toBeInTheDocument();
    expect(screen.getByText('Therapist')).toBeInTheDocument();
    expect(screen.getAllByText('No sessions yet').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Sessions')[0]).toBeInTheDocument();
  });

  it('filters history, resets filters, and shows date/grade variants', () => {
    render(<ProgressScreen progress={progress} onBack={vi.fn()} onRefresh={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: /history/i }));
    expect(screen.getByText(/Today at/)).toBeInTheDocument();
    expect(screen.getByText(/Yesterday at/)).toBeInTheDocument();
    expect(screen.getByText('3 days ago')).toBeInTheDocument();
    expect(screen.getByText(new Date('2026-04-01T12:00:00Z').toLocaleDateString())).toBeInTheDocument();
    expect(screen.getByText('A')).toBeInTheDocument();
    expect(screen.getByText('C')).toBeInTheDocument();
    expect(screen.getByText('D')).toBeInTheDocument();
    expect(screen.getByText('F')).toBeInTheDocument();

    const filters = screen.getByText('Profession').closest('.history-filters') as HTMLElement;
    fireEvent.change(within(filters).getAllByRole('combobox')[0], { target: { value: 'therapist' } });
    expect(screen.getByText('Showing 1 of 4 sessions')).toBeInTheDocument();
    expect(screen.getByText('Condition B')).toBeInTheDocument();

    fireEvent.change(within(filters).getAllByRole('combobox')[1], { target: { value: 'Anxiety' } });
    fireEvent.change(within(filters).getAllByRole('combobox')[2], { target: { value: 'advanced' } });
    fireEvent.change(within(filters).getAllByRole('combobox')[3], { target: { value: 'telehealth' } });
    expect(screen.getByText('Showing 1 of 4 sessions')).toBeInTheDocument();

    fireEvent.change(within(filters).getAllByRole('combobox')[3], { target: { value: 'clinic' } });
    expect(screen.getByText('No sessions found')).toBeInTheDocument();
    fireEvent.click(within(filters).getByRole('button', { name: /clear filters/i }));
    expect(screen.queryByText('Showing 1 of 4 sessions')).not.toBeInTheDocument();
  });

  it('falls back for unknown profession records', () => {
    render(
      <ProgressScreen
        progress={{
          sessions: [
            record({
              id: 'unknown',
              profession: 'unknown' as never,
              score: 88,
              correct: true,
            }),
          ],
          lastUpdated: now,
        }}
        onBack={vi.fn()}
        onRefresh={vi.fn()}
      />,
    );

    expect(document.querySelector('.chart-bar')).toHaveAttribute('title', '88% - unknown');
    fireEvent.click(screen.getByRole('button', { name: /history/i }));
    expect(screen.getByText('unknown')).toBeInTheDocument();
    expect(screen.getByText('🏥')).toBeInTheDocument();
  });
});
