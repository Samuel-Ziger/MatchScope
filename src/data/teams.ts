import { DATA_SOURCES } from './sources'

export type Confederation = 'UEFA' | 'CONMEBOL' | 'CONCACAF' | 'CAF' | 'AFC' | 'OFC'

export interface TeamMarket {
  aggregate: number
  kalshi: number
  polymarket: number
  momentum24h: number
}

export interface TeamTournament {
  winGroupKalshi: number
  winGroupPolymarket: number
  reachR32: number
  reachR16: number
}

export interface Team {
  id: string
  name: string
  iso: string
  confederation: Confederation
  group: string
  fifaRank: number
  elo: number
  titles: number
  market: TeamMarket
  tournament: TeamTournament
}

/** Dados compilados de Kalshi, Polymarket (via DeFi Rate) e eloratings.net — 23/06/2026 */
export const TEAMS: Team[] = [
  { id: 'fra', name: 'França', iso: 'fr', confederation: 'UEFA', group: 'I', fifaRank: 2, elo: 2090, titles: 2, market: { aggregate: 19.9, kalshi: 20.25, polymarket: 19.55, momentum24h: 0.0 }, tournament: { winGroupKalshi: 80.5, winGroupPolymarket: 79.5, reachR32: 100, reachR16: 85.5 } },
  { id: 'arg', name: 'Argentina', iso: 'ar', confederation: 'CONMEBOL', group: 'J', fifaRank: 1, elo: 2144, titles: 3, market: { aggregate: 14.8, kalshi: 14.7, polymarket: 14.95, momentum24h: 1.4 }, tournament: { winGroupKalshi: 99.5, winGroupPolymarket: 100, reachR32: 100, reachR16: 84.5 } },
  { id: 'esp', name: 'Espanha', iso: 'es', confederation: 'UEFA', group: 'H', fifaRank: 3, elo: 2134, titles: 1, market: { aggregate: 13.7, kalshi: 13.45, polymarket: 13.85, momentum24h: -0.1 }, tournament: { winGroupKalshi: 86.5, winGroupPolymarket: 86.5, reachR32: 99.75, reachR16: 80.5 } },
  { id: 'eng', name: 'Inglaterra', iso: 'gb-eng', confederation: 'UEFA', group: 'L', fifaRank: 4, elo: 2055, titles: 1, market: { aggregate: 12.0, kalshi: 11.55, polymarket: 12.35, momentum24h: -0.2 }, tournament: { winGroupKalshi: 92.5, winGroupPolymarket: 94, reachR32: 99.8, reachR16: 84.5 } },
  { id: 'por', name: 'Portugal', iso: 'pt', confederation: 'UEFA', group: 'K', fifaRank: 8, elo: 1967, titles: 0, market: { aggregate: 7.5, kalshi: 7.45, polymarket: 7.45, momentum24h: 0.5 }, tournament: { winGroupKalshi: 43.5, winGroupPolymarket: 45.5, reachR32: 95, reachR16: 70.5 } },
  { id: 'ned', name: 'Holanda', iso: 'nl', confederation: 'UEFA', group: 'F', fifaRank: 7, elo: 1972, titles: 0, market: { aggregate: 6.0, kalshi: 6.85, polymarket: 5.05, momentum24h: -0.5 }, tournament: { winGroupKalshi: 77.5, winGroupPolymarket: 76.5, reachR32: 99.7, reachR16: 62.5 } },
  { id: 'ger', name: 'Alemanha', iso: 'de', confederation: 'UEFA', group: 'E', fifaRank: 9, elo: 1954, titles: 4, market: { aggregate: 5.6, kalshi: 5.55, polymarket: 5.65, momentum24h: -0.4 }, tournament: { winGroupKalshi: 99, winGroupPolymarket: 100, reachR32: 100, reachR16: 81 } },
  { id: 'bra', name: 'Brasil', iso: 'br', confederation: 'CONMEBOL', group: 'C', fifaRank: 6, elo: 1986, titles: 5, market: { aggregate: 4.7, kalshi: 4.95, polymarket: 4.45, momentum24h: -0.9 }, tournament: { winGroupKalshi: 65.5, winGroupPolymarket: 65.5, reachR32: 99.75, reachR16: 64.5 } },
  { id: 'usa', name: 'Estados Unidos', iso: 'us', confederation: 'CONCACAF', group: 'D', fifaRank: 13, elo: 1840, titles: 0, market: { aggregate: 4.1, kalshi: 4.65, polymarket: 3.45, momentum24h: -0.3 }, tournament: { winGroupKalshi: 99, winGroupPolymarket: 100, reachR32: 100, reachR16: 74.5 } },
  { id: 'nor', name: 'Noruega', iso: 'no', confederation: 'UEFA', group: 'I', fifaRank: 10, elo: 1951, titles: 0, market: { aggregate: 2.9, kalshi: 2.85, polymarket: 3.05, momentum24h: 0.2 }, tournament: { winGroupKalshi: 21.5, winGroupPolymarket: 20.5, reachR32: 100, reachR16: 66 } },
  { id: 'mar', name: 'Marrocos', iso: 'ma', confederation: 'CAF', group: 'C', fifaRank: 18, elo: 1866, titles: 0, market: { aggregate: 1.8, kalshi: 2.0, polymarket: 1.65, momentum24h: 0.1 }, tournament: { winGroupKalshi: 32.5, winGroupPolymarket: 33.5, reachR32: 99.85, reachR16: 50.5 } },
  { id: 'jpn', name: 'Japão', iso: 'jp', confederation: 'AFC', group: 'F', fifaRank: 11, elo: 1925, titles: 0, market: { aggregate: 1.95, kalshi: 1.95, polymarket: 1.95, momentum24h: 0.0 }, tournament: { winGroupKalshi: 19.5, winGroupPolymarket: 20.5, reachR32: 99.45, reachR16: 45.5 } },
  { id: 'mex', name: 'México', iso: 'mx', confederation: 'CONCACAF', group: 'A', fifaRank: 12, elo: 1896, titles: 0, market: { aggregate: 1.6, kalshi: 1.9, polymarket: 1.25, momentum24h: 0.0 }, tournament: { winGroupKalshi: 99, winGroupPolymarket: 100, reachR32: 100, reachR16: 67 } },
  { id: 'col', name: 'Colômbia', iso: 'co', confederation: 'CONMEBOL', group: 'K', fifaRank: 5, elo: 1998, titles: 0, market: { aggregate: 1.6, kalshi: 1.65, polymarket: 1.55, momentum24h: 0.0 }, tournament: { winGroupKalshi: 51.5, winGroupPolymarket: 49.5, reachR32: 98.15, reachR16: 58.5 } },
  { id: 'bel', name: 'Bélgica', iso: 'be', confederation: 'UEFA', group: 'G', fifaRank: 15, elo: 1869, titles: 0, market: { aggregate: 1.15, kalshi: 1.15, polymarket: 1.15, momentum24h: 0.0 }, tournament: { winGroupKalshi: 23.5, winGroupPolymarket: 25.5, reachR32: 91.55, reachR16: 56.5 } },
  { id: 'sui', name: 'Suíça', iso: 'ch', confederation: 'UEFA', group: 'B', fifaRank: 13, elo: 1885, titles: 0, market: { aggregate: 0.6, kalshi: 0.55, polymarket: 0.65, momentum24h: 0.0 }, tournament: { winGroupKalshi: 40.5, winGroupPolymarket: 39.5, reachR32: 99.8, reachR16: 65.5 } },
  { id: 'cro', name: 'Croácia', iso: 'hr', confederation: 'UEFA', group: 'L', fifaRank: 14, elo: 1881, titles: 0, market: { aggregate: 0.5, kalshi: 0.45, polymarket: 0.55, momentum24h: 0.0 }, tournament: { winGroupKalshi: 2.5, winGroupPolymarket: 1.35, reachR32: 77.5, reachR16: 37 } },
  { id: 'can', name: 'Canadá', iso: 'ca', confederation: 'CONCACAF', group: 'B', fifaRank: 25, elo: 1780, titles: 0, market: { aggregate: 0.35, kalshi: 0.35, polymarket: 0.35, momentum24h: 0.0 }, tournament: { winGroupKalshi: 59.5, winGroupPolymarket: 60.5, reachR32: 99.9, reachR16: 55 } },
  { id: 'kor', name: 'Coreia do Sul', iso: 'kr', confederation: 'AFC', group: 'A', fifaRank: 21, elo: 1800, titles: 0, market: { aggregate: 0.25, kalshi: 0.25, polymarket: 0.25, momentum24h: 0.0 }, tournament: { winGroupKalshi: 1, winGroupPolymarket: 0, reachR32: 94.5, reachR16: 42.5 } },
  { id: 'uru', name: 'Uruguai', iso: 'uy', confederation: 'CONMEBOL', group: 'H', fifaRank: 20, elo: 1851, titles: 2, market: { aggregate: 0.2, kalshi: 0.25, polymarket: 0.15, momentum24h: 0.0 }, tournament: { winGroupKalshi: 9.5, winGroupPolymarket: 9.5, reachR32: 36.5, reachR16: 16.5 } },
  { id: 'sen', name: 'Senegal', iso: 'sn', confederation: 'CAF', group: 'I', fifaRank: 16, elo: 1835, titles: 0, market: { aggregate: 0.25, kalshi: 0.25, polymarket: 0.25, momentum24h: 0.0 }, tournament: { winGroupKalshi: 0.5, winGroupPolymarket: 0, reachR32: 67.5, reachR16: 27.5 } },
  { id: 'aus', name: 'Austrália', iso: 'au', confederation: 'AFC', group: 'D', fifaRank: 22, elo: 1790, titles: 0, market: { aggregate: 0.2, kalshi: 0.15, polymarket: 0.25, momentum24h: 0.0 }, tournament: { winGroupKalshi: 1, winGroupPolymarket: 0.05, reachR32: 92, reachR16: 30 } },
  { id: 'ecu', name: 'Equador', iso: 'ec', confederation: 'CONMEBOL', group: 'E', fifaRank: 19, elo: 1864, titles: 0, market: { aggregate: 0.15, kalshi: 0.15, polymarket: 0.15, momentum24h: 0.0 }, tournament: { winGroupKalshi: 1, winGroupPolymarket: 0, reachR32: 26.5, reachR16: 9.5 } },
  { id: 'egy', name: 'Egito', iso: 'eg', confederation: 'CAF', group: 'G', fifaRank: 23, elo: 1785, titles: 0, market: { aggregate: 0.25, kalshi: 0.25, polymarket: 0.25, momentum24h: 0.0 }, tournament: { winGroupKalshi: 63.5, winGroupPolymarket: 63.5, reachR32: 99.65, reachR16: 41 } },
  { id: 'swe', name: 'Suécia', iso: 'se', confederation: 'UEFA', group: 'F', fifaRank: 26, elo: 1770, titles: 0, market: { aggregate: 0.25, kalshi: 0.25, polymarket: 0.25, momentum24h: 0.0 }, tournament: { winGroupKalshi: 2.5, winGroupPolymarket: 2.7, reachR32: 91.65, reachR16: 22.5 } },
  { id: 'aut', name: 'Áustria', iso: 'at', confederation: 'UEFA', group: 'J', fifaRank: 17, elo: 1840, titles: 0, market: { aggregate: 0.2, kalshi: 0.15, polymarket: 0.25, momentum24h: 0.0 }, tournament: { winGroupKalshi: 0.5, winGroupPolymarket: 0, reachR32: 95.1, reachR16: 27.5 } },
  { id: 'sco', name: 'Escócia', iso: 'gb-sct', confederation: 'UEFA', group: 'C', fifaRank: 28, elo: 1760, titles: 0, market: { aggregate: 0.15, kalshi: 0.15, polymarket: 0.15, momentum24h: 0.0 }, tournament: { winGroupKalshi: 1.5, winGroupPolymarket: 2.15, reachR32: 76.5, reachR16: 18.5 } },
  { id: 'civ', name: 'Costa do Marfim', iso: 'ci', confederation: 'CAF', group: 'E', fifaRank: 29, elo: 1750, titles: 0, market: { aggregate: 0.35, kalshi: 0.35, polymarket: 0.35, momentum24h: 0.0 }, tournament: { winGroupKalshi: 1, winGroupPolymarket: 0, reachR32: 98.7, reachR16: 28.5 } },
  { id: 'par', name: 'Paraguai', iso: 'py', confederation: 'CONMEBOL', group: 'D', fifaRank: 30, elo: 1740, titles: 0, market: { aggregate: 0.1, kalshi: 0.05, polymarket: 0.15, momentum24h: 0.0 }, tournament: { winGroupKalshi: 1, winGroupPolymarket: 0, reachR32: 86, reachR16: 24.5 } },
  { id: 'gha', name: 'Gana', iso: 'gh', confederation: 'CAF', group: 'L', fifaRank: 31, elo: 1730, titles: 0, market: { aggregate: 0.05, kalshi: 0.05, polymarket: 0.05, momentum24h: 0.0 }, tournament: { winGroupKalshi: 5.5, winGroupPolymarket: 4.15, reachR32: 76, reachR16: 18.5 } },
  { id: 'alg', name: 'Argélia', iso: 'dz', confederation: 'CAF', group: 'J', fifaRank: 32, elo: 1720, titles: 0, market: { aggregate: 0.05, kalshi: 0.05, polymarket: 0.05, momentum24h: 0.0 }, tournament: { winGroupKalshi: 0.5, winGroupPolymarket: 0, reachR32: 78.5, reachR16: 24.5 } },
  { id: 'irn', name: 'Irã', iso: 'ir', confederation: 'AFC', group: 'G', fifaRank: 33, elo: 1710, titles: 0, market: { aggregate: 0.05, kalshi: 0.05, polymarket: 0.05, momentum24h: 0.0 }, tournament: { winGroupKalshi: 11.5, winGroupPolymarket: 11.8, reachR32: 62.8, reachR16: 23.5 } },
  { id: 'cpv', name: 'Cabo Verde', iso: 'cv', confederation: 'CAF', group: 'H', fifaRank: 34, elo: 1700, titles: 0, market: { aggregate: 0.1, kalshi: 0.15, polymarket: 0.05, momentum24h: 0.0 }, tournament: { winGroupKalshi: 3.5, winGroupPolymarket: 3.25, reachR32: 71, reachR16: 11 } },
  { id: 'cod', name: 'RD Congo', iso: 'cd', confederation: 'CAF', group: 'K', fifaRank: 35, elo: 1690, titles: 0, market: { aggregate: 0.3, kalshi: 0.5, polymarket: 0.15, momentum24h: 0.0 }, tournament: { winGroupKalshi: 4.5, winGroupPolymarket: 4.05, reachR32: 62, reachR16: 9.5 } },
  { id: 'cze', name: 'Tchéquia', iso: 'cz', confederation: 'UEFA', group: 'A', fifaRank: 36, elo: 1680, titles: 0, market: { aggregate: 0.3, kalshi: 0.5, polymarket: 0.05, momentum24h: 0.0 }, tournament: { winGroupKalshi: 1, winGroupPolymarket: 0, reachR32: 24.5, reachR16: 10.5 } },
  { id: 'bih', name: 'Bósnia e Herzegovina', iso: 'ba', confederation: 'UEFA', group: 'B', fifaRank: 37, elo: 1670, titles: 0, market: { aggregate: 0.3, kalshi: 0.5, polymarket: 0.05, momentum24h: 0.0 }, tournament: { winGroupKalshi: 0.5, winGroupPolymarket: 0, reachR32: 69, reachR16: 17 } },
  { id: 'irq', name: 'Iraque', iso: 'iq', confederation: 'AFC', group: 'I', fifaRank: 38, elo: 1660, titles: 0, market: { aggregate: 0.3, kalshi: 0.5, polymarket: 0.05, momentum24h: 0.0 }, tournament: { winGroupKalshi: 0.5, winGroupPolymarket: 0, reachR32: 3.35, reachR16: 5 } },
  { id: 'ksa', name: 'Arábia Saudita', iso: 'sa', confederation: 'AFC', group: 'H', fifaRank: 39, elo: 1650, titles: 0, market: { aggregate: 0.05, kalshi: 0.05, polymarket: 0.05, momentum24h: 0.0 }, tournament: { winGroupKalshi: 0.5, winGroupPolymarket: 0, reachR32: 32, reachR16: 6 } },
  { id: 'rsa', name: 'África do Sul', iso: 'za', confederation: 'CAF', group: 'A', fifaRank: 40, elo: 1640, titles: 0, market: { aggregate: 0.05, kalshi: 0.05, polymarket: 0.05, momentum24h: 0.0 }, tournament: { winGroupKalshi: 1, winGroupPolymarket: 0, reachR32: 17.5, reachR16: 3.5 } },
  { id: 'qat', name: 'Catar', iso: 'qa', confederation: 'AFC', group: 'B', fifaRank: 41, elo: 1630, titles: 0, market: { aggregate: 0.05, kalshi: 0.05, polymarket: 0.05, momentum24h: 0.0 }, tournament: { winGroupKalshi: 0.5, winGroupPolymarket: 0, reachR32: 13, reachR16: 2.5 } },
  { id: 'uzb', name: 'Uzbequistão', iso: 'uz', confederation: 'AFC', group: 'K', fifaRank: 42, elo: 1620, titles: 0, market: { aggregate: 0.05, kalshi: 0.05, polymarket: 0.05, momentum24h: 0.0 }, tournament: { winGroupKalshi: 0.5, winGroupPolymarket: 0.15, reachR32: 17.5, reachR16: 4.5 } },
  { id: 'pan', name: 'Panamá', iso: 'pa', confederation: 'CONCACAF', group: 'L', fifaRank: 43, elo: 1610, titles: 0, market: { aggregate: 0.05, kalshi: 0.05, polymarket: 0.05, momentum24h: 0.0 }, tournament: { winGroupKalshi: 0.5, winGroupPolymarket: 0.35, reachR32: 10.5, reachR16: 4.5 } },
  { id: 'cuw', name: 'Curaçao', iso: 'cw', confederation: 'CONCACAF', group: 'E', fifaRank: 44, elo: 1600, titles: 0, market: { aggregate: 0.05, kalshi: 0.05, polymarket: 0.05, momentum24h: 0.0 }, tournament: { winGroupKalshi: 1, winGroupPolymarket: 0, reachR32: 6.45, reachR16: 1.5 } },
  { id: 'nzl', name: 'Nova Zelândia', iso: 'nz', confederation: 'OFC', group: 'G', fifaRank: 45, elo: 1590, titles: 0, market: { aggregate: 0.05, kalshi: 0.05, polymarket: 0.05, momentum24h: 0.0 }, tournament: { winGroupKalshi: 0.5, winGroupPolymarket: 0, reachR32: 7.5, reachR16: 4.5 } },
  { id: 'jor', name: 'Jordânia', iso: 'jo', confederation: 'AFC', group: 'J', fifaRank: 46, elo: 1580, titles: 0, market: { aggregate: 0.05, kalshi: 0.05, polymarket: 0.0, momentum24h: 0.0 }, tournament: { winGroupKalshi: 0.5, winGroupPolymarket: 0, reachR32: 0, reachR16: 0.5 } },
  { id: 'hti', name: 'Haiti', iso: 'ht', confederation: 'CONCACAF', group: 'C', fifaRank: 47, elo: 1570, titles: 0, market: { aggregate: 0.05, kalshi: 0.05, polymarket: 0.0, momentum24h: 0.0 }, tournament: { winGroupKalshi: 0.5, winGroupPolymarket: 0.05, reachR32: 0, reachR16: 0.5 } },
  { id: 'tun', name: 'Tunísia', iso: 'tn', confederation: 'CAF', group: 'F', fifaRank: 48, elo: 1560, titles: 0, market: { aggregate: 0.05, kalshi: 0.05, polymarket: 0.0, momentum24h: 0.0 }, tournament: { winGroupKalshi: 0.5, winGroupPolymarket: 0, reachR32: 0, reachR16: 0.5 } },
  { id: 'tur', name: 'Turquia', iso: 'tr', confederation: 'UEFA', group: 'D', fifaRank: 49, elo: 1550, titles: 0, market: { aggregate: 0.05, kalshi: 0.05, polymarket: 0.0, momentum24h: 0.0 }, tournament: { winGroupKalshi: 1, winGroupPolymarket: 0, reachR32: 0, reachR16: 0.5 } },
]

