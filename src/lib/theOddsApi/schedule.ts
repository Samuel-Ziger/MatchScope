import type { OddsSlotId } from './types'

export interface OddsSlotConfig {
  id: OddsSlotId
  hour: number
  label: string
}

/** Horários locais do navegador (manhã, tarde, noite, madrugada) */
export const ODDS_SLOTS: OddsSlotConfig[] = [
  { id: 'morning', hour: 8, label: 'Manhã (08:00)' },
  { id: 'afternoon', hour: 14, label: 'Tarde (14:00)' },
  { id: 'evening', hour: 20, label: 'Noite (20:00)' },
  { id: 'night', hour: 2, label: 'Madrugada (02:00)' },
]

export function localDateKey(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function isSlotReached(now: Date, slot: OddsSlotConfig): boolean {
  return now.getHours() >= slot.hour
}

/** Retorna o slot mais recente que já passou hoje e ainda não foi buscado */
export function getDueOddsSlot(
  now: Date,
  lastFetchBySlot: Partial<Record<OddsSlotId, string>>,
): OddsSlotId | null {
  const today = localDateKey(now)
  let due: OddsSlotId | null = null

  for (const slot of ODDS_SLOTS) {
    if (!isSlotReached(now, slot)) continue
    if (lastFetchBySlot[slot.id] === today) continue
    due = slot.id
  }

  return due
}

export function nextOddsSlotLabel(now: Date): string {
  const hour = now.getHours()
  for (const slot of ODDS_SLOTS) {
    if (hour < slot.hour) return slot.label
  }
  return ODDS_SLOTS[0].label
}
