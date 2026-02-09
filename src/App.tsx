import './App.css';
import { AppProvider } from './app/state/app-context';
import { AppShell } from './app/AppShell';
import { SessionProvider } from './features/session/state/session-context';

function App() {
  return (
    <AppProvider>
      <SessionProvider>
        <AppShell />
      </SessionProvider>
    </AppProvider>
  );
}

export default App;
