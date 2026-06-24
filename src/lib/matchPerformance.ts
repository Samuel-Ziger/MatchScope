import type { Player, PlayerPosition } from '../data/squads'
import { getSquadByTeamId } from '../data/squads'
import type { TournamentMatch } from '../data/matches'
import { getCachedMatchEvents } from './apiFootball/eventsCache'

export interface PlayerGoal {
  name: string
  goals: number
  position: PlayerPosition
}

export interface PlayerMatchRating {
  name: string
  rating: number
  position: PlayerPosition
  goals: number
  assists: number
}

export interface SidePerformance {
  scorers: PlayerGoal[]
  players: PlayerMatchRating[]
  teamAvgRating: number
  goals: number
}

export interface MatchPerformance {
  matchId: string
  home: SidePerformance
  away: SidePerformance
  isPlayed: boolean
  projected?: boolean
}

const STAR_RATINGS: Record<string, number> = {
  'Lionel Messi': 8.9, 'Lautaro Martínez': 8.4, 'Julián Álvarez': 8.2, 'Alexis Mac Allister': 8.1,
  'Kylian Mbappé': 9.0, 'Ousmane Dembélé': 8.3, 'Antoine Griezmann': 8.2,
  'Harry Kane': 8.5, 'Jude Bellingham': 8.6, 'Bukayo Saka': 8.3, 'Phil Foden': 8.2,
  'Kevin De Bruyne': 8.5, 'Jeremy Doku': 8.1, 'Romelu Lukaku': 8.0,
  'Pedri': 8.5, 'Lamine Yamal': 8.8, 'Nico Williams': 8.3,
  'Florian Wirtz': 8.6, 'Jamal Musiala': 8.7, 'Joshua Kimmich': 8.2,
  'Vinícius Júnior': 8.8, 'Rodrygo': 8.1, 'Raphinha': 8.0,
  'Bernardo Silva': 8.4, 'Bruno Fernandes': 8.2,
  'Mohamed Salah': 8.6,
  'Robert Lewandowski': 8.4, 'Leroy Sané': 8.1,
  'Achraf Hakimi': 8.2,
  'Christian Pulisic': 8.1,
  'Erling Haaland': 8.9, 'Martin Ødegaard': 8.3,
  'Heung-min Son': 8.3, 'Kim Min-jae': 8.0,
  'Alisson Becker': 8.2, 'Marquinhos': 8.1,
  'Enzo Fernández': 8.0, 'Rodrigo De Paul': 7.9,
  'Hirving Lozano': 7.8, 'Raúl Jiménez': 7.7,
  'Thibaut Courtois': 8.0,
  'Granit Xhaka': 7.9, 'Breel Embolo': 7.8,
  'Declan Rice': 8.1,
  'Federico Valverde': 8.3, 'Darwin Núñez': 8.0,
  'Luis Díaz': 8.1, 'James Rodríguez': 7.9,
  'Victor Osimhen': 8.2,
  'Riyad Mahrez': 8.0,
}

const POS_BASE: Record<PlayerPosition, number> = { GK: 6.6, DF: 6.8, MF: 7.0, FW: 7.2 }

function hashStr(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0
  return Math.abs(h)
}

export function getPlayerBaseRating(player: Player): number {
  if (STAR_RATINGS[player.name]) return STAR_RATINGS[player.name]
  const variance = (hashStr(player.name) % 10) / 10 - 0.3
  return Math.round((POS_BASE[player.position] + variance) * 10) / 10
}

function scorersFromApiNames(names: string[], teamId: string): PlayerGoal[] {
  const squad = getSquadByTeamId(teamId)
  const counts = new Map<string, number>()
  for (const name of names) {
    counts.set(name, (counts.get(name) ?? 0) + 1)
  }
  return [...counts.entries()]
    .map(([name, goals]) => {
      const pl = squad?.players.find(
        (p) => p.name === name || p.name.split(' ').pop() === name.split(' ').pop(),
      )
      return {
        name: pl?.name ?? name,
        goals,
        position: pl?.position ?? 'FW',
      }
    })
    .sort((a, b) => b.goals - a.goals)
}

function pickScorers(teamId: string, goals: number, seed: string, apiNames?: string[]): PlayerGoal[] {
  if (goals === 0) return []
  if (apiNames && apiNames.length > 0) return scorersFromApiNames(apiNames, teamId).slice(0, goals)
  const squad = getSquadByTeamId(teamId)
  if (!squad) return []

  const weights = squad.players.map((pl) => ({
    pl,
    w: pl.position === 'FW' ? 5 : pl.position === 'MF' ? 3 : pl.position === 'DF' ? 1 : 0.3,
  }))
  const totalW = weights.reduce((s, x) => s + x.w, 0)

  const scorers: PlayerGoal[] = []
  let remaining = goals
  let i = 0
  while (remaining > 0 && i < 20) {
    const roll = (hashStr(`${seed}-${i}`) % 1000) / 1000
    let acc = 0
    let picked = weights[0]
    for (const w of weights) {
      acc += w.w / totalW
      if (roll <= acc) { picked = w; break }
    }
    const existing = scorers.find((s) => s.name === picked.pl.name)
    if (existing) existing.goals++
    else scorers.push({ name: picked.pl.name, goals: 1, position: picked.pl.position })
    remaining--
    i++
  }
  return scorers.sort((a, b) => b.goals - a.goals)
}

