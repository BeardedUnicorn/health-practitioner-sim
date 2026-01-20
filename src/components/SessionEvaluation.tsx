import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { ProfessionConfig, ApiConfig, Message, Profession, CaseSetup, Difficulty, ClinicalSetting } from '../types';
import { addSessionRecord } from '../utils/progressStorage';

interface SessionEvaluationProps {
  professionConfig: ProfessionConfig;
  apiConfig: ApiConfig;
  conversationHistory: Message[];
  diagnosis: string;
  userAnswer: string;
  wasCorrect: boolean;
  caseSetup?: CaseSetup;
  turnsUsed?: number;
  onNewSession: () => void;
  onClose: () => void;
  onProgressSaved?: () => void;
}

interface EvaluationData {
  overallScore: number;
  scoreBreakdown: {
    category: string;
    score: number;
    maxScore: number;
  }[];
  strengths: string[];
  gaps: string[];
  safetyFlags: string[];
  suggestedActions: string[];
  summary: string;
}

const SETTING_LABELS: Record<ClinicalSetting, string> = {
  clinic: 'Outpatient Clinic',
  emergency: 'Emergency Department',
  telehealth: 'Telehealth/Virtual',
  inpatient: 'Inpatient/Hospital',
  labor_delivery: 'Labor & Delivery',
  home: 'Home Visit',
  birth_center: 'Birth Center'
};

const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced'
};

