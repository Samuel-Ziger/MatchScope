import { resolveOddsTeamName } from './team-names.mjs'

function decimalToImpliedPct(decimal) {
  if (decimal <= 1) return 0
  return Math.round((100 / decimal) * 100) / 100
}

export function parseWinnerOdds(events) {
  const pricesByTeam = new Map()

  for (const event of events) {
    for (const book of event.bookmakers ?? []) {
      const market = book.markets?.find((m) => m.key === 'outrights') ?? book.markets?.[0]
      if (!market) continue
      for (const outcome of market.outcomes ?? []) {
        const teamId = resolveOddsTeamName(outcome.name)
        if (!teamId || outcome.price <= 1) continue
        const list = pricesByTeam.get(teamId) ?? []
        list.push(outcome.price)
        pricesByTeam.set(teamId, list)
      }
    }
  }

  const result = {}
  for (const [teamId, prices] of pricesByTeam) {
    const implied = prices.map(decimalToImpliedPct)
    const aggregate = Math.round((implied.reduce((s, v) => s + v, 0) / implied.length) * 100) / 100
    result[teamId] = {
      aggregate,
      momentum24h: 0,
      bestDecimal: Math.min(...prices),
      bookmakerCount: prices.length,
    }
  }

  return result
}

export function applyMomentum(next, previous) {
  if (!previous) return next
  const out = { ...next }
  for (const [id, snap] of Object.entries(out)) {
    const prev = previous[id]
    if (prev) {
      out[id] = {
        ...snap,
        momentum24h: Math.round((snap.aggregate - prev.aggregate) * 100) / 100,
      }
    }
  }
  return out
}
