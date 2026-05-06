const POWERBI_API_BASE = 'https://api.powerbi.com/v1.0/myorg';

export class PowerBiAccessError extends Error {
  readonly status: number;
  constructor(status: number, datasetId: string) {
    super(
      `Power BI dataset is not accessible — ask the dataset owner to grant your account Build permission on dataset ${datasetId} (consuming a published app is not enough; REST queries need direct dataset access)`,
    );
    this.name = 'PowerBiAccessError';
    this.status = status;
  }
}

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
    if (
      res.status === 401 ||
      res.status === 403 ||
      (res.status === 404 && (body.includes('PowerBIEntityNotFound') || body.includes('ItemNotFound')))
    ) {
      throw new PowerBiAccessError(res.status, datasetId);
    }
    throw new Error(`PowerBI DAX query failed: ${res.status} ${res.statusText} — ${body.slice(0, 500)}`);
  }

  const json = (await res.json()) as ExecuteQueriesResponse;
  if (json.error) {
    throw new Error(`PowerBI DAX error [${json.error.code}]: ${json.error.message}`);
  }
  const rows = json.results?.[0]?.tables?.[0]?.rows ?? [];
  return { rows };
}
