import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { LATEST_SCHEMA_VERSION } from '../client';

const clientSource = readFileSync(
  resolve(process.cwd(), 'src/lib/db/client.ts'),
  'utf8',
);

describe('schema version invariant', () => {
  it('LATEST_SCHEMA_VERSION equals the highest migration version', () => {
    const versions = Array.from(
      clientSource.matchAll(
        /value = '(\d+)', updated_at = datetime\('now'\) WHERE key = 'schema_version'/g,
      ),
      (m) => Number(m[1]),
    );

    expect(versions.length).toBeGreaterThan(0);
    expect(LATEST_SCHEMA_VERSION).toBe(Math.max(...versions));
  });

  it('fresh-install seed stamps LATEST_SCHEMA_VERSION, not a hardcoded number', () => {
    expect(clientSource).toMatch(
      /VALUES \('schema_version', '\$\{LATEST_SCHEMA_VERSION\}'\)/,
    );
  });
});
