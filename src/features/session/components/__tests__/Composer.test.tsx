import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { InteractiveComposer, SummaryRequiredComposer } from '../Composer';

const baseProps = {
  currentMessage: '',
  onMessageChange: vi.fn(),
  onSend: vi.fn(),
  onToggleCoach: vi.fn(),
  onToggleInlineCoach: vi.fn(),
  showCoach: false,
  inlineCoachEnabled: false,
  isLoading: false,
  isStreaming: false,
  hasFeedback: false,
  onStopStreaming: vi.fn(),
  placeholder: 'Ask',
};

describe('Composer', () => {
  it('sends on button and Enter while preserving Shift+Enter', () => {
    const onSend = vi.fn();
    const onMessageChange = vi.fn();
    render(
      <InteractiveComposer
        {...baseProps}
        currentMessage="hello"
        onSend={onSend}
        onMessageChange={onMessageChange}
        showCoach
        inlineCoachEnabled
      />,
    );

    expect(screen.getByTitle('Toggle Coach Panel')).toHaveClass('active');
    expect(screen.getByTitle('Disable Quick Suggestions')).toHaveClass('active');
    fireEvent.change(screen.getByPlaceholderText('Ask'), { target: { value: 'updated' } });
    expect(onMessageChange).toHaveBeenCalledWith('updated');
    fireEvent.keyDown(screen.getByPlaceholderText('Ask'), { key: 'Enter', shiftKey: true });
    expect(onSend).not.toHaveBeenCalled();
    fireEvent.keyDown(screen.getByPlaceholderText('Ask'), { key: 'Enter', shiftKey: false });
    fireEvent.click(screen.getByRole('button', { name: /send/i }));
    expect(onSend).toHaveBeenCalledTimes(2);
  });

  it('disables send/input and toggles coach controls', () => {
    const onToggleCoach = vi.fn();
    const onToggleInlineCoach = vi.fn();
    const { rerender } = render(
      <SummaryRequiredComposer
        {...baseProps}
        onToggleCoach={onToggleCoach}
        onToggleInlineCoach={onToggleInlineCoach}
        isLoading
      />,
    );

    fireEvent.click(screen.getByTitle('Toggle Coach Panel'));
    fireEvent.click(screen.getByTitle('Enable Quick Suggestions'));
    expect(onToggleCoach).toHaveBeenCalledOnce();
    expect(onToggleInlineCoach).toHaveBeenCalledOnce();
    expect(screen.getByRole('button', { name: /send/i })).toBeDisabled();
    expect(screen.getByPlaceholderText('Ask')).toBeDisabled();

    rerender(<SummaryRequiredComposer {...baseProps} currentMessage="ready" hasFeedback />);
    expect(screen.getByRole('button', { name: /send/i })).toBeDisabled();
    expect(screen.getByPlaceholderText('Ask')).toBeDisabled();
  });

  it('shows stop button while streaming', () => {
    const onStopStreaming = vi.fn();
    render(
      <InteractiveComposer
        {...baseProps}
        currentMessage="hello"
        isStreaming
        onStopStreaming={onStopStreaming}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /stop/i }));
    expect(onStopStreaming).toHaveBeenCalledOnce();
  });

  it('keeps the input enabled when loading reflects an active stream', () => {
    render(
      <InteractiveComposer
        {...baseProps}
        currentMessage="hello"
        isLoading
        isStreaming
      />,
    );

    expect(screen.getByPlaceholderText('Ask')).not.toBeDisabled();
  });
});
