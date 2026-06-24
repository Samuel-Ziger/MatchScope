import type { TournamentMatch } from '../../data/matches'
import { resolveTeamFromTlaAndName } from '../teamApiMapping'
import { buildPairIndex, findLocalMatchByTeams } from '../matchSync/helpers'
import { fetchWorldCupMatches } from './client'
import { FDO_FINISHED, FDO_LIVE } from './types'

export async function syncFromFootballData(
  matches: TournamentMatch[],
): Promise<{ matches: TournamentMatch[]; updated: number; live: number; requestsUsed: number; ok: boolean; error?: string }> {
  const byPair = buildPairIndex(matches)

  try {
    const { matches: apiMatches, requestsUsed } = await fetchWorldCupMatches()
    const next = matches.map((m) => ({ ...m }))
    const nextById = Object.fromEntries(next.map((m) => [m.id, m]))
    let updated = 0
    let live = 0

    for (const m of apiMatches ?? []) {
      if (!FDO_FINISHED.has(m.status) && !FDO_LIVE.has(m.status)) continue

      const homeId = resolveTeamFromTlaAndName(m.homeTeam.tla, m.homeTeam.name)
      const awayId = resolveTeamFromTlaAndName(m.awayTeam.tla, m.awayTeam.name)
      const local = findLocalMatchByTeams(homeId, awayId, m.utcDate.slice(0, 10), byPair)
      if (!local) continue

      const hs = m.score.fullTime.home
      const as = m.score.fullTime.away
      if (hs === null || as === null) continue

      if (FDO_LIVE.has(m.status)) live++

      const target = nextById[local.id]
      if (!target) continue

      if (target.homeScore !== hs || target.awayScore !== as) updated++
      target.homeScore = hs
      target.awayScore = as
    }

    return { matches: next, updated, live, requestsUsed, ok: true }
  } catch (err) {
    const error = err instanceof Error ? err.message : 'Erro football-data.org'
    return { matches, updated: 0, live: 0, requestsUsed: 0, ok: false, error }
  }
}
