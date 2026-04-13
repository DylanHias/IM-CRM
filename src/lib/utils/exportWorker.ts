import { utils, write } from 'xlsx';

// Receives a zero-copy transferred ArrayBuffer containing JSON-encoded payload.
// Using ArrayBuffer transfer avoids the synchronous structured-clone cost that
// blocked the main thread when posting large row arrays directly as objects.
self.onmessage = (e: MessageEvent<ArrayBuffer>) => {
  const { tables, bookType } = JSON.parse(new TextDecoder().decode(e.data)) as {
    tables: { name: string; rows: Record<string, unknown>[] }[];
    bookType: 'xlsx';
  };
  const wb = utils.book_new();
  for (const { name, rows } of tables) {
    const ws = utils.json_to_sheet(rows);
    utils.book_append_sheet(wb, ws, name);
  }
  // xlsx.write with type:'array' returns Uint8Array — extract its underlying ArrayBuffer
  // so it can be transferred (zero-copy) rather than structured-cloned back to main thread
  const result = write(wb, { bookType, type: 'array' }) as unknown as Uint8Array;
  const buffer = result.buffer as ArrayBuffer;
  self.postMessage(buffer, { transfer: [buffer] });
};
