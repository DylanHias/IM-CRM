// Normalized city name (lowercase + trimmed) → province/region
const MAP: Record<string, string> = {
  // === BELGIUM ===

  // Antwerpen
  antwerp: 'Antwerpen', antwerpen: 'Antwerpen',
  mechelen: 'Antwerpen', malines: 'Antwerpen',
  lier: 'Antwerpen', herentals: 'Antwerpen',
  turnhout: 'Antwerpen', mortsel: 'Antwerpen',
  boom: 'Antwerpen', willebroek: 'Antwerpen',
  geel: 'Antwerpen', mol: 'Antwerpen',
  westerlo: 'Antwerpen', duffel: 'Antwerpen',
  kontich: 'Antwerpen', edegem: 'Antwerpen',
  schoten: 'Antwerpen', wijnegem: 'Antwerpen',
  wommelgem: 'Antwerpen', zandhoven: 'Antwerpen',
  ranst: 'Antwerpen', brasschaat: 'Antwerpen',
  kapellen: 'Antwerpen', essen: 'Antwerpen',
  brecht: 'Antwerpen', malle: 'Antwerpen',
  zoersel: 'Antwerpen', boechout: 'Antwerpen',
  lint: 'Antwerpen', aartselaar: 'Antwerpen',
  hove: 'Antwerpen', niel: 'Antwerpen',
  rumst: 'Antwerpen', nijlen: 'Antwerpen',
  putte: 'Antwerpen', berlaar: 'Antwerpen',
  heist: 'Antwerpen', balen: 'Antwerpen',
  dessel: 'Antwerpen', retie: 'Antwerpen',

  // Vlaams-Brabant
  leuven: 'Vlaams-Brabant', louvain: 'Vlaams-Brabant',
  vilvoorde: 'Vlaams-Brabant', halle: 'Vlaams-Brabant',
  aarschot: 'Vlaams-Brabant', diest: 'Vlaams-Brabant',
  tienen: 'Vlaams-Brabant', zaventem: 'Vlaams-Brabant',
  machelen: 'Vlaams-Brabant', diegem: 'Vlaams-Brabant',
  haacht: 'Vlaams-Brabant', tervuren: 'Vlaams-Brabant',
  overijse: 'Vlaams-Brabant', bertem: 'Vlaams-Brabant',
  hoeilaart: 'Vlaams-Brabant', lubbeek: 'Vlaams-Brabant',
  tremelo: 'Vlaams-Brabant', keerbergen: 'Vlaams-Brabant',
  rotselaar: 'Vlaams-Brabant', zemst: 'Vlaams-Brabant',
  kampenhout: 'Vlaams-Brabant', steenokkerzeel: 'Vlaams-Brabant',
  kortenberg: 'Vlaams-Brabant',

  // Brussels Capital Region
  brussels: 'Brussels', brussel: 'Brussels', bruxelles: 'Brussels',
  'bruxelles-capitale': 'Brussels', 'brussel-stad': 'Brussels',
  ixelles: 'Brussels', elsene: 'Brussels',
  schaerbeek: 'Brussels', schaarbeek: 'Brussels',
  molenbeek: 'Brussels', anderlecht: 'Brussels',
  etterbeek: 'Brussels', jette: 'Brussels',
  auderghem: 'Brussels', oudergem: 'Brussels',
  'forest (brussels)': 'Brussels', vorst: 'Brussels',
  uccle: 'Brussels', ukkel: 'Brussels',
  evere: 'Brussels', ganshoren: 'Brussels',
  koekelberg: 'Brussels', berchem: 'Brussels',
  'watermael-boitsfort': 'Brussels', watermaal: 'Brussels',
  woluwe: 'Brussels',

  // Oost-Vlaanderen
  ghent: 'Oost-Vlaanderen', gent: 'Oost-Vlaanderen',
  aalst: 'Oost-Vlaanderen', alost: 'Oost-Vlaanderen',
  'sint-niklaas': 'Oost-Vlaanderen', dendermonde: 'Oost-Vlaanderen',
  lokeren: 'Oost-Vlaanderen', ronse: 'Oost-Vlaanderen',
  geraardsbergen: 'Oost-Vlaanderen', oudenaarde: 'Oost-Vlaanderen',
  eeklo: 'Oost-Vlaanderen', wetteren: 'Oost-Vlaanderen',
  zottegem: 'Oost-Vlaanderen', ninove: 'Oost-Vlaanderen',
  beveren: 'Oost-Vlaanderen', temse: 'Oost-Vlaanderen',
  hamme: 'Oost-Vlaanderen', buggenhout: 'Oost-Vlaanderen',
  lebbeke: 'Oost-Vlaanderen', wichelen: 'Oost-Vlaanderen',
  merelbeke: 'Oost-Vlaanderen', destelbergen: 'Oost-Vlaanderen',
  evergem: 'Oost-Vlaanderen', zelzate: 'Oost-Vlaanderen',
  moerbeke: 'Oost-Vlaanderen', wachtebeke: 'Oost-Vlaanderen',
  assenede: 'Oost-Vlaanderen', kaprijke: 'Oost-Vlaanderen',

  // West-Vlaanderen
  bruges: 'West-Vlaanderen', brugge: 'West-Vlaanderen',
  kortrijk: 'West-Vlaanderen', courtrai: 'West-Vlaanderen',
  roeselare: 'West-Vlaanderen', roulers: 'West-Vlaanderen',
  oostende: 'West-Vlaanderen', ostend: 'West-Vlaanderen',
  ieper: 'West-Vlaanderen', ypres: 'West-Vlaanderen',
  veurne: 'West-Vlaanderen', torhout: 'West-Vlaanderen',
  tielt: 'West-Vlaanderen', waregem: 'West-Vlaanderen',
  harelbeke: 'West-Vlaanderen', zwevegem: 'West-Vlaanderen',
  deerlijk: 'West-Vlaanderen', menen: 'West-Vlaanderen',
  wevelgem: 'West-Vlaanderen', lichtervelde: 'West-Vlaanderen',
  moorslede: 'West-Vlaanderen', ingelmunster: 'West-Vlaanderen',
  izegem: 'West-Vlaanderen', poperinge: 'West-Vlaanderen',
  diksmuide: 'West-Vlaanderen', knokke: 'West-Vlaanderen',
  blankenberge: 'West-Vlaanderen', damme: 'West-Vlaanderen',
  'de haan': 'West-Vlaanderen', middelkerke: 'West-Vlaanderen',

  // Limburg (BE)
  hasselt: 'Limburg', genk: 'Limburg',
  'sint-truiden': 'Limburg', tongeren: 'Limburg',
  lommel: 'Limburg', beringen: 'Limburg',
  heusden: 'Limburg', 'heusden-zolder': 'Limburg',
  maaseik: 'Limburg', maasmechelen: 'Limburg',
  lanaken: 'Limburg', dilsen: 'Limburg',
  kinrooi: 'Limburg', bree: 'Limburg',
  peer: 'Limburg', leopoldsburg: 'Limburg',
  tessenderlo: 'Limburg', bilzen: 'Limburg',
  hoeselt: 'Limburg', riemst: 'Limburg',

  // Liège
  liège: 'Liège', liege: 'Liège', luik: 'Liège',
  seraing: 'Liège', verviers: 'Liège',
  herstal: 'Liège', eupen: 'Liège',
  spa: 'Liège', stavelot: 'Liège',
  huy: 'Liège', waremme: 'Liège',
  visé: 'Liège', vise: 'Liège',
  'saint-nicolas': 'Liège', fléron: 'Liège',
  fleron: 'Liège', ans: 'Liège',

  // Namur
  namur: 'Namur', namen: 'Namur',
  andenne: 'Namur', gembloux: 'Namur',
  dinant: 'Namur', ciney: 'Namur',
  sambreville: 'Namur', floreffe: 'Namur',

  // Hainaut
  charleroi: 'Hainaut', mons: 'Hainaut',
  tournai: 'Hainaut', doornik: 'Hainaut',
  mouscron: 'Hainaut', moeskroen: 'Hainaut',
  tubize: 'Hainaut', tubeke: 'Hainaut',
  soignies: 'Hainaut', binche: 'Hainaut',
  'la louvière': 'Hainaut', 'la louviere': 'Hainaut',
  'saint-ghislain': 'Hainaut', boussu: 'Hainaut',
  quaregnon: 'Hainaut', lessines: 'Hainaut',
  enghien: 'Hainaut',

  // Luxembourg (BE)
  arlon: 'Luxembourg (BE)', aarlen: 'Luxembourg (BE)',
  bastogne: 'Luxembourg (BE)', vielsalm: 'Luxembourg (BE)',
  marche: 'Luxembourg (BE)', 'marche-en-famenne': 'Luxembourg (BE)',
  neufchateau: 'Luxembourg (BE)', 'saint-hubert': 'Luxembourg (BE)',

  // Brabant Wallon
  wavre: 'Brabant Wallon', waver: 'Brabant Wallon',
  nivelles: 'Brabant Wallon', nijvel: 'Brabant Wallon',
  ottignies: 'Brabant Wallon', 'louvain-la-neuve': 'Brabant Wallon',
  braine: 'Brabant Wallon', waterloo: 'Brabant Wallon',
  'la hulpe': 'Brabant Wallon', lasne: 'Brabant Wallon',

  // === NETHERLANDS ===

  // Noord-Holland
  amsterdam: 'Noord-Holland', haarlem: 'Noord-Holland',
  zaandam: 'Noord-Holland', amstelveen: 'Noord-Holland',
  alkmaar: 'Noord-Holland', purmerend: 'Noord-Holland',
  hilversum: 'Noord-Holland', hoorn: 'Noord-Holland',
  heerhugowaard: 'Noord-Holland', velsen: 'Noord-Holland',
  ijmuiden: 'Noord-Holland', zaanstad: 'Noord-Holland',
  diemen: 'Noord-Holland', haarlemmermeer: 'Noord-Holland',
  hoofddorp: 'Noord-Holland', 'den helder': 'Noord-Holland',

  // Zuid-Holland
  rotterdam: 'Zuid-Holland', 'den haag': 'Zuid-Holland',
  'the hague': 'Zuid-Holland', "'s-gravenhage": 'Zuid-Holland',
  leiden: 'Zuid-Holland', delft: 'Zuid-Holland',
  dordrecht: 'Zuid-Holland', zoetermeer: 'Zuid-Holland',
  naaldwijk: 'Zuid-Holland', schiedam: 'Zuid-Holland',
  vlaardingen: 'Zuid-Holland', spijkenisse: 'Zuid-Holland',
  gouda: 'Zuid-Holland', ridderkerk: 'Zuid-Holland',
  barendrecht: 'Zuid-Holland', 'hoek van holland': 'Zuid-Holland',

  // Utrecht
  utrecht: 'Utrecht', amersfoort: 'Utrecht',
  nieuwegein: 'Utrecht', zeist: 'Utrecht',
  houten: 'Utrecht', woerden: 'Utrecht',
  veenendaal: 'Utrecht', soest: 'Utrecht',
  baarn: 'Utrecht', bunnik: 'Utrecht',
  'de bilt': 'Utrecht', maarssen: 'Utrecht',

  // Noord-Brabant
  eindhoven: 'Noord-Brabant', breda: 'Noord-Brabant',
  tilburg: 'Noord-Brabant', "'s-hertogenbosch": 'Noord-Brabant',
  'den bosch': 'Noord-Brabant', helmond: 'Noord-Brabant',
  roosendaal: 'Noord-Brabant', oss: 'Noord-Brabant',
  waalwijk: 'Noord-Brabant', veldhoven: 'Noord-Brabant',
  nuenen: 'Noord-Brabant', boxtel: 'Noord-Brabant',

  // Gelderland
  nijmegen: 'Gelderland', arnhem: 'Gelderland',
  apeldoorn: 'Gelderland', ede: 'Gelderland',
  doetinchem: 'Gelderland', harderwijk: 'Gelderland',
  tiel: 'Gelderland', zutphen: 'Gelderland',
  winterswijk: 'Gelderland', barneveld: 'Gelderland',
  wageningen: 'Gelderland', beuningen: 'Gelderland',

  // Overijssel
  enschede: 'Overijssel', zwolle: 'Overijssel',
  almelo: 'Overijssel', deventer: 'Overijssel',
  hengelo: 'Overijssel', oldenzaal: 'Overijssel',
  kampen: 'Overijssel', rijssen: 'Overijssel',

  // Groningen
  groningen: 'Groningen', veendam: 'Groningen',
  hoogezand: 'Groningen', delfzijl: 'Groningen',

  // Friesland
  leeuwarden: 'Friesland', sneek: 'Friesland',
  heerenveen: 'Friesland', drachten: 'Friesland',

  // Drenthe
  assen: 'Drenthe', emmen: 'Drenthe',
  meppel: 'Drenthe', hoogeveen: 'Drenthe',

  // Flevoland
  almere: 'Flevoland', lelystad: 'Flevoland',
  dronten: 'Flevoland', zeewolde: 'Flevoland',

  // Zeeland
  middelburg: 'Zeeland', vlissingen: 'Zeeland',
  goes: 'Zeeland', terneuzen: 'Zeeland',

  // Limburg (NL)
  maastricht: 'Limburg (NL)', venlo: 'Limburg (NL)',
  roermond: 'Limburg (NL)', heerlen: 'Limburg (NL)',
  sittard: 'Limburg (NL)', kerkrade: 'Limburg (NL)',
  weert: 'Limburg (NL)', geleen: 'Limburg (NL)',
};

export function getCityProvince(city: string | null | undefined): string | null {
  if (!city) return null;
  return MAP[city.toLowerCase().trim()] ?? null;
}

export function getProvinces(cities: (string | null | undefined)[]): string[] {
  const provinces = new Set<string>();
  for (const city of cities) {
    const province = getCityProvince(city);
    if (province) provinces.add(province);
  }
  return Array.from(provinces).sort();
}
