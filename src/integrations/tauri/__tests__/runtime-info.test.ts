import { describe, expect, it, vi } from 'vitest';
import { getRuntimeInfo } from '../runtime-info';

const invokeMock = vi.fn();

vi.mock('@tauri-apps/api/core', () => ({
  invoke: (...args: unknown[]) => invokeMock(...args),
}));

describe('getRuntimeInfo', () => {
  it('returns web fallback when not running in Tauri', async () => {
    delete (window as Window & { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__;

    const info = await getRuntimeInfo();

    expect(info.tauriVersion).toBe('web');
    expect(info.appVersion).toBe('web-dev');
  });

  it('invokes runtime_info command inside Tauri runtime', async () => {
    (window as Window & { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__ = {};
    invokeMock.mockResolvedValueOnce({
      appVersion: '0.1.0',
      platform: 'darwin',
      tauriVersion: '2.9.5',
    });

    const info = await getRuntimeInfo();

    expect(invokeMock).toHaveBeenCalledWith('runtime_info');
    expect(info).toEqual({
      appVersion: '0.1.0',
      platform: 'darwin',
      tauriVersion: '2.9.5',
    });

    delete (window as Window & { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__;
  });
});
