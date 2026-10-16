# Reports redesign — design

Date: 2026-10-16
Status: approved for planning

## Intent

Reports exists so Dylan can answer two questions, often in the same sitting and often with his
manager watching over his shoulder:

1. **How are my accounts performing?** Measured as growth in ARR and in new opportunities created.
2. **How is our business doing?** Team numbers alongside his own, plus vendor and segment performance.

Today it cannot answer either honestly. An audit of every metric, chart and table in the current
Reports found that the whole money layer of the Pipeline tab renders zero, ARR on the Customers tab
reads a different and probably empty source from the Revenue tab, three charts labelled "My activity"
are actually team-wide, and the 18M/24M period buttons change nothing. The full findings are in
"Audit findings" below.

The cost of this is not cosmetic. Dylan shows these numbers to his manager. A report that is
confidently wrong is worse than no report, and a report that quietly implies it knows something it
cannot know — deal velocity, stage conversion — is the same failure in a different costume.

So this is a rebuild, not a repair. Nothing in the current Reports is worth preserving; Dylan
confirmed he would not be annoyed to lose any of it.

## Goals

- Every number on screen is correct, or it is not on screen.
- Both audiences served from one place, via a scope switch rather than duplicated pages.
- ARR growth decomposed into *why* it moved, not just that it moved.
- The page fills the window, like Home now does.
- Where a figure rests on a weak assumption, the UI says so rather than hiding it.

## Non-goals

- Preserving any current tab, chart, component or query. Assume a clean slate.
- Historical backfill. The Power BI window is 12 months and we accept that ceiling for now.
- Export, scheduling, emailing or sharing reports. Not asked for.
- A charting library change. The project already uses recharts 2.15.4 behind
  `src/components/ui/chart.tsx`; build on it.
- Making Reports work for roles other than a Technical Account Manager and their manager.

## Anti-goals

These would make the work a failure even if it shipped and technically functioned.

- **A chart that renders a plausible-looking zero.** If the inputs are missing, show an explicit
  empty state naming what is missing. Never a flat line at zero, never an empty bar.
- **A metric whose definition the user cannot recover from the screen.** If "win rate" could mean
  three things, the label says which one.
- **Implying history we do not have.** No funnel conversion chart, no time-in-stage, no "pipeline as
  of last quarter". These are unknowable from this schema and the current UI implies otherwise.
- **Silently mixing currencies.** Adding dollars to euros to produce a number labelled with a euro
  sign is the single most dangerous defect class in the current code.
- **Replacing a wrong number with a differently wrong number.** Each metric lands with a test that
  fails if the arithmetic breaks.

## What the data can actually support

An inventory of the schema, the sync layer and the Power BI integration established the following.
These are constraints, not preferences, and the design is shaped around them.

### Reliable

- **Opportunity ARR** lives in `opportunities.annual_revenue`. `estimated_revenue` is the standard
  D365 field and is null on most synced rows; the wizard has no setter for it at all, so locally
  created deals never populate it. The canonical expression is
  `COALESCE(annual_revenue, estimated_revenue, 0)`, already defined as `OPP_ARR` in
  `src/lib/db/queries/analytics.ts:25`. Every money figure must route through it.
- **Opportunity created dates** are real D365 `createdon` values. Dense. Safe for trends.
- **Close dates** are real for Won and Lost deals, null for Open.
- **Expected close** is `expiration_date` (D365 `estimatedclosedate`). Nullable.
- **Activity `occurred_at`** is dense and always set. Best activity time axis.
- **Power BI `arr_movement`**: per reseller BCN, per month, 12 months, split into new sale, upgrade,
  downgrade and cancellation. This is the backbone of the Growth tab.
- **Power BI `customer_revenue`**: current ARR snapshot per BCN.
- **Power BI `arr_trend`** (month × country) and **`net_sales_by_vendor`** (month × country × vendor),
  12 months each.
- **Dimensions**: stage, status, sell type, primary vendor, opportunity type, owner, customer,
  industry, and `customers.address_country` (BE/NL/LU codes).
- **Segment** is `customers.segment`, from the D365 custom field `im360_mainsegmentation`, stored as
  a formatted label. It is nullable and its fill rate is unmeasured, so the segment breakdown needs
  an explicit "not set" row rather than dropping those accounts.

### Unreliable or absent — do not build on these

- **No stage history, no status history, no snapshots.** Deal velocity, time-in-stage, stage-to-stage
  conversion and "pipeline as it stood on date X" are all impossible.