function buildSidePerformance(
  teamId: string,
  goals: number,
  conceded: number,
  won: boolean,
  drew: boolean,
  seed: string,
  apiScorerNames?: string[],
): SidePerformance {
  const squad = getSquadByTeamId(teamId)
  const scorers = pickScorers(teamId, goals, seed, apiScorerNames)

  const players: PlayerMatchRating[] = []
  if (squad) {
    const scorerMap = Object.fromEntries(scorers.map((s) => [s.name, s.goals]))
    for (const pl of squad.players) {
      const base = getPlayerBaseRating(pl)
      const g = scorerMap[pl.name] ?? 0
      const playedChance = pl.position === 'GK' ? 0.15 : pl.position === 'DF' ? 0.55 : 0.7
      if ((hashStr(`${seed}-${pl.name}`) % 100) / 100 > playedChance) continue

      let rating = base + (hashStr(`${seed}-r-${pl.name}`) % 12) / 10 - 0.5
      if (g > 0) rating += g * 0.85
      if (won) rating += 0.35
      else if (!drew) rating -= 0.45
      if (pl.position === 'GK' && conceded === 0 && goals >= 0) rating += goals > 0 ? 0.9 : 0.4
      else if (pl.position === 'GK') rating -= conceded * 0.15
      rating = Math.max(4.5, Math.min(10, Math.round(rating * 10) / 10))

      const assists = g === 0 && pl.position !== 'GK' && (hashStr(`${seed}-a-${pl.name}`) % 5) === 0 ? 1 : 0
      players.push({ name: pl.name, rating, position: pl.position, goals: g, assists })
    }
  }

  players.sort((a, b) => b.rating - a.rating)
  const top = players.slice(0, 11)
  const teamAvgRating = top.length
    ? top.reduce((s, p) => s + p.rating, 0) / top.length
    : 6.5

  return { scorers, players: top, teamAvgRating, goals }
}

export function buildMatchPerformance(match: TournamentMatch): MatchPerformance | null {
  const played = match.homeScore !== null && match.awayScore !== null
  if (!played) return null

  const hs = match.homeScore!
  const as = match.awayScore!
  const homeWon = hs > as
  const awayWon = as > hs
  const drew = hs === as
  const apiEvents = getCachedMatchEvents(match.id)

  return {
    matchId: match.id,
    isPlayed: true,
    projected: false,
    home: buildSidePerformance(match.homeId, hs, as, homeWon, drew, `${match.id}-h`, apiEvents?.homeScorers),
    away: buildSidePerformance(match.awayId, as, hs, awayWon, drew, `${match.id}-a`, apiEvents?.awayScorers),
  }
}

export function buildProjectedPerformance(
  match: TournamentMatch,
  homeWinProb: number,
): MatchPerformance {
  const pickTop = (teamId: string, n: number, boost: number) => {
    const sq = getSquadByTeamId(teamId)
    if (!sq) return []
    return [...sq.players]
      .map((pl) => ({
        name: pl.name,
        rating: Math.round((getPlayerBaseRating(pl) + boost) * 10) / 10,
        position: pl.position,
        goals: 0,
        assists: 0,
      }))
      .sort((a, b) => b.rating - a.rating)
      .slice(0, n)
  }

  const homeFav = homeWinProb >= 50
  const homeTop = pickTop(match.homeId, 11, homeFav ? 0.15 : -0.1)
  const awayTop = pickTop(match.awayId, 11, !homeFav ? 0.15 : -0.1)

  return {
    matchId: match.id,
    isPlayed: false,
    projected: true,
    home: {
      scorers: [],
      players: homeTop.slice(0, 3),
      teamAvgRating: homeTop.reduce((s, p) => s + p.rating, 0) / (homeTop.length || 1),
      goals: 0,
    },
    away: {
      scorers: [],
      players: awayTop.slice(0, 3),
      teamAvgRating: awayTop.reduce((s, p) => s + p.rating, 0) / (awayTop.length || 1),
      goals: 0,
    },
  }
}

export function getTeamFormBoost(
  teamId: string,
  matches: TournamentMatch[],
  perfMap: Map<string, MatchPerformance>,
): number {
  const recent = matches.filter(
    (m) =>
      m.stage === 'group' &&
      (m.homeId === teamId || m.awayId === teamId) &&
      m.homeScore !== null &&
      m.awayScore !== null,
  )

  if (recent.length === 0) return 0

  let form = 0
  for (const m of recent) {
    const perf = perfMap.get(m.id)
    if (!perf) continue
    const side = m.homeId === teamId ? perf.home : perf.away
    const won =
      (m.homeId === teamId && m.homeScore! > m.awayScore!) ||
      (m.awayId === teamId && m.awayScore! > m.homeScore!)
    form += (side.teamAvgRating - 6.8) * 12
    form += side.goals * 4
    if (won) form += 18
    else if (m.homeScore === m.awayScore) form += 4
    else form -= 10
  }
  return form / recent.length
}

export function shortPlayerName(name: string): string {
  const parts = name.split(' ')
  if (parts.length === 1) return parts[0].slice(0, 10)
  return parts[parts.length - 1].slice(0, 12)
}

export function buildAllPerformances(matches: TournamentMatch[]): Map<string, MatchPerformance> {
  const map = new Map<string, MatchPerformance>()
  for (const m of matches) {
    const perf = buildMatchPerformance(m)
    if (perf) map.set(m.id, perf)
  }
  return map
}

export function ratingColor(r: number): string {
  if (r >= 8.5) return 'text-positive'
  if (r >= 7.5) return 'text-brand'
  if (r >= 6.5) return 'text-text-secondary'
  return 'text-negative'
}
