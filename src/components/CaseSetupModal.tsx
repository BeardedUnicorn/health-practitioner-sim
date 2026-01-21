import { useState, useEffect } from 'react';
import { Profession, Difficulty, ClinicalSetting, CaseSetup, ProfessionConfig } from '../types';
import { getProfessionPreferences, saveProfessionPreferences } from '../utils/progressStorage';
import './CaseSetupModal.css';

interface CaseSetupModalProps {
  profession: Profession;
  professionConfig: ProfessionConfig;
  onStart: (setup: CaseSetup) => void;
  onStartRandom: () => void;
  onClose: () => void;
}

const DIFFICULTY_INFO: Record<Difficulty, { label: string; description: string; emoji: string }> = {
  beginner: {
    label: 'Beginner',
    description: 'Straightforward presentation with classic symptoms',
    emoji: '🟢'
  },
  intermediate: {
    label: 'Intermediate',
    description: 'Comorbidities, ambiguous symptoms, atypical presentation',
    emoji: '🟡'
  },
  advanced: {
    label: 'Advanced',
    description: 'Poor historian, conflicting info, red herrings, time pressure',
    emoji: '🔴'
  }
};

const SETTING_INFO: Record<ClinicalSetting, { label: string; emoji: string }> = {
  clinic: { label: 'Outpatient Clinic', emoji: '🏥' },
  emergency: { label: 'Emergency Department', emoji: '🚨' },
  telehealth: { label: 'Telehealth/Virtual', emoji: '💻' },
  inpatient: { label: 'Inpatient/Hospital', emoji: '🛏️' },
  labor_delivery: { label: 'Labor & Delivery', emoji: '👶' },
  home: { label: 'Home Visit', emoji: '🏠' },
  birth_center: { label: 'Birth Center', emoji: '🤱' }
};

const TURN_LIMITS = [5, 10, 15, 20, 25, 30];

export function CaseSetupModal({
  profession,
  professionConfig,
  onStart,
  onStartRandom,
  onClose
}: CaseSetupModalProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [difficulty, setDifficulty] = useState<Difficulty>('beginner');
  const [setting, setSetting] = useState<ClinicalSetting>(professionConfig.defaultSetting);
  const [timePressureEnabled, setTimePressureEnabled] = useState(false);
  const [maxTurns, setMaxTurns] = useState<number>(15);

  // Load saved preferences on mount
  useEffect(() => {
    const prefs = getProfessionPreferences(profession);
    if (prefs.lastCategory && professionConfig.categories.some(c => c === prefs.lastCategory)) {
      setSelectedCategory(prefs.lastCategory);
    } else if (professionConfig.categories.length > 0) {
      setSelectedCategory(professionConfig.categories[0]);
    }
    if (prefs.lastDifficulty) {
      setDifficulty(prefs.lastDifficulty);
    }
    if (prefs.lastSetting && professionConfig.supportedSettings.includes(prefs.lastSetting)) {
      setSetting(prefs.lastSetting);
    }
    if (prefs.lastTimePressure !== undefined) {
      setTimePressureEnabled(prefs.lastTimePressure);
    }
    if (prefs.lastMaxTurns) {
      setMaxTurns(prefs.lastMaxTurns);
    }
  }, [profession, professionConfig]);

  const handleStart = () => {
    // Save preferences
    saveProfessionPreferences(
      profession,
      selectedCategory,
      difficulty,
      setting,
      timePressureEnabled,
      timePressureEnabled ? maxTurns : null
    );

    const setup: CaseSetup = {
      profession,
      category: selectedCategory,
      difficulty,
      setting,
      timePressureEnabled,
      maxTurns: timePressureEnabled ? maxTurns : null,
      createdAt: Date.now()
    };

    onStart(setup);
  };

  const handleStartRandom = () => {
    // Still save the difficulty/setting preferences for next time
    saveProfessionPreferences(
      profession,
      '', // No specific category
      difficulty,
      setting,
      timePressureEnabled,
      timePressureEnabled ? maxTurns : null
    );
    onStartRandom();
  };

  // Extract category name from full category string (before the parentheses)
  const getCategoryDisplayName = (category: string) => {
    const match = category.match(/^([^(]+)/);
    return match ? match[1].trim() : category;
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content case-setup-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>🎯 Case Setup</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body case-setup-body">
          {/* Category Selection */}
          <div className="setup-section">
            <label className="setup-label">
              <span className="label-icon">📋</span>
              Category
            </label>
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="setup-select"
            >
              {professionConfig.categories.map(category => (
                <option key={category} value={category}>
                  {getCategoryDisplayName(category)}
                </option>
              ))}
            </select>
            {selectedCategory && (
              <div className="category-description">
                {selectedCategory}
              </div>
            )}
          </div>

          {/* Difficulty Selection */}
          <div className="setup-section">
            <label className="setup-label">
              <span className="label-icon">📊</span>
              Difficulty
            </label>
            <div className="difficulty-options">
              {(Object.keys(DIFFICULTY_INFO) as Difficulty[]).map(diff => (
                <button
                  key={diff}
                  className={`difficulty-option ${difficulty === diff ? 'selected' : ''}`}
                  onClick={() => setDifficulty(diff)}
                >
                  <span className="difficulty-emoji">{DIFFICULTY_INFO[diff].emoji}</span>
                  <div className="difficulty-text">
                    <strong>{DIFFICULTY_INFO[diff].label}</strong>
                    <span>{DIFFICULTY_INFO[diff].description}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Setting Selection */}
          <div className="setup-section">
            <label className="setup-label">
              <span className="label-icon">🏥</span>
              Clinical Setting
            </label>
            <div className="setting-options">
              {professionConfig.supportedSettings.map(s => (
                <button
                  key={s}
                  className={`setting-option ${setting === s ? 'selected' : ''}`}
                  onClick={() => setSetting(s)}
                >
                  <span className="setting-emoji">{SETTING_INFO[s].emoji}</span>
                  <span className="setting-label">{SETTING_INFO[s].label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Time Pressure */}
          <div className="setup-section">
            <label className="setup-label">
              <span className="label-icon">⏱️</span>
              Time Pressure
            </label>
            <div className="time-pressure-toggle">
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={timePressureEnabled}
                  onChange={e => setTimePressureEnabled(e.target.checked)}
                />
                <span className="toggle-slider"></span>
              </label>
              <span className="toggle-label">
                {timePressureEnabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>
            {timePressureEnabled && (
              <div className="turn-limit-selector">
                <label>Maximum turns:</label>
                <div className="turn-options">
                  {TURN_LIMITS.map(turns => (
                    <button
                      key={turns}
                      className={`turn-option ${maxTurns === turns ? 'selected' : ''}`}
                      onClick={() => setMaxTurns(turns)}
                    >
                      {turns}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="modal-footer case-setup-footer">
          <button onClick={handleStartRandom} className="btn-secondary">
            🎲 Start Random
          </button>
          <button onClick={handleStart} className="btn-primary">
            ▶️ Start with Setup
          </button>
        </div>
      </div>
    </div>
  );
}
