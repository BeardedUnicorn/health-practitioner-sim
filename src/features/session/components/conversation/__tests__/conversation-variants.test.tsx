import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CouplesConversation, parseCouplesMessage } from '../CouplesConversation';
import { SinglePatientConversation } from '../SinglePatientConversation';

describe('conversation variants', () => {
  it('renders single-patient messages', () => {
    const { rerender } = render(
      <SinglePatientConversation
        messages={[
          { role: 'system', content: 'hidden' },
          { role: 'user', content: 'How are you?' },
          { role: 'assistant', content: 'I feel dizzy.' },
        ]}
        isLoading={false}
        isStreaming={false}
        streamingContent=""
        userLabel="Nurse"
        userEmoji="👨‍⚕️"
        patientLabel="Patient"
        patientEmoji="🤒"
      />,
    );

    expect(screen.getByText('How are you?')).toBeInTheDocument();
    expect(screen.getByText('I feel dizzy.')).toBeInTheDocument();
    expect(screen.queryByText('hidden')).not.toBeInTheDocument();

    rerender(
      <SinglePatientConversation
        messages={[]}
        isLoading
        isStreaming={false}
        streamingContent=""
        userLabel="Nurse"
        userEmoji="N"
        patientLabel="Patient"
        patientEmoji="P"
      />,
    );
    expect(screen.getByText('P Patient')).toBeInTheDocument();

    rerender(
      <SinglePatientConversation
        messages={[]}
        isLoading={false}
        isStreaming
        streamingContent="Streaming response"
        userLabel="Nurse"
        userEmoji="N"
        patientLabel="Patient"
        patientEmoji="P"
      />,
    );
    expect(screen.getByText('Streaming response')).toBeInTheDocument();

    rerender(
      <SinglePatientConversation
        messages={[]}
        isLoading={false}
        isStreaming
        streamingContent=""
        userLabel="Nurse"
        userEmoji="N"
        patientLabel="Patient"
        patientEmoji="P"
      />,
    );
    expect(document.querySelector('.streaming-cursor.initial')).toBeInTheDocument();
  });

  it('parses partner dialogue for couples conversation', () => {
    const parsed = parseCouplesMessage(
      '[Partner A - Alex]: I feel unheard.\n\n[Partner B - Sam]: I shut down when we argue.',
    );

    expect(parsed).toEqual([
      { partner: 'A', name: 'Alex', content: 'I feel unheard.' },
      { partner: 'B', name: 'Sam', content: 'I shut down when we argue.' },
    ]);
    expect(parseCouplesMessage('No labels here')).toBeNull();
    expect(parseCouplesMessage('[Partner A]: Hello')).toEqual([
      { partner: 'A', name: 'Partner A', content: 'Hello' },
    ]);
    expect(parseCouplesMessage('[Partner A]:   ')).toBeNull();
  });

  it('renders couples assistant messages as explicit partner blocks', () => {
    const { rerender } = render(
      <CouplesConversation
        messages={[
          { role: 'user', content: 'Can you both share what happened?' },
          {
            role: 'assistant',
            content:
              '[Partner A - Alex]: I feel unheard.\n\n[Partner B - Sam]: I shut down when we argue.',
          },
        ]}
        isLoading={false}
        isStreaming={false}
        streamingContent=""
        userLabel="Therapist"
        userEmoji="🧠"
        partnerAEmoji="🧑"
        partnerBEmoji="👩"
      />,
    );

    expect(screen.getByText('🧑 Alex')).toBeInTheDocument();
    expect(screen.getByText('👩 Sam')).toBeInTheDocument();
    expect(screen.getByText('I feel unheard.')).toBeInTheDocument();
    expect(screen.getByText('I shut down when we argue.')).toBeInTheDocument();

    rerender(
      <CouplesConversation
        messages={[{
          role: 'assistant',
          content: '[Partner A - Alex]: Hi.\n\n[Partner B - Sam]: Hello.',
        }]}
        isLoading={false}
        isStreaming={false}
        streamingContent=""
        userLabel="Therapist"
        userEmoji="T"
      />,
    );
    expect(screen.getByText('🧑 Alex')).toBeInTheDocument();
    expect(screen.getByText('👩 Sam')).toBeInTheDocument();

    rerender(
      <CouplesConversation
        messages={[{ role: 'assistant', content: 'We need help.' }]}
        isLoading={false}
        isStreaming={false}
        streamingContent=""
        userLabel="Therapist"
        userEmoji="T"
      />,
    );
    expect(screen.getByText('🧑 & 👩')).toBeInTheDocument();
    expect(screen.getByText('We need help.')).toBeInTheDocument();

    rerender(
      <CouplesConversation
        messages={[]}
        isLoading
        isStreaming={false}
        streamingContent=""
        userLabel="Therapist"
        userEmoji="T"
      />,
    );
    expect(screen.getByText('🧑 & 👩')).toBeInTheDocument();

    rerender(
      <CouplesConversation
        messages={[]}
        isLoading={false}
        isStreaming
        streamingContent="[Partner A - Alex]: Streaming now"
        userLabel="Therapist"
        userEmoji="T"
        partnerAEmoji="A"
        partnerBEmoji="B"
      />,
    );
    expect(screen.getByText('A Alex')).toBeInTheDocument();
    expect(screen.getByText('Streaming now')).toBeInTheDocument();

    rerender(
      <CouplesConversation
        messages={[]}
        isLoading={false}
        isStreaming
        streamingContent="Unstructured stream"
        userLabel="Therapist"
        userEmoji="T"
      />,
    );
    expect(screen.getByText('Unstructured stream')).toBeInTheDocument();

    rerender(
      <CouplesConversation
        messages={[]}
        isLoading={false}
        isStreaming
        streamingContent=""
        userLabel="Therapist"
        userEmoji="T"
      />,
    );
    expect(document.querySelector('.streaming-cursor.initial')).toBeInTheDocument();
  });
});
