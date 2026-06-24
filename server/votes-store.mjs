import { createHash, randomUUID } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const DEFAULT_END = '2026-07-20T03:59:59.000Z'

export function getVotingEndsAt() {
  return process.env.VOTING_END_ISO || DEFAULT_END
}

export function isVotingOpen(now = new Date()) {
  return now.getTime() < new Date(getVotingEndsAt()).getTime()
}

function emptyStore() {
  return {
    updatedAt: null,
    totalVoters: 0,
    totals: {},
    records: [],
  }
}

export function loadVotesStore(dataDir) {
  const path = join(dataDir, 'votes.json')
  if (!existsSync(path)) return emptyStore()
  try {
    const data = JSON.parse(readFileSync(path, 'utf8'))
    return {
      ...emptyStore(),
      ...data,
      totals: data.totals ?? {},
      records: Array.isArray(data.records) ? data.records : [],
    }
  } catch {
    return emptyStore()
  }
}

function saveVotesStore(dataDir, store) {
  mkdirSync(dataDir, { recursive: true })
  const path = join(dataDir, 'votes.json')
  const tmp = `${path}.tmp`
  writeFileSync(tmp, `${JSON.stringify(store, null, 2)}\n`, 'utf8')
  renameSync(tmp, path)
}

export function loadValidTeamIds(dataDir) {
  const catalogPath = join(dataDir, 'match-catalog.json')
  if (!existsSync(catalogPath)) return null
  const catalog = JSON.parse(readFileSync(catalogPath, 'utf8'))
  const ids = new Set()
  for (const row of catalog) {
    ids.add(row.homeId)
    ids.add(row.awayId)
  }
  return ids
}

function hashIp(ip, salt) {
  return createHash('sha256').update(`${ip}:${salt}`).digest('hex').slice(0, 20)
}

export function castVote(dataDir, { teamId, voterId }, ip, options = {}) {
  const validIds = options.validTeamIds ?? loadValidTeamIds(dataDir)
  if (!validIds?.has(teamId)) {
    return { ok: false, status: 400, message: 'Seleção inválida' }
  }
  if (!voterId || typeof voterId !== 'string' || voterId.length < 8 || voterId.length > 64) {
    return { ok: false, status: 400, message: 'Identificador de votante inválido' }
  }
  if (!isVotingOpen()) {
    return { ok: false, status: 403, message: 'Votação encerrada — a Copa já terminou' }
  }

  const salt = process.env.VOTE_SALT || 'matchscope-vote-salt'
  const ipHash = hashIp(ip || 'unknown', salt)
  const store = loadVotesStore(dataDir)
  const now = new Date().toISOString()

  const byVoter = store.records.findIndex((r) => r.voterId === voterId)
  const byIp = store.records.findIndex((r) => r.ipHash === ipHash)
  const existingIdx = byVoter >= 0 ? byVoter : byIp

  let changed = false
  let previousTeamId = null

  if (existingIdx >= 0) {
    const existing = store.records[existingIdx]
    previousTeamId = existing.teamId
    if (existing.teamId === teamId) {
      return {
      ok: true,
      status: 200,
      message: 'Você já votou nesta seleção',
      teamId,
      changed: false,
      store: publicSnapshot(store),
    }
    }
    store.totals[existing.teamId] = Math.max(0, (store.totals[existing.teamId] || 1) - 1)
    store.records[existingIdx] = {
      ...existing,
      teamId,
      voterId,
      ipHash,
      votedAt: now,
      updatedAt: now,
    }
    changed = true
  } else {
    store.records.push({
      id: randomUUID(),
      voterId,
      teamId,
      ipHash,
      votedAt: now,
    })
  }

  store.totals[teamId] = (store.totals[teamId] || 0) + 1
  store.totalVoters = store.records.length
  store.updatedAt = now
  saveVotesStore(dataDir, store)

  return {
    ok: true,
    status: 200,
    message: changed ? 'Voto alterado com sucesso!' : 'Voto registrado com sucesso!',
    teamId,
    changed,
    previousTeamId,
    store: publicSnapshot(store),
  }
}

export function publicSnapshot(store) {
  const totalVotes = Object.values(store.totals).reduce((s, n) => s + n, 0)
  const recent = [...store.records]
    .sort((a, b) => new Date(b.votedAt).getTime() - new Date(a.votedAt).getTime())
    .slice(0, 30)
    .map((r) => ({
      teamId: r.teamId,
      votedAt: r.votedAt,
      changed: !!r.updatedAt,
    }))

  return {
    updatedAt: store.updatedAt,
    totalVoters: store.totalVoters ?? store.records.length,
    totalVotes,
    active: isVotingOpen(),
    endsAt: getVotingEndsAt(),
    totals: store.totals,
    recent,
  }
}
