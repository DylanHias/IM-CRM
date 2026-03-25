import { vi } from 'vitest';

interface MockExecuteResult {
  rowsAffected: number;
  lastInsertId: number;
}

export class MockDatabase {
  private selectResults: Map<string, unknown[]> = new Map();
  private executeResults: Map<string, MockExecuteResult> = new Map();

  execute = vi.fn().mockImplementation(async (): Promise<MockExecuteResult> => {
    return { rowsAffected: 0, lastInsertId: 0 };
  });

  select = vi.fn().mockImplementation(async (): Promise<unknown[]> => {
    return [];
  });

  setSelectResult(queryPattern: string, result: unknown[]): void {
    this.selectResults.set(queryPattern, result);
    this.select.mockImplementation(async (query: string) => {
      for (const [pattern, res] of this.selectResults) {
        if (query.includes(pattern)) return res;
      }
      return [];
    });
  }

  setExecuteResult(queryPattern: string, result: MockExecuteResult): void {
    this.executeResults.set(queryPattern, result);
    this.execute.mockImplementation(async (query: string) => {
      for (const [pattern, res] of this.executeResults) {
        if (query.includes(pattern)) return res;
      }
      return { rowsAffected: 0, lastInsertId: 0 };
    });
  }
}

export function createMockDb(): MockDatabase {
  return new MockDatabase();
}
