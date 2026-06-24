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
import { syncMatchesFromAllSources } from '../lib/matchSync/merge'
import { shouldAutoSync } from '../lib/matchSync'
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

const API_SYNC_MS = 15 * 60_000

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

  const runFullSync = useCallback(
    async (forceApis: boolean): Promise<SyncResult> => {
      const openFootball = await fetchMatchesSync()
      if (openFootball?.updatedAt) setMatchesLastSync(openFootball.updatedAt)

      if (!forceApis && !shouldAutoSync()) {
        if (!openFootball) {
          return {
            ok: false,
            updated: 0,
            live: 0,
            requestsUsed: 0,
            message: 'Dados indisponíveis — aguarde o cron na VPS',
            syncedAt: new Date().toISOString(),
          }
        }
        const next = applyMatchesSync([...GROUP_MATCHES], openFootball)
        applySyncedMatches(next)
        const withScore = openFootball.stats?.withScore ?? Object.keys(openFootball.results).length
        return {
          ok: true,
          updated: withScore,
          live: 0,
          requestsUsed: 0,
          message: `${withScore} jogo(s) via openfootball (APIs ao vivo na próxima janela)`,
          syncedAt: openFootball.updatedAt,
        }
      }

      const { matches: next, result } = await syncMatchesFromAllSources([...GROUP_MATCHES], openFootball)
      applySyncedMatches(next)
      return result
    },
    [applySyncedMatches],
  )

  const atualizar = useCallback(async (): Promise<SyncResult> => {
    setSyncing(true)
    try {
      const result = await runFullSync(true)
      setSyncStatus(result)
      return result
    } finally {
      setSyncing(false)
    }
  }, [runFullSync])

  useEffect(() => {
    void (async () => {
      setSyncing(true)
      try {
        const result = await runFullSync(true)
        if (result.ok) setSyncStatus(result)
      } finally {
        setSyncing(false)
      }
    })()

    const openFootballId = window.setInterval(() => {
      void runFullSync(false).then((result) => {
        if (result.ok) setSyncStatus(result)
      })
    }, MATCHES_POLL_MS)

    const apiId = window.setInterval(() => {
      if (!shouldAutoSync()) return
      void runFullSync(true).then((result) => {
        if (result.ok) setSyncStatus(result)
      })
    }, API_SYNC_MS)

    return () => {
      window.clearInterval(openFootballId)
      window.clearInterval(apiId)
    }
  }, [runFullSync])

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
