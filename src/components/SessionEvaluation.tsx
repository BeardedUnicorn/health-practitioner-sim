import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { ProfessionConfig, ApiConfig, Message, Profession } from '../types';
import { addSessionRecord } from '../utils/progressStorage';

interface SessionEvaluationProps {
  professionConfig: ProfessionConfig;
  apiConfig: ApiConfig;
  conversationHistory: Message[];
  diagnosis: string;
  userAnswer: string;
  wasCorrect: boolean;
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

export function SessionEvaluation({
  professionConfig,
  apiConfig,
  conversationHistory,
  diagnosis,
  userAnswer,
  wasCorrect,
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

  // Save progress when evaluation is complete
  useEffect(() => {
    if (evaluation && !hasSaved) {
      saveSessionProgress();
    }
  }, [evaluation, hasSaved]);

  const saveSessionProgress = () => {
    if (!evaluation) return;

    // Extract category from conversation if possible
    const systemMessage = conversationHistory.find(m => m.role === 'system')?.content || '';
    let category = 'Unknown';
    
    // Try to find category in system prompt
    const categoryMatch = systemMessage.match(/category[:\s]+([^\n]+)/i);
    if (categoryMatch) {
      category = categoryMatch[1].trim();
    }

    addSessionRecord({
      profession: professionConfig.id as Profession,
      category,
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

    const evaluationPrompt = `You are an expert ${professionConfig.name} educator evaluating a training session.

## Session Information
- Profession: ${professionConfig.name}
- Correct Answer/Condition: ${diagnosis}
- User's Final Answer: ${userAnswer}
- Answer Was Correct: ${wasCorrect ? 'Yes' : 'No'}

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

Evaluation criteria:
1. **Information Gathering**: Did they ask appropriate questions? Did they explore relevant symptoms, history, and context?
2. **Clinical Reasoning**: Did their questions show logical progression? Did they narrow down possibilities appropriately?
3. **Communication Skills**: Were they empathetic, clear, and professional? Did they build rapport?
4. **Safety Awareness**: Did they identify and address any red flags or safety concerns?
5. **Professional Approach**: Did they use appropriate assessment tools? Was their approach systematic?

Be specific in your feedback - reference actual things they said or didn't say.
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
      
      // Try to parse JSON from the response
      let jsonContent = content;
      
      // Handle case where response might have markdown code blocks
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