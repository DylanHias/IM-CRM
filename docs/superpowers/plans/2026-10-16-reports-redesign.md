# Reports Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Reports section with four tabs — Growth, Pipeline, Accounts, Activity — whose every figure is computed from data that exists, scoped by a Mine/Team switch and a shared period control.

**Architecture:** Pure helpers for period and scope resolution first, then a corrected Power BI match layer, then one query module per tab, then the UI. Queries live in `src/lib/db/queries/reports/`, keeping them separate from the existing `analytics.ts` that other pages still call. Tabs are built last so each sits on tested queries.

**Tech Stack:** Next.js (static export), Tauri, SQLite via `src/lib/db/client.ts`, Zustand, recharts 2.15.4 behind `src/components/ui/chart.tsx`, Tailwind, Vitest + @testing-library/react.

**Spec:** `docs/superpowers/specs/2026-10-16-reports-redesign-design.md`

## Global Constraints

- Money expression for opportunities is `COALESCE(annual_revenue, estimated_revenue, 0)`, exported as `OPP_ARR` from `src/lib/db/queries/analytics.ts:25`. Never sum `estimated_revenue` raw.
- Opportunity money aggregates filter to `currency = 'EUR'` and report the excluded count. No conversion — no FX rate exists in the codebase.
- `arr_lc` is treated as euros. `arr_currency` / `currency_code` is never consulted.
- The current, partial month is excluded from every trend and every period total.
- Period options: rolling 3, 6, 12 months, plus complete calendar quarters inside the last 12 months. Nothing beyond 12 months.
- Scope resolves per entity: ARR/account tiles by `customers.owner_id`, deal tiles by `opportunities.created_by_id` (which holds the **owner**, not the creator), activity tiles by `activities.created_by_id`.
- Team scope = every Benelux account, narrowed by the country filter. ARR tiles caption the account population; pipeline/won-lost/activity tiles caption "Cloud Belux team".
- Snapshot tiles (ARR today, open pipeline, coverage, whitespace) ignore the period and say so on the tile.
- `health_score` must not appear as a metric anywhere.
- No new dependencies.
- TDD: test first, run it red, implement, run it green, commit. Run affected tests only (`pnpm vitest run <path>`).
- Every commit: version bump in `package.json`, `pnpm sync-version`, `.changelog/v{version}.md` entry in plain language (version header line, plain hyphen bullets, no markdown styling).
- Stage `git add <specific-files>` only. Never `git add .`.
- Positional `$N` SQL: verify parameter order against the column list at every call site.

## Review Focus

These are the conditions the spec implies but no single tab's tests naturally exercise. Each has a test pinned to the task that owns the code.

1. **Zero denominators** — no won deals, no accounts owned, no ARR in scope. Every rate and average must render "—", never `NaN`, `Infinity` or `0%`. (Tasks 4, 5, 6)
2. **Accounts with no Power BI match** — must be counted and surfaced as unmatched, never folded in as €0. (Task 2)
3. **A period containing no data** — a quarter before the Power BI window, or a new user with no deals. Must render an explicit empty state naming the cause, never a flat line at zero. (Tasks 3, 9)
4. **Null dimension values** — `segment`, `primary_vendor` and `sell_type` are all nullable. They get an explicit "Not set" row rather than being dropped, so the bars reconcile to the total. (Tasks 4, 5)
5. **Future-dated and partial-period data** — activities scheduled ahead must not make an account read as recently contacted, and the partial current month must not appear as a dip. (Tasks 1, 5)

---

## File Structure

**Create:**
- `src/lib/reports/period.ts` — period options, ranges, partial-month exclusion
- `src/lib/reports/scope.ts` — scope/country types and SQL fragment builders
- `src/lib/db/queries/reports/arr.ts` — ARR today, movement waterfall, movers
- `src/lib/db/queries/reports/deals.ts` — pipeline, new opps, won/lost, win rate
- `src/lib/db/queries/reports/accounts.ts` — concentration, whitespace, coverage, by-dimension
- `src/lib/db/queries/reports/activity.ts` — volume, accounts touched, per-won-deal
- `src/components/reports/ReportsShell.tsx` — tabs, controls, full-height frame
- `src/components/reports/tabs/GrowthTab.tsx`, `PipelineTab.tsx`, `AccountsTab.tsx`, `ActivityTab.tsx`
- `src/components/reports/ReportTile.tsx` — tile with caption + empty state
- `src/types/reports.ts`

