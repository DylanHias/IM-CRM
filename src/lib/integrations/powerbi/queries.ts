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
 * Design: every query returns a *raw snapshot* at max range (24 months) grouped by
 * country_code (or BCN for movement). The CRM stores these snapshots locally and
 * slices them client-side by region + months-back, so flipping a UI filter never
 * needs another DAX call.
 *
 * Response key conventions:
 *  - Native columns: "Reseller[bcn]"
 *  - Computed (ADDCOLUMNS) columns: "[ARR_USD]"
 */

export const BENELUX_COUNTRY_CODES = ['BE', 'NL', 'LU'] as const;

const BENELUX_DAX_LIST = `{${BENELUX_COUNTRY_CODES.map((c) => `"${c}"`).join(', ')}}`;

const ACTIVITY_WINDOW_MONTHS = 12;

const SNAPSHOT_MONTHS = 12;

/**
 * One row per Benelux reseller with their current-month ARR (USD + LC).
 * Cache-expansion: any reseller with non-zero ARR at any point in the last
 * 12 months is included, even if their current-month value is zero. UI can
 * distinguish active vs dormant-but-recent via the value itself.
 *
 * Response keys: Reseller[bcn], Reseller[reseller_id], Reseller[Reseller Account],
 * Reseller[Reseller Name], Reseller[marketplace_id], Reseller[currency_code],
 * [ARR_USD], [ARR_LC], [ActiveEndCustomers], [AsOfMonth]
 *
 * ActiveEndCustomers = distinct ARR[customer_id] for this reseller in the latest
 * month. ARR rows are emitted per active end-customer subscription, so this counts
 * the reseller's currently-active end customers (not historical). */
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
      Reseller[Reseller Account],
      Reseller[Reseller Name],
      Reseller[marketplace_id],
      Reseller[currency_code]
    ),
    "ARR_USD", CALCULATE(SUM(ARR[arr_arr_amt_usd]), ARR[calendar_month] = LatestMonth),
    "ARR_LC", CALCULATE(SUM(ARR[ARR, LC]), ARR[calendar_month] = LatestMonth),
    "ActiveEndCustomers", CALCULATE(
      DISTINCTCOUNT(ARR[customer_id]),
      ARR[calendar_month] = LatestMonth
    ),
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
 * Per-country, per-month ARR snapshot over the last 24 months across Benelux.
 * The CRM aggregates client-side to derive region/period totals.
 *
 * Response keys: ARR[calendar_month], Reseller[country_code], [ARR_LC], [CustomerCount]
 */
export const ARR_TREND_SNAPSHOT_DAX = `
EVALUATE
VAR LatestMonth = CALCULATE(MAX(ARR[calendar_month]), ALL(ARR))
VAR EarliestMonth = EDATE(LatestMonth, -${SNAPSHOT_MONTHS} + 1)
VAR ScopedResellerIds = CALCULATETABLE(
  VALUES(Reseller[reseller_id]),
  Reseller[country_code] IN ${BENELUX_DAX_LIST}
)
RETURN
ADDCOLUMNS(
  SUMMARIZE(
    FILTER(ARR,
      ARR[reseller_id] IN ScopedResellerIds &&
      ARR[calendar_month] >= EarliestMonth &&
      ARR[calendar_month] <= LatestMonth
    ),
    ARR[calendar_month],
    Reseller[country_code]
  ),
  "ARR_LC", CALCULATE(SUM(ARR[ARR, LC])),
  "CustomerCount", CALCULATE(DISTINCTCOUNT(ARR[reseller_id]))
)
`.trim();

/**
 * Per-country, per-month reseller + seat activity snapshot (last 24 months).
 * "Active" = a reseller with a Seats row where seats_active_seats > 0 in that month.
 *
 * Response keys: Seats[month], Reseller[country_code], [ActiveResellers], [ActiveSeats]
 */
export const RESELLER_SEATS_SNAPSHOT_DAX = `
EVALUATE
VAR LatestMonth = CALCULATE(MAX(Seats[month]), ALL(Seats))
VAR EarliestMonth = EDATE(LatestMonth, -${SNAPSHOT_MONTHS} + 1)
RETURN
CALCULATETABLE(
  ADDCOLUMNS(
    SUMMARIZE(
      FILTER(Seats,
        Seats[month] >= EarliestMonth &&
        Seats[month] <= LatestMonth
      ),
      Seats[month],
      Reseller[country_code]
    ),
    "ActiveSeats", CALCULATE(SUM(Seats[seats_active_seats])),
    "ActiveResellers", CALCULATE(
      DISTINCTCOUNT(Seats[reseller_id]),
      Seats[seats_active_seats] > 0
    )
  ),
  Reseller[country_code] IN ${BENELUX_DAX_LIST}
)
`.trim();

/**
 * Per-country, per-month, per-vendor net sales (LC) snapshot (last 24 months).
 * Stores every vendor — UI computes "top N by region" client-side.
 *
 * Response keys: Sales[month], Reseller[country_code], Vendor[vendor_name], [NetSales_LC]
 */
export const NET_SALES_SNAPSHOT_DAX = `
EVALUATE
VAR LatestMonth = CALCULATE(MAX(Sales[month]), ALL(Sales))
VAR EarliestMonth = EDATE(LatestMonth, -${SNAPSHOT_MONTHS} + 1)
VAR ScopedResellerIds = CALCULATETABLE(
  VALUES(Reseller[reseller_id]),
  Reseller[country_code] IN ${BENELUX_DAX_LIST}
)
RETURN
ADDCOLUMNS(
  SUMMARIZE(
    FILTER(Sales,
      Sales[reseller_id] IN ScopedResellerIds &&
      Sales[month] >= EarliestMonth &&
      Sales[month] <= LatestMonth
    ),
    Sales[month],
    Reseller[country_code],
    Vendor[vendor_name]
  ),
  "NetSales_LC", CALCULATE(SUM(Sales[net_sales_lc]))
)
`.trim();

/**
 * Per-BCN, per-month ARR Movement snapshot (last 24 months) for all Benelux resellers.
 * LC values only — chart always renders in EUR. Mirrors NET_SALES_SNAPSHOT_DAX.
 *
 * Response keys:
 *  Reseller[bcn], 'ARR Movement'[month],
 *  [Upgrade_LC], [Downgrade_LC], [Cancellation_LC], [NewSale_LC]
 */
export const ARR_MOVEMENT_SNAPSHOT_DAX = `
EVALUATE
VAR LatestMonth = CALCULATE(MAX('ARR Movement'[month]), ALL('ARR Movement'))
VAR EarliestMonth = EDATE(LatestMonth, -${SNAPSHOT_MONTHS} + 1)
VAR ScopedResellerIds = CALCULATETABLE(
  VALUES(Reseller[reseller_id]),
  Reseller[country_code] IN ${BENELUX_DAX_LIST}
)
RETURN
ADDCOLUMNS(
  SUMMARIZE(
    FILTER('ARR Movement',
      'ARR Movement'[reseller_id] IN ScopedResellerIds &&
      'ARR Movement'[month] >= EarliestMonth &&
      'ARR Movement'[month] <= LatestMonth
    ),
    'ARR Movement'[month],
    Reseller[bcn]
  ),
  "Upgrade_LC", CALCULATE(SUM('ARR Movement'[arr_upgrade])),
  "Downgrade_LC", CALCULATE(SUM('ARR Movement'[arr_downgrade])),
  "Cancellation_LC", CALCULATE(SUM('ARR Movement'[arr_cancellation])),
  "NewSale_LC", CALCULATE(SUM('ARR Movement'[arr_new_sale]))
)
`.trim();
