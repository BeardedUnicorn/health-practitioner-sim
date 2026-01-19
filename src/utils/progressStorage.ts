import { ProgressData, SessionRecord, ProfessionStats, Profession } from '../types';

const STORAGE_KEY = 'healthcare-trainer-progress';

export function loadProgress(): ProgressData {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Failed to load progress:', error);
  }
  return { sessions: [], lastUpdated: Date.now() };
}

export function saveProgress(data: ProgressData): void {
  try {
    data.lastUpdated = Date.now();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save progress:', error);
  }
}

export function addSessionRecord(record: Omit<SessionRecord, 'id' | 'timestamp'>): SessionRecord {
  const progress = loadProgress();
  
  const newRecord: SessionRecord = {
    ...record,
    id: generateId(),
    timestamp: Date.now()
  };
  
  progress.sessions.unshift(newRecord); // Add to beginning
  
  // Keep only last 100 sessions to prevent storage bloat
  if (progress.sessions.length > 100) {
    progress.sessions = progress.sessions.slice(0, 100);
  }
  
  saveProgress(progress);
  return newRecord;
}

export function clearProgress(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function getOverallStats(sessions: SessionRecord[]): {
  totalSessions: number;
  correctSessions: number;
  averageScore: number;
  totalPracticeTime: string;
} {
  if (sessions.length === 0) {
    return {
      totalSessions: 0,
      correctSessions: 0,
      averageScore: 0,
      totalPracticeTime: '0h 0m'
    };
  }

  const correctSessions = sessions.filter(s => s.correct).length;
  const averageScore = Math.round(
    sessions.reduce((sum, s) => sum + s.score, 0) / sessions.length
  );
  
  // Estimate ~10 minutes per session
  const totalMinutes = sessions.length * 10;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return {
    totalSessions: sessions.length,
    correctSessions,
    averageScore,
    totalPracticeTime: `${hours}h ${minutes}m`
  };
}

export function getProfessionStats(sessions: SessionRecord[], profession: Profession): ProfessionStats {
  const professionSessions = sessions.filter(s => s.profession === profession);
  
  if (professionSessions.length === 0) {
    return {
      totalSessions: 0,
      correctSessions: 0,
      averageScore: 0,
      bestScore: 0,
      recentScores: []
    };
  }

  const scores = professionSessions.map(s => s.score);
  
  return {
    totalSessions: professionSessions.length,
    correctSessions: professionSessions.filter(s => s.correct).length,
    averageScore: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
    bestScore: Math.max(...scores),
    recentScores: scores.slice(0, 10)
  };
}

export function getStreakInfo(sessions: SessionRecord[]): {
  currentStreak: number;
  longestStreak: number;
  lastPracticeDate: string | null;
} {
  if (sessions.length === 0) {
    return { currentStreak: 0, longestStreak: 0, lastPracticeDate: null };
  }

  // Get unique practice days
  const practiceDays = new Set(
    sessions.map(s => new Date(s.timestamp).toDateString())
  );
  
  const sortedDays = Array.from(practiceDays)
    .map(d => new Date(d))
    .sort((a, b) => b.getTime() - a.getTime());

  const lastPracticeDate = sortedDays[0].toLocaleDateString();
  
  // Calculate current streak
  let currentStreak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  for (let i = 0; i < sortedDays.length; i++) {
    const expectedDate = new Date(today);
    expectedDate.setDate(expectedDate.getDate() - i);
    expectedDate.setHours(0, 0, 0, 0);
    
    const practiceDate = new Date(sortedDays[i]);
    practiceDate.setHours(0, 0, 0, 0);
    
    if (practiceDate.getTime() === expectedDate.getTime()) {
      currentStreak++;
    } else if (i === 0 && practiceDate.getTime() === expectedDate.getTime() - 86400000) {
      // Yesterday counts for streak if no practice today yet
      currentStreak++;
    } else {
      break;
    }
  }

  // Calculate longest streak
  let longestStreak = 0;
  let tempStreak = 1;
  
  for (let i = 1; i < sortedDays.length; i++) {
    const diff = sortedDays[i - 1].getTime() - sortedDays[i].getTime();
    if (diff === 86400000) { // Exactly one day
      tempStreak++;
    } else {
      longestStreak = Math.max(longestStreak, tempStreak);
      tempStreak = 1;
    }
  }
  longestStreak = Math.max(longestStreak, tempStreak);

  return { currentStreak, longestStreak, lastPracticeDate };
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}