import type { GroupState, StandingRow } from './tournament'
import type { SimulatedBracket, SimulatedMatch } from './bracketSimulation'
import { R32_TEMPLATE } from './bracketPaths'

export interface PositionedGroup {
  group: string
  x: number
  y: number
  width: number
  height: number
  matches: GroupState['matches']
  standings: StandingRow[]
  qualifierPortY: Record<string, number>
}

export interface PositionedNode {
  id: string
  x: number
  y: number
  w: number
  h: number
  slot?: 'home' | 'away'
}

export interface ConnectorPort {
  id: string
  x: number
  y: number
  label: string
  group: string
  teamId: string
}

export interface BracketConnector {
  id: string
  path: string
  kind: 'group-to-knockout' | 'knockout-advance'
  group?: string
  label?: string
  fromX: number
  fromY: number
  toX: number
  toY: number
  played?: boolean
}

export interface UnifiedLayout {
  groups: PositionedGroup[]
  knockoutNodes: PositionedNode[]
  knockoutRounds: { stage: string; label: string; x: number; matches: SimulatedMatch[] }[]
  connectors: BracketConnector[]
  ports: ConnectorPort[]
  width: number
  height: number
  knockoutStartX: number
}

export const GROUP_W = 520
export const PLAYED_ROW_H = 58
export const UPCOMING_ROW_H = 34
export const GROUP_HEADER_H = 36
export const STANDINGS_H = 108
export const GROUP_GAP_Y = 64
export const KNOCKOUT_MATCH_W = 280
export const KNOCKOUT_MATCH_H = 76
export const KNOCKOUT_ROUND_GAP = 140
export const KNOCKOUT_COL_W = KNOCKOUT_MATCH_W + KNOCKOUT_ROUND_GAP
export const GROUP_TO_KO_GAP = 220
export const CONNECTOR_ZONE_W = 160
export const KO_UNIT = 108
export const HEADER_H = 40

export const GROUP_COLORS: Record<string, string> = {
  A: '#4f8ff7', B: '#f74f8f', C: '#4ff78f', D: '#f7c44f',
  E: '#a34ff7', F: '#f77d4f', G: '#4ff7f7', H: '#f74fb8',
  I: '#8ff74f', J: '#4f6ff7', K: '#f7f74f', L: '#4ff7b8',
}

function koMatchTop(roundIndex: number, matchIndex: number): number {
  const span = KO_UNIT * Math.pow(2, roundIndex)
  return matchIndex * span + (span - KNOCKOUT_MATCH_H) / 2
}

function isPlayed(m: { homeScore: number | null; awayScore: number | null }) {
  return m.homeScore !== null && m.awayScore !== null
}

function groupHeight(g: GroupState): number {
  const played = g.matches.filter(isPlayed).length
  const upcoming = g.matches.length - played
  const playedSection = played > 0 ? 24 + played * (PLAYED_ROW_H + 6) : 0
  const upcomingSection = upcoming > 0 ? 22 + upcoming * (UPCOMING_ROW_H + 4) : 0
  return GROUP_HEADER_H + playedSection + upcomingSection + STANDINGS_H + 12
}

function resolveTokenTeam(token: string, slots: Record<string, string | null>): string | null {
  if (slots[token]) return slots[token]
  if (token.startsWith('3') && token.length > 2) {
    for (const ch of token.slice(1)) {
      const key = `3${ch}`
      if (slots[key]) return slots[key]
    }
  }
  return null
}

function buildSlots(groups: GroupState[]): Record<string, string | null> {
  const slots: Record<string, string | null> = {}
  for (const g of groups) {
    slots[`1${g.group}`] = g.standings[0]?.teamId ?? null
    slots[`2${g.group}`] = g.standings[1]?.teamId ?? null
    slots[`3${g.group}`] = g.standings[2]?.teamId ?? null
  }
  return slots
}

function forkPath(
  x1: number, y1: number, x2: number, y2: number,
  tx: number, ty: number,
  gap: number,
): string {
  const xMid = x1 + gap / 2
  const yJoin = (y1 + y2) / 2
  return [
    `M ${x1} ${y1} H ${xMid}`,
    `M ${x2} ${y2} H ${xMid}`,
    `M ${xMid} ${Math.min(y1, y2)} V ${Math.max(y1, y2)}`,
    `M ${xMid} ${yJoin} H ${tx} V ${ty}`,
  ].join(' ')
}

