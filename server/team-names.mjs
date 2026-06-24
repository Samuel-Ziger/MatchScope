/** Nomes The Odds API → id interno (espelha src/lib/teamApiMapping.ts + parse.ts) */
export const NAME_TO_TEAM_ID = {
  France: 'fra',
  Argentina: 'arg',
  Spain: 'esp',
  England: 'eng',
  Portugal: 'por',
  Netherlands: 'ned',
  Germany: 'ger',
  Brazil: 'bra',
  USA: 'usa',
  'United States': 'usa',
  Norway: 'nor',
  Morocco: 'mar',
  Japan: 'jpn',
  Mexico: 'mex',
  Colombia: 'col',
  Belgium: 'bel',
  Switzerland: 'sui',
  Croatia: 'cro',
  Canada: 'can',
  'South Korea': 'kor',
  Korea: 'kor',
  Uruguay: 'uru',
  Senegal: 'sen',
  Australia: 'aus',
  Ecuador: 'ecu',
  Egypt: 'egy',
  Sweden: 'swe',
  Austria: 'aut',
  Scotland: 'sco',
  'Ivory Coast': 'civ',
  "Cote D'Ivoire": 'civ',
  "Cote d'Ivoire": 'civ',
  Paraguay: 'par',
  Ghana: 'gha',
  Algeria: 'alg',
  Iran: 'irn',
  'Cape Verde': 'cpv',
  'Cape Verde Islands': 'cpv',
  'Congo DR': 'cod',
  'DR Congo': 'cod',
  'Czech Republic': 'cze',
  Czechia: 'cze',
  'Bosnia and Herzegovina': 'bih',
  'Bosnia-Herzegovina': 'bih',
  'Bosnia & Herzegovina': 'bih',
  Iraq: 'irq',
  'Saudi Arabia': 'ksa',
  'South Africa': 'rsa',
  Qatar: 'qat',
  Uzbekistan: 'uzb',
  Panama: 'pan',
  Curacao: 'cuw',
  Curaçao: 'cuw',
  'New Zealand': 'nzl',
  Jordan: 'jor',
  Haiti: 'hti',
  Tunisia: 'tun',
  Turkey: 'tur',
  Turkiye: 'tur',
}

function normalizeName(name) {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

const NORMALIZED_NAME_LOOKUP = Object.fromEntries(
  Object.entries(NAME_TO_TEAM_ID).map(([name, id]) => [normalizeName(name), id]),
)

export function resolveOddsTeamName(name) {
  if (NAME_TO_TEAM_ID[name]) return NAME_TO_TEAM_ID[name]
  return NORMALIZED_NAME_LOOKUP[normalizeName(name)] ?? null
}
