import type { D365SystemUser, D365ODataResponse } from '@/types/api';
import type { CrmUser } from '@/types/admin';

const TEAM_NAME = 'Cloud Users - Belgium';

const LAST_ACTION_ENTITIES = ['phonecalls', 'appointments', 'annotations', 'tasks', 'opportunities'] as const;

function mapD365UserToCrmUser(d365: D365SystemUser, now: string, lastActionMap: Map<string, string>): CrmUser {
  return {
    id: d365.systemuserid,
    email: d365.internalemailaddress ?? '',
    name: d365.fullname,
    role: 'user',
    businessUnit: d365['_businessunitid_value@OData.Community.Display.V1.FormattedValue'] ?? null,
    title: d365.jobtitle ?? null,
    lastActiveAt: lastActionMap.get(d365.systemuserid) ?? d365.modifiedon,
    profilePhoto: null,
    createdAt: now,
    updatedAt: now,
  };
}

async function fetchLastActionByUser(baseUrl: string, token: string): Promise<Map<string, string>> {
  const headers = {
    Authorization: `Bearer ${token}`,
    'OData-MaxVersion': '4.0',
    'OData-Version': '4.0',
    Accept: 'application/json',
  };

  const results = await Promise.allSettled(
    LAST_ACTION_ENTITIES.map((entity) =>
      fetch(
        `${baseUrl}/api/data/v9.2/${entity}?$apply=groupby((_modifiedby_value),aggregate(modifiedon with max as maxDate))`,
        { headers },
      ).then((res) => {
        if (!res.ok) throw new Error(`D365 ${entity} aggregate error ${res.status}`);
        return res.json() as Promise<{ value: { _modifiedby_value: string; maxDate: string }[] }>;
      }),
    ),
  );

  const map = new Map<string, string>();
  for (const result of results) {
    if (result.status === 'rejected') {
      console.error('[admin] fetchLastActionByUser entity failed:', result.reason);
      continue;
    }
    for (const row of result.value.value) {
      const userId = row._modifiedby_value;
      const date = row.maxDate;
      if (!userId || !date) continue;
      const existing = map.get(userId);
      if (!existing || date > existing) map.set(userId, date);
    }
  }

  return map;
}

async function fetchTeamId(baseUrl: string, token: string): Promise<string | null> {
  const url = `${baseUrl}/api/data/v9.2/teams?$filter=name eq '${TEAM_NAME}'&$select=teamid`;
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
    throw new Error(`D365 teams API error ${res.status}: ${text}`);
  }

  const json = await res.json();
  return json.value?.[0]?.teamid ?? null;
}

async function fetchTeamMembers(token: string): Promise<D365SystemUser[]> {
  const baseUrl = process.env.NEXT_PUBLIC_D365_BASE_URL;
  if (!baseUrl) return [];

  const teamId = await fetchTeamId(baseUrl, token);
  if (!teamId) {
    console.error(`[admin] Team "${TEAM_NAME}" not found in D365`);
    return [];
  }

  const select = [
    'systemuserid', 'fullname', 'internalemailaddress', 'jobtitle', 'isdisabled', 'modifiedon',
  ].join(',');

  const results: D365SystemUser[] = [];
  let url: string | undefined = `${baseUrl}/api/data/v9.2/teams(${teamId})/teammembership_association?$select=${select},_businessunitid_value&$filter=isdisabled eq false`;

  while (url) {
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        'OData-MaxVersion': '4.0',
        'OData-Version': '4.0',
        Accept: 'application/json',
        Prefer: 'odata.include-annotations="*"',
      },
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`D365 team members API error ${res.status}: ${text}`);
    }

    const json: D365ODataResponse<D365SystemUser> = await res.json();
    results.push(...json.value);
    url = json['@odata.nextLink'];
  }

  return results;
}

export async function fetchD365Users(token: string): Promise<CrmUser[]> {
  const baseUrl = process.env.NEXT_PUBLIC_D365_BASE_URL;
  if (!baseUrl) return [];

  const [results, lastActionMap] = await Promise.all([
    fetchTeamMembers(token),
    fetchLastActionByUser(baseUrl, token).catch((err) => {
      console.error('[admin] fetchLastActionByUser failed, falling back to modifiedon:', err);
      return new Map<string, string>();
    }),
  ]);

  const now = new Date().toISOString();
  return results.map((r) => mapD365UserToCrmUser(r, now, lastActionMap));
}

export async function fetchD365TeamUserIds(token: string): Promise<Set<string>> {
  const results = await fetchTeamMembers(token);
  return new Set(results.map((r) => r.systemuserid));
}
