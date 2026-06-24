import type { TournamentMatch } from '../../data/matches'

export const MATCHES_SYNC_URL = '/data/matches-sync.json'
/** Frontend verifica a cada 2 min (cron na VPS roda a cada 10 min) */
export const MATCHES_POLL_MS = 2 * 60_000

export interface MatchesSyncPayload {
  updatedAt: string
  source: string
  sourceUrl?: string
  year?: string
  gitCommit?: string | null
  fetchMode?: string
  results: Record<string, [number, number]>
  stats?: {
    withScore: number
    matched: number
    parsedGroup: number
  }
}

export async function fetchMatchesSync(): Promise<MatchesSyncPayload | null> {
  try {
    const res = await fetch(`${MATCHES_SYNC_URL}?_=${Date.now()}`, { cache: 'no-store' })
    if (!res.ok) return null
    const data = (await res.json()) as MatchesSyncPayload
    if (!data?.results) return null
    return data
  } catch {
    return null
  }
}

export function applyMatchesSync(
  base: TournamentMatch[],
  sync: MatchesSyncPayload | null,
): TournamentMatch[] {
  if (!sync?.results) return base
  return base.map((m) => {
    const r = sync.results[m.id]
    if (!r) return m
    return { ...m, homeScore: r[0], awayScore: r[1] }
  })
}