- **ARR older than 12 months.** The insights tables are deleted and rewritten on every refresh, so the
  window never accumulates. `SNAPSHOT_MONTHS = 12` in
  `src/lib/integrations/powerbi/queries.ts:28`, despite comments and chart captions saying 24.
- **`customers.created_at` is the sync time**, not real. No acquisition or churn by date. Inactive
  accounts are filtered out of sync entirely, so churn is invisible.
- **No quota or target data** anywhere. No attainment reporting.
- **`competitor_id` is never synced** — hardcoded null in the adapter.
- **No FX rate exists** anywhere in the codebase.
- **`health_score` is an arbitrary internal heuristic.** It must not appear as a metric.
- **Opportunity sync is team-scoped** to the Cloud Belux / Belgium owner set. "Team" means that team,
  never all of Ingram, and the UI should not imply otherwise.
- **`customers.arr` is not D365 data.** It is written by a legacy Power BI path pointed at the
  end-customer table. `src/lib/revenue/effectiveArr.ts` labels it `d365`, which is misleading.

## The design

### Shape

Four subject tabs, with two switches that apply to every tile on every tab:

- **Scope: Mine | Team**, and when Team is selected, a country filter: **all Benelux | BE | NL | LU**
- **Period: rolling 12 months | a calendar quarter**

Dylan chose this over splitting by audience, because the same page then answers both his question
and his manager's.

**Team means every Benelux account**, not only accounts owned by Dylan's team — with the country
filter available to narrow it to one market. *(Dylan's call, made against my recommendation; see the
labelling requirement below.)*

### How scope resolves

"Mine" means **the accounts you own and the opportunities you own**. Scope therefore resolves per
entity rather than globally:

| Tile family | Filtered by |
|---|---|
| ARR, account counts, coverage | account owner (`customers.owner_id`) |
| Pipeline, won/lost, new opportunities | opportunity owner |
| Activity, follow-ups | activity / follow-up owner |

**Known asymmetry, accepted:** a deal owned by a colleague on an account Dylan owns contributes to
his ARR tiles but not his pipeline tiles. This is the correct reading of his words and it matches how
the two halves are actually measured. It should be documented in the help page, not papered over.

### Team scope spans two different populations — label it

Accounts and opportunities arrive through different sync filters. Every active BE/NL/LU account is
synced; opportunities are synced only for the Cloud Belux / Belgium owner set. Team scope therefore
puts two populations on one screen:

- **ARR and account tiles** cover every Benelux account, narrowed by the country filter.
- **Pipeline, won/lost and activity tiles** cover only deals and activities belonging to the synced
  team, because no others exist locally.

These cannot be reconciled against each other, and a manager who tries will lose confidence in the
page. Since the populations cannot be aligned, **the labelling has to carry the difference**:

- ARR and account tiles are captioned with the account population — "all Benelux accounts", or
  "Belgian accounts" when the country filter is narrowed.
- Pipeline, won/lost and activity tiles are captioned "Cloud Belux team" so it is visible on the tile
  that this is a narrower set.
- The help page states it plainly: ARR is market-wide, pipeline is team-only, and the two are not
  subsets of one another.

The country filter applies to both halves — accounts by `customers.address_country`, deals by their
account's country — so narrowing to BE narrows both, even though their bases differ.

**Builder note:** `opportunities.created_by_id` is misnamed — the sync maps D365 `_ownerid_value`
into it, so it is the owner, not the creator. The same applies to activities. Use it as the owner and
consider a comment at each use site. Renaming the column is out of scope.

### Tab 1 — Growth

The manager conversation. Four tiles across the top: **ARR today** (snapshot, euros), **net ARR
movement** over the period, **new opportunities created** (count and value), **won this period**
(count and value).

Below them, the centrepiece: **a waterfall of where ARR moved** — new sale, upgrade, downgrade,
cancellation, net — from `arr_movement`, summed over the BCNs in scope. Beside it, **accounts that
grew or shrank**, ranked by absolute movement.

Then two time series: **new opportunities per month** and **won vs lost per month by value**, with a
win-rate line.

This tab is the reason the redesign exists. If only one tab ships well, it is this one.

### Tab 2 — Pipeline

Tiles: **open pipeline** (ARR and deal count), **weighted forecast**, **average deal size**,
**win rate**.

Charts: **pipeline by stage** (value and count), **expected close by month** with overdue deals in
their own bucket rather than buried in a past month, **pipeline by vendor**, **pipeline by sell type**,
and **deals going quiet** (no activity for 30 days or more).

### Tab 3 — Accounts

