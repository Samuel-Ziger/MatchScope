import type { OddsCache, OddsScheduleState, OddsSlotId } from './types'
import { localDateKey } from './schedule'

const STORAGE_KEY = 'matchscope-odds-schedule'

export function loadOddsScheduleState(): OddsScheduleState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { lastFetchBySlot: {}, cache: null }
    return JSON.parse(raw) as OddsScheduleState
  } catch {
    return { lastFetchBySlot: {}, cache: null }
  }
}

export function saveOddsScheduleState(state: OddsScheduleState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export function markSlotFetched(slot: OddsSlotId, date = new Date()): Partial<Record<OddsSlotId, string>> {
  const state = loadOddsScheduleState()
  const lastFetchBySlot = { ...state.lastFetchBySlot, [slot]: localDateKey(date) }
  saveOddsScheduleState({ ...state, lastFetchBySlot })
  return lastFetchBySlot
}

export function saveOddsCache(cache: OddsCache): void {
  const state = loadOddsScheduleState()
  saveOddsScheduleState({ ...state, cache })
}
