/** D365 sometimes hands us localized currency names (e.g. "EURO", "US Dollar")
 *  instead of ISO codes. Normalize the common ones so Intl.NumberFormat renders
 *  the proper symbol (€, $, £…). */
const CURRENCY_NAME_TO_ISO: Record<string, string> = {
  euro: 'EUR',
  euros: 'EUR',
  'us dollar': 'USD',
  'us dollars': 'USD',
  dollar: 'USD',
  dollars: 'USD',
  'pound sterling': 'GBP',
  'british pound': 'GBP',
  pound: 'GBP',
  'swiss franc': 'CHF',
  'schweizer franken': 'CHF',
  'danish kroner': 'DKK',
  'norwegian kroner': 'NOK',
  'swedish kronor': 'SEK',
  'czech koruna': 'CZK',
  'česká koruna': 'CZK',
  'polish zloty': 'PLN',
  'złoty polski': 'PLN',
  forint: 'HUF',
  'turkish lira': 'TRY',
  'saudi riyal': 'SAR',
  'qatari riyal': 'QAR',
  'united arab emirates dirham': 'AED',
  'bahraini dinar': 'BHD',
  'kuwaiti dinar': 'KWD',
  'omani rial': 'OMR',
  'egyptian pound': 'EGP',
};

function normalizeCurrencyCode(currency: string | null | undefined): string {
  const trimmed = (currency ?? '').trim();
  if (!trimmed) return '';
  const upper = trimmed.toUpperCase();
  if (/^[A-Z]{3}$/.test(upper)) return upper;
  return CURRENCY_NAME_TO_ISO[trimmed.toLowerCase()] ?? upper;
}

/** Format a number with the given currency. Falls back gracefully if the currency
 *  isn't a valid ISO code (D365 sometimes hands us localized currency names). */
export function formatCurrency(
  value: number,
  currency: string | null | undefined,
  options: { locale?: string; maximumFractionDigits?: number; minimumFractionDigits?: number } = {},
): string {
  const { locale = 'en-US', maximumFractionDigits = 0, minimumFractionDigits } = options;
  const code = normalizeCurrencyCode(currency);
  if (/^[A-Z]{3}$/.test(code)) {
    try {
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: code,
        maximumFractionDigits,
        ...(minimumFractionDigits != null ? { minimumFractionDigits } : {}),
      }).format(value);
    } catch {
      // fall through to plain formatting
    }
  }
  const plain = value.toLocaleString(locale, { maximumFractionDigits });
  return code ? `${code} ${plain}` : plain;
}

/** Compact euros for tiles and axes: €1.20M, €125K, €999. Negatives get a true minus sign: −€125K. */
export function formatEurCompact(n: number): string {
  const abs = Math.abs(n);
  // 999_500 rounds to 1000K, so the million tier starts there.
  const body = abs >= 999_500 ? `€${(abs / 1_000_000).toFixed(2)}M` : abs >= 1_000 ? `€${Math.round(abs / 1_000)}K` : `€${Math.round(abs)}`;
  return n < 0 && body !== '€0' ? `−${body}` : body;
}