export const GROUPS: Record<string, string[]> = Object.fromEntries(
  'ABCDEFGHIJKL'.split('').map((g) => [
    g,
    TEAMS.filter((t) => t.group === g).map((t) => t.id),
  ]),
)

export const CONFEDERATION_LABELS: Record<Confederation, string> = {
  UEFA: 'UEFA',
  CONMEBOL: 'CONMEBOL',
  CONCACAF: 'CONCACAF',
  CAF: 'CAF',
  AFC: 'AFC',
  OFC: 'OFC',
}

export const CONFEDERATION_COLORS: Record<Confederation, string> = {
  UEFA: '#4f8ff7',
  CONMEBOL: '#34d399',
  CONCACAF: '#fbbf24',
  CAF: '#f87171',
  AFC: '#a78bfa',
  OFC: '#22d3ee',
}

export const DATA_LAST_UPDATED = DATA_SOURCES.lastUpdatedLabel

export function getTeamById(id: string): Team | undefined {
  return TEAMS.find((t) => t.id === id)
}

export function getContenders(minProb = 1): Team[] {
  return [...TEAMS]
    .filter((t) => t.market.aggregate >= minProb)
    .sort((a, b) => b.market.aggregate - a.market.aggregate)
}

export function flagUrl(iso: string, size = 40): string {
  const width = Math.max(16, size)
  const height = Math.round(width * 0.75)
  return `https://flagcdn.com/${width}x${height}/${iso}.png`
}
