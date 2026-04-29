import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { professionConfigs } from '../../config/professionConfig';
import { EvaluationResponsePayload } from '../../types';
import { SessionEvaluation } from '../SessionEvaluation';

const requestCompletionTextMock = vi.hoisted(() => vi.fn());
const addSessionRecordMock = vi.hoisted(() => vi.fn());

vi.mock('../../shared/llm/client', () => ({
  requestCompletionText: requestCompletionTextMock,
}));

vi.mock('../../utils/progressStorage', () => ({
  addSessionRecord: addSessionRecordMock,
}));

const apiConfig = {
  apiUrl: 'http://localhost:1234/v1',
  apiKey: '',
  modelName: 'model-a',
};

const conversationHistory = [
  { role: 'system' as const, content: 'system prompt' },
  { role: 'assistant' as const, content: 'I feel dizzy.' },
  { role: 'user' as const, content: 'When did it start?' },
];

const caseSetup = {
  profession: 'nurse' as const,
  category: 'Cardiovascular',
  difficulty: 'advanced' as const,
  setting: 'emergency' as const,
  timePressureEnabled: true,
  maxTurns: 5,
  mode: 'exam' as const,
  createdAt: 1,
};

function evaluation(overrides: Partial<EvaluationResponsePayload> = {}): EvaluationResponsePayload {
  return {
    overallScore: overrides.overallScore ?? 95,
    scoreBreakdown: overrides.scoreBreakdown ?? [
      { category: 'Information Gathering', score: 18, maxScore: 20 },
      { category: 'Safety Awareness', score: 12, maxScore: 20 },
      { category: 'Professional Approach', score: 5, maxScore: 20 },
    ],
    strengths: overrides.strengths ?? ['Good rapport'],
    gaps: overrides.gaps ?? ['Missed medication history'],
    safetyFlags: overrides.safetyFlags ?? ['Chest pain needed escalation'],
    suggestedActions: overrides.suggestedActions ?? ['Ask **red flag** questions'],
    summary: overrides.summary ?? 'Strong session summary.',
    nextSessionGoals: overrides.nextSessionGoals,
  };
}

