import type { MyVote, VoteSubmitResult, VotesSnapshot } from './types'

export const VOTES_API = '/api/votes'
export const VOTES_POLL_MS = 8_000

export async function fetchVotes(): Promise<VotesSnapshot | null> {
  try {
    const res = await fetch(`${VOTES_API}?_=${Date.now()}`, { cache: 'no-store' })
    if (!res.ok) return null
    return (await res.json()) as VotesSnapshot
  } catch {
    return null
  }
}

export async function fetchMyVote(voterId: string): Promise<MyVote | null> {
  try {
    const res = await fetch(`${VOTES_API}/me?voterId=${encodeURIComponent(voterId)}`, {
      cache: 'no-store',
    })
    if (!res.ok) return null
    return (await res.json()) as MyVote
  } catch {
    return null
  }
}

export async function submitVote(teamId: string, voterId: string): Promise<VoteSubmitResult> {
  try {
    const res = await fetch(VOTES_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teamId, voterId }),
    })
    const data = (await res.json()) as VoteSubmitResult & { snapshot?: VotesSnapshot }
    return {
      ok: res.ok && data.ok !== false,
      message: data.message,
      teamId: data.teamId,
      changed: data.changed,
      snapshot: data.snapshot,
    }
  } catch {
    return { ok: false, message: 'Sem conexão com o servidor de votos' }
  }
}

export function votePct(totals: Record<string, number>, teamId: string): number {
  const sum = Object.values(totals).reduce((s, n) => s + n, 0)
  if (sum === 0) return 0
  return Math.round(((totals[teamId] || 0) / sum) * 1000) / 10
}

export function sortedVoteTotals(
  totals: Record<string, number>,
): { teamId: string; count: number; pct: number }[] {
  const sum = Object.values(totals).reduce((s, n) => s + n, 0)
  return Object.entries(totals)
    .map(([teamId, count]) => ({
      teamId,
      count,
      pct: sum > 0 ? Math.round((count / sum) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.count - a.count)
}
