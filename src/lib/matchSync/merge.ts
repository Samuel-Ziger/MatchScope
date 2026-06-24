import type { TournamentMatch } from '../../data/matches'
import type { MatchesSyncPayload } from '../openfootball/load'
import { applyMatchesSync } from '../openfootball/load'
import { syncAllMatches } from './index'

/** Prioridade: API-Football > football-data.org > openfootball (via syncAllMatches após base). */
export async function syncMatchesFromAllSources(
  baseMatches: TournamentMatch[],
  openFootball: MatchesSyncPayload | null,
): Promise<{ matches: TournamentMatch[]; result: Awaited<ReturnType<typeof syncAllMatches>>['result'] }> {
  const withOpenFootball = applyMatchesSync(baseMatches, openFootball)
  const { matches, result } = await syncAllMatches(withOpenFootball)

  const openCount = openFootball?.stats?.withScore ?? Object.keys(openFootball?.results ?? {}).length
  const parts: string[] = []
  if (openCount > 0) parts.push(`${openCount} openfootball`)
  if (result.message && !result.message.includes('Falha')) {
    const apiPart = result.message.replace(/^Dados já estão atualizados$/, '').trim()
    if (apiPart && apiPart !== result.message) parts.push(apiPart)
    else if (result.updated > 0 || result.live > 0) parts.push(result.message)
  } else if (!result.ok && openCount > 0) {
    return {
      matches,
      result: {
        ...result,
        ok: true,
        message: `${openCount} jogo(s) via openfootball · APIs ao vivo indisponíveis`,
      },
    }
  }

  const message =
    parts.length > 0
      ? `Sincronizado: ${parts.join(' · ')}`
      : result.message

  return {
    matches,
    result: {
      ...result,
      ok: result.ok || openCount > 0,
      message,
    },
  }
}
