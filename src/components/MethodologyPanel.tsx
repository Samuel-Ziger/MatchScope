import { DATA_SOURCES } from '../data/sources'
import { Card, SectionHeader } from './ui'

export function MethodologyPanel() {
  return (
    <div className="space-y-6 animate-enter w-full min-w-0 max-w-3xl">
      <div>
        <h2 className="text-xl font-semibold text-text-primary tracking-tight">Metodologia e Fontes</h2>
        <p className="text-sm text-text-secondary mt-1 leading-relaxed">
          Transparência sobre a origem dos dados, APIs integradas e como as probabilidades são calculadas.
        </p>
      </div>

      <Card>
        <SectionHeader
          title="APIs integradas"
          description="Serviços externos consumidos pelo sistema em produção."
        />
        <div className="space-y-4">
          {DATA_SOURCES.apis.map((api) => (
            <ApiBlock key={api.id} api={api} />
          ))}
        </div>
      </Card>

      <Card>
        <SectionHeader title="De onde vêm os dados?" />
        <div className="space-y-5">
          <SourceBlock
            title={DATA_SOURCES.market.name}
            description={DATA_SOURCES.market.description}
            asOf={DATA_SOURCES.lastUpdatedLabel}
            links={DATA_SOURCES.market.urls}
          />
          <SourceBlock
            title={DATA_SOURCES.elo.name}
            description={DATA_SOURCES.elo.description}
            asOf={DATA_SOURCES.elo.asOf}
            links={[{ label: 'eloratings.net', url: DATA_SOURCES.elo.url }]}
          />
          <SourceBlock
            title={DATA_SOURCES.fifa.name}
            description={DATA_SOURCES.fifa.description}
            asOf={DATA_SOURCES.fifa.asOf}
            links={[{ label: 'FIFA Rankings', url: DATA_SOURCES.fifa.url }]}
          />
          <SourceBlock
            title={DATA_SOURCES.tournament.name}
            description={DATA_SOURCES.tournament.description}
            asOf={DATA_SOURCES.lastUpdatedLabel}
            links={DATA_SOURCES.tournament.urls}
          />
          <SourceBlock
            title="Elencos oficiais FIFA"
            description="26 jogadores por seleção, confirmados em 1º de junho de 2026. Total de 1.248 atletas de 48 nações."
            asOf="02 de junho de 2026"
            links={[
              { label: 'FIFA.com', url: 'https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026/articles/fifa-world-cup-2026-squads-confirmed' },
              { label: 'USA Today', url: 'https://www.usatoday.com/story/sports/soccer/worldcup/2026/06/02/world-cup-2026-rosters-all-48-teams/90371525007/' },
            ]}
          />
        </div>
      </Card>

      <Card>
        <SectionHeader
          title="Como as probabilidades são calculadas"
          description="Cada métrica tem uma metodologia específica."
        />
        <dl className="space-y-4 text-sm">
          <MetricDef
            term="Probabilidade de título (modelo)"
            definition="Monte Carlo da chave completa: projeta grupos, aplica o template FIFA dos 32 avos e simula o mata-mata com Elo e forma recente. É a métrica usada em Visão Geral, Mapa / Chaves e Probabilidades."
          />
          <MetricDef
            term="Momentum 24h"
            definition="Variação da probabilidade agregada em relação à atualização anterior do cron (comparado entre execuções da The Odds API)."
          />
          <MetricDef
            term="Prob. Oitavas (R16)"
            definition="No modo modelo, mede a frequência com que a seleção chega às oitavas nas simulações da chave. Em comparativos de mercado, pode aparecer como referência externa de classificação."
          />
          <MetricDef
            term="Rating Elo"
            definition="Pontuação do sistema World Football Elo Ratings (eloratings.net), que considera margem de vitória, importância do jogo e vantagem de mando. Atualizado após cada partida."
          />
          <MetricDef
            term="Voto popular"
            definition="Mapa interativo onde qualquer visitante escolhe a seleção campeã. Votos ficam registrados no servidor, atualizam em tempo real e permanecem abertos até o final da Copa (19/07/2026). Um voto por dispositivo; é possível mudar de seleção."
          />
          <MetricDef
            term="Resultados de jogos"
            definition="Placares da fase de grupos sincronizados via openfootball/worldcup.json. O app lê data/matches-sync.json automaticamente."
          />
          <MetricDef
            term="Elenco de jogadores"
            definition="Lista oficial de 26 jogadores por seleção, publicada pela FIFA em 02/06/2026. Fonte: FIFA / USA Today. Inclui nome, posição e clube atual."
          />
          <MetricDef
            term="Simulação Monte Carlo"
            definition="Engine que simula a Copa inteira usando caminho real da chave, Elo, forma dos jogos já disputados e amostragem aleatória. As odds de Kalshi/Polymarket ficam como comparação, não como critério para escolher o campeão projetado."
          />
        </dl>
      </Card>

      <Card className="border-warning/20">
        <SectionHeader title="Aviso legal" />
        <p className="text-sm text-text-secondary leading-relaxed">
          Este site é uma ferramenta de análise informativa. Não constitui recomendação de apostas ou investimento.
          Probabilidades de mercado refletem expectativas dos participantes, não previsões garantidas.
          Dados podem estar desatualizados — verifique as fontes primárias antes de tomar decisões.
        </p>
      </Card>

      <div className="text-xs text-text-tertiary">
        Versão dos dados: {DATA_SOURCES.lastUpdatedLabel}
      </div>
    </div>
  )
}

