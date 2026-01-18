import { PatientSession, ProfessionConfig } from '../types';
import { Toolkit } from './Toolkit';

interface SidebarProps {
  session: PatientSession;
  professionConfig: ProfessionConfig;
  isLoading: boolean;
  showToolkit: boolean;
  showAnswer: boolean;
  performingAssessment: boolean;
  onNewSession: () => void;
  onToggleToolkit: () => void;
  onToggleAnswer: () => void;
  onAssessment: (assessmentType: string, assessmentName: string) => void;
}

export function Sidebar({
  session,
  professionConfig,
  isLoading,
  showToolkit,
  showAnswer,
  performingAssessment,
  onNewSession,
  onToggleToolkit,
  onToggleAnswer,
  onAssessment
}: SidebarProps) {
  return (
    <div className="sidebar">
      <button onClick={onNewSession} className="btn-secondary" disabled={isLoading}>
        🔄 New {professionConfig.patientLabel}
      </button>
      
      <button 
        onClick={onToggleToolkit} 
        className="btn-primary"
        style={{ marginTop: '0.5rem' }}
      >
        {showToolkit ? '✖️ Close Toolkit' : '🩺 Assessment Toolkit'}
      </button>

      {showToolkit && (
        <Toolkit
          sections={professionConfig.toolkit}
          isLoading={performingAssessment}
          onAssessment={onAssessment}
        />
      )}

      <div className="info-box">
        <h3>How to Use</h3>
        <ol>
          <li>Ask the {professionConfig.patientLabel.toLowerCase()} questions about their concerns</li>
          <li>Use the Assessment Toolkit for formal evaluations</li>
          <li>Gather relevant history and background</li>
          <li>When confident, provide your assessment</li>
          <li>Get instant feedback on your formulation</li>
        </ol>
      </div>
      
      <button 
        onClick={onToggleAnswer} 
        className="btn-secondary"
        style={{ marginTop: '1rem' }}
      >
        {showAnswer ? '🙈 Hide Answer' : '👁️ Show Answer'}
      </button>
      
      {showAnswer && (
        <div className="info-box answer-box">
          <h3>⚠️ Answer</h3>
          <p className="answer-text">{session.diagnosis}</p>
        </div>
      )}
    </div>
  );
}