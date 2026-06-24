import type { OddsEvent } from './types'

const SPORT = 'soccer_fifa_world_cup_winner'

export class TheOddsApiError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'TheOddsApiError'
  }
}

export async function fetchWorldCupWinnerOdds(): Promise<{
  events: OddsEvent[]
  remaining?: number
}> {
  const params = new URLSearchParams({
    regions: 'us,eu',
    markets: 'outrights',
    oddsFormat: 'decimal',
  })

  let res: Response
  try {
    res = await fetch(`/api/the-odds/v4/sports/${SPORT}/odds?${params}`)
  } catch {
    throw new TheOddsApiError('Sem conexão com The Odds API — use npm run dev')
  }

  const remaining = res.headers.get('x-requests-remaining')
  const remainingNum = remaining ? Number(remaining) : undefined

  if (res.status === 429) {
    throw new TheOddsApiError('Limite de requisições The Odds API atingido')
  }

  if (!res.ok) {
    const body = await res.text()
    throw new TheOddsApiError(`The Odds API HTTP ${res.status}: ${body.slice(0, 120)}`)
  }

  const data = (await res.json()) as OddsEvent[] | { message?: string }
  if (!Array.isArray(data)) {
    throw new TheOddsApiError((data as { message?: string }).message ?? 'Resposta inválida')
  }

  return { events: data, remaining: remainingNum }
}
