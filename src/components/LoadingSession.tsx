import { useState, useEffect } from 'react';
import { ProfessionConfig } from '../types';
import './LoadingSession.css';

interface LoadingSessionProps {
  professionConfig: ProfessionConfig;
  onCancel: () => void;
}

type LoadingStep = 'generating' | 'parsing' | 'preparing' | 'starting';

const STEP_INFO: Record<LoadingStep, { label: string; emoji: string }> = {
  generating: { label: 'Generating scenario', emoji: '🎲' },
  parsing: { label: 'Parsing case details', emoji: '📋' },
  preparing: { label: 'Preparing conversation', emoji: '💬' },
  starting: { label: 'Starting session', emoji: '✨' }
};

const LOADING_TIPS = [
  'Take your time to gather information before making a diagnosis.',
  'Build rapport by showing empathy and active listening.',
  'Use the Assessment Toolkit to perform physical examinations.',
  'Ask open-ended questions to encourage detailed responses.',
  'Watch for red flags and safety concerns throughout the conversation.',
  'The Coach button (🎓) provides real-time guidance during sessions.',
  'Consider differential diagnoses before settling on your answer.',
  'Pay attention to both verbal and non-verbal cues in responses.',
  'Document your thought process as you go along.',
  "Remember: it's better to ask more questions than to rush to conclusions."
];

export function LoadingSession({ professionConfig, onCancel }: LoadingSessionProps) {
  const [currentStep, setCurrentStep] = useState<LoadingStep>('generating');
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  // Rotate tips every 3 seconds
  useEffect(() => {
    const tipInterval = setInterval(() => {
      setCurrentTipIndex((prev) => (prev + 1) % LOADING_TIPS.length);
    }, 3000);

    return () => clearInterval(tipInterval);
  }, []);

  // Simulate step progression (this will be controlled by parent in real implementation)
  useEffect(() => {
    const steps: LoadingStep[] = ['generating', 'parsing', 'preparing', 'starting'];
    let stepIndex = 0;

    const stepInterval = setInterval(() => {
      if (stepIndex < steps.length - 1) {
        stepIndex++;
        setCurrentStep(steps[stepIndex]);
        setProgress(((stepIndex + 1) / steps.length) * 100);
      }
    }, 1500);

    return () => clearInterval(stepInterval);
  }, []);

  const completedSteps = Object.keys(STEP_INFO).indexOf(currentStep);

  return (
    <div className="loading-session-container">
      <div className="loading-session-content">
        {/* Main Icon with Animation */}
        <div className="loading-session-icon">
          <span className="loading-emoji">{professionConfig.patientEmoji}</span>
          <div className="loading-ring"></div>
        </div>
        
        <h2>Creating New {professionConfig.patientLabel}</h2>

        {/* Step Progress */}
        <div className="loading-steps">
          {(Object.keys(STEP_INFO) as LoadingStep[]).map((step, index) => {
            const stepInfo = STEP_INFO[step];
            const isCompleted = index < completedSteps;
            const isCurrent = step === currentStep;
            const isPending = index > completedSteps;

            return (
              <div 
                key={step} 
                className={`loading-step ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''} ${isPending ? 'pending' : ''}`}
              >
                <div className="step-indicator">
                  {isCompleted ? (
                    <span className="step-check">✓</span>
                  ) : isCurrent ? (
                    <span className="step-spinner"></span>
                  ) : (
                    <span className="step-number">{index + 1}</span>
                  )}
                </div>
                <div className="step-content">
                  <div className="step-emoji">{stepInfo.emoji}</div>
                  <div className="step-label">{stepInfo.label}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Progress Bar */}
        <div className="loading-progress">
          <div 
            className="loading-progress-bar" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>

        {/* Rotating Tips */}
        <div className="loading-tips">
          <div className="tip-icon">💡</div>
          <div className="tip-content">
            <div className="tip-label">Tip</div>
            <div className="tip-text" key={currentTipIndex}>
              {LOADING_TIPS[currentTipIndex]}
            </div>
          </div>
        </div>

        {/* Cancel Button */}
        <button onClick={onCancel} className="btn-cancel">
          Cancel
        </button>
      </div>
    </div>
  );
}
