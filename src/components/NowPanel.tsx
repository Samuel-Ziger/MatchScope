import { useCallback, useEffect, useMemo, useState } from 'react'
import type { TournamentMatch } from '../data/matches'
import type { Team } from '../data/teams'
import { LIVE_STATUSES, WC_LEAGUE_ID, type ApiEvent, type ApiFixtureItem } from '../lib/apiFootball/types'
import { fetchFixtureEvents, fetchLiveFixtures } from '../lib/apiFootball/client'
import { fetchWorldCupMatches } from '../lib/footballData/client'
import { FDO_LIVE, type FdoMatch } from '../lib/footballData/types'
import { resolveApiFootballTeamId, resolveTeamFromTlaAndName } from '../lib/teamApiMapping'
import {
  buildLiveProbabilitySnapshot,
  ensureInitialProbability,
  isWithinInitialWindow,
  probabilityChange,
  updateLiveProbabilityHistory,
  type LiveProbabilityHistory,
  type LiveProbabilitySnapshot,
  type LiveProjectionChange,
} from '../lib/liveMatchModel'
import { formatPct } from '../lib/simulation'
import { useTeams } from '../context/TeamsContext'
import { useTournament } from '../context/TournamentContext'
import { Badge, Button, Card, Flag, SectionHeader } from './ui'

type LiveSource = 'API-Football' | 'football-data.org'
type ExtendedLiveSource = LiveSource | 'WorldCup26 API'

interface NormalizedLiveMatch {
  source: ExtendedLiveSource
  match: TournamentMatch
  status: string
  statusLong: string
  minute: number
  homeScore: number
  awayScore: number
  homeApiId?: number
  awayApiId?: number
  events: ApiEvent[]
}

interface LiveRow {
  match: TournamentMatch
  source: ExtendedLiveSource
  status: string
  statusLong: string
  home: Team
  away: Team
  events: ApiEvent[]
  current: LiveProbabilitySnapshot
  history: LiveProbabilityHistory
  change: LiveProjectionChange
}

interface WorldCup26Game {
  id: string
  home_team_name_en: string | null
  away_team_name_en: string | null
  home_score: string | number | null
  away_score: string | number | null
  home_scorers: string | null
  away_scorers: string | null
  local_date: string
  finished: string
  time_elapsed: string | number | null
}

interface WorldCup26Response {
  games?: WorldCup26Game[]
}

function isWorldCupFixture(fixture: ApiFixtureItem): boolean {
  return fixture.league.id === WC_LEAGUE_ID
}

function findMatchByTeams(
  homeId: string | null,
  awayId: string | null,
  apiDate: string,
  matches: TournamentMatch[],
): TournamentMatch | undefined {
  if (!homeId || !awayId) return undefined
  return matches.find((match) => {
    if (match.homeId !== homeId || match.awayId !== awayId) return false
    const matchTime = new Date(`${match.date}T12:00:00`).getTime()
    const apiTime = new Date(`${apiDate}T12:00:00`).getTime()
    return Math.abs(matchTime - apiTime) <= 24 * 60 * 60 * 1000
  })
}

function findMatchForFixture(
  fixture: ApiFixtureItem,
  matches: TournamentMatch[],
): TournamentMatch | undefined {
  const homeId = resolveApiFootballTeamId(fixture.teams.home)
  const awayId = resolveApiFootballTeamId(fixture.teams.away)
  return findMatchByTeams(homeId, awayId, fixture.fixture.date.slice(0, 10), matches)
}

function fdoGoalsToEvents(match: FdoMatch): ApiEvent[] {
  return (match.goals ?? []).map((goal) => ({
    time: { elapsed: goal.minute, extra: goal.extraTime },
    team: { id: goal.team.id, name: goal.team.name },
    player: { id: goal.scorer?.id ?? null, name: goal.scorer?.name ?? null },
    assist: { id: goal.assist?.id ?? null, name: goal.assist?.name ?? null },
    type: 'Goal',
    detail: goal.type || 'REGULAR',
  }))
}

function parseScore(value: string | number | null | undefined): number {
  if (typeof value === 'number') return value
  if (!value || value === 'null') return 0
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) ? parsed : 0
}

function parseWorldCup26Date(value: string): string {
  const [date] = value.split(' ')
  const [month, day, year] = date.split('/')
  if (!month || !day || !year) return ''
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
}

