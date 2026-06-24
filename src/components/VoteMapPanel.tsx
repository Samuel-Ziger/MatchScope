import { useMemo } from 'react'
import { useTeams } from '../context/TeamsContext'
import { useVotes } from '../context/VotesContext'
import { votePct, sortedVoteTotals } from '../lib/votes/client'
import { computeVoteMapLayout } from '../lib/voteLayout'
import { BracketViewport } from './BracketViewport'
import { VoteMapCanvas } from './VoteMapCanvas'
import { Card, Flag, SectionHeader } from './ui'

export function VoteMapPanel() {
  const { teams, getTeamById } = useTeams()
  const { snapshot, myTeamId, voting, lastMessage, castVote, refresh } = useVotes()
  const layout = useMemo(() => computeVoteMapLayout(), [])

  const leader = sortedVoteTotals(snapshot.totals)[0]
  const leaderTeam = leader ? getTeamById(leader.teamId) : null
  const myTeam = myTeamId ? getTeamById(myTeamId) : null

  const endsLabel = new Date(snapshot.endsAt).toLocaleString('pt-BR', {
    dateStyle: 'long',
    timeStyle: 'short',
  })

  return (
    <div className="space-y-6 animate-enter w-full min-w-0">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-text-primary tracking-tight">Mapa ao Vivo — Voto Popular</h2>
          <p className="text-sm text-text-secondary mt-1 leading-relaxed">
            Escolha sua seleção campeã. Os votos atualizam em tempo real até o fim da Copa.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border ${
              snapshot.active
                ? 'border-positive/40 text-positive bg-positive/10'
                : 'border-text-tertiary/40 text-text-tertiary'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${snapshot.active ? 'bg-positive animate-pulse' : 'bg-text-tertiary'}`} />
            {snapshot.active ? 'Votação aberta' : 'Encerrada'}
          </span>
          <button
            type="button"
            onClick={() => void refresh()}
            className="text-xs font-medium text-text-secondary hover:text-text-primary px-3 py-1.5 border border-border rounded-md"
          >
            Atualizar
          </button>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Total de votos" value={String(snapshot.totalVoters)} />
        <StatCard
          label="Líder popular"
          value={leaderTeam?.name ?? '—'}
          sub={leader ? `${leader.count} votos · ${leader.pct}%` : undefined}
        />
        <StatCard
          label="Seu voto"
          value={myTeam?.name ?? 'Nenhum'}
          sub={myTeam ? `${votePct(snapshot.totals, myTeam.id)}% do total` : 'Clique numa seleção no mapa'}
        />
        <StatCard label="Encerra em" value={snapshot.active ? endsLabel : 'Copa finalizada'} small />
      </div>

      {lastMessage && (
        <p className={`text-xs ${lastMessage.includes('sucesso') || lastMessage.includes('alterado') ? 'text-positive' : 'text-text-secondary'}`}>
          {lastMessage}
        </p>
      )}

      <BracketViewport layoutWidth={layout.width} layoutHeight={layout.height}>
        <VoteMapCanvas
          layout={layout}
          totals={snapshot.totals}
          myTeamId={myTeamId}
          disabled={!snapshot.active || voting}
          onVote={(teamId) => void castVote(teamId)}
        />
      </BracketViewport>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="min-w-0">
          <SectionHeader title="Ranking popular" description="Seleções mais votadas para campeã" />
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {sortedVoteTotals(snapshot.totals).slice(0, 12).map((row, i) => {
              const team = getTeamById(row.teamId)
              if (!team) return null
              const isMine = row.teamId === myTeamId
              return (
                <div
                  key={row.teamId}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg border ${
                    isMine ? 'border-brand/50 bg-brand/10' : 'border-border bg-surface-1/40'
                  }`}
                >
                  <span className="text-xs font-mono text-text-tertiary w-5">{i + 1}</span>
                  <Flag iso={team.iso} name={team.name} size={22} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{team.name}</div>
                    <div className="h-1.5 bg-surface-3 rounded-full mt-1 overflow-hidden">
                      <div className="h-full bg-brand rounded-full" style={{ width: `${Math.min(100, row.pct)}%` }} />
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm font-mono font-semibold">{row.pct}%</div>
                    <div className="text-[10px] text-text-tertiary">{row.count} votos</div>
                  </div>
                </div>
              )
            })}
            {snapshot.totalVoters === 0 && (
              <p className="text-sm text-text-tertiary py-4 text-center">Seja o primeiro a votar!</p>
            )}
          </div>
        </Card>

        <Card className="min-w-0">
          <SectionHeader title="Atividade recente" description="Últimos votos registrados (sem dados pessoais)" />
          <div className="space-y-1.5 max-h-80 overflow-y-auto">
            {snapshot.recent.map((r, i) => {
              const team = getTeamById(r.teamId)
              if (!team) return null
              return (
                <div key={`${r.teamId}-${r.votedAt}-${i}`} className="flex items-center gap-2 text-sm py-1.5 border-b border-border-subtle last:border-0">
                  <Flag iso={team.iso} name={team.name} size={18} />
                  <span className="flex-1 truncate text-text-primary">{team.name}</span>
                  <span className="text-[10px] text-text-tertiary shrink-0">
                    {r.changed ? 'alterou · ' : ''}
                    {new Date(r.votedAt).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                  </span>
                </div>
              )
            })}
            {snapshot.recent.length === 0 && (
              <p className="text-sm text-text-tertiary py-4 text-center">Nenhum voto ainda.</p>
            )}
          </div>
        </Card>
      </div>

      <p className="text-xs text-text-tertiary">
        1 voto por dispositivo · você pode mudar de seleção a qualquer momento até o fim da Copa ·{' '}
        {teams.length} seleções no mapa
      </p>
    </div>
  )
}

function StatCard({
  label,
  value,
  sub,
  small,
}: {
  label: string
  value: string
  sub?: string
  small?: boolean
}) {
  return (
    <div className="bg-surface-2 border border-border rounded-lg p-4 min-w-0">
      <div className="text-xs font-medium text-text-tertiary uppercase tracking-wider mb-1">{label}</div>
      <div className={`font-semibold text-text-primary truncate ${small ? 'text-xs' : 'text-lg'}`}>{value}</div>
      {sub && <div className="text-xs text-text-secondary mt-0.5 truncate">{sub}</div>}
    </div>
  )
}