function ApiBlock({ api }: { api: (typeof DATA_SOURCES.apis)[number] }) {
  return (
    <div className="border border-border rounded-lg p-4 bg-surface-secondary/30">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h4 className="text-sm font-semibold text-text-primary">{api.name}</h4>
          <p className="text-[11px] text-text-tertiary mt-0.5">{api.provider}</p>
        </div>
        <span className="text-[10px] font-medium uppercase tracking-wide text-brand bg-brand/10 px-2 py-0.5 rounded">
          API
        </span>
      </div>

      <p className="text-sm text-text-secondary mt-2 leading-relaxed">{api.purpose}</p>

      <dl className="mt-3 space-y-1.5 text-xs">
        <ApiRow label="Endpoint" value={api.endpoint} mono />
        <ApiRow label="Parâmetros" value={api.params} />
        <ApiRow label="Frequência" value={api.schedule} />
        <ApiRow label="Acionamento" value={api.trigger} />
      </dl>

      <div className="flex flex-wrap gap-3 mt-3 pt-3 border-t border-border">
        <a
          href={api.docs}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[11px] text-brand hover:underline"
        >
          Documentação ↗
        </a>
        <a
          href={api.dashboard}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[11px] text-brand hover:underline"
        >
          Dashboard ↗
        </a>
      </div>
    </div>
  )
}

function ApiRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex gap-2">
      <dt className="text-text-tertiary shrink-0 w-24">{label}</dt>
      <dd className={`text-text-secondary ${mono ? 'font-mono text-[11px]' : ''}`}>{value}</dd>
    </div>
  )
}

function SourceBlock({
  title,
  description,
  asOf,
  links,
}: {
  title: string
  description: string
  asOf: string
  links: readonly { label: string; url: string }[]
}) {
  return (
    <div className="border-l-2 border-border pl-4">
      <h4 className="text-sm font-semibold text-text-primary">{title}</h4>
      <p className="text-sm text-text-secondary mt-1 leading-relaxed">{description}</p>
      <div className="flex flex-wrap items-center gap-3 mt-2">
        <span className="text-[11px] text-text-tertiary">Ref: {asOf}</span>
        {links.map((l) => (
          <a
            key={l.url}
            href={l.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] text-brand hover:underline"
          >
            {l.label} ↗
          </a>
        ))}
      </div>
    </div>
  )
}

function MetricDef({ term, definition }: { term: string; definition: string }) {
  return (
    <div>
      <dt className="font-medium text-text-primary">{term}</dt>
      <dd className="text-text-secondary mt-0.5 leading-relaxed">{definition}</dd>
    </div>
  )
}
