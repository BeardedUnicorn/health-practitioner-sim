import { ProfessionConfig, Difficulty, ClinicalSetting } from '../types';

const getDifficultyInstructions = (difficulty?: Difficulty): string => {
  switch (difficulty) {
    case 'beginner':
      return `DIFFICULTY: BEGINNER
- Present classic, textbook symptoms
- Be a clear historian who answers questions directly
- No significant comorbidities or confounding factors
- Symptoms clearly point to the diagnosis`;
    case 'intermediate':
      return `DIFFICULTY: INTERMEDIATE
- Include 1-2 comorbidities that may complicate the picture
- Some symptoms may be atypical or ambiguous
- May have mild anxiety about symptoms that affects presentation
- Include relevant but potentially distracting past medical history`;
    case 'advanced':
      return `DIFFICULTY: ADVANCED
- Be a poor historian: vague, tangential, or inconsistent at times
- Include conflicting information that requires clarification
- Add red herrings or distracting symptoms unrelated to main diagnosis
- May minimize or exaggerate certain symptoms
- May have cultural or personal beliefs affecting symptom description
- Can be emotionally distressed, making history-taking challenging`;
    default:
      return '';
  }
};

const getSettingInstructions = (setting?: ClinicalSetting): string => {
  switch (setting) {
    case 'telehealth':
      return `SETTING: TELEHEALTH/VIRTUAL
- You are speaking via video call
- Physical examination is limited to what can be observed on camera
- May have occasional technical difficulties (brief lag, unclear audio)
- Describe visible symptoms when asked but remind them you can't be physically examined
- May need to self-report vital signs if you have equipment at home`;
    case 'emergency':
      return `SETTING: EMERGENCY DEPARTMENT
- You came to the ED because symptoms are acute/severe
- Show appropriate urgency and distress
- May be in pain or discomfort that affects your responses
- Other patients and noise may be referenced
- Time feels critical`;
    case 'inpatient':
      return `SETTING: INPATIENT/HOSPITAL
- You are already admitted to the hospital
- May be fatigued from being in the hospital
- Can reference other staff who have seen you
- May have IV, monitors, or other equipment`;
    case 'home':
      return `SETTING: HOME VISIT
- The clinician has come to your home
- You are in your comfortable environment
- Home environment details can be observed
- May have family members present`;
    case 'labor_delivery':
      return `SETTING: LABOR & DELIVERY
- You are in a birthing setting
- Contractions or labor progress affect your responses
- May need breaks during intense moments
- Support people may be present`;
    case 'birth_center':
      return `SETTING: BIRTH CENTER
- Low-intervention birthing environment
- More home-like setting
- Midwifery model of care`;
    case 'clinic':
    default:
      return `SETTING: OUTPATIENT CLINIC
- Standard clinical environment
- Full examination capabilities available
- Routine appointment setting`;
  }
};

export const nurseConfig: ProfessionConfig = {
  id: 'nurse',
  name: 'Nurse',
  emoji: '👨‍⚕️',
  title: 'Nurse Training Simulator',
  description: 'Practice diagnosing patients with various medical conditions through patient interviews and physical assessments.',
  userLabel: 'Nurse',
  userEmoji: '👨‍⚕️',
  patientLabel: 'Patient',
  patientEmoji: '🤒',
  diagnosisHint: '💡 Tip: When ready to diagnose, type "You have [condition]"',
  diagnosisPattern: /you\s+have\s+(.+)/i,
  supportedSettings: ['clinic', 'emergency', 'telehealth', 'inpatient'],
  defaultSetting: 'clinic',
  categories: [
    'Cardiovascular (e.g., heart failure, hypertensive crisis, angina, DVT, atrial fibrillation, myocardial infarction)',
    'Respiratory (e.g., pneumonia, COPD exacerbation, asthma attack, pulmonary embolism, bronchitis, tuberculosis)',
    'Gastrointestinal (e.g., appendicitis, bowel obstruction, GI bleed, cholecystitis, pancreatitis, diverticulitis)',
    'Neurological (e.g., stroke, TIA, seizure, meningitis, migraine, multiple sclerosis flare)',
    'Infectious Disease (e.g., sepsis, cellulitis, UTI, pyelonephritis, influenza, COVID-19)',
    'Endocrine (e.g., diabetic ketoacidosis, hypoglycemia, thyroid storm, Addisonian crisis)',
    'Renal/Urological (e.g., acute kidney injury, kidney stones, urinary retention)',
    'Musculoskeletal (e.g., fracture, osteomyelitis, septic arthritis, compartment syndrome)',
    'Hematological (e.g., anemia, sickle cell crisis, leukemia symptoms, thrombocytopenia)',
    'Obstetric/Gynecological (e.g., ectopic pregnancy, preeclampsia, ovarian torsion)',
    'Dermatological (e.g., severe allergic reaction, Stevens-Johnson syndrome, herpes zoster)',
    'Toxicological (e.g., drug overdose, poisoning, carbon monoxide exposure)',
    'Trauma (e.g., concussion, internal bleeding, burns, fall injuries)',
    'Pediatric conditions (e.g., croup, RSV, febrile seizure, intussusception)',
    'Geriatric conditions (e.g., delirium, hip fracture, failure to thrive)'
  ],
  toolkit: [
    {
      title: 'Vital Signs',
      items: [
        { id: 'bp', label: 'Blood Pressure', emoji: '🩸', assessmentType: 'vitals', assessmentName: 'Blood Pressure' },
        { id: 'temp', label: 'Temperature', emoji: '🌡️', assessmentType: 'vitals', assessmentName: 'Temperature' },
        { id: 'pulse', label: 'Pulse/HR', emoji: '💓', assessmentType: 'vitals', assessmentName: 'Pulse & Heart Rate' },
        { id: 'rr', label: 'Respiratory Rate', emoji: '🫁', assessmentType: 'vitals', assessmentName: 'Respiratory Rate' },
        { id: 'spo2', label: 'O2 Saturation', emoji: '💨', assessmentType: 'vitals', assessmentName: 'Oxygen Saturation (SpO2)' }
      ]
    },
    {
      title: 'Head & Neurological',
      items: [
        { id: 'pearl', label: 'PEARL', emoji: '👁️', assessmentType: 'neuro', assessmentName: 'PEARL (Pupil Exam)' },
        { id: 'loc', label: 'Consciousness', emoji: '🧠', assessmentType: 'neuro', assessmentName: 'Level of Consciousness (LOC/GCS)' },
        { id: 'ears', label: 'Ears', emoji: '👂', assessmentType: 'head', assessmentName: 'Ear Examination (Otoscopy)' },
        { id: 'throat', label: 'Throat/Mucus', emoji: '👄', assessmentType: 'head', assessmentName: 'Throat & Mucous Membranes' },
        { id: 'lymph', label: 'Lymph Nodes', emoji: '🔍', assessmentType: 'head', assessmentName: 'Lymph Node Palpation' }
      ]
    },
    {
      title: 'Respiratory & Cardiac',
      items: [
        { id: 'lungs', label: 'Lung Sounds', emoji: '🫁', assessmentType: 'resp', assessmentName: 'Lung Auscultation' },
        { id: 'heart', label: 'Heart Sounds', emoji: '❤️', assessmentType: 'cardiac', assessmentName: 'Heart Auscultation' }
      ]
    },
    {
      title: 'Abdominal',
      items: [
        { id: 'palp', label: 'Palpation', emoji: '🤰', assessmentType: 'abd', assessmentName: 'Abdominal Palpation' },
        { id: 'bowel', label: 'Bowel Sounds', emoji: '🔊', assessmentType: 'abd', assessmentName: 'Bowel Sound Auscultation' }
      ]
    },
    {
      title: 'Skin & Extremities',
      items: [
        { id: 'skin', label: 'Skin Exam', emoji: '🖐️', assessmentType: 'skin', assessmentName: 'Skin Assessment (Color, Turgor, Rash)' },
        { id: 'periph', label: 'Extremities', emoji: '🦵', assessmentType: 'extremity', assessmentName: 'Peripheral Pulses & Edema' },
        { id: 'cap', label: 'Cap Refill', emoji: '💅', assessmentType: 'extremity', assessmentName: 'Capillary Refill' }
      ]
    },
    {
      title: 'Laboratory & Tests',
      items: [
        { id: 'glucose', label: 'Accucheck', emoji: '💉', assessmentType: 'lab', assessmentName: 'Accucheck (Blood Glucose)' },
        { id: 'urine', label: 'Urinalysis', emoji: '🧪', assessmentType: 'lab', assessmentName: 'Urinalysis' }
      ]
    },
    {
      title: 'Comprehensive',
      items: [
        { id: 'h2t', label: 'Head-to-Toe Assessment', emoji: '📋', assessmentType: 'comprehensive', assessmentName: 'Head-to-Toe Assessment' }
      ]
    }
  ],
  getSetupPrompt: (category: string, difficulty?: Difficulty, setting?: ClinicalSetting) => `You are a medical education system. Generate a realistic patient scenario for nurse training.

IMPORTANT: You MUST select a condition from this category: ${category}
Do NOT use Type 2 Diabetes or any diabetic condition unless the category specifically mentions it.
Be creative and pick different conditions each time.

${getDifficultyInstructions(difficulty)}
${getSettingInstructions(setting)}

You must respond in EXACTLY this format (including the labels):
DIAGNOSIS: [the specific medical condition/diagnosis from the category above]
PATIENT_PROFILE: [age, gender, and brief background - vary the demographics]
SYMPTOMS: [list of symptoms the patient is experiencing that match the diagnosis]

Example format:
DIAGNOSIS: Acute Appendicitis
PATIENT_PROFILE: 28-year-old male, office worker
SYMPTOMS: Severe abdominal pain in lower right quadrant, nausea, low-grade fever, loss of appetite

Now generate a patient with a condition from the ${category} category:`,

  getSystemPrompt: (setupContent: string, difficulty?: Difficulty, setting?: ClinicalSetting) => `You are ONLY roleplaying as a PATIENT, not a nurse or doctor. You are sick and seeking help.

YOUR PATIENT PROFILE AND CONDITION:
${setupContent}

${getDifficultyInstructions(difficulty)}
${getSettingInstructions(setting)}

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

Remember: You are the PATIENT. The user is the NURSE asking you questions.`,

  getAssessmentPrompt: (diagnosis: string, assessmentName: string, assessmentType: string) => 
    `Based on the patient's condition (${diagnosis}), provide realistic ${assessmentName} results for a ${assessmentType} assessment. 

Respond with ONLY the assessment findings in a clear, clinical format. Be specific and use proper medical terminology. Keep it to 2-3 sentences maximum.

Provide the ${assessmentName} findings now:`
};

