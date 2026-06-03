import { describe, it, expect } from 'vitest';
import { parseTextToolCall } from '../ollamaService';

describe('parseTextToolCall', () => {
  it('parses the bare {name, parameters} shape', () => {
    const raw = '{"name": "search_customers", "parameters": {"query": "Dattico"}}';
    expect(parseTextToolCall(raw)).toEqual({
      function: { name: 'search_customers', arguments: { query: 'Dattico' } },
    });
  });

  it('ignores trailing prose after the JSON object', () => {
    const raw =
      '{"name": "search_customers", "parameters": {"query": "Dattico"}}\n\nPlease let me know how I can assist.';
    expect(parseTextToolCall(raw)).toEqual({
      function: { name: 'search_customers', arguments: { query: 'Dattico' } },
    });
  });

  it('parses the nested {type, function:{...}} schema shape', () => {
    const raw =
      '{"type":"function","function":{"name":"search_contacts","parameters":{"query":"Nathan de winter"}}}';
    expect(parseTextToolCall(raw)).toEqual({
      function: { name: 'search_contacts', arguments: { query: 'Nathan de winter' } },
    });
  });

  it('ignores .format() garbage appended after the object', () => {
    const raw =
      '{"type":"function","function":{"name":"search_contacts","parameters":{"query":"Nathan de winter"}}}.format(**{ "type": "function" })';
    expect(parseTextToolCall(raw)).toEqual({
      function: { name: 'search_contacts', arguments: { query: 'Nathan de winter' } },
    });
  });

  it('strips a ```json code fence', () => {
    const raw = '```json\n{"name": "get_account_overview", "parameters": {"query": "Acme"}}\n```';
    expect(parseTextToolCall(raw)).toEqual({
      function: { name: 'get_account_overview', arguments: { query: 'Acme' } },
    });
  });

  it('returns null for genuine prose', () => {
    expect(parseTextToolCall('Here is a summary of Dattico.')).toBeNull();
  });

  it('returns null for an unknown tool name', () => {
    expect(parseTextToolCall('{"name": "delete_everything", "parameters": {}}')).toBeNull();
  });
});
