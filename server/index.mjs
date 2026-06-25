/**
 * Servidor de produção para VPS: estáticos (dist/) + proxies de API + odds.json
 */
import { createReadStream, existsSync, readFileSync, statSync } from 'node:fs'
import { createServer } from 'node:http'
import { dirname, extname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { loadEnvFile } from './load-env.mjs'
import { createVotesHandler, handleVotesAdmin } from './votes-http.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const DIST = join(ROOT, 'dist')
const DATA = join(ROOT, 'data')
const ODDS_PATH = join(DATA, 'odds.json')
const MATCHES_SYNC_PATH = join(DATA, 'matches-sync.json')
const PORT = Number(process.env.PORT) || 3000

loadEnvFile(ROOT)

const handleVotes = createVotesHandler(DATA)

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.png': 'image/png',
  '.woff2': 'font/woff2',
}

function sendJson(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' })
  res.end(JSON.stringify(body))
}

async function proxyFootballData(reqPath, res) {
  const token = process.env.FOOTBALL_DATA_TOKEN
  if (!token) {
    sendJson(res, 500, { message: 'FOOTBALL_DATA_TOKEN não configurado' })
    return
  }

  const path = reqPath.replace(/^\/api\/football-data/, '/v4')
  try {
    const upstream = await fetch(`https://api.football-data.org${path}`, {
      headers: { 'X-Auth-Token': token },
    })
    const body = await upstream.text()
    res.writeHead(upstream.status, {
      'Content-Type': upstream.headers.get('content-type') ?? 'application/json',
    })
    res.end(body)
  } catch {
    sendJson(res, 502, { message: 'Erro ao contactar football-data.org' })
  }
}

async function proxyApiFootball(reqPath, req, res) {
  const apiKey = process.env.API_FOOTBALL_KEY
  if (!apiKey) {
    sendJson(res, 500, { message: 'API_FOOTBALL_KEY não configurado' })
    return
  }

  const path = reqPath.replace(/^\/api\/football/, '')
  const url = `https://v3.football.api-sports.io${path}`

  try {
    const headers = { 'x-apisports-key': apiKey }
    if (req.method === 'POST') headers['Content-Type'] = 'application/json'

    const upstream = await fetch(url, { method: req.method, headers })
    const body = await upstream.text()
    res.writeHead(upstream.status, {
      'Content-Type': upstream.headers.get('content-type') ?? 'application/json',
    })
    res.end(body)
  } catch {
    sendJson(res, 502, { message: 'Erro ao contactar API-Football' })
  }
}

async function proxyWorldCup26(reqPath, res) {
  const path = reqPath.replace(/^\/api\/worldcup26/, '')
  const url = `https://worldcup26.ir${path}`

  try {
    const upstream = await fetch(url)
    const body = await upstream.text()
    res.writeHead(upstream.status, {
      'Content-Type': upstream.headers.get('content-type') ?? 'application/json',
      'Cache-Control': 'no-cache',
    })
    res.end(body)
  } catch {
    sendJson(res, 502, { message: 'Erro ao contactar worldcup26.ir' })
  }
}

function serveDataJson(res, filePath, emptyBody) {
  const body = existsSync(filePath) ? readFileSync(filePath, 'utf8') : emptyBody
  res.writeHead(200, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-cache',
  })
  res.end(body)
}

function serveOddsJson(res) {
  serveDataJson(res, ODDS_PATH, '{"updatedAt":null,"slot":null,"byTeamId":{}}')
}

function serveMatchesSyncJson(res) {
  serveDataJson(
    res,
    MATCHES_SYNC_PATH,
    '{"updatedAt":null,"source":"openfootball/worldcup.json","results":{}}',
  )
}

function serveStatic(urlPath, res) {
  let filePath = join(DIST, urlPath === '/' ? 'index.html' : urlPath)

  if (!existsSync(filePath) || !statSync(filePath).isFile()) {
    filePath = join(DIST, 'index.html')
    if (!existsSync(filePath)) {
      res.writeHead(503, { 'Content-Type': 'text/plain; charset=utf-8' })
      res.end('Build não encontrado — execute npm run build')
      return
    }
  }

  const ext = extname(filePath)
  res.writeHead(200, { 'Content-Type': MIME[ext] ?? 'application/octet-stream' })
  createReadStream(filePath).pipe(res)
}

createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', `http://${req.headers.host}`)

  if (url.pathname.startsWith('/api/football-data')) {
    await proxyFootballData(url.pathname + url.search, res)
    return
  }

  if (url.pathname.startsWith('/api/worldcup26')) {
    await proxyWorldCup26(url.pathname + url.search, res)
    return
  }

  if (url.pathname.startsWith('/api/football')) {
    await proxyApiFootball(url.pathname + url.search, req, res)
    return
  }

  if (url.pathname === '/data/odds.json') {
    serveOddsJson(res)
    return
  }

  if (url.pathname === '/data/matches-sync.json') {
    serveMatchesSyncJson(res)
    return
  }

  if (url.pathname.startsWith('/api/votes')) {
    if (url.pathname === '/api/votes/export' && req.method === 'GET') {
      handleVotesAdmin(req, res, DATA)
      return
    }
    await handleVotes(req, res)
    return
  }

  serveStatic(url.pathname, res)
}).listen(PORT, () => {
  console.log(`MatchScope — http://0.0.0.0:${PORT}`)
})
