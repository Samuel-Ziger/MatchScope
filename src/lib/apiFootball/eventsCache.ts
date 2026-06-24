import type { CachedMatchEvents } from './types'

const EVENTS_KEY = 'matchscope-api-events'

export function loadEventsCache(): Record<string, CachedMatchEvents> {
  try {
    const raw = localStorage.getItem(EVENTS_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

export function saveEventsCache(cache: Record<string, CachedMatchEvents>): void {
  localStorage.setItem(EVENTS_KEY, JSON.stringify(cache))
}

export function getCachedMatchEvents(matchId: string): CachedMatchEvents | undefined {
  return loadEventsCache()[matchId]
}

export function getAllCachedEvents(): Map<string, CachedMatchEvents> {
  return new Map(Object.entries(loadEventsCache()))
}
