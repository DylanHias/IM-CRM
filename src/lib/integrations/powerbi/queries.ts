/**
 * DAX queries for revenue aggregation. Each query is server-aggregated so the response
 * stays inside Power BI's executeQueries limits (100k rows, 1M cells, 60s timeout)
 * regardless of how large the underlying fact tables are.
 *
 * Scope is Benelux only (~30k customers) — filtered in DAX so non-Benelux rows
 * never cross the wire.
 *
 * Response key conventions:
 *  - Native columns: "Customer[bcn]"
 *  - Computed (ADDCOLUMNS) columns: "[ARR_USD]"
 */

export const BENELUX_COUNTRY_CODES = ['BE', 'NL', 'LU'] as const;

const BENELUX_DAX_LIST = `{${BENELUX_COUNTRY_CODES.map((c) => `"${c}"`).join(', ')}}`;

export const CURRENT_ARR_BY_BCN_DAX = `
EVALUATE
VAR LatestMonth = CALCULATE(MAX(ARR[calendar_month]), ALL(ARR))
RETURN
FILTER(
  ADDCOLUMNS(
    SUMMARIZE(
      FILTER(Customer, Customer[country_code] IN ${BENELUX_DAX_LIST}),
      Customer[bcn],
      Customer[customer_id],
      Customer[currency_code]
    ),
    "ARR_USD", CALCULATE(SUM(ARR[arr_arr_amt_usd]), ARR[calendar_month] = LatestMonth),
    "ARR_LC", CALCULATE(SUM(ARR[ARR, LC]), ARR[calendar_month] = LatestMonth),
    "AsOfMonth", LatestMonth
  ),
  NOT ISBLANK(Customer[bcn]) && ([ARR_USD] > 0 || [ARR_LC] > 0)
)
`.trim();

/**
 * Per-customer ARR Movement (last N months) grouped by month.
 * Scoped to a single BCN — resolved to underlying customer_ids inside DAX
 * so it works even if the cache is empty.
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
VAR CustIds = CALCULATETABLE(
  VALUES(Customer[customer_id]),
  Customer[bcn] = TargetBcn
)
RETURN
ADDCOLUMNS(
  SUMMARIZE(
    FILTER('ARR Movement',
      'ARR Movement'[customer_id] IN CustIds &&
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
