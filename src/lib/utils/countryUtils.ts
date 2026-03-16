const COUNTRY_CODE_MAP: Record<string, string> = {
  'Belgium': 'BE',
  'Netherlands': 'NL',
  'Luxembourg': 'LU',
  'France': 'FR',
  'Germany': 'DE',
  'United Kingdom': 'GB',
  'United States': 'US',
  'Spain': 'ES',
  'Italy': 'IT',
  'Portugal': 'PT',
  'Austria': 'AT',
  'Switzerland': 'CH',
  'Ireland': 'IE',
  'Denmark': 'DK',
  'Sweden': 'SE',
  'Norway': 'NO',
  'Finland': 'FI',
  'Poland': 'PL',
  'Czech Republic': 'CZ',
};

export function getCountryCode(countryName: string | null): string {
  if (!countryName) return 'BE';
  return COUNTRY_CODE_MAP[countryName] ?? 'BE';
}
