import { GROUPS } from '../data/teams'

export const VOTE_GROUP_W = 460
export const VOTE_TEAM_ROW_H = 54
export const VOTE_GROUP_HEADER = 40
export const VOTE_GROUP_PAD = 16
export const VOTE_COL_GAP = 40
export const VOTE_ROW_GAP = 28
export const VOTE_MAP_HEADER = 36

export const VOTE_GROUP_COLORS: Record<string, string> = {
  A: '#4f8ff7', B: '#f74f8f', C: '#4ff78f', D: '#f7c44f',
  E: '#a34ff7', F: '#f77d4f', G: '#4ff7f7', H: '#f74fb8',
  I: '#8ff74f', J: '#4f6ff7', K: '#f7f74f', L: '#4ff7b8',
}

export interface VoteGroupLayout {
  group: string
  x: number
  y: number
  width: number
  height: number
  teamIds: string[]
}

export interface VoteMapLayout {
  groups: VoteGroupLayout[]
  width: number
  height: number
}

function groupHeight(teamCount: number) {
  return VOTE_GROUP_HEADER + VOTE_GROUP_PAD * 2 + teamCount * VOTE_TEAM_ROW_H
}

/** Dois blocos de 6 grupos (layout espelhando o mapa oficial à esquerda) */
export function computeVoteMapLayout(): VoteMapLayout {
  const letters = 'ABCDEFGHIJKL'.split('')
  const left = letters.slice(0, 6)
  const right = letters.slice(6)

  const groups: VoteGroupLayout[] = []
  let maxH = 0

  const placeColumn = (cols: string[], x: number) => {
    let y = VOTE_MAP_HEADER
    for (const g of cols) {
      const teamIds = GROUPS[g] ?? []
      const h = groupHeight(teamIds.length)
      groups.push({ group: g, x, y, width: VOTE_GROUP_W, height: h, teamIds })
      y += h + VOTE_ROW_GAP
      maxH = Math.max(maxH, y)
    }
  }

  placeColumn(left, 0)
  placeColumn(right, VOTE_GROUP_W + VOTE_COL_GAP)

  return {
    groups,
    width: VOTE_GROUP_W * 2 + VOTE_COL_GAP + 48,
    height: maxH + 24,
  }
}
