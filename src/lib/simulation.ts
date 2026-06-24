import type { Team } from '../data/teams'

export interface SimulationResult {
  teamId: string
  winProb: number
  semifinalProb: number
  quarterfinalProb: number
  roundOf16Prob: number
}

export interface HeadToHeadResult {
  teamAWin: number
  draw: number
  teamBWin: number
}

export interface SimulationConfig {
  iterations: number
  homeAdvantage: number
  randomness: number
  useMarketBlend: number
}

const DEFAULT_CONFIG: SimulationConfig = {
  iterations: 10000,
  homeAdvantage: 50,
  randomness: 350,
  useMarketBlend: 0.4,
}

function eloWinProbability(eloA: number, eloB: number, homeAdv = 0): number {
  const diff = eloA - eloB + homeAdv
  return 1 / (1 + Math.pow(10, -diff / 400))
}

export function getMatchProbabilitiesWithForm(
  teamA: Team,
  teamB: Team,
  formBoostA = 0,
  formBoostB = 0,
  knockout = false,
): HeadToHeadResult {
  const probA = eloWinProbability(teamA.elo + formBoostA, teamB.elo + formBoostB)
  const drawBase = knockout ? 0.08 : 0.22
  const winA = probA * (1 - drawBase)
  const winB = (1 - probA) * (1 - drawBase)
  const draw = drawBase
  const total = winA + winB + draw
  return {
    teamAWin: (winA / total) * 100,
    draw: (draw / total) * 100,
    teamBWin: (winB / total) * 100,
  }
}

export function getMatchProbabilities(
  teamA: Team,
  teamB: Team,
  knockout = false,
): HeadToHeadResult {
  return getMatchProbabilitiesWithForm(teamA, teamB, 0, 0, knockout)
}

export function getKnockoutWinProbability(
  teamA: Team,
  teamB: Team,
  formBoostA = 0,
  formBoostB = 0,
): { teamA: number; teamB: number } {
  const p = eloWinProbability(teamA.elo + formBoostA, teamB.elo + formBoostB)
  return { teamA: p * 100, teamB: (1 - p) * 100 }
}

function simulateMatch(teamA: Team, teamB: Team, config: SimulationConfig, homeTeam?: string): 'A' | 'B' | 'D' {
  const homeAdv = homeTeam === teamA.id ? config.homeAdvantage : homeTeam === teamB.id ? -config.homeAdvantage : 0
  const randomFactor = (Math.random() - 0.5) * config.randomness
  const probA = eloWinProbability(teamA.elo + randomFactor, teamB.elo, homeAdv)

  const roll = Math.random()
  if (roll < probA * 0.88) return 'A'
  if (roll < probA * 0.88 + 0.12) return 'D'
  return 'B'
}

function pickWinner(teamA: Team, teamB: Team, config: SimulationConfig): Team {
  let scoreA = 0
  let scoreB = 0

  for (let i = 0; i < 3; i++) {
    const result = simulateMatch(teamA, teamB, config)
    if (result === 'A') scoreA++
    else if (result === 'B') scoreB++
    else {
      scoreA += Math.random() > 0.5 ? 1 : 0
      scoreB += Math.random() > 0.5 ? 1 : 0
    }
    if (scoreA >= 2 || scoreB >= 2) break
  }

  if (scoreA === scoreB) return Math.random() > eloWinProbability(teamA.elo, teamB.elo) ? teamB : teamA
  return scoreA > scoreB ? teamA : teamB
}

