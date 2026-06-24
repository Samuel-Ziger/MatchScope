import type { MatchPerformance } from '../lib/matchPerformance'
import { ratingColor, shortPlayerName } from '../lib/matchPerformance'

interface MatchPerformanceLinesProps {
  performance: MatchPerformance
  compact?: boolean
  bracket?: boolean
}

export function MatchPerformanceLines({ performance, compact = false, bracket = false }: MatchPerformanceLinesProps) {
  const { home, away, projected } = performance
  const textSize = compact ? 'text-[7px]' : 'text-[9px]'

  if (bracket) {
    return (
      <div className={`${textSize} leading-snug border-t border-border-subtle/60 grid grid-cols-2 gap-x-1 px-1 py-0.5`}>
        {projected && (
          <div className="col-span-2 text-text-tertiary italic text-center">Jogadores-chave (projeção)</div>
        )}
        <SidePerf side={home} align="right" projected={projected} />
        <SidePerf side={away} align="left" projected={projected} />
      </div>
    )
  }

  return (
    <div className={`${textSize} leading-snug px-1 py-0.5 border-t border-border-subtle/60 space-y-0.5`}>
      {projected && (
        <div className="text-text-tertiary italic">Jogadores-chave (projeção)</div>
      )}

      <SidePerf side={home} align="left" projected={projected} />
      <SidePerf side={away} align="right" projected={projected} />
    </div>
  )
}

function SidePerf({
  side,
  align,
  projected,
}: {
  side: MatchPerformance['home']
  align: 'left' | 'right'
  projected?: boolean
}) {
  const scorers = side.scorers
  const topPlayers = side.players.slice(0, projected ? 2 : 3)

  return (
    <div className={align === 'right' ? 'text-right' : ''}>
      {!projected && scorers.length > 0 && (
        <div className="text-positive font-medium">
          ⚽ {scorers.map((s) => `${shortPlayerName(s.name)}${s.goals > 1 ? `×${s.goals}` : ''}`).join(', ')}
        </div>
      )}
      {topPlayers.length > 0 && (
        <div className="text-text-tertiary flex flex-wrap gap-x-1.5 gap-y-0" style={{ justifyContent: align === 'right' ? 'flex-end' : 'flex-start' }}>
          {topPlayers.map((p) => (
            <span key={p.name} className="whitespace-nowrap">
              <span className={ratingColor(p.rating)}>{p.rating.toFixed(1)}</span>
              <span className="opacity-70"> {shortPlayerName(p.name)}</span>
              {p.goals > 0 && <span className="text-positive">⚽{p.goals}</span>}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
