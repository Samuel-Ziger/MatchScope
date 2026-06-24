import { useMemo, useState } from 'react'
import { getSquadByTeamId } from '../data/squads'
import { CONFEDERATION_COLORS, CONFEDERATION_LABELS, type Team } from '../data/teams'
import { probToAmericanOdds, probToDecimalOdds, formatPct, formatMomentum } from '../lib/simulation'
import { Flag, Badge } from './ui'

interface TeamTableProps {
  teams: Team[]
  simulationMap?: Map<string, number>
  mode?: 'market' | 'simulation'
}

type SortKey = 'aggregate' | 'kalshi' | 'polymarket' | 'elo' | 'reachR16' | 'momentum'

export function TeamTable({ teams, simulationMap, mode = 'market' }: TeamTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('aggregate')
  const [sortAsc, setSortAsc] = useState(false)
  const [filter, setFilter] = useState('')
  const [confedFilter, setConfedFilter] = useState<string>('all')

  const sorted = useMemo(() => {
    let list = [...teams]

    if (filter) {
      const q = filter.toLowerCase()
      list = list.filter((t) => t.name.toLowerCase().includes(q) || t.group.toLowerCase() === q)
    }

    if (confedFilter !== 'all') {
      list = list.filter((t) => t.confederation === confedFilter)
    }

    list.sort((a, b) => {
      let va: number, vb: number
      switch (sortKey) {
        case 'kalshi': va = a.market.kalshi; vb = b.market.kalshi; break
        case 'polymarket': va = a.market.polymarket; vb = b.market.polymarket; break
        case 'elo': va = a.elo; vb = b.elo; break
        case 'reachR16': va = a.tournament.reachR16; vb = b.tournament.reachR16; break
        case 'momentum': va = a.market.momentum24h; vb = b.market.momentum24h; break
        default:
          if (mode === 'simulation' && simulationMap) {
            va = simulationMap.get(a.id) ?? a.market.aggregate
            vb = simulationMap.get(b.id) ?? b.market.aggregate
          } else {
            va = a.market.aggregate
            vb = b.market.aggregate
          }
      }
      return sortAsc ? va - vb : vb - va
    })

    return list
  }, [teams, sortKey, sortAsc, filter, confedFilter, mode, simulationMap])

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortAsc(!sortAsc)
    else { setSortKey(key); setSortAsc(false) }
  }

  const Th = ({ label, sort }: { label: string; sort: SortKey }) => (
    <th
      className="text-left text-[11px] font-medium text-text-tertiary uppercase tracking-wider px-4 py-3 cursor-pointer hover:text-text-secondary select-none whitespace-nowrap"
      onClick={() => toggleSort(sort)}
    >
      {label}
      {sortKey === sort && <span className="ml-1 text-brand">{sortAsc ? '↑' : '↓'}</span>}
    </th>
  )

  return (
    <div className="w-full min-w-0">
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <input
          type="text"
          placeholder="Buscar seleção ou grupo..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="flex-1 bg-surface-1 border border-border rounded-md px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-brand/50"
        />
        <select
          value={confedFilter}
          onChange={(e) => setConfedFilter(e.target.value)}
          className="bg-surface-1 border border-border rounded-md px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-brand/50"
        >
          <option value="all">Todas confederações</option>
          {Object.entries(CONFEDERATION_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>

      <div className="border border-border rounded-lg overflow-hidden w-full min-w-0">
        <div className="overflow-x-auto overscroll-x-contain -webkit-overflow-scrolling-touch">
          <table className="w-full min-w-[36rem] md:min-w-[52rem] lg:min-w-[56rem]">
            <thead className="bg-surface-1 border-b border-border">
              <tr>
                <th className="text-left text-[11px] font-medium text-text-tertiary uppercase tracking-wider px-4 py-3 w-10">#</th>
                <th className="text-left text-[11px] font-medium text-text-tertiary uppercase tracking-wider px-4 py-3">Seleção</th>
                <th className="text-left text-[11px] font-medium text-text-tertiary uppercase tracking-wider px-4 py-3">Grp</th>
                <Th label="Título (mix)" sort="aggregate" />
                <th className="hidden md:table-cell text-left text-[11px] font-medium text-text-tertiary uppercase tracking-wider px-4 py-3 cursor-pointer hover:text-text-secondary select-none whitespace-nowrap" onClick={() => toggleSort('kalshi')}>
                  Kalshi{sortKey === 'kalshi' && <span className="ml-1 text-brand">{sortAsc ? '↑' : '↓'}</span>}
                </th>
                <th className="hidden md:table-cell text-left text-[11px] font-medium text-text-tertiary uppercase tracking-wider px-4 py-3 cursor-pointer hover:text-text-secondary select-none whitespace-nowrap" onClick={() => toggleSort('polymarket')}>
                  Polymarket{sortKey === 'polymarket' && <span className="ml-1 text-brand">{sortAsc ? '↑' : '↓'}</span>}
                </th>
                <Th label="24h" sort="momentum" />
                <th className="hidden sm:table-cell text-left text-[11px] font-medium text-text-tertiary uppercase tracking-wider px-4 py-3 cursor-pointer hover:text-text-secondary select-none whitespace-nowrap" onClick={() => toggleSort('reachR16')}>
                  Oitavas{sortKey === 'reachR16' && <span className="ml-1 text-brand">{sortAsc ? '↑' : '↓'}</span>}
                </th>
                <Th label="Elo" sort="elo" />
                <th className="hidden lg:table-cell text-left text-[11px] font-medium text-text-tertiary uppercase tracking-wider px-4 py-3">Elenco</th>
                <th className="hidden lg:table-cell text-left text-[11px] font-medium text-text-tertiary uppercase tracking-wider px-4 py-3">Odds</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((team, i) => {
                const prob = mode === 'simulation' && simulationMap
                  ? simulationMap.get(team.id) ?? team.market.aggregate
                  : team.market.aggregate

                return (
                  <tr
                    key={team.id}
                    className="border-b border-border-subtle hover:bg-surface-1/50 transition-colors"
                  >
                    <td className="px-4 py-3 text-xs font-mono text-text-tertiary">{i + 1}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <Flag iso={team.iso} name={team.name} size={22} />
                        <div>
                          <div className="text-sm font-medium text-text-primary">{team.name}</div>
                          <Badge color={CONFEDERATION_COLORS[team.confederation]}>
                            {CONFEDERATION_LABELS[team.confederation]}
                          </Badge>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm font-mono text-text-secondary">{team.group}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-mono font-semibold text-text-primary">{formatPct(prob)}</span>
                        <div className="w-16 h-1 bg-surface-3 rounded-full overflow-hidden">
                          <div className="h-full bg-brand rounded-full" style={{ width: `${Math.min(100, prob * 4)}%` }} />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm font-mono text-text-secondary hidden md:table-cell">{formatPct(team.market.kalshi)}</td>
                    <td className="px-4 py-3 text-sm font-mono text-text-secondary hidden md:table-cell">{formatPct(team.market.polymarket)}</td>
                    <td className="px-4 py-3">
                      {team.market.momentum24h !== 0 ? (
                        <span className={`text-xs font-mono font-medium ${team.market.momentum24h > 0 ? 'text-positive' : 'text-negative'}`}>
                          {formatMomentum(team.market.momentum24h)}
                        </span>
                      ) : (
                        <span className="text-xs font-mono text-text-tertiary">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm font-mono text-text-secondary hidden sm:table-cell">{formatPct(team.tournament.reachR16)}</td>
                    <td className="px-4 py-3 text-sm font-mono text-text-secondary">{team.elo}</td>
                    <td className="px-4 py-3 text-xs font-mono text-text-tertiary hidden lg:table-cell">
                      {getSquadByTeamId(team.id)?.players.length ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-xs font-mono text-text-tertiary hidden lg:table-cell">
                      {probToAmericanOdds(prob)} · {probToDecimalOdds(prob).toFixed(1)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-text-tertiary mt-3">
        {sorted.length} seleções · Título: média Odds API + Kalshi + Polymarket · Grupo/oitavas: referência DeFi Rate
        <span className="md:hidden"> · deslize a tabela para ver mais colunas</span>
      </p>
    </div>
  )
}
