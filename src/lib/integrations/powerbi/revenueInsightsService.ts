import { executeDaxQuery } from './client';
import { arrTrendDax } from './queries';
import {
  useRevenueInsightsStore,
  trendKey,
  type ArrTrendPoint,
} from '@/store/revenueInsightsStore';

const WORKSPACE_ID = process.env.NEXT_PUBLIC_POWERBI_WORKSPACE_ID ?? '';
const DATASET_ID =
  process.env.NEXT_PUBLIC_POWERBI_DATASET_ID ?? '44da76a4-3c3f-44a8-abe9-48ff17247cc9';

const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes — org-wide trend changes slowly

function toNum(v: unknown): number {
  if (v === null || v === undefined || v === '') return 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function toMonthIso(v: unknown): string {
  if (v === null || v === undefined) return '';
  const s = String(v);
  const m = s.match(/^(\d{4})-(\d{2})/);
  return m ? `${m[1]}-${m[2]}` : s.slice(0, 7);
}

function parseRows(rows: Record<string, unknown>[]): ArrTrendPoint[] {
  const out = rows.map((r) => ({
    month: toMonthIso(r['ARR[calendar_month]']),
    arrUsd: toNum(r['[ARR_USD]']),
    customerCount: toNum(r['[CustomerCount]']),
  }));
  out.sort((a, b) => a.month.localeCompare(b.month));
  return out;
}

export async function fetchArrTrend(
  token: string,
  monthsBack: number,
  countryCodes: readonly string[],
  force = false,
): Promise<ArrTrendPoint[]> {
  const key = trendKey(monthsBack, countryCodes);
  const store = useRevenueInsightsStore.getState();

  const cached = store.trendByKey.get(key);
  if (!force && cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.points;
  }

  if (store.loadingKeys.has(key)) {
    return new Promise((resolve) => {
      const unsub = useRevenueInsightsStore.subscribe((s) => {
        if (!s.loadingKeys.has(key)) {
          unsub();
          resolve(s.trendByKey.get(key)?.points ?? []);
        }
      });
    });
  }

  store.setLoading(key, true);
  store.setError(key, null);
  try {
    const dax = arrTrendDax(monthsBack, countryCodes);
    const result = await executeDaxQuery(token, WORKSPACE_ID || null, DATASET_ID, dax);
    const points = parseRows(result.rows ?? []);
    store.setTrend(key, { key, monthsBack, countryCodes, points, fetchedAt: Date.now() });
    return points;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[insights] ARR trend fetch failed:', msg);
    store.setError(key, msg);
    throw err;
  } finally {
    store.setLoading(key, false);
  }
}