function blendWithMarket(eloResults: SimulationResult[], teams: Team[], blend: number): SimulationResult[] {
  const totalMarket = teams.reduce((s, t) => s + t.market.aggregate, 0)

  return eloResults.map((r) => {
    const team = teams.find((t) => t.id === r.teamId)!
    const marketNorm = (team.market.aggregate / totalMarket) * 100
    const r16Boost = team.tournament.reachR16 / 100

    return {
      ...r,
      winProb: r.winProb * (1 - blend) + marketNorm * blend,
      semifinalProb: (r.semifinalProb * (1 - blend * 0.5) + marketNorm * blend * 1.2) * (0.8 + r16Boost * 0.2),
      quarterfinalProb: (r.quarterfinalProb * (1 - blend * 0.3) + marketNorm * blend * 1.8) * (0.8 + r16Boost * 0.2),
      roundOf16Prob: Math.min(99, team.tournament.reachR16 * 0.6 + r.roundOf16Prob * 0.4),
    }
  })
}

export function runMonteCarloSimulation(
  teams: Team[],
  config: Partial<SimulationConfig> = {},
): SimulationResult[] {
  const cfg = { ...DEFAULT_CONFIG, ...config }
  const wins: Record<string, number> = {}
  const semis: Record<string, number> = {}
  const quarters: Record<string, number> = {}
  const r16: Record<string, number> = {}

  teams.forEach((t) => {
    wins[t.id] = 0
    semis[t.id] = 0
    quarters[t.id] = 0
    r16[t.id] = 0
  })

  const pool = [...teams].sort((a, b) => b.elo - a.elo).slice(0, Math.min(teams.length, 24))

  for (let i = 0; i < cfg.iterations; i++) {
    const shuffled = [...pool].sort(() => Math.random() - 0.5)
    let remaining = shuffled.slice(0, 16)

    for (let round = 0; round < 4 && remaining.length > 1; round++) {
      const nextRound: Team[] = []
      for (let j = 0; j < remaining.length; j += 2) {
        if (j + 1 < remaining.length) {
          const winner = pickWinner(remaining[j], remaining[j + 1], cfg)
          nextRound.push(winner)
          if (round === 0) r16[winner.id]++
          if (round === 1) quarters[winner.id]++
          if (round === 2) semis[winner.id]++
        } else {
          nextRound.push(remaining[j])
        }
      }
      remaining = nextRound
    }

    if (remaining.length > 0) wins[remaining[0].id]++
  }

  const results: SimulationResult[] = teams.map((t) => ({
    teamId: t.id,
    winProb: pool.some((p) => p.id === t.id) ? (wins[t.id] / cfg.iterations) * 100 : t.market.aggregate * 0.1,
    semifinalProb: pool.some((p) => p.id === t.id) ? (semis[t.id] / cfg.iterations) * 100 : t.tournament.reachR16 * 0.15,
    quarterfinalProb: pool.some((p) => p.id === t.id) ? (quarters[t.id] / cfg.iterations) * 100 : t.tournament.reachR16 * 0.25,
    roundOf16Prob: t.tournament.reachR16,
  }))

  return blendWithMarket(results, teams, cfg.useMarketBlend)
}

export function simulateHeadToHead(
  teamA: Team,
  teamB: Team,
  iterations = 5000,
  config: Partial<SimulationConfig> = {},
): HeadToHeadResult {
  const cfg = { ...DEFAULT_CONFIG, ...config }
  let winsA = 0
  let draws = 0
  let winsB = 0

  for (let i = 0; i < iterations; i++) {
    const result = simulateMatch(teamA, teamB, cfg)
    if (result === 'A') winsA++
    else if (result === 'B') winsB++
    else draws++
  }

  return {
    teamAWin: (winsA / iterations) * 100,
    draw: (draws / iterations) * 100,
    teamBWin: (winsB / iterations) * 100,
  }
}

export function probToDecimalOdds(prob: number): number {
  if (prob <= 0) return 999
  return 100 / prob
}

export function probToAmericanOdds(prob: number): string {
  const decimal = probToDecimalOdds(prob)
  if (decimal >= 2) return `+${Math.round((decimal - 1) * 100)}`
  return `${Math.round(-100 / (decimal - 1))}`
}

export function formatPct(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`
}

export function formatMomentum(value: number): string {
  const sign = value > 0 ? '+' : ''
  return `${sign}${value.toFixed(1)}%`
}
