export type Region = 'BENELUX' | 'BE' | 'NL' | 'LU';

export const REGION_COUNTRIES: Record<Region, readonly string[]> = {
  BENELUX: ['BE', 'NL', 'LU'],
  BE: ['BE'],
  NL: ['NL'],
  LU: ['LU'],
};

export const REGION_LABELS: Record<Region, string> = {
  BENELUX: 'All Benelux',
  BE: 'Belgium',
  NL: 'Netherlands',
  LU: 'Luxembourg',
};

export function regionMatches(addressCountry: string | null | undefined, region: Region): boolean {
  if (!addressCountry) return false;
  return REGION_COUNTRIES[region].includes(addressCountry);
}
