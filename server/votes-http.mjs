import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { castVote, loadVotesStore, publicSnapshot } from './votes-store.mjs'

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    req.on('data', (c) => chunks.push(c))
    req.on('end', () => {
      try {
        const raw = Buffer.concat(chunks).toString('utf8')
        resolve(raw ? JSON.parse(raw) : {})
      } catch {
        reject(new Error('JSON inválido'))
      }
    })
    req.on('error', reject)
  })
}

function clientIp(req) {
  const fwd = req.headers['x-forwarded-for']
  if (typeof fwd === 'string' && fwd.length > 0) return fwd.split(',')[0].trim()
  return req.socket?.remoteAddress ?? 'unknown'
}

export function createVotesHandler(dataDir) {
  return async function handleVotes(req, res) {
    const url = new URL(req.url ?? '/', 'http://localhost')

    if (url.pathname === '/api/votes' && req.method === 'GET') {
      const store = loadVotesStore(dataDir)
      const body = publicSnapshot(store)
      res.writeHead(200, {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store',
      })
      res.end(JSON.stringify(body))
      return
    }

    if (url.pathname === '/api/votes' && req.method === 'POST') {
      try {
        const payload = await readBody(req)
        const result = castVote(
          dataDir,
          { teamId: payload.teamId, voterId: payload.voterId },
          clientIp(req),
        )
        res.writeHead(result.status, {
          'Content-Type': 'application/json; charset=utf-8',
          'Cache-Control': 'no-store',
        })
        res.end(
          JSON.stringify({
            ok: result.ok,
            message: result.message,
            teamId: result.teamId,
            changed: result.changed,
            snapshot: result.store,
          }),
        )
      } catch {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' })
        res.end(JSON.stringify({ ok: false, message: 'Corpo da requisição inválido' }))
      }
      return
    }

    if (url.pathname === '/api/votes/me' && req.method === 'GET') {
      const voterId = url.searchParams.get('voterId')
      if (!voterId) {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' })
        res.end(JSON.stringify({ ok: false, message: 'voterId obrigatório' }))
        return
      }
      const store = loadVotesStore(dataDir)
      const mine = store.records.find((r) => r.voterId === voterId)
      res.writeHead(200, {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store',
      })
      res.end(
        JSON.stringify({
          ok: true,
          teamId: mine?.teamId ?? null,
          votedAt: mine?.votedAt ?? null,
        }),
      )
      return
    }

    res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' })
    res.end(JSON.stringify({ ok: false, message: 'Rota não encontrada' }))
  }
}

/** Registro completo (admin) — protegido por token opcional */
export function handleVotesAdmin(req, res, dataDir) {
  const token = process.env.VOTES_ADMIN_TOKEN
  const auth = req.headers.authorization?.replace(/^Bearer\s+/i, '')
  if (!token || auth !== token) {
    res.writeHead(401, { 'Content-Type': 'application/json; charset=utf-8' })
    res.end(JSON.stringify({ ok: false, message: 'Não autorizado' }))
    return
  }
  const store = loadVotesStore(dataDir)
  res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' })
  res.end(readFileSync(join(dataDir, 'votes.json'), 'utf8'))
}
