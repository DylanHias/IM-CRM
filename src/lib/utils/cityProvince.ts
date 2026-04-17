// Known aliases: normalized variant → canonical English name (lowercase)
const ALIASES: Record<string, string> = {
  // Antwerp
  antwerpen: 'antwerp',

  // Ghent
  gent: 'ghent',

  // Bruges
  brugge: 'bruges',

  // Brussels
  brussel: 'brussels',
  bruxelles: 'brussels',

  // Liège
  liège: 'liège',
  liege: 'liège',
  luik: 'liège',

  // Mechelen / Malines (keep Mechelen as English is also Mechelen)
  malines: 'mechelen',

  // Namur / Namen
  namen: 'namur',

  // Kortrijk / Courtrai (English uses Kortrijk)
  courtrai: 'kortrijk',

  // Tournai / Doornik (English uses Tournai)
  doornik: 'tournai',

  // Leuven / Louvain (English uses Leuven)
  louvain: 'leuven',

  // Mons / Bergen
  bergen: 'mons',

  // Ostend / Oostende
  oostende: 'ostend',

  // Ypres / Ieper
  ieper: 'ypres',

  // The Hague
  'den haag': 'the hague',
  "'s-gravenhage": 'the hague',
  's-gravenhage': 'the hague',
  's gravenhage': 'the hague',
  's-gravenhag': 'the hague',
  's-gravenhaag': 'the hague',

  // Den Bosch / 's-Hertogenbosch
  "'s-hertogenbosch": 'den bosch',
  's-hertogenbosch': 'den bosch',
  's hertogenbosch': 'den bosch',

  // Sint-Niklaas
  'sint-niklaas': 'sint-niklaas',
  'sint niklaas': 'sint-niklaas',
  'st-niklaas': 'sint-niklaas',
  'st niklaas': 'sint-niklaas',
};

// Patterns to strip from city names before lookup
const STRIP_SUFFIX = [
  /[,\s]*(,\s*)?(nederland|netherlands|belgium|belgique|belgi[eë]|belgié|luxemburg|luxembourg)\s*$/i,
  /\s*\(\s*(nederland|netherlands|belgium|belgique|nl|be|gld|ov|zh|lb|nb|gr|fr|ze|dr|ut|fl|ge|ov)\s*\)\s*$/i,
  /[,.]$/,
];

function clean(raw: string): string {
  let city = raw.toLowerCase().trim();
  for (const pattern of STRIP_SUFFIX) {
    city = city.replace(pattern, '').trim();
  }
  // Remove trailing comma/period again after stripping
  city = city.replace(/[,.]$/, '').trim();
  return city;
}

function stripDistrict(city: string): string {
  // "antwerpen-berchem" → "antwerpen", "amsterdam-zuidoost" → "amsterdam"
  // Only strip if the base part is at least 4 chars to avoid false positives
  const hyphen = city.indexOf('-');
  if (hyphen >= 4) return city.slice(0, hyphen);
  const space = city.indexOf(' ');
  if (space >= 4 && /^(amsterdam|rotterdam|antwerpen|brussel|bruxelles|brussels|eindhoven|gent|brugge|tilburg|utrecht|nijmegen|arnhem|groningen|zwolle|apeldoorn|enschede|den\s)/.test(city)) {
    return city.slice(0, space);
  }
  return city;
}

// Rejects entries that aren't plausible city names
function isValidCity(city: string): boolean {
  if (city.length < 2) return false;
  // Reject if it starts with a digit (postal codes, numbers)
  if (/^\d/.test(city)) return false;
  // Reject if it's mostly non-letter characters
  if (!/[a-zàáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿœ]/i.test(city)) return false;
  // Reject known garbage values
  if (/^(test|be|nl|sk|no town|address line|hierarchy node|grand dutych)/.test(city)) return false;
  return true;
}

export function normalizeCity(raw: string | null | undefined): string | null {
  if (!raw?.trim()) return null;
  let city = clean(raw);
  if (!city || !isValidCity(city)) return null;
  // Check direct alias
  if (ALIASES[city]) return ALIASES[city];
  // Try stripping district suffix and re-check alias
  const base = stripDistrict(city);
  if (base !== city) {
    if (ALIASES[base]) return ALIASES[base];
    return base;
  }
  return city;
}

// Title-case a canonical city name for display
export function displayCity(canonical: string): string {
  return canonical
    .split(/(\s|-)/g)
    .map((part, i, arr) => {
      if (part === ' ' || part === '-') return part;
      // Keep lowercase for connectors unless first word
      if (i > 0 && /^(de|den|het|aan|van|op|in|en|te|sur|les|la|le|du|des|bij|aan|a\/d)$/i.test(part)) return part;
      return part.charAt(0).toUpperCase() + part.slice(1);
    })
    .join('');
}

export function getUniqueCities(cities: (string | null | undefined)[]): string[] {
  const seen = new Set<string>();
  for (const raw of cities) {
    const canonical = normalizeCity(raw);
    if (canonical) seen.add(canonical);
  }
  return Array.from(seen).sort();
}
