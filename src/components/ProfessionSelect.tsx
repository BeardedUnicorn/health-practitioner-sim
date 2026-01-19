import { Profession } from '../types';
import { professionConfigs } from '../config/professionConfig';

interface ProfessionSelectProps {
  onSelect: (profession: Profession) => void;
  onOpenSettings: () => void;
  onOpenProgress: () => void;
  sessionCount: number;
}

export function ProfessionSelect({ onSelect, onOpenSettings, onOpenProgress, sessionCount }: ProfessionSelectProps) {
  const professions = Object.values(professionConfigs);

  return (
    <div className="profession-select-container">
      <div className="profession-header">
        <h1>🏥 Healthcare Training Simulator</h1>
        <div className="profession-header-buttons">
          <button onClick={onOpenProgress} className="btn-icon" title="View Progress">
            📊
            {sessionCount > 0 && <span className="badge">{sessionCount}</span>}
          </button>
          <button onClick={onOpenSettings} className="btn-icon" title="Settings">
            ⚙️
          </button>
        </div>
      </div>
      <p className="subtitle">Select your profession to begin training</p>
      
      <div className="profession-cards">
        {professions.map((config) => (
          <button
            key={config.id}
            className="profession-card"
            onClick={() => onSelect(config.id)}
          >
            <span className="profession-emoji">{config.emoji}</span>
            <h2>{config.name}</h2>
            <p>{config.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
}