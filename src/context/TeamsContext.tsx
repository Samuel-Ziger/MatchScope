import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { TEAMS, type Team } from '../data/teams'
import { fetchOddsCache, ODDS_POLL_MS } from '../lib/theOddsApi/load'
import type { OddsCache } from '../lib/theOddsApi/types'

function mergeTeamsWithOdds(base: Team[], cache: OddsCache | null): Team[] {
  if (!cache?.byTeamId) return base

  return base.map((team) => {
    const odds = cache.byTeamId[team.id]
    if (!odds) return team
    return {
      ...team,
      market: {
        ...team.market,
        aggregate: odds.aggregate,
        momentum24h: odds.momentum24h,
        kalshi: odds.aggregate,
        polymarket: odds.aggregate,
      },
    }
  })
}

interface TeamsContextValue {
  teams: Team[]
  getTeamById: (id: string) => Team | undefined
  getContenders: (minProb?: number) => Team[]
  oddsLastUpdated: string | null
  oddsSlot: string | null
}

const TeamsContext = createContext<TeamsContextValue | null>(null)

export function TeamsProvider({ children }: { children: ReactNode }) {
  const [oddsCache, setOddsCache] = useState<OddsCache | null>(null)

  const loadOdds = useCallback(async () => {
    const cache = await fetchOddsCache()
    if (cache) setOddsCache(cache)
  }, [])

  useEffect(() => {
    void loadOdds()
    const id = window.setInterval(() => void loadOdds(), ODDS_POLL_MS)
    return () => window.clearInterval(id)
  }, [loadOdds])

  const teams = useMemo(() => mergeTeamsWithOdds(TEAMS, oddsCache), [oddsCache])

  const getTeamById = useCallback((id: string) => teams.find((t) => t.id === id), [teams])

  const getContenders = useCallback(
    (minProb = 1) =>
      [...teams]
        .filter((t) => t.market.aggregate >= minProb)
        .sort((a, b) => b.market.aggregate - a.market.aggregate),
    [teams],
  )

  const value = useMemo(
    () => ({
      teams,
      getTeamById,
      getContenders,
      oddsLastUpdated: oddsCache?.updatedAt ?? null,
      oddsSlot: oddsCache?.slot ?? null,
    }),
    [teams, getTeamById, getContenders, oddsCache],
  )

  return <TeamsContext.Provider value={value}>{children}</TeamsContext.Provider>
}

export function useTeams() {
  const ctx = useContext(TeamsContext)
  if (!ctx) throw new Error('useTeams must be used within TeamsProvider')
  return ctx
}
