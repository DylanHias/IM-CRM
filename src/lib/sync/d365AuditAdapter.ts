import type { D365AuditRecord, D365ODataResponse } from '@/types/api';
import type { AuditLogEntry } from '@/types/admin';

const OPERATION_MAP: Record<number, AuditLogEntry['action']> = {
  1: 'create',
  2: 'update',
  3: 'delete',
};

const ENTITY_TYPE_MAP: Record<string, AuditLogEntry['entityType']> = {
  account: 'customer',
  contact: 'contact',
  phonecall: 'activity',
  appointment: 'activity',
  annotation: 'activity',
  task: 'follow_up',
  opportunity: 'opportunity',
};

function mapD365AuditToEntry(d365: D365AuditRecord): AuditLogEntry | null {
  const action = OPERATION_MAP[d365.operation];
  if (!action) return null;

  const entityType = ENTITY_TYPE_MAP[d365.objecttypecode?.toLowerCase()];
  if (!entityType) return null;

  let oldValues: Record<string, unknown> | null = null;
  let newValues: Record<string, unknown> | null = null;

  if (d365.changedata) {
    try {
      const parsed = JSON.parse(d365.changedata);
      if (parsed.changedAttributes) {
        oldValues = {};
        newValues = {};
        for (const attr of parsed.changedAttributes) {
          if (attr.oldValue !== undefined) oldValues[attr.logicalName] = attr.oldValue;
          if (attr.newValue !== undefined) newValues[attr.logicalName] = attr.newValue;
        }
      }
    } catch {
      // changedata may not be valid JSON in all D365 orgs
    }
  }

  return {
    id: 0, // Will be assigned by SQLite on insert
    entityType,
    entityId: d365._objectid_value,
    action,
    changedById: d365._userid_value,
    changedByName: d365['userid@OData.Community.Display.V1.FormattedValue'] ?? 'Unknown',
    oldValues,
    newValues,
    changedAt: d365.createdon,
  };
}

interface AuditFetchFilters {
  dateFrom?: string;
  dateTo?: string;
  entityType?: string;
  userId?: string;
}

export async function fetchD365AuditLog(
  token: string,
  filters?: AuditFetchFilters
): Promise<AuditLogEntry[]> {
  const baseUrl = process.env.NEXT_PUBLIC_D365_BASE_URL;
  if (!baseUrl) return [];

  const select = [
    'auditid', 'createdon', '_userid_value', '_objectid_value',
    'objecttypecode', 'operation', 'changedata',
  ].join(',');

  const filterParts: string[] = [];
  if (filters?.dateFrom) filterParts.push(`createdon ge ${filters.dateFrom}`);
  if (filters?.dateTo) filterParts.push(`createdon le ${filters.dateTo}`);
  if (filters?.userId) filterParts.push(`_userid_value eq ${filters.userId}`);

  const filterStr = filterParts.length > 0 ? `&$filter=${filterParts.join(' and ')}` : '';

  const results: D365AuditRecord[] = [];
  let url: string | undefined = `${baseUrl}/api/data/v9.2/audits?$select=${select}${filterStr}&$orderby=createdon desc&$top=500`;

  while (url) {
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        'OData-MaxVersion': '4.0',
        'OData-Version': '4.0',
        Accept: 'application/json',
      },
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`D365 audit API error ${res.status}: ${text}`);
    }

    const json: D365ODataResponse<D365AuditRecord> = await res.json();
    results.push(...json.value);
    url = json['@odata.nextLink'];
  }

  return results
    .map(mapD365AuditToEntry)
    .filter((entry): entry is AuditLogEntry => entry !== null);
}