export function computeUnifiedLayout(
  groups: GroupState[],
  bracket: SimulatedBracket,
): UnifiedLayout {
  const sorted = [...groups].sort((a, b) => a.group.localeCompare(b.group))

  let groupY = HEADER_H + 8
  const positionedGroups: PositionedGroup[] = sorted.map((g) => {
    const h = groupHeight(g)
    const qualifierPortY: Record<string, number> = {}
    g.standings.slice(0, 3).forEach((s, i) => {
      qualifierPortY[s.teamId] = groupY + h - 28 - (2 - i) * 28
    })
    const positioned = {
      group: g.group,
      x: 0,
      y: groupY,
      width: GROUP_W,
      height: h,
      matches: g.matches,
      standings: g.standings,
      qualifierPortY,
    }
    groupY += h + GROUP_GAP_Y
    return positioned
  })

  const groupsTotalH = groupY
  const r32Count = bracket.rounds[0]?.matches.length ?? 16
  const knockoutHeight = r32Count * KO_UNIT + HEADER_H
  const totalH = Math.max(groupsTotalH, knockoutHeight + 80)

  const knockoutStartX = GROUP_W + CONNECTOR_ZONE_W + GROUP_TO_KO_GAP
  const slots = buildSlots(sorted)
  const ports: ConnectorPort[] = []
  const knockoutNodes: PositionedNode[] = []
  const knockoutRounds: UnifiedLayout['knockoutRounds'] = []
  const posMap = new Map<string, { x: number; y: number }>()
  const nodeSlots = new Map<string, 'home' | 'away'>()

  bracket.rounds.forEach((round, ri) => {
    const x = knockoutStartX + ri * KNOCKOUT_COL_W
    knockoutRounds.push({ stage: round.stage, label: round.label, x, matches: round.matches })
    round.matches.forEach((m, mi) => {
      const y = koMatchTop(ri, mi) + HEADER_H
      posMap.set(m.id, { x, y })
      knockoutNodes.push({
        id: m.id, x, y, w: KNOCKOUT_MATCH_W, h: KNOCKOUT_MATCH_H,
        slot: undefined,
      })
    })
  })

  const connectors: BracketConnector[] = []

  R32_TEMPLATE.forEach(([homeToken, awayToken], i) => {
    const r32Id = `R32-${i + 1}`
    const target = posMap.get(r32Id)
    if (!target) return

    const homeId = resolveTokenTeam(homeToken, slots)
    const awayId = resolveTokenTeam(awayToken, slots)
    nodeSlots.set(`${r32Id}-home`, 'home')
    nodeSlots.set(`${r32Id}-away`, 'away')

    for (const [teamId, token, side] of [
      [homeId, homeToken, 0],
      [awayId, awayToken, 1],
    ] as const) {
      if (!teamId) continue
      const grp = positionedGroups.find((g) => g.standings.some((s) => s.teamId === teamId))
      if (!grp) continue

      const portY = grp.qualifierPortY[teamId]
      if (!portY) continue

      const portX = GROUP_W
      const portId = `port-${r32Id}-${side === 0 ? 'h' : 'a'}`
      ports.push({
        id: portId,
        x: portX,
        y: portY,
        label: token,
        group: grp.group,
        teamId,
      })

      const endY = target.y + KNOCKOUT_MATCH_H * (side === 0 ? 0.3 : 0.7)
      const endX = target.x

      connectors.push({
        id: `link-${token}-${r32Id}-${side}`,
        kind: 'group-to-knockout',
        group: grp.group,
        label: token,
        fromX: portX,
        fromY: portY,
        toX: endX,
        toY: endY,
        played: grp.matches.some(
          (m) => (m.homeId === teamId || m.awayId === teamId) && isPlayed(m),
        ),
        path: `M ${portX} ${portY} H ${GROUP_W + CONNECTOR_ZONE_W * 0.35} V ${endY} H ${endX}`,
      })
    }
  })

  for (let ri = 0; ri < bracket.rounds.length - 1; ri++) {
    const next = bracket.rounds[ri + 1]
    next.matches.forEach((nm) => {
      const feeds = nm.feedsFrom
      const pn = posMap.get(nm.id)
      if (!feeds || !pn) return
      const [id1, id2] = feeds
      const p1 = id1 ? posMap.get(id1) : null
      const p2 = id2 ? posMap.get(id2) : null
      if (!p1 || !p2) return
      const y1 = p1.y + KNOCKOUT_MATCH_H / 2
      const y2 = p2.y + KNOCKOUT_MATCH_H / 2
      const ty = pn.y + KNOCKOUT_MATCH_H / 2
      const x1 = p1.x + KNOCKOUT_MATCH_W
      const x2 = p2.x + KNOCKOUT_MATCH_W
      connectors.push({
        id: `ko-${id1}-${id2}-${nm.id}`,
        kind: 'knockout-advance',
        fromX: x1,
        fromY: y1,
        toX: pn.x,
        toY: ty,
        path: forkPath(x1, y1, x2, y2, pn.x, ty, KNOCKOUT_ROUND_GAP),
      })
    })
  }

  const totalW = knockoutStartX + bracket.rounds.length * KNOCKOUT_COL_W + 80

  return {
    groups: positionedGroups,
    knockoutNodes,
    knockoutRounds,
    connectors,
    ports,
    width: totalW,
    height: totalH,
    knockoutStartX,
  }
}