**Modify:**
- `src/lib/db/client.ts` — `customer_revenue` migration (Task 2)
- `src/lib/integrations/powerbi/revenueService.ts` — match resolution and summing (Task 2)
- `src/lib/db/queries/analytics.ts`, `teamAnalytics.ts`, `aiSearch.ts` — route money through `OPP_ARR` (Task 7)
- `src/components/reports/ReportsPage.tsx` — replaced by the shell
- `src/lib/integrations/powerbi/queries.ts` — correct the 24-month comments
- `docs/help/*.md` (Task 13)

**Delete** (only after Task 12 lands): `src/components/analytics/{PipelinePanel,CustomersPanel,PersonalPanel,ActivityPanel}.tsx`, `src/components/insights/*`, `src/components/reports/RevenueCustomersPanel.tsx`.

---

### Task 1: Period model

**Files:**
- Create: `src/lib/reports/period.ts`
- Test: `src/lib/reports/__tests__/period.test.ts`

**Interfaces:**
- Produces: `type ReportPeriod = { kind: 'rolling'; months: 3 | 6 | 12 } | { kind: 'quarter'; year: number; quarter: 1 | 2 | 3 | 4 }`; `periodRange(p: ReportPeriod, now?: Date): { from: string; to: string }`; `availablePeriods(now?: Date): ReportPeriod[]`; `periodLabel(p: ReportPeriod): string`; `monthKeys(p: ReportPeriod, now?: Date): string[]`

- [ ] **Step 1: Write the failing tests**

```ts
const NOW = new Date('2026-10-16T12:00:00Z');

it('a rolling period ends at the last complete month', () => {
  expect(periodRange({ kind: 'rolling', months: 3 }, NOW))
    .toEqual({ from: '2026-07-01', to: '2026-09-30' });
});

it('rolling 12 months spans a full year of complete months', () => {
  expect(periodRange({ kind: 'rolling', months: 12 }, NOW))
    .toEqual({ from: '2025-10-01', to: '2026-09-30' });
});

it('a quarter range covers its three months', () => {
  expect(periodRange({ kind: 'quarter', year: 2026, quarter: 2 }, NOW))
    .toEqual({ from: '2026-04-01', to: '2026-06-30' });
});

it('offers only complete quarters inside the last 12 months', () => {
  const quarters = availablePeriods(NOW).filter((p) => p.kind === 'quarter');
  expect(quarters).toEqual([
    { kind: 'quarter', year: 2026, quarter: 3 },
    { kind: 'quarter', year: 2026, quarter: 2 },
    { kind: 'quarter', year: 2026, quarter: 1 },
    { kind: 'quarter', year: 2025, quarter: 4 },
  ]);
});

it('never offers a period beyond the 12-month Power BI window', () => {
  const froms = availablePeriods(NOW).map((p) => periodRange(p, NOW).from);
  expect(froms.every((f) => f >= '2025-10-01')).toBe(true);
});

it('lists month keys without the partial current month', () => {
  expect(monthKeys({ kind: 'rolling', months: 3 }, NOW)).toEqual(['2026-07', '2026-08', '2026-09']);
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm vitest run src/lib/reports/__tests__/period.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `src/lib/reports/period.ts`**

Use `date-fns` (already a dependency). `to` is the last day of the previous month relative to `now`; the partial current month is never included.

- [ ] **Step 4: Run to verify it passes**

Run: `pnpm vitest run src/lib/reports/__tests__/period.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/reports/period.ts src/lib/reports/__tests__/period.test.ts package.json .changelog src-tauri/tauri.conf.json src-tauri/Cargo.toml
git commit -m "feat(reports): add period model with partial-month exclusion"
```

---

### Task 2: Power BI match layer — resolve to a customer, sum rows

The current cache matches on five keys when writing but reads back only by BCN or account number, so matched accounts are lost; and it keeps the largest-ARR row per BCN instead of summing. Fixing this is a prerequisite for every ARR figure.

**Files:**
- Modify: `src/lib/db/client.ts` (add a migration), `src/lib/integrations/powerbi/revenueService.ts:177-215`
- Create: `src/lib/integrations/powerbi/matchCustomers.ts`
- Test: `src/lib/integrations/powerbi/__tests__/matchCustomers.test.ts`

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces: `resolveCustomerId(row: PowerBiRevenueRow, index: CustomerMatchIndex): string | null`; `buildMatchIndex(customers: Customer[]): CustomerMatchIndex`; `customer_revenue.customer_id` column populated at write time.

- [ ] **Step 1: Write the failing tests**

```ts
it('matches on bcn first', () => { /* bcn hit wins over account number */ });

