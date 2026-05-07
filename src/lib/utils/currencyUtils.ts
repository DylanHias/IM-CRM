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
