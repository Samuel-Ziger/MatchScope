import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, CartesianGrid,
} from 'recharts'
import type { Team } from '../data/teams'
import { CONFEDERATION_COLORS, CONFEDERATION_LABELS } from '../data/teams'
import { Card, SectionHeader } from './ui'
import { formatPct } from '../lib/simulation'

interface ChartsPanelProps {
  teams: Team[]
}

const tooltipStyle = {
  background: '#161a22',
  border: '1px solid #252b36',
  borderRadius: '6px',
  fontSize: '12px',
  color: '#eceef2',
}

export function ChartsPanel({ teams }: ChartsPanelProps) {
  const top12 = [...teams].sort((a, b) => b.market.aggregate - a.market.aggregate).slice(0, 12)

  const barData = top12.map((t) => ({
    name: t.name,
    kalshi: t.market.kalshi,
    polymarket: t.market.polymarket,
    aggregate: t.market.aggregate,
  }))

  const confedData = Object.entries(
    teams.reduce<Record<string, number>>((acc, t) => {
      acc[t.confederation] = (acc[t.confederation] ?? 0) + t.market.aggregate
      return acc
    }, {}),
  )
    .map(([conf, prob]) => ({
      name: CONFEDERATION_LABELS[conf as keyof typeof CONFEDERATION_LABELS],
      value: Math.round(prob * 10) / 10,
      color: CONFEDERATION_COLORS[conf as keyof typeof CONFEDERATION_COLORS],
    }))
    .sort((a, b) => b.value - a.value)

  const stageData = top12.slice(0, 8).map((t) => ({
    name: t.name.length > 10 ? t.name.slice(0, 9) + '…' : t.name,
    titulo: t.market.aggregate,
    oitavas: t.tournament.reachR16,
    grupo: t.tournament.winGroupKalshi,
  }))

  return (
    <div className="space-y-6 animate-enter w-full min-w-0">
      <div>
        <h2 className="text-xl font-semibold text-text-primary tracking-tight">Análise Visual</h2>
        <p className="text-sm text-text-secondary mt-1">
          Distribuição de probabilidades por seleção e confederação.
        </p>
      </div>

      <Card className="min-w-0">
        <SectionHeader title="Top 12 — Probabilidade de título por plataforma" />
        <div className="w-full min-w-0" style={{ height: 320 }}>
          <ResponsiveContainer width="100%" height="100%">
          <BarChart data={barData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
            <CartesianGrid stroke="#252b36" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" tick={{ fill: '#5c6470', fontSize: 10 }} axisLine={false} tickLine={false} interval={0} angle={-35} textAnchor="end" height={56} />
            <YAxis tick={{ fill: '#5c6470', fontSize: 11 }} axisLine={false} tickLine={false} unit="%" />
            <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => formatPct(v)} />
            <Bar dataKey="kalshi" name="Kalshi" fill="#4f8ff7" radius={[2, 2, 0, 0]} barSize={12} />
            <Bar dataKey="polymarket" name="Polymarket" fill="#34d399" radius={[2, 2, 0, 0]} barSize={12} />
          </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="flex gap-4 justify-center mt-2">
          <Legend color="#4f8ff7" label="Kalshi" />
          <Legend color="#34d399" label="Polymarket" />
        </div>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6 min-w-0">
        <Card className="min-w-0">
          <SectionHeader title="Share por confederação" description="Soma das probabilidades de título" />
          <div className="w-full min-w-0" style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={confedData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={90}
                paddingAngle={2}
                dataKey="value"
                stroke="none"
              >
                {confedData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => formatPct(v)} />
            </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-3 justify-center mt-2">
            {confedData.map((d) => (
              <Legend key={d.name} color={d.color} label={`${d.name} (${formatPct(d.value)})`} />
            ))}
          </div>
        </Card>

        <Card className="min-w-0">
          <SectionHeader title="Funil do torneio — Top 8" description="Grupo → Oitavas → Título" />
          <div className="w-full min-w-0" style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stageData} layout="vertical" margin={{ left: 10, right: 20 }}>
              <CartesianGrid stroke="#252b36" strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" tick={{ fill: '#5c6470', fontSize: 11 }} axisLine={false} tickLine={false} unit="%" />
              <YAxis type="category" dataKey="name" tick={{ fill: '#8b93a3', fontSize: 11 }} axisLine={false} tickLine={false} width={70} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => formatPct(v)} />
              <Bar dataKey="grupo" name="Vencer grupo" fill="#4f8ff7" opacity={0.5} radius={[0, 2, 2, 0]} barSize={6} />
              <Bar dataKey="oitavas" name="Oitavas" fill="#4f8ff7" opacity={0.75} radius={[0, 2, 2, 0]} barSize={6} />
              <Bar dataKey="titulo" name="Título" fill="#4f8ff7" radius={[0, 2, 2, 0]} barSize={6} />
            </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  )
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5 text-xs text-text-secondary">
      <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: color }} />
      {label}
    </div>
  )
}
