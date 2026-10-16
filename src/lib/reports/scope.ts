import { REGION_COUNTRIES, type Region } from '@/lib/revenue/region';

export type ReportScope =
  | { kind: 'mine'; userIds: string[] }
  | { kind: 'team'; region: Region };

export interface SqlFragment {
  sql: string;
  params: unknown[];
}

function inList(column: string, values: readonly string[], offset: number): SqlFragment {
  if (values.length === 0) return { sql: '1=0', params: [] };
  const placeholders = values.map((_, i) => `$${offset + i + 1}`).join(', ');
  return { sql: `${column} IN (${placeholders})`, params: [...values] };
}

/** Filters a `customers c` row. Team = every account in the region, regardless of owner. */
export function accountScopeSql(s: ReportScope, offset: number): SqlFragment {
  return s.kind === 'mine'
    ? inList('c.owner_id', s.userIds, offset)
    : inList('c.address_country', REGION_COUNTRIES[s.region], offset);
}

/** Filters an `opportunities o` row. created_by_id holds the deal owner. */
export function dealScopeSql(s: ReportScope, offset: number): SqlFragment {
  if (s.kind === 'mine') return inList('o.created_by_id', s.userIds, offset);
  const { sql, params } = inList('address_country', REGION_COUNTRIES[s.region], offset);
  return { sql: `o.customer_id IN (SELECT id FROM customers WHERE ${sql})`, params };
}
