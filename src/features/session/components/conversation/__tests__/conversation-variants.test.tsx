import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CouplesConversation, parseCouplesMessage } from '../CouplesConversation';
import { SinglePatientConversation } from '../SinglePatientConversation';

describe('conversation variants', () => {
  it('renders single-patient messages', () => {
    render(
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
  });

  it('parses partner dialogue for couples conversation', () => {
    const parsed = parseCouplesMessage(
      '[Partner A - Alex]: I feel unheard.\n\n[Partner B - Sam]: I shut down when we argue.',
    );

    expect(parsed).toEqual([
      { partner: 'A', name: 'Alex', content: 'I feel unheard.' },
      { partner: 'B', name: 'Sam', content: 'I shut down when we argue.' },
    ]);
  });

  it('renders couples assistant messages as explicit partner blocks', () => {
    render(
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
  });
});
