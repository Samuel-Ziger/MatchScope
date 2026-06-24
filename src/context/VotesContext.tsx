import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { fetchMyVote, fetchVotes, submitVote, VOTES_POLL_MS } from '../lib/votes/client'
import { getVoterId } from '../lib/votes/voter'
import type { VotesSnapshot } from '../lib/votes/types'

interface VotesContextValue {
  snapshot: VotesSnapshot
  myTeamId: string | null
  voterId: string
  voting: boolean
  lastMessage: string | null
  castVote: (teamId: string) => Promise<boolean>
  refresh: () => Promise<void>
}

const defaultSnapshot: VotesSnapshot = {
  updatedAt: null,
  totalVoters: 0,
  totalVotes: 0,
  active: true,
  endsAt: '2026-07-20T03:59:59.000Z',
  totals: {},
  recent: [],
}

const VotesContext = createContext<VotesContextValue | null>(null)

export function VotesProvider({ children }: { children: ReactNode }) {
  const [voterId] = useState(getVoterId)
  const [snapshot, setSnapshot] = useState<VotesSnapshot | null>(null)
  const [myTeamId, setMyTeamId] = useState<string | null>(null)
  const [voting, setVoting] = useState(false)
  const [lastMessage, setLastMessage] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    const [snap, mine] = await Promise.all([fetchVotes(), fetchMyVote(voterId)])
    if (snap) setSnapshot(snap)
    if (mine?.ok) setMyTeamId(mine.teamId)
  }, [voterId])

  useEffect(() => {
    void refresh()
    const id = window.setInterval(() => void refresh(), VOTES_POLL_MS)
    return () => window.clearInterval(id)
  }, [refresh])

  const castVote = useCallback(
    async (teamId: string) => {
      setVoting(true)
      setLastMessage(null)
      try {
        const result = await submitVote(teamId, voterId)
        setLastMessage(result.message)
        if (result.snapshot) setSnapshot(result.snapshot)
        if (result.ok) {
          setMyTeamId(teamId)
          return true
        }
        return false
      } finally {
        setVoting(false)
      }
    },
    [voterId],
  )

  const value = useMemo(
    () => ({
      snapshot: snapshot ?? defaultSnapshot,
      myTeamId,
      voterId,
      voting,
      lastMessage,
      castVote,
      refresh,
    }),
    [snapshot, myTeamId, voterId, voting, lastMessage, castVote, refresh],
  )

  return <VotesContext.Provider value={value}>{children}</VotesContext.Provider>
}

export function useVotes() {
  const ctx = useContext(VotesContext)
  if (!ctx) throw new Error('useVotes must be used within VotesProvider')
  return ctx
}
