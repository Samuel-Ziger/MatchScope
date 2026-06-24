import { useMemo, useState } from 'react'
import { GROUPS, CONFEDERATION_COLORS, CONFEDERATION_LABELS, type Team } from '../data/teams'
import { useTeams } from '../context/TeamsContext'
import { getSquadByTeamId, POSITION_LABELS, SQUAD_SOURCE, type Player, type PlayerPosition } from '../data/squads'
import { formatPct, probToAmericanOdds } from '../lib/simulation'
import { Card, Flag, Badge, SectionHeader } from './ui'

const GROUPS_LIST = 'ABCDEFGHIJKL'.split('')

export function TeamsPanel() {
  const { teams } = useTeams()
  const [selectedGroup, setSelectedGroup] = useState('A')
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null)

  const groupTeams = useMemo(
    () => GROUPS[selectedGroup]?.map((id) => teams.find((t) => t.id === id)!).filter(Boolean) ?? [],
    [selectedGroup, teams],
  )

  const selectedTeam = selectedTeamId ? teams.find((t) => t.id === selectedTeamId) : null
  const squad = selectedTeamId ? getSquadByTeamId(selectedTeamId) : undefined

  if (selectedTeam && squad) {
    return (
      <TeamDetail
        team={selectedTeam}
        squad={squad}
        onBack={() => setSelectedTeamId(null)}
      />
    )
  }

  return (
    <div className="space-y-6 animate-enter w-full min-w-0">
      <div>
        <h2 className="text-xl font-semibold text-text-primary tracking-tight">48 Seleções</h2>
        <p className="text-sm text-text-secondary mt-1">
          Elencos oficiais de 26 jogadores · Fonte: {SQUAD_SOURCE}
        </p>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {GROUPS_LIST.map((g) => (
          <button
            key={g}
            onClick={() => setSelectedGroup(g)}
            className={`px-3 py-1.5 rounded-md text-sm font-mono font-medium transition-colors ${
              selectedGroup === g
                ? 'bg-brand text-white'
                : 'bg-surface-2 border border-border text-text-secondary hover:text-text-primary'
            }`}
          >
            Grupo {g}
          </button>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {groupTeams.map((team) => {
          const s = getSquadByTeamId(team.id)
          return (
            <button
              key={team.id}
              onClick={() => setSelectedTeamId(team.id)}
              className="text-left bg-surface-2 border border-border rounded-lg p-4 hover:border-brand/40 transition-colors group"
            >
              <div className="flex items-center gap-3 mb-3">
                <Flag iso={team.iso} name={team.name} size={32} />
                <div className="min-w-0">
                  <div className="font-semibold text-text-primary truncate">{team.name}</div>
                  <div className="text-xs text-text-tertiary">Grupo {team.group}</div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-lg font-mono font-semibold text-text-primary">
                  {formatPct(team.market.aggregate)}
                </span>
                <span className="text-xs text-text-tertiary">
                  {s?.players.length ?? 0} jogadores
                </span>
              </div>
              {s && (
                <div className="text-xs text-text-tertiary mt-2 truncate">
                  Téc: {s.coach}
                </div>
              )}
            </button>
          )
        })}
      </div>

      <p className="text-xs text-text-tertiary">
        {teams.length} seleções · Clique em uma seleção para ver elenco completo e estatísticas
      </p>
    </div>
  )
}

function TeamDetail({
  team,
  squad,
  onBack,
}: {
  team: Team
  squad: NonNullable<ReturnType<typeof getSquadByTeamId>>
  onBack: () => void
}) {
  const byPosition = useMemo(() => {
    const groups: Record<PlayerPosition, Player[]> = { GK: [], DF: [], MF: [], FW: [] }
    squad.players.forEach((p) => groups[p.position].push(p))
    return groups
  }, [squad])

  return (
    <div className="space-y-6 animate-enter w-full min-w-0">
      <button
        onClick={onBack}
        className="text-sm text-text-secondary hover:text-brand transition-colors"
      >
        ← Voltar às seleções
      </button>

      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <Flag iso={team.iso} name={team.name} size={48} />
        <div className="flex-1">
          <h2 className="text-2xl font-semibold text-text-primary">{team.name}</h2>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <Badge color={CONFEDERATION_COLORS[team.confederation]}>
              {CONFEDERATION_LABELS[team.confederation]}
            </Badge>
            <span className="text-sm text-text-tertiary">Grupo {team.group}</span>
            {team.titles > 0 && (
              <span className="text-sm text-text-tertiary">{team.titles}× campeão mundial</span>
            )}
          </div>
        </div>
        <div className="text-right">
          <div className="text-3xl font-mono font-semibold text-text-primary">
            {formatPct(team.market.aggregate)}
          </div>
          <div className="text-xs text-text-tertiary">prob. título · {probToAmericanOdds(team.market.aggregate)}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        <Stat label="Elo" value={String(team.elo)} />
        <Stat label="FIFA" value={`#${team.fifaRank}`} />
        <Stat label="Kalshi" value={formatPct(team.market.kalshi)} />
        <Stat label="Polymarket" value={formatPct(team.market.polymarket)} />
        <Stat label="Oitavas" value={formatPct(team.tournament.reachR16, 0)} />
        <Stat label="Vencer grupo" value={formatPct(team.tournament.winGroupKalshi, 0)} />
      </div>

      <Card>
        <SectionHeader
          title="Comissão técnica"
          description={`Elenco anunciado em ${squad.announced}`}
        />
        <div className="text-sm">
          <span className="text-text-tertiary">Técnico: </span>
          <span className="font-medium text-text-primary">{squad.coach}</span>
        </div>
      </Card>

      <Card padding="lg">
        <SectionHeader
          title={`Elenco — ${squad.players.length} jogadores`}
          description={SQUAD_SOURCE}
        />

        <div className="space-y-6">
          {(['GK', 'DF', 'MF', 'FW'] as PlayerPosition[]).map((pos) =>
            byPosition[pos].length > 0 ? (
              <div key={pos}>
                <h4 className="text-xs font-medium text-text-tertiary uppercase tracking-wider mb-3">
                  {POSITION_LABELS[pos]} ({byPosition[pos].length})
                </h4>
                <div className="border border-border rounded-lg overflow-hidden overflow-x-auto">
                  <table className="w-full min-w-[280px]">
                    <thead className="bg-surface-1">
                      <tr>
                        <th className="text-left text-[11px] font-medium text-text-tertiary uppercase px-4 py-2 w-8">#</th>
                        <th className="text-left text-[11px] font-medium text-text-tertiary uppercase px-4 py-2">Jogador</th>
                        <th className="text-left text-[11px] font-medium text-text-tertiary uppercase px-4 py-2">Clube</th>
                      </tr>
                    </thead>
                    <tbody>
                      {byPosition[pos].map((player, i) => (
                        <tr key={player.name} className="border-t border-border-subtle hover:bg-surface-1/50">
                          <td className="px-4 py-2.5 text-xs font-mono text-text-tertiary">{i + 1}</td>
                          <td className="px-4 py-2.5 text-sm font-medium text-text-primary">{player.name}</td>
                          <td className="px-4 py-2.5 text-sm text-text-secondary break-words max-w-[12rem] sm:max-w-none">{player.club}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : null,
          )}
        </div>
      </Card>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-surface-2 border border-border rounded-lg px-3 py-2.5">
      <div className="text-[10px] text-text-tertiary uppercase tracking-wider">{label}</div>
      <div className="text-sm font-mono font-semibold text-text-primary mt-0.5">{value}</div>
    </div>
  )
}
