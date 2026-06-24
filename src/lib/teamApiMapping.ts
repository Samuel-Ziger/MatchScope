import { TEAMS } from '../data/teams'

const VALID_TEAM_IDS = new Set(TEAMS.map((t) => t.id))

/** TLA FIFA (3 letras) → id interno quando não bate com lowercase */
const TLA_TO_TEAM_ID: Record<string, string> = {
  CIV: 'civ',
  COD: 'cod',
  HAI: 'hti',
  CPV: 'cpv',
  BIH: 'bih',
  CUW: 'cuw',
  KOR: 'kor',
  USA: 'usa',
  NED: 'ned',
  SUI: 'sui',
  RSA: 'rsa',
  GER: 'ger',
  ENG: 'eng',
  POR: 'por',
  FRA: 'fra',
  ARG: 'arg',
  ESP: 'esp',
  BRA: 'bra',
  MEX: 'mex',
  COL: 'col',
  CRO: 'cro',
  GHA: 'gha',
  PAN: 'pan',
  UZB: 'uzb',
  NOR: 'nor',
  SEN: 'sen',
  JOR: 'jor',
  ALG: 'alg',
  IRQ: 'irq',
  AUT: 'aut',
  URU: 'uru',
  IRN: 'irn',
  NZL: 'nzl',
  BEL: 'bel',
  EGY: 'egy',
  KSA: 'ksa',
  SWE: 'swe',
  TUN: 'tun',
  JPN: 'jpn',
  MAR: 'mar',
  SCO: 'sco',
  HTI: 'hti',
  AUS: 'aus',
  TUR: 'tur',
  ECU: 'ecu',
  CAN: 'can',
  QAT: 'qat',
  CZE: 'cze',
  PAR: 'par',
}

const NAME_TO_TEAM_ID: Record<string, string> = {
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

const API_FOOTBALL_ID_TO_TEAM_ID: Record<number, string> = {
  27: 'por',
  10: 'eng',
  1504: 'gha',
  1568: 'uzb',
  11: 'pan',
  3: 'cro',
  1090: 'nor',
  13: 'sen',
  1548: 'jor',
  1532: 'alg',
}

function normalizeName(name: string): string {
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

export function resolveTeamFromName(name: string): string | null {
  if (NAME_TO_TEAM_ID[name]) return NAME_TO_TEAM_ID[name]
  return NORMALIZED_NAME_LOOKUP[normalizeName(name)] ?? null
}

export function resolveTeamFromTlaAndName(tla: string | undefined, name: string): string | null {
  if (tla) {
    if (TLA_TO_TEAM_ID[tla]) return TLA_TO_TEAM_ID[tla]
    const lower = tla.toLowerCase()
    if (VALID_TEAM_IDS.has(lower)) return lower
  }
  return resolveTeamFromName(name)
}

export function resolveApiFootballTeamId(team: { id: number; name: string }): string | null {
  if (API_FOOTBALL_ID_TO_TEAM_ID[team.id]) return API_FOOTBALL_ID_TO_TEAM_ID[team.id]
  return resolveTeamFromName(team.name)
}
