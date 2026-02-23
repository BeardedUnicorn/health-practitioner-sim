import { CaseSetup, Profession } from '../types';
import { getProfessionPreferences } from '../utils/progressStorage';
import { ProfessionSelect } from '../components/ProfessionSelect';
import { SettingsModal } from '../components/SettingsModal';
import { SessionStart } from '../components/SessionStart';
import { LoadingSession } from '../components/LoadingSession';
import { SessionEvaluation } from '../components/SessionEvaluation';
import { ProgressScreen } from '../components/ProgressScreen';
import { CaseSetupModal } from '../components/CaseSetupModal';
import { useAppContext } from './state/app-context';
import { useSessionContext } from '../features/session/state/session-context';
import { SessionToolbar } from '../features/session/components/SessionToolbar';
import { SessionWorkspace } from '../features/session/components/SessionWorkspace';
import { CoachProvider } from '../features/coach/state/coach-context';

export function AppShell() {
  const { state: appState, actions: appActions, meta: appMeta } = useAppContext();
  const { state: sessionState, actions: sessionActions } = useSessionContext();

  const profession = appState.profession;
  const professionConfig = appMeta.professionConfig;

  const handleProfessionSelect = (selectedProfession: Profession) => {
    sessionActions.resetSessionState();
    appActions.selectProfession(selectedProfession);
  };

  const handleChangeProfession = () => {
    sessionActions.resetSessionState();
    appActions.resetProfession();
  };

  const handleShowProgress = () => {
    appActions.setScreen('progress');
  };

  const handleBackFromProgress = () => {
    if (profession) {
      if (sessionState.session) {
        appActions.setScreen('session');
      } else {
        appActions.setScreen('ready');
      }
      return;
    }

    appActions.setScreen('profession-select');
  };

  const handleCancelLoading = () => {
    sessionActions.cancelLoading();
    appActions.setScreen('ready');
  };

  const handleOpenCaseSetup = () => {
    appActions.setScreen('case-setup');
  };

  const handleCloseCaseSetup = () => {
    appActions.setScreen('ready');
  };

  const handleStartWithSetup = async (setup: CaseSetup) => {
    appActions.setScreen('loading-session');
    const started = await sessionActions.startSessionWithSetup(setup);

    if (started) {
      appActions.setScreen('session');
    } else {
      appActions.setScreen(profession ? 'ready' : 'profession-select');
    }
  };

  const handleStartRandom = async () => {
    if (!profession || !professionConfig) {
      return;
    }

    const preferences = getProfessionPreferences(profession);

    const setup: CaseSetup = {
      profession,
      category: professionConfig.categories[
        Math.floor(Math.random() * professionConfig.categories.length)
      ],
      difficulty: preferences.lastDifficulty || 'beginner',
      setting: preferences.lastSetting || professionConfig.defaultSetting,
      timePressureEnabled: preferences.lastTimePressure || false,
      maxTurns: preferences.lastMaxTurns || null,
      mode: 'guided',
      createdAt: Date.now(),
    };

    await handleStartWithSetup(setup);
  };

  const handleEndSession = () => {
    sessionActions.endSession();
    appActions.setScreen('ready');
  };

  const handleCloseEvaluation = () => {
    sessionActions.setShowEvaluation(false);
  };

  return (
    <div className="app">
      {appState.showSettings && (
        <SettingsModal
          config={appState.apiConfig}
          onChange={appActions.setApiConfig}
          onClose={appActions.closeSettings}
        />
      )}

      {sessionState.showEvaluation && professionConfig && sessionState.session && (
        <SessionEvaluation
          professionConfig={professionConfig}
          apiConfig={appState.apiConfig}
          conversationHistory={sessionState.session.conversationHistory}
          diagnosis={sessionState.session.diagnosis}
          userAnswer={sessionState.userFinalAnswer}
          wasCorrect={sessionState.feedback?.correct ?? false}
          caseSetup={sessionState.session.caseSetup}
          turnsUsed={sessionState.session.turnsUsed}
          mode={sessionState.session.mode}
          hintsUsed={sessionState.session.hintsUsed}
          onNewSession={() => {
            sessionActions.setShowEvaluation(false);
            handleOpenCaseSetup();
          }}
          onClose={handleCloseEvaluation}
          onProgressSaved={appActions.refreshProgress}
        />
      )}

      {appState.screen === 'progress' && (
        <ProgressScreen
          progress={appState.progress}
          onBack={handleBackFromProgress}
          onRefresh={appActions.refreshProgress}
        />
      )}

      {appState.screen === 'profession-select' && (
        <ProfessionSelect
          onSelect={handleProfessionSelect}
          onOpenSettings={appActions.openSettings}
          onOpenProgress={handleShowProgress}
          sessionCount={appState.progress.sessions.length}
        />
      )}

      {appState.screen === 'ready' && professionConfig && (
        <>
          <div className="header">
            <h1>{professionConfig.emoji} {professionConfig.title}</h1>
            <div className="header-buttons">
              <button onClick={handleShowProgress} className="btn-secondary">
                📊 Progress
              </button>
              <button onClick={appActions.openSettings} className="btn-secondary">
                ⚙️ Settings
              </button>
              <button onClick={handleChangeProfession} className="btn-secondary">
                🔄 Change Profession
              </button>
            </div>
          </div>
          <SessionStart professionConfig={professionConfig} isLoading={false} onStart={handleOpenCaseSetup} />
        </>
      )}

      {appState.screen === 'case-setup' && professionConfig && profession && (
        <CaseSetupModal
          profession={profession}
          professionConfig={professionConfig}
          onStart={handleStartWithSetup}
          onStartRandom={handleStartRandom}
          onClose={handleCloseCaseSetup}
        />
      )}

      {appState.screen === 'loading-session' && professionConfig && (
        <>
          <div className="header">
            <h1>{professionConfig.emoji} {professionConfig.title}</h1>
            <div className="header-buttons">
              <button onClick={appActions.openSettings} className="btn-secondary">
                ⚙️ Settings
              </button>
            </div>
          </div>
          <LoadingSession professionConfig={professionConfig} onCancel={handleCancelLoading} />
        </>
      )}

      {appState.screen === 'session' && professionConfig && profession && sessionState.session && (
        <>
          <SessionToolbar
            professionConfig={professionConfig}
            isLoading={sessionState.isLoading}
            isStreaming={sessionState.isStreaming}
            showToolkit={sessionState.showToolkit}
            showAnswer={sessionState.showAnswer}
            hasFeedback={!!sessionState.feedback}
            onNewSession={handleOpenCaseSetup}
            onToggleToolkit={() => sessionActions.setShowToolkit(!sessionState.showToolkit)}
            onToggleAnswer={() => sessionActions.setShowAnswer(!sessionState.showAnswer)}
            onShowEvaluation={() => sessionActions.setShowEvaluation(true)}
            onOpenSettings={appActions.openSettings}
            onEndSession={handleEndSession}
          />

          <CoachProvider onSuggestionSelected={sessionActions.applyCoachSuggestion}>
            <SessionWorkspace
              profession={profession}
              professionConfig={professionConfig}
              apiConfig={appState.apiConfig}
              coachWidth={appState.coachWidth}
              onCoachWidthChange={appActions.setCoachWidth}
              onNewSession={handleOpenCaseSetup}
            />
          </CoachProvider>
        </>
      )}
    </div>
  );
}
