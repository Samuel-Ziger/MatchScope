import type { TournamentMatch } from '../../data/matches'
import { syncMatchesFromApi, shouldAutoSync, markSynced } from '../apiFootball/sync'
import type { SyncResult } from '../apiFootball/types'
import { syncFromFootballData } from '../footballData/sync'

export { shouldAutoSync, markSynced }
export type { SyncResult }

export async function syncAllMatches(
  matches: TournamentMatch[],
): Promise<{ matches: TournamentMatch[]; result: SyncResult }> {
  let next = matches.map((m) => ({ ...m }))
  let totalUpdated = 0
  let totalLive = 0
  let requestsUsed = 0
  let remaining: number | undefined
  const notes: string[] = []

  const fdo = await syncFromFootballData(next)
  requestsUsed += fdo.requestsUsed
  if (fdo.ok) {
    next = fdo.matches
    totalUpdated += fdo.updated
    totalLive += fdo.live
    if (fdo.updated > 0) notes.push(`${fdo.updated} via football-data.org`)
  } else if (fdo.error) {
    notes.push(`football-data.org: ${fdo.error}`)
  }

  const af = await syncMatchesFromApi(next)
  requestsUsed += af.result.requestsUsed
  remaining = af.result.remaining
  next = af.matches
  totalUpdated += af.result.updated
  totalLive = Math.max(totalLive, af.result.live)
  if (af.result.updated > 0) notes.push(`${af.result.updated} via API-Football`)

  const ok = fdo.ok || af.result.ok
  let message: string
  if (!ok) {
    message = notes.join(' · ') || 'Falha ao sincronizar com as APIs'
  } else if (totalUpdated > 0) {
    message = `${totalUpdated} jogo(s) atualizado(s) (${notes.join(', ')})`
  } else if (totalLive > 0) {
    message = `${totalLive} jogo(s) ao vivo · dados em dia`
  } else {
    message = 'Dados já estão atualizados'
  }

  markSynced()

  return {
    matches: next,
    result: {
      ok,
      updated: totalUpdated,
      live: totalLive,
      requestsUsed,
      message,
      syncedAt: new Date().toISOString(),
      remaining,
    },
  }
}
