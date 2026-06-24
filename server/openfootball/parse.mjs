import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { resolveOddsTeamName } from '../team-names.mjs'

function shiftDate(iso, days) {
  const d = new Date(`${iso}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

function pairKey(homeId, awayId, date) {
  return `${date}|${homeId}|${awayId}`
}

function buildCatalogIndex(catalog) {
  const byPair = new Map()
  for (const m of catalog) {
    byPair.set(pairKey(m.homeId, m.awayId, m.date), m)
    byPair.set(pairKey(m.awayId, m.homeId, m.date), m)
  }
  return byPair
}

function findCatalogMatch(team1, team2, date, byPair) {
  const homeId = resolveOddsTeamName(team1)
  const awayId = resolveOddsTeamName(team2)
  if (!homeId || !awayId) return null

  for (const offset of [0, -1, 1]) {
    const d = shiftDate(date, offset)
    const forward = byPair.get(pairKey(homeId, awayId, d))
    if (forward) return { match: forward, homeId, awayId, flipped: false }
    const reverse = byPair.get(pairKey(awayId, homeId, d))
    if (reverse) return { match: reverse, homeId, awayId, flipped: true }
  }
  return null
}

function parseScore(score, flipped) {
  if (!score?.ft || score.ft.length !== 2) return null
  const [a, b] = score.ft
  return flipped ? [b, a] : [a, b]
}

export function parseWorldCupJson(worldcup, catalog) {
  const byPair = buildCatalogIndex(catalog)
  const results = {}
  const goals = {}
  let parsedGroup = 0
  let matched = 0
  let withScore = 0
  const unmatched = []

  for (const row of worldcup.matches ?? []) {
    if (!row.group?.startsWith('Group ')) continue
    parsedGroup++

    const hit = findCatalogMatch(row.team1, row.team2, row.date, byPair)
    if (!hit) {
      unmatched.push(`${row.date} ${row.team1} vs ${row.team2}`)
      continue
    }

    matched++
    const { match, flipped } = hit
    const score = parseScore(row.score, flipped)
    if (score) {
      results[match.id] = score
      withScore++
      goals[match.id] = {
        home: flipped ? (row.goals2 ?? []) : (row.goals1 ?? []),
        away: flipped ? (row.goals1 ?? []) : (row.goals2 ?? []),
      }
    }
  }

  return {
    results,
    goals,
    stats: { parsedGroup, matched, withScore, unmatched: unmatched.length, unmatchedSamples: unmatched.slice(0, 5) },
  }
}

export function loadMatchCatalog(rootDir) {
  const path = join(rootDir, 'data', 'match-catalog.json')
  return JSON.parse(readFileSync(path, 'utf8'))
}
