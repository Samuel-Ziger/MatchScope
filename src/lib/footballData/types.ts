export interface FdoTeam {
  id: number
  name: string
  shortName: string
  tla: string
}

export interface FdoMatch {
  id: number
  utcDate: string
  status: string
  homeTeam: FdoTeam
  awayTeam: FdoTeam
  score: {
    fullTime: { home: number | null; away: number | null }
  }
  minute?: number | null
  lastUpdated?: string
  goals?: {
    minute: number | null
    extraTime: number | null
    type: string
    team: { id: number; name: string }
    scorer: { id: number; name: string } | null
    assist: { id: number; name: string } | null
  }[]
}

export interface FdoMatchesResponse {
  matches?: FdoMatch[]
  message?: string
  api?: { code?: number; error?: string; results?: number }
}

export const FDO_FINISHED = new Set(['FINISHED', 'AWARDED'])
export const FDO_LIVE = new Set(['IN_PLAY', 'PAUSED', 'LIVE'])