Tiles: **accounts with ARR** out of accounts owned, **top-10 concentration** (what share of ARR sits
in the ten biggest), **accounts with no open opportunity** (whitespace to work), **accounts not
contacted in 90 days** with never-contacted counted separately.

Then **accounts ranked by ARR** — with movement, open pipeline and last contact on the same row — and
**ARR by segment / industry / country**, switchable, with an explicit "other" row so the bars add up.

### Tab 4 — Activity

Tiles: **activities logged** versus the previous period, **accounts touched** out of accounts owned,
**follow-ups completed**, **activities per won deal**.

Charts: **activity over time by type**, and **coverage** — accounts bucketed by last contact
(0–30 / 30–60 / 60–90 / 90+ / never).

### Layout

Full height, following the pattern established on Home in v2.34.0:

- The page root is a flex column with `lg:h-full`; the tile strip is natural height and the chart
  area takes `lg:flex-1 lg:min-h-0`.
- Below the `lg` breakpoint nothing is height-constrained — it stacks and the page scrolls.
- Any list that overflows pages rather than scrolling off, using `src/hooks/usePagedRows.ts`, which
  measures the available area and shows exactly as many rows as fit, with `CompactPager` for the rest.

### Resolving accounts to Power BI rows

The Power BI tables are keyed by reseller BCN; CRM accounts are scoped by `customers.owner_id`. The
join between them is the backbone of the Growth tab, and the current implementation loses rows.

- **Canonical match**, in order: BCN, account number, reseller id, marketplace id, unique name. The
  cache already matches on all five when it populates
  (`src/lib/integrations/powerbi/revenueService.ts:177-201`) but the read path only looks up by BCN or
  account number, so matched accounts are silently lost. Build the lookup over the same five keys
  that populated it.
- **Multiple Power BI rows for one BCN are summed, never deduped by maximum.** The current
  "keep the largest `arr_usd`" behaviour discards real revenue when a BCN carries more than one
  reseller id.
- **Unmatched accounts are reported as unmatched**, with a count surfaced near the ARR tiles. They
  are never folded in as zero.
- **Drop the legacy `customers.arr` path entirely.** It is fed by a Power BI query pointed at the
  end-customer table, is labelled `d365` by `effectiveArr.ts` although no D365 data reaches it, and
  is the source of the Customers-versus-Revenue disagreement. `customer_revenue` is the single source
  of ARR.

### Currency on ARR

Power BI scope is BE/NL/LU, where local currency is the euro, so `arr_lc` is treated as euros
directly. `arr_currency` is **not** consulted: the legacy adapter defaults it to USD when the column
is absent, so the label is actively wrong, and the path that writes it is being dropped anyway. The
euro-only filter described above applies to opportunity money, where a genuine non-euro currency can
appear.

### How the period control behaves

One control, shared by every tab. It offers rolling 3, 6 and 12 months, and the complete calendar
quarters that fall inside the last 12 months. Nothing beyond 12 months is offered, because nothing
beyond 12 months exists.

**The current, partial month is excluded** from every trend and from period totals. Including it
produces a fake dip at the right-hand edge of every chart and a misleading negative growth figure —
finding 16 in the audit.

**Snapshot tiles ignore the period and say so in their own label.** ARR today, open pipeline, deal
counts, coverage buckets and whitespace counts are all point-in-time; filtering them by a period
would change what they mean. Period-sensitive tiles — ARR movement, new opportunities, won/lost, win
rate, activity volume — honour it.

### Last contact, computed not stored

`customers.last_activity_at` is only ever raised, counts contact edits as activity and admits
future-dated activities, so an account with a scheduled meeting next month never reads as quiet.
Reports computes last contact at query time from `MAX(activities.occurred_at)` **clipped to now**,
ignoring the stored column. Coverage buckets on the Accounts tab and "deals going quiet" on the
Pipeline tab both use this one definition, so the two tabs agree.

Under "Mine", an account counts as touched by **any** activity on it, not only activities Dylan owns.
Coverage asks whether the account has been looked after, not by whom.

### One value rule for closed deals

Applied identically by the won tile, won-vs-lost and win rate, so the three can be reconciled:

- **Won value**: `actual_revenue` when it is non-null and non-zero, otherwise `OPP_ARR`. The close
  dialog defaults `actual_revenue` to `'0'`, so zero means "not entered" rather than "worth nothing".
- **Lost value**: `OPP_ARR`. Lost deals never carry an actual revenue.
- **Closed** means `status` is exactly `'Won'` or `'Lost'`. The column is a union type written the
  same way by sync and by local creation.

### Metric definitions

These are the definitions; the builder should not have to invent them.