export const psychiatristConfig: ProfessionConfig = {
  id: 'psychiatrist',
  name: 'Psychiatrist',
  emoji: '🧠',
  title: 'Psychiatry Training Simulator',
  description: 'Practice psychiatric evaluation and diagnosis through patient interviews and mental status examinations.',
  userLabel: 'Psychiatrist',
  userEmoji: '👨‍⚕️',
  patientLabel: 'Patient',
  patientEmoji: '😔',
  diagnosisHint: '💡 Tip: When ready to diagnose, type "My diagnosis is [condition]"',
  diagnosisPattern: /my\s+diagnosis\s+is\s+(.+)/i,
  supportedSettings: ['clinic', 'emergency', 'telehealth', 'inpatient'],
  defaultSetting: 'clinic',
  categories: [
    'Mood Disorders (e.g., Major Depressive Disorder, Bipolar I, Bipolar II, Cyclothymia, Persistent Depressive Disorder)',
    'Anxiety Disorders (e.g., Generalized Anxiety Disorder, Panic Disorder, Social Anxiety, Specific Phobias, Agoraphobia)',
    'Psychotic Disorders (e.g., Schizophrenia, Schizoaffective Disorder, Brief Psychotic Disorder, Delusional Disorder)',
    'Trauma & Stress Disorders (e.g., PTSD, Acute Stress Disorder, Adjustment Disorder)',
    'Obsessive-Compulsive & Related (e.g., OCD, Body Dysmorphic Disorder, Hoarding Disorder, Trichotillomania)',
    'Personality Disorders (e.g., Borderline, Narcissistic, Antisocial, Avoidant, Dependent, Schizoid)',
    'Substance Use Disorders (e.g., Alcohol Use Disorder, Opioid Use Disorder, Stimulant Use Disorder, Cannabis Use Disorder)',
    'Eating Disorders (e.g., Anorexia Nervosa, Bulimia Nervosa, Binge Eating Disorder)',
    'Neurodevelopmental (e.g., ADHD, Autism Spectrum Disorder in adults)',
    'Dissociative Disorders (e.g., Dissociative Identity Disorder, Depersonalization/Derealization)',
    'Somatic Symptom Disorders (e.g., Somatic Symptom Disorder, Illness Anxiety Disorder, Conversion Disorder)',
    'Sleep-Wake Disorders (e.g., Insomnia Disorder, Narcolepsy, Nightmare Disorder)',
    'Neurocognitive Disorders (e.g., Delirium, Major Neurocognitive Disorder/Dementia)',
    'Impulse Control Disorders (e.g., Intermittent Explosive Disorder, Kleptomania, Pyromania)'
  ],
  toolkit: [
    {
      title: 'Mental Status Exam',
      items: [
        { id: 'appearance', label: 'Appearance & Behavior', emoji: '👤', assessmentType: 'mse', assessmentName: 'Appearance, Behavior, and Psychomotor Activity' },
        { id: 'speech', label: 'Speech Assessment', emoji: '🗣️', assessmentType: 'mse', assessmentName: 'Speech (Rate, Rhythm, Volume, Tone)' },
        { id: 'mood', label: 'Mood & Affect', emoji: '😊', assessmentType: 'mse', assessmentName: 'Mood (subjective) and Affect (objective)' },
        { id: 'thought_process', label: 'Thought Process', emoji: '💭', assessmentType: 'mse', assessmentName: 'Thought Process (linear, tangential, circumstantial, loose)' },
        { id: 'thought_content', label: 'Thought Content', emoji: '🧩', assessmentType: 'mse', assessmentName: 'Thought Content (delusions, obsessions, phobias, suicidal/homicidal ideation)' },
        { id: 'perception', label: 'Perceptions', emoji: '👁️', assessmentType: 'mse', assessmentName: 'Perceptual Disturbances (hallucinations, illusions)' },
        { id: 'cognition', label: 'Cognition', emoji: '🧠', assessmentType: 'mse', assessmentName: 'Cognition (orientation, attention, memory, concentration)' },
        { id: 'insight', label: 'Insight & Judgment', emoji: '💡', assessmentType: 'mse', assessmentName: 'Insight and Judgment' }
      ]
    },
    {
      title: 'Risk Assessment',
      items: [
        { id: 'suicide', label: 'Suicide Risk', emoji: '⚠️', assessmentType: 'risk', assessmentName: 'Suicide Risk Assessment (ideation, plan, intent, means, protective factors)' },
        { id: 'homicide', label: 'Homicide Risk', emoji: '🚨', assessmentType: 'risk', assessmentName: 'Homicide/Violence Risk Assessment' },
        { id: 'self_harm', label: 'Self-Harm History', emoji: '🩹', assessmentType: 'risk', assessmentName: 'Non-Suicidal Self-Injury Assessment' }
      ]
    },
    {
      title: 'Screening Tools',
      items: [
        { id: 'phq9', label: 'PHQ-9 (Depression)', emoji: '📊', assessmentType: 'screening', assessmentName: 'PHQ-9 Depression Screening' },
        { id: 'gad7', label: 'GAD-7 (Anxiety)', emoji: '📈', assessmentType: 'screening', assessmentName: 'GAD-7 Anxiety Screening' },
        { id: 'moca', label: 'MoCA (Cognitive)', emoji: '🧪', assessmentType: 'screening', assessmentName: 'Montreal Cognitive Assessment (MoCA)' },
        { id: 'audit', label: 'AUDIT (Alcohol)', emoji: '🍺', assessmentType: 'screening', assessmentName: 'AUDIT Alcohol Screening' },
        { id: 'cage', label: 'CAGE Questions', emoji: '📝', assessmentType: 'screening', assessmentName: 'CAGE Substance Use Screening' }
      ]
    },
    {
      title: 'History',
      items: [
        { id: 'psych_hx', label: 'Psychiatric History', emoji: '📋', assessmentType: 'history', assessmentName: 'Past Psychiatric History (hospitalizations, treatments, medications)' },
        { id: 'substance_hx', label: 'Substance History', emoji: '💊', assessmentType: 'history', assessmentName: 'Substance Use History' },
        { id: 'family_hx', label: 'Family Psych History', emoji: '👨‍👩‍👧', assessmentType: 'history', assessmentName: 'Family Psychiatric History' },
        { id: 'social_hx', label: 'Social History', emoji: '🏠', assessmentType: 'history', assessmentName: 'Social History (living situation, support, employment, relationships)' }
      ]
    },
    {
      title: 'Physical',
      items: [
        { id: 'vitals', label: 'Vital Signs', emoji: '🩺', assessmentType: 'physical', assessmentName: 'Vital Signs' },
        { id: 'neuro', label: 'Neuro Exam', emoji: '🔬', assessmentType: 'physical', assessmentName: 'Brief Neurological Examination' }
      ]
    },
    {
      title: 'Comprehensive',
      items: [
        { id: 'full_mse', label: 'Full Mental Status Exam', emoji: '📋', assessmentType: 'comprehensive', assessmentName: 'Complete Mental Status Examination' }
      ]
    }
  ],
  getSetupPrompt: (category: string, difficulty?: Difficulty, setting?: ClinicalSetting) => `You are a psychiatric education system. Generate a realistic patient scenario for psychiatry residency training.

IMPORTANT: You MUST select a condition from this category: ${category}
Be creative and pick different presentations each time. Include realistic psychosocial context.

${getDifficultyInstructions(difficulty)}
${getSettingInstructions(setting)}

You must respond in EXACTLY this format (including the labels):
DIAGNOSIS: [the specific DSM-5 diagnosis from the category above]
PATIENT_PROFILE: [age, gender, occupation, and brief psychosocial background - vary demographics]
PRESENTING_COMPLAINT: [the patient's chief complaint in their own words]
SYMPTOMS: [list of psychiatric symptoms consistent with the diagnosis]
HISTORY: [relevant psychiatric history, substance use, and recent stressors]

Now generate a patient with a condition from the ${category} category:`,

  getSystemPrompt: (setupContent: string, difficulty?: Difficulty, setting?: ClinicalSetting) => `You are roleplaying as a psychiatric PATIENT seeking help for mental health concerns.

YOUR PATIENT PROFILE AND CONDITION:
${setupContent}

${getDifficultyInstructions(difficulty)}
${getSettingInstructions(setting)}

CRITICAL INSTRUCTIONS:
1. You ARE the patient. Speak in first person about your experiences.
2. You are talking TO a psychiatrist who is evaluating you.
3. Describe your symptoms as you experience them, not using clinical terms.
4. Show appropriate emotional state for your condition.
5. You may be reluctant, guarded, or forthcoming depending on the condition.
6. Do NOT use clinical terminology or diagnose yourself.
7. Do NOT reveal the diagnosis. You are seeking help because you're struggling.
8. Keep responses realistic - some patients are poor historians, vague, or tangential.
9. Respond to mental status exam questions naturally.
10. For sensitive topics (suicide, trauma), respond as a real patient would.

Remember: You are the PATIENT. The user is the PSYCHIATRIST evaluating you.`,

  getAssessmentPrompt: (diagnosis: string, assessmentName: string, assessmentType: string) => 
    `Based on the patient's psychiatric condition (${diagnosis}), provide realistic ${assessmentName} results for a ${assessmentType} assessment.

Respond with findings in clinical psychiatric format. Be specific and use appropriate terminology. Keep it to 2-4 sentences.

Provide the ${assessmentName} findings now:`
};

