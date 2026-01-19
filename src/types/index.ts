export type Profession = 'nurse' | 'psychiatrist' | 'psychologist' | 'therapist' | 'doula' | 'pregnancyPartner';

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface PatientSession {
  diagnosis: string;
  conversationHistory: Message[];
}

export interface ToolkitItem {
  id: string;
  label: string;
  emoji: string;
  assessmentType: string;
  assessmentName: string;
}

export interface ToolkitSection {
  title: string;
  items: ToolkitItem[];
}

export interface ProfessionConfig {
  id: Profession;
  name: string;
  emoji: string;
  title: string;
  description: string;
  categories: string[];
  userLabel: string;
  userEmoji: string;
  patientLabel: string;
  patientEmoji: string;
  diagnosisHint: string;
  diagnosisPattern: RegExp;
  toolkit: ToolkitSection[];
  getSetupPrompt: (category: string) => string;
  getSystemPrompt: (setupContent: string) => string;
  getAssessmentPrompt: (diagnosis: string, assessmentName: string, assessmentType: string) => string;
}

export interface ApiConfig {
  apiUrl: string;
  apiKey: string;
  modelName: string;
}

// Progress tracking types
export interface SessionRecord {
  id: string;
  timestamp: number;
  profession: Profession;
  category: string;
  diagnosis: string;
  userAnswer: string;
  correct: boolean;
  score: number;
  summary: string;
  strengths: string[];
  gaps: string[];
  safetyFlags: string[];
}

export interface ProfessionStats {
  totalSessions: number;
  correctSessions: number;
  averageScore: number;
  bestScore: number;
  recentScores: number[];
}

export interface ProgressData {
  sessions: SessionRecord[];
  lastUpdated: number;
}