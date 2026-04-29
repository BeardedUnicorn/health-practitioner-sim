import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { professionConfigs } from '../../config/professionConfig';
import { ProfessionConfig } from '../../types';
import { CaseSetupModal } from '../CaseSetupModal';

describe('CaseSetupModal', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-29T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('loads preferences, updates setup options, starts configured and random cases, and closes', () => {
    localStorage.setItem('healthcare-trainer-preferences', JSON.stringify({
      nurse: {
        lastCategory: professionConfigs.nurse.categories[1],
        lastDifficulty: 'advanced',
        lastSetting: 'emergency',
        lastTimePressure: true,
        lastMaxTurns: 20,
      },
    }));
    const onStart = vi.fn();
    const onStartRandom = vi.fn();
    const onClose = vi.fn();
    const { container } = render(
      <CaseSetupModal
        profession="nurse"
        professionConfig={professionConfigs.nurse}
        onStart={onStart}
        onStartRandom={onStartRandom}
        onClose={onClose}
      />,
    );

    const categorySelect = screen.getByRole('combobox') as HTMLSelectElement;
    expect(categorySelect.value).toBe(professionConfigs.nurse.categories[1]);
    fireEvent.change(categorySelect, { target: { value: professionConfigs.nurse.categories[2] } });
    fireEvent.click(screen.getByRole('button', { name: /intermediate/i }));
    fireEvent.click(screen.getByRole('button', { name: /telehealth/i }));
    fireEvent.click(screen.getByRole('button', { name: /^10$/ }));
    fireEvent.click(screen.getByRole('button', { name: /exam/i }));
    fireEvent.click(screen.getByRole('button', { name: /start with setup/i }));

    expect(onStart).toHaveBeenCalledWith({
      profession: 'nurse',
      category: professionConfigs.nurse.categories[2],
      difficulty: 'intermediate',
      setting: 'telehealth',
      timePressureEnabled: true,
      maxTurns: 10,
      mode: 'exam',
      createdAt: Date.now(),
    });

    fireEvent.click(screen.getByRole('button', { name: /start random/i }));
    expect(onStartRandom).toHaveBeenCalledOnce();

    fireEvent.click(screen.getByRole('button', { name: '×' }));
    expect(onClose).toHaveBeenCalledOnce();

    fireEvent.click(container.firstElementChild as HTMLElement);
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('falls back to the first category and handles disabled time pressure', () => {
    localStorage.setItem('healthcare-trainer-preferences', JSON.stringify({
      nurse: {
        lastCategory: 'Missing category',
        lastDifficulty: 'beginner',
        lastSetting: 'home',
        lastTimePressure: false,
      },
    }));
    const onStart = vi.fn();
    const onStartRandom = vi.fn();
    render(
      <CaseSetupModal
        profession="nurse"
        professionConfig={professionConfigs.nurse}
        onStart={onStart}
        onStartRandom={onStartRandom}
        onClose={vi.fn()}
      />,
    );

    expect((screen.getByRole('combobox') as HTMLSelectElement).value).toBe(professionConfigs.nurse.categories[0]);
    expect(screen.queryByText('Maximum turns:')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('checkbox'));
    expect(screen.getByText('Maximum turns:')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(screen.getByRole('button', { name: /guided/i }));
    fireEvent.click(screen.getByRole('button', { name: /start with setup/i }));
    expect(onStart.mock.calls[0][0]).toMatchObject({
      category: professionConfigs.nurse.categories[0],
      setting: 'clinic',
      timePressureEnabled: false,
      maxTurns: null,
    });

    fireEvent.click(screen.getByRole('button', { name: /start random/i }));
    expect(onStartRandom).toHaveBeenCalledOnce();
    expect(JSON.parse(localStorage.getItem('healthcare-trainer-preferences') || '{}').nurse.lastMaxTurns).toBeUndefined();
  });

  it('displays category names without parenthetical descriptions', () => {
    const customConfig: ProfessionConfig = {
      ...professionConfigs.nurse,
      categories: ['Plain Category', '(Already concise)'],
      supportedSettings: ['clinic'],
      defaultSetting: 'clinic',
    };

    render(
      <CaseSetupModal
        profession="nurse"
        professionConfig={customConfig}
        onStart={vi.fn()}
        onStartRandom={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByRole('option', { name: 'Plain Category' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: '(Already concise)' })).toBeInTheDocument();
  });
});