export const psychologistConfig: ProfessionConfig = {
  id: 'psychologist',
  name: 'Psychologist',
  emoji: '🎯',
  title: 'Psychology Training Simulator',
  description: 'Practice clinical assessment and case conceptualization through client interviews and psychological evaluation.',
  userLabel: 'Psychologist',
  userEmoji: '👨‍🔬',
  patientLabel: 'Client',
  patientEmoji: '🙂',
  diagnosisHint: '💡 Tip: When ready for case conceptualization, type "My assessment is [formulation]"',
  diagnosisPattern: /my\s+assessment\s+is\s+(.+)/i,
  supportedSettings: ['clinic', 'telehealth'],
  defaultSetting: 'clinic',
  categories: [
    'Depression & Mood (e.g., Major Depression, Persistent Depressive Disorder, Seasonal Affective Disorder)',
    'Anxiety & Fear (e.g., Generalized Anxiety, Social Anxiety, Panic Disorder, Specific Phobias)',
    'Trauma & PTSD (e.g., PTSD, Complex PTSD, Acute Stress Disorder)',
    'OCD & Related (e.g., OCD, Body Dysmorphia, Health Anxiety)',
    'Relationship & Interpersonal Issues (e.g., attachment problems, codependency, interpersonal conflict)',
    'Grief & Loss (e.g., complicated grief, anticipatory grief, traumatic loss)',
    'Identity & Self-Esteem (e.g., identity confusion, chronic low self-esteem, impostor syndrome)',
    'Life Transitions (e.g., career change, retirement, empty nest, relocation adjustment)',
    'Behavioral Issues (e.g., anger management, procrastination, self-sabotage)',
    'Couples & Family Issues (e.g., communication problems, infidelity recovery, parenting stress)',
    'Eating & Body Image (e.g., disordered eating patterns, body dysmorphia, orthorexia)',
    'Sleep Difficulties (e.g., insomnia, nightmares, sleep anxiety)',
    'Stress & Burnout (e.g., occupational burnout, caregiver stress, academic stress)',
    'Personality Patterns (e.g., borderline features, narcissistic patterns, avoidant patterns)',
    'Neurodevelopmental (e.g., ADHD in adults, autism spectrum, learning differences)'
  ],
  toolkit: [
    {
      title: 'Clinical Interview',
      items: [
        { id: 'presenting', label: 'Presenting Problem', emoji: '📝', assessmentType: 'interview', assessmentName: 'Detailed Presenting Problem Exploration' },
        { id: 'history', label: 'Personal History', emoji: '📖', assessmentType: 'interview', assessmentName: 'Developmental and Personal History' },
        { id: 'family', label: 'Family Background', emoji: '👨‍👩‍👧', assessmentType: 'interview', assessmentName: 'Family History and Dynamics' },
        { id: 'relationships', label: 'Relationships', emoji: '💑', assessmentType: 'interview', assessmentName: 'Relationship History and Patterns' },
        { id: 'coping', label: 'Coping & Strengths', emoji: '💪', assessmentType: 'interview', assessmentName: 'Coping Mechanisms and Personal Strengths' }
      ]
    },
    {
      title: 'Behavioral Observation',
      items: [
        { id: 'appearance', label: 'Appearance', emoji: '👤', assessmentType: 'observation', assessmentName: 'Physical Appearance and Presentation' },
        { id: 'behavior', label: 'Behavior in Session', emoji: '🎭', assessmentType: 'observation', assessmentName: 'In-Session Behavior and Interaction Style' },
        { id: 'affect', label: 'Emotional Expression', emoji: '😊', assessmentType: 'observation', assessmentName: 'Emotional Expression and Affect Regulation' },
        { id: 'rapport', label: 'Rapport & Engagement', emoji: '🤝', assessmentType: 'observation', assessmentName: 'Therapeutic Alliance and Engagement Level' }
      ]
    },
    {
      title: 'Psychological Measures',
      items: [
        { id: 'bdi', label: 'BDI-II (Depression)', emoji: '📊', assessmentType: 'measure', assessmentName: 'Beck Depression Inventory-II' },
        { id: 'bai', label: 'BAI (Anxiety)', emoji: '📈', assessmentType: 'measure', assessmentName: 'Beck Anxiety Inventory' },
        { id: 'pcl', label: 'PCL-5 (PTSD)', emoji: '📋', assessmentType: 'measure', assessmentName: 'PTSD Checklist for DSM-5' },
        { id: 'oci', label: 'OCI-R (OCD)', emoji: '🔄', assessmentType: 'measure', assessmentName: 'Obsessive-Compulsive Inventory-Revised' },
        { id: 'dass', label: 'DASS-21', emoji: '📉', assessmentType: 'measure', assessmentName: 'Depression Anxiety Stress Scales' }
      ]
    },
    {
      title: 'Cognitive Assessment',
      items: [
        { id: 'thoughts', label: 'Automatic Thoughts', emoji: '💭', assessmentType: 'cognitive', assessmentName: 'Automatic Thought Patterns and Cognitive Distortions' },
        { id: 'beliefs', label: 'Core Beliefs', emoji: '🎯', assessmentType: 'cognitive', assessmentName: 'Core Beliefs and Schemas' },
        { id: 'problem_solving', label: 'Problem-Solving', emoji: '🧩', assessmentType: 'cognitive', assessmentName: 'Problem-Solving Abilities and Style' }
      ]
    },
    {
      title: 'Risk & Safety',
      items: [
        { id: 'safety', label: 'Safety Assessment', emoji: '⚠️', assessmentType: 'safety', assessmentName: 'Safety and Risk Assessment' },
        { id: 'resources', label: 'Support Resources', emoji: '🏥', assessmentType: 'safety', assessmentName: 'Available Support and Resources' }
      ]
    },
    {
      title: 'Comprehensive',
      items: [
        { id: 'full_intake', label: 'Full Intake Assessment', emoji: '📋', assessmentType: 'comprehensive', assessmentName: 'Comprehensive Psychological Intake' }
      ]
    }
  ],
  getSetupPrompt: (category: string, difficulty?: Difficulty, setting?: ClinicalSetting) => `You are a clinical psychology education system. Generate a realistic client scenario for psychology training.

IMPORTANT: You MUST select a presentation from this category: ${category}
Include realistic psychological and contextual factors. Vary presentations.

${getDifficultyInstructions(difficulty)}
${getSettingInstructions(setting)}

You must respond in EXACTLY this format (including the labels):
DIAGNOSIS: [the primary clinical issue/diagnosis]
CLIENT_PROFILE: [age, gender, occupation, life circumstances]
PRESENTING_CONCERN: [what brought the client to therapy in their own words]
SYMPTOMS: [psychological and behavioral symptoms]
BACKGROUND: [relevant history, triggers, maintaining factors]
STRENGTHS: [client strengths and protective factors]

Now generate a client with a presentation from the ${category} category:`,

  getSystemPrompt: (setupContent: string, difficulty?: Difficulty, setting?: ClinicalSetting) => `You are roleplaying as a CLIENT seeking psychological help.

YOUR CLIENT PROFILE:
${setupContent}

${getDifficultyInstructions(difficulty)}
${getSettingInstructions(setting)}

CRITICAL INSTRUCTIONS:
1. You ARE the client. Speak naturally about your experiences and feelings.
2. You are talking TO a psychologist in a therapy session.
3. Express yourself as a real person would - you're not a textbook case.
4. Show appropriate emotional responses and defenses.
5. You may have limited insight into patterns - that's normal.
6. Do NOT use clinical or psychological jargon.
7. Do NOT reveal the "diagnosis" - you're here because you're struggling.
8. Be genuine - you might minimize, deflect, or become emotional.
9. Respond to questions thoughtfully but naturally.
10. You can show ambivalence about change - that's realistic.

Remember: You are the CLIENT. The user is the PSYCHOLOGIST working with you.`,

  getAssessmentPrompt: (diagnosis: string, assessmentName: string, assessmentType: string) => 
    `Based on the client's presentation (${diagnosis}), provide realistic ${assessmentName} results for a ${assessmentType} assessment.

Respond with findings appropriate for a psychological report. Be specific and clinically relevant. Keep it to 2-4 sentences.

Provide the ${assessmentName} findings now:`
};

