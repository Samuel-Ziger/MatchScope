import { TEAMS } from '../../data/teams'
import { resolveTeamFromName } from '../teamApiMapping'
import type { OddsEvent, OddsTeamSnapshot } from './types'

const ALIASES: Record<string, string> = {
  USA: 'usa',
  'United States': 'usa',
  'South Korea': 'kor',
  'Czech Republic': 'cze',
  Czechia: 'cze',
  'Ivory Coast': 'civ',
  "Cote d'Ivoire": 'civ',
  'DR Congo': 'cod',
  'Congo DR': 'cod',
  Curacao: 'cuw',
  Curaçao: 'cuw',
  Turkiye: 'tur',
  'Bosnia and Herzegovina': 'bih',
  'Bosnia-Herzegovina': 'bih',
  'Cape Verde': 'cpv',
  'Cape Verde Islands': 'cpv',
  'New Zealand': 'nzl',
  'South Africa': 'rsa',
  'Saudi Arabia': 'ksa',
}

function resolveOddsTeamName(name: string): string | null {
  if (ALIASES[name]) return ALIASES[name]
  const fromMap = resolveTeamFromName(name)
  if (fromMap) return fromMap
  const lower = name.toLowerCase()
  const hit = TEAMS.find((t) => t.name.toLowerCase() === lower || t.id === lower.slice(0, 3))
  return hit?.id ?? null
}

function decimalToImpliedPct(decimal: number): number {
  if (decimal <= 1) return 0
  return Math.round((100 / decimal) * 100) / 100
}

export function parseWinnerOdds(events: OddsEvent[]): Record<string, OddsTeamSnapshot> {
  const pricesByTeam = new Map<string, number[]>()

  for (const event of events) {
    for (const book of event.bookmakers) {
      const market = book.markets.find((m) => m.key === 'outrights') ?? book.markets[0]
      if (!market) continue
      for (const outcome of market.outcomes) {
        const teamId = resolveOddsTeamName(outcome.name)
        if (!teamId || outcome.price <= 1) continue
        const list = pricesByTeam.get(teamId) ?? []
        list.push(outcome.price)
        pricesByTeam.set(teamId, list)
      }
    }
  }

  const result: Record<string, OddsTeamSnapshot> = {}
  for (const [teamId, prices] of pricesByTeam) {
    const implied = prices.map(decimalToImpliedPct)
    const aggregate = Math.round((implied.reduce((s, v) => s + v, 0) / implied.length) * 100) / 100
    const bestDecimal = Math.min(...prices)
    result[teamId] = {
      aggregate,
      momentum24h: 0,
      bestDecimal,
      bookmakerCount: prices.length,
    }
  }

  return result
}

export function applyMomentum(
  next: Record<string, OddsTeamSnapshot>,
  previous: Record<string, OddsTeamSnapshot> | undefined,
): Record<string, OddsTeamSnapshot> {
  if (!previous) return next
  const out = { ...next }
  for (const [id, snap] of Object.entries(out)) {
    const prev = previous[id]
    if (prev) {
      out[id] = {
        ...snap,
        momentum24h: Math.round((snap.aggregate - prev.aggregate) * 100) / 100,
      }
    }
  }
  return out
}
