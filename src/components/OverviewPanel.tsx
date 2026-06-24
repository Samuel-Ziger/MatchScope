import type { Team } from '../data/teams'
import { DATA_LAST_UPDATED } from '../data/teams'
import { DATA_SOURCES } from '../data/sources'
import { Card, KpiCard, SectionHeader, Flag } from './ui'
import { formatPct } from '../lib/simulation'
import { useTournament } from '../context/TournamentContext'
import { BRACKET_MC_ITERATIONS } from '../lib/bracketSimulation'

interface OverviewPanelProps {
  teams: Team[]
}

export function OverviewPanel({ teams }: OverviewPanelProps) {
  const { state } = useTournament()
  const modelProbs = state.simulatedBracket.championProbabilities

  const modelTop5 = modelProbs
    .slice(0, 5)
    .map((entry) => {
      const team = teams.find((t) => t.id === entry.teamId)
      return team ? { team, modelProb: entry.prob } : null
    })
    .filter((x): x is { team: Team; modelProb: number } => !!x)

  const leader = modelTop5[0]
  const marketLeader = [...teams].sort((a, b) => b.market.aggregate - a.market.aggregate)[0]
  const momentumLeader = [...teams].sort((a, b) => b.market.momentum24h - a.market.momentum24h)[0]
  const volumeHelp = DATA_SOURCES.market.volume24h.help

  return (
    <div className="space-y-6 animate-enter w-full min-w-0">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-text-primary tracking-tight">
            Probabilidades de Título
          </h2>
          <p className="text-sm text-text-secondary mt-1">
            Modelo da chave (Elo + forma + Monte Carlo {BRACKET_MC_ITERATIONS.toLocaleString('pt-BR')}×) · Mercado em comparação
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-text-tertiary">
          <span className="w-2 h-2 rounded-full bg-positive animate-pulse" />
          Atualizado com {state.played}/{state.total} jogos de grupo
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard
          label="Favorito (modelo)"
          value={leader?.team.name ?? '—'}
          sublabel={leader ? formatPct(leader.modelProb) : '—'}
        />
        <KpiCard
          label="Favorito (mercado)"
          value={marketLeader?.name ?? '—'}
          sublabel={marketLeader ? formatPct(marketLeader.market.aggregate) : '—'}
        />
        <KpiCard
          label="Volume 24h"
          value={DATA_SOURCES.market.volume24h.value}
          sublabel="Mercados agregados"
          help={{
            title: volumeHelp.title,
            body: (
              <>
                {volumeHelp.paragraphs.map((p) => (
                  <p key={p.slice(0, 24)}>{p}</p>
                ))}
                <p className="text-[11px] text-text-tertiary pt-1 border-t border-border">
                  Referência: {DATA_SOURCES.market.volume24h.asOf}
                </p>
              </>
            ),
          }}
        />
        <KpiCard
          label="Maior momentum"
          value={momentumLeader?.name ?? '—'}
          sublabel="24 horas"
          trend={momentumLeader?.market.momentum24h}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {modelTop5.map(({ team, modelProb }, i) => (
          <Card key={team.id} padding="sm" className={i === 0 ? 'border-brand/30' : ''}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono text-text-tertiary">#{i + 1}</span>
              {team.titles > 0 && (
                <span className="text-[10px] text-text-tertiary">{team.titles}× campeão</span>
              )}
            </div>
            <div className="flex items-center gap-2.5 mb-3">
              <Flag iso={team.iso} name={team.name} size={28} />
              <div>
                <div className="text-sm font-semibold text-text-primary">{team.name}</div>
                <div className="text-[11px] text-text-tertiary">Grupo {team.group}</div>
              </div>
            </div>
            <div className="text-2xl font-mono font-semibold text-text-primary mb-0.5">
              {formatPct(modelProb)}
            </div>
            <div className="text-[11px] text-text-tertiary mb-3">
              Mercado: {formatPct(team.market.aggregate)}
            </div>
            <div className="h-1 bg-surface-3 rounded-full overflow-hidden mb-3">
              <div
                className="h-full bg-brand rounded-full"
                style={{
                  width: `${modelTop5[0] ? (modelProb / modelTop5[0].modelProb) * 100 : 0}%`,
                }}
              />
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div>
                <div className="text-text-tertiary">Oitavas</div>
                <div className="font-mono text-text-secondary">{formatPct(team.tournament.reachR16, 0)}</div>
              </div>
              <div>
                <div className="text-text-tertiary">Elo</div>
                <div className="font-mono text-text-secondary">{team.elo}</div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card>
        <SectionHeader
          title="Modelo vs mercado"
          description={
            leader && marketLeader && leader.team.id !== marketLeader.id
              ? `${leader.team.name} lidera no modelo da chave (${formatPct(leader.modelProb)}), enquanto o mercado aponta ${marketLeader.name} (${formatPct(marketLeader.market.aggregate)}). O modelo considera o caminho real da Copa — grupos, 32 avos e confrontos projetados — além de Elo e forma recente.`
              : `Modelo e mercado convergem em ${leader?.team.name ?? '—'} como principal favorito. O modelo simula a chave completa com ${BRACKET_MC_ITERATIONS.toLocaleString('pt-BR')} iterações Monte Carlo.`
          }
        />
        <div className="grid sm:grid-cols-3 gap-4 text-sm">
          <div className="border-l-2 border-brand pl-3">
            <div className="text-text-tertiary text-xs mb-1">Modelo da chave</div>
            <div className="text-text-primary">
              Mesma engine do mapa interativo — classificação, chave FIFA e mata-mata simulado
            </div>
          </div>
          <div className="border-l-2 border-positive pl-3">
            <div className="text-text-tertiary text-xs mb-1">Mercado</div>
            <div className="text-text-primary">
              Odds agregadas (Kalshi + Polymarket) na aba Probabilidades — reflete apostas, não o caminho da chave
            </div>
          </div>
          <div className="border-l-2 border-warning pl-3">
            <div className="text-text-tertiary text-xs mb-1">Dados base</div>
            <div className="text-text-primary">
              Seleções e mercado: {DATA_LAST_UPDATED} · Jogos: {state.played}/{state.total} com resultado
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
