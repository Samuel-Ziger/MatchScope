import type { TournamentMatch } from '../../data/matches'

export function matchPairKey(homeId: string, awayId: string, date: string): string {
  return `${date}|${homeId}|${awayId}`
}

export function shiftDate(iso: string, days: number): string {
  const d = new Date(`${iso}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

export function buildPairIndex(matches: TournamentMatch[]): Map<string, TournamentMatch> {
  const map = new Map<string, TournamentMatch>()
  for (const m of matches) {
    if (m.stage !== 'group') continue
    map.set(matchPairKey(m.homeId, m.awayId, m.date), m)
  }
  return map
}

export function findLocalMatchByTeams(
  homeId: string | null,
  awayId: string | null,
  apiDate: string,
  byPair: Map<string, TournamentMatch>,
): TournamentMatch | undefined {
  if (!homeId || !awayId) return undefined
  for (const offset of [0, -1, 1]) {
    const hit = byPair.get(matchPairKey(homeId, awayId, shiftDate(apiDate, offset)))
    if (hit) return hit
  }
  return undefined
}

export function applyScoreToMatches(
  matches: TournamentMatch[],
  updates: Map<string, { homeScore: number; awayScore: number }>,
): { next: TournamentMatch[]; updated: number } {
  let updated = 0
  const next = matches.map((m) => {
    const u = updates.get(m.id)
    if (!u) return m
    const changed = m.homeScore !== u.homeScore || m.awayScore !== u.awayScore
    if (changed) updated++
    return { ...m, homeScore: u.homeScore, awayScore: u.awayScore }
  })
  return { next, updated }
}
