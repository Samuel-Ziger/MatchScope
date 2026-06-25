import type { Team } from '../data/teams'
import type { TournamentMatch, MatchStage } from '../data/matches'
import { getKnockoutWinProbability, getMatchProbabilitiesWithForm } from './simulation'
import type { SimulationResult } from './simulation'
import {
  computeGroupStandings,
  rankThirdPlaces,
  type ResolvedMatch,
} from './tournament'
import {
  getTeamFormBoost,
  type MatchPerformance,
} from './matchPerformance'

import { R32_TEMPLATE } from './bracketPaths'

const GROUPS_LIST = 'ABCDEFGHIJKL'.split('')

const ROUND_META: { stage: MatchStage; label: string; count: number }[] = [
  { stage: 'r32', label: '32 avos', count: 16 },
  { stage: 'r16', label: 'Oitavas', count: 8 },
  { stage: 'qf', label: 'Quartas', count: 4 },
  { stage: 'sf', label: 'Semifinais', count: 2 },
  { stage: 'final', label: 'Final', count: 1 },
]

export interface SimulatedMatch extends ResolvedMatch {
  projectedWinnerId: string | null
  winnerAdvanceProb: number
  feedsFrom?: [string | null, string | null]
  isProjected: boolean
}

export interface SimulatedBracket {
  rounds: { stage: MatchStage; label: string; matches: SimulatedMatch[] }[]
  championId: string | null
  championProb: number
  championProbabilities: { teamId: string; prob: number }[]
  simulationResults: SimulationResult[]
}

function isPlayed(m: TournamentMatch): boolean {
  return m.homeScore !== null && m.awayScore !== null
}

function eloWinProb(eloA: number, eloB: number): number {
  return 1 / (1 + Math.pow(10, -(eloA - eloB) / 400))
}

function resolveSlot(token: string, slots: Record<string, string | null>): string | null {
  if (slots[token]) return slots[token]
  if (token.startsWith('3') && token.length > 2) {
    for (const ch of token.slice(1)) {
      const key = `3${ch}`
      if (slots[key]) return slots[key]
    }
  }
  return null
}

function buildQualifierSlots(
  allStandings: Record<string, ReturnType<typeof computeGroupStandings>>,
): Record<string, string | null> {
  const slots: Record<string, string | null> = {}
  for (const g of GROUPS_LIST) {
    const st = allStandings[g]
    if (!st) continue
    slots[`1${g}`] = st[0]?.teamId ?? null
    slots[`2${g}`] = st[1]?.teamId ?? null
    slots[`3${g}`] = st[2]?.teamId ?? null
  }
  return slots
}

function predictGroupScore(
  home: Team,
  away: Team,
  random: boolean,
  formH: number,
  formA: number,
): [number, number] {
  const probs = getMatchProbabilitiesWithForm(home, away, formH, formA, false)
  if (random) {
    const roll = Math.random() * 100
    if (roll < probs.teamAWin) return [1, 0]
    if (roll < probs.teamAWin + probs.draw) return [1, 1]
    return [0, 1]
  }
  if (probs.teamAWin >= probs.draw && probs.teamAWin >= probs.teamBWin) return [1, 0]
  if (probs.teamBWin >= probs.draw) return [0, 1]
  return [1, 1]
}

export function projectGroupMatches(
  matches: TournamentMatch[],
  teams: Team[],
  perfMap: Map<string, MatchPerformance>,
  formCache: Map<string, number>,
  random = false,
): TournamentMatch[] {
  const teamMap = Object.fromEntries(teams.map((t) => [t.id, t]))
  const getForm = (teamId: string) => {
    if (!formCache.has(teamId)) {
      formCache.set(teamId, getTeamFormBoost(teamId, matches, perfMap))
    }
    return formCache.get(teamId)!
  }
  return matches.map((m) => {
    if (isPlayed(m) || m.stage !== 'group') return m
    const home = teamMap[m.homeId]
    const away = teamMap[m.awayId]
    if (!home || !away) return m
    const [hs, as] = predictGroupScore(home, away, random, getForm(home.id), getForm(away.id))
    return { ...m, homeScore: hs, awayScore: as }
  })
}

function sampleKoWinner(
  home: Team,
  away: Team,
  random: boolean,
  formH: number,
  formA: number,
): { winnerId: string; prob: number } {
  const p = eloWinProb(home.elo + formH, away.elo + formA)
  const winnerId = random ? (Math.random() < p ? home.id : away.id) : (p >= 0.5 ? home.id : away.id)
  const prob = winnerId === home.id ? p * 100 : (1 - p) * 100
  return { winnerId, prob }
}

function enrichKoMatch(
  id: string,
  stage: MatchStage,
  homeId: string,
  awayId: string,
  label: string,
  teams: Team[],
  random: boolean,
  formCache: Map<string, number>,
  perfMap: Map<string, MatchPerformance>,
  allMatches: TournamentMatch[],
  feedsFrom?: [string | null, string | null],
): SimulatedMatch {
  const home = homeId !== 'tbd' ? teams.find((t) => t.id === homeId) : undefined
  const away = awayId !== 'tbd' ? teams.find((t) => t.id === awayId) : undefined

  const getForm = (teamId: string) => {
    if (!formCache.has(teamId)) {
      formCache.set(teamId, getTeamFormBoost(teamId, allMatches, perfMap))
    }
    return formCache.get(teamId)!
  }

  let knockoutProbs: { home: number; away: number } | undefined
  let projectedWinnerId: string | null = null
  let winnerAdvanceProb = 50

  if (home && away) {
    const formH = getForm(home.id)
    const formA = getForm(away.id)
    const kp = getKnockoutWinProbability(home, away, formH, formA)
    knockoutProbs = { home: kp.teamA, away: kp.teamB }
    const pick = sampleKoWinner(home, away, random, formH, formA)
    projectedWinnerId = pick.winnerId
    winnerAdvanceProb = pick.prob
  }

  return {
    id,
    stage,
    homeId,
    awayId,
    homeScore: null,
    awayScore: null,
    date: 'Eliminatórias',
    venue: 'EUA / México / Canadá',
    label,
    knockoutProbs,
    projectedWinnerId,
    winnerAdvanceProb,
    winnerId: projectedWinnerId,
    feedsFrom,
    isProjected: true,
  }
}

function buildR32(
  projectedMatches: TournamentMatch[],
  teams: Team[],
  random: boolean,
  formCache: Map<string, number>,
  perfMap: Map<string, MatchPerformance>,
): SimulatedMatch[] {
  const allStandings: Record<string, ReturnType<typeof computeGroupStandings>> = {}
  for (const g of GROUPS_LIST) {
    allStandings[g] = computeGroupStandings(g, projectedMatches)
  }
  rankThirdPlaces(allStandings)
  const slots = buildQualifierSlots(allStandings)

  return R32_TEMPLATE.map(([homeToken, awayToken], i) => {
    const homeId = resolveSlot(homeToken, slots) ?? 'tbd'
    const awayId = resolveSlot(awayToken, slots) ?? 'tbd'
    return enrichKoMatch(
      `R32-${i + 1}`,
      'r32',
      homeId,
      awayId,
      `${homeToken} vs ${awayToken}`,
      teams,
      random,
      formCache,
      perfMap,
      projectedMatches,
    )
  })
}

function advanceRound(
  prev: SimulatedMatch[],
  stage: MatchStage,
  teams: Team[],
  random: boolean,
  formCache: Map<string, number>,
  perfMap: Map<string, MatchPerformance>,
  allMatches: TournamentMatch[],
): SimulatedMatch[] {
  const count = prev.length / 2
  return Array.from({ length: count }, (_, i) => {
    const m1 = prev[i * 2]
    const m2 = prev[i * 2 + 1]
    const homeId = m1?.projectedWinnerId ?? 'tbd'
    const awayId = m2?.projectedWinnerId ?? 'tbd'
    const stagePrefix = stage.toUpperCase()
    return enrichKoMatch(
      `${stagePrefix}-${i + 1}`,
      stage,
      homeId,
      awayId,
      `Vencedor ${m1?.id} vs ${m2?.id}`,
      teams,
      random,
      formCache,
      perfMap,
      allMatches,
      [m1?.id ?? null, m2?.id ?? null],
    )
  })
}

