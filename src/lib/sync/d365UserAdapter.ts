import type { D365SystemUser, D365ODataResponse } from '@/types/api';
import type { CrmUser } from '@/types/admin';

function mapD365UserToCrmUser(d365: D365SystemUser, now: string): CrmUser {
  return {
    id: d365.systemuserid,
    email: d365.internalemailaddress ?? '',
    name: d365.fullname,
    role: 'user',
    businessUnit: d365['_businessunitid_value@OData.Community.Display.V1.FormattedValue'] ?? null,
    lastActiveAt: d365.modifiedon,
    createdAt: now,
    updatedAt: now,
  };
}

export async function fetchD365Users(token: string): Promise<CrmUser[]> {
  const baseUrl = process.env.NEXT_PUBLIC_D365_BASE_URL;
  if (!baseUrl) return [];

  const select = [
    'systemuserid', 'fullname', 'internalemailaddress', 'isdisabled', 'modifiedon',
  ].join(',');

  const results: D365SystemUser[] = [];
  let url: string | undefined = `${baseUrl}/api/data/v9.2/systemusers?$select=${select},_businessunitid_value&$filter=isdisabled eq false`;

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
      throw new Error(`D365 systemusers API error ${res.status}: ${text}`);
    }

    const json: D365ODataResponse<D365SystemUser> = await res.json();
    results.push(...json.value);
    url = json['@odata.nextLink'];
  }

  const now = new Date().toISOString();
  return results.map((r) => mapD365UserToCrmUser(r, now));
}