export const therapistConfig: ProfessionConfig = {
  id: 'therapist',
  name: 'Therapist',
  emoji: '💚',
  title: 'Therapy Training Simulator',
  description: 'Practice therapeutic interventions, treatment planning, and evidence-based therapy techniques.',
  userLabel: 'Therapist',
  userEmoji: '💚',
  patientLabel: 'Client',
  patientEmoji: '🗨️',
  diagnosisHint: '💡 Tip: When ready for treatment planning, type "My treatment plan is [approach]"',
  diagnosisPattern: /my\s+treatment\s+plan\s+is\s+(.+)/i,
  supportedSettings: ['clinic', 'telehealth'],
  defaultSetting: 'clinic',
  categories: [
    'CBT Candidates (e.g., anxiety disorders, depression, phobias, panic disorder)',
    'DBT Candidates (e.g., borderline personality, emotional dysregulation, self-harm)',
    'ACT Candidates (e.g., chronic pain, anxiety, substance use, work stress)',
    'EMDR Candidates (e.g., PTSD, trauma, disturbing memories)',
    'Couples Therapy (e.g., communication issues, trust repair, intimacy problems)',
    'Family Therapy (e.g., family conflict, parenting challenges, blended family issues)',
    'Group Therapy (e.g., social anxiety, addiction recovery, grief support)',
    'Child & Adolescent (e.g., school refusal, behavioral problems, divorce adjustment)',
    'Substance Abuse (e.g., addiction recovery, relapse prevention, harm reduction)',
    'Eating Disorders (e.g., anorexia recovery, binge eating, body image work)',
    'Grief & Loss (e.g., bereavement, anticipatory grief, complicated grief)',
    'Career & Life Coaching (e.g., career transition, work-life balance, goal setting)',
    'Mindfulness-Based (e.g., stress reduction, anxiety management, emotional regulation)',
    'Solution-Focused (e.g., specific problems, goal achievement, brief therapy)',
    'Psychodynamic (e.g., insight-oriented work, attachment issues, repetitive patterns)'
  ],
  toolkit: [
    {
      title: 'Therapeutic Techniques',
      items: [
        { id: 'rapport', label: 'Build Rapport', emoji: '🤝', assessmentType: 'technique', assessmentName: 'Rapport Building & Therapeutic Alliance' },
        { id: 'reflection', label: 'Reflective Listening', emoji: '🔄', assessmentType: 'technique', assessmentName: 'Reflective Listening & Validation' },
        { id: 'questions', label: 'Socratic Questioning', emoji: '❓', assessmentType: 'technique', assessmentName: 'Socratic Questioning' },
        { id: 'reframe', label: 'Cognitive Reframing', emoji: '🔀', assessmentType: 'technique', assessmentName: 'Cognitive Reframing' },
        { id: 'mindfulness', label: 'Mindfulness Exercise', emoji: '🧘', assessmentType: 'technique', assessmentName: 'Mindfulness & Grounding' }
      ]
    },
    {
      title: 'CBT Interventions',
      items: [
        { id: 'thought_record', label: 'Thought Record', emoji: '📝', assessmentType: 'cbt', assessmentName: 'Thought Record & Cognitive Distortions' },
        { id: 'behavioral', label: 'Behavioral Activation', emoji: '🎯', assessmentType: 'cbt', assessmentName: 'Behavioral Activation Planning' },
        { id: 'exposure', label: 'Exposure Planning', emoji: '📊', assessmentType: 'cbt', assessmentName: 'Exposure Hierarchy Development' }
      ]
    },
    {
      title: 'DBT Skills',
      items: [
        { id: 'distress', label: 'Distress Tolerance', emoji: '🛡️', assessmentType: 'dbt', assessmentName: 'TIPP & Distress Tolerance Skills' },
        { id: 'emotion_reg', label: 'Emotion Regulation', emoji: '🎨', assessmentType: 'dbt', assessmentName: 'Emotion Regulation Skills' },
        { id: 'interpersonal', label: 'DEARMAN', emoji: '💬', assessmentType: 'dbt', assessmentName: 'Interpersonal Effectiveness (DEARMAN)' }
      ]
    },
    {
      title: 'Assessment & Planning',
      items: [
        { id: 'goals', label: 'Goal Setting', emoji: '🎯', assessmentType: 'planning', assessmentName: 'SMART Goals Development' },
        { id: 'homework', label: 'Assign Homework', emoji: '📚', assessmentType: 'planning', assessmentName: 'Therapeutic Homework Assignment' },
        { id: 'progress', label: 'Progress Review', emoji: '📈', assessmentType: 'planning', assessmentName: 'Treatment Progress Review' },
        { id: 'safety_plan', label: 'Safety Planning', emoji: '🚨', assessmentType: 'planning', assessmentName: 'Crisis Safety Plan' }
      ]
    },
    {
      title: 'Specialized Approaches',
      items: [
        { id: 'emdr', label: 'EMDR Preparation', emoji: '👁️', assessmentType: 'specialized', assessmentName: 'EMDR Resource Installation' },
        { id: 'motivational', label: 'Motivational Interviewing', emoji: '💪', assessmentType: 'specialized', assessmentName: 'Motivational Interviewing Techniques' },
        { id: 'narrative', label: 'Narrative Therapy', emoji: '📖', assessmentType: 'specialized', assessmentName: 'Externalization & Re-authoring' }
      ]
    },
    {
      title: 'Comprehensive',
      items: [
        { id: 'full_session', label: 'Complete Session Review', emoji: '📋', assessmentType: 'comprehensive', assessmentName: 'Full Therapy Session Structure' }
      ]
    }
  ],
  getSetupPrompt: (category: string, difficulty?: Difficulty, setting?: ClinicalSetting) => `You are a therapy education system. Generate a realistic client scenario for therapy training.

IMPORTANT: You MUST select a presentation suitable for: ${category}
Create a client who would benefit from this therapeutic approach.

${getDifficultyInstructions(difficulty)}
${getSettingInstructions(setting)}

You must respond in EXACTLY this format (including the labels):
DIAGNOSIS: [the primary presenting issue and treatment focus]
CLIENT_PROFILE: [age, gender, occupation, relevant background]
PRESENTING_CONCERN: [what brought them to therapy in their own words]
SYMPTOMS: [current symptoms and functional impacts]
HISTORY: [relevant history, previous therapy, what has/hasn't worked]
GOALS: [what the client hopes to achieve in therapy]
READINESS: [stage of change - precontemplation/contemplation/preparation/action/maintenance]

Now generate a client for ${category} therapy:`,

  getSystemPrompt: (setupContent: string, difficulty?: Difficulty, setting?: ClinicalSetting) => `You are roleplaying as a therapy CLIENT seeking help.

YOUR CLIENT PROFILE:
${setupContent}

${getDifficultyInstructions(difficulty)}
${getSettingInstructions(setting)}

CRITICAL INSTRUCTIONS:
1. You ARE the client in therapy. Speak naturally about your experiences.
2. You are talking TO a therapist who is helping you.
3. Respond to therapeutic interventions realistically - change takes time.
4. Show appropriate readiness for change based on your profile.
5. You can be ambivalent, resistant, or eager depending on the context.
6. Respond to techniques appropriately.
7. Do NOT use clinical terminology unless you would realistically know it.
8. Build on previous session content and show gradual progress.
9. Express both thoughts AND feelings naturally.
10. You can have insights but also blind spots - therapy is a process.

Remember: You are the CLIENT. The user is the THERAPIST working with you.`,

  getAssessmentPrompt: (diagnosis: string, assessmentName: string, assessmentType: string) => 
    `Based on the client's presentation (${diagnosis}), provide realistic ${assessmentName} results for a ${assessmentType} intervention.

Keep it to 2-4 sentences, clinically relevant and realistic.

Provide the ${assessmentName} outcome now:`
};


