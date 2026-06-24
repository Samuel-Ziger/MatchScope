import { useState, useMemo } from 'react'
import type { Team } from '../data/teams'
import { simulateHeadToHead, formatPct } from '../lib/simulation'
import { Card, Flag } from './ui'

interface HeadToHeadProps {
  teams: Team[]
}

export function HeadToHead({ teams }: HeadToHeadProps) {
  const sorted = useMemo(() => [...teams].sort((a, b) => b.market.aggregate - a.market.aggregate), [teams])
  const [teamAId, setTeamAId] = useState('bra')
  const [teamBId, setTeamBId] = useState('arg')

  const teamA = teams.find((t) => t.id === teamAId)!
  const teamB = teams.find((t) => t.id === teamBId)!

  const result = useMemo(() => simulateHeadToHead(teamA, teamB, 5000), [teamA, teamB])

  const comparisons = [
    { label: 'Elo', a: teamA.elo, b: teamB.elo },
    { label: 'FIFA Ranking', a: teamA.fifaRank, b: teamB.fifaRank, invert: true },
    { label: 'Prob. título', a: teamA.market.aggregate, b: teamB.market.aggregate, suffix: '%' },
    { label: 'Prob. oitavas', a: teamA.tournament.reachR16, b: teamB.tournament.reachR16, suffix: '%' },
    { label: 'Prob. grupo', a: teamA.tournament.winGroupKalshi, b: teamB.tournament.winGroupKalshi, suffix: '%' },
  ]

  return (
    <div className="space-y-6 animate-enter w-full min-w-0">
      <div>
        <h2 className="text-xl font-semibold text-text-primary tracking-tight">Análise de Confronto</h2>
        <p className="text-sm text-text-secondary mt-1">
          Comparação head-to-head baseada em ratings Elo com simulação de 5.000 partidas.
        </p>
      </div>

      <Card>
        <div className="grid sm:grid-cols-[1fr_auto_1fr] gap-4 items-end">
          <div>
            <label className="text-xs text-text-tertiary uppercase tracking-wider mb-2 block">Seleção A</label>
            <select
              value={teamAId}
              onChange={(e) => setTeamAId(e.target.value)}
              className="w-full bg-surface-1 border border-border rounded-md px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-brand/50"
            >
              {sorted.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
          <div className="text-center text-xs font-mono text-text-tertiary pb-2.5">VS</div>
          <div>
            <label className="text-xs text-text-tertiary uppercase tracking-wider mb-2 block">Seleção B</label>
            <select
              value={teamBId}
              onChange={(e) => setTeamBId(e.target.value)}
              className="w-full bg-surface-1 border border-border rounded-md px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-brand/50"
            >
              {sorted.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      <Card padding="lg">
        <div className="grid sm:grid-cols-3 gap-6 mb-8">
          <TeamBlock team={teamA} prob={result.teamAWin} align="left" />
          <div className="flex flex-col items-center justify-center">
            <div className="text-xs text-text-tertiary uppercase tracking-wider mb-2">Empate</div>
            <div className="text-lg font-mono font-semibold text-text-secondary">{formatPct(result.draw)}</div>
          </div>
          <TeamBlock team={teamB} prob={result.teamBWin} align="right" />
        </div>

        <div className="flex h-2 rounded-full overflow-hidden bg-surface-1 mb-6">
          <div className="bg-brand transition-all" style={{ width: `${result.teamAWin}%` }} />
          <div className="bg-surface-3 transition-all" style={{ width: `${result.draw}%` }} />
          <div className="bg-warning transition-all" style={{ width: `${result.teamBWin}%` }} />
        </div>

        <div className="space-y-3">
          {comparisons.map((c) => {
            const total = c.invert ? (1 / c.a + 1 / c.b) : c.a + c.b
            const pctA = c.invert ? ((1 / c.a) / total) * 100 : (c.a / total) * 100
            const suffix = c.suffix ?? ''

            return (
              <div key={c.label}>
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span className="text-text-primary">{c.a}{suffix}</span>
                  <span className="text-text-tertiary">{c.label}</span>
                  <span className="text-text-primary">{c.b}{suffix}</span>
                </div>
                <div className="flex h-1.5 rounded-full overflow-hidden bg-surface-1">
                  <div className="bg-brand" style={{ width: `${pctA}%` }} />
                  <div className="bg-warning" style={{ width: `${100 - pctA}%` }} />
                </div>
              </div>
            )
          })}
        </div>
      </Card>
    </div>
  )
}

function TeamBlock({ team, prob, align }: { team: Team; prob: number; align: 'left' | 'right' }) {
  return (
    <div className={`flex flex-col ${align === 'right' ? 'items-end text-right' : 'items-start'}`}>
      <Flag iso={team.iso} name={team.name} size={32} />
      <div className="text-base font-semibold text-text-primary mt-2">{team.name}</div>
      <div className="text-xs text-text-tertiary">Elo {team.elo} · Grupo {team.group}</div>
      <div className="text-2xl font-mono font-semibold text-text-primary mt-2">{formatPct(prob)}</div>
      <div className="text-xs text-text-tertiary">vitória simulada</div>
    </div>
  )
}