| Metric | Definition | Notes |
|---|---|---|
| ARR today | Sum of `customer_revenue.arr_lc` over in-scope accounts | Falls back to nothing — if unmatched, the account is reported as unmatched, not as zero |
| Net ARR movement | Sum of new sale + upgrade − downgrade − cancellation over the period | From `arr_movement`, per BCN per month |
| New opportunities | Count and sum of `OPP_ARR` where `created_at` is in the period | |
| Won | Count and sum of `OPP_ARR` where status Won and `close_date` in period | Prefer `actual_revenue` where non-null and non-zero; it is defaulted to 0 by the close dialog, so zero means "not entered" |
| Win rate | won value ÷ (won value + lost value), closed deals only | **By value, not count.** Open deals excluded. Tied to the period picker, which the current one is not |
| Open pipeline | Sum of `OPP_ARR` where status Open | |
| Weighted forecast | Sum of `OPP_ARR × probability / 100` | `probability` is 0–100 throughout; verified, no 0–1 mixing |
| Average deal size | Mean of `OPP_ARR` over deals **where it is non-null and non-zero** | The current `AVG(COALESCE(…,0))` counts blanks as zero and understates badly |
| Top-10 concentration | ARR of the 10 largest in-scope accounts ÷ total in-scope ARR | Guard the zero denominator |
| Accounts touched | Distinct in-scope accounts with an activity in the period ÷ accounts owned | |
| Activities per won deal | Activities in period ÷ deals won in period | Show "—" when no deals won, never divide by zero |
| Coverage buckets | By `last_activity_at`, with null in its own "never" bucket | The current code counts never-contacted as 30/60/90-day stale, inflating all three |

### Honesty requirements

Three things the UI must state rather than hide.

**Weighted forecast.** For locally created deals, `probability` is derived from the stage, so
weighting by it restates the stage rather than adding information. Only D365-synced deals carry a
real probability. Show the figure, label it as stage-weighted.

**Non-euro deals.** There is no exchange rate in the codebase. Filter money aggregates to
`currency = 'EUR'` and show a small note counting the excluded deals. Do not convert — a wrong rate is
worse than an honest exclusion. If the excluded count is zero, which is likely for a Benelux team,
the note stays hidden.

**Period ceiling.** The ARR period control must not offer windows the data cannot fill. Offer 3, 6
and 12 months and calendar quarters within the last 12 months, and nothing beyond. While fixing this,
correct the chart captions that claim 24 months and the comments in
`src/lib/integrations/powerbi/queries.ts`.

### Empty states

Every tile needs one, and it names the cause: "No ARR data — this account has no matching Power BI
record" rather than "€0". A tile that cannot be computed is absent or explicitly empty, never zero.

## Audit findings this replaces

Recorded so the rebuild does not reintroduce them. Severity as assessed.

1. **(High)** The entire Pipeline tab money layer sums raw `estimated_revenue` — total pipeline,
   weighted forecast, forecast by month, the funnel's revenue tooltip, expiring-soon amounts and both
   average-deal-size charts all render zero. `queryPipelineData` at `analytics.ts:169-250` was not
   covered by the v2.34.0 fix. The same raw sum also appears in `teamAnalytics.ts` (lines 119, 127,
   270, 276, 314) and `aiSearch.ts` (118, 123, 275, 282).
2. **(High)** ARR on the Customers tab reads `customers.arr` while the Revenue tab reads
   `customer_revenue.arr_lc`. Different sources, different numbers, and the former is likely empty.
3. **(High)** Call Direction, Activity by Day of Week and Most Active Customers carry no user filter
   and are team-wide under a "My activity" heading.
4. **(High)** `arrAdapter.ts:41` defaults a missing currency to USD; `:44-50` dedupes by taking the
   max ARR across currencies, which is arbitrary. Downstream everything is printed with a euro sign.
5. **(High)** The 18M and 24M period buttons do nothing; captions claim 24 months over 12 months of data.
6. **(Med-high)** `AVG(COALESCE(revenue, 0))` counts missing values as zero in both average-deal-size charts.
7. **(Med-high)** "By Reseller" is actually grouped by vendor, and ranked by average rather than
   total, so one large deal outranks fifty steady ones.
8. **(Med-high)** Revenue KPIs find Power BI rows only by BCN or account number, although the cache
   also matches on reseller id, marketplace id and name — so matched customers are undercounted. The
   cache keeps only the largest-ARR row per BCN instead of summing.
9. **(Med)** Total ARR KPI and the ARR trend chart on the same screen compute over different
   populations and will not agree.
10. **(Med)** "Avg contacts per customer" excludes customers with zero contacts, contradicting the
    two cards beside it.
11. **(Med)** Win rate is count-based, all-time, and ignores the period picker beside it; the pipeline
    win-rate pie includes Open deals and shows no percentage.
12. **(Med)** Forecast by month includes already-overdue open deals and silently drops deals with no
    expected close date, so it never reconciles to total pipeline.
13. **(Low-med)** "Avg days to complete" shows "—" for anything under about 70 minutes.
14. **(Low-med)** Follow-up completion is a creation cohort, so a follow-up created yesterday and not
    yet due counts against the percentage.
15. **(Low-med)** The insights refresh deletes then re-inserts in chunks; a failed chunk is logged but
    the sync is still recorded as a success, leaving partial data that only appears after restart.
16. **(Low)** Net sales and seat cards include the current partial month, producing a fake dip.
17. **(Low)** Period boundaries compare local-offset ISO strings against stored UTC, and day bucketing
    is by UTC date, so late-evening Belgian activity lands on the previous day.
18. **(Low)** Never-contacted customers are counted in every staleness bucket; `last_activity_at` is
    only ever raised and includes future-dated activities.
19. **(Low)** Cloud rate counts unknown as non-cloud. ARR-by-dimension silently truncates to eight
    groups with no "other" row.

## Constraints

- Stack as it stands: Next.js static export, Tauri, SQLite via `src/lib/db/client.ts`, Zustand,
  recharts behind `src/components/ui/chart.tsx`, Tailwind. No new dependencies for this work.
- Queries live in `src/lib/db/queries/`, built with positional `$N` parameters against hand-written
  column lists. Parameter order must be verified against the column list — a mismatch shifts columns
  silently and SQLite will not complain.
- TDD: tests first. Vitest, tests co-located in `__tests__/`. Every metric in the definitions table
  gets a test that fails if its arithmetic breaks. Run affected tests only.
- Help docs under `docs/help/` must be updated as part of the work, including the scope asymmetry.
- Every commit carries a version bump, `pnpm sync-version`, and a `.changelog/v{version}.md` entry in
  plain language.

## Decisions made here, for the record

Settled during the conversation, by Dylan unless marked.

- Four subject tabs with a scope switch, over splitting by audience. *(Dylan)*
- Rolling 12 months **and** calendar quarters, both. *(Dylan)*
- "Mine" = accounts owned and opportunities owned. *(Dylan)*
- "Team" = every Benelux account, with a BE / NL / LU country filter. *(Dylan — I recommended
  restricting team ARR to the team's own accounts so both halves of the screen reconcile; he wants
  the market-wide view. Carried by labelling instead, above.)*
- Nothing from the current Reports is retained. *(Dylan)*
- Full-height layout with paginating lists, as on Home. *(Dylan)*
- Scope resolves per entity rather than globally, with the resulting asymmetry accepted and
  documented. *(My call, from Dylan's definition.)*
- Win rate is by value rather than count. *(My call — it is the figure a manager acts on, and the
  count-based version is what made the current one misleading.)*
- Euro-only filtering with an excluded-deal note, rather than conversion. *(My call — no rate source
  exists, and inventing one would be the worst outcome.)*
- Keep recharts. *(My call — already present, no reason to churn.)*

## Left to the builder

- Tile ordering and visual hierarchy within each tab, within the layout rules above.
- Whether the Growth waterfall is a true waterfall or a stacked bar, whichever reads better at the
  real data volumes.
- Query decomposition: one query per tab versus one per tile, and what belongs in a Zustand store
  versus fetched per tab.
- Caching and refresh behaviour between tabs.
- Which existing components under `src/components/analytics/` and `src/components/insights/` are worth
  salvaging as scaffolding. Nothing is sacred, but `MetricCard`, `PeriodPicker` and
  `src/components/ui/chart.tsx` are plausible starting points.
### Shared code outside Reports

"Nothing is retained" applies to the Reports UI and to the queries only Reports calls. It is not a
licence to delete shared code. Before removing any query in `analytics.ts`, check its callers —
Home, the dashboard and AI search all draw on that file. The rule:

- A query only Reports called: delete it with the old tab.
- A query shared with another page: leave it in place and fix the arithmetic, so the other page gets
  the correction rather than a regression.
- `teamAnalytics.ts` and `aiSearch.ts` carry the same raw-`estimated_revenue` defect. Route them
  through `OPP_ARR` as part of this work — it is a one-line change per site and leaving them wrong
  while Reports is right recreates the disagreement this redesign exists to end.
