import { fetchWorldCupWinnerOdds } from './client'
import { applyMomentum, parseWinnerOdds } from './parse'
import { getDueOddsSlot, localDateKey } from './schedule'
import { loadOddsScheduleState, markSlotFetched, saveOddsCache } from './storage'
import type { OddsSlotId, OddsSyncResult } from './types'

export async function syncOddsIfDue(now = new Date()): Promise<OddsSyncResult> {
  const state = loadOddsScheduleState()
  const slot = getDueOddsSlot(now, state.lastFetchBySlot)

  if (!slot) {
    return { ok: true, message: 'Odds em dia — próxima atualização no horário agendado' }
  }

  try {
    const { events, remaining } = await fetchWorldCupWinnerOdds()
    if (events.length === 0) {
      return { ok: false, message: 'The Odds API não retornou mercados de vencedor', remaining }
    }

    const parsed = parseWinnerOdds(events)
    const withMomentum = applyMomentum(parsed, state.cache?.byTeamId)

    const cache = {
      updatedAt: now.toISOString(),
      slot,
      remaining,
      byTeamId: withMomentum,
    }

    saveOddsCache(cache)
    markSlotFetched(slot, now)

    const count = Object.keys(withMomentum).length
    return {
      ok: true,
      slot,
      message: `Odds atualizadas (${slot}, ${localDateKey(now)}) — ${count} seleções`,
      remaining,
      updatedAt: cache.updatedAt,
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro The Odds API'
    return { ok: false, message }
  }
}

export function getOddsSlotLabel(slot: OddsSlotId): string {
  const labels: Record<OddsSlotId, string> = {
    morning: 'manhã',
    afternoon: 'tarde',
    evening: 'noite',
    night: 'madrugada',
  }
  return labels[slot]
}
