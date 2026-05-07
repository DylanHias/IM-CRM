/** Format a number with the given currency. Falls back gracefully if the currency
 *  isn't a valid ISO code (D365 sometimes hands us localized currency names). */
export function formatCurrency(
  value: number,
  currency: string | null | undefined,
  options: { locale?: string; maximumFractionDigits?: number; minimumFractionDigits?: number } = {},
): string {
  const { locale = 'en-US', maximumFractionDigits = 0, minimumFractionDigits } = options;
  const code = (currency ?? '').trim().toUpperCase();
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
