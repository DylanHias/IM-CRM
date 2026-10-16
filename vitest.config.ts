import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

// Next loads docs/help/*.md as plain strings (asset/source); mirror that in tests.
const markdownAsText = {
  name: 'markdown-as-text',
  transform(code: string, id: string) {
    return id.endsWith('.md') ? { code: `export default ${JSON.stringify(code)};`, map: null } : null;
  },
};

export default defineConfig({
  plugins: [react(), markdownAsText],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['src/__tests__/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    exclude: ['node_modules', '.next', 'src-tauri'],
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'json-summary'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/__tests__/**',
        'src/**/*.test.{ts,tsx}',
        'src/app/**/layout.tsx',
        'src/app/**/page.tsx',
        'src/styles/**',
      ],
      thresholds: {
        lines: 70,
        branches: 60,
        functions: 70,
      },
    },
  },
});
