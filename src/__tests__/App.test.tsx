import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import App from '../App';

vi.mock('../app/state/app-context', () => ({
  AppProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="app-provider">{children}</div>,
}));

vi.mock('../features/session/state/session-context', () => ({
  SessionProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="session-provider">{children}</div>,
}));

vi.mock('../app/AppShell', () => ({
  AppShell: () => <div data-testid="app-shell" />,
}));

describe('App', () => {
  it('composes app and session providers around the shell', () => {
    render(<App />);

    expect(screen.getByTestId('app-provider')).toContainElement(screen.getByTestId('session-provider'));
    expect(screen.getByTestId('session-provider')).toContainElement(screen.getByTestId('app-shell'));
  });
});
