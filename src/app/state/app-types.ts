import { ApiConfig, ProgressData, Profession, ProfessionConfig } from '../../types';

export type AppScreen =
  | 'profession-select'
  | 'ready'
  | 'case-setup'
  | 'loading-session'
  | 'session'
  | 'progress';

export interface AppState {
  screen: AppScreen;
  profession: Profession | null;
  showSettings: boolean;
  apiConfig: ApiConfig;
  progress: ProgressData;
  coachWidth: number;
}

export interface AppActions {
  setScreen: (screen: AppScreen) => void;
  selectProfession: (profession: Profession) => void;
  resetProfession: () => void;
  openSettings: () => void;
  closeSettings: () => void;
  setApiConfig: (config: ApiConfig) => void;
  refreshProgress: () => void;
  setCoachWidth: (width: number) => void;
}

export interface AppMeta {
  professionConfig: ProfessionConfig | null;
}

export interface AppContextValue {
  state: AppState;
  actions: AppActions;
  meta: AppMeta;
}

export type AppAction =
  | { type: 'set-screen'; payload: AppScreen }
  | { type: 'select-profession'; payload: Profession }
  | { type: 'reset-profession' }
  | { type: 'set-show-settings'; payload: boolean }
  | { type: 'set-api-config'; payload: ApiConfig }
  | { type: 'set-progress'; payload: ProgressData }
  | { type: 'set-coach-width'; payload: number };
