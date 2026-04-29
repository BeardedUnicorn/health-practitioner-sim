import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { professionConfigs } from '../../../../config/professionConfig';
import { SessionToolbar } from '../SessionToolbar';

describe('SessionToolbar', () => {
  it('runs all toolbar actions and reflects active/disabled states', () => {
    const actions = {
      onNewSession: vi.fn(),
      onToggleToolkit: vi.fn(),
      onToggleAnswer: vi.fn(),
      onShowEvaluation: vi.fn(),
      onOpenSettings: vi.fn(),
      onEndSession: vi.fn(),
    };
    const { rerender } = render(
      <SessionToolbar
        professionConfig={professionConfigs.nurse}
        isLoading={false}
        isStreaming={false}
        showToolkit
        showAnswer={false}
        hasFeedback
        {...actions}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /new patient/i }));
    fireEvent.click(screen.getByRole('button', { name: /assessment toolkit/i }));
    fireEvent.click(screen.getByRole('button', { name: /reveal answer/i }));
    fireEvent.click(screen.getByRole('button', { name: /view evaluation/i }));
    fireEvent.click(screen.getByRole('button', { name: /settings/i }));
    fireEvent.click(screen.getByRole('button', { name: /end session/i }));

    expect(actions.onNewSession).toHaveBeenCalledOnce();
    expect(actions.onToggleToolkit).toHaveBeenCalledOnce();
    expect(actions.onToggleAnswer).toHaveBeenCalledOnce();
    expect(actions.onShowEvaluation).toHaveBeenCalledOnce();
    expect(actions.onOpenSettings).toHaveBeenCalledOnce();
    expect(actions.onEndSession).toHaveBeenCalledOnce();
    expect(screen.getByRole('button', { name: /assessment toolkit/i })).toHaveClass('active');

    rerender(
      <SessionToolbar
        professionConfig={professionConfigs.nurse}
        isLoading
        isStreaming={false}
        showToolkit={false}
        showAnswer
        hasFeedback={false}
        {...actions}
      />,
    );
    expect(screen.getByRole('button', { name: /new patient/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /hide answer/i })).toHaveClass('active');
    expect(screen.queryByRole('button', { name: /view evaluation/i })).not.toBeInTheDocument();
  });
});
