import { useTournament } from '../context/TournamentContext'
import { BracketTree } from './BracketTree'

export function BracketMap() {
  const { state, updateResult, atualizar, syncStatus, syncing, matchesLastSync } = useTournament()

  return (
    <div className="space-y-6 animate-enter w-full min-w-0">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-text-primary tracking-tight">Mapa da Copa 2026</h2>
          <p className="text-sm text-text-secondary mt-1">
            Chave única — grupos, resultados, classificados e eliminatórias até o campeão
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-2 text-xs text-text-tertiary">
            <span className={`w-2 h-2 rounded-full ${syncing ? 'bg-brand animate-pulse' : 'bg-positive'}`} />
            {state.played}/{state.total} jogos
            {matchesLastSync && (
              <> · {new Date(matchesLastSync).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</>
            )}
          </div>
          <button
            type="button"
            onClick={() => void atualizar()}
            disabled={syncing}
            className="text-xs font-medium text-text-secondary hover:text-text-primary px-3 py-1.5 border border-border rounded-md disabled:opacity-50"
          >
            {syncing ? 'Atualizando…' : 'Atualizar'}
          </button>
        </div>
      </div>

      {syncStatus && (
        <p className={`text-xs ${syncStatus.ok ? 'text-text-tertiary' : 'text-negative'}`}>
          {syncStatus.message}
        </p>
      )}

      <BracketTree
        groups={state.groups}
        bracket={state.simulatedBracket}
        onUpdate={updateResult}
      />
    </div>
  )
}
