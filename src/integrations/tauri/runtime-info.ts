import { RuntimeInfo } from '../../types';

const FALLBACK_RUNTIME_INFO: RuntimeInfo = {
  appVersion: 'web-dev',
  platform: typeof navigator !== 'undefined' ? navigator.platform : 'web',
  tauriVersion: 'web',
};

function isTauriRuntime(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
}

export async function getRuntimeInfo(): Promise<RuntimeInfo> {
  if (!isTauriRuntime()) {
    return FALLBACK_RUNTIME_INFO;
  }

  try {
    const { invoke } = await import('@tauri-apps/api/core');
    return await invoke<RuntimeInfo>('runtime_info');
  } catch {
    return FALLBACK_RUNTIME_INFO;
  }
}
