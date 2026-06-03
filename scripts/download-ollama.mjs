/**
 * Downloads the Ollama distribution for Windows if not already present.
 *
 * Modern Ollama ships the inference engine as a separate `llama-server.exe`
 * (plus ggml backend DLLs) under `lib/ollama/`. Bundling only `ollama.exe`
 * lets the server start and answer /api/tags, but ANY chat fails with
 * "llama-server binary not found". So we extract the full zip:
 *   - ollama.exe          → src-tauri/binaries/ollama-x86_64-pc-windows-msvc.exe (the Tauri sidecar)
 *   - lib/                → src-tauri/binaries/lib/  (bundled as a resource next to the exe)
 *
 * The GPU runner variants (cuda/rocm) are pruned — they add ~1 GB and the CPU
 * runner is plenty for the small qwen2.5:3b model.
 *
 * Run automatically before dev/build via beforeDevCommand / beforeBuildCommand.
 */
import { existsSync, mkdirSync, createWriteStream, unlinkSync, cpSync, rmSync, readdirSync, statSync } from 'fs';
import { pipeline } from 'stream/promises';
import { Readable } from 'stream';
import { resolve, dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));

const BIN_DIR = resolve(__dirname, '../src-tauri/binaries');
const TARGET = join(BIN_DIR, 'ollama-x86_64-pc-windows-msvc.exe');
const LIB_TARGET = join(BIN_DIR, 'lib');
const ZIP_URL = 'https://github.com/ollama/ollama/releases/latest/download/ollama-windows-amd64.zip';
const ZIP_TMP = join(BIN_DIR, '_ollama-tmp.zip');
const EXTRACT_DIR = join(BIN_DIR, '_ollama-extract');

// Both the sidecar exe AND the runner lib must be present, otherwise re-fetch.
if (existsSync(TARGET) && existsSync(LIB_TARGET)) {
  console.log('[download-ollama] Binary and runner already present, skipping.');
  process.exit(0);
}

if (process.platform !== 'win32') {
  console.log('[download-ollama] Non-Windows platform — skipping.');
  process.exit(0);
}

mkdirSync(BIN_DIR, { recursive: true });
console.log('[download-ollama] Downloading Ollama for Windows (full distribution)...');

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

console.log('[download-ollama] Extracting...');
try {
  if (existsSync(EXTRACT_DIR)) rmSync(EXTRACT_DIR, { recursive: true, force: true });
  mkdirSync(EXTRACT_DIR, { recursive: true });
  execSync(
    `powershell -NoProfile -Command "Expand-Archive -Force -Path '${ZIP_TMP}' -DestinationPath '${EXTRACT_DIR}'"`,
    { stdio: 'pipe' }
  );

  const extractedExe = join(EXTRACT_DIR, 'ollama.exe');
  const extractedLib = join(EXTRACT_DIR, 'lib');
  if (!existsSync(extractedExe)) throw new Error('ollama.exe not found in zip after extraction');
  if (!existsSync(extractedLib)) throw new Error('lib/ folder (llama-server runner) not found in zip');

  // Sidecar exe (Tauri renames externalBin with the target triple suffix).
  cpSync(extractedExe, TARGET);

  // Runner libs — bundled next to the exe via bundle.resources in tauri.conf.json.
  if (existsSync(LIB_TARGET)) rmSync(LIB_TARGET, { recursive: true, force: true });
  cpSync(extractedLib, LIB_TARGET, { recursive: true });

  // Prune GPU runners (cuda*/rocm*) — CPU is plenty for qwen2.5:3b and saves ~1 GB.
  const ollamaLib = join(LIB_TARGET, 'ollama');
  if (existsSync(ollamaLib)) {
    for (const name of readdirSync(ollamaLib)) {
      const full = join(ollamaLib, name);
      if (statSync(full).isDirectory() && /^(cuda|rocm)/i.test(name)) {
        rmSync(full, { recursive: true, force: true });
        console.log(`[download-ollama] Pruned GPU runner: lib/ollama/${name}`);
      }
    }
  }

  if (!existsSync(join(ollamaLib, 'llama-server.exe'))) {
    throw new Error('llama-server.exe missing after extraction — Ollama zip layout may have changed');
  }
} catch (err) {
  console.error('[download-ollama] Extraction failed:', err);
  if (existsSync(TARGET)) unlinkSync(TARGET);
  if (existsSync(LIB_TARGET)) rmSync(LIB_TARGET, { recursive: true, force: true });
  process.exit(1);
} finally {
  try { unlinkSync(ZIP_TMP); } catch { /* ignore */ }
  try { rmSync(EXTRACT_DIR, { recursive: true, force: true }); } catch { /* ignore */ }
}

console.log('[download-ollama] Done — ollama.exe + lib/ollama runner ready.');
