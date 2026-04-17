/**
 * Downloads the Ollama binary for Windows if not already present.
 * Run automatically before dev/build via beforeDevCommand / beforeBuildCommand.
 */
import { existsSync, mkdirSync, createWriteStream, unlinkSync } from 'fs';
import { pipeline } from 'stream/promises';
import { Readable } from 'stream';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const TARGET = resolve(__dirname, '../src-tauri/binaries/ollama-x86_64-pc-windows-msvc.exe');
const URL = 'https://github.com/ollama/ollama/releases/latest/download/ollama-windows-amd64.exe';

if (existsSync(TARGET)) {
  console.log('[download-ollama] Binary already present, skipping.');
  process.exit(0);
}

mkdirSync(dirname(TARGET), { recursive: true });
console.log('[download-ollama] Downloading Ollama binary (~150 MB)...');

const res = await fetch(URL);
if (!res.ok) {
  console.error(`[download-ollama] Download failed: HTTP ${res.status}`);
  process.exit(1);
}

const writer = createWriteStream(TARGET);
try {
  await pipeline(Readable.fromWeb(res.body), writer);
  console.log('[download-ollama] Done.');
} catch (err) {
  // Clean up partial file on failure
  writer.destroy();
  if (existsSync(TARGET)) unlinkSync(TARGET);
  console.error('[download-ollama] Failed:', err);
  process.exit(1);
}
