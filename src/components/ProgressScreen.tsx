import { useState, useMemo } from 'react';
import { ProgressData, Profession, SessionRecord } from '../types';
import { professionConfigs } from '../config/professionConfig';
import { getOverallStats, getProfessionStats, getStreakInfo, clearProgress } from '../utils/progressStorage';

interface ProgressScreenProps {
  progress: ProgressData;
  onBack: () => void;
  onRefresh: () => void;
}

type TabType = 'overview' | 'history' | 'professions';

export function ProgressScreen({ progress, onBack, onRefresh }: ProgressScreenProps) {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [selectedProfession, setSelectedProfession] = useState<Profession | 'all'>('all');
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const overallStats = useMemo(() => getOverallStats(progress.sessions), [progress.sessions]);
  const streakInfo = useMemo(() => getStreakInfo(progress.sessions), [progress.sessions]);

  const filteredSessions = useMemo(() => {
    if (selectedProfession === 'all') {
      return progress.sessions;
    }
    return progress.sessions.filter(s => s.profession === selectedProfession);
  }, [progress.sessions, selectedProfession]);

  const handleClearProgress = () => {
    clearProgress();
    onRefresh();
    setShowClearConfirm(false);
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return `Today at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffDays === 1) {
      return `Yesterday at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'var(--success)';
    if (score >= 60) return 'var(--warning)';
    return 'var(--error)';
  };

  const getGrade = (score: number) => {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  };

  return (
    <div className="progress-screen">
      <div className="progress-header">
        <button onClick={onBack} className="btn-back">
          ← Back
        </button>
        <h1>📊 Your Progress</h1>
        <button 
          onClick={() => setShowClearConfirm(true)} 
          className="btn-secondary btn-danger"
          disabled={progress.sessions.length === 0}
        >
          🗑️ Clear Data
        </button>
      </div>

      {/* Clear Confirmation Modal */}
      {showClearConfirm && (
        <div className="modal-overlay" onClick={() => setShowClearConfirm(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>⚠️ Clear All Progress?</h2>
              <button className="modal-close" onClick={() => setShowClearConfirm(false)}>×</button>
            </div>
            <div className="modal-body">
              <p>This will permanently delete all {progress.sessions.length} session records. This action cannot be undone.</p>
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowClearConfirm(false)} className="btn-secondary">
                Cancel
              </button>
              <button onClick={handleClearProgress} className="btn-primary btn-danger">
                🗑️ Clear All Data
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="progress-tabs">
        <button 
          className={`progress-tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          📈 Overview
        </button>
        <button 
          className={`progress-tab ${activeTab === 'professions' ? 'active' : ''}`}
          onClick={() => setActiveTab('professions')}
        >
          🏥 By Profession
        </button>
        <button 
          className={`progress-tab ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          📜 History
        </button>
      </div>

      <div className="progress-content">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="overview-tab">
            {progress.sessions.length === 0 ? (
              <div className="empty-state">
                <span className="empty-icon">📚</span>
                <h3>No sessions yet</h3>
                <p>Complete your first training session to start tracking your progress!</p>
                <button onClick={onBack} className="btn-primary">
                  Start Training
                </button>
              </div>
            ) : (
              <>
                {/* Stats Cards */}
                <div className="stats-grid">
                  <div className="stat-card">
                    <div className="stat-icon">🎯</div>
                    <div className="stat-value">{overallStats.totalSessions}</div>
                    <div className="stat-label">Total Sessions</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon">✅</div>
                    <div className="stat-value">
                      {overallStats.totalSessions > 0 
                        ? Math.round((overallStats.correctSessions / overallStats.totalSessions) * 100)
                        : 0}%
                    </div>
                    <div className="stat-label">Accuracy Rate</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon">📊</div>
                    <div className="stat-value">{overallStats.averageScore}</div>
                    <div className="stat-label">Average Score</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon">⏱️</div>
                    <div className="stat-value">{overallStats.totalPracticeTime}</div>
                    <div className="stat-label">Practice Time</div>
                  </div>
                </div>

                {/* Streak Info */}
                <div className="streak-section">
                  <h3>🔥 Practice Streak</h3>
                  <div className="streak-cards">
                    <div className="streak-car">
                      <div className="streak-value">{streakInfo.currentStreak}</div>
                      <div className="streak-label">Current Streak</div>
                    </div>
                    <div className="streak-card">
                      <div className="streak-value">{streakInfo.longestStreak}</div>
                      <div className="streak-label">Longest Streak</div>
                    </div>
                    <div className="streak-card">
                      <div className="streak-value">{streakInfo.lastPracticeDate || 'Never'}</div>
                      <div className="streak-label">Last Practice</div>
                    </div>
                  </div>
                </div>

                {/* Recent Performance Chart */}
                <div className="performance-section">
                  <h3>📈 Recent Performance</h3>
                  <div className="performance-chart">
                    {progress.sessions.slice(0, 10).reverse().map((session, idx) => (
                      <div key={session.id} className="chart-bar-container">
                        <div 
                          className="chart-bar"
                          style={{ 
                            height: `${session.score}%`,
                            backgroundColor: getScoreColor(session.score)
                          }}
                          title={`${session.score}% - ${professionConfigs[session.profession]?.name || session.profession}`}
                        />
                        <div className="chart-label">{idx + 1}</div>
                      </div>
                    ))}
                  </div>
                  <p className="chart-caption">Last {Math.min(10, progress.sessions.length)} sessions</p>
                </div>
              </>
            )}
          </div>
        )}

        {/* Professions Tab */}
        {activeTab === 'professions' && (
          <div className="professions-tab">
            {progress.sessions.length === 0 ? (
              <div className="empty-state">
                <span className="empty-icon">🏥</span>
                <h3>No data yet</h3>
                <p>Complete sessions to see your performance by profession.</p>
              </div>
            ) : (
              <div className="profession-stats-grid">
                {Object.values(professionConfigs).map(config => {
                  const stats = getProfessionStats(progress.sessions, config.id);
                  
                  return (
                    <div key={config.id} className="profession-stat-card">
                      <div className="profession-stat-header">
                        <span className="profession-stat-emoji">{config.emoji}</span>
                        <h4>{config.name}</h4>
                      </div>
                      
                      {stats.totalSessions === 0 ? (
                        <div className="profession-stat-empty">
                          <p>No sessions yet</p>
                        </div>
                      ) : (
                        <div className="profession-stat-body">
                          <div className="profession-stat-row">
                            <span>Sessions</span>
                            <strong>{stats.totalSessions}</strong>
                          </div>
                          <div className="profession-stat-row">
                            <span>Accuracy</span>
                            <strong>{Math.round((stats.correctSessions / stats.totalSessions) * 100)}%</strong>
                          </div>
                          <div className="profession-stat-row">
                            <span>Avg Score</span>
                            <strong style={{ color: getScoreColor(stats.averageScore) }}>
                              {stats.averageScore}
                            </strong>
                          </div>
                          <div className="profession-stat-row">
                            <span>Best Score</span>
                            <strong style={{ color: getScoreColor(stats.bestScore) }}>
                              {stats.bestScore}
                            </strong>
                          </div>
                          
                          {/* Mini chart */}
                          {stats.recentScores.length > 1 && (
                            <div className="mini-chart">
                              {stats.recentScores.slice(0, 5).reverse().map((score, idx) => (
                                <div 
                                  key={idx}
                                  className="mini-bar"
                                  style={{ 
                                    height: `${score}%`,
                                    backgroundColor: getScoreColor(score)
                                  }}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="history-tab">
            {/* Filter */}
            <div className="history-filter">
              <label>Filter by profession:</label>
              <select 
                value={selectedProfession} 
                onChange={e => setSelectedProfession(e.target.value as Profession | 'all')}
              >
                <option value="all">All Professions</option>
                {Object.values(professionConfigs).map(config => (
                  <option key={config.id} value={config.id}>
                    {config.emoji} {config.name}
                  </option>
                ))}
              </select>
            </div>

            {filteredSessions.length === 0 ? (
              <div className="empty-state">
                <span className="empty-icon">📜</span>
                <h3>No sessions found</h3>
                <p>{selectedProfession === 'all' 
                  ? 'Complete your first training session to see it here.'
                  : 'No sessions for this profession yet.'
                }</p>
              </div>
            ) : (
              <div className="history-list">
                {filteredSessions.map(session => {
                  const config = professionConfigs[session.profession];
                  
                  return (
                    <div key={session.id} className="history-item">
                      <div className="history-item-left">
                        <div className="history-item-icon">
                          {config?.emoji || '🏥'}
                        </div>
                        <div className="history-item-info">
                          <div className="history-item-title">
                            {config?.name || session.profession}
                            <span className={`history-badge ${session.correct ? 'correct' : 'incorrect'}`}>
                              {session.correct ? '✓' : '✗'}
                            </span>
                          </div>
                          <div className="history-item-diagnosis">
                            {session.diagnosis}
                          </div>
                          <div className="history-item-date">
                            {formatDate(session.timestamp)}
                          </div>
                        </div>
                      </div>
                      <div className="history-item-right">
                        <div 
                          className="history-score"
                          style={{ color: getScoreColor(session.score) }}
                        >
                          <span className="history-score-value">{session.score}</span>
                          <span className="history-score-grade">{getGrade(session.score)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}