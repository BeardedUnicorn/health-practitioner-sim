import { useState, useRef, useEffect } from 'react';
import './App.css';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface PatientSession {
  diagnosis: string;
  conversationHistory: Message[];
}

function App() {
  const [apiUrl, setApiUrl] = useState('http://localhost:1234/v1');
  const [apiKey, setApiKey] = useState('');
  const [modelName, setModelName] = useState('qwen/qwen3-4b-2507');
  const [isConfigured, setIsConfigured] = useState(false);
  
  const [session, setSession] = useState<PatientSession | null>(null);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ correct: boolean; message: string } | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [showToolkit, setShowToolkit] = useState(false);
  const [performingAssessment, setPerformingAssessment] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [session?.conversationHistory]);

  const startNewSession = async () => {
    setIsLoading(true);
    setFeedback(null);
    setShowAnswer(false);
    
    try {
      // First, ask the AI to generate a patient scenario with a diagnosis
      // Random category selection for variety
      const categories = [
        'Cardiovascular (e.g., heart failure, hypertensive crisis, angina, DVT, atrial fibrillation, myocardial infarction)',
        'Respiratory (e.g., pneumonia, COPD exacerbation, asthma attack, pulmonary embolism, bronchitis, tuberculosis)',
        'Gastrointestinal (e.g., appendicitis, bowel obstruction, GI bleed, cholecystitis, pancreatitis, diverticulitis, gastroenteritis)',
        'Neurological (e.g., stroke, TIA, seizure, meningitis, migraine, multiple sclerosis flare, Guillain-Barré)',
        'Infectious Disease (e.g., sepsis, cellulitis, UTI, pyelonephritis, influenza, COVID-19, mononucleosis)',
        'Endocrine (e.g., diabetic ketoacidosis, hypoglycemia, thyroid storm, Addisonian crisis, hyperosmolar state)',
        'Renal/Urological (e.g., acute kidney injury, kidney stones, urinary retention, renal failure)',
        'Musculoskeletal (e.g., fracture, osteomyelitis, septic arthritis, compartment syndrome, rhabdomyolysis)',
        'Hematological (e.g., anemia, sickle cell crisis, leukemia symptoms, thrombocytopenia)',
        'Psychiatric (e.g., panic attack, acute psychosis, severe depression, alcohol withdrawal, opioid overdose)',
        'Obstetric/Gynecological (e.g., ectopic pregnancy, preeclampsia, ovarian torsion, pelvic inflammatory disease)',
        'Dermatological (e.g., severe allergic reaction, Stevens-Johnson syndrome, herpes zoster, necrotizing fasciitis)',
        'Toxicological (e.g., drug overdose, poisoning, carbon monoxide exposure, medication reaction)',
        'Trauma (e.g., concussion, internal bleeding, burns, fall injuries in elderly)',
        'Pediatric conditions (e.g., croup, RSV, febrile seizure, intussusception, Kawasaki disease)',
        'Geriatric conditions (e.g., delirium, hip fracture, failure to thrive, pressure ulcer infection)'
      ];
      
      const randomCategory = categories[Math.floor(Math.random() * categories.length)];
      
      const setupPrompt = `You are a medical education system. Generate a realistic patient scenario for nurse training.

IMPORTANT: You MUST select a condition from this category: ${randomCategory}
Do NOT use Type 2 Diabetes or any diabetic condition unless the category specifically mentions it.
Be creative and pick different conditions each time.

You must respond in EXACTLY this format (including the labels):
DIAGNOSIS: [the specific medical condition/diagnosis from the category above]
PATIENT_PROFILE: [age, gender, and brief background - vary the demographics]
SYMPTOMS: [list of symptoms the patient is experiencing that match the diagnosis]

Example format:
DIAGNOSIS: Acute Appendicitis
PATIENT_PROFILE: 28-year-old male, office worker
SYMPTOMS: Severe abdominal pain in lower right quadrant, nausea, low-grade fever, loss of appetite

Now generate a patient with a condition from the ${randomCategory} category:`;

      const setupResponse = await fetch(`${apiUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: modelName,
          messages: [{ role: 'user', content: setupPrompt }],
          temperature: 0.9
        })
      });

      if (!setupResponse.ok) {
        throw new Error('Failed to connect to API');
      }

      const setupData = await setupResponse.json();
      const setupContent = setupData.choices[0].message.content;
      
      // Parse the diagnosis from the response
      const diagnosisMatch = setupContent.match(/DIAGNOSIS:\s*(.+?)(?:\n|$)/i);
      const diagnosis = diagnosisMatch ? diagnosisMatch[1].trim() : 'Unknown Condition';
      
      // Create the system prompt for the patient roleplay
      const systemPrompt = `You are ONLY roleplaying as a PATIENT, not a nurse or doctor. You are sick and seeking help.

YOUR PATIENT PROFILE AND CONDITION:
${setupContent}

CRITICAL INSTRUCTIONS - YOU MUST FOLLOW THESE:
1. You ARE the patient described above. Speak in first person as the patient.
2. You are NOT a medical professional. You do NOT give medical advice.
3. You are talking TO a nurse who is examining you.
4. Describe YOUR symptoms when asked. Say things like "I feel..." or "It hurts when..."
5. Show emotion appropriate to your condition (pain, worry, confusion, etc.)
6. Do NOT diagnose yourself. You don't know what's wrong - that's why you're seeing the nurse.
7. Do NOT reveal the diagnosis. You are a patient who doesn't know their diagnosis.
8. Keep responses to 1-3 sentences, speaking as a regular person would.
9. If asked about symptoms not listed, respond naturally (you might have mild ones or none).

Example responses:
- "My stomach has been hurting really bad since yesterday."
- "I feel nauseous and I haven't been able to eat anything."
- "It's a sharp pain, mostly on my right side."

Remember: You are the PATIENT. The user is the NURSE asking you questions.`;

      const initialHistory: Message[] = [
        { role: 'system', content: systemPrompt },
        { role: 'assistant', content: "Hello, I'm not feeling well. I think I need help..." }
      ];

      setSession({
        diagnosis: diagnosis,
        conversationHistory: initialHistory
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      alert(`Error starting session: ${message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!currentMessage.trim() || !session || isLoading) return;

    const userMessage = currentMessage.trim();
    setCurrentMessage('');

    // Check if this is a diagnosis attempt
    const diagnosisPattern = /you\s+have\s+(.+)/i;
    const diagnosisMatch = userMessage.match(diagnosisPattern);

    if (diagnosisMatch) {
      const nurseDiagnosis = diagnosisMatch[1].trim();
      const isCorrect = nurseDiagnosis.toLowerCase().includes(session.diagnosis.toLowerCase()) ||
                        session.diagnosis.toLowerCase().includes(nurseDiagnosis.toLowerCase());
      
      setFeedback({
        correct: isCorrect,
        message: isCorrect 
          ? `✅ Correct! The patient has ${session.diagnosis}.`
          : `❌ Incorrect. The patient has ${session.diagnosis}, not ${nurseDiagnosis}.`
      });
      
      // Add the diagnosis attempt to history
      setSession({
        ...session,
        conversationHistory: [
          ...session.conversationHistory,
          { role: 'user', content: userMessage }
        ]
      });
      return;
    }

    // Regular question - get patient response
    setIsLoading(true);

    const newHistory: Message[] = [
      ...session.conversationHistory,
      { role: 'user', content: userMessage }
    ];

    try {
      const response = await fetch(`${apiUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: modelName,
          messages: newHistory.map(msg => ({
            role: msg.role,
            content: msg.content
          })),
          temperature: 0.7
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get response from API');
      }

      const data = await response.json();
      const assistantMessage = data.choices[0].message.content;

      setSession({
        ...session,
        conversationHistory: [
          ...newHistory,
          { role: 'assistant', content: assistantMessage }
        ]
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      alert(`Error sending message: ${message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const performAssessment = async (assessmentType: string, assessmentName: string) => {
    if (!session || performingAssessment) return;

    setPerformingAssessment(true);

    const assessmentPrompt = `Based on the patient's condition (${session.diagnosis}), provide realistic ${assessmentName} results for a ${assessmentType} assessment. 

Respond with ONLY the assessment findings in a clear, clinical format. Be specific and use proper medical terminology. Keep it to 2-3 sentences maximum.

Examples:
- For vital signs: "Blood pressure: 145/92 mmHg, Heart rate: 98 bpm, Temperature: 101.2°F"
- For PEARL: "Pupils are equal, round, and reactive to light and accommodation. No signs of anisocoria."
- For assessment: Describe what you observe/find during the examination.

Provide the ${assessmentName} findings now:`;

    try {
      const response = await fetch(`${apiUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: modelName,
          messages: [
            { role: 'system', content: session.conversationHistory[0].content },
            { role: 'user', content: assessmentPrompt }
          ],
          temperature: 0.5
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get assessment results');
      }

      const data = await response.json();
      const assessmentResult = data.choices[0].message.content;

      // Add assessment to conversation history as a system-style message
      const assessmentMessage = `📋 ${assessmentName}: ${assessmentResult}`;
      
      setSession({
        ...session,
        conversationHistory: [
          ...session.conversationHistory,
          { role: 'user', content: `[Performed ${assessmentName}]` },
          { role: 'assistant', content: assessmentMessage }
        ]
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      alert(`Error performing assessment: ${message}`);
    } finally {
      setPerformingAssessment(false);
    }
  };

  if (!isConfigured) {
    return (
      <div className="app">
        <div className="config-container">
          <h1>🏥 Nurse Training Simulator</h1>
          <div className="config-form">
            <h2>Configure API Connection</h2>
            <div className="form-group">
              <label>API URL:</label>
              <input
                type="text"
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
                placeholder="http://localhost:1234/v1"
              />
            </div>
            <div className="form-group">
              <label>API Key (optional):</label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Leave empty if not required"
              />
            </div>
            <div className="form-group">
              <label>Model Name:</label>
              <input
                type="text"
                value={modelName}
                onChange={(e) => setModelName(e.target.value)}
                placeholder="local-model"
              />
            </div>
            <button onClick={() => setIsConfigured(true)} className="btn-primary">
              Start Training
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <div className="header">
        <h1>🏥 Nurse Training Simulator</h1>
        <button onClick={() => setIsConfigured(false)} className="btn-secondary">
          ⚙️ Settings
        </button>
      </div>

      {!session ? (
        <div className="start-container">
          <h2>Ready to practice your diagnostic skills?</h2>
          <p>You'll interact with a simulated patient. Ask questions to gather information, then provide your diagnosis.</p>
          <button onClick={startNewSession} disabled={isLoading} className="btn-primary btn-large">
            {isLoading ? 'Generating Patient...' : 'Start New Patient Session'}
          </button>
        </div>
      ) : (
        <div className="session-container">
          <div className="chat-container">
            <div className="messages">
              {session.conversationHistory
                .filter(msg => msg.role !== 'system')
                .map((msg, idx) => (
                  <div key={idx} className={`message ${msg.role}`}>
                    <div className="message-label">
                      {msg.role === 'user' ? '👨‍⚕️ Nurse' : '🤒 Patient'}
                    </div>
                    <div className="message-content">{msg.content}</div>
                  </div>
                ))}
              {isLoading && (
                <div className="message assistant">
                  <div className="message-label">🤒 Patient</div>
                  <div className="message-content typing">Thinking...</div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {feedback && (
              <div className={`feedback ${feedback.correct ? 'correct' : 'incorrect'}`}>
                {feedback.message}
                <button onClick={startNewSession} className="btn-primary" style={{ marginLeft: '1rem' }}>
                  New Patient
                </button>
              </div>
            )}

            <div className="input-container">
              <input
                type="text"
                value={currentMessage}
                onChange={(e) => setCurrentMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask the patient a question or diagnose: 'You have [condition]'"
                disabled={isLoading || !!feedback}
              />
              <button onClick={sendMessage} disabled={isLoading || !currentMessage.trim() || !!feedback} className="btn-primary">
                Send
              </button>
            </div>
            
            <div className="hint">
              💡 Tip: When ready to diagnose, type "You have [condition]"
            </div>
          </div>

          <div className="sidebar">
            <button onClick={startNewSession} className="btn-secondary" disabled={isLoading}>
              🔄 New Patient
            </button>
            
            <button 
              onClick={() => setShowToolkit(!showToolkit)} 
              className="btn-primary"
              style={{ marginTop: '0.5rem' }}
            >
              {showToolkit ? '✖️ Close Toolkit' : '🩺 Nursing Toolkit'}
            </button>

            {showToolkit && (
              <div className="info-box toolkit-box">
                <h3>🩺 Physical Assessment Tools</h3>
                <div className="toolkit-section">
                  <h4>Vital Signs</h4>
                  <button 
                    onClick={() => performAssessment('vitals', 'Blood Pressure')} 
                    disabled={performingAssessment}
                    className="toolkit-btn"
                  >
                    🩸 Blood Pressure
                  </button>
                  <button 
                    onClick={() => performAssessment('vitals', 'Temperature')} 
                    disabled={performingAssessment}
                    className="toolkit-btn"
                  >
                    🌡️ Temperature
                  </button>
                  <button 
                    onClick={() => performAssessment('vitals', 'Pulse & Heart Rate')} 
                    disabled={performingAssessment}
                    className="toolkit-btn"
                  >
                    💓 Pulse/HR
                  </button>
                  <button 
                    onClick={() => performAssessment('vitals', 'Respiratory Rate')} 
                    disabled={performingAssessment}
                    className="toolkit-btn"
                  >
                    🫁 Respiratory Rate
                  </button>
                  <button 
                    onClick={() => performAssessment('vitals', 'Oxygen Saturation (SpO2)')} 
                    disabled={performingAssessment}
                    className="toolkit-btn"
                  >
                    💨 O2 Saturation
                  </button>
                </div>

                <div className="toolkit-section">
                  <h4>Head & Neurological</h4>
                  <button 
                    onClick={() => performAssessment('neuro', 'PEARL (Pupil Exam)')} 
                    disabled={performingAssessment}
                    className="toolkit-btn"
                  >
                    👁️ PEARL
                  </button>
                  <button 
                    onClick={() => performAssessment('neuro', 'Level of Consciousness (LOC/GCS)')} 
                    disabled={performingAssessment}
                    className="toolkit-btn"
                  >
                    🧠 Consciousness
                  </button>
                  <button 
                    onClick={() => performAssessment('head', 'Ear Examination (Otoscopy)')} 
                    disabled={performingAssessment}
                    className="toolkit-btn"
                  >
                    👂 Ears
                  </button>
                  <button 
                    onClick={() => performAssessment('head', 'Throat & Mucous Membranes')} 
                    disabled={performingAssessment}
                    className="toolkit-btn"
                  >
                    👄 Throat/Mucus
                  </button>
                  <button 
                    onClick={() => performAssessment('head', 'Lymph Node Palpation (Neck/Jaw)')} 
                    disabled={performingAssessment}
                    className="toolkit-btn"
                  >
                    🔍 Lymph Nodes
                  </button>
                </div>

                <div className="toolkit-section">
                  <h4>Respiratory & Cardiac</h4>
                  <button 
                    onClick={() => performAssessment('resp', 'Lung Auscultation')} 
                    disabled={performingAssessment}
                    className="toolkit-btn"
                  >
                    🫁 Lung Sounds
                  </button>
                  <button 
                    onClick={() => performAssessment('cardiac', 'Heart Auscultation')} 
                    disabled={performingAssessment}
                    className="toolkit-btn"
                  >
                    ❤️ Heart Sounds
                  </button>
                </div>

                <div className="toolkit-section">
                  <h4>Abdominal</h4>
                  <button 
                    onClick={() => performAssessment('abd', 'Abdominal Palpation')} 
                    disabled={performingAssessment}
                    className="toolkit-btn"
                  >
                    🤰 Palpation
                  </button>
                  <button 
                    onClick={() => performAssessment('abd', 'Bowel Sound Auscultation')} 
                    disabled={performingAssessment}
                    className="toolkit-btn"
                  >
                    🔊 Bowel Sounds
                  </button>
                </div>

                <div className="toolkit-section">
                  <h4>Skin & Extremities</h4>
                  <button 
                    onClick={() => performAssessment('skin', 'Skin Assessment (Color, Turgor, Rash)')} 
                    disabled={performingAssessment}
                    className="toolkit-btn"
                  >
                    🖐️ Skin Exam
                  </button>
                  <button 
                    onClick={() => performAssessment('extremity', 'Peripheral Pulses & Edema')} 
                    disabled={performingAssessment}
                    className="toolkit-btn"
                  >
                    🦵 Extremities
                  </button>
                  <button 
                    onClick={() => performAssessment('extremity', 'Capillary Refill')} 
                    disabled={performingAssessment}
                    className="toolkit-btn"
                  >
                    💅 Cap Refill
                  </button>
                </div>

                <div className="toolkit-section">
                  <h4>Laboratory & Tests</h4>
                  <button 
                    onClick={() => performAssessment('lab', 'Accucheck (Blood Glucose)')} 
                    disabled={performingAssessment}
                    className="toolkit-btn"
                  >
                    💉 Accucheck
                  </button>
                  <button 
                    onClick={() => performAssessment('lab', 'Urinalysis')} 
                    disabled={performingAssessment}
                    className="toolkit-btn"
                  >
                    🧪 Urinalysis
                  </button>
                </div>

                <div className="toolkit-section">
                  <h4>Comprehensive Assessment</h4>
                  <button 
                    onClick={() => performAssessment('comprehensive', 'Head-to-Toe Assessment')} 
                    disabled={performingAssessment}
                    className="toolkit-btn toolkit-btn-full"
                  >
                    📋 Head-to-Toe Assessment
                  </button>
                </div>
              </div>
            )}

            <div className="info-box">
              <h3>How to Use</h3>
              <ol>
                <li>Ask the patient questions about their symptoms</li>
                <li>Use the Nursing Toolkit for physical assessments</li>
                <li>Gather information about their medical history</li>
                <li>When confident, provide diagnosis: "You have [condition]"</li>
                <li>Get instant feedback on your diagnosis</li>
              </ol>
            </div>
            <button 
              onClick={() => setShowAnswer(!showAnswer)} 
              className="btn-secondary"
              style={{ marginTop: '1rem' }}
            >
              {showAnswer ? '🙈 Hide Answer' : '👁️ Show Answer'}
            </button>
            {showAnswer && (
              <div className="info-box answer-box">
                <h3>⚠️ Answer</h3>
                <p className="answer-text">{session.diagnosis}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
