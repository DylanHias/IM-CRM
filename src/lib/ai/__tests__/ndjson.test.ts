import { describe, it, expect } from 'vitest';
import { readNdjsonStream } from '../ndjson';

function readerFromChunks(chunks: string[]): ReadableStreamDefaultReader<Uint8Array> {
  const encoder = new TextEncoder();
  let i = 0;
  return {
    read: async () =>
      i < chunks.length
        ? { done: false, value: encoder.encode(chunks[i++]) }
        : { done: true, value: undefined },
    releaseLock: () => {},
  } as unknown as ReadableStreamDefaultReader<Uint8Array>;
}

describe('readNdjsonStream', () => {
  it('reassembles a JSON line split across two chunks (B10)', async () => {
    const lines: string[] = [];
    await readNdjsonStream(readerFromChunks(['{"a":1}\n{"b":', '2}\n']), (l) => {
      lines.push(l);
    });
    expect(lines).toEqual(['{"a":1}', '{"b":2}']);
  });

  it('flushes a final line with no trailing newline', async () => {
    const lines: string[] = [];
    await readNdjsonStream(readerFromChunks(['{"x":1}']), (l) => {
      lines.push(l);
    });
    expect(lines).toEqual(['{"x":1}']);
  });

  it('skips blank lines and stops early when onLine returns true', async () => {
    const lines: string[] = [];
    await readNdjsonStream(readerFromChunks(['a\n\nb\nc\n']), (l) => {
      lines.push(l);
      return l === 'b';
    });
    expect(lines).toEqual(['a', 'b']);
  });
});
