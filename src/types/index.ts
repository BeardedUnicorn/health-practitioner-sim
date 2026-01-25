export type Profession = 'nurse' | 'psychiatrist' | 'psychologist' | 'therapist' | 'doula' | 'pregnancyPartner' | 'couplesTherapist';

export type Difficulty = 'beginner' | 'intermediate' | 'advanced';

export type ClinicalSetting = 'clinic' | 'emergency' | 'telehealth' | 'inpatient' | 'labor_delivery' | 'home' | 'birth_center';

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface CaseSetup {
  profession: Profession;
  category: string;
  difficulty: Difficulty;
  setting: ClinicalSetting;
  timePressureEnabled: boolean;
  maxTurns: number | null;
  createdAt: number;
}

// Couples therapy specific types
export interface CoupleProfile {
  partnerA: {
    name: string;
    age: number;
    description: string;
    attachmentStyle: string;
    typicalRole: string; // e.g., "pursuer", "withdrawer"
  };
  partnerB: {
    name: string;
    age: number;
    description: string;
    attachmentStyle: string;
    typicalRole: string;
  };
  relationshipDuration: string;
  presentingIssue: string;
  negativeCycle: string;
  escalationTriggers: string[];
  repairOpportunities: string[];
}

export interface PatientSession {
  diagnosis: string;
  conversationHistory: Message[];
  caseSetup?: CaseSetup;
  turnsUsed?: number;
  coupleProfile?: CoupleProfile; // For couples therapy
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
  // Optional secondary patient for couples therapy
  partnerALabel?: string;
  partnerAEmoji?: string;
  partnerBLabel?: string;
  partnerBEmoji?: string;
  isCouplesTherapy?: boolean;
  diagnosisHint: string;
  diagnosisPattern: RegExp;
  toolkit: ToolkitSection[];
  supportedSettings: ClinicalSetting[];
  defaultSetting: ClinicalSetting;
  getSetupPrompt: (category: string, difficulty?: Difficulty, setting?: ClinicalSetting) => string;
  getSystemPrompt: (setupContent: string, difficulty?: Difficulty, setting?: ClinicalSetting) => string;
  getAssessmentPrompt: (diagnosis: string, assessmentName: string, assessmentType: string) => string;
}

export interface ApiConfig {
  apiUrl: string;
  apiKey: string;
  modelName: string;
}

// Coach suggestion types
export type SuggestionType = 'question' | 'assessment' | 'consideration' | 'followup';

export interface CoachSuggestion {
  id: string;
  text: string;
  type: SuggestionType;
  shortLabel: string;
  fullText: string;
}

export interface CoachData {
  suggestions: CoachSuggestion[];
  summary: string;
  missingAreas: string[];
  timestamp: number;
}

// Progress tracking types
export interface SessionRecord {
  id: string;
  timestamp: number;
  profession: Profession;
  category: string;
  difficulty?: Difficulty;
  setting?: ClinicalSetting;
  timePressureEnabled?: boolean;
  maxTurns?: number | null;
  turnsUsed?: number;
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

export interface CaseSetupPreferences {
  [profession: string]: {
    lastCategory?: string;
    lastDifficulty?: Difficulty;
    lastSetting?: ClinicalSetting;
    lastTimePressure?: boolean;
    lastMaxTurns?: number;
  };
}