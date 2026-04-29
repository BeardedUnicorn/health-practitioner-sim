import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SessionRecord } from '../../types';
import {
  addSessionRecord,
  clearProgress,
  filterSessions,
  getOverallStats,
  getProfessionPreferences,
  getProfessionStats,
  getStreakInfo,
  getUniqueCategories,
  loadPreferences,
  loadProgress,
  savePreferences,
  saveProfessionPreferences,
  saveProgress,
} from '../progressStorage';

function createRecord(overrides: Partial<SessionRecord> = {}): SessionRecord {
  return {
    id: overrides.id ?? 'session-1',
    timestamp: overrides.timestamp ?? new Date('2026-04-29T12:00:00Z').getTime(),
    profession: overrides.profession ?? 'nurse',
    category: overrides.category ?? 'Cardiology',
    difficulty: overrides.difficulty ?? 'beginner',
    setting: overrides.setting ?? 'clinic',
    timePressureEnabled: overrides.timePressureEnabled,
    maxTurns: overrides.maxTurns,
    turnsUsed: overrides.turnsUsed,
    diagnosis: overrides.diagnosis ?? 'Condition A',
    userAnswer: overrides.userAnswer ?? 'Condition A',
    correct: overrides.correct ?? true,
    score: overrides.score ?? 80,
    summary: overrides.summary ?? 'Good session',
    strengths: overrides.strengths ?? [],
    gaps: overrides.gaps ?? [],
    safetyFlags: overrides.safetyFlags ?? [],
    mode: overrides.mode,
    hintsUsed: overrides.hintsUsed,
  };
}

