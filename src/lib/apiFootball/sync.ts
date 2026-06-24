import type { TournamentMatch } from '../../data/matches'
import { fetchFixtureEvents, fetchFixturesByDate, fetchLiveFixtures } from './client'
import { saveEventsCache, loadEventsCache } from './eventsCache'
import { resolveApiFootballTeamId } from '../teamApiMapping'
import { buildPairIndex, findLocalMatchByTeams } from '../matchSync/helpers'
import type { ApiFixtureItem, CachedMatchEvents, SyncResult } from './types'
import { FINISHED_STATUSES, LIVE_STATUSES, WC_LEAGUE_ID } from './types'
const SYNC_CACHE_KEY = 'matchscope-api-sync-at'
const SYNC_TTL_MS = 15 * 60 * 1000
/** Plano free: só permite poucos dias recentes — evita dezenas de chamadas */
const MAX_DATE_LOOKBACK_DAYS = 3

function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

function syncDates(matches: TournamentMatch[]): string[] {
  const today = todayIso()
  const dates = new Set<string>([today])

  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  dates.add(yesterday.toISOString().slice(0, 10))

  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - MAX_DATE_LOOKBACK_DAYS)
  const cutoffIso = cutoff.toISOString().slice(0, 10)

  for (const m of matches) {
    if (m.stage !== 'group') continue
    if (m.date > today || m.date < cutoffIso) continue
    if (m.homeScore === null || m.awayScore === null) {
      dates.add(m.date)
    }
  }

  return [...dates].sort()
}

function isWorldCupFixture(f: ApiFixtureItem): boolean {
  return f.league.id === WC_LEAGUE_ID
}

function findLocalMatch(
  fixture: ApiFixtureItem,
  byPair: Map<string, TournamentMatch>,
): TournamentMatch | undefined {
  const homeId = resolveApiFootballTeamId(fixture.teams.home)
  const awayId = resolveApiFootballTeamId(fixture.teams.away)
  return findLocalMatchByTeams(homeId, awayId, fixture.fixture.date.slice(0, 10), byPair)
}
function extractScorers(
  events: NonNullable<Awaited<ReturnType<typeof fetchFixtureEvents>>>['events'],
  homeApiId: number,
  awayApiId: number,
): Pick<CachedMatchEvents, 'homeScorers' | 'awayScorers'> {
  const homeScorers: string[] = []
  const awayScorers: string[] = []

  for (const ev of events) {
    if (ev.type !== 'Goal') continue
    if (ev.detail === 'Missed Penalty') continue
    const name = ev.player?.name
    if (!name) continue
    if (ev.team.id === homeApiId) homeScorers.push(name)
    else if (ev.team.id === awayApiId) awayScorers.push(name)
  }

  return { homeScorers, awayScorers }
}

export function shouldAutoSync(): boolean {
  try {
    const raw = localStorage.getItem(SYNC_CACHE_KEY)
    if (!raw) return true
    return Date.now() - Number(raw) > SYNC_TTL_MS
  } catch {
    return true
  }
}

export function markSynced(): void {
  localStorage.setItem(SYNC_CACHE_KEY, String(Date.now()))
}

export async function syncMatchesFromApi(
  matches: TournamentMatch[],
  options: { fetchEvents?: boolean } = {},
): Promise<{ matches: TournamentMatch[]; result: SyncResult }> {
  const fetchEvents = options.fetchEvents ?? true
  let requestsUsed = 0
  let remaining: number | undefined
  let skippedDates = 0
  const byPair = buildPairIndex(matches)
  const apiById = new Map<number, ApiFixtureItem>()

  const applyMeta = (meta: { remaining?: number }) => {
    requestsUsed++
    if (meta.remaining !== undefined) remaining = meta.remaining
  }

  try {
    const liveRes = await fetchLiveFixtures()
    applyMeta(liveRes.meta)
    for (const f of liveRes.fixtures.filter(isWorldCupFixture)) {
      apiById.set(f.fixture.id, f)
    }

    for (const date of syncDates(matches)) {
      const dayRes = await fetchFixturesByDate(date)
      if (!dayRes) {
        skippedDates++
        continue
      }
      applyMeta(dayRes.meta)
      for (const f of dayRes.fixtures.filter(isWorldCupFixture)) {
        apiById.set(f.fixture.id, f)
      }
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro desconhecido'
    return {
      matches,
      result: {
        ok: false,
        updated: 0,
        live: 0,
        requestsUsed,
        message: msg,
        syncedAt: new Date().toISOString(),
        remaining,
      },
    }
  }

  if (apiById.size === 0) {
    return {
      matches,
      result: {
        ok: false,
        updated: 0,
        live: 0,
        requestsUsed,
        message: skippedDates > 0
          ? 'Plano free da API só cobre os últimos dias. Resultados anteriores vêm dos dados locais.'
          : 'Nenhum jogo da Copa encontrado na API agora.',
        syncedAt: new Date().toISOString(),
        remaining,
      },
    }
  }

  let updated = 0
  let live = 0
  const next = matches.map((m) => ({ ...m }))
  const nextById = Object.fromEntries(next.map((m) => [m.id, m]))
  const eventsCache = loadEventsCache()
  const eventTargets: { matchId: string; fixtureId: number; fixture: ApiFixtureItem }[] = []

  for (const fixture of apiById.values()) {
    const local = findLocalMatch(fixture, byPair)
    if (!local) continue

    const status = fixture.fixture.status.short
    const hs = fixture.goals.home
    const as = fixture.goals.away

    if (LIVE_STATUSES.has(status)) live++
    if (!FINISHED_STATUSES.has(status)) continue
    if (hs === null || as === null) continue

    const target = nextById[local.id]
    if (!target) continue

    const changed = target.homeScore !== hs || target.awayScore !== as
    target.homeScore = hs
    target.awayScore = as
    if (changed) updated++

    const cached = eventsCache[local.id]
    if (!cached || cached.fixtureId !== fixture.fixture.id || fetchEvents) {
      eventTargets.push({ matchId: local.id, fixtureId: fixture.fixture.id, fixture })
    }
  }

  if (fetchEvents) {
    const maxEvents = Math.min(eventTargets.length, 5)
    for (let i = 0; i < maxEvents; i++) {
      const { matchId, fixtureId, fixture } = eventTargets[i]
      const evRes = await fetchFixtureEvents(fixtureId)
      if (!evRes) break
      applyMeta(evRes.meta)
      const scorers = extractScorers(evRes.events, fixture.teams.home.id, fixture.teams.away.id)
      eventsCache[matchId] = {
        matchId,
        fixtureId,
        ...scorers,
        updatedAt: new Date().toISOString(),
      }
    }
    saveEventsCache(eventsCache)
  }

  markSynced()

  const planNote = skippedDates > 0 ? ' (plano free: só dias recentes na API)' : ''

  return {
    matches: next,
    result: {
      ok: true,
      updated,
      live,
      requestsUsed,
      message: updated > 0
        ? `${updated} jogo(s) atualizado(s) via API-Football${planNote}`
        : live > 0
          ? `${live} jogo(s) ao vivo${planNote}`
          : `Dados atualizados${planNote}`,
      syncedAt: new Date().toISOString(),
      remaining,
    },
  }
}
