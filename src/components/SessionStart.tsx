import { ProfessionConfig } from '../types';

interface SessionStartProps {
  professionConfig: ProfessionConfig;
  isLoading: boolean;
  onStart: () => void;
}

export function SessionStart({ professionConfig, isLoading, onStart }: SessionStartProps) {
  return (
    <div className="start-container">
      <div>
        <h2>Ready to practice your {professionConfig.name.toLowerCase()} skills?</h2>
        <p>
          You'll interact with a simulated {professionConfig.patientLabel.toLowerCase()}. 
          Ask questions to gather information, then provide your assessment.
        </p>
        <button onClick={onStart} disabled={isLoading} className="btn-primary btn-large">
          {isLoading ? `Generating ${professionConfig.patientLabel}...` : `Start New ${professionConfig.patientLabel} Session`}
        </button>
      </div>
    </div>
  );
}