import type { Team } from '../data/teams'
import type { TournamentMatch } from '../data/matches'
import { getSquadByTeamId, type PlayerPosition } from '../data/squads'
import type { ApiEvent } from './apiFootball/types'
import { getMatchProbabilitiesWithForm } from './simulation'
import { getPlayerBaseRating } from './matchPerformance'

const HISTORY_KEY = 'matchscope-live-probability-history'
const MAX_SNAPSHOTS_PER_MATCH = 60
const MAX_GOALS_FOR_POISSON = 7

export interface PlayerGoalProbability {
  teamId: string
  player: string
  position: PlayerPosition
  probability: number
}

export interface GoalCountProbability {
  goals: number
  probability: number
}

export interface ScorelineProbability {
  homeGoals: number
  awayGoals: number
  probability: number
}

export interface LiveProbabilitySnapshot {
  createdAt: string
  reason: 'initial' | 'live' | 'manual'
  signature: string
  minute: number
  homeScore: number
  awayScore: number
  homeWin: number
  draw: number
  awayWin: number
  expectedHomeGoals: number
  expectedAwayGoals: number
  homeGoalProb: number
  awayGoalProb: number
  noMoreGoalsProb: number
  probableScore: ScorelineProbability
  scorelines: ScorelineProbability[]
  homeAdditionalGoals: GoalCountProbability[]
  awayAdditionalGoals: GoalCountProbability[]
  totalAdditionalGoals: GoalCountProbability[]
  topScorers: PlayerGoalProbability[]
}

export interface LiveProbabilityHistory {
  matchId: string
  initial: LiveProbabilitySnapshot
  last: LiveProbabilitySnapshot
  snapshots: LiveProbabilitySnapshot[]
}

export interface LiveProjectionChange {
  homeWin: number
  draw: number
  awayWin: number
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

function poisson(lambda: number, k: number): number {
  let factorial = 1
  for (let i = 2; i <= k; i++) factorial *= i
  return (Math.exp(-lambda) * Math.pow(lambda, k)) / factorial
}

function buildGoalDistribution(lambda: number): GoalCountProbability[] {
  const probs = Array.from({ length: 4 }, (_, goals) => ({
    goals,
    probability: poisson(lambda, goals) * 100,
  }))
  const explicit = probs.reduce((sum, item) => sum + item.probability, 0)
  return [
    ...probs,
    { goals: 4, probability: Math.max(0, 100 - explicit) },
  ]
}

function buildTotalGoalDistribution(homeLambda: number, awayLambda: number): GoalCountProbability[] {
  const totalLambda = homeLambda + awayLambda
  const probs = Array.from({ length: 3 }, (_, goals) => ({
    goals,
    probability: poisson(totalLambda, goals) * 100,
  }))
  const explicit = probs.reduce((sum, item) => sum + item.probability, 0)
  return [
    ...probs,
    { goals: 3, probability: Math.max(0, 100 - explicit) },
  ]
}

function normalizeEventType(type: string): string {
  return type.toLowerCase().replace(/[^a-z]/g, '')
}

function isGoalEvent(ev: ApiEvent): boolean {
  return normalizeEventType(ev.type) === 'goal' && ev.detail !== 'Missed Penalty'
}

function isSubstitutionEvent(ev: ApiEvent): boolean {
  const type = normalizeEventType(ev.type)
  return type === 'subst' || type === 'substitution'
}

function eventTeamCounts(events: ApiEvent[], homeApiId?: number, awayApiId?: number) {
  let homeGoals = 0
  let awayGoals = 0
  let homeSubs = 0
  let awaySubs = 0
  const scored = new Map<string, number>()
  const subbedOut = new Set<string>()

  for (const ev of events) {
    const name = ev.player?.name
    if (isGoalEvent(ev)) {
      if (homeApiId && ev.team.id === homeApiId) homeGoals++
      if (awayApiId && ev.team.id === awayApiId) awayGoals++
      if (name) scored.set(name, (scored.get(name) || 0) + 1)
    }
    if (isSubstitutionEvent(ev)) {
      if (homeApiId && ev.team.id === homeApiId) homeSubs++
      if (awayApiId && ev.team.id === awayApiId) awaySubs++
      if (name) subbedOut.add(name)
    }
  }

  return { homeGoals, awayGoals, homeSubs, awaySubs, scored, subbedOut }
}

export function buildLiveSignature(
  minute: number,
  homeScore: number,
  awayScore: number,
  events: ApiEvent[],
): string {
  const eventSig = events
    .filter((ev) => isGoalEvent(ev) || isSubstitutionEvent(ev))
    .map((ev) => [
      ev.time.elapsed ?? 0,
      ev.team.id,
      ev.type,
      ev.detail,
      ev.player?.name ?? '',
      ev.assist?.name ?? '',
    ].join(':'))
    .join('|')
  return `${minute}:${homeScore}:${awayScore}:${eventSig}`
}

function buildTopScorers(
  home: Team,
  away: Team,
  homeNextGoalProb: number,
  awayNextGoalProb: number,
  events: ApiEvent[],
  homeApiId?: number,
  awayApiId?: number,
): PlayerGoalProbability[] {
  const counts = eventTeamCounts(events, homeApiId, awayApiId)

  const buildForTeam = (team: Team, teamGoalProb: number) => {
    const squad = getSquadByTeamId(team.id)
    if (!squad || teamGoalProb <= 0) return []

    const weighted = squad.players
      .filter((p) => p.position !== 'GK' && !counts.subbedOut.has(p.name))
      .map((player) => {
        const posWeight = player.position === 'FW' ? 1.45 : player.position === 'MF' ? 0.95 : 0.32
        const ratingWeight = Math.max(0.2, getPlayerBaseRating(player) - 6.1)
        const alreadyScored = counts.scored.get(player.name) || 0
        return {
          player,
          weight: posWeight * ratingWeight * (1 + alreadyScored * 0.18),
        }
      })
      .sort((a, b) => b.weight - a.weight)

    const total = weighted.reduce((sum, item) => sum + item.weight, 0) || 1
    return weighted.slice(0, 8).map(({ player, weight }) => ({
      teamId: team.id,
      player: player.name,
      position: player.position,
      probability: teamGoalProb * (weight / total),
    }))
  }

  return [
    ...buildForTeam(home, homeNextGoalProb),
    ...buildForTeam(away, awayNextGoalProb),
  ]
    .sort((a, b) => b.probability - a.probability)
    .slice(0, 8)
}

export function buildLiveProbabilitySnapshot({
  match,
  home,
  away,
  minute,
  homeScore,
  awayScore,
  events = [],
  homeApiId,
  awayApiId,
  reason,
}: {
  match: TournamentMatch
  home: Team
  away: Team
  minute: number
  homeScore: number
  awayScore: number
  events?: ApiEvent[]
  homeApiId?: number
  awayApiId?: number
  reason: LiveProbabilitySnapshot['reason']
}): LiveProbabilitySnapshot {
  const pre = getMatchProbabilitiesWithForm(home, away, 0, 0, match.stage !== 'group')
  const eventCounts = eventTeamCounts(events, homeApiId, awayApiId)
  const elapsed = clamp(minute, 0, 120)
  const remainingShare = match.stage === 'group'
    ? clamp((94 - elapsed) / 94, 0, 1)
    : clamp((124 - elapsed) / 124, 0, 1)

  const baseTotalGoals = 2.55 + clamp(Math.abs(home.elo - away.elo) / 500, 0, 0.45)
  const homeStrength = Math.max(0.15, pre.teamAWin / 100 + 0.18)
  const awayStrength = Math.max(0.15, pre.teamBWin / 100 + 0.18)
  const strengthTotal = homeStrength + awayStrength

  const scoreDiff = homeScore - awayScore
  const homeUrgency = scoreDiff < 0 ? 1.14 : scoreDiff > 0 ? 0.9 : 1
  const awayUrgency = scoreDiff > 0 ? 1.14 : scoreDiff < 0 ? 0.9 : 1
  const homeFreshness = 1 + eventCounts.homeSubs * 0.025
  const awayFreshness = 1 + eventCounts.awaySubs * 0.025

  const expectedHomeGoals = clamp(
    baseTotalGoals * remainingShare * (homeStrength / strengthTotal) * homeUrgency * homeFreshness,
    0,
    4,
  )
  const expectedAwayGoals = clamp(
    baseTotalGoals * remainingShare * (awayStrength / strengthTotal) * awayUrgency * awayFreshness,
    0,
    4,
  )

  let homeWin = 0
  let draw = 0
  let awayWin = 0
  const scorelines: ScorelineProbability[] = []
  for (let hg = 0; hg <= MAX_GOALS_FOR_POISSON; hg++) {
    const hp = poisson(expectedHomeGoals, hg)
    for (let ag = 0; ag <= MAX_GOALS_FOR_POISSON; ag++) {
      const p = hp * poisson(expectedAwayGoals, ag)
      const finalHome = homeScore + hg
      const finalAway = awayScore + ag
      scorelines.push({
        homeGoals: finalHome,
        awayGoals: finalAway,
        probability: p * 100,
      })
      if (finalHome > finalAway) homeWin += p
      else if (finalAway > finalHome) awayWin += p
      else draw += p
    }
  }

  const totalOutcome = homeWin + draw + awayWin || 1
  const homeGoalProb = (1 - Math.exp(-expectedHomeGoals)) * 100
  const awayGoalProb = (1 - Math.exp(-expectedAwayGoals)) * 100
  const nextGoalTotal = homeGoalProb + awayGoalProb || 1
  const anyGoalProb = (1 - Math.exp(-(expectedHomeGoals + expectedAwayGoals))) * 100
  const nextHomeGoalProb = anyGoalProb * (homeGoalProb / nextGoalTotal)
  const nextAwayGoalProb = anyGoalProb * (awayGoalProb / nextGoalTotal)
  const topScorelines = scorelines
    .sort((a, b) => b.probability - a.probability)
    .slice(0, 6)

  return {
    createdAt: new Date().toISOString(),
    reason,
    signature: buildLiveSignature(elapsed, homeScore, awayScore, events),
    minute: elapsed,
    homeScore,
    awayScore,
    homeWin: (homeWin / totalOutcome) * 100,
    draw: (draw / totalOutcome) * 100,
    awayWin: (awayWin / totalOutcome) * 100,
    expectedHomeGoals,
    expectedAwayGoals,
    homeGoalProb,
    awayGoalProb,
    noMoreGoalsProb: 100 - anyGoalProb,
    probableScore: topScorelines[0] ?? { homeGoals: homeScore, awayGoals: awayScore, probability: 100 },
    scorelines: topScorelines,
    homeAdditionalGoals: buildGoalDistribution(expectedHomeGoals),
    awayAdditionalGoals: buildGoalDistribution(expectedAwayGoals),
    totalAdditionalGoals: buildTotalGoalDistribution(expectedHomeGoals, expectedAwayGoals),
    topScorers: buildTopScorers(
      home,
      away,
      nextHomeGoalProb,
      nextAwayGoalProb,
      events,
      homeApiId,
      awayApiId,
    ),
  }
}

export function loadLiveProbabilityHistory(): Record<string, LiveProbabilityHistory> {
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

export function saveLiveProbabilityHistory(history: Record<string, LiveProbabilityHistory>) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history))
}

