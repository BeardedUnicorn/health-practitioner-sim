/* eslint-disable react-refresh/only-export-components */
import { createContext, ReactNode, use, useCallback, useMemo, useReducer } from 'react';
import { professionConfigs } from '../../config/professionConfig';
import { loadProgress } from '../../utils/progressStorage';
import { appReducer } from './app-reducer';
import { AppContextValue, AppState } from './app-types';

const INITIAL_STATE: AppState = {
  screen: 'profession-select',
  profession: null,
  showSettings: false,
  apiConfig: {
    apiUrl: 'http://localhost:1234/v1',
    apiKey: '',
    modelName: 'qwen/qwen3-4b-2507',
  },
  progress: loadProgress(),
  coachWidth: 350,
};

const AppContext = createContext<AppContextValue | null>(null);

interface AppProviderProps {
  children: ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
  const [state, dispatch] = useReducer(appReducer, INITIAL_STATE);

  const setScreen = useCallback((screen: AppState['screen']) => {
    dispatch({ type: 'set-screen', payload: screen });
  }, []);

  const selectProfession = useCallback((profession: NonNullable<AppState['profession']>) => {
    dispatch({ type: 'select-profession', payload: profession });
  }, []);

  const resetProfession = useCallback(() => {
    dispatch({ type: 'reset-profession' });
  }, []);

  const openSettings = useCallback(() => {
    dispatch({ type: 'set-show-settings', payload: true });
  }, []);

  const closeSettings = useCallback(() => {
    dispatch({ type: 'set-show-settings', payload: false });
  }, []);

  const setApiConfig = useCallback((config: AppState['apiConfig']) => {
    dispatch({ type: 'set-api-config', payload: config });
  }, []);

  const refreshProgress = useCallback(() => {
    dispatch({ type: 'set-progress', payload: loadProgress() });
  }, []);

  const setCoachWidth = useCallback((width: number) => {
    dispatch({ type: 'set-coach-width', payload: width });
  }, []);

  const professionConfig = state.profession ? professionConfigs[state.profession] : null;

  const value = useMemo<AppContextValue>(
    () => ({
      state,
      actions: {
        setScreen,
        selectProfession,
        resetProfession,
        openSettings,
        closeSettings,
        setApiConfig,
        refreshProgress,
        setCoachWidth,
      },
      meta: {
        professionConfig,
      },
    }),
    [
      professionConfig,
      refreshProgress,
      resetProfession,
      selectProfession,
      setApiConfig,
      setCoachWidth,
      setScreen,
      state,
      openSettings,
      closeSettings,
    ],
  );

  return <AppContext value={value}>{children}</AppContext>;
}

export function useAppContext(): AppContextValue {
  const context = use(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return context;
}