it('falls back through account number, reseller id, marketplace id and unique name', () => {
  // one assertion per key, each with the other keys absent
});

it('returns null when no key matches', () => {
  expect(resolveCustomerId(row({ bcn: 'ZZZ' }), buildMatchIndex([]))).toBeNull();
});

it('sums every Power BI row that resolves to the same customer', () => {
  // two rows, same customer, arrLc 1000 and 500 -> 1500, not 1000
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm vitest run src/lib/integrations/powerbi/__tests__/matchCustomers.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Add the migration in `src/lib/db/client.ts`**

Add `customer_id TEXT` to `customer_revenue` via the existing column-migration list, plus `CREATE INDEX idx_customer_revenue_customer_id`. Drop the single-column primary key on `bcn` by recreating the table so one BCN may hold several rows. Bump the schema version and reset the revenue watermark so the next refresh repopulates.

- [ ] **Step 4: Implement `matchCustomers.ts` and wire it into `revenueService.ts`**

`buildMatchIndex` builds one `Map` per key. The refresh resolves each row to a customer id before insert and stores it. Remove the keep-the-largest dedupe at `revenueService.ts:213-215`.

- [ ] **Step 5: Run to verify it passes**

Run: `pnpm vitest run src/lib/integrations/powerbi/__tests__/matchCustomers.test.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/lib/integrations/powerbi/matchCustomers.ts src/lib/integrations/powerbi/__tests__/matchCustomers.test.ts src/lib/integrations/powerbi/revenueService.ts src/lib/db/client.ts package.json .changelog src-tauri/tauri.conf.json src-tauri/Cargo.toml
git commit -m "fix(reports): resolve Power BI rows to customers and sum them"
```

---

### Task 3: Scope fragments + ARR queries

**Files:**
- Create: `src/lib/reports/scope.ts`, `src/lib/db/queries/reports/arr.ts`, `src/types/reports.ts`
- Test: `src/lib/reports/__tests__/scope.test.ts`, `src/lib/db/queries/reports/__tests__/arr.test.ts`

**Interfaces:**
- Consumes: `ReportPeriod`, `monthKeys` (Task 1); `customer_revenue.customer_id` (Task 2); `Region`, `REGION_COUNTRIES` from `src/lib/revenue/region.ts`.
- Produces: `type ReportScope = { kind: 'mine'; userIds: string[] } | { kind: 'team'; region: Region }`; `accountScopeSql(s: ReportScope, offset: number): { sql: string; params: unknown[] }`; `dealScopeSql(...)` same shape; `queryArrToday(s): Promise<{ total: number; matched: number; unmatched: number }>`; `queryArrMovement(s, p): Promise<{ newSale: number; upgrade: number; downgrade: number; cancellation: number; net: number }>`; `queryArrMovers(s, p, limit): Promise<ArrMover[]>`

Mock `@/lib/db/client` as in `src/lib/db/queries/__tests__/analytics.test.ts` and assert on the generated SQL and params.

- [ ] **Step 1: Write the failing tests**

```ts
it('scopes Mine by account owner', () => {
  expect(accountScopeSql({ kind: 'mine', userIds: ['u1'] }, 0).sql).toContain('owner_id IN ($1)');
});

it('scopes Team by country, not by owner', () => {
  const { sql, params } = accountScopeSql({ kind: 'team', region: 'BE' }, 0);
  expect(sql).toContain('address_country IN ($1)');
  expect(sql).not.toContain('owner_id');
  expect(params).toEqual(['BE']);
});

it('counts accounts with no Power BI row as unmatched, not as zero ARR', async () => {
  // 3 in-scope accounts, 2 with revenue rows -> { matched: 2, unmatched: 1 }
});

it('sums ARR movement over the period months only', async () => {
  const [sql, params] = select.mock.calls[0];
  expect(sql).toContain('month >= $');
  expect(params).toContain('2026-09'); // last complete month
  expect(params).not.toContain('2026-10'); // partial current month
});

it('nets movement as new sale + upgrade - downgrade - cancellation', async () => {
  // 1000 + 200 - 150 - 50 -> net 1000
});

it('returns zeros, not nulls, when the period has no movement rows', async () => {
  select.mockResolvedValueOnce([]);
  expect(await queryArrMovement(scope, period)).toEqual({
    newSale: 0, upgrade: 0, downgrade: 0, cancellation: 0, net: 0,
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm vitest run src/lib/reports/__tests__/scope.test.ts src/lib/db/queries/reports/__tests__/arr.test.ts`
Expected: FAIL — modules not found.

- [ ] **Step 3: Implement `scope.ts` and `arr.ts`**

`arr_movement` joins to `customer_revenue.customer_id` to reach `customers` for scoping. Movement columns are the `_lc` ones; the `_usd` columns are never populated by the parser.

- [ ] **Step 4: Run to verify it passes** — Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/reports/scope.ts src/lib/db/queries/reports/arr.ts src/types/reports.ts src/lib/reports/__tests__/scope.test.ts src/lib/db/queries/reports/__tests__/arr.test.ts package.json .changelog src-tauri/tauri.conf.json src-tauri/Cargo.toml
git commit -m "feat(reports): add scope fragments and ARR queries"
```

---

### Task 4: Deal queries

**Files:**
- Create: `src/lib/db/queries/reports/deals.ts`
- Test: `src/lib/db/queries/reports/__tests__/deals.test.ts`

**Interfaces:**
- Consumes: `ReportScope`, `dealScopeSql` (Task 3); `ReportPeriod` (Task 1); `OPP_ARR` (exported from `analytics.ts`).
- Produces: `queryOpenPipeline(s): Promise<{ value: number; count: number; weighted: number; excludedNonEur: number }>`; `queryNewOpportunities(s, p): Promise<{ total: { count: number; value: number }; byMonth: { month: string; count: number; value: number }[] }>`; `queryClosedDeals(s, p): Promise<{ won: Money; lost: Money; winRatePct: number | null; byMonth: ClosedMonth[] }>`; `queryAvgDealSize(s): Promise<number | null>`; `queryPipelineByStage(s)`, `queryPipelineByDimension(s, dim: 'vendor' | 'sellType')`, `queryForecastByMonth(s): Promise<{ month: string | 'overdue'; value: number }[]>`, `queryQuietDeals(s, idleDays, limit): Promise<QuietDeal[]>`

`queryQuietDeals` replaces `queryMyStaleOpportunities` in `src/lib/db/queries/opportunities.ts:567`, which is scoped to one user and already uses `COALESCE(annual_revenue, estimated_revenue)`. Keep that function — Home calls it — and build the scoped version here rather than widening it.

`queryForecastByMonth` buckets open deals by `expiration_date`; deals whose expected close has already passed go into a single `'overdue'` bucket, and deals with no expected close are returned as a separate count so the forecast can be reconciled against total pipeline.

- [ ] **Step 1: Write the failing tests**

```ts
it('values deals by annual revenue, never raw estimated revenue', async () => {
  const [sql] = select.mock.calls[0];
  expect(sql).toContain('COALESCE(annual_revenue, estimated_revenue, 0)');
});

it('excludes non-euro deals from money and reports how many', async () => {
  const [sql] = select.mock.calls[0];
  expect(sql).toContain("currency = 'EUR'");
  // and the result carries excludedNonEur
});

it('computes win rate by value, not deal count', async () => {
  // won 300k over 1 deal, lost 100k over 3 deals -> 75, not 25
  expect(res.winRatePct).toBe(75);
});

it('returns null win rate when nothing has closed', async () => {
  expect(res.winRatePct).toBeNull();
});

it('values a won deal by actual revenue when it is entered', async () => {
  // actual_revenue 90000, annual_revenue 100000 -> 90000
});

it('falls back to ARR when actual revenue is zero, which means not entered', async () => {
  // actual_revenue 0, annual_revenue 100000 -> 100000
});

it('values lost deals by ARR', async () => { /* lost rows use OPP_ARR */ });

it('averages deal size over deals that have a value, not over blanks', async () => {
  // 2 deals at 100k, 8 blanks -> 100000, not 20000
  const [sql] = select.mock.calls[0];
  expect(sql).toContain('NULLIF');
});

it('returns null average when no deal carries a value', async () => {
  expect(await queryAvgDealSize(scope)).toBeNull();
});

it('groups a null vendor under "Not set" rather than dropping it', async () => {
  expect(rows).toContainEqual(expect.objectContaining({ label: 'Not set' }));
});

it('buckets new opportunities by created_at month across the period', async () => {
  const [sql] = select.mock.calls[0];
  expect(sql).toContain("strftime('%Y-%m', created_at)");
});

it('buckets closed deals by close_date, not created_at', async () => {
  const [sql] = select.mock.calls[0];
  expect(sql).toContain("strftime('%Y-%m', close_date)");
});

it('puts an already-passed expected close into the overdue bucket', async () => {
  // expiration_date in the past -> { month: 'overdue' }, not a past month row
});

it('reports deals with no expected close separately so the forecast reconciles', async () => {
  // result carries a noCloseDateCount, and those deals appear in no month bucket
});
```

- [ ] **Step 2: Run to verify it fails** — Expected: FAIL, module not found.

- [ ] **Step 3: Implement `deals.ts`**

Won value is `CASE WHEN actual_revenue IS NOT NULL AND actual_revenue != 0 THEN actual_revenue ELSE OPP_ARR END`. Months absent from the result are filled as zero rows from `monthKeys` so charts have no gaps.

- [ ] **Step 4: Run to verify it passes** — Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/db/queries/reports/deals.ts src/lib/db/queries/reports/__tests__/deals.test.ts package.json .changelog src-tauri/tauri.conf.json src-tauri/Cargo.toml
git commit -m "feat(reports): add deal queries with value-based win rate"
```

---

### Task 5: Account queries

**Files:**
- Create: `src/lib/db/queries/reports/accounts.ts`
- Test: `src/lib/db/queries/reports/__tests__/accounts.test.ts`

**Interfaces:**
- Consumes: `ReportScope`, `accountScopeSql` (Task 3).
- Produces: `queryAccountSummary(s): Promise<{ total: number; withArr: number; noOpenOpp: number; notContacted90d: number; neverContacted: number }>`; `queryTopConcentration(s, n): Promise<number | null>`; `queryAccountsRanked(s, limit, offset): Promise<RankedAccount[]>`; `queryArrByDimension(s, dim: 'segment' | 'industry' | 'country'): Promise<DimensionRow[]>`; `queryCoverageBuckets(s): Promise<{ bucket: CoverageBucket; count: number }[]>`

- [ ] **Step 1: Write the failing tests**

```ts
it('computes last contact from activities, ignoring the stored column', async () => {
  const [sql] = select.mock.calls[0];
  expect(sql).toContain('MAX(a.occurred_at)');
  expect(sql).not.toContain('last_activity_at');
});

it('ignores future-dated activities when deciding last contact', async () => {
  const [sql] = select.mock.calls[0];
  expect(sql).toContain("occurred_at <= datetime('now')");
});

it('counts never-contacted accounts in their own bucket, not in 90+', async () => {
  // 1 account contacted 100 days ago, 1 never -> notContacted90d 1, neverContacted 1
});

it('returns null concentration when scope holds no ARR', async () => {
  expect(await queryTopConcentration(scope, 10)).toBeNull();
});

it('gives a null segment its own "Not set" row so the bars reconcile', async () => {
  const rows = await queryArrByDimension(scope, 'segment');
  expect(rows).toContainEqual(expect.objectContaining({ label: 'Not set' }));
});

it('returns every dimension group, leaving truncation to the caller', async () => {
  // 12 groups in -> 12 rows out, no slice(0, 8) in the query layer
});
```

- [ ] **Step 2: Run to verify it fails** — Expected: FAIL.

- [ ] **Step 3: Implement `accounts.ts`**

- [ ] **Step 4: Run to verify it passes** — Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/db/queries/reports/accounts.ts src/lib/db/queries/reports/__tests__/accounts.test.ts package.json .changelog src-tauri/tauri.conf.json src-tauri/Cargo.toml
git commit -m "feat(reports): add account queries with computed last contact"
```

---

### Task 6: Activity queries

**Files:**
- Create: `src/lib/db/queries/reports/activity.ts`
- Test: `src/lib/db/queries/reports/__tests__/activity.test.ts`

**Interfaces:**
- Consumes: `ReportScope` (Task 3), `ReportPeriod` (Task 1).
- Produces: `queryActivityVolume(s, p): Promise<{ total: number; previous: number; byMonth: { month: string; type: string; count: number }[] }>`; `queryAccountsTouched(s, p): Promise<{ touched: number; owned: number }>`; `queryFollowUpCompletion(s, p): Promise<{ completed: number; total: number }>`; `queryActivitiesPerWonDeal(s, p): Promise<number | null>`

- [ ] **Step 1: Write the failing tests**

```ts
it('scopes activity by the activity owner under Mine', async () => {
  const [sql] = select.mock.calls[0];
  expect(sql).toContain('created_by_id IN');
});

it('counts an account as touched by any activity on it, whoever owns it', async () => {
  const [sql] = select.mock.calls[1];
  expect(sql).not.toContain('a.created_by_id');
});

it('returns null activities-per-won-deal when nothing was won', async () => {
  expect(await queryActivitiesPerWonDeal(scope, period)).toBeNull();
});

it('compares against a previous window of equal length', async () => {
  // 3-month period -> previous range is the 3 months before it
});

it('counts follow-ups completed in the period, not created in it', async () => {
  const [sql] = select.mock.calls[0];
  expect(sql).toContain('completed_at >=');
});
```

- [ ] **Step 2: Run to verify it fails** — Expected: FAIL.

- [ ] **Step 3: Implement `activity.ts`**

- [ ] **Step 4: Run to verify it passes** — Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/db/queries/reports/activity.ts src/lib/db/queries/reports/__tests__/activity.test.ts package.json .changelog src-tauri/tauri.conf.json src-tauri/Cargo.toml
git commit -m "feat(reports): add activity queries"
```

---

### Task 7: Fix shared money queries outside Reports

**Files:**
- Modify: `src/lib/db/queries/analytics.ts` (`queryPipelineData`, lines ~169-250), `src/lib/db/queries/teamAnalytics.ts:119,127,270,276,314`, `src/lib/db/queries/aiSearch.ts:118,123,275,282`, `src/lib/integrations/powerbi/queries.ts` comments at 82, 112, 143
- Test: `src/lib/db/queries/__tests__/analytics.test.ts` (extend), `src/lib/db/queries/__tests__/teamAnalytics.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
it('queryPipelineData values deals by annual revenue', async () => {
  const [sql] = select.mock.calls[0];
  expect(sql).toContain('COALESCE(annual_revenue, estimated_revenue, 0)');
});

it('team analytics value deals by annual revenue', async () => { /* same assertion per call site */ });
```

- [ ] **Step 2: Run to verify it fails** — Expected: FAIL.

- [ ] **Step 3: Route every money expression through `OPP_ARR`**

Leave the functions in place — Home, the dashboard and other pages call them. Correct the `SNAPSHOT_MONTHS` comments claiming 24 months.

- [ ] **Step 4: Run to verify it passes** — Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/db/queries/analytics.ts src/lib/db/queries/teamAnalytics.ts src/lib/integrations/powerbi/queries.ts src/lib/db/queries/__tests__ package.json .changelog src-tauri/tauri.conf.json src-tauri/Cargo.toml
git commit -m "fix(reports): value deals by annual revenue across shared queries"
```

---

### Task 8: Reports shell — tabs, controls, full-height frame

**Files:**
- Create: `src/components/reports/ReportsShell.tsx`, `src/components/reports/ReportTile.tsx`, `src/components/reports/ReportControls.tsx`
- Modify: `src/app/(app)/revenue-overview/page.tsx`
- Test: `src/components/reports/__tests__/ReportsShell.test.tsx`, `src/components/reports/__tests__/ReportTile.test.tsx`

**Interfaces:**
- Consumes: `availablePeriods`, `periodLabel` (Task 1); `ReportScope`, `Region` (Task 3).
- Produces: `<ReportsShell />`; `<ReportTile label value caption empty? />` where `empty` renders a named empty state instead of a value.

- [ ] **Step 1: Write the failing tests**

```ts
it('renders the four tabs', () => {
  for (const t of ['Growth', 'Pipeline', 'Accounts', 'Activity']) expect(screen.getByText(t)).toBeInTheDocument();
});

it('shows the country filter only under Team scope', () => { /* absent for Mine, present for Team */ });

it('offers no period beyond 12 months', () => {
  expect(screen.queryByText(/24 months/i)).not.toBeInTheDocument();
});

it('shows a named empty state instead of a zero when a tile has no data', () => {
  render(<ReportTile label="ARR today" empty="No matching Power BI record" />);
  expect(screen.getByText('No matching Power BI record')).toBeInTheDocument();
  expect(screen.queryByText('€0')).not.toBeInTheDocument();
});
```

- [ ] **Step 2: Run to verify it fails** — Expected: FAIL.

- [ ] **Step 3: Implement the shell**

Follow the Home full-height pattern: root is a flex column with `lg:h-full lg:min-h-0`, the tile strip is natural height, the chart area takes `lg:flex-1 lg:min-h-0`, and nothing is height-constrained below `lg`. Lists use `usePagedRows` from `src/hooks/usePagedRows.ts` with `CompactPager`. Reuse `MetricStrip`/`Metric`, `Panel`, `Segmented` and `src/lib/revenue/region.ts`.

- [ ] **Step 4: Run to verify it passes** — Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/reports/ReportsShell.tsx src/components/reports/ReportTile.tsx src/components/reports/ReportControls.tsx "src/app/(app)/revenue-overview/page.tsx" src/components/reports/__tests__ package.json .changelog src-tauri/tauri.conf.json src-tauri/Cargo.toml
git commit -m "feat(reports): add full-height shell with scope and period controls"
```

---

### Task 9: Growth tab

**Files:**
- Create: `src/components/reports/tabs/GrowthTab.tsx`
- Test: `src/components/reports/tabs/__tests__/GrowthTab.test.tsx`

**Interfaces:**
- Consumes: `queryArrToday`, `queryArrMovement`, `queryArrMovers` (Task 3); `queryNewOpportunities`, `queryClosedDeals` (Task 4); `ReportTile` (Task 8).

- [ ] **Step 1: Write the failing tests**

```ts
it('shows ARR today, net movement, new opportunities and won', () => { /* four tile labels */ });

it('captions ARR tiles with the account population and deal tiles with the team', () => {
  expect(screen.getByText(/all Benelux accounts/i)).toBeInTheDocument();
  expect(screen.getByText(/Cloud Belux team/i)).toBeInTheDocument();
});

it('surfaces how many in-scope accounts have no Power BI match', () => {
  expect(screen.getByText(/1 account not matched/i)).toBeInTheDocument();
});

it('renders an empty state rather than a flat zero chart when the period has no movement', () => {
  expect(screen.getByText(/No ARR movement in this period/i)).toBeInTheDocument();
});

it('labels snapshot tiles as point-in-time', () => {
  expect(screen.getByText(/today/i)).toBeInTheDocument();
});
```

- [ ] **Step 2: Run to verify it fails** — Expected: FAIL.

- [ ] **Step 3: Implement `GrowthTab.tsx`**

The waterfall is a recharts stacked bar with transparent risers; fall back to a grouped bar if it reads poorly at real volumes.

- [ ] **Step 4: Run to verify it passes** — Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/reports/tabs/GrowthTab.tsx src/components/reports/tabs/__tests__/GrowthTab.test.tsx package.json .changelog src-tauri/tauri.conf.json src-tauri/Cargo.toml
git commit -m "feat(reports): add Growth tab"
```

---

### Task 10: Pipeline tab

**Files:**
- Create: `src/components/reports/tabs/PipelineTab.tsx`
- Test: `src/components/reports/tabs/__tests__/PipelineTab.test.tsx`

**Interfaces:** Consumes Task 4's queries and `ReportTile` (Task 8).

- [ ] **Step 1: Write the failing tests**

```ts
it('labels the forecast as stage-weighted', () => {
  expect(screen.getByText(/stage-weighted/i)).toBeInTheDocument();
});

it('shows overdue deals in their own bucket, not folded into a past month', () => {
  expect(screen.getByText(/Overdue/i)).toBeInTheDocument();
});

it('notes excluded non-euro deals when there are any', () => {
  expect(screen.getByText(/2 deals in other currencies excluded/i)).toBeInTheDocument();
});

it('hides the currency note when every deal is in euros', () => {
  expect(screen.queryByText(/excluded/i)).not.toBeInTheDocument();
});

it('renders no funnel conversion or velocity figure', () => {
  expect(screen.queryByText(/conversion/i)).not.toBeInTheDocument();
  expect(screen.queryByText(/velocity|days in stage/i)).not.toBeInTheDocument();
});
```

- [ ] **Step 2: Run to verify it fails** — Expected: FAIL.

- [ ] **Step 3: Implement `PipelineTab.tsx`**

- [ ] **Step 4: Run to verify it passes** — Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/reports/tabs/PipelineTab.tsx src/components/reports/tabs/__tests__/PipelineTab.test.tsx package.json .changelog src-tauri/tauri.conf.json src-tauri/Cargo.toml
git commit -m "feat(reports): add Pipeline tab"
```

---

### Task 11: Accounts tab

**Files:**
- Create: `src/components/reports/tabs/AccountsTab.tsx`
- Test: `src/components/reports/tabs/__tests__/AccountsTab.test.tsx`

**Interfaces:** Consumes Task 5's queries, `ReportTile` (Task 8), `usePagedRows`.

- [ ] **Step 1: Write the failing tests**

```ts
it('shows accounts with ARR, concentration, whitespace and quiet accounts', () => { /* four tiles */ });

it('pages the ranked account list instead of scrolling it off', () => {
  expect(screen.getByLabelText('Next page')).toBeInTheDocument();
});

it('adds an "Other" row so the dimension bars reconcile to the total', () => {
  expect(screen.getByText('Other')).toBeInTheDocument();
});

it('never shows a health score', () => {
  expect(screen.queryByText(/health/i)).not.toBeInTheDocument();
});
```

- [ ] **Step 2: Run to verify it fails** — Expected: FAIL.

- [ ] **Step 3: Implement `AccountsTab.tsx`**

Truncate dimension rows in the component, not the query, and roll the remainder into an explicit "Other" row.

- [ ] **Step 4: Run to verify it passes** — Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/reports/tabs/AccountsTab.tsx src/components/reports/tabs/__tests__/AccountsTab.test.tsx package.json .changelog src-tauri/tauri.conf.json src-tauri/Cargo.toml
git commit -m "feat(reports): add Accounts tab"
```

---

### Task 12: Activity tab, and remove the old Reports

**Files:**
- Create: `src/components/reports/tabs/ActivityTab.tsx`
- Delete: `src/components/analytics/{PipelinePanel,CustomersPanel,PersonalPanel,ActivityPanel}.tsx`, `src/components/insights/*`, `src/components/reports/{ReportsPage,RevenueCustomersPanel}.tsx`, and their tests
- Test: `src/components/reports/tabs/__tests__/ActivityTab.test.tsx`

**Interfaces:** Consumes Task 6's queries and `ReportTile` (Task 8).

- [ ] **Step 1: Write the failing tests**

```ts
it('shows activities logged, accounts touched, follow-ups completed and effort per win', () => { /* four tiles */ });

