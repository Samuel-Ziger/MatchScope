export interface VoteRecordPublic {
  teamId: string
  votedAt: string
  changed?: boolean
}

export interface VotesSnapshot {
  updatedAt: string | null
  totalVoters: number
  totalVotes: number
  active: boolean
  endsAt: string
  totals: Record<string, number>
  recent: VoteRecordPublic[]
}

export interface VoteSubmitResult {
  ok: boolean
  message: string
  teamId?: string
  changed?: boolean
  snapshot?: VotesSnapshot
}

export interface MyVote {
  ok: boolean
  teamId: string | null
  votedAt: string | null
}
