import type { FdoMatchesResponse } from './types'

const BASE = '/api/football-data'
const WC_SEASON = 2026

export class FootballDataError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'FootballDataError'
  }
}

export async function fetchWorldCupMatches(): Promise<{ matches: FdoMatchesResponse['matches']; requestsUsed: number }> {
  let res: Response
  try {
    res = await fetch(`${BASE}/competitions/WC/matches?season=${WC_SEASON}`)
  } catch {
    throw new FootballDataError('Sem conexão com football-data.org — use npm run dev')
  }

  if (res.status === 429) {
    throw new FootballDataError('Limite de requisições do football-data.org (10/min no plano free)')
  }

  if (!res.ok) {
    throw new FootballDataError(`football-data.org HTTP ${res.status}`)
  }

  const data = (await res.json()) as FdoMatchesResponse
  if (data.api?.error) {
    throw new FootballDataError(data.api.error)
  }
  if (data.message) {
    throw new FootballDataError(data.message)
  }

  return { matches: data.matches ?? [], requestsUsed: 1 }
}