it('shows a dash rather than a division by zero when nothing was won', () => {
  expect(screen.getByText('—')).toBeInTheDocument();
});

it('buckets accounts by last contact with never-contacted separate', () => {
  for (const b of ['0–30', '30–60', '60–90', '90+', 'Never']) expect(screen.getByText(b)).toBeInTheDocument();
});
```

- [ ] **Step 2: Run to verify it fails** — Expected: FAIL.

- [ ] **Step 3: Implement `ActivityTab.tsx`, then delete the old components**

After deleting, grep for every import of the removed files and remove or redirect it. `src/app/(app)/insights/` and `src/app/(app)/analytics/` are redirects and should keep working.

- [ ] **Step 4: Run the full affected set and the linter**

Run: `pnpm vitest run src/components/reports src/lib/reports src/lib/db/queries/reports` then `pnpm lint` and `npx tsc --noEmit`
Expected: PASS, no lint errors, no new type errors.

- [ ] **Step 5: Commit**

```bash
git add src/components/reports src/components/analytics src/components/insights package.json .changelog src-tauri/tauri.conf.json src-tauri/Cargo.toml
git commit -m "feat(reports): add Activity tab and remove the old Reports"
```

---

### Task 13: Help docs

**Files:**
- Modify: `docs/help/revenue-overview.md`, `docs/help/getting-started.md`
- Modify: `src/app/(app)/help/page.tsx` if the tab list changes

- [ ] **Step 1: Rewrite the Reports help page**

Cover: what each of the four tabs answers; what Mine and Team mean; **that ARR is market-wide while pipeline is team-only and the two are not subsets of one another**; the deal-ownership asymmetry under Mine; that history stops at 12 months; that stage conversion and deal velocity are not available and why.

- [ ] **Step 2: Verify the help page renders**

Run: `pnpm vitest run "src/app/(app)/help"`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add docs/help "src/app/(app)/help/page.tsx" package.json .changelog src-tauri/tauri.conf.json src-tauri/Cargo.toml
git commit -m "docs(reports): document the rebuilt Reports tabs"
```
