import { describe, it, expect } from 'vitest';
import { createThinkStripper } from '../ollamaService';

/** Feed each chunk through the stripper and return the concatenated emitted text. */
function run(chunks: string[]): string {
  let out = '';
  const stripper = createThinkStripper((t) => {
    out += t;
  });
  for (const c of chunks) stripper.onChunk(c);
  stripper.flush();
  return out;
}

describe('createThinkStripper', () => {
  it('removes a whole think block and keeps the answer', () => {
    expect(run(['<think>reasoning here</think>\n\nThe answer.'])).toBe('\n\nThe answer.');
  });

  it('passes prose through untouched when there is no think block', () => {
    expect(run(['Hello ', 'world.'])).toBe('Hello world.');
  });

  it('strips the open tag split across chunk boundaries', () => {
    expect(run(['<th', 'ink>secret', '</think>visible'])).toBe('visible');
  });

  it('strips the close tag split across chunk boundaries', () => {
    expect(run(['<think>secret</thi', 'nk>visible'])).toBe('visible');
  });

  it('suppresses everything while a think block never closes', () => {
    expect(run(['<think>still thinking and the stream ended'])).toBe('');
  });

  it('emits content that arrives before a think block', () => {
    expect(run(['prefix <think>x</think> suffix'])).toBe('prefix  suffix');
  });

  it('handles token-by-token streaming of a full exchange', () => {
    const tokens = '<think>\nlet me check\n</think>\n\nDone.'.split('');
    expect(run(tokens)).toBe('\n\nDone.');
  });

  it('does not lose a trailing partial tag-prefix that turns out to be prose', () => {
    expect(run(['answer <', 'th not a tag'])).toBe('answer <th not a tag');
  });
});
