/**
 * Enriquece matches-sync.json com football-data.org e API-Football (VPS/cron).
 * Prioridade: API-Football > football-data.org > openfootball (já no arquivo).
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { loadEnvFile } from './load-env.mjs'
import { resolveOddsTeamName } from './team-names.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const DATA = join(ROOT, 'data')
const SYNC_PATH = join(DATA, 'matches-sync.json')
const CATALOG_PATH = join(DATA, 'match-catalog.json')

const WC_LEAGUE_ID = 1
const FDO_FINISHED = new Set(['FINISHED', 'AWARDED'])
const FDO_LIVE = new Set(['IN_PLAY', 'PAUSED', 'LIVE'])
const AF_FINISHED = new Set(['FT', 'AET', 'PEN'])
const AF_LIVE = new Set(['1H', 'HT', '2H', 'ET', 'BT', 'P', 'LIVE', 'INT'])

const TLA_TO_TEAM_ID = {
  CIV: 'civ', COD: 'cod', HAI: 'hti', CPV: 'cpv', BIH: 'bih', CUW: 'cuw', KOR: 'kor',
  USA: 'usa', NED: 'ned', SUI: 'sui', RSA: 'rsa', GER: 'ger', ENG: 'eng', POR: 'por',
  FRA: 'fra', ARG: 'arg', ESP: 'esp', BRA: 'bra', MEX: 'mex', COL: 'col', CRO: 'cro',
  GHA: 'gha', PAN: 'pan', UZB: 'uzb', NOR: 'nor', SEN: 'sen', JOR: 'jor', ALG: 'alg',
  IRQ: 'irq', AUT: 'aut', URU: 'uru', IRN: 'irn', NZL: 'nzl', BEL: 'bel', EGY: 'egy',
  KSA: 'ksa', SWE: 'swe', TUN: 'tun', JPN: 'jpn', MAR: 'mar', SCO: 'sco', HTI: 'hti',
  AUS: 'aus', TUR: 'tur', ECU: 'ecu', CAN: 'can', QAT: 'qat', CZE: 'cze', PAR: 'par',
}

loadEnvFile(ROOT)

function shiftDate(iso, days) {
  const d = new Date(`${iso}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

function pairKey(homeId, awayId, date) {
  return `${date}|${homeId}|${awayId}`
}

function loadCatalog() {
  if (!existsSync(CATALOG_PATH)) return []
  return JSON.parse(readFileSync(CATALOG_PATH, 'utf8'))
}

function buildPairIndex(catalog) {
  const map = new Map()
  for (const m of catalog) {
    map.set(pairKey(m.homeId, m.awayId, m.date), m.id)
  }
  return map
}

function resolveTla(tla, name) {
  if (tla && TLA_TO_TEAM_ID[tla]) return TLA_TO_TEAM_ID[tla]
  return resolveOddsTeamName(name)
}

function findMatchId(homeId, awayId, apiDate, byPair) {
  if (!homeId || !awayId) return null
  for (const offset of [0, -1, 1]) {
    const id = byPair.get(pairKey(homeId, awayId, shiftDate(apiDate, offset)))
    if (id) return id
  }
  return null
}

function applyLayerResults(results, matchScores, priority, matchIds, sourceName) {
  let touched = 0
  for (const [matchId, score] of Object.entries(matchScores)) {
    const prev = matchIds.get(matchId)
    if (!prev || priority >= prev.priority) {
      results[matchId] = score
      matchIds.set(matchId, { priority, source: sourceName })
      touched++
    }
  }
  return touched
}

async function fetchFootballData() {
  const token = process.env.FOOTBALL_DATA_TOKEN
  if (!token) return { pending: [], source: 'football-data.org', skipped: true }

  const res = await fetch('https://api.football-data.org/v4/competitions/WC/matches?season=2026', {
    headers: { 'X-Auth-Token': token },
  })
  if (!res.ok) {
    console.warn(`football-data.org HTTP ${res.status}`)
    return { layer: {}, source: 'football-data.org', error: res.status }
  }

  const data = await res.json()
  const pending = []
  for (const m of data.matches ?? []) {
    if (!FDO_FINISHED.has(m.status) && !FDO_LIVE.has(m.status)) continue
    const hs = m.score?.fullTime?.home
    const as = m.score?.fullTime?.away
    if (hs === null || hs === undefined || as === null || as === undefined) continue
    pending.push({ m, hs, as })
  }
  return { pending, source: 'football-data.org' }
}

async function fetchApiFootballDates(dates) {
  const key = process.env.API_FOOTBALL_KEY
  if (!key) return []

  const fixtures = []
  const headers = { 'x-apisports-key': key }

  const liveRes = await fetch('https://v3.football.api-sports.io/fixtures?live=all', { headers })
  if (liveRes.ok) {
    const live = await liveRes.json()
    for (const f of live.response ?? []) {
      if (f.league?.id === WC_LEAGUE_ID) fixtures.push(f)
    }
  }

  for (const date of dates) {
    const res = await fetch(`https://v3.football.api-sports.io/fixtures?date=${date}`, { headers })
    if (!res.ok) continue
    const data = await res.json()
    for (const f of data.response ?? []) {
      if (f.league?.id === WC_LEAGUE_ID) fixtures.push(f)
    }
  }

  return fixtures
}

async function main() {
  if (!existsSync(SYNC_PATH)) {
    console.warn('matches-sync.json ausente — rode pull-worldcup primeiro')
    return
  }

  const payload = JSON.parse(readFileSync(SYNC_PATH, 'utf8'))
  const results = { ...(payload.results ?? {}) }
  const matchIds = new Map()
  const sources = new Set(payload.sources ?? ['openfootball'])

  for (const [matchId] of Object.entries(results)) {
    matchIds.set(matchId, { priority: 1, source: 'openfootball' })
  }

  const catalog = loadCatalog()
  const byPair = buildPairIndex(catalog)
  const notes = []

  const fdo = await fetchFootballData()
  if (!fdo.skipped && fdo.pending?.length) {
    const layer = {}
    for (const { m, hs, as } of fdo.pending) {
      const homeId = resolveTla(m.homeTeam?.tla, m.homeTeam?.name ?? '')
      const awayId = resolveTla(m.awayTeam?.tla, m.awayTeam?.name ?? '')
      const matchId = findMatchId(homeId, awayId, m.utcDate?.slice(0, 10) ?? '', byPair)
      if (matchId) layer[matchId] = [hs, as]
    }
    if (Object.keys(layer).length > 0) {
      applyLayerResults(results, layer, 2, matchIds, fdo.source)
      sources.add('football-data.org')
      notes.push(`${Object.keys(layer).length} football-data.org`)
    }
  } else if (fdo.skipped) {
    notes.push('football-data.org: sem token')
  }

  const today = new Date().toISOString().slice(0, 10)
  const yesterday = shiftDate(today, -1)
  const afFixtures = await fetchApiFootballDates([today, yesterday])
  if (process.env.API_FOOTBALL_KEY && afFixtures.length > 0) {
    const layer = {}
    for (const f of afFixtures) {
      const status = f.fixture?.status?.short
      if (!AF_FINISHED.has(status) && !AF_LIVE.has(status)) continue
      const hs = f.goals?.home
      const as = f.goals?.away
      if (hs === null || hs === undefined || as === null || as === undefined) continue
      const homeId = resolveOddsTeamName(f.teams?.home?.name ?? '')
      const awayId = resolveOddsTeamName(f.teams?.away?.name ?? '')
      const matchId = findMatchId(homeId, awayId, f.fixture?.date?.slice(0, 10) ?? '', byPair)
      if (matchId) layer[matchId] = [hs, as]
    }
    if (Object.keys(layer).length > 0) {
      applyLayerResults(results, layer, 3, matchIds, 'api-football')
      sources.add('api-football')
      notes.push(`${Object.keys(layer).length} API-Football`)
    }
  } else if (!process.env.API_FOOTBALL_KEY) {
    notes.push('API-Football: sem chave')
  }

  const withScore = Object.keys(results).length
  const now = new Date().toISOString()

  writeFileSync(
    SYNC_PATH,
    `${JSON.stringify(
      {
        ...payload,
        updatedAt: now,
        enrichedAt: now,
        sources: [...sources],
        results,
        stats: {
          ...(payload.stats ?? {}),
          withScore,
        },
      },
      null,
      2,
    )}\n`,
  )

  console.log(
    `[${now}] enrich — ${withScore} placares · fontes: ${[...sources].join(', ')}${notes.length ? ` · ${notes.join(', ')}` : ''}`,
  )
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
