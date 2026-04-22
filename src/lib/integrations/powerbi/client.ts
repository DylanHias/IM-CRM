const POWERBI_API_BASE = 'https://api.powerbi.com/v1.0/myorg';

export interface DaxQueryResult {
  rows: Record<string, unknown>[];
}

interface ExecuteQueriesResponse {
  results?: { tables?: { rows: Record<string, unknown>[] }[] }[];
  error?: { code: string; message: string };
}

export async function executeDaxQuery(
  token: string,
  workspaceId: string | null,
  datasetId: string,
  dax: string,
): Promise<DaxQueryResult> {
  const url = workspaceId
    ? `${POWERBI_API_BASE}/groups/${workspaceId}/datasets/${datasetId}/executeQueries`
    : `${POWERBI_API_BASE}/datasets/${datasetId}/executeQueries`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      queries: [{ query: dax }],
      serializerSettings: { includeNulls: true },
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`PowerBI DAX query failed: ${res.status} ${res.statusText} — ${body.slice(0, 500)}`);
  }

  const json = (await res.json()) as ExecuteQueriesResponse;
  if (json.error) {
    throw new Error(`PowerBI DAX error [${json.error.code}]: ${json.error.message}`);
  }
  const rows = json.results?.[0]?.tables?.[0]?.rows ?? [];
  return { rows };
}
