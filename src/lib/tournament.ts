import type { Team } from '../data/teams'
import { GROUPS } from '../data/teams'
import type { TournamentMatch, MatchStage } from '../data/matches'
import { getKnockoutWinProbability, getMatchProbabilitiesWithForm } from './simulation'
import { buildFullSimulatedBracket } from './bracketSimulation'
import {
  buildAllPerformances,
  buildMatchPerformance,
  buildProjectedPerformance,
  getTeamFormBoost,
  type MatchPerformance,
} from './matchPerformance'

export interface StandingRow {
  teamId: string
  played: number
  won: number
  drawn: number
  lost: number
  gf: number
  ga: number
  gd: number
  pts: number
  position: number
  status: 'qualified' | 'eliminated' | 'third_candidate' | 'playing' | 'best_third'
}

export interface GroupState {
  group: string
  standings: StandingRow[]
  matches: ResolvedMatch[]
}

export interface ResolvedMatch extends TournamentMatch {
  winnerId?: string | null
  probs?: { home: number; draw: number; away: number }
  knockoutProbs?: { home: number; away: number }
  performance?: MatchPerformance
}

export interface KnockoutRound {
  stage: MatchStage
  label: string
  matches: ResolvedMatch[]
}

const GROUPS_LIST = 'ABCDEFGHIJKL'.split('')

function isPlayed(m: TournamentMatch): boolean {
  return m.homeScore !== null && m.awayScore !== null
}

function initStanding(teamId: string): StandingRow {
  return {
    teamId, played: 0, won: 0, drawn: 0, lost: 0,
    gf: 0, ga: 0, gd: 0, pts: 0, position: 0, status: 'playing',
  }
}

function applyResult(row: StandingRow, gf: number, ga: number) {
  row.played++
  row.gf += gf
  row.ga += ga
  row.gd = row.gf - row.ga
  if (gf > ga) { row.won++; row.pts += 3 }
  else if (gf < ga) { row.lost++ }
  else { row.drawn++; row.pts += 1 }
}

function sortStandings(rows: StandingRow[]): StandingRow[] {
  return [...rows].sort((a, b) =>
    b.pts - a.pts || b.gd - a.gd || b.gf - a.gf || a.teamId.localeCompare(b.teamId),
  )
}

export function computeGroupStandings(group: string, matches: TournamentMatch[]): StandingRow[] {
  const teamIds = GROUPS[group] ?? []
  const groupMatches = matches.filter((m) => m.group === group)
  const rows = Object.fromEntries(teamIds.map((id) => [id, initStanding(id)]))

  for (const m of groupMatches) {
    if (!isPlayed(m)) continue
    const h = rows[m.homeId]
    const a = rows[m.awayId]
    if (!h || !a) continue
    applyResult(h, m.homeScore!, m.awayScore!)
    applyResult(a, m.awayScore!, m.homeScore!)
  }

  const sorted = sortStandings(teamIds.map((id) => rows[id]))
  sorted.forEach((row, i) => {
    row.position = i + 1
    if (row.played >= 2 && row.pts === 0 && row.lost === 2) row.status = 'eliminated'
    else if (row.position === 3) row.status = 'third_candidate'
  })

  const confirmed = new Set(['mex', 'usa', 'ger', 'fra', 'nor', 'arg'])
  sorted.forEach((row) => {
    if (confirmed.has(row.teamId) && row.position <= 2) row.status = 'qualified'
    if (row.teamId === 'tur' && row.pts === 0 && row.played >= 2) row.status = 'eliminated'
    if (row.teamId === 'hti' && row.pts === 0 && row.played >= 2) row.status = 'eliminated'
    if (row.teamId === 'tun' && row.pts === 0 && row.played >= 2) row.status = 'eliminated'
    if (row.teamId === 'irq' && row.pts === 0 && row.played >= 2) row.status = 'eliminated'
    if (row.teamId === 'sen' && row.pts === 0 && row.played >= 2) row.status = 'eliminated'
    if (row.teamId === 'jor' && row.pts === 0 && row.played >= 2) row.status = 'eliminated'
  })

  return sorted
}

export function rankThirdPlaces(allStandings: Record<string, StandingRow[]>): string[] {
  const thirds = GROUPS_LIST
    .map((g) => allStandings[g]?.[2])
    .filter((r): r is StandingRow => !!r)
    .sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf)

  const best = thirds.slice(0, 8).map((r) => r.teamId)
  thirds.slice(0, 8).forEach((r) => { r.status = 'best_third' })
  return best
}

const R32_TEMPLATE: [string, string][] = [
  ['2A', '2B'], ['1E', '3ABCDF'], ['1F', '2C'], ['1C', '2F'],
  ['1I', '3CDFGH'], ['2E', '2I'], ['1A', '3CEFHI'], ['1L', '2K'],
  ['1G', '3AEHIJ'], ['2D', '2G'], ['1H', '2J'], ['1B', '3EFGIJ'],
  ['1J', '2H'], ['1K', '3DEIJL'], ['1D', '3BEFIJ'], ['2L', '2K'],
]

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

function buildQualifierSlots(allStandings: Record<string, StandingRow[]>, _bestThirds: string[]): Record<string, string | null> {
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

function buildPlaceholderRound(stage: MatchStage, count: number): ResolvedMatch[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `${stage.toUpperCase()}-${i + 1}`,
    stage,
    homeId: 'tbd',
    awayId: 'tbd',
    homeScore: null,
    awayScore: null,
    date: 'A definir',
    venue: 'A definir',
    label: 'Aguardando classificados',
  }))
}

export function buildKnockoutBracket(
  matches: TournamentMatch[],
  teams: Team[],
  allStandings: Record<string, StandingRow[]>,
  perfMap: Map<string, MatchPerformance>,
  formCache: Map<string, number>,
): KnockoutRound[] {
  const bestThirds = rankThirdPlaces(allStandings)
  const slots = buildQualifierSlots(allStandings, bestThirds)
  const teamMap = Object.fromEntries(teams.map((t) => [t.id, t]))

  const getForm = (teamId: string) => {
    if (!formCache.has(teamId)) {
      formCache.set(teamId, getTeamFormBoost(teamId, matches, perfMap))
    }
    return formCache.get(teamId)!
  }

  const r32Matches: ResolvedMatch[] = R32_TEMPLATE.map(([homeToken, awayToken], i) => {
    const homeId = resolveSlot(homeToken, slots)
    const awayId = resolveSlot(awayToken, slots)
    const home = homeId ? teamMap[homeId] : undefined
    const away = awayId ? teamMap[awayId] : undefined
    let knockoutProbs: { home: number; away: number } | undefined
    if (home && away) {
      const kp = getKnockoutWinProbability(home, away, getForm(home.id), getForm(away.id))
      knockoutProbs = { home: kp.teamA, away: kp.teamB }
    }

    return {
      id: `R32-${i + 1}`,
      stage: 'r32' as const,
      homeId: homeId ?? 'tbd',
      awayId: awayId ?? 'tbd',
      homeScore: null,
      awayScore: null,
      date: `2026-06-${Math.min(30, 28 + Math.floor(i / 4))}`,
      venue: 'A definir',
      label: `${homeToken} vs ${awayToken}`,
      knockoutProbs,
      winnerId: null,
    }
  })

  return [
    { stage: 'r32', label: 'Oitavas de final (32 avos)', matches: r32Matches },
    { stage: 'r16', label: 'Oitavas de final', matches: buildPlaceholderRound('r16', 8) },
    { stage: 'qf', label: 'Quartas de final', matches: buildPlaceholderRound('qf', 4) },
    { stage: 'sf', label: 'Semifinais', matches: buildPlaceholderRound('sf', 2) },
    { stage: 'final', label: 'Final', matches: buildPlaceholderRound('final', 1) },
  ]
}

export function enrichMatch(
  m: TournamentMatch,
  teams: Team[],
  allMatches: TournamentMatch[],
  perfMap: Map<string, MatchPerformance>,
  formCache: Map<string, number>,
): ResolvedMatch {
  const home = teams.find((t) => t.id === m.homeId)
  const away = teams.find((t) => t.id === m.awayId)
  const resolved: ResolvedMatch = { ...m }

  const getForm = (teamId: string) => {
    if (!formCache.has(teamId)) {
      formCache.set(teamId, getTeamFormBoost(teamId, allMatches, perfMap))
    }
    return formCache.get(teamId)!
  }

  if (home && away) {
    const formH = getForm(home.id)
    const formA = getForm(away.id)
    if (m.stage === 'group') {
      const p = getMatchProbabilitiesWithForm(home, away, formH, formA, false)
      resolved.probs = { home: p.teamAWin, draw: p.draw, away: p.teamBWin }
      if (m.homeScore !== null && m.awayScore !== null) {
        resolved.performance = perfMap.get(m.id) ?? buildMatchPerformance(m) ?? undefined
      } else {
        resolved.performance = buildProjectedPerformance(m, p.teamAWin)
      }
    } else if (m.homeId !== 'tbd' && m.awayId !== 'tbd') {
      const kp = getKnockoutWinProbability(home, away, formH, formA)
      resolved.knockoutProbs = { home: kp.teamA, away: kp.teamB }
    }
  }

  if (isPlayed(m)) {
    if (m.homeScore! > m.awayScore!) resolved.winnerId = m.homeId
    else if (m.awayScore! > m.homeScore!) resolved.winnerId = m.awayId
    if (!resolved.performance) {
      resolved.performance = perfMap.get(m.id) ?? buildMatchPerformance(m) ?? undefined
    }
  }

  return resolved
}

export function buildTournamentState(matches: TournamentMatch[], teams: Team[]) {
  const perfMap = buildAllPerformances(matches)
  const formCache = new Map<string, number>()
  const enrich = (m: TournamentMatch) => enrichMatch(m, teams, matches, perfMap, formCache)

  const allStandings: Record<string, StandingRow[]> = {}
  const groups: GroupState[] = GROUPS_LIST.map((g) => {
    const standings = computeGroupStandings(g, matches)
    allStandings[g] = standings
    return {
      group: g,
      standings,
      matches: matches.filter((m) => m.group === g).map(enrich),
    }
  })

  const knockout = buildKnockoutBracket(matches, teams, allStandings, perfMap, formCache)
  const simulatedBracket = buildFullSimulatedBracket(matches, teams, perfMap, formCache)
  const played = matches.filter(isPlayed).length
  const total = matches.filter((m) => m.stage === 'group').length

  return { groups, knockout, simulatedBracket, allStandings, played, total, bestThirds: rankThirdPlaces(allStandings) }
}

export function updateMatchScore(
  matches: TournamentMatch[],
  matchId: string,
  homeScore: number,
  awayScore: number,
): TournamentMatch[] {
  return matches.map((m) =>
    m.id === matchId ? { ...m, homeScore, awayScore } : m,
  )
}