describe('progressStorage', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-29T12:00:00Z'));
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
    localStorage.clear();
  });

  it('loads and saves progress, including fallback paths', () => {
    expect(loadProgress()).toEqual({ sessions: [], lastUpdated: Date.now() });

    const progress = { sessions: [createRecord()], lastUpdated: 1 };
    saveProgress(progress);
    expect(progress.lastUpdated).toBe(Date.now());
    expect(loadProgress()).toEqual(progress);

    localStorage.setItem('healthcare-trainer-progress', '{bad json');
    expect(loadProgress()).toEqual({ sessions: [], lastUpdated: Date.now() });
    expect(console.error).toHaveBeenCalledWith('Failed to load progress:', expect.any(SyntaxError));

    vi.spyOn(Storage.prototype, 'setItem').mockImplementationOnce(() => {
      throw new Error('write failed');
    });
    saveProgress({ sessions: [], lastUpdated: 1 });
    expect(console.error).toHaveBeenCalledWith('Failed to save progress:', expect.any(Error));
  });

  it('adds session records, trims history, and clears stored progress', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    saveProgress({
      sessions: Array.from({ length: 100 }, (_, index) => createRecord({ id: `old-${index}` })),
      lastUpdated: 1,
    });

    const record = addSessionRecord({
      profession: 'nurse',
      category: 'Respiratory',
      diagnosis: 'Condition B',
      userAnswer: 'Condition B',
      correct: true,
      score: 91,
      summary: 'Strong',
      strengths: ['rapport'],
      gaps: ['none'],
      safetyFlags: [],
    });

    expect(record.id).toContain(Date.now().toString(36));
    expect(record.timestamp).toBe(Date.now());
    const stored = loadProgress();
    expect(stored.sessions).toHaveLength(100);
    expect(stored.sessions[0]).toEqual(record);

    clearProgress();
    expect(localStorage.getItem('healthcare-trainer-progress')).toBeNull();
  });

  it('computes overall, profession, and streak statistics', () => {
    const today = new Date('2026-04-29T10:00:00Z').getTime();
    const yesterday = new Date('2026-04-28T10:00:00Z').getTime();
    const twoDaysAgo = new Date('2026-04-27T10:00:00Z').getTime();
    const oldDay = new Date('2026-04-24T10:00:00Z').getTime();
    const sessions = [
      createRecord({ id: 'a', timestamp: today, profession: 'nurse', correct: true, score: 90 }),
      createRecord({ id: 'b', timestamp: yesterday, profession: 'nurse', correct: false, score: 70 }),
      createRecord({ id: 'c', timestamp: twoDaysAgo, profession: 'therapist', correct: true, score: 50 }),
      createRecord({ id: 'd', timestamp: oldDay, profession: 'nurse', correct: true, score: 100 }),
    ];

    expect(getOverallStats([])).toEqual({
      totalSessions: 0,
      correctSessions: 0,
      averageScore: 0,
      totalPracticeTime: '0h 0m',
    });
    expect(getOverallStats(sessions)).toEqual({
      totalSessions: 4,
      correctSessions: 3,
      averageScore: 78,
      totalPracticeTime: '0h 40m',
    });

    expect(getProfessionStats([], 'nurse')).toEqual({
      totalSessions: 0,
      correctSessions: 0,
      averageScore: 0,
      bestScore: 0,
      recentScores: [],
    });
    expect(getProfessionStats(sessions, 'nurse')).toEqual({
      totalSessions: 3,
      correctSessions: 2,
      averageScore: 87,
      bestScore: 100,
      recentScores: [90, 70, 100],
    });

    expect(getStreakInfo([])).toEqual({ currentStreak: 0, longestStreak: 0, lastPracticeDate: null });
    expect(getStreakInfo(sessions)).toEqual({
      currentStreak: 3,
      longestStreak: 3,
      lastPracticeDate: new Date(today).toLocaleDateString(),
    });
    expect(getStreakInfo([createRecord({ timestamp: yesterday })]).currentStreak).toBe(1);
  });

  it('loads, saves, and returns profession preferences', () => {
    expect(loadPreferences()).toEqual({});

    savePreferences({ nurse: { lastCategory: 'Cardiology' } });
    expect(loadPreferences()).toEqual({ nurse: { lastCategory: 'Cardiology' } });

    saveProfessionPreferences('nurse', 'Respiratory', 'advanced', 'emergency', true, 10);
    expect(getProfessionPreferences('nurse')).toEqual({
      lastCategory: 'Respiratory',
      lastDifficulty: 'advanced',
      lastSetting: 'emergency',
      lastTimePressure: true,
      lastMaxTurns: 10,
    });

    saveProfessionPreferences('therapist', 'Conflict', 'beginner', 'telehealth', false, null);
    expect(getProfessionPreferences('therapist')).toEqual({
      lastCategory: 'Conflict',
      lastDifficulty: 'beginner',
      lastSetting: 'telehealth',
      lastTimePressure: false,
      lastMaxTurns: undefined,
    });
    expect(getProfessionPreferences('doula')).toEqual({});

    localStorage.setItem('healthcare-trainer-preferences', '{bad json');
    expect(loadPreferences()).toEqual({});
    expect(console.error).toHaveBeenCalledWith('Failed to load preferences:', expect.any(SyntaxError));

    vi.spyOn(Storage.prototype, 'setItem').mockImplementationOnce(() => {
      throw new Error('write failed');
    });
    savePreferences({});
    expect(console.error).toHaveBeenCalledWith('Failed to save preferences:', expect.any(Error));
  });

  it('filters sessions and lists sorted unique categories', () => {
    const sessions = [
      createRecord({ id: 'a', profession: 'nurse', category: 'Beta', difficulty: 'beginner', setting: 'clinic' }),
      createRecord({ id: 'b', profession: 'therapist', category: 'Alpha', difficulty: 'advanced', setting: 'telehealth' }),
      createRecord({ id: 'c', profession: 'nurse', category: '', difficulty: 'advanced', setting: 'emergency' }),
    ];

    expect(filterSessions(sessions, { profession: 'all', category: 'all', difficulty: 'all', setting: 'all' })).toHaveLength(3);
    expect(filterSessions(sessions, { profession: 'nurse' })).toHaveLength(2);
    expect(filterSessions(sessions, { category: 'Alpha' })).toEqual([sessions[1]]);
    expect(filterSessions(sessions, { difficulty: 'beginner' })).toEqual([sessions[0]]);
    expect(filterSessions(sessions, { setting: 'emergency' })).toEqual([sessions[2]]);
    expect(getUniqueCategories(sessions)).toEqual(['Alpha', 'Beta']);
  });
});