export function SessionEvaluation({
  professionConfig,
  apiConfig,
  conversationHistory,
  diagnosis,
  userAnswer,
  wasCorrect,
  caseSetup,
  turnsUsed,
  onNewSession,
  onClose,
  onProgressSaved
}: SessionEvaluationProps) {
  const [evaluation, setEvaluation] = useState<EvaluationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasSaved, setHasSaved] = useState(false);

  useEffect(() => {
    generateEvaluation();
  }, []);

  useEffect(() => {
    if (evaluation && !hasSaved) {
      saveSessionProgress();
    }
  }, [evaluation, hasSaved]);

  const saveSessionProgress = () => {
    if (!evaluation) return;

    addSessionRecord({
      profession: professionConfig.id as Profession,
      category: caseSetup?.category || 'Random',
      difficulty: caseSetup?.difficulty,
      setting: caseSetup?.setting,
      timePressureEnabled: caseSetup?.timePressureEnabled,
      maxTurns: caseSetup?.maxTurns,
      turnsUsed,
      diagnosis,
      userAnswer,
      correct: wasCorrect,
      score: evaluation.overallScore,
      summary: evaluation.summary,
      strengths: evaluation.strengths,
      gaps: evaluation.gaps,
      safetyFlags: evaluation.safetyFlags
    });

    setHasSaved(true);
    onProgressSaved?.();
  };

  const generateEvaluation = async () => {
    setIsLoading(true);
    setError(null);

    const conversationText = conversationHistory
      .filter(msg => msg.role !== 'system')
      .map(msg => `${msg.role === 'user' ? professionConfig.userLabel : professionConfig.patientLabel}: ${msg.content}`)
      .join('\n');

    // Build context-aware evaluation prompt
    let settingContext = '';
    if (caseSetup?.setting) {
      const settingLabel = SETTING_LABELS[caseSetup.setting];
      settingContext = `\n\n## Clinical Setting Context
This session took place in a **${settingLabel}** setting. Please consider the constraints and expectations of this setting when evaluating:`;
      
      switch (caseSetup.setting) {
        case 'telehealth':
          settingContext += `
- Physical examination was limited to visual observation
- Vital signs may not have been directly obtainable
- The clinician had to rely more heavily on patient self-report
- Consider whether they appropriately acknowledged these limitations
- Evaluate if they made appropriate recommendations for in-person follow-up when needed`;
          break;
        case 'emergency':
          settingContext += `
- Time pressure and urgency were factors
- Focus should be on identifying emergent conditions
- Triage and stabilization take priority
- Red flags and safety concerns are especially critical`;
          break;
        case 'home':
          settingContext += `
- Limited equipment and resources available
- Environmental assessment was possible
- Consider how well they utilized the home environment context
- Safety planning in the home context should be evaluated`;
          break;
        case 'labor_delivery':
          settingContext += `
- Focus on maternal and fetal wellbeing
- Time-sensitive nature of labor progression
- Consider support and advocacy aspects
- Birth preferences and patient autonomy are important`;
          break;
        default:
          settingContext += `
- Standard clinical resources were available
- Full examination capabilities were present`;
      }
    }

    let difficultyContext = '';
    if (caseSetup?.difficulty) {
      difficultyContext = `\n\n## Difficulty Level: ${DIFFICULTY_LABELS[caseSetup.difficulty]}`;
      switch (caseSetup.difficulty) {
        case 'beginner':
          difficultyContext += `
The case was designed with straightforward, classic presentation. Evaluation should focus on fundamental skills.`;
          break;
        case 'intermediate':
          difficultyContext += `
The case included comorbidities and/or ambiguous symptoms. Acknowledge the complexity when evaluating.`;
          break;
        case 'advanced':
          difficultyContext += `
The case featured a poor historian, conflicting information, or red herrings. Give credit for navigating these challenges.`;
          break;
      }
    }

    let timePressureContext = '';
    if (caseSetup?.timePressureEnabled && caseSetup.maxTurns && turnsUsed !== undefined) {
      timePressureContext = `\n\n## Time Pressure
The session had a ${caseSetup.maxTurns}-turn limit. The clinician used ${turnsUsed} turns. Consider efficiency in your evaluation.`;
    }

    const evaluationPrompt = `You are an expert ${professionConfig.name} educator evaluating a training session.

## Session Information
- Profession: ${professionConfig.name}
- Category: ${caseSetup?.category || 'Random'}
- Correct Answer/Condition: ${diagnosis}
- User's Final Answer: ${userAnswer}
- Answer Was Correct: ${wasCorrect ? 'Yes' : 'No'}
${settingContext}${difficultyContext}${timePressureContext}

## Full Conversation:
${conversationText}

## Evaluation Task
Analyze this ${professionConfig.name.toLowerCase()} training session and provide a comprehensive evaluation.

You MUST respond in EXACTLY this JSON format (no other text, just valid JSON):
{
  "overallScore": <number 0-100>,
  "scoreBreakdown": [
    {"category": "Information Gathering", "score": <0-20>, "maxScore": 20},
    {"category": "Clinical Reasoning", "score": <0-20>, "maxScore": 20},
    {"category": "Communication Skills", "score": <0-20>, "maxScore": 20},
    {"category": "Safety Awareness", "score": <0-20>, "maxScore": 20},
    {"category": "Professional Approach", "score": <0-20>, "maxScore": 20}
  ],
  "strengths": [
    "<specific strength 1>",
    "<specific strength 2>",
    "<specific strength 3>"
  ],
  "gaps": [
    "<specific gap or missed area 1>",
    "<specific gap or missed area 2>",
    "<specific gap or missed area 3>"
  ],
  "safetyFlags": [
    "<any safety concerns or red flags that were missed or mishandled, or empty array if none>"
  ],
  "suggestedActions": [
    "<specific question or action they should have taken 1>",
    "<specific question or action they should have taken 2>",
    "<specific question or action they should have taken 3>"
  ],
  "summary": "<2-3 sentence overall summary of performance, acknowledging the specific setting/difficulty context>"
}

Evaluation criteria:
1. **Information Gathering**: Did they ask appropriate questions? Did they explore relevant symptoms, history, and context?
2. **Clinical Reasoning**: Did their questions show logical progression? Did they narrow down possibilities appropriately?
3. **Communication Skills**: Were they empathetic, clear, and professional? Did they build rapport?
4. **Safety Awareness**: Did they identify and address any red flags or safety concerns?
5. **Professional Approach**: Did they use appropriate assessment tools? Was their approach systematic?

Be specific in your feedback - reference actual things they said or didn't say.
${caseSetup?.setting === 'telehealth' ? 'Acknowledge telehealth limitations in your feedback.' : ''}
For safety flags, only include genuine safety concerns that were missed (leave empty array if none).`;

    try {
      const response = await fetch(`${apiConfig.apiUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiConfig.apiKey}`
        },
        body: JSON.stringify({
          model: apiConfig.modelName,
          messages: [{ role: 'user', content: evaluationPrompt }],
          temperature: 0.3
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate evaluation');
      }

      const data = await response.json();
      const content = data.choices[0].message.content;
      
      let jsonContent = content;
      
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        jsonContent = jsonMatch[1];
      }
      
      const evaluationData: EvaluationData = JSON.parse(jsonContent.trim());
      setEvaluation(evaluationData);
    } catch (err) {
      console.error('Evaluation error:', err);
      setError('Unable to generate evaluation. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getScoreColor = (score: number, maxScore: number) => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 80) return 'var(--success)';
    if (percentage >= 60) return 'var(--warning)';
    return 'var(--error)';
  };

  const getOverallGrade = (score: number) => {
    if (score >= 90) return { grade: 'A', label: 'Excellent' };
    if (score >= 80) return { grade: 'B', label: 'Good' };
    if (score >= 70) return { grade: 'C', label: 'Satisfactory' };
    if (score >= 60) return { grade: 'D', label: 'Needs Improvement' };
    return { grade: 'F', label: 'Unsatisfactory' };
  };

  return (
    <div className="evaluation-overlay">
      <div className="evaluation-panel">
        <div className="evaluation-header">
          <h2>📊 Session Evaluation</h2>
          <button className="panel-close" onClick={onClose}>×</button>
        </div>

        <div className="evaluation-content">
          {isLoading ? (
            <div className="evaluation-loading">
              <div className="loading-spinner"></div>
              <p>Analyzing your performance...</p>
            </div>
          ) : error ? (
            <div className="evaluation-error">
              <p>⚠️ {error}</p>
              <button onClick={generateEvaluation} className="btn-secondary">
                🔄 Retry
              </button>
            </div>
          ) : evaluation ? (
            <>
              {/* Case Setup Info */}
              {caseSetup && (
                <div className="evaluation-setup-info">
                  <div className="setup-info-item">
                    <span className="setup-info-label">Category:</span>
                    <span className="setup-info-value">{caseSetup.category}</span>
                  </div>
                  <div className="setup-info-item">
                    <span className="setup-info-label">Difficulty:</span>
                    <span className={`setup-info-value difficulty-${caseSetup.difficulty}`}>
                      {DIFFICULTY_LABELS[caseSetup.difficulty]}
                    </span>
                  </div>
                  <div className="setup-info-item">
                    <span className="setup-info-label">Setting:</span>
                    <span className="setup-info-value">{SETTING_LABELS[caseSetup.setting]}</span>
                  </div>
                  {caseSetup.timePressureEnabled && turnsUsed !== undefined && (
                    <div className="setup-info-item">
                      <span className="setup-info-label">Turns:</span>
                      <span className="setup-info-value">{turnsUsed}/{caseSetup.maxTurns}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Result Banner */}
              <div className={`evaluation-result ${wasCorrect ? 'correct' : 'incorrect'}`}>
                <div className="result-icon">{wasCorrect ? '✅' : '❌'}</div>
                <div className="result-text">
                  <strong>{wasCorrect ? 'Correct!' : 'Incorrect'}</strong>
                  <span>The answer was: {diagnosis}</span>
                </div>
              </div>

              {/* Overall Score */}
              <div className="evaluation-score-section">
                <div className="overall-score">
                  <div 
                    className="score-circle"
                    style={{ 
                      background: `conic-gradient(${getScoreColor(evaluation.overallScore, 100)} ${evaluation.overallScore * 3.6}deg, var(--bg-elevated) 0deg)` 
                    }}
                  >
                    <div className="score-inner">
                      <span className="score-number">{evaluation.overallScore}</span>
                      <span className="score-label">{getOverallGrade(evaluation.overallScore).grade}</span>
                    </div>
                  </div>
                  <div className="score-description">
                    <h3>{getOverallGrade(evaluation.overallScore).label}</h3>
                    <p>{evaluation.summary}</p>
                  </div>
                </div>
              </div>

              {/* Score Breakdown */}
              <div className="evaluation-breakdown">
                <h4>Score Breakdown</h4>
                <div className="breakdown-bars">
                  {evaluation.scoreBreakdown.map((item, idx) => (
                    <div key={idx} className="breakdown-item">
                      <div className="breakdown-label">
                        <span>{item.category}</span>
                        <span>{item.score}/{item.maxScore}</span>
                      </div>
                      <div className="breakdown-bar">
                        <div 
                          className="breakdown-fill"
                          style={{ 
                            width: `${(item.score / item.maxScore) * 100}%`,
                            backgroundColor: getScoreColor(item.score, item.maxScore)
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Strengths */}
              {evaluation.strengths.length > 0 && (
                <div className="evaluation-section strengths">
                  <h4>💪 Strengths</h4>
                  <ul>
                    {evaluation.strengths.map((strength, idx) => (
                      <li key={idx}>{strength}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Gaps */}
              {evaluation.gaps.length > 0 && (
                <div className="evaluation-section gaps">
                  <h4>📝 Areas for Improvement</h4>
                  <ul>
                    {evaluation.gaps.map((gap, idx) => (
                      <li key={idx}>{gap}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Safety Flags */}
              {evaluation.safetyFlags.length > 0 && (
                <div className="evaluation-section safety">
                  <h4>🚨 Safety Concerns</h4>
                  <ul>
                    {evaluation.safetyFlags.map((flag, idx) => (
                      <li key={idx}>{flag}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Suggested Actions */}
              {evaluation.suggestedActions.length > 0 && (
                <div className="evaluation-section suggestions">
                  <h4>💡 Suggested Questions/Actions</h4>
                  <ul>
                    {evaluation.suggestedActions.map((action, idx) => (
                      <li key={idx}><ReactMarkdown>{action}</ReactMarkdown></li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Saved indicator */}
              {hasSaved && (
                <div className="evaluation-saved">
                  ✓ Progress saved
                </div>
              )}
            </>
          ) : null}
        </div>

        <div className="evaluation-footer">
          <button onClick={onClose} className="btn-secondary">
            Review Conversation
          </button>
          <button onClick={onNewSession} className="btn-primary">
            🔄 New {professionConfig.patientLabel}
          </button>
        </div>
      </div>
    </div>
  );
}