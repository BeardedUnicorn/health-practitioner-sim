import { useCallback, useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  ProfessionConfig,
  ApiConfig,
  Message,
  Profession,
  CaseSetup,
  Difficulty,
  ClinicalSetting,
  EvaluationResponsePayload,
} from '../types';
import { addSessionRecord } from '../utils/progressStorage';
import { useSessionContext } from '../features/session/state/session-context';
import { requestCompletionText } from '../shared/llm/client';
import { parseJsonObject } from '../shared/llm/json-parser';
import './SessionEvaluation.css';

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

type EvaluationData = EvaluationResponsePayload;

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

function buildCouplesTherapyEvaluationPrompt(
  conversationText: string,
  negativeCycle: string,
  userSummary: string,
): string {
  return `You are an expert couples therapy supervisor evaluating a training session.

## Session Information
- This was a couples therapy session with two partners
- The couple's negative cycle: ${negativeCycle}
- Trainee's session summary: ${userSummary}

## Full Session Transcript:
${conversationText}

## Evaluation Task
Evaluate this couples therapy session comprehensively.

You MUST respond in EXACTLY this JSON format (no other text, just valid JSON):
{
  "overallScore": <number 0-100>,
  "scoreBreakdown": [
    {"category": "Neutrality & Alliance Balance", "score": <0-15>, "maxScore": 15},
    {"category": "Accurate Reflection of Each Partner", "score": <0-15>, "maxScore": 15},
    {"category": "Cycle Identification & Naming", "score": <0-15>, "maxScore": 15},
    {"category": "De-escalation Skills", "score": <0-15>, "maxScore": 15},
    {"category": "Repair Facilitation", "score": <0-15>, "maxScore": 15},
    {"category": "Emotional Attunement", "score": <0-10>, "maxScore": 10},
    {"category": "Session Structure & Pacing", "score": <0-10>, "maxScore": 10},
    {"category": "Safety Awareness", "score": <0-5>, "maxScore": 5}
  ],
  "strengths": [
    "<specific strength with example from session>",
    "<specific strength with example from session>",
    "<specific strength with example from session>"
  ],
  "gaps": [
    "<specific missed opportunity or area for improvement>",
    "<specific missed opportunity or area for improvement>",
    "<specific missed opportunity or area for improvement>"
  ],
  "safetyFlags": [
    "<any safety concerns that were missed or mishandled, or empty array if none>"
  ],
  "suggestedActions": [
    "<specific intervention they should have used at a particular moment>",
    "<specific question or reflection they could have offered>",
    "<technique that would have helped at a specific point>"
  ],
  "nextSessionGoals": [
    "<concrete goal for next session based on this one>",
    "<concrete goal for next session based on this one>",
    "<concrete goal for next session based on this one>"
  ],
  "summary": "<2-3 sentence overall summary of the therapist's performance, noting key achievements and primary growth areas>"
}

## Evaluation Criteria for Couples Therapy:

1. **Neutrality & Alliance Balance**: Did they avoid taking sides? Did each partner feel heard? Did they show balanced attention and empathy to both?

2. **Accurate Reflection of Each Partner**: Did they accurately reflect each partner's feelings, needs, and perspective? Did they help partners feel understood?

3. **Cycle Identification & Naming**: Did they identify the negative interaction pattern? Did they help the couple see the cycle vs. blaming each other?

4. **De-escalation Skills**: When things heated up, did they slow it down effectively? Did they call timeouts when needed? Did they soften startups?

5. **Repair Facilitation**: Did they create opportunities for repair? Did they help partners own impact, express needs, and make requests?

6. **Emotional Attunement**: Did they track and name emotions accurately? Did they help access softer, underlying feelings?

7. **Session Structure & Pacing**: Did they manage the session well? Use structured techniques appropriately? Know when to intervene vs. let things unfold?

8. **Safety Awareness**: Were there any concerning dynamics (contempt, power imbalance, potential DV indicators) that needed attention?

Be specific - reference actual moments from the session. Note what worked AND what could improve.`;
}

