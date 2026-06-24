import type { SimulatedBracket, SimulatedMatch } from './bracketSimulation'
import type { GroupState } from './tournament'
import type { BracketConnector, PositionedNode, UnifiedLayout } from './unifiedBracket'
import { HEADER_H } from './unifiedBracket'

export const MIRROR_MATCH_W = 210
export const MIRROR_TEAM_H = 34
export const MIRROR_MATCH_H = MIRROR_TEAM_H * 2 + 2
export const MIRROR_ROUND_GAP = 88
export const MIRROR_CENTER_GAP = 110
export const MIRROR_KO_UNIT = 92
export const MIRROR_MARGIN = 36

const SIDE_STAGES = ['r16', 'qf', 'sf'] as const

export function isGroupPhaseComplete(groups: GroupState[]): boolean {
  return (
    groups.length > 0 &&
    groups.every((g) => g.matches.every((m) => m.homeScore !== null && m.awayScore !== null))
  )
}

function mirrorMatchY(roundIndex: number, matchIndex: number): number {
  const span = MIRROR_KO_UNIT * Math.pow(2, roundIndex)
  return matchIndex * span + (span - MIRROR_MATCH_H) / 2 + HEADER_H + 24
}

function forkPathLeft(
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

function forkPathRight(
  x1: number, y1: number, x2: number, y2: number,
  tx: number, ty: number,
  gap: number,
): string {
  const xMid = x1 - gap / 2
  const yJoin = (y1 + y2) / 2
  return [
    `M ${x1} ${y1} H ${xMid}`,
    `M ${x2} ${y2} H ${xMid}`,
    `M ${xMid} ${Math.min(y1, y2)} V ${Math.max(y1, y2)}`,
    `M ${xMid} ${yJoin} H ${tx} V ${ty}`,
  ].join(' ')
}

function halfMatches(matches: SimulatedMatch[], side: 'left' | 'right'): SimulatedMatch[] {
  const half = matches.length / 2
  return side === 'left' ? matches.slice(0, half) : matches.slice(half)
}

export function computeMirrorLayout(bracket: SimulatedBracket): UnifiedLayout {
  const sideRoundCount = SIDE_STAGES.length
  const sideWidth = sideRoundCount * (MIRROR_MATCH_W + MIRROR_ROUND_GAP)
  const totalW =
    MIRROR_MARGIN * 2 + sideWidth * 2 + MIRROR_CENTER_GAP + MIRROR_MATCH_W
  const finalX = (totalW - MIRROR_MATCH_W) / 2

  const leftRoundX = (ri: number) => MIRROR_MARGIN + ri * (MIRROR_MATCH_W + MIRROR_ROUND_GAP)
  const rightRoundX = (ri: number) =>
    totalW - MIRROR_MARGIN - MIRROR_MATCH_W - ri * (MIRROR_MATCH_W + MIRROR_ROUND_GAP)

  const knockoutNodes: PositionedNode[] = []
  const knockoutRounds: UnifiedLayout['knockoutRounds'] = []
  const connectors: BracketConnector[] = []
  const posMap = new Map<string, { x: number; y: number; w: number; side: 'left' | 'right' | 'center' }>()

  const roundByStage = Object.fromEntries(bracket.rounds.map((r) => [r.stage, r]))

  SIDE_STAGES.forEach((stage, ri) => {
    const round = roundByStage[stage]
    if (!round) return

    const leftX = leftRoundX(ri)
    const rightX = rightRoundX(ri)
    knockoutRounds.push({
      stage: round.stage,
      label: round.label,
      x: leftX,
      matches: round.matches,
      mirrorRightX: rightX,
    })

    halfMatches(round.matches, 'left').forEach((m, mi) => {
      const y = mirrorMatchY(ri, mi)
      posMap.set(m.id, { x: leftX, y, w: MIRROR_MATCH_W, side: 'left' })
      knockoutNodes.push({
        id: m.id, x: leftX, y, w: MIRROR_MATCH_W, h: MIRROR_MATCH_H,
        side: 'left', roundStage: stage,
      })
    })

    halfMatches(round.matches, 'right').forEach((m, mi) => {
      const y = mirrorMatchY(ri, mi)
      posMap.set(m.id, { x: rightX, y, w: MIRROR_MATCH_W, side: 'right' })
      knockoutNodes.push({
        id: m.id, x: rightX, y, w: MIRROR_MATCH_W, h: MIRROR_MATCH_H,
        side: 'right', roundStage: stage,
      })
    })
  })

  const finalRound = roundByStage.final
  if (finalRound?.matches[0]) {
    const fm = finalRound.matches[0]
    const leftSf = roundByStage.sf?.matches[0]
    const rightSf = roundByStage.sf?.matches[1]
    const y1 = leftSf ? posMap.get(leftSf.id)?.y ?? 0 : 0
    const y2 = rightSf ? posMap.get(rightSf.id)?.y ?? 0 : 0
    const y = leftSf && rightSf
      ? (y1 + y2) / 2
      : mirrorMatchY(0, 0)

    posMap.set(fm.id, { x: finalX, y, w: MIRROR_MATCH_W, side: 'center' })
    knockoutNodes.push({
      id: fm.id, x: finalX, y, w: MIRROR_MATCH_W, h: MIRROR_MATCH_H,
      side: 'center', roundStage: 'final',
    })
    knockoutRounds.push({
      stage: 'final',
      label: finalRound.label,
      x: finalX,
      matches: finalRound.matches,
    })
  }

  for (const stage of SIDE_STAGES) {
    const round = roundByStage[stage]
    if (!round) continue
    const ri = SIDE_STAGES.indexOf(stage)
    const nextStage = SIDE_STAGES[ri + 1]
    const nextRound = nextStage ? roundByStage[nextStage] : roundByStage.final
    if (!nextRound) continue

    for (const nm of nextRound.matches) {
      const feeds = nm.feedsFrom
      const pn = posMap.get(nm.id)
      if (!feeds || !pn) continue
      const [id1, id2] = feeds
      const p1 = id1 ? posMap.get(id1) : null
      const p2 = id2 ? posMap.get(id2) : null
      if (!p1 || !p2) continue

      const y1 = p1.y + MIRROR_MATCH_H / 2
      const y2 = p2.y + MIRROR_MATCH_H / 2
      const ty = pn.y + MIRROR_MATCH_H / 2

      if (pn.side === 'left') {
        const x1 = p1.x + MIRROR_MATCH_W
        const x2 = p2.x + MIRROR_MATCH_W
        connectors.push({
          id: `ko-L-${id1}-${id2}-${nm.id}`,
          kind: 'knockout-advance',
          fromX: x1, fromY: y1, toX: pn.x, toY: ty,
          path: forkPathLeft(x1, y1, x2, y2, pn.x, ty, MIRROR_ROUND_GAP),
        })
      } else if (pn.side === 'right') {
        const x1 = p1.x
        const x2 = p2.x
        connectors.push({
          id: `ko-R-${id1}-${id2}-${nm.id}`,
          kind: 'knockout-advance',
          fromX: x1, fromY: y1, toX: pn.x + MIRROR_MATCH_W, toY: ty,
          path: forkPathRight(x1, y1, x2, y2, pn.x + MIRROR_MATCH_W, ty, MIRROR_ROUND_GAP),
        })
      }
    }
  }

  const leftSf = roundByStage.sf?.matches[0]
  const rightSf = roundByStage.sf?.matches[1]
  const finalMatch = finalRound?.matches[0]
  if (leftSf && rightSf && finalMatch) {
    const p1 = posMap.get(leftSf.id)
    const p2 = posMap.get(rightSf.id)
    const pf = posMap.get(finalMatch.id)
    if (p1 && p2 && pf) {
      const y1 = p1.y + MIRROR_MATCH_H / 2
      const y2 = p2.y + MIRROR_MATCH_H / 2
      const ty = pf.y + MIRROR_MATCH_H / 2
      const x1 = p1.x + MIRROR_MATCH_W
      const x2 = p2.x
      const midX = (x1 + x2) / 2
      connectors.push({
        id: `ko-final-L-${leftSf.id}`,
        kind: 'knockout-advance',
        fromX: x1, fromY: y1, toX: midX, toY: ty,
        path: `M ${x1} ${y1} H ${midX} V ${ty}`,
      })
      connectors.push({
        id: `ko-final-R-${rightSf.id}`,
        kind: 'knockout-advance',
        fromX: x2, fromY: y2, toX: midX, toY: ty,
        path: `M ${x2} ${y2} H ${midX} V ${ty}`,
      })
      connectors.push({
        id: `ko-final-${finalMatch.id}`,
        kind: 'knockout-advance',
        fromX: midX, fromY: ty, toX: pf.x + MIRROR_MATCH_W / 2, toY: pf.y,
        path: `M ${midX} ${ty} V ${pf.y + MIRROR_MATCH_H / 2} H ${pf.x + MIRROR_MATCH_W / 2}`,
      })
    }
  }

  const outerCount = roundByStage.r16?.matches.length
    ? roundByStage.r16.matches.length / 2
    : 4
  const totalH = outerCount * MIRROR_KO_UNIT + HEADER_H + 80

  return {
    mode: 'mirror',
    groups: [],
    knockoutNodes,
    knockoutRounds,
    connectors,
    ports: [],
    width: totalW,
    height: totalH,
    knockoutStartX: finalX,
  }
}
