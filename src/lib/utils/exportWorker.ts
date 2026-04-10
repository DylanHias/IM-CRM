import { utils, write } from 'xlsx';

interface WorkerInput {
  tables: { name: string; rows: Record<string, unknown>[] }[];
  bookType: 'xlsx' | 'csv';
}

self.onmessage = (e: MessageEvent<WorkerInput>) => {
  const { tables, bookType } = e.data;
  const wb = utils.book_new();

  for (const { name, rows } of tables) {
    const ws = utils.json_to_sheet(rows);
    utils.book_append_sheet(wb, ws, name);
  }

  const buffer = write(wb, { bookType, type: 'array' }) as ArrayBuffer;
  self.postMessage(buffer, { transfer: [buffer] });
};
