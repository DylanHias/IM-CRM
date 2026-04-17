// Belgian city coordinates mapped to viewBox="0 0 800 600"
// Projection: x = (lng - 2.4) * 195, y = (51.6 - lat) * 275
// Based on simplified Belgium outline (same projection).

export interface CityData {
  id: string;
  displayName: string;
  x: number;
  y: number;
  aliases: string[];
}

export const BELGIAN_CITIES: CityData[] = [
  { id: 'antwerpen',  displayName: 'Antwerp',    x: 390, y: 105, aliases: ['antwerpen', 'antwerp', 'anvers'] },
  { id: 'brussel',   displayName: 'Brussels',   x: 380, y: 205, aliases: ['brussel', 'bruxelles', 'brussels', 'brussels-capital', 'brussels capital', 'bruxelles-capitale'] },
  { id: 'gent',      displayName: 'Ghent',      x: 257, y: 151, aliases: ['gent', 'ghent', 'gand'] },
  { id: 'brugge',    displayName: 'Bruges',     x: 160, y: 107, aliases: ['brugge', 'bruges'] },
  { id: 'luik',      displayName: 'Liège',      x: 618, y: 265, aliases: ['luik', 'liege', 'liège', 'liege', 'lüttich'] },
  { id: 'leuven',    displayName: 'Leuven',     x: 449, y: 198, aliases: ['leuven', 'louvain'] },
  { id: 'namen',     displayName: 'Namur',      x: 482, y: 310, aliases: ['namen', 'namur'] },
  { id: 'charleroi', displayName: 'Charleroi',  x: 398, y: 327, aliases: ['charleroi'] },
  { id: 'mons',      displayName: 'Mons',       x: 302, y: 316, aliases: ['mons', 'bergen'] },
  { id: 'hasselt',   displayName: 'Hasselt',    x: 573, y: 184, aliases: ['hasselt'] },
  { id: 'mechelen',  displayName: 'Mechelen',   x: 406, y: 157, aliases: ['mechelen', 'malines'] },
  { id: 'kortrijk',  displayName: 'Kortrijk',   x: 168, y: 214, aliases: ['kortrijk', 'courtrai'] },
  { id: 'oostende',  displayName: 'Ostend',     x: 101, y: 102, aliases: ['oostende', 'ostend', 'ostende'] },
  { id: 'tournai',   displayName: 'Tournai',    x: 191, y: 273, aliases: ['doornik', 'tournai'] },
  { id: 'aalst',     displayName: 'Aalst',      x: 319, y: 181, aliases: ['aalst', 'alost'] },
  { id: 'roeselare', displayName: 'Roeselare',  x: 140, y: 181, aliases: ['roeselare', 'roulers'] },
  { id: 'genk',      displayName: 'Genk',       x: 568, y: 160, aliases: ['genk'] },
  { id: 'sint-niklaas', displayName: 'Sint-Niklaas', x: 339, y: 120, aliases: ['sint-niklaas', 'saint-nicolas'] },
];

// Build a lookup: normalizedAlias → cityId
const aliasMap = new Map<string, string>();
for (const city of BELGIAN_CITIES) {
  for (const alias of city.aliases) {
    aliasMap.set(alias, city.id);
  }
}

function stripAccents(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

export function normalizeCityKey(raw: string): string | null {
  const normalized = stripAccents(raw.toLowerCase().trim());
  return aliasMap.get(normalized) ?? null;
}
