import { useState, useCallback } from 'react'
import type { Team } from '../data/teams'
import { runMonteCarloSimulation, type SimulationResult, formatPct } from '../lib/simulation'
import { Card, SectionHeader, Button, Flag } from './ui'
import { TeamTable } from './TeamTable'

interface SimulationPanelProps {
  teams: Team[]
}

export function SimulationPanel({ teams }: SimulationPanelProps) {
  const [iterations, setIterations] = useState(10000)
  const [homeAdvantage, setHomeAdvantage] = useState(50)
  const [randomness, setRandomness] = useState(350)
  const [marketBlend, setMarketBlend] = useState(40)
  const [isRunning, setIsRunning] = useState(false)
  const [results, setResults] = useState<SimulationResult[] | null>(null)

  const contenders = teams.filter((t) => t.market.aggregate >= 0.5)

  const runSimulation = useCallback(() => {
    setIsRunning(true)
    setTimeout(() => {
      const simResults = runMonteCarloSimulation(contenders, {
        iterations,
        homeAdvantage,
        randomness,
        useMarketBlend: marketBlend / 100,
      })
      setResults(simResults)
      setIsRunning(false)
    }, 800)
  }, [contenders, iterations, homeAdvantage, randomness, marketBlend])

  const simMap = results ? new Map(results.map((r) => [r.teamId, r.winProb])) : undefined

  const sliders = [
    { label: 'Iterações', value: iterations, min: 1000, max: 50000, step: 1000, display: iterations.toLocaleString(), onChange: setIterations },
    { label: 'Vantagem de mando (Elo)', value: homeAdvantage, min: 0, max: 150, step: 10, display: String(homeAdvantage), onChange: setHomeAdvantage },
    { label: 'Aleatoriedade', value: randomness, min: 100, max: 700, step: 50, display: String(randomness), onChange: setRandomness },
    { label: 'Peso do mercado', value: marketBlend, min: 0, max: 80, step: 5, display: `${marketBlend}%`, onChange: setMarketBlend },
  ]

  return (
    <div className="space-y-6 animate-enter w-full min-w-0">
      <div>
        <h2 className="text-xl font-semibold text-text-primary tracking-tight">Simulação Monte Carlo</h2>
        <p className="text-sm text-text-secondary mt-1">
          Modelo eliminatório baseado em Elo com calibração por dados de mercado.
        </p>
      </div>

      <Card>
        <SectionHeader
          title="Parâmetros do modelo"
          description="Ajuste os fatores e execute a simulação. Resultados são complementares às probabilidades de mercado."
        />

        <div className="grid sm:grid-cols-2 gap-5 mb-5">
          {sliders.map((s) => (
            <div key={s.label}>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-text-secondary">{s.label}</span>
                <span className="font-mono text-text-primary">{s.display}</span>
              </div>
              <input
                type="range"
                min={s.min}
                max={s.max}
                step={s.step}
                value={s.value}
                onChange={(e) => s.onChange(Number(e.target.value))}
                className="w-full"
              />
            </div>
          ))}
        </div>

        <Button onClick={runSimulation} disabled={isRunning}>
          {isRunning ? 'Processando...' : 'Executar simulação'}
        </Button>
      </Card>

      {results && (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {results
              .sort((a, b) => b.winProb - a.winProb)
              .slice(0, 4)
              .map((r) => {
                const team = teams.find((t) => t.id === r.teamId)!
                return (
                  <Card key={r.teamId} padding="sm">
                    <div className="flex items-center gap-2 mb-3">
                      <Flag iso={team.iso} name={team.name} size={22} />
                      <span className="text-sm font-medium">{team.name}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { label: 'Oitavas', value: r.roundOf16Prob },
                        { label: 'Quartas', value: r.quarterfinalProb },
                        { label: 'Semis', value: r.semifinalProb },
                        { label: 'Título', value: r.winProb },
                      ].map((m) => (
                        <div key={m.label} className="bg-surface-1 rounded px-2 py-1.5">
                          <div className="text-[10px] text-text-tertiary uppercase">{m.label}</div>
                          <div className="text-sm font-mono font-medium text-text-primary">{formatPct(m.value)}</div>
                        </div>
                      ))}
                    </div>
                  </Card>
                )
              })}
          </div>

          <Card padding="lg">
            <SectionHeader title="Resultados simulados" />
            <TeamTable teams={contenders} simulationMap={simMap} mode="simulation" />
          </Card>
        </>
      )}
    </div>
  )
}
