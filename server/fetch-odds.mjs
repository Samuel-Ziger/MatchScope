#!/usr/bin/env node
/**
 * Busca odds na The Odds API e grava em data/odds.json.
 * Chamado pelo cron da VPS (4×/dia) — não roda no navegador.
 *
 * Uso: node server/fetch-odds.mjs [morning|afternoon|evening|night]
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { loadEnvFile } from './load-env.mjs'
import { applyMomentum, parseWinnerOdds } from './parse-odds.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const ODDS_PATH = join(ROOT, 'data', 'odds.json')
const SPORT = 'soccer_fifa_world_cup_winner'

const VALID_SLOTS = new Set(['morning', 'afternoon', 'evening', 'night'])
const slot = VALID_SLOTS.has(process.argv[2]) ? process.argv[2] : 'manual'

loadEnvFile(ROOT)

async function main() {
  const apiKey = process.env.THE_ODDS_API_KEY
  if (!apiKey) {
    console.error('THE_ODDS_API_KEY não definida (.env ou variável de ambiente)')
    process.exit(1)
  }

  const params = new URLSearchParams({
    regions: 'us,eu',
    markets: 'outrights',
    oddsFormat: 'decimal',
    apiKey,
  })

  const url = `https://api.the-odds-api.com/v4/sports/${SPORT}/odds?${params}`
  const res = await fetch(url)
  const remaining = res.headers.get('x-requests-remaining')
  const remainingNum = remaining ? Number(remaining) : undefined

  if (res.status === 429) {
    console.error('Limite de requisições The Odds API atingido')
    process.exit(1)
  }

  if (!res.ok) {
    const body = await res.text()
    console.error(`The Odds API HTTP ${res.status}: ${body.slice(0, 200)}`)
    process.exit(1)
  }

  const data = await res.json()
  if (!Array.isArray(data) || data.length === 0) {
    console.error('The Odds API não retornou mercados de vencedor')
    process.exit(1)
  }

  let previous = undefined
  if (existsSync(ODDS_PATH)) {
    try {
      const existing = JSON.parse(readFileSync(ODDS_PATH, 'utf8'))
      previous = existing.byTeamId
    } catch {
      /* ignora cache corrompido */
    }
  }

  const parsed = parseWinnerOdds(data)
  const withMomentum = applyMomentum(parsed, previous)
  const now = new Date()

  const cache = {
    updatedAt: now.toISOString(),
    slot,
    remaining: remainingNum,
    byTeamId: withMomentum,
  }

  mkdirSync(dirname(ODDS_PATH), { recursive: true })
  writeFileSync(ODDS_PATH, `${JSON.stringify(cache, null, 2)}\n`, 'utf8')

  const count = Object.keys(withMomentum).length
  console.log(
    `[${now.toISOString()}] Odds salvas — slot=${slot}, seleções=${count}, restantes=${remainingNum ?? '?'}`,
  )
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
