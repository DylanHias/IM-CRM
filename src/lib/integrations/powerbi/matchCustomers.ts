import type { Customer } from '@/types/entities';

export interface PowerBiRevenueRow {
  bcn: string | null;
  resellerAccount: string | null;
  resellerId: string | null;
  marketplaceId: string | null;
  resellerName: string | null;
}

export type MatchableCustomer = Pick<Customer, 'id' | 'name' | 'bcn' | 'accountNumber' | 'resellerId' | 'armId'>;

export interface CustomerMatchIndex {
  byBcn: Map<string, string>;
  byAccountNumber: Map<string, string>;
  byResellerId: Map<string, string>;
  byMarketplaceId: Map<string, string>;
  /** Only names that are unique inside the CRM, so two customers never collapse onto one row. */
  byUniqueName: Map<string, string>;
}

function normalizeMarketplaceId(v: string): string {
  return v.replace(/^'|'$/g, '').trim();
}

function normalizeName(v: string): string {
  return v.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function addFirst(map: Map<string, string>, key: string | null | undefined, id: string): void {
  if (key && !map.has(key)) map.set(key, id);
}

export function buildMatchIndex(customers: MatchableCustomer[]): CustomerMatchIndex {
  const index: CustomerMatchIndex = {
    byBcn: new Map(),
    byAccountNumber: new Map(),
    byResellerId: new Map(),
    byMarketplaceId: new Map(),
    byUniqueName: new Map(),
  };
  const nameOwners = new Map<string, string[]>();
  for (const c of customers) {
    addFirst(index.byBcn, c.bcn, c.id);
    addFirst(index.byAccountNumber, c.accountNumber, c.id);
    addFirst(index.byResellerId, c.resellerId, c.id);
    addFirst(index.byMarketplaceId, c.armId && normalizeMarketplaceId(c.armId), c.id);
    const name = normalizeName(c.name);
    if (name) nameOwners.set(name, [...(nameOwners.get(name) ?? []), c.id]);
  }
  nameOwners.forEach((ids, name) => {
    if (ids.length === 1) index.byUniqueName.set(name, ids[0]);
  });
  return index;
}

export function resolveCustomerId(row: PowerBiRevenueRow, index: CustomerMatchIndex): string | null {
  return (
    (row.bcn && index.byBcn.get(row.bcn))
    || (row.resellerAccount && index.byAccountNumber.get(row.resellerAccount))
    || (row.resellerId && index.byResellerId.get(row.resellerId))
    || (row.marketplaceId && index.byMarketplaceId.get(normalizeMarketplaceId(row.marketplaceId)))
    || (row.resellerName && index.byUniqueName.get(normalizeName(row.resellerName)))
    || null
  );
}
