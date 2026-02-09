import { AppAction, AppState } from './app-types';

export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'set-screen':
      return {
        ...state,
        screen: action.payload,
      };
    case 'select-profession':
      return {
        ...state,
        profession: action.payload,
        screen: 'ready',
      };
    case 'reset-profession':
      return {
        ...state,
        profession: null,
        screen: 'profession-select',
      };
    case 'set-show-settings':
      return {
        ...state,
        showSettings: action.payload,
      };
    case 'set-api-config':
      return {
        ...state,
        apiConfig: action.payload,
      };
    case 'set-progress':
      return {
        ...state,
        progress: action.payload,
      };
    case 'set-coach-width':
      return {
        ...state,
        coachWidth: action.payload,
      };
    default:
      return state;
  }
}
