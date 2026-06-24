import type { OddsCache } from './types'

export const ODDS_DATA_URL = '/data/odds.json'
const POLL_MS = 5 * 60_000

export async function fetchOddsCache(): Promise<OddsCache | null> {
  try {
    const res = await fetch(`${ODDS_DATA_URL}?_=${Date.now()}`, { cache: 'no-store' })
    if (!res.ok) return null
    const data = (await res.json()) as OddsCache
    if (!data?.byTeamId || Object.keys(data.byTeamId).length === 0) return null
    return data
  } catch {
    return null
  }
}

export { POLL_MS as ODDS_POLL_MS }