function parseScorerEvents(raw: string | null, teamName: string | null, teamId: number): ApiEvent[] {
  if (!raw || raw === 'null' || !teamName) return []
  return raw
    .replace(/[{}"]/g, '')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const minuteMatch = entry.match(/(\d+)'/)
      const minute = minuteMatch ? Number.parseInt(minuteMatch[1], 10) : null
      const name = entry.replace(/\s+\d+'.*$/, '').trim()
      return {
        time: { elapsed: minute, extra: null },
        team: { id: teamId, name: teamName },
        player: { id: null, name: name || null },
        assist: { id: null, name: null },
        type: 'Goal',
        detail: 'REGULAR',
      } satisfies ApiEvent
    })
}

async function loadApiFootballLive(matches: TournamentMatch[]): Promise<{
  rows: NormalizedLiveMatch[]
  remaining?: number
}> {
  const live = await fetchLiveFixtures()
  const rows: NormalizedLiveMatch[] = []
  let remaining = live.meta.remaining

  for (const fixture of live.fixtures.filter(isWorldCupFixture)) {
    if (!LIVE_STATUSES.has(fixture.fixture.status.short)) continue
    const match = findMatchForFixture(fixture, matches)
    if (!match) continue

    const eventRes = await fetchFixtureEvents(fixture.fixture.id)
    if (eventRes?.meta.remaining !== undefined) remaining = eventRes.meta.remaining
    const events = eventRes?.events ?? []
    const minute = fixture.fixture.status.elapsed ?? Math.max(0, ...events.map((ev) => ev.time.elapsed ?? 0))

    rows.push({
      source: 'API-Football',
      match,
      status: fixture.fixture.status.short,
      statusLong: fixture.fixture.status.long,
      minute,
      homeScore: fixture.goals.home ?? match.homeScore ?? 0,
      awayScore: fixture.goals.away ?? match.awayScore ?? 0,
      homeApiId: fixture.teams.home.id,
      awayApiId: fixture.teams.away.id,
      events,
    })
  }

  return { rows, remaining }
}

async function loadWorldCup26Live(matches: TournamentMatch[]): Promise<NormalizedLiveMatch[]> {
  const res = await fetch('/api/worldcup26/get/games', { cache: 'no-store' })
  if (!res.ok) throw new Error(`WorldCup26 API HTTP ${res.status}`)
  const data = (await res.json()) as WorldCup26Response
  const rows: NormalizedLiveMatch[] = []

  for (const game of data.games ?? []) {
    const elapsed = String(game.time_elapsed ?? '').toLowerCase()
    const isLive = game.finished !== 'TRUE' && elapsed !== 'notstarted' && elapsed !== 'finished'
    if (!isLive) continue

    const homeId = game.home_team_name_en ? resolveTeamFromTlaAndName(undefined, game.home_team_name_en) : null
    const awayId = game.away_team_name_en ? resolveTeamFromTlaAndName(undefined, game.away_team_name_en) : null
    const apiDate = parseWorldCup26Date(game.local_date)
    const match = findMatchByTeams(homeId, awayId, apiDate, matches)
    if (!match) continue

    const homeApiId = Number.parseInt(game.id, 10) * 2
    const awayApiId = homeApiId + 1
    const events = [
      ...parseScorerEvents(game.home_scorers, game.home_team_name_en, homeApiId),
      ...parseScorerEvents(game.away_scorers, game.away_team_name_en, awayApiId),
    ]
    const elapsedMinute = Number.parseInt(String(game.time_elapsed), 10)
    rows.push({
      source: 'WorldCup26 API',
      match,
      status: elapsed === 'live' ? 'LIVE' : String(game.time_elapsed ?? 'LIVE'),
      statusLong: 'Ao vivo',
      minute: Number.isFinite(elapsedMinute) ? elapsedMinute : Math.max(0, ...events.map((ev) => ev.time.elapsed ?? 0)),
      homeScore: parseScore(game.home_score),
      awayScore: parseScore(game.away_score),
      homeApiId,
      awayApiId,
      events,
    })
  }

  return rows
}

async function loadFootballDataLive(matches: TournamentMatch[]): Promise<NormalizedLiveMatch[]> {
  const { matches: fdoMatches } = await fetchWorldCupMatches()
  const rows: NormalizedLiveMatch[] = []

  for (const fdo of fdoMatches ?? []) {
    if (!FDO_LIVE.has(fdo.status)) continue
    const homeId = resolveTeamFromTlaAndName(fdo.homeTeam.tla, fdo.homeTeam.name)
    const awayId = resolveTeamFromTlaAndName(fdo.awayTeam.tla, fdo.awayTeam.name)
    const match = findMatchByTeams(homeId, awayId, fdo.utcDate.slice(0, 10), matches)
    if (!match) continue

    const events = fdoGoalsToEvents(fdo)
    rows.push({
      source: 'football-data.org',
      match,
      status: fdo.status,
      statusLong: fdo.status === 'PAUSED' ? 'Intervalo' : 'Ao vivo',
      minute: fdo.minute ?? Math.max(0, ...events.map((ev) => ev.time.elapsed ?? 0)),
      homeScore: fdo.score.fullTime.home ?? match.homeScore ?? 0,
      awayScore: fdo.score.fullTime.away ?? match.awayScore ?? 0,
      homeApiId: fdo.homeTeam.id,
      awayApiId: fdo.awayTeam.id,
      events,
    })
  }

  return rows
}

function eventReason(events: ApiEvent[]): string {
  const last = [...events]
    .filter((ev) => ev.type === 'Goal' || ev.type.toLowerCase().includes('subst'))
    .sort((a, b) => (b.time.elapsed ?? 0) - (a.time.elapsed ?? 0))[0]
  if (!last) return 'Modelo recalculado pelo minuto e placar atual'
  if (last.type === 'Goal') return `Ultimo evento: gol de ${last.player?.name ?? last.team.name}`
  return `Ultimo evento: substituicao de ${last.team.name}`
}

function formatDelta(value: number): string {
  const sign = value > 0 ? '+' : ''
  return `${sign}${value.toFixed(1)} pp`
}

function formatScore(home: number, away: number): string {
  return `${home} × ${away}`
}

function statusLabel(row: LiveRow): string {
  if (row.current.minute > 0) return `${row.current.minute}'`
  if (row.status === 'HT' || row.status === 'PAUSED') return 'Intervalo'
  return row.statusLong || row.status
}

export function NowPanel() {
  const { teams, getTeamById } = useTeams()
  const { matches, atualizar, syncing } = useTournament()
  const [liveRows, setLiveRows] = useState<LiveRow[]>([])
  const [upcomingBaselines, setUpcomingBaselines] = useState<TournamentMatch[]>([])
  const [loading, setLoading] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)
  const [remaining, setRemaining] = useState<number | undefined>()

  const teamMap = useMemo(() => new Map(teams.map((team) => [team.id, team])), [teams])

  const prepareInitialBaselines = useCallback(() => {
    const prepared: TournamentMatch[] = []
    for (const match of matches) {
      if (match.homeScore !== null || match.awayScore !== null) continue
      if (!isWithinInitialWindow(match)) continue
      const home = teamMap.get(match.homeId)
      const away = teamMap.get(match.awayId)
      if (!home || !away) continue
      ensureInitialProbability(match, home, away)
      prepared.push(match)
    }
    setUpcomingBaselines(prepared.slice(0, 8))
  }, [matches, teamMap])

  const loadLive = useCallback(async () => {
    setLoading(true)
    try {
      prepareInitialBaselines()
      let normalizedRows: NormalizedLiveMatch[] = []

      try {
        const apiFootball = await loadApiFootballLive(matches)
        normalizedRows = apiFootball.rows
        setRemaining(apiFootball.remaining)
      } catch {
        normalizedRows = []
      }

      if (normalizedRows.length === 0) {
        try {
          normalizedRows = await loadFootballDataLive(matches)
        } catch {
          normalizedRows = []
        }
      }

      if (normalizedRows.length === 0) {
        try {
          normalizedRows = await loadWorldCup26Live(matches)
        } catch {
          normalizedRows = []
        }
      }

      const rows: LiveRow[] = []
      for (const liveMatch of normalizedRows) {
        const { match } = liveMatch
        const home = getTeamById(match.homeId)
        const away = getTeamById(match.awayId)
        if (!home || !away) continue

        const initialHistory = ensureInitialProbability(match, home, away)
        const current = buildLiveProbabilitySnapshot({
          match,
          home,
          away,
          minute: liveMatch.minute,
          homeScore: liveMatch.homeScore,
          awayScore: liveMatch.awayScore,
          events: liveMatch.events,
          homeApiId: liveMatch.homeApiId,
          awayApiId: liveMatch.awayApiId,
          reason: 'live',
        })
        const history = updateLiveProbabilityHistory(match.id, initialHistory.initial, current)
        rows.push({
          match,
          source: liveMatch.source,
          status: liveMatch.status,
          statusLong: liveMatch.statusLong,
          home,
          away,
          events: liveMatch.events,
          current,
          history,
          change: probabilityChange(history.initial, current),
        })
      }

      setLiveRows(rows)
      setLastUpdated(new Date().toISOString())
    } catch {
      setLiveRows([])
    } finally {
      setLoading(false)
    }
  }, [getTeamById, matches, prepareInitialBaselines])

  useEffect(() => {
    void loadLive()
    const id = window.setInterval(() => void loadLive(), 60_000)
    return () => window.clearInterval(id)
  }, [loadLive])

  const refreshAll = async () => {
    await atualizar()
    await loadLive()
  }

  return (
    <div className="space-y-6 animate-enter w-full min-w-0">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-text-primary tracking-tight">Agora</h2>
          <p className="text-sm text-text-secondary mt-1">
            Jogos ao vivo com probabilidade recalculada por placar, minuto, gols e substituicoes.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="text-xs text-text-tertiary">
            {lastUpdated
              ? `Atualizado ${new Date(lastUpdated).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
              : 'Aguardando atualizacao'}
            {remaining !== undefined && <> · API-Football restante: {remaining}</>}
          </div>
          <Button onClick={refreshAll} disabled={loading || syncing} variant="secondary">
            {loading || syncing ? 'Atualizando...' : 'Atualizar'}
          </Button>
        </div>
      </div>

      {liveRows.length > 0 ? (
        <div className="space-y-4">
          {liveRows.map((row) => (
            <LiveMatchCard key={row.match.id} row={row} />
          ))}
        </div>
      ) : (
        <Card>
          <SectionHeader title="Nenhum jogo ao vivo agora" />
          {upcomingBaselines.length > 0 ? (
            <div className="space-y-2">
              <div className="text-xs uppercase tracking-wider text-text-tertiary mb-2">
                Baselines pre-jogo preparados
              </div>
              {upcomingBaselines.map((match) => {
                const home = teamMap.get(match.homeId)
                const away = teamMap.get(match.awayId)
                if (!home || !away) return null
                return (
                  <div
                    key={match.id}
                    className="flex flex-wrap items-center gap-2 justify-between border border-border rounded-md px-3 py-2 bg-surface-1"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Flag iso={home.iso} name={home.name} size={18} />
                      <span className="text-sm text-text-primary">{home.name}</span>
                      <span className="text-xs text-text-tertiary">vs</span>
                      <Flag iso={away.iso} name={away.name} size={18} />
                      <span className="text-sm text-text-primary">{away.name}</span>
                    </div>
                    <span className="text-xs text-text-tertiary">
                      {new Date(`${match.date}T12:00:00`).toLocaleDateString('pt-BR')} · {match.venue}
                    </span>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-sm text-text-secondary">
              Sem partidas na janela de baseline de 24 horas.
            </p>
          )}
        </Card>
      )}
    </div>
  )
}

function LiveMatchCard({ row }: { row: LiveRow }) {
  const { home, away, current, history, change, events } = row
  const score = formatScore(current.homeScore, current.awayScore)
  const probable = current.probableScore

  return (
    <Card className="border-brand/25">
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-5">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <Badge color="#34d399" variant="solid">Ao vivo</Badge>
            <span className="text-xs font-mono text-text-secondary">{statusLabel(row)}</span>
            <span className="text-xs text-text-tertiary">Fonte: {row.source}</span>
            <span className="text-xs text-text-tertiary">{eventReason(events)}</span>
          </div>

          <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 mb-5">
            <TeamHeader team={home} align="right" />
            <div className="text-2xl sm:text-3xl font-mono font-semibold text-text-primary px-3">
              {score}
            </div>
            <TeamHeader team={away} align="left" />
          </div>

          <div className="grid md:grid-cols-3 gap-3">
            <OutcomeBlock label={home.name} value={current.homeWin} delta={change.homeWin} />
            <OutcomeBlock label="Empate" value={current.draw} delta={change.draw} />
            <OutcomeBlock label={away.name} value={current.awayWin} delta={change.awayWin} />
          </div>

          <div className="grid lg:grid-cols-[1fr_1.4fr] gap-3 mt-3">
            <div className="bg-surface-1 border border-border rounded-lg p-3">
              <div className="text-xs text-text-tertiary mb-1">Resultado provável</div>
              <div className="text-xl font-mono font-semibold text-text-primary">
                {home.name} {formatScore(probable.homeGoals, probable.awayGoals)} {away.name}
              </div>
              <div className="text-xs text-brand mt-1">{formatPct(probable.probability)} no modelo atual</div>
            </div>
            <ScorelineGrid snapshot={current} />
          </div>

          <div className="grid md:grid-cols-3 gap-3 mt-3">
            <GoalDistribution title={`Gols restantes ${home.name}`} data={current.homeAdditionalGoals} />
            <GoalDistribution title={`Gols restantes ${away.name}`} data={current.awayAdditionalGoals} />
            <GoalDistribution title="Mais gols no jogo" data={current.totalAdditionalGoals} plusFrom={3} />
          </div>
        </div>

        <div className="lg:w-[360px] space-y-3">
          <div className="grid grid-cols-3 gap-2">
            <MiniStat label={`Gol ${home.name}`} value={current.homeGoalProb} />
            <MiniStat label={`Gol ${away.name}`} value={current.awayGoalProb} />
            <MiniStat label="Sem mais gols" value={current.noMoreGoalsProb} />
          </div>

          <div className="border border-border rounded-lg overflow-hidden">
            <div className="px-3 py-2 bg-surface-1 border-b border-border text-xs uppercase tracking-wider text-text-tertiary">
              Proximo gol provavel
            </div>
            <div className="divide-y divide-border-subtle">
              {current.topScorers.slice(0, 5).map((item) => (
                <div key={`${item.teamId}-${item.player}`} className="flex items-center gap-2 px-3 py-2">
                  <span className="text-xs font-mono text-text-tertiary w-7">{item.position}</span>
                  <span className="text-sm text-text-primary flex-1 truncate">{item.player}</span>
                  <span className="text-sm font-mono text-brand">{formatPct(item.probability)}</span>
                </div>
              ))}
            </div>
          </div>

          <HistoryPanel history={history} current={current} home={home} away={away} />
        </div>
      </div>
    </Card>
  )
}

function ScorelineGrid({ snapshot }: { snapshot: LiveProbabilitySnapshot }) {
  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <div className="px-3 py-2 bg-surface-1 border-b border-border text-xs uppercase tracking-wider text-text-tertiary">
        Placares finais mais prováveis
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 divide-x divide-y divide-border-subtle">
        {snapshot.scorelines.map((item) => (
          <div key={`${item.homeGoals}-${item.awayGoals}`} className="px-3 py-2">
            <div className="text-sm font-mono font-semibold text-text-primary">
              {formatScore(item.homeGoals, item.awayGoals)}
            </div>
            <div className="text-xs text-text-tertiary">{formatPct(item.probability)}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function GoalDistribution({
  title,
  data,
  plusFrom = 4,
}: {
  title: string
  data: LiveProbabilitySnapshot['homeAdditionalGoals']
  plusFrom?: number
}) {
  return (
    <div className="bg-surface-1 border border-border rounded-lg p-3 min-w-0">
      <div className="text-xs text-text-tertiary truncate mb-2">{title}</div>
      <div className="space-y-1.5">
        {data.map((item) => {
          const label = item.goals >= plusFrom ? `${plusFrom}+` : String(item.goals)
          return (
            <div key={item.goals} className="grid grid-cols-[1.8rem_1fr_3rem] items-center gap-2">
              <span className="text-xs font-mono text-text-secondary">{label}</span>
              <div className="h-1.5 bg-surface-3 rounded-full overflow-hidden">
                <div className="h-full bg-brand rounded-full" style={{ width: `${Math.min(100, item.probability)}%` }} />
              </div>
              <span className="text-xs font-mono text-text-primary text-right">{formatPct(item.probability, 0)}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function HistoryPanel({
  history,
  current,
  home,
  away,
}: {
  history: LiveProbabilityHistory
  current: LiveProbabilitySnapshot
  home: Team
  away: Team
}) {
  const recent = history.snapshots.slice(-4).reverse()
  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <div className="px-3 py-2 bg-surface-1 border-b border-border text-xs uppercase tracking-wider text-text-tertiary">
        Comparação e histórico
      </div>
      <div className="p-3 space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <CompareStat label={home.name} initial={history.initial.homeWin} current={current.homeWin} />
          <CompareStat label={away.name} initial={history.initial.awayWin} current={current.awayWin} />
        </div>
        <div className="space-y-1.5">
          {recent.map((snap) => (
            <HistoryLine key={`${snap.createdAt}-${snap.signature}`} snapshot={snap} />
          ))}
        </div>
      </div>
    </div>
  )
}

function HistoryLine({ snapshot }: { snapshot: LiveProbabilitySnapshot }) {
  const probable = snapshot.probableScore ?? {
    homeGoals: snapshot.homeScore,
    awayGoals: snapshot.awayScore,
    probability: 0,
  }
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="font-mono text-text-tertiary w-11">
        {new Date(snapshot.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
      </span>
      <span className="font-mono text-text-primary w-12">{formatScore(snapshot.homeScore, snapshot.awayScore)}</span>
      <span className="text-text-tertiary flex-1 truncate">
        provável {formatScore(probable.homeGoals, probable.awayGoals)}
      </span>
      <span className="font-mono text-brand">{probable.probability > 0 ? formatPct(probable.probability, 0) : '--'}</span>
    </div>
  )
}

function CompareStat({
  label,
  initial,
  current,
}: {
  label: string
  initial: number
  current: number
}) {
  const delta = current - initial
  const positive = delta > 0.05
  const negative = delta < -0.05
  return (
    <div className="bg-surface-1 rounded-md px-2 py-2 min-w-0">
      <div className="text-[10px] text-text-tertiary truncate">{label}</div>
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-sm font-mono text-text-primary">{formatPct(current)}</span>
        <span className={`text-xs font-mono ${positive ? 'text-positive' : negative ? 'text-negative' : 'text-text-tertiary'}`}>
          {formatDelta(delta)}
        </span>
      </div>
      <div className="text-[10px] text-text-tertiary">inicial {formatPct(initial)}</div>
    </div>
  )
}

function TeamHeader({ team, align }: { team: Team; align: 'left' | 'right' }) {
  return (
    <div className={`flex items-center gap-2 min-w-0 ${align === 'right' ? 'justify-end text-right' : ''}`}>
      {align === 'left' && <Flag iso={team.iso} name={team.name} size={28} />}
      <div className="min-w-0">
        <div className="text-base font-semibold text-text-primary truncate">{team.name}</div>
        <div className="text-xs text-text-tertiary">Elo {team.elo}</div>
      </div>
      {align === 'right' && <Flag iso={team.iso} name={team.name} size={28} />}
    </div>
  )
}

function OutcomeBlock({ label, value, delta }: { label: string; value: number; delta: number }) {
  const positive = delta > 0.05
  const negative = delta < -0.05
  return (
    <div className="bg-surface-1 border border-border rounded-lg p-3 min-w-0">
      <div className="text-xs text-text-tertiary truncate mb-1">{label}</div>
      <div className="flex items-end justify-between gap-2">
        <div className="text-xl font-mono font-semibold text-text-primary">{formatPct(value)}</div>
        <div className={`text-xs font-mono ${positive ? 'text-positive' : negative ? 'text-negative' : 'text-text-tertiary'}`}>
          {formatDelta(delta)}
        </div>
      </div>
      <div className="h-1.5 bg-surface-3 rounded-full overflow-hidden mt-2">
        <div className="h-full bg-brand rounded-full" style={{ width: `${Math.min(100, value)}%` }} />
      </div>
    </div>
  )
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-surface-1 border border-border rounded-lg px-3 py-2 min-w-0">
      <div className="text-[10px] text-text-tertiary uppercase truncate">{label}</div>
      <div className="text-sm font-mono font-semibold text-text-primary">{formatPct(value)}</div>
    </div>
  )
}