export function updateLiveProbabilityHistory(
  matchId: string,
  initial: LiveProbabilitySnapshot,
  current: LiveProbabilitySnapshot,
): LiveProbabilityHistory {
  const all = loadLiveProbabilityHistory()
  const existing = all[matchId]
  const snapshots = existing?.snapshots ? [...existing.snapshots] : [initial]
  const previous = snapshots[snapshots.length - 1]

  if (!previous || previous.signature !== current.signature) {
    snapshots.push(current)
  }

  const next: LiveProbabilityHistory = {
    matchId,
    initial: existing?.initial ?? initial,
    last: current,
    snapshots: snapshots.slice(-MAX_SNAPSHOTS_PER_MATCH),
  }
  all[matchId] = next
  saveLiveProbabilityHistory(all)
  return next
}

export function ensureInitialProbability(
  match: TournamentMatch,
  home: Team,
  away: Team,
): LiveProbabilityHistory {
  const history = loadLiveProbabilityHistory()
  const existing = history[match.id]
  if (existing) return existing

  const initial = buildLiveProbabilitySnapshot({
    match,
    home,
    away,
    minute: 0,
    homeScore: 0,
    awayScore: 0,
    events: [],
    reason: 'initial',
  })
  const next: LiveProbabilityHistory = {
    matchId: match.id,
    initial,
    last: initial,
    snapshots: [initial],
  }
  history[match.id] = next
  saveLiveProbabilityHistory(history)
  return next
}

export function probabilityChange(
  initial: LiveProbabilitySnapshot,
  current: LiveProbabilitySnapshot,
): LiveProjectionChange {
  return {
    homeWin: current.homeWin - initial.homeWin,
    draw: current.draw - initial.draw,
    awayWin: current.awayWin - initial.awayWin,
  }
}

export function isWithinInitialWindow(match: TournamentMatch, now = new Date()): boolean {
  const dayStart = new Date(`${match.date}T00:00:00`)
  const windowStart = new Date(dayStart)
  windowStart.setDate(windowStart.getDate() - 1)
  const windowEnd = new Date(dayStart)
  windowEnd.setDate(windowEnd.getDate() + 1)
  return now >= windowStart && now <= windowEnd
}
