import { useState } from 'react';
import './App.css';
import { Profession, PatientSession, ApiConfig, Message } from './types';
import { professionConfigs } from './config/professionConfig';
import { ProfessionSelect } from './components/ProfessionSelect';
import { SettingsModal } from './components/SettingsModal';
import { SessionStart } from './components/SessionStart';
import { ChatContainer } from './components/ChatContainer';
import { Sidebar } from './components/Sidebar';

type AppState = 'profession-select' | 'ready' | 'session';

function App() {
  const [appState, setAppState] = useState<AppState>('profession-select');
  const [profession, setProfession] = useState<Profession | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [apiConfig, setApiConfig] = useState<ApiConfig>({
    apiUrl: 'http://localhost:1234/v1',
    apiKey: '',
    modelName: 'qwen/qwen3-4b-2507'
  });
  
  const [session, setSession] = useState<PatientSession | null>(null);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ correct: boolean; message: string } | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [showToolkit, setShowToolkit] = useState(false);
  const [performingAssessment, setPerformingAssessment] = useState(false);

  const professionConfig = profession ? professionConfigs[profession] : null;

  const handleProfessionSelect = (selectedProfession: Profession) => {
    setProfession(selectedProfession);
    setAppState('ready');
  };

  const handleChangeProfession = () => {
    setSession(null);
    setFeedback(null);
    setShowAnswer(false);
    setShowToolkit(false);
    setProfession(null);
    setAppState('profession-select');
  };

  const startNewSession = async () => {
    if (!professionConfig) return;
    
    setIsLoading(true);
    setFeedback(null);
    setShowAnswer(false);
    
    try {
      const randomCategory = professionConfig.categories[
        Math.floor(Math.random() * professionConfig.categories.length)
      ];
      
      const setupPrompt = professionConfig.getSetupPrompt(randomCategory);

      const setupResponse = await fetch(`${apiConfig.apiUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiConfig.apiKey}`
        },
        body: JSON.stringify({
          model: apiConfig.modelName,
          messages: [{ role: 'user', content: setupPrompt }],
          temperature: 0.9
        })
      });

      if (!setupResponse.ok) {
        throw new Error('Failed to connect to API');
      }

      const setupData = await setupResponse.json();
      const setupContent = setupData.choices[0].message.content;
      
      const diagnosisMatch = setupContent.match(/DIAGNOSIS:\s*(.+?)(?:\n|$)/i);
      const diagnosis = diagnosisMatch ? diagnosisMatch[1].trim() : 'Unknown Condition';
      
      const systemPrompt = professionConfig.getSystemPrompt(setupContent);

      const initialGreeting = profession === 'psychologist' 
        ? "Hi... thanks for seeing me. I'm not really sure where to start..."
        : "Hello, I'm not feeling well. I think I need help...";

      const initialHistory: Message[] = [
        { role: 'system', content: systemPrompt },
        { role: 'assistant', content: initialGreeting }
      ];

      setSession({
        diagnosis: diagnosis,
        conversationHistory: initialHistory
      });
      
      setAppState('session');
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      alert(`Error starting session: ${message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!currentMessage.trim() || !session || !professionConfig || isLoading) return;

    const userMessage = currentMessage.trim();
    setCurrentMessage('');

    const diagnosisMatch = userMessage.match(professionConfig.diagnosisPattern);

    if (diagnosisMatch) {
      const userDiagnosis = diagnosisMatch[1].trim();
      const isCorrect = userDiagnosis.toLowerCase().includes(session.diagnosis.toLowerCase()) ||
                        session.diagnosis.toLowerCase().includes(userDiagnosis.toLowerCase());
      
      setFeedback({
        correct: isCorrect,
        message: isCorrect 
          ? `✅ Correct! The ${professionConfig.patientLabel.toLowerCase()}'s condition is ${session.diagnosis}.`
          : `❌ Incorrect. The ${professionConfig.patientLabel.toLowerCase()}'s condition is ${session.diagnosis}, not ${userDiagnosis}.`
      });
      
      setSession({
        ...session,
        conversationHistory: [
          ...session.conversationHistory,
          { role: 'user', content: userMessage }
        ]
      });
      return;
    }

    setIsLoading(true);

    const newHistory: Message[] = [
      ...session.conversationHistory,
      { role: 'user', content: userMessage }
    ];

    try {
      const response = await fetch(`${apiConfig.apiUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiConfig.apiKey}`
        },
        body: JSON.stringify({
          model: apiConfig.modelName,
          messages: newHistory.map(msg => ({
            role: msg.role,
            content: msg.content
          })),
          temperature: 0.7
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get response from API');
      }

      const data = await response.json();
      const assistantMessage = data.choices[0].message.content;

      setSession({
        ...session,
        conversationHistory: [
          ...newHistory,
          { role: 'assistant', content: assistantMessage }
        ]
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      alert(`Error sending message: ${message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const performAssessment = async (assessmentType: string, assessmentName: string) => {
    if (!session || !professionConfig || performingAssessment) return;

    setPerformingAssessment(true);

    const assessmentPrompt = professionConfig.getAssessmentPrompt(
      session.diagnosis, 
      assessmentName, 
      assessmentType
    );

    try {
      const response = await fetch(`${apiConfig.apiUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiConfig.apiKey}`
        },
        body: JSON.stringify({
          model: apiConfig.modelName,
          messages: [
            { role: 'system', content: session.conversationHistory[0].content },
            { role: 'user', content: assessmentPrompt }
          ],
          temperature: 0.5
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get assessment results');
      }

      const data = await response.json();
      const assessmentResult = data.choices[0].message.content;

      const assessmentMessage = `📋 ${assessmentName}: ${assessmentResult}`;
      
      setSession({
        ...session,
        conversationHistory: [
          ...session.conversationHistory,
          { role: 'user', content: `[Performed ${assessmentName}]` },
          { role: 'assistant', content: assessmentMessage }
        ]
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      alert(`Error performing assessment: ${message}`);
    } finally {
      setPerformingAssessment(false);
    }
  };

  const handleEndSession = () => {
    setSession(null);
    setFeedback(null);
    setShowAnswer(false);
    setShowToolkit(false);
    setAppState('ready');
  };

  return (
    <div className="app">
      {/* Settings Modal */}
      {showSettings && (
        <SettingsModal
          config={apiConfig}
          onChange={setApiConfig}
          onClose={() => setShowSettings(false)}
        />
      )}

      {/* Profession Selection Screen */}
      {appState === 'profession-select' && (
        <ProfessionSelect 
          onSelect={handleProfessionSelect} 
          onOpenSettings={() => setShowSettings(true)}
        />
      )}

      {/* Ready to Start Screen */}
      {appState === 'ready' && professionConfig && (
        <>
          <div className="header">
            <h1>{professionConfig.emoji} {professionConfig.title}</h1>
            <div className="header-buttons">
              <button onClick={() => setShowSettings(true)} className="btn-secondary">
                ⚙️ Settings
              </button>
              <button onClick={handleChangeProfession} className="btn-secondary">
                🔄 Change Profession
              </button>
            </div>
          </div>
          <SessionStart
            professionConfig={professionConfig}
            isLoading={isLoading}
            onStart={startNewSession}
          />
        </>
      )}

      {/* Active Session Screen */}
      {appState === 'session' && professionConfig && session && (
        <>
          <div className="header">
            <h1>{professionConfig.emoji} {professionConfig.title}</h1>
            <div className="header-buttons">
              <button onClick={() => setShowSettings(true)} className="btn-secondary">
                ⚙️ Settings
              </button>
              <button onClick={handleEndSession} className="btn-secondary">
                ✖️ End Session
              </button>
            </div>
          </div>

          <div className="session-container">
            <ChatContainer
              session={session}
              professionConfig={professionConfig}
              currentMessage={currentMessage}
              isLoading={isLoading}
              feedback={feedback}
              onMessageChange={setCurrentMessage}
              onSend={sendMessage}
              onNewSession={startNewSession}
            />

            <Sidebar
              session={session}
              professionConfig={professionConfig}
              isLoading={isLoading}
              showToolkit={showToolkit}
              showAnswer={showAnswer}
              performingAssessment={performingAssessment}
              onNewSession={startNewSession}
              onToggleToolkit={() => setShowToolkit(!showToolkit)}
              onToggleAnswer={() => setShowAnswer(!showAnswer)}
              onAssessment={performAssessment}
            />
          </div>
        </>
      )}
    </div>
  );
}

export default App;