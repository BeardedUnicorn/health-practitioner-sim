import { ProfessionConfig } from '../types';

interface LoadingSessionProps {
  professionConfig: ProfessionConfig;
}

export function LoadingSession({ professionConfig }: LoadingSessionProps) {
  const tips = [
    `Preparing your ${professionConfig.patientLabel.toLowerCase()} scenario...`,
    'Generating realistic case details...',
    'Setting up the conversation...',
    'Almost ready...'
  ];

  return (
    <div className="loading-session-container">
      <div className="loading-session-content">
        <div className="loading-session-icon">
          <span className="loading-emoji">{professionConfig.patientEmoji}</span>
          <div className="loading-ring"></div>
        </div>
        
        <h2>Creating New {professionConfig.patientLabel}</h2>
        
        <div className="loading-tips">
          <p className="loading-tip">{tips[0]}</p>
        </div>

        <div className="loading-progress">
          <div className="loading-progress-bar"></div>
        </div>

        <div className="loading-hints">
          <p>💡 <strong>Tip:</strong> {professionConfig.diagnosisHint.replace('💡 Tip: ', '')}</p>
        </div>
      </div>
    </div>
  );
}