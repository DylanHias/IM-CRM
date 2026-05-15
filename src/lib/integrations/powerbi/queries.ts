/**
 * DAX queries for revenue aggregation. Each query is server-aggregated so the response
 * stays inside Power BI's executeQueries limits (100k rows, 1M cells, 60s timeout)
 * regardless of how large the underlying fact tables are.
 *
 * The CRM's "customers" map to Power BI's RESELLER table (Ingram's business partners).
 * Power BI's CUSTOMER table is end-customers of those resellers and we don't surface
 * those directly. All joins are on Reseller[bcn].
 *
 * Scope is Benelux only — filtered in DAX so non-Benelux rows never cross the wire.
 *
 * Response key conventions:
 *  - Native columns: "Reseller[bcn]"
 *  - Computed (ADDCOLUMNS) columns: "[ARR_USD]"
 */

export const BENELUX_COUNTRY_CODES = ['BE', 'NL', 'LU'] as const;

const BENELUX_DAX_LIST = `{${BENELUX_COUNTRY_CODES.map((c) => `"${c}"`).join(', ')}}`;

const ACTIVITY_WINDOW_MONTHS = 12;

/**
 * One row per Benelux reseller with their current-month ARR (USD + LC).
 * Cache-expansion: any reseller with non-zero ARR at any point in the last
 * 12 months is included, even if their current-month value is zero. UI can
 * distinguish active vs dormant-but-recent via the value itself.
 *
 * Response keys: Reseller[bcn], Reseller[reseller_id], Reseller[currency_code],
 * [ARR_USD], [ARR_LC], [AsOfMonth]
 */
export const CURRENT_ARR_BY_BCN_DAX = `
EVALUATE
VAR LatestMonth = CALCULATE(MAX(ARR[calendar_month]), ALL(ARR))
VAR WindowStart = EDATE(LatestMonth, -${ACTIVITY_WINDOW_MONTHS} + 1)
RETURN
FILTER(
  ADDCOLUMNS(
    SUMMARIZE(
      FILTER(Reseller, Reseller[country_code] IN ${BENELUX_DAX_LIST}),
      Reseller[bcn],
      Reseller[reseller_id],
      Reseller[currency_code]
    ),
    "ARR_USD", CALCULATE(SUM(ARR[arr_arr_amt_usd]), ARR[calendar_month] = LatestMonth),
    "ARR_LC", CALCULATE(SUM(ARR[ARR, LC]), ARR[calendar_month] = LatestMonth),
    "WindowARR_USD", CALCULATE(
      SUM(ARR[arr_arr_amt_usd]),
      ARR[calendar_month] >= WindowStart,
      ARR[calendar_month] <= LatestMonth
    ),
    "WindowARR_LC", CALCULATE(
      SUM(ARR[ARR, LC]),
      ARR[calendar_month] >= WindowStart,
      ARR[calendar_month] <= LatestMonth
    ),
    "AsOfMonth", LatestMonth
  ),
  NOT ISBLANK(Reseller[bcn]) && ([WindowARR_USD] > 0 || [WindowARR_LC] > 0)
)
`.trim();

/**
 * Org-wide monthly ARR trend across Benelux resellers.
 * Returns one row per month with total ARR (USD) and distinct reseller count.
 *
 * Response keys: ARR[calendar_month], [ARR_USD], [CustomerCount]
 */
export function arrTrendDax(monthsBack: number, countryCodes: readonly string[]): string {
  const safeMonths = Math.max(1, Math.min(36, Math.floor(monthsBack)));
  const safeCodes = countryCodes
    .map((c) => c.replace(/[^A-Z]/g, ''))
    .filter((c) => c.length === 2);
  const codesList = `{${safeCodes.map((c) => `"${c}"`).join(', ')}}`;
  return `
EVALUATE
VAR LatestMonth = CALCULATE(MAX(ARR[calendar_month]), ALL(ARR))
VAR EarliestMonth = EDATE(LatestMonth, -${safeMonths} + 1)
VAR ScopedResellerIds = CALCULATETABLE(
  VALUES(Reseller[reseller_id]),
  Reseller[country_code] IN ${codesList}
)
RETURN
ADDCOLUMNS(
  SUMMARIZE(
    FILTER(ARR,
      ARR[reseller_id] IN ScopedResellerIds &&
      ARR[calendar_month] >= EarliestMonth &&
      ARR[calendar_month] <= LatestMonth
    ),
    ARR[calendar_month]
  ),
  "ARR_USD", CALCULATE(SUM(ARR[arr_arr_amt_usd])),
  "CustomerCount", CALCULATE(DISTINCTCOUNT(ARR[reseller_id]))
)
`.trim();
}

/**
 * Per-reseller ARR Movement (last N months) grouped by month.
 * Scoped to a single BCN — resolved to underlying reseller_ids inside DAX.
 *
 * Response keys:
 *  'ARR Movement'[month], [Upgrade_USD], [Downgrade_USD], [Cancellation_USD],
 *  [NewSale_USD], [Upgrade_LC], [Downgrade_LC], [Cancellation_LC], [NewSale_LC]
 */
export function arrMovementByBcnDax(bcn: string, monthsBack: number): string {
  const safeBcn = bcn.replace(/[^a-zA-Z0-9\-_.]/g, '');
  const safeMonths = Math.max(1, Math.min(36, Math.floor(monthsBack)));
  return `
EVALUATE
VAR TargetBcn = "${safeBcn}"
VAR LatestMonth = CALCULATE(MAX('ARR Movement'[month]), ALL('ARR Movement'))
VAR EarliestMonth = EDATE(LatestMonth, -${safeMonths} + 1)
VAR ResellerIds = CALCULATETABLE(
  VALUES(Reseller[reseller_id]),
  Reseller[bcn] = TargetBcn
)
RETURN
ADDCOLUMNS(
  SUMMARIZE(
    FILTER('ARR Movement',
      'ARR Movement'[reseller_id] IN ResellerIds &&
      'ARR Movement'[month] >= EarliestMonth &&
      'ARR Movement'[month] <= LatestMonth
    ),
    'ARR Movement'[month]
  ),
  "Upgrade_USD", CALCULATE(SUM('ARR Movement'[arr_upgrade_usd])),
  "Downgrade_USD", CALCULATE(SUM('ARR Movement'[arr_downgrade_usd])),
  "Cancellation_USD", CALCULATE(SUM('ARR Movement'[arr_cancellation_usd])),
  "NewSale_USD", CALCULATE(SUM('ARR Movement'[arr_new_sale_usd])),
  "Upgrade_LC", CALCULATE(SUM('ARR Movement'[arr_upgrade])),
  "Downgrade_LC", CALCULATE(SUM('ARR Movement'[arr_downgrade])),
  "Cancellation_LC", CALCULATE(SUM('ARR Movement'[arr_cancellation])),
  "NewSale_LC", CALCULATE(SUM('ARR Movement'[arr_new_sale]))
)
`.trim();
}
