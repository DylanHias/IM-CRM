import { isTauriApp } from '@/lib/utils/offlineUtils';

/** Opens a URL in the user's default browser (desktop) or a new tab (web). */
export async function openExternal(url: string): Promise<void> {
  try {
    if (isTauriApp()) {
      const { open } = await import('@tauri-apps/plugin-shell');
      await open(url);
      return;
    }
    window.open(url, '_blank', 'noopener,noreferrer');
  } catch (err) {
    console.error('[data] Failed to open external link:', err);
  }
}
