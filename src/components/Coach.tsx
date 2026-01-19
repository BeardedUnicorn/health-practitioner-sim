import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Profession, ApiConfig } from '../types';
import { professionConfigs } from '../config/professionConfig';

interface CoachProps {
  profession: Profession;
  sessionContext: string;
  conversationHistory: string;
  apiConfig: ApiConfig;
  onClose: () => void;
}

export function Coach({ profession, sessionContext, conversationHistory, apiConfig, onClose }: CoachProps) {
  const [coachAdvice, setCoachAdvice] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const professionConfig = professionConfigs[profession];

  useEffect(() => {
    if (conversationHistory) {
      generateCoachAdvice();
    }
  }, []);

  const generateCoachAdvice = async () => {
    setIsLoading(true);
    
    const coachPrompt = `You are an expert ${professionConfig.name} educator and coach. 
    
Based on this ${professionConfig.patientLabel.toLowerCase()} case:
${sessionContext}

Recent conversation:
${conversationHistory}

Provide helpful coaching to improve the ${professionConfig.userLabel.toLowerCase()}'s performance:

1. **Next Questions**: What specific questions should they ask to gather more information?
2. **Assessments**: Which assessment tools or techniques would be most valuable now?
3. **Missing Areas**: What important areas haven't been explored yet?
4. **Clinical Considerations**: Any red flags, safety concerns, or important factors to consider?

Keep advice concise, practical, and specific to this case. Use bullet points for clarity.`;

    try {
      const response = await fetch(`${apiConfig.apiUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiConfig.apiKey}`
        },
        body: JSON.stringify({
          model: apiConfig.modelName,
          messages: [{ role: 'user', content: coachPrompt }],
          temperature: 0.7
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get coach advice');
      }

      const data = await response.json();
      setCoachAdvice(data.choices[0].message.content);
    } catch (error) {
      setCoachAdvice('⚠️ Unable to generate coaching advice. Please check your API settings and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="side-panel-header">
        <h3>🎓 {professionConfig.name} Coach</h3>
        <button onClick={onClose} className="panel-close">×</button>
      </div>
      <div className="side-panel-content">
        {isLoading ? (
          <div className="coach-loading">
            <div className="loading-spinner"></div>
            <p>Analyzing conversation and generating guidance...</p>
          </div>
        ) : (
          <div className="coach-advice">
            <ReactMarkdown>{coachAdvice}</ReactMarkdown>
          </div>
        )}
      </div>
      <div className="side-panel-footer">
        <button onClick={generateCoachAdvice} disabled={isLoading} className="btn-secondary">
          🔄 Refresh Advice
        </button>
      </div>
    </>
  );
}