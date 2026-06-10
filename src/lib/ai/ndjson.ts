// Reads an NDJSON byte stream, invoking onLine for each complete newline-terminated
// line. Carries an incomplete trailing line across reads so a JSON object split across
// two network chunks is not silently dropped, and flushes a final unterminated line.
// onLine returns true to stop early. Releases the reader lock on exit. (B10)
export async function readNdjsonStream(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  onLine: (line: string) => boolean | void,
): Promise<void> {
  const decoder = new TextDecoder();
  let buffer = '';
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let newlineIndex: number;
      while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
        const line = buffer.slice(0, newlineIndex).trim();
        buffer = buffer.slice(newlineIndex + 1);
        if (line && onLine(line) === true) return;
      }
    }
    const tail = (buffer + decoder.decode()).trim();
    if (tail && onLine(tail) === true) return;
  } finally {
    reader.releaseLock();
  }
}