function buildStandardEvaluationPrompt(
  conversationText: string,
  diagnosis: string,
  userAnswer: string,
  wasCorrect: boolean,
  professionConfig: ProfessionConfig,
  caseSetup?: CaseSetup,
  turnsUsed?: number,
): string {
  let settingContext = '';
  if (caseSetup?.setting) {
    const settingLabel = SETTING_LABELS[caseSetup.setting];
    settingContext = `\n\n## Clinical Setting Context
This session took place in a **${settingLabel}** setting.`;
  }

  let difficultyContext = '';
  if (caseSetup?.difficulty) {
    difficultyContext = `\n\n## Difficulty Level: ${DIFFICULTY_LABELS[caseSetup.difficulty]}`;
  }

  let timePressureContext = '';
  if (caseSetup?.timePressureEnabled && caseSetup.maxTurns && turnsUsed !== undefined) {
    timePressureContext = `\n\n## Time Pressure
The session had a ${caseSetup.maxTurns}-turn limit. The clinician used ${turnsUsed} turns.`;
  }

  return `You are an expert ${professionConfig.name} educator evaluating a training session.

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
  "summary": "<2-3 sentence overall summary of performance>"
}

Be specific in your feedback - reference actual things they said or didn't say.`;
}

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
  const { actions: sessionActions } = useSessionContext();
  const [evaluation, setEvaluation] = useState<EvaluationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasSaved, setHasSaved] = useState(false);

  const isCouplesTherapy = professionConfig.isCouplesTherapy;

  const saveSessionProgress = useCallback(() => {
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
  }, [caseSetup?.category, caseSetup?.difficulty, caseSetup?.maxTurns, caseSetup?.setting, caseSetup?.timePressureEnabled, diagnosis, evaluation, onProgressSaved, professionConfig.id, turnsUsed, userAnswer, wasCorrect]);

  const generateEvaluation = useCallback(async () => {
    setIsLoading(true);
    sessionActions.setError(null);

    const conversationText = conversationHistory
      .filter(msg => msg.role !== 'system')
      .map(msg => `${msg.role === 'user' ? professionConfig.userLabel : professionConfig.patientLabel}: ${msg.content}`)
      .join('\n');

    // Build evaluation prompt based on profession type
    let evaluationPrompt: string;
    
    if (isCouplesTherapy) {
      evaluationPrompt = buildCouplesTherapyEvaluationPrompt(conversationText, diagnosis, userAnswer);
    } else {
      evaluationPrompt = buildStandardEvaluationPrompt(
        conversationText,
        diagnosis,
        userAnswer,
        wasCorrect,
        professionConfig,
        caseSetup,
        turnsUsed,
      );
    }

    try {
      const content = await requestCompletionText(apiConfig, {
        model: apiConfig.modelName,
        messages: [{ role: 'user', content: evaluationPrompt }],
        temperature: 0.3,
      });

      const evaluationData = parseJsonObject<EvaluationData>(content);
      setEvaluation(evaluationData);
    } catch (err) {
      console.error('Evaluation error:', err);
      const message = err instanceof Error ? err.message : String(err);
      const isAuthError = message.includes('401') || message.includes('403') || message.toLowerCase().includes('unauthorized') || message.toLowerCase().includes('api key');

      sessionActions.setError({
        title: 'Evaluation failed',
        message: 'Unable to generate your session evaluation.',
        details: `Error: ${message}\nModel: ${apiConfig.modelName}\nEndpoint: ${apiConfig.apiUrl}`,
        isAuthError,
      });
    } finally {
      setIsLoading(false);
    }
  }, [apiConfig, caseSetup, conversationHistory, diagnosis, isCouplesTherapy, professionConfig, sessionActions, turnsUsed, userAnswer, wasCorrect]);

  useEffect(() => {
    void generateEvaluation();
  }, [generateEvaluation]);

  useEffect(() => {
    if (evaluation && !hasSaved) {
      saveSessionProgress();
    }
  }, [evaluation, hasSaved, saveSessionProgress]);

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
              <p>Analyzing your {isCouplesTherapy ? 'couples therapy session' : 'performance'}...</p>
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

              {/* Result Banner - different for couples therapy */}
              {isCouplesTherapy ? (
                <div className="evaluation-result couples">
                  <div className="result-icon">💑</div>
                  <div className="result-text">
                    <strong>Session Complete</strong>
                    <span>Couple&apos;s negative cycle: {diagnosis}</span>
                  </div>
                </div>
              ) : (
                <div className={`evaluation-result ${wasCorrect ? 'correct' : 'incorrect'}`}>
                  <div className="result-icon">{wasCorrect ? '✅' : '❌'}</div>
                  <div className="result-text">
                    <strong>{wasCorrect ? 'Correct!' : 'Incorrect'}</strong>
                    <span>The answer was: {diagnosis}</span>
                  </div>
                </div>
              )}

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
                  <h4>💡 {isCouplesTherapy ? 'Missed Opportunities' : 'Suggested Questions/Actions'}</h4>
                  <ul>
                    {evaluation.suggestedActions.map((action, idx) => (
                      <li key={idx}><ReactMarkdown>{action}</ReactMarkdown></li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Next Session Goals - Couples Therapy Only */}
              {isCouplesTherapy && evaluation.nextSessionGoals && evaluation.nextSessionGoals.length > 0 && (
                <div className="evaluation-section next-session">
                  <h4>🎯 Goals for Next Session</h4>
                  <ul>
                    {evaluation.nextSessionGoals.map((goal, idx) => (
                      <li key={idx}>{goal}</li>
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
            Review Session
          </button>
          <button onClick={onNewSession} className="btn-primary">
            🔄 New {isCouplesTherapy ? 'Couple' : professionConfig.patientLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
