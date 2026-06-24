import { useMemo, useState } from 'react'
import type { SimulatedBracket, SimulatedMatch } from '../lib/bracketSimulation'
import type { GroupState } from '../lib/tournament'
import type { ResolvedMatch } from '../lib/tournament'
import {
  computeBracketLayout,
  PLAYED_ROW_H,
  UPCOMING_ROW_H,
  KNOCKOUT_MATCH_W,
  KNOCKOUT_MATCH_H,
  GROUP_COLORS,
} from '../lib/unifiedBracket'
import { MIRROR_MATCH_W, MIRROR_MATCH_H, MIRROR_TEAM_H } from '../lib/mirrorBracket'
import { useTeams } from '../context/TeamsContext'
import { Flag } from './ui'
import { formatPct } from '../lib/simulation'
import { MatchPerformanceLines } from './MatchPerformanceLines'
import { BracketViewport } from './BracketViewport'

interface BracketTreeProps {
  groups: GroupState[]
  bracket: SimulatedBracket
  onUpdate?: (id: string, h: number, a: number) => void
}

export function BracketTree({ groups, bracket, onUpdate }: BracketTreeProps) {
  const { getTeamById } = useTeams()
  const layout = useMemo(() => computeBracketLayout(groups, bracket), [groups, bracket])
  const topChampion = bracket.championProbabilities[0]
  const champion = topChampion
    ? getTeamById(topChampion.teamId)
    : bracket.championId
      ? getTeamById(bracket.championId)
      : null
  const champProb = topChampion?.prob ?? bracket.championProb

  return (
    <div className="space-y-4 w-full min-w-0">
      {layout.mode === 'mirror' && (
        <p className="text-sm text-text-secondary px-1">
          Fase de grupos concluída — chave espelhada das oitavas até a final, no estilo da Copa.
        </p>
      )}
      <div className="flex flex-wrap items-center gap-4 p-4 rounded-lg border border-brand/30 bg-brand/5">
        <div>
          <div className="text-xs text-text-tertiary uppercase tracking-wider mb-1">Campeão projetado</div>
          {champion ? (
            <div className="flex items-center gap-3">
              <Flag iso={champion.iso} name={champion.name} size={32} />
              <div>
                <div className="text-lg font-semibold text-text-primary">{champion.name}</div>
                <div className="text-sm font-mono text-brand">
                  {formatPct(champProb)} de chance
                </div>
              </div>
            </div>
          ) : (
            <span className="text-text-secondary">Aguardando classificados</span>
          )}
        </div>
        <div className="flex-1 min-w-[200px]">
          <div className="text-xs text-text-tertiary mb-2">Top 5 — probabilidade de título</div>
          <div className="space-y-1">
            {bracket.championProbabilities.slice(0, 5).map((c) => {
              const t = getTeamById(c.teamId)
              if (!t) return null
              return (
                <div key={c.teamId} className="flex items-center gap-2">
                  <Flag iso={t.iso} name={t.name} size={14} />
                  <span className="text-xs flex-1 truncate">{t.name}</span>
                  <span className="text-xs font-mono text-brand w-12 text-right">{formatPct(c.prob)}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <BracketViewport
        layoutWidth={layout.width}
        layoutHeight={layout.height}
        defaultZoom={layout.mode === 'mirror' ? 0.32 : undefined}
      >
        <BracketMapCanvas layout={layout} onUpdate={onUpdate} />
      </BracketViewport>
    </div>
  )
}

function BracketMapCanvas({
  layout,
  onUpdate,
}: {
  layout: ReturnType<typeof computeBracketLayout>
  onUpdate?: (id: string, h: number, a: number) => void
}) {
  const isMirror = layout.mode === 'mirror'

  return (
    <div className="relative" style={{ width: layout.width, height: layout.height }}>
      <svg className="absolute inset-0 pointer-events-none" width={layout.width} height={layout.height}>
        {!isMirror && (
          <defs>
            {Object.entries(GROUP_COLORS).map(([g, color]) => (
              <marker key={g} id={`arrow-${g}`} markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                <path d="M0,0 L6,3 L0,6 Z" fill={color} opacity={0.9} />
              </marker>
            ))}
          </defs>
        )}

        {layout.connectors.map((c) => {
          const color = c.group ? GROUP_COLORS[c.group] ?? '#4f8ff7' : 'var(--color-border)'
          const midX = (c.fromX + c.toX) / 2
          const midY = (c.fromY + c.toY) / 2
          return (
            <g key={c.id}>
              <path
                d={c.path}
                fill="none"
                stroke={color}
                strokeWidth={isMirror ? 2 : c.kind === 'group-to-knockout' ? 2.5 : 2}
                opacity={isMirror ? 0.55 : c.kind === 'group-to-knockout' ? 0.75 : 0.5}
                strokeDasharray={c.played === false ? '8 5' : undefined}
                markerEnd={!isMirror && c.group ? `url(#arrow-${c.group})` : undefined}
              />
              {c.label && !isMirror && (
                <text
                  x={midX}
                  y={midY - 6}
                  textAnchor="middle"
                  className="fill-text-secondary"
                  fontSize={11}
                  fontWeight={600}
                >
                  {c.label}
                </text>
              )}
            </g>
          )
        })}

        {!isMirror && layout.ports.map((p) => (
          <circle
            key={p.id}
            cx={p.x}
            cy={p.y}
            r={6}
            fill={GROUP_COLORS[p.group] ?? '#4f8ff7'}
            stroke="var(--color-surface-1)"
            strokeWidth={2}
          />
        ))}
      </svg>

      {isMirror ? (
        <>
          <div
            className="absolute text-center text-base font-bold tracking-tight text-text-primary"
            style={{ left: 0, right: 0, top: 8 }}
          >
            Copa do Mundo 2026 — Chave das Eliminatórias
          </div>
          <div
            className="absolute text-xs font-semibold uppercase tracking-wider text-text-tertiary"
            style={{ left: 0, top: 32 }}
          >
            Metade esquerda
          </div>
          <div
            className="absolute text-xs font-semibold uppercase tracking-wider text-text-tertiary text-right"
            style={{ right: 0, top: 32 }}
          >
            Metade direita
          </div>
        </>
      ) : (
        <>
          <div className="absolute text-sm font-bold uppercase tracking-wider text-text-tertiary" style={{ left: 0, top: 8 }}>
            Fase de Grupos
          </div>
          <div
            className="absolute text-xs font-semibold uppercase tracking-wider text-text-tertiary"
            style={{ left: 0, top: 28 }}
          >
            Grupos A–F
          </div>
          <div
            className="absolute text-xs font-semibold uppercase tracking-wider text-text-tertiary"
            style={{ left: layout.groups[6]?.x ?? 0, top: 28 }}
          >
            Grupos G–L
          </div>
          <div
            className="absolute text-sm font-bold uppercase tracking-wider text-text-tertiary"
            style={{ left: layout.knockoutStartX, top: 8 }}
          >
            Eliminatórias
          </div>
        </>
      )}

      {!isMirror && layout.groups.map((g) => (
        <GroupPanel key={g.group} group={g} onUpdate={onUpdate} ports={layout.ports.filter((p) => p.group === g.group)} />
      ))}

      {layout.knockoutRounds.map((round) => {
        const seen = new Set<string>()
        const columns: { x: number; align: 'left' | 'right' | 'center' }[] = [
          { x: round.x, align: 'left' },
        ]
        if (round.mirrorRightX !== undefined) {
          columns.push({ x: round.mirrorRightX, align: 'right' })
        } else if (round.stage === 'final') {
          columns[0] = { x: round.x, align: 'center' }
        }

        return (
          <div key={`${round.stage}-${round.x}`}>
            {columns.map((col) => (
              <div
                key={`${round.stage}-${col.align}`}
                className="absolute text-xs font-semibold uppercase tracking-wider text-text-tertiary text-center"
                style={{ left: col.x, top: isMirror ? 52 : 28, width: isMirror ? MIRROR_MATCH_W : KNOCKOUT_MATCH_W }}
              >
                {round.label}
              </div>
            ))}
            {round.matches.map((m) => {
              const node = layout.knockoutNodes.find((n) => n.id === m.id)
              if (!node || seen.has(m.id)) return null
              seen.add(m.id)
              const w = isMirror ? MIRROR_MATCH_W : KNOCKOUT_MATCH_W
              return (
                <div key={m.id} className="absolute" style={{ left: node.x, top: node.y, width: w }}>
                  {isMirror ? (
                    <MirrorMatchCard match={m} side={node.side ?? 'left'} isFinal={round.stage === 'final'} />
                  ) : (
                    <KnockoutCard match={m} isFinal={round.stage === 'final'} />
                  )}
                </div>
              )
            })}
          </div>
        )
      })}
    </div>
  )
}

function GroupPanel({
  group: g,
  onUpdate,
  ports,
}: {
  group: ReturnType<typeof computeBracketLayout>['groups'][0]
  onUpdate?: (id: string, h: number, a: number) => void
  ports: ReturnType<typeof computeBracketLayout>['ports']
}) {
  const { getTeamById } = useTeams()
  const color = GROUP_COLORS[g.group] ?? '#4f8ff7'
  const played = g.matches.filter((m) => m.homeScore !== null && m.awayScore !== null)
  const upcoming = g.matches.filter((m) => m.homeScore === null || m.awayScore === null)

  return (
    <div
      className="absolute rounded-xl border-2 bg-surface-2 flex flex-col overflow-hidden"
      style={{ left: g.x, top: g.y, width: g.width, height: g.height, borderColor: `${color}55` }}
    >
      <div className="px-4 py-2 border-b flex items-center gap-2 shrink-0" style={{ backgroundColor: `${color}18`, borderColor: `${color}33` }}>
        <span className="text-sm font-bold" style={{ color }}>Grupo {g.group}</span>
        <span className="text-xs text-text-tertiary">{played.length} realizados · {upcoming.length} próximos</span>
      </div>

      {played.length > 0 && (
        <div className="px-2 pt-2 shrink-0 overflow-hidden">
          <div className="text-[10px] font-semibold uppercase text-positive mb-1.5 tracking-wider px-1">Jogos realizados</div>
          <div className="space-y-1">
            {played.map((m) => (
              <PlayedMatchLine key={m.id} match={m} onUpdate={onUpdate} />
            ))}
          </div>
        </div>
      )}

      {upcoming.length > 0 && (
        <div className="px-2 pt-2 shrink-0 overflow-hidden">
          <div className="text-[10px] font-semibold uppercase text-text-tertiary mb-1.5 tracking-wider px-1">Próximos jogos</div>
          <div className="space-y-1">
            {upcoming.map((m) => (
              <UpcomingMatchLine key={m.id} match={m} />
            ))}
          </div>
        </div>
      )}

      <div className="flex-1 min-h-2" />

      <div className="px-3 py-2 border-t bg-surface-1/90 shrink-0" style={{ borderColor: `${color}33` }}>
        <div className="text-[10px] font-semibold uppercase text-text-tertiary mb-2 tracking-wider">
          Classificados → saída para 32 avos
        </div>
        {g.standings.slice(0, 3).map((s, i) => {
          const team = getTeamById(s.teamId)
          if (!team) return null
          const port = ports.find((p) => p.teamId === s.teamId)
          const token = port?.label ?? `${i + 1}${g.group}`
          const qualified = s.status === 'qualified' || s.status === 'best_third'
          return (
            <div key={s.teamId} className="flex items-center gap-2 h-[28px] relative pr-4">
              <span className="font-mono text-xs text-text-tertiary w-6">{s.position}º</span>
              <Flag iso={team.iso} name={team.name} size={18} />
              <span className={`text-sm flex-1 truncate ${qualified ? 'font-semibold text-positive' : 'text-text-primary'}`}>
                {team.name}
              </span>
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded" style={{ backgroundColor: `${color}22`, color }}>
                {token}
              </span>
              <div
                className="absolute right-0 w-3.5 h-3.5 rounded-full border-2 border-surface-1 z-10"
                style={{ backgroundColor: color }}
                title={`Linha ${token} → 32 avos`}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}

function PlayedMatchLine({
  match,
  onUpdate,
}: {
  match: ResolvedMatch
  onUpdate?: (id: string, h: number, a: number) => void
}) {
  const { getTeamById } = useTeams()
  const home = getTeamById(match.homeId)
  const away = getTeamById(match.awayId)
  const [editing, setEditing] = useState(false)
  const [h, setH] = useState(String(match.homeScore ?? ''))
  const [a, setA] = useState(String(match.awayScore ?? ''))

  if (!home || !away) return null

  const homeWon = match.winnerId === home.id
  const awayWon = match.winnerId === away.id
  const isDraw = match.homeScore === match.awayScore

  const save = () => {
    const hs = parseInt(h, 10)
    const as = parseInt(a, 10)
    if (!isNaN(hs) && !isNaN(as) && hs >= 0 && as >= 0 && onUpdate) {
      onUpdate(match.id, hs, as)
      setEditing(false)
    }
  }

  return (
    <div
      className="rounded-lg border border-positive/40 bg-positive/[0.07] overflow-hidden"
      style={{ minHeight: PLAYED_ROW_H }}
    >
      <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center min-h-[46px]">
        <div
          className={`flex items-center gap-1.5 min-w-0 justify-end px-2 py-1.5 border-r border-positive/25 ${
            homeWon ? 'bg-positive/10' : ''
          }`}
        >
          {homeWon && <span className="text-[9px] font-bold bg-positive/25 text-positive px-1 rounded shrink-0">V</span>}
          <span className={`text-sm truncate text-right ${homeWon ? 'font-bold text-positive' : 'font-medium text-text-primary'}`}>
            {home.name}
          </span>
          <Flag iso={home.iso} name={home.name} size={18} />
        </div>

        <div className="flex items-center justify-center px-2 shrink-0">
          {editing ? (
            <div
              className="flex items-center gap-1.5 shrink-0"
              data-interactive
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
            >
              <input value={h} onChange={(e) => setH(e.target.value)} className="w-9 text-center text-sm font-mono bg-surface-2 border border-border rounded select-text" />
              <span className="text-text-tertiary font-bold text-sm">×</span>
              <input value={a} onChange={(e) => setA(e.target.value)} className="w-9 text-center text-sm font-mono bg-surface-2 border border-border rounded select-text" />
              <button type="button" data-interactive onClick={save} className="text-[10px] text-brand font-semibold">OK</button>
            </div>
          ) : (
            <button
              type="button"
              data-interactive
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => onUpdate && setEditing(true)}
              className="px-3 py-1 rounded-md bg-positive/20 text-positive font-mono font-bold text-sm whitespace-nowrap"
            >
              {match.homeScore} × {match.awayScore}
            </button>
          )}
        </div>

        <div
          className={`flex items-center gap-1.5 min-w-0 px-2 py-1.5 border-l border-positive/25 ${
            awayWon ? 'bg-positive/10' : ''
          }`}
        >
          <Flag iso={away.iso} name={away.name} size={18} />
          <span className={`text-sm truncate ${awayWon ? 'font-bold text-positive' : 'font-medium text-text-primary'}`}>
            {away.name}
          </span>
          {awayWon && <span className="text-[9px] font-bold bg-positive/25 text-positive px-1 rounded shrink-0">V</span>}
        </div>
      </div>

      {isDraw && (
        <div className="text-center text-[10px] text-text-tertiary border-t border-positive/20 py-0.5">Empate</div>
      )}

      {match.performance && <MatchPerformanceLines performance={match.performance} compact bracket />}
    </div>
  )
}

function UpcomingMatchLine({ match }: { match: ResolvedMatch }) {
  const { getTeamById } = useTeams()
  const home = getTeamById(match.homeId)
  const away = getTeamById(match.awayId)
  if (!home || !away) return null

  return (
    <div
      className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center rounded border border-border/60 bg-surface-3/40 overflow-hidden"
      style={{ height: UPCOMING_ROW_H }}
    >
      <div className="flex items-center gap-1.5 min-w-0 justify-end px-2 border-r border-border/40">
        <span className="text-sm truncate text-right text-text-primary">{home.name}</span>
        <Flag iso={home.iso} name={home.name} size={16} />
      </div>

      <div className="flex flex-col items-center justify-center px-2 shrink-0">
        <span className="text-[10px] font-mono text-text-tertiary uppercase tracking-wide">vs</span>
        {match.probs && (
          <span className="text-[9px] font-mono text-brand">{formatPct(match.probs.home, 0)}</span>
        )}
      </div>

      <div className="flex items-center gap-1.5 min-w-0 px-2 border-l border-border/40">
        <Flag iso={away.iso} name={away.name} size={16} />
        <span className="text-sm truncate text-text-primary">{away.name}</span>
      </div>
    </div>
  )
}

function MirrorMatchCard({
  match,
  side,
  isFinal,
}: {
  match: SimulatedMatch
  side: 'left' | 'right' | 'center'
  isFinal?: boolean
}) {
  const { getTeamById } = useTeams()
  const home = match.homeId !== 'tbd' ? getTeamById(match.homeId) : null
  const away = match.awayId !== 'tbd' ? getTeamById(match.awayId) : null
  const played = match.homeScore !== null && match.awayScore !== null
  const isDraw = played && match.homeScore === match.awayScore
  const winner = played ? match.winnerId : match.projectedWinnerId
  const mirrorSide = side === 'center' ? 'left' : side

  return (
    <div
      className={`overflow-hidden rounded-lg border bg-surface-2 ${
        isFinal ? 'border-brand ring-2 ring-brand/30' : 'border-border'
      }`}
      style={{ minHeight: MIRROR_MATCH_H }}
    >
      {match.date && match.date !== 'Eliminatórias' && (
        <div className="text-[9px] text-text-tertiary px-2 py-0.5 border-b border-border truncate text-center">
          {match.date}{match.venue ? ` · ${match.venue}` : ''}
        </div>
      )}
      <MirrorTeamSlot
        team={home}
        align={mirrorSide}
        score={played ? match.homeScore! : undefined}
        prob={!played ? match.knockoutProbs?.home : undefined}
        isWinner={winner === match.homeId && !isDraw}
      />
      <div className="h-px bg-border" />
      <MirrorTeamSlot
        team={away}
        align={mirrorSide}
        score={played ? match.awayScore! : undefined}
        prob={!played ? match.knockoutProbs?.away : undefined}
        isWinner={winner === match.awayId && !isDraw}
      />
    </div>
  )
}

function MirrorTeamSlot({
  team,
  align,
  score,
  prob,
  isWinner,
}: {
  team: import('../data/teams').Team | null | undefined
  align: 'left' | 'right'
  score?: number
  prob?: number
  isWinner?: boolean
}) {
  if (!team) {
    return (
      <div
        className="flex items-center justify-center text-sm text-text-tertiary italic bg-surface-3/30"
        style={{ height: MIRROR_TEAM_H }}
      >
        A definir
      </div>
    )
  }

  const nameEl = (
    <span className={`text-sm truncate ${isWinner ? 'font-bold text-positive' : 'font-medium text-text-primary'}`}>
      {team.name}
    </span>
  )
  const flagEl = <Flag iso={team.iso} name={team.name} size={18} />
  const extraEl = isWinner ? (
    <span className="text-[9px] font-bold text-positive bg-positive/20 px-1 rounded shrink-0">V</span>
  ) : score !== undefined ? (
    <span className={`text-sm font-mono font-bold shrink-0 ${isWinner ? 'text-positive' : 'text-text-tertiary'}`}>{score}</span>
  ) : prob !== undefined ? (
    <span className="text-[10px] font-mono text-brand shrink-0">{formatPct(prob, 0)}</span>
  ) : null

  return (
    <div
      className={`flex items-center gap-2 px-2 ${isWinner ? 'bg-positive/12' : 'bg-surface-3/20'}`}
      style={{ height: MIRROR_TEAM_H }}
    >
      {align === 'left' ? (
        <>
          {flagEl}
          {nameEl}
          <span className="flex-1" />
          {extraEl}
        </>
      ) : (
        <>
          {extraEl}
          <span className="flex-1" />
          {nameEl}
          {flagEl}
        </>
      )}
    </div>
  )
}

function KnockoutCard({ match, isFinal }: { match: SimulatedMatch; isFinal?: boolean }) {
  const { getTeamById } = useTeams()
  const home = match.homeId !== 'tbd' ? getTeamById(match.homeId) : null
  const away = match.awayId !== 'tbd' ? getTeamById(match.awayId) : null
  const played = match.homeScore !== null && match.awayScore !== null
  const isDraw = played && match.homeScore === match.awayScore
  const winner = played ? match.winnerId : match.projectedWinnerId

  return (
    <div
      className={`rounded-lg border-2 bg-surface-2 overflow-hidden ${
        isFinal ? 'border-brand ring-2 ring-brand/30' : 'border-border'
      }`}
      style={{ minHeight: KNOCKOUT_MATCH_H }}
    >
      {match.label && (
        <div className="text-[9px] text-text-tertiary px-2 py-0.5 border-b border-border truncate">{match.label}</div>
      )}
      <KoSlot team={home} score={played ? match.homeScore! : undefined} prob={!played ? match.knockoutProbs?.home : undefined} isWinner={winner === match.homeId && !isDraw} />
      <div className="h-px bg-border" />
      <KoSlot team={away} score={played ? match.awayScore! : undefined} prob={!played ? match.knockoutProbs?.away : undefined} isWinner={winner === match.awayId && !isDraw} />
    </div>
  )
}

function KoSlot({
  team,
  score,
  prob,
  isWinner,
}: {
  team: import('../data/teams').Team | null | undefined
  score?: number
  prob?: number
  isWinner?: boolean
}) {
  if (!team) {
    return <div className="h-[34px] px-3 text-sm text-text-tertiary italic flex items-center">A definir</div>
  }
  return (
    <div className={`flex items-center justify-between h-[34px] px-3 gap-2 ${isWinner ? 'bg-positive/15' : ''}`}>
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <Flag iso={team.iso} name={team.name} size={18} />
        <span className={`text-sm truncate ${isWinner ? 'font-bold text-positive' : 'font-medium'}`}>{team.name}</span>
        {isWinner && <span className="text-[10px] font-bold text-positive bg-positive/20 px-1 rounded">V</span>}
      </div>
      {score !== undefined ? (
        <span className={`text-sm font-mono font-bold ${isWinner ? 'text-positive' : 'text-text-tertiary'}`}>{score}</span>
      ) : prob !== undefined ? (
        <span className="text-xs font-mono text-brand">{formatPct(prob, 0)}</span>
      ) : null}
    </div>
  )
}
