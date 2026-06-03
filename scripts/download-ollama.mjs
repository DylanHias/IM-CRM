/**
 * Downloads the Ollama binary for Windows if not already present.
 * Fetches the zip release and extracts ollama.exe using PowerShell.
 * Run automatically before dev/build via beforeDevCommand / beforeBuildCommand.
 */
import { existsSync, mkdirSync, createWriteStream, unlinkSync } from 'fs';
import { pipeline } from 'stream/promises';
import { Readable } from 'stream';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));

const TARGET = resolve(__dirname, '../src-tauri/binaries/ollama-x86_64-pc-windows-msvc.exe');
const ZIP_URL = 'https://github.com/ollama/ollama/releases/latest/download/ollama-windows-amd64.zip';
const ZIP_TMP = resolve(dirname(TARGET), '_ollama-tmp.zip');
const EXTRACT_DIR = resolve(dirname(TARGET), '_ollama-extract');

if (existsSync(TARGET)) {
  console.log('[download-ollama] Binary already present, skipping.');
  process.exit(0);
}

if (process.platform !== 'win32') {
  console.log('[download-ollama] Non-Windows platform — skipping.');
  process.exit(0);
}

mkdirSync(dirname(TARGET), { recursive: true });
console.log('[download-ollama] Downloading Ollama for Windows...');

const res = await fetch(ZIP_URL);
if (!res.ok) {
  console.error(`[download-ollama] Download failed: HTTP ${res.status}`);
  process.exit(1);
}

const writer = createWriteStream(ZIP_TMP);
try {
  await pipeline(Readable.fromWeb(res.body), writer);
} catch (err) {
  writer.destroy();
  if (existsSync(ZIP_TMP)) unlinkSync(ZIP_TMP);
  console.error('[download-ollama] Download stream failed:', err);
  process.exit(1);
}

console.log('[download-ollama] Extracting ollama.exe...');
try {
  mkdirSync(EXTRACT_DIR, { recursive: true });
  execSync(
    `powershell -NoProfile -Command "Expand-Archive -Force -Path '${ZIP_TMP}' -DestinationPath '${EXTRACT_DIR}'"`,
    { stdio: 'pipe' }
  );

  const extracted = resolve(EXTRACT_DIR, 'ollama.exe');
  if (!existsSync(extracted)) {
    throw new Error('ollama.exe not found in zip after extraction');
  }

  // Can't rename across drives if tmp dirs differ — use copy + delete instead
  execSync(
    `powershell -NoProfile -Command "Copy-Item -Path '${extracted}' -Destination '${TARGET}'"`,
    { stdio: 'pipe' }
  );
} catch (err) {
  console.error('[download-ollama] Extraction failed:', err);
  if (existsSync(TARGET)) unlinkSync(TARGET);
  process.exit(1);
} finally {
  try { unlinkSync(ZIP_TMP); } catch { /* ignore */ }
  try {
    execSync(`powershell -NoProfile -Command "Remove-Item -Recurse -Force '${EXTRACT_DIR}'"`, { stdio: 'pipe' });
  } catch { /* ignore */ }
}

console.log('[download-ollama] Done.');
