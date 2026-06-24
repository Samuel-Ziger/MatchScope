const VOTER_KEY = 'matchscope-voter-id'

export function getVoterId(): string {
  try {
    const existing = localStorage.getItem(VOTER_KEY)
    if (existing && existing.length >= 8) return existing
    const id = crypto.randomUUID()
    localStorage.setItem(VOTER_KEY, id)
    return id
  } catch {
    return `anon-${Date.now()}`
  }
}
