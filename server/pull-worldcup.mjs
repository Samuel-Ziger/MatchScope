#!/usr/bin/env node
/**
 * Atualiza dados da Copa via openfootball/worldcup.json (git pull ou download).
 * Cron na VPS: a cada 10 minutos.
 */
import { execSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { loadMatchCatalog, parseWorldCupJson } from './openfootball/parse.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const DATA = join(ROOT, 'data')
const REPO_DIR = join(DATA, 'openfootball-worldcup')
const SYNC_PATH = join(DATA, 'matches-sync.json')
const RAW_CACHE = join(DATA, 'worldcup-2026.json')

const REPO_URL = 'https://github.com/openfootball/worldcup.json.git'
const RAW_URL =
  'https://raw.githubusercontent.com/openfootball/worldcup.json/master/2026/worldcup.json'
const WC_FILE = join(REPO_DIR, '2026', 'worldcup.json')
const YEAR = process.env.WORLDCUP_YEAR || '2026'

function gitPull() {
  mkdirSync(DATA, { recursive: true })

  if (!existsSync(REPO_DIR)) {
    console.log('Clonando openfootball/worldcup.json...')
    execSync(`git clone --depth 1 ${REPO_URL} "${REPO_DIR}"`, { stdio: 'inherit' })
  } else {
    console.log('git pull openfootball/worldcup.json...')
    execSync('git pull --ff-only', { cwd: REPO_DIR, stdio: 'inherit' })
  }

  let commit = 'unknown'
  try {
    commit = execSync('git rev-parse --short HEAD', { cwd: REPO_DIR, encoding: 'utf8' }).trim()
  } catch {
    /* ignora */
  }

  const jsonPath = join(REPO_DIR, YEAR, 'worldcup.json')
  if (!existsSync(jsonPath)) {
    throw new Error(`Arquivo não encontrado: ${YEAR}/worldcup.json`)
  }

  const raw = readFileSync(jsonPath, 'utf8')
  writeFileSync(RAW_CACHE, raw)
  return { raw, commit, source: 'git' }
}

async function fetchRaw() {
  console.log(`Baixando ${RAW_URL}...`)
  const res = await fetch(RAW_URL)
  if (!res.ok) throw new Error(`HTTP ${res.status} ao baixar worldcup.json`)
  const raw = await res.text()
  writeFileSync(RAW_CACHE, raw)
  return { raw, commit: null, source: 'raw' }
}

async function loadWorldCupJson() {
  try {
    return gitPull()
  } catch (err) {
    console.warn(`git pull falhou (${err.message}) — usando download direto`)
    return fetchRaw()
  }
}

async function main() {
  const { raw, commit, source } = await loadWorldCupJson()
  const worldcup = JSON.parse(raw)
  const catalog = loadMatchCatalog(ROOT)
  const { results, goals, stats } = parseWorldCupJson(worldcup, catalog)
  const now = new Date().toISOString()

  const payload = {
    updatedAt: now,
    source: 'openfootball/worldcup.json',
    sourceUrl: 'https://github.com/openfootball/worldcup.json',
    year: YEAR,
    gitCommit: commit,
    fetchMode: source,
    sources: ['openfootball'],
    results,
    goals,
    stats,
  }

  writeFileSync(SYNC_PATH, `${JSON.stringify(payload, null, 2)}\n`)
  console.log(
    `[${now}] matches-sync.json — ${stats.withScore}/${stats.matched} com placar (${stats.matched}/${stats.parsedGroup} jogos de grupo pareados)`,
  )
  if (stats.unmatched > 0) {
    console.warn(`Aviso: ${stats.unmatched} jogos não pareados`, stats.unmatchedSamples)
  }

  try {
    const { spawnSync } = await import('node:child_process')
    const enrich = spawnSync(process.execPath, [join(__dirname, 'enrich-matches.mjs')], {
      cwd: ROOT,
      stdio: 'inherit',
      env: process.env,
    })
    if (enrich.status !== 0) {
      console.warn('enrich-matches falhou — placares openfootball mantidos')
    }
  } catch (err) {
    console.warn(`enrich-matches: ${err.message}`)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
