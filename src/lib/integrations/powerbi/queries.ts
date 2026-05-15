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