describe('SessionEvaluation', () => {
  beforeEach(() => {
    requestCompletionTextMock.mockReset();
    addSessionRecordMock.mockReset();
  });

  it('generates, renders, saves, and closes a standard evaluation', async () => {
    const onClose = vi.fn();
    const onNewSession = vi.fn();
    const onProgressSaved = vi.fn();
    requestCompletionTextMock.mockResolvedValueOnce(JSON.stringify(evaluation()));

    render(
      <SessionEvaluation
        professionConfig={professionConfigs.nurse}
        apiConfig={apiConfig}
        conversationHistory={conversationHistory}
        diagnosis="Myocardial infarction"
        userAnswer="Myocardial infarction"
        wasCorrect
        caseSetup={caseSetup}
        turnsUsed={4}
        mode="exam"
        hintsUsed={2}
        onNewSession={onNewSession}
        onClose={onClose}
        onProgressSaved={onProgressSaved}
      />,
    );

    expect(screen.getByText(/Analyzing your performance/)).toBeInTheDocument();

    await screen.findByText('Excellent');
    expect(screen.getByText('Correct!')).toBeInTheDocument();
    expect(screen.getByText('The answer was: Myocardial infarction')).toBeInTheDocument();
    expect(screen.getByText('Cardiovascular')).toBeInTheDocument();
    expect(screen.getByText('Advanced')).toBeInTheDocument();
    expect(screen.getByText('Emergency Department')).toBeInTheDocument();
    expect(screen.getByText('4/5')).toBeInTheDocument();
    expect(screen.getByText('Exam')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('Good rapport')).toBeInTheDocument();
    expect(screen.getByText('Missed medication history')).toBeInTheDocument();
    expect(screen.getByText('Chest pain needed escalation')).toBeInTheDocument();
    expect(screen.getByText('red flag')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText(/Progress saved/)).toBeInTheDocument());

    const prompt = requestCompletionTextMock.mock.calls[0][1].messages[0].content;
    expect(prompt).toContain('Emergency Department');
    expect(prompt).toContain('Difficulty Level: Advanced');
    expect(prompt).toContain('5-turn limit');
    expect(addSessionRecordMock).toHaveBeenCalledWith(expect.objectContaining({
      profession: 'nurse',
      category: 'Cardiovascular',
      correct: true,
      score: 95,
      mode: 'exam',
      hintsUsed: 2,
    }));
    expect(onProgressSaved).toHaveBeenCalledOnce();

    fireEvent.click(screen.getByRole('button', { name: /review session/i }));
    expect(onClose).toHaveBeenCalledOnce();
    fireEvent.click(screen.getByRole('button', { name: /new patient/i }));
    expect(onNewSession).toHaveBeenCalledOnce();
  });

  it('retries after an evaluation error and supports sparse feedback without setup', async () => {
    requestCompletionTextMock
      .mockRejectedValueOnce(new Error('bad response'))
      .mockResolvedValueOnce(JSON.stringify(evaluation({
        overallScore: 55,
        scoreBreakdown: [{ category: 'Clinical Reasoning', score: 5, maxScore: 20 }],
        strengths: [],
        gaps: [],
        safetyFlags: [],
        suggestedActions: [],
        summary: 'Needs more structure.',
      })));
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    render(
      <SessionEvaluation
        professionConfig={professionConfigs.nurse}
        apiConfig={apiConfig}
        conversationHistory={conversationHistory}
        diagnosis="Pneumonia"
        userAnswer="Bronchitis"
        wasCorrect={false}
        turnsUsed={1}
        onNewSession={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    await screen.findByText(/Unable to generate evaluation/);
    fireEvent.click(screen.getByRole('button', { name: /retry/i }));

    await screen.findByText('Unsatisfactory');
    expect(screen.getByText('Incorrect')).toBeInTheDocument();
    expect(screen.queryByText('Strengths')).not.toBeInTheDocument();
    expect(addSessionRecordMock).toHaveBeenCalledWith(expect.objectContaining({
      category: 'Random',
      difficulty: undefined,
      setting: undefined,
      correct: false,
      score: 55,
    }));
    expect(consoleError).toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it('renders couples therapy prompts, results, goals, and footer label', async () => {
    requestCompletionTextMock.mockResolvedValueOnce(JSON.stringify(evaluation({
      overallScore: 82,
      summary: 'Balanced both partners well.',
      nextSessionGoals: ['Name the cycle earlier'],
    })));

    render(
      <SessionEvaluation
        professionConfig={professionConfigs.couplesTherapist}
        apiConfig={apiConfig}
        conversationHistory={[
          { role: 'assistant' as const, content: '[Partner A - Alex]: We argue a lot.' },
          { role: 'user' as const, content: 'I hear both of you.' },
        ]}
        diagnosis="Pursue-withdraw cycle"
        userAnswer="They pursue and withdraw"
        wasCorrect={false}
        caseSetup={{
          ...caseSetup,
          profession: 'couplesTherapist',
          category: 'Communication breakdown',
          difficulty: 'intermediate',
          setting: 'telehealth',
          timePressureEnabled: false,
          maxTurns: null,
          mode: 'guided',
        }}
        mode="guided"
        onNewSession={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByText(/Analyzing your couples therapy session/)).toBeInTheDocument();

    await screen.findByText('Good');
    expect(screen.getByText('Session Complete')).toBeInTheDocument();
    expect(screen.getByText("Couple's negative cycle: Pursue-withdraw cycle")).toBeInTheDocument();
    expect(screen.getByText('Name the cycle earlier')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /new couple/i })).toBeInTheDocument();
    expect(requestCompletionTextMock.mock.calls[0][1].messages[0].content).toContain('couples therapy supervisor');
  });

  it('renders middle grade labels', async () => {
    requestCompletionTextMock.mockResolvedValueOnce(JSON.stringify(evaluation({
      overallScore: 75,
      strengths: [],
      gaps: [],
      safetyFlags: [],
      suggestedActions: [],
    })));
    const first = render(
      <SessionEvaluation
        professionConfig={professionConfigs.nurse}
        apiConfig={apiConfig}
        conversationHistory={conversationHistory}
        diagnosis="Condition"
        userAnswer="Condition"
        wasCorrect
        onNewSession={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    await screen.findByText('Satisfactory');
    first.unmount();

    requestCompletionTextMock.mockResolvedValueOnce(JSON.stringify(evaluation({
      overallScore: 65,
      strengths: [],
      gaps: [],
      safetyFlags: [],
      suggestedActions: [],
    })));
    render(
      <SessionEvaluation
        professionConfig={professionConfigs.nurse}
        apiConfig={apiConfig}
        conversationHistory={conversationHistory}
        diagnosis="Condition"
        userAnswer="Condition"
        wasCorrect
        onNewSession={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    await screen.findByText('Needs Improvement');
  });
});
