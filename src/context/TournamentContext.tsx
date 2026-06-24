import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { GROUP_MATCHES } from '../data/matches'
import type { TournamentMatch } from '../data/matches'
import { useTeams } from './TeamsContext'
import { buildTournamentState, updateMatchScore } from '../lib/tournament'
import {
  applyMatchesSync,
  fetchMatchesSync,
  MATCHES_POLL_MS,
} from '../lib/openfootball/load'
import type { SyncResult } from '../lib/apiFootball/types'

interface TournamentContextValue {
  matches: TournamentMatch[]
  state: ReturnType<typeof buildTournamentState>
  updateResult: (matchId: string, homeScore: number, awayScore: number) => void
  atualizar: () => Promise<SyncResult>
  syncStatus: SyncResult | null
  syncing: boolean
  lastUpdate: number
  matchesLastSync: string | null
}

const TournamentContext = createContext<TournamentContextValue | null>(null)

export function TournamentProvider({ children }: { children: ReactNode }) {
  const { teams } = useTeams()
  const [matches, setMatches] = useState<TournamentMatch[]>(() => [...GROUP_MATCHES])
  const [lastUpdate, setLastUpdate] = useState(Date.now())
  const [matchesLastSync, setMatchesLastSync] = useState<string | null>(null)
  const [syncStatus, setSyncStatus] = useState<SyncResult | null>(null)
  const [syncing, setSyncing] = useState(false)

  const persist = useCallback((next: TournamentMatch[]) => {
    const results: Record<string, [number, number]> = {}
    next.forEach((m) => {
      if (m.homeScore !== null && m.awayScore !== null) {
        results[m.id] = [m.homeScore, m.awayScore]
      }
    })
    localStorage.setItem('matchscope-match-results', JSON.stringify(results))
  }, [])

  const applySyncedMatches = useCallback((next: TournamentMatch[]) => {
    setMatches(next)
    persist(next)
    setLastUpdate(Date.now())
  }, [persist])

  const loadFromOpenFootball = useCallback(async (): Promise<SyncResult> => {
    const sync = await fetchMatchesSync()
    if (!sync) {
      return {
        ok: false,
        updated: 0,
        live: 0,
        requestsUsed: 0,
        message: 'Dados openfootball indisponíveis — aguarde o próximo pull na VPS',
        syncedAt: new Date().toISOString(),
      }
    }

    const next = applyMatchesSync([...GROUP_MATCHES], sync)
    applySyncedMatches(next)
    setMatchesLastSync(sync.updatedAt)

    const withScore = sync.stats?.withScore ?? Object.keys(sync.results).length
    return {
      ok: true,
      updated: withScore,
      live: 0,
      requestsUsed: 0,
      message: `${withScore} jogo(s) com placar via openfootball/worldcup.json`,
      syncedAt: sync.updatedAt,
    }
  }, [applySyncedMatches])

  const atualizar = useCallback(async (): Promise<SyncResult> => {
    setSyncing(true)
    try {
      const result = await loadFromOpenFootball()
      setSyncStatus(result)
      return result
    } finally {
      setSyncing(false)
    }
  }, [loadFromOpenFootball])

  useEffect(() => {
    void (async () => {
      setSyncing(true)
      try {
        const result = await loadFromOpenFootball()
        if (result.ok) setSyncStatus(result)
      } finally {
        setSyncing(false)
      }
    })()

    const id = window.setInterval(() => {
      void loadFromOpenFootball().then((result) => {
        if (result.ok) setSyncStatus(result)
      })
    }, MATCHES_POLL_MS)

    return () => window.clearInterval(id)
  }, [loadFromOpenFootball])

  const updateResult = useCallback((matchId: string, homeScore: number, awayScore: number) => {
    setMatches((prev) => {
      const next = updateMatchScore(prev, matchId, homeScore, awayScore)
      persist(next)
      return next
    })
    setLastUpdate(Date.now())
  }, [persist])

  const state = useMemo(() => buildTournamentState(matches, teams), [matches, teams, lastUpdate])

  return (
    <TournamentContext.Provider
      value={{
        matches,
        state,
        updateResult,
        atualizar,
        syncStatus,
        syncing,
        lastUpdate,
        matchesLastSync,
      }}
    >
      {children}
    </TournamentContext.Provider>
  )
}

export function useTournament() {
  const ctx = useContext(TournamentContext)
  if (!ctx) throw new Error('useTournament must be used within TournamentProvider')
  return ctx
}
