interface TurnCounterProps {
  turnsUsed: number;
  maxTurns: number;
  onForceSubmit: () => void;
}

export function TurnCounter({ turnsUsed, maxTurns, onForceSubmit }: TurnCounterProps) {
  const turnsRemaining = maxTurns - turnsUsed;
  const percentage = (turnsUsed / maxTurns) * 100;
  
  const getColor = () => {
    if (turnsRemaining <= 2) return 'var(--error)';
    if (turnsRemaining <= 5) return 'var(--warning)';
    return 'var(--success)';
  };

  const isUrgent = turnsRemaining <= 3;

  return (
    <div className={`turn-counter ${isUrgent ? 'urgent' : ''}`}>
      <div className="turn-counter-header">
        <span className="turn-icon">⏱️</span>
        <span className="turn-label">Turns</span>
      </div>
      <div className="turn-counter-display">
        <span className="turns-remaining" style={{ color: getColor() }}>
          {turnsRemaining}
        </span>
        <span className="turns-separator">/</span>
        <span className="turns-total">{maxTurns}</span>
      </div>
      <div className="turn-progress-bar">
        <div 
          className="turn-progress-fill"
          style={{ 
            width: `${percentage}%`,
            backgroundColor: getColor()
          }}
        />
      </div>
      {turnsRemaining <= 0 && (
        <button onClick={onForceSubmit} className="btn-force-submit">
          ⚠️ Submit Now
        </button>
      )}
      {isUrgent && turnsRemaining > 0 && (
        <div className="turn-warning">
          {turnsRemaining === 1 ? 'Last turn!' : `${turnsRemaining} turns left`}
        </div>
      )}
    </div>
  );
}