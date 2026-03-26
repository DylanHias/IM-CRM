import { toast } from 'sonner';
import { isTauriApp } from '@/lib/utils/offlineUtils';

interface ExportOptions {
  defaultName: string;
  filterLabel: string;
  extensions: string[];
  data: ArrayBuffer;
}

export async function exportFile({ defaultName, filterLabel, extensions, data }: ExportOptions): Promise<void> {
  if (!isTauriApp()) {
    browserDownload(defaultName, data);
    return;
  }

  try {
    const { save } = await import('@tauri-apps/plugin-dialog');
    const path = await save({
      defaultPath: defaultName,
      filters: [{ name: filterLabel, extensions }],
    });

    if (!path) return; // user cancelled

    const { writeFile } = await import('@tauri-apps/plugin-fs');
    await writeFile(path, new Uint8Array(data));

    toast.success('Export successful', { description: path });
  } catch (err) {
    console.error('[data] Export failed:', err);
    toast.error('Export failed', {
      description: err instanceof Error ? err.message : 'Unknown error',
    });
  }
}

function browserDownload(filename: string, data: ArrayBuffer) {
  const blob = new Blob([data]);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
  toast.success('Export successful', { description: filename });
}