export const doulaConfig: ProfessionConfig = {
  id: 'doula',
  name: 'Birth Doula',
  emoji: '🤱',
  title: 'Birth Doula Training Simulator',
  description: 'Practice providing continuous physical, emotional, and informational support during pregnancy, labor, birth, and postpartum.',
  userLabel: 'Doula',
  userEmoji: '🤱',
  patientLabel: 'Birthing Person',
  patientEmoji: '🤰',
  diagnosisHint: '💡 Tip: When ready to provide your birth support plan, type "My support plan is [approach]"',
  diagnosisPattern: /my\s+support\s+plan\s+is\s+(.+)/i,
  supportedSettings: ['labor_delivery', 'home', 'birth_center', 'inpatient'],
  defaultSetting: 'labor_delivery',
  categories: [
    'Early Labor Support (e.g., first-time parent, anxious about labor, seeking natural birth)',
    'Active Labor Support (e.g., pain management, position changes, breathing techniques)',
    'Transition Phase (e.g., intense contractions, loss of focus, need for encouragement)',
    'Pushing & Birth (e.g., coaching through pushing, advocating for preferences)',
    'Medical Interventions (e.g., induction, epidural, cesarean birth support)',
    'High-Risk Situations (e.g., preeclampsia, gestational diabetes, previous trauma)',
    'VBAC Support (e.g., vaginal birth after cesarean, addressing fears)',
    'Multiple Births (e.g., twins, positioning concerns, extended labor)',
    'Postpartum Support (e.g., immediate bonding, breastfeeding initiation, emotional support)',
    'Loss & Grief (e.g., stillbirth, miscarriage, termination for medical reasons)',
    'Teen Parents (e.g., young mother, limited support, education needs)',
    'LGBTQ+ Families (e.g., non-gestational parent support, inclusive language)',
    'Cultural Considerations (e.g., specific cultural practices, language barriers, traditional beliefs)',
    'Partner Support (e.g., helping partner be involved, managing partner anxiety)',
    'Home Birth Support (e.g., natural home setting, transfer decisions, midwife coordination)',
    'Birth Center Support (e.g., low-intervention environment, movement and positioning)',
    'Hospital Birth Support (e.g., navigating hospital protocols, advocating for preferences)',
    'Unplanned Cesarean (e.g., emotional support, gentle cesarean techniques)',
    'Precipitous Labor (e.g., rapid labor, managing intensity, location concerns)',
    'Back Labor (e.g., posterior position, counter-pressure, position changes)'
  ],
  toolkit: [
    {
      title: 'Physical Support',
      items: [
        { id: 'positions', label: 'Labor Positions', emoji: '🧘‍♀️', assessmentType: 'physical', assessmentName: 'Optimal Labor Positioning Guide' },
        { id: 'counter_pressure', label: 'Counter-Pressure', emoji: '✋', assessmentType: 'physical', assessmentName: 'Counter-Pressure Techniques for Back Labor' },
        { id: 'massage', label: 'Massage Techniques', emoji: '💆‍♀️', assessmentType: 'physical', assessmentName: 'Labor Massage and Touch Therapy' },
        { id: 'rebozo', label: 'Rebozo Techniques', emoji: '🧣', assessmentType: 'physical', assessmentName: 'Rebozo Sifting and Positioning' },
        { id: 'peanut_ball', label: 'Peanut Ball Use', emoji: '🥜', assessmentType: 'physical', assessmentName: 'Peanut Ball Positioning' },
        { id: 'birthing_ball', label: 'Birthing Ball', emoji: '⚽', assessmentType: 'physical', assessmentName: 'Birthing Ball Exercises' }
      ]
    },
    {
      title: 'Comfort Measures',
      items: [
        { id: 'breathing', label: 'Breathing Patterns', emoji: '🌬️', assessmentType: 'comfort', assessmentName: 'Rhythmic Breathing Techniques' },
        { id: 'hydrotherapy', label: 'Hydrotherapy', emoji: '🚿', assessmentType: 'comfort', assessmentName: 'Shower and Tub Use for Labor' },
        { id: 'heat_cold', label: 'Heat/Cold Therapy', emoji: '🔥', assessmentType: 'comfort', assessmentName: 'Therapeutic Temperature Application' },
        { id: 'aromatherapy', label: 'Aromatherapy', emoji: '🌸', assessmentType: 'comfort', assessmentName: 'Safe Essential Oils for Labor' },
        { id: 'tens', label: 'TENS Unit', emoji: '⚡', assessmentType: 'comfort', assessmentName: 'TENS Unit Application for Pain Relief' }
      ]
    },
    {
      title: 'Emotional Support',
      items: [
        { id: 'affirmations', label: 'Birth Affirmations', emoji: '💪', assessmentType: 'emotional', assessmentName: 'Positive Affirmations and Encouragement' },
        { id: 'visualization', label: 'Visualization', emoji: '🌈', assessmentType: 'emotional', assessmentName: 'Guided Visualization Techniques' },
        { id: 'fear_release', label: 'Fear Release', emoji: '🦋', assessmentType: 'emotional', assessmentName: 'Addressing Fears and Anxiety' },
        { id: 'presence', label: 'Calming Presence', emoji: '🕊️', assessmentType: 'emotional', assessmentName: 'Grounding and Calming Techniques' }
      ]
    },
    {
      title: 'Informational Support',
      items: [
        { id: 'stages', label: 'Labor Stages Info', emoji: '📚', assessmentType: 'info', assessmentName: 'Explaining Labor Progression' },
        { id: 'interventions', label: 'Intervention Info', emoji: '💉', assessmentType: 'info', assessmentName: 'Medical Interventions Explanation' },
        { id: 'options', label: 'Birth Options', emoji: '🔀', assessmentType: 'info', assessmentName: 'Available Options and Choices' },
        { id: 'newborn', label: 'Newborn Procedures', emoji: '👶', assessmentType: 'info', assessmentName: 'Standard Newborn Care Procedures' }
      ]
    },
    {
      title: 'Advocacy',
      items: [
        { id: 'preferences', label: 'Birth Preferences', emoji: '📋', assessmentType: 'advocacy', assessmentName: 'Birth Plan Review and Advocacy' },
        { id: 'communication', label: 'Medical Team Communication', emoji: '🗣️', assessmentType: 'advocacy', assessmentName: 'Facilitating Communication with Staff' },
        { id: 'informed_consent', label: 'Informed Consent', emoji: '✍️', assessmentType: 'advocacy', assessmentName: 'Supporting Informed Decision-Making' }
      ]
    },
    {
      title: 'Partner Support',
      items: [
        { id: 'partner_involvement', label: 'Partner Coaching', emoji: '👥', assessmentType: 'partner', assessmentName: 'Coaching Partner Support Techniques' },
        { id: 'breaks', label: 'Partner Breaks', emoji: '☕', assessmentType: 'partner', assessmentName: 'Ensuring Partner Self-Care' },
        { id: 'bonding', label: 'Partner Bonding', emoji: '❤️', assessmentType: 'partner', assessmentName: 'Facilitating Partner-Baby Bonding' }
      ]
    },
    {
      title: 'Postpartum',
      items: [
        { id: 'breastfeeding', label: 'Breastfeeding Support', emoji: '🤱', assessmentType: 'postpartum', assessmentName: 'Initial Breastfeeding Assistance' },
        { id: 'skin_to_skin', label: 'Skin-to-Skin', emoji: '🫂', assessmentType: 'postpartum', assessmentName: 'Promoting Skin-to-Skin Contact' },
        { id: 'birth_story', label: 'Birth Story Review', emoji: '📖', assessmentType: 'postpartum', assessmentName: 'Processing the Birth Experience' },
        { id: 'warning_signs', label: 'Postpartum Warning Signs', emoji: '⚠️', assessmentType: 'postpartum', assessmentName: 'Postpartum Complications to Watch For' }
      ]
    },
    {
      title: 'Assessment',
      items: [
        { id: 'vital_signs', label: 'Check Vital Signs', emoji: '🩺', assessmentType: 'assessment', assessmentName: 'Observe Maternal Vital Signs' },
        { id: 'contraction_pattern', label: 'Contraction Timing', emoji: '⏱️', assessmentType: 'assessment', assessmentName: 'Contraction Pattern Assessment' },
        { id: 'emotional_state', label: 'Emotional Check', emoji: '😊', assessmentType: 'assessment', assessmentName: 'Emotional and Mental State Assessment' },
        { id: 'environment', label: 'Environment Check', emoji: '🏠', assessmentType: 'assessment', assessmentName: 'Birth Environment Optimization' }
      ]
    },
    {
      title: 'Comprehensive',
      items: [
        { id: 'full_support', label: 'Complete Support Review', emoji: '📋', assessmentType: 'comprehensive', assessmentName: 'Comprehensive Labor Support Plan' }
      ]
    }
  ],
  getSetupPrompt: (category: string, difficulty?: Difficulty, setting?: ClinicalSetting) => `You are a birth doula education system. Generate a realistic birthing person scenario for doula training.

IMPORTANT: You MUST create a scenario from this category: ${category}
Create a realistic pregnant person with specific needs, preferences, and circumstances.

${getDifficultyInstructions(difficulty)}
${getSettingInstructions(setting)}

You must respond in EXACTLY this format (including the labels):
SITUATION: [the specific birth scenario and stage of labor/pregnancy]
BIRTHING_PERSON_PROFILE: [age, weeks pregnant, gravida/para, relevant medical/social background]
SUPPORT_SYSTEM: [partner/family present, their involvement level, any concerns]
BIRTH_PREFERENCES: [key preferences - pain management, interventions, environment, cultural needs]
CURRENT_STATUS: [where they are in labor/pregnancy, what's happening now, emotional state]
CONCERNS: [specific fears, challenges, or issues that need doula support]
MEDICAL_CONTEXT: [any relevant medical history, current complications, provider recommendations]

Now generate a birthing person scenario for ${category}:`,

  getSystemPrompt: (setupContent: string, difficulty?: Difficulty, setting?: ClinicalSetting) => `You are roleplaying as a BIRTHING PERSON in labor or during pregnancy seeking doula support.

YOUR SCENARIO:
${setupContent}

${getDifficultyInstructions(difficulty)}
${getSettingInstructions(setting)}

CRITICAL INSTRUCTIONS:
1. You ARE the birthing person. Speak from your experience in first person.
2. You are talking TO a doula who is supporting you.
3. Express your physical sensations honestly.
4. Show your emotional state realistically.
5. Respond to comfort measures and suggestions.
6. You can be vulnerable, scared, or confident depending on the moment.
7. Labor changes you - you might become more internal/quiet as it intensifies.
8. Ask questions when you need information or reassurance.
9. Express your needs, but you might not always know what you need.
10. Respond to your support person's presence and involvement.
11. You may become less verbal during intense contractions.
12. Show appreciation for support that helps you.

Remember: You are the BIRTHING PERSON. The user is the DOULA supporting you.`,

  getAssessmentPrompt: (diagnosis: string, assessmentName: string, assessmentType: string) => 
    `Based on the birthing person's situation (${diagnosis}), provide realistic ${assessmentName} guidance for a ${assessmentType} support intervention.

Keep it to 2-4 sentences, practical and specific to this birth.

Provide the ${assessmentName} guidance now:`
};

