export type OddsSlotId = 'morning' | 'afternoon' | 'evening' | 'night'

export interface OddsOutcome {
  name: string
  price: number
}

export interface OddsBookmaker {
  key: string
  title: string
  markets: { key: string; outcomes: OddsOutcome[] }[]
}

export interface OddsEvent {
  sport_key: string
  sport_title: string
  bookmakers: OddsBookmaker[]
}

export interface OddsTeamSnapshot {
  aggregate: number
  momentum24h: number
  bestDecimal: number
  bookmakerCount: number
}

export interface OddsCache {
  updatedAt: string
  slot: OddsSlotId
  remaining?: number
  byTeamId: Record<string, OddsTeamSnapshot>
}

export interface OddsScheduleState {
  lastFetchBySlot: Partial<Record<OddsSlotId, string>>
  cache: OddsCache | null
}

export interface OddsSyncResult {
  ok: boolean
  slot?: OddsSlotId
  message: string
  remaining?: number
  updatedAt?: string
}