export function buildSimulatedBracket(
  matches: TournamentMatch[],
  teams: Team[],
  perfMap: Map<string, MatchPerformance>,
  formCache: Map<string, number>,
  random = false,
): SimulatedBracket {
  const projected = projectGroupMatches(matches, teams, perfMap, formCache, random)
  let current = buildR32(projected, teams, random, formCache, perfMap)
  const rounds: SimulatedBracket['rounds'] = [
    { stage: 'r32', label: '32 avos de final', matches: current },
  ]

  for (const meta of ROUND_META.slice(1)) {
    current = advanceRound(current, meta.stage, teams, random, formCache, perfMap, projected)
    rounds.push({ stage: meta.stage, label: meta.label, matches: current })
  }

  const final = current[0]
  const championId = final?.projectedWinnerId ?? null
  const championProb = final?.winnerAdvanceProb ?? 0

  return { rounds, championId, championProb, championProbabilities: [], simulationResults: [] }
}

export const BRACKET_MC_ITERATIONS = 10000

function addTeamCount(counts: Record<string, number>, teamId: string) {
  if (teamId !== 'tbd') counts[teamId] = (counts[teamId] || 0) + 1
}

function addRoundEntrants(counts: Record<string, number>, matches: SimulatedMatch[] | undefined) {
  if (!matches) return
  for (const match of matches) {
    addTeamCount(counts, match.homeId)
    addTeamCount(counts, match.awayId)
  }
}

export function runBracketMonteCarloResults(
  matches: TournamentMatch[],
  teams: Team[],
  perfMap: Map<string, MatchPerformance>,
  formCache: Map<string, number>,
  iterations = BRACKET_MC_ITERATIONS,
): SimulationResult[] {
  const wins: Record<string, number> = {}
  const semis: Record<string, number> = {}
  const quarters: Record<string, number> = {}
  const roundOf16: Record<string, number> = {}

  for (let i = 0; i < iterations; i++) {
    const bracket = buildSimulatedBracket(matches, teams, perfMap, new Map(formCache), true)
    const roundsByStage = Object.fromEntries(bracket.rounds.map((round) => [round.stage, round.matches]))

    addRoundEntrants(roundOf16, roundsByStage.r16)
    addRoundEntrants(quarters, roundsByStage.qf)
    addRoundEntrants(semis, roundsByStage.sf)

    if (bracket.championId) addTeamCount(wins, bracket.championId)
  }

  return teams
    .map((team) => ({
      teamId: team.id,
      winProb: ((wins[team.id] || 0) / iterations) * 100,
      semifinalProb: ((semis[team.id] || 0) / iterations) * 100,
      quarterfinalProb: ((quarters[team.id] || 0) / iterations) * 100,
      roundOf16Prob: ((roundOf16[team.id] || 0) / iterations) * 100,
    }))
    .sort((a, b) => b.winProb - a.winProb)
}

export function runBracketMonteCarlo(
  matches: TournamentMatch[],
  teams: Team[],
  perfMap: Map<string, MatchPerformance>,
  formCache: Map<string, number>,
  iterations = BRACKET_MC_ITERATIONS,
): { teamId: string; prob: number }[] {
  return runBracketMonteCarloResults(matches, teams, perfMap, formCache, iterations)
    .filter((result) => result.winProb > 0)
    .map((result) => ({ teamId: result.teamId, prob: result.winProb }))
}

export function buildFullSimulatedBracket(
  matches: TournamentMatch[],
  teams: Team[],
  perfMap: Map<string, MatchPerformance>,
  formCache: Map<string, number>,
): SimulatedBracket {
  const deterministic = buildSimulatedBracket(matches, teams, perfMap, formCache, false)
  const simulationResults = runBracketMonteCarloResults(matches, teams, perfMap, formCache)
  const championProbabilities = simulationResults
    .filter((result) => result.winProb > 0)
    .map((result) => ({ teamId: result.teamId, prob: result.winProb }))
  const top = championProbabilities[0]
  return {
    ...deterministic,
    championId: top?.teamId ?? deterministic.championId,
    championProb: top?.prob ?? deterministic.championProb,
    championProbabilities,
    simulationResults,
  }
}