export const pregnancyPartnerConfig: ProfessionConfig = {
  id: 'pregnancyPartner',
  name: 'Pregnancy Partner Support',
  emoji: '👫',
  title: 'Pregnancy Partner Training Simulator',
  description: 'Practice supporting your pregnant partner through various challenges, complaints, and emotional needs during pregnancy.',
  userLabel: 'Partner',
  userEmoji: '👫',
  patientLabel: 'Pregnant Partner',
  patientEmoji: '🤰',
  diagnosisHint: '💡 Tip: When you understand what they need, type "What they need is [specific need]"',
  diagnosisPattern: /what\s+they\s+need\s+is\s+(.+)/i,
  supportedSettings: ['home'],
  defaultSetting: 'home',
  categories: [
    'First Trimester - Morning Sickness (e.g., nausea, food aversions, sensitivity to smells, fatigue)',
    'First Trimester - Fatigue & Exhaustion (e.g., extreme tiredness, need for extra sleep, low energy)',
    'First Trimester - Emotional Changes (e.g., mood swings, anxiety about pregnancy, overwhelm)',
    'First Trimester - Body Changes (e.g., breast tenderness, bloating, headaches)',
    'Second Trimester - Physical Discomfort (e.g., back pain, round ligament pain, leg cramps)',
    'Second Trimester - Body Image Concerns (e.g., weight gain feelings, changing body, clothing frustration)',
    'Second Trimester - Anxiety About Baby (e.g., worry about health, gender reveal feelings, preparation stress)',
    'Second Trimester - Relationship Changes (e.g., intimacy concerns, feeling disconnected, need for reassurance)',
    'Third Trimester - Physical Challenges (e.g., difficulty sleeping, swelling, heartburn, shortness of breath)',
    'Third Trimester - Birth Anxiety (e.g., fear of labor, birth plan stress, hospital concerns)',
    'Third Trimester - Nesting & Preparation (e.g., overwhelming to-do lists, nursery stress, financial worries)',
    'Third Trimester - Emotional Overwhelm (e.g., feeling huge, impatience to meet baby, fear of being a parent)',
    'Pregnancy Complications (e.g., bed rest frustration, gestational diabetes management, high blood pressure stress)',
    'Work & Career Concerns (e.g., telling workplace, maternity leave worries, career impact fears)',
    'Previous Loss or Trauma (e.g., anxiety after miscarriage, fear of loss, hypervigilance)',
    'Unsolicited Advice Frustration (e.g., family pressure, strangers touching belly, conflicting opinions)',
    'Partner Feeling Left Out (e.g., wanting partner more involved, feeling alone, need for teamwork)',
    'Intimacy & Physical Changes (e.g., changes in desire, physical limitations, emotional connection needs)',
    'Mental Health During Pregnancy (e.g., prenatal depression, anxiety disorders, mood management)',
    'Practical Support Needs (e.g., help with chores, appointments, meal preparation, rest reminders)'
  ],
  toolkit: [
    {
      title: 'Active Listening',
      items: [
        { id: 'validate', label: 'Validate Feelings', emoji: '💚', assessmentType: 'emotional', assessmentName: 'Emotional Validation Response' },
        { id: 'reflect', label: 'Reflect Back', emoji: '🪞', assessmentType: 'emotional', assessmentName: 'Reflective Listening Response' },
        { id: 'empathize', label: 'Show Empathy', emoji: '🤗', assessmentType: 'emotional', assessmentName: 'Empathetic Response' },
        { id: 'nofix', label: 'Listen Without Fixing', emoji: '👂', assessmentType: 'emotional', assessmentName: 'Non-Solution Focused Response' }
      ]
    },
    {
      title: 'Physical Support',
      items: [
        { id: 'massage', label: 'Offer Massage', emoji: '💆', assessmentType: 'physical', assessmentName: 'Physical Comfort Offer' },
        { id: 'fetch', label: 'Get Something', emoji: '🏃', assessmentType: 'physical', assessmentName: 'Practical Fetch Request' },
        { id: 'position', label: 'Help With Comfort', emoji: '🛋️', assessmentType: 'physical', assessmentName: 'Comfort Positioning Help' },
        { id: 'food', label: 'Food/Drink Support', emoji: '🍎', assessmentType: 'physical', assessmentName: 'Nutrition Support Offer' }
      ]
    },
    {
      title: 'Emotional Support',
      items: [
        { id: 'reassure', label: 'Reassurance', emoji: '🌟', assessmentType: 'reassurance', assessmentName: 'Reassuring Words' },
        { id: 'compliment', label: 'Give Compliment', emoji: '💕', assessmentType: 'reassurance', assessmentName: 'Genuine Compliment' },
        { id: 'future', label: 'Talk About Future', emoji: '👶', assessmentType: 'reassurance', assessmentName: 'Positive Future Discussion' },
        { id: 'together', label: 'Express Partnership', emoji: '🤝', assessmentType: 'reassurance', assessmentName: 'Partnership Affirmation' }
      ]
    },
    {
      title: 'Practical Help',
      items: [
        { id: 'chores', label: 'Offer to Do Chores', emoji: '🧹', assessmentType: 'practical', assessmentName: 'Household Help Offer' },
        { id: 'appointment', label: 'Appointment Support', emoji: '📅', assessmentType: 'practical', assessmentName: 'Medical Appointment Assistance' },
        { id: 'research', label: 'Research Together', emoji: '📚', assessmentType: 'practical', assessmentName: 'Information Gathering Support' },
        { id: 'planning', label: 'Help With Planning', emoji: '📝', assessmentType: 'practical', assessmentName: 'Baby Preparation Planning' }
      ]
    },
    {
      title: 'Self-Care Reminders',
      items: [
        { id: 'rest', label: 'Encourage Rest', emoji: '😴', assessmentType: 'selfcare', assessmentName: 'Rest Encouragement' },
        { id: 'water', label: 'Hydration Reminder', emoji: '💧', assessmentType: 'selfcare', assessmentName: 'Gentle Hydration Reminder' },
        { id: 'break', label: 'Suggest Break', emoji: '☕', assessmentType: 'selfcare', assessmentName: 'Break Time Suggestion' },
        { id: 'boundaries', label: 'Protect Boundaries', emoji: '🛡️', assessmentType: 'selfcare', assessmentName: 'Boundary Setting Support' }
      ]
    },
    {
      title: 'Connection',
      items: [
        { id: 'quality', label: 'Quality Time', emoji: '🎬', assessmentType: 'connection', assessmentName: 'Quality Time Offer' },
        { id: 'touch', label: 'Physical Affection', emoji: '🤱', assessmentType: 'connection', assessmentName: 'Appropriate Physical Affection' },
        { id: 'date', label: 'Plan Date Night', emoji: '🌙', assessmentType: 'connection', assessmentName: 'Pregnancy-Friendly Date Idea' },
        { id: 'baby', label: 'Connect With Baby', emoji: '🎵', assessmentType: 'connection', assessmentName: 'Baby Bonding Activity' }
      ]
    },
    {
      title: 'When to Seek Help',
      items: [
        { id: 'warning', label: 'Know Warning Signs', emoji: '⚠️', assessmentType: 'medical', assessmentName: 'Medical Warning Signs to Watch' },
        { id: 'mental', label: 'Mental Health Check', emoji: '🧠', assessmentType: 'medical', assessmentName: 'Mental Health Resource Information' },
        { id: 'professional', label: 'Suggest Professional Help', emoji: '👩‍⚕️', assessmentType: 'medical', assessmentName: 'Professional Support Suggestion' }
      ]
    },
    {
      title: 'Comprehensive',
      items: [
        { id: 'full_support', label: 'Complete Support Review', emoji: '📋', assessmentType: 'comprehensive', assessmentName: 'Comprehensive Partner Support Guide' }
      ]
    }
  ],
  getSetupPrompt: (category: string, difficulty?: Difficulty, setting?: ClinicalSetting) => `You are a pregnancy partner support education system. Generate a realistic scenario for partner support training.

IMPORTANT: You MUST select a specific situation from this category: ${category}
Pick ONE specific complaint or challenge. Be creative and vary the scenarios.

${getDifficultyInstructions(difficulty)}
${getSettingInstructions(setting)}

You must respond in EXACTLY this format (including the labels):
UNDERLYING_NEED: [the ONE specific thing they truly need most - be specific]
SITUATION: [the immediate complaint or challenge they're expressing]
PERSON_PROFILE: [weeks pregnant, personality traits, typical communication style]
PHYSICAL_STATE: [specific physical symptoms right now]
EMOTIONAL_STATE: [specific emotions and underlying feelings]
WHAT_THEYRE_SAYING: [their actual words/complaint]
CONTEXT: [time, place, what triggered this moment]
PAST_PATTERN: [how they've responded to support before]

Now generate a scenario from ${category} with a CLEAR, SPECIFIC underlying need:`,

  getSystemPrompt: (setupContent: string, difficulty?: Difficulty, setting?: ClinicalSetting) => `You are roleplaying as a PREGNANT PERSON with a specific need that your partner should identify.

YOUR SCENARIO:
${setupContent}

${getDifficultyInstructions(difficulty)}
${getSettingInstructions(setting)}

CRITICAL INSTRUCTIONS:
1. Stay true to YOUR personality from the profile.
2. Your UNDERLYING_NEED is what you truly want, but you may not say it directly.
3. React positively when partner gets closer to meeting your actual need.
4. Show continued frustration if they're missing the point.
5. Use YOUR specific words from "WHAT_THEYRE_SAYING".
6. Reference YOUR physical symptoms when relevant.
7. Show YOUR emotional state through tone.
8. Keep responses to 2-4 sentences.
9. When your UNDERLYING_NEED is met, acknowledge it clearly.

Remember: You are THIS specific pregnant person with THIS specific need.`,

  getAssessmentPrompt: (diagnosis: string, assessmentName: string, assessmentType: string) => 
    `The pregnant person's underlying need is: ${diagnosis}

Provide specific guidance for ${assessmentName} in this situation.

Keep response 2-4 sentences, specific and actionable.

Provide the ${assessmentName} guidance now:`
};

export const professionConfigs: Record<string, ProfessionConfig> = {
  nurse: nurseConfig,
  psychiatrist: psychiatristConfig,
  psychologist: psychologistConfig,
  therapist: therapistConfig,
  doula: doulaConfig,
  pregnancyPartner: pregnancyPartnerConfig
};