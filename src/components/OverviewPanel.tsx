import type { Team } from '../data/teams'
import { DATA_LAST_UPDATED } from '../data/teams'
import { DATA_SOURCES } from '../data/sources'
import { Card, KpiCard, SectionHeader, Flag } from './ui'
import { formatPct } from '../lib/simulation'

interface OverviewPanelProps {
  teams: Team[]
}

export function OverviewPanel({ teams }: OverviewPanelProps) {
  const top5 = [...teams].sort((a, b) => b.market.aggregate - a.market.aggregate).slice(0, 5)
  const leader = top5[0]
  const volumeHelp = DATA_SOURCES.market.volume24h.help
  const openContenders = teams.filter((t) => t.market.aggregate >= 1).length

  return (
    <div className="space-y-6 animate-enter w-full min-w-0">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-text-primary tracking-tight">
            Probabilidades de Título
          </h2>
          <p className="text-sm text-text-secondary mt-1">
            Dados agregados de mercados de previsão · Atualizado em {DATA_LAST_UPDATED}
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-text-tertiary">
          <span className="w-2 h-2 rounded-full bg-positive animate-pulse" />
          Mercados ativos
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard
          label="Favorito"
          value={leader.name}
          sublabel={formatPct(leader.market.aggregate)}
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
          label="Contenders"
          value={String(openContenders)}
          sublabel="≥ 1% prob. título"
        />
        <KpiCard
          label="Maior momentum"
          value="Argentina"
          sublabel="24 horas"
          trend={1.4}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {top5.map((team, i) => (
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
            <div className="text-2xl font-mono font-semibold text-text-primary mb-1">
              {formatPct(team.market.aggregate)}
            </div>
            <div className="h-1 bg-surface-3 rounded-full overflow-hidden mb-3">
              <div
                className="h-full bg-brand rounded-full"
                style={{ width: `${(team.market.aggregate / top5[0].market.aggregate) * 100}%` }}
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
          title="Resumo do mercado"
          description="A França consolidou a liderança após vitórias convincentes na fase de grupos. Argentina subiu com +1,4% em 24h após desempenho de Messi. Espanha recuou levemente após empate com Cabo Verde, mas reagiu com 4-0 sobre Arábia Saudita."
        />
        <div className="grid sm:grid-cols-3 gap-4 text-sm">
          <div className="border-l-2 border-brand pl-3">
            <div className="text-text-tertiary text-xs mb-1">Tendência</div>
            <div className="text-text-primary">Mercado sem favorito absoluto — margens estreitas entre top 4</div>
          </div>
          <div className="border-l-2 border-positive pl-3">
            <div className="text-text-tertiary text-xs mb-1">Surpresa positiva</div>
            <div className="text-text-primary">EUA triplicaram probabilidade desde o pré-torneio (1,6% → 4,1%)</div>
          </div>
          <div className="border-l-2 border-warning pl-3">
            <div className="text-text-tertiary text-xs mb-1">Formato 48 times</div>
            <div className="text-text-primary">Mais seleções nas oitavas aumentam chance de zebras no mata-mata</div>
          </div>
        </div>
      </Card>
    </div>
  )
}
