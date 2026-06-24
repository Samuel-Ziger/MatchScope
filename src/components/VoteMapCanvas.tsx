import type { VoteMapLayout } from '../lib/voteLayout'
import { VOTE_GROUP_COLORS, VOTE_TEAM_ROW_H } from '../lib/voteLayout'
import { votePct } from '../lib/votes/client'
import { useTeams } from '../context/TeamsContext'
import { Flag } from './ui'

interface VoteMapCanvasProps {
  layout: VoteMapLayout
  totals: Record<string, number>
  myTeamId: string | null
  disabled?: boolean
  onVote: (teamId: string) => void
}

export function VoteMapCanvas({ layout, totals, myTeamId, disabled, onVote }: VoteMapCanvasProps) {
  return (
    <div className="relative select-none" style={{ width: layout.width, height: layout.height }}>
      <div
        className="absolute left-0 right-0 top-0 flex items-center justify-center pointer-events-none"
        style={{ height: 32 }}
      >
        <span className="text-sm font-semibold text-text-secondary tracking-wide">
          Voto popular — 48 seleções · 12 grupos
        </span>
      </div>

      {layout.groups.map((g) => (
        <VoteGroupCard
          key={g.group}
          group={g}
          totals={totals}
          myTeamId={myTeamId}
          disabled={disabled}
          onVote={onVote}
        />
      ))}
    </div>
  )
}

function VoteGroupCard({
  group: g,
  totals,
  myTeamId,
  disabled,
  onVote,
}: {
  group: VoteMapLayout['groups'][0]
  totals: Record<string, number>
  myTeamId: string | null
  disabled?: boolean
  onVote: (teamId: string) => void
}) {
  const { getTeamById } = useTeams()
  const color = VOTE_GROUP_COLORS[g.group] ?? '#4f8ff7'
  const groupTotal = g.teamIds.reduce((s, id) => s + (totals[id] || 0), 0)

  return (
    <div
      className="absolute rounded-xl border-2 bg-surface-2 flex flex-col overflow-hidden"
      style={{
        left: g.x,
        top: g.y,
        width: g.width,
        height: g.height,
        borderColor: `${color}55`,
      }}
    >
      <div
        className="px-4 py-2 border-b flex items-center justify-between shrink-0"
        style={{ backgroundColor: `${color}18`, borderColor: `${color}33` }}
      >
        <span className="text-sm font-bold" style={{ color }}>
          Grupo {g.group}
        </span>
        <span className="text-xs text-text-tertiary font-mono">{groupTotal} votos</span>
      </div>

      <div className="flex-1 px-3 py-2 space-y-1">
        {g.teamIds.map((teamId) => {
          const team = getTeamById(teamId)
          if (!team) return null
          const count = totals[teamId] || 0
          const pct = votePct(totals, teamId)
          const isMine = teamId === myTeamId
          const maxInGroup = Math.max(1, ...g.teamIds.map((id) => totals[id] || 0))
          const barW = (count / maxInGroup) * 100

          return (
            <button
              key={teamId}
              type="button"
              data-interactive
              disabled={disabled}
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation()
                onVote(teamId)
              }}
              className={`w-full flex items-center gap-2 px-2 rounded-lg border transition-colors text-left ${
                isMine
                  ? 'border-brand bg-brand/15 ring-1 ring-brand/40'
                  : 'border-border/60 bg-surface-3/30 hover:border-brand/40 hover:bg-brand/5'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
              style={{ minHeight: VOTE_TEAM_ROW_H - 4 }}
              title={isMine ? 'Seu voto atual — clique para manter ou escolha outra' : `Votar em ${team.name}`}
            >
              <Flag iso={team.iso} name={team.name} size={22} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className={`text-sm truncate ${isMine ? 'font-bold text-brand' : 'font-medium text-text-primary'}`}>
                    {team.name}
                    {isMine && <span className="ml-1 text-[10px] text-brand">★</span>}
                  </span>
                  <span className="text-xs font-mono text-text-secondary shrink-0">{count}</span>
                </div>
                <div className="h-1.5 bg-surface-1 rounded-full mt-1 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${barW}%`, backgroundColor: isMine ? '#4f8ff7' : `${color}cc` }}
                  />
                </div>
              </div>
              <span className="text-[10px] font-mono font-semibold w-10 text-right shrink-0" style={{ color: isMine ? '#4f8ff7' : undefined }}>
                {pct}%
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
