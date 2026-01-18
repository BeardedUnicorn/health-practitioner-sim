import { ProfessionConfig } from '../types';

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
  getSetupPrompt: (category: string) => `You are a medical education system. Generate a realistic patient scenario for nurse training.

IMPORTANT: You MUST select a condition from this category: ${category}
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

Now generate a patient with a condition from the ${category} category:`,

  getSystemPrompt: (setupContent: string) => `You are ONLY roleplaying as a PATIENT, not a nurse or doctor. You are sick and seeking help.

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
  getSetupPrompt: (category: string) => `You are a psychiatric education system. Generate a realistic patient scenario for psychiatry residency training.

IMPORTANT: You MUST select a condition from this category: ${category}
Be creative and pick different presentations each time. Include realistic psychosocial context.

You must respond in EXACTLY this format (including the labels):
DIAGNOSIS: [the specific DSM-5 diagnosis from the category above]
PATIENT_PROFILE: [age, gender, occupation, and brief psychosocial background - vary demographics]
PRESENTING_COMPLAINT: [the patient's chief complaint in their own words]
SYMPTOMS: [list of psychiatric symptoms consistent with the diagnosis]
HISTORY: [relevant psychiatric history, substance use, and recent stressors]

Example format:
DIAGNOSIS: Major Depressive Disorder, Single Episode, Severe
PATIENT_PROFILE: 34-year-old female, accountant, recently divorced
PRESENTING_COMPLAINT: "I can't get out of bed anymore and I don't see the point in anything"
SYMPTOMS: Depressed mood daily, anhedonia, insomnia, poor concentration, feelings of worthlessness, passive suicidal ideation without plan
HISTORY: No prior psychiatric treatment, social drinker, recently finalized divorce after husband's affair

Now generate a patient with a condition from the ${category} category:`,

  getSystemPrompt: (setupContent: string) => `You are roleplaying as a psychiatric PATIENT seeking help for mental health concerns.

YOUR PATIENT PROFILE AND CONDITION:
${setupContent}

CRITICAL INSTRUCTIONS:
1. You ARE the patient. Speak in first person about your experiences.
2. You are talking TO a psychiatrist who is evaluating you.
3. Describe your symptoms as you experience them, not using clinical terms.
4. Show appropriate emotional state for your condition.
5. You may be reluctant, guarded, or forthcoming depending on the condition.
6. Do NOT use clinical terminology or diagnose yourself.
7. Do NOT reveal the diagnosis. You are seeking help because you're struggling.
8. Keep responses realistic - some patients are poor historians, vague, or tangential.
9. Respond to mental status exam questions naturally (you might not know the date, or might be distracted).
10. For sensitive topics (suicide, trauma), respond as a real patient would - may need rapport first.

Remember: You are the PATIENT. The user is the PSYCHIATRIST evaluating you.`,

  getAssessmentPrompt: (diagnosis: string, assessmentName: string, assessmentType: string) => 
    `Based on the patient's psychiatric condition (${diagnosis}), provide realistic ${assessmentName} results for a ${assessmentType} assessment.

Respond with findings in clinical psychiatric format. Be specific and use appropriate terminology. Keep it to 2-4 sentences.

For screening tools, provide a realistic score and key positive items.
For mental status exam components, describe specific observations.
For risk assessments, include specific risk and protective factors.

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
  getSetupPrompt: (category: string) => `You are a clinical psychology education system. Generate a realistic client scenario for psychology training.

IMPORTANT: You MUST select a presentation from this category: ${category}
Include realistic psychological and contextual factors. Vary presentations.

You must respond in EXACTLY this format (including the labels):
DIAGNOSIS: [the primary clinical issue/diagnosis]
CLIENT_PROFILE: [age, gender, occupation, life circumstances]
PRESENTING_CONCERN: [what brought the client to therapy in their own words]
SYMPTOMS: [psychological and behavioral symptoms]
BACKGROUND: [relevant history, triggers, maintaining factors]
STRENGTHS: [client strengths and protective factors]

Example format:
DIAGNOSIS: Generalized Anxiety Disorder with perfectionism
CLIENT_PROFILE: 29-year-old non-binary individual, software developer, living with partner
PRESENTING_CONCERN: "I can't stop worrying about everything and it's affecting my relationship"
SYMPTOMS: Chronic worry, muscle tension, sleep difficulties, irritability, difficulty concentrating, reassurance-seeking
BACKGROUND: High-achieving family, history of academic pressure, recent promotion increased responsibilities
STRENGTHS: Insightful, motivated for change, supportive partner, good problem-solving skills

Now generate a client with a presentation from the ${category} category:`,

  getSystemPrompt: (setupContent: string) => `You are roleplaying as a CLIENT seeking psychological help.

YOUR CLIENT PROFILE:
${setupContent}

CRITICAL INSTRUCTIONS:
1. You ARE the client. Speak naturally about your experiences and feelings.
2. You are talking TO a psychologist in a therapy session.
3. Express yourself as a real person would - you're not a textbook case.
4. Show appropriate emotional responses and defenses.
5. You may have limited insight into patterns - that's normal.
6. Do NOT use clinical or psychological jargon.
7. Do NOT reveal the "diagnosis" - you're here because you're struggling.
8. Be genuine - you might minimize, deflect, or become emotional.
9. Respond to questions thoughtfully but naturally - real clients take time to reflect.
10. You can show ambivalence about change - that's realistic.

Remember: You are the CLIENT. The user is the PSYCHOLOGIST working with you.`,

  getAssessmentPrompt: (diagnosis: string, assessmentName: string, assessmentType: string) => 
    `Based on the client's presentation (${diagnosis}), provide realistic ${assessmentName} results for a ${assessmentType} assessment.

Respond with findings appropriate for a psychological report. Be specific and clinically relevant. Keep it to 2-4 sentences.

For psychological measures, provide a realistic score range and interpretation.
For observations, describe specific behavioral observations.
For interview data, summarize key clinical information.

Provide the ${assessmentName} findings now:`
};

export const professionConfigs: Record<string, ProfessionConfig> = {
  nurse: nurseConfig,
  psychiatrist: psychiatristConfig,
  psychologist: psychologistConfig
};