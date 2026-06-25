export const WC_LEAGUE_ID = 1
export const WC_SEASON = 2026

export const FINISHED_STATUSES = new Set(['FT', 'AET', 'PEN'])
export const LIVE_STATUSES = new Set(['1H', 'HT', '2H', 'ET', 'BT', 'P', 'LIVE', 'INT', 'SUSP'])

export interface ApiTeam {
  id: number
  name: string
  code: string | null
}

export interface ApiFixtureItem {
  fixture: {
    id: number
    date: string
    status: { short: string; long: string; elapsed?: number | null; extra?: number | null }
  }
  league: { id: number; name: string; season: number; round?: string }
  teams: { home: ApiTeam; away: ApiTeam }
  goals: { home: number | null; away: number | null }
}

export interface ApiEvent {
  time: { elapsed: number | null; extra: number | null }
  team: { id: number; name: string }
  player: { id: number | null; name: string | null }
  assist: { id: number | null; name: string | null }
  type: string
  detail: string
}

export interface ApiResponse<T> {
  get: string
  errors: Record<string, string> | string[]
  results: number
  response: T
}

export interface SyncResult {
  ok: boolean
  updated: number
  live: number
  requestsUsed: number
  message: string
  syncedAt: string
  remaining?: number
}

export interface CachedMatchEvents {
  matchId: string
  fixtureId: number
  homeScorers: string[]
  awayScorers: string[]
  updatedAt: string
}
