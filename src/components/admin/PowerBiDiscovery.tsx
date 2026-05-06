'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { getAccessToken } from '@/lib/auth/authHelpers';
import { powerBiRequest } from '@/lib/auth/msalConfig';
import { Loader2, Copy, Check } from 'lucide-react';

const DATASET_ID =
  process.env.NEXT_PUBLIC_POWERBI_DATASET_ID ?? '44da76a4-3c3f-44a8-abe9-48ff17247cc9';
const POWERBI_BASE = 'https://api.powerbi.com/v1.0/myorg';

interface ProbeResult {
  endpoint: string;
  status: number | string;
  body: unknown;
}

async function probe(token: string, path: string): Promise<ProbeResult> {
  try {
    const res = await fetch(`${POWERBI_BASE}${path}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const text = await res.text();
    let body: unknown = text;
    try { body = JSON.parse(text); } catch { /* keep text */ }
    return { endpoint: path, status: res.status, body };
  } catch (err) {
    return { endpoint: path, status: 'fetch-error', body: err instanceof Error ? err.message : String(err) };
  }
}

export function PowerBiDiscovery() {
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<ProbeResult[] | null>(null);
  const [copied, setCopied] = useState(false);

  const run = async () => {
    setRunning(true);
    setResults(null);
    try {
      const token = await getAccessToken(powerBiRequest.scopes);
      if (!token) {
        setResults([{ endpoint: 'auth', status: 'no-token', body: 'Sign in again' }]);
        return;
      }

      const initial = await Promise.all([
        probe(token, `/datasets/${DATASET_ID}`),
        probe(token, `/datasets`),
        probe(token, `/apps`),
        probe(token, `/groups`),
      ]);

      const apps = initial.find((r) => r.endpoint === '/apps');
      const appList: { id: string; workspaceId?: string; name?: string }[] =
        (apps?.body as { value?: { id: string; workspaceId?: string; name?: string }[] })?.value ?? [];

      const appProbes = await Promise.all(
        appList.flatMap((app) => [
          probe(token, `/apps/${app.id}/datasets`),
          probe(token, `/apps/${app.id}/datasets/${DATASET_ID}`),
        ]),
      );

      const groups = initial.find((r) => r.endpoint === '/groups');
      const groupList: { id: string; name?: string }[] =
        (groups?.body as { value?: { id: string; name?: string }[] })?.value ?? [];

      const groupProbes = await Promise.all(
        groupList.map((g) => probe(token, `/groups/${g.id}/datasets/${DATASET_ID}`)),
      );

      setResults([...initial, ...appProbes, ...groupProbes]);
    } catch (err) {
      setResults([{ endpoint: 'error', status: 'exception', body: err instanceof Error ? err.message : String(err) }]);
    } finally {
      setRunning(false);
    }
  };

  const copyAll = () => {
    if (!results) return;
    navigator.clipboard.writeText(JSON.stringify(results, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-semibold">Power BI Discovery</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Probes Power BI REST endpoints to figure out where dataset <code className="text-xs">{DATASET_ID}</code> lives and what permissions you have.
        </p>
      </div>

      <div className="flex gap-2">
        <Button onClick={run} disabled={running}>
          {running ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
          {running ? 'Probing…' : 'Run discovery'}
        </Button>
        {results && (
          <Button variant="outline" onClick={copyAll}>
            {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
            Copy results
          </Button>
        )}
      </div>

      {results && (
        <div className="space-y-3">
          {results.map((r, i) => (
            <div key={i} className="border rounded-md p-3 bg-muted/30">
              <div className="flex items-center justify-between gap-2 mb-2">
                <code className="text-xs font-mono">{r.endpoint}</code>
                <span
                  className={
                    typeof r.status === 'number' && r.status < 300
                      ? 'text-xs font-mono text-success'
                      : 'text-xs font-mono text-destructive'
                  }
                >
                  {String(r.status)}
                </span>
              </div>
              <pre className="text-xs font-mono whitespace-pre-wrap break-all max-h-64 overflow-y-auto">
                {typeof r.body === 'string' ? r.body : JSON.stringify(r.body, null, 2)}
              </pre>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
