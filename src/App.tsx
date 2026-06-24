import { useState } from 'react'
import { DATA_LAST_UPDATED } from './data/teams'
import { Header } from './components/Header'
import { OverviewPanel } from './components/OverviewPanel'
import { TeamTable } from './components/TeamTable'
import { SimulationPanel } from './components/SimulationPanel'
import { HeadToHead } from './components/HeadToHead'
import { ChartsPanel } from './components/ChartsPanel'
import { MethodologyPanel } from './components/MethodologyPanel'
import { TournamentProvider } from './context/TournamentContext'
import { useTeams } from './context/TeamsContext'
import { TeamsPanel } from './components/TeamsPanel'
import { BracketMap } from './components/BracketMap'
import { VoteMapPanel } from './components/VoteMapPanel'

function AppContent() {
  const [activeTab, setActiveTab] = useState('overview')
  const { teams, getContenders, oddsLastUpdated } = useTeams()
  const contenders = getContenders(0.05)

  return (
    <div className="min-h-screen flex flex-col overflow-x-clip max-w-full">
      <Header activeTab={activeTab} onTabChange={setActiveTab} />

      <main className="flex-1 w-full min-w-0 max-w-[1400px] mx-auto px-4 sm:px-6 py-6 overflow-x-clip">
        {activeTab === 'overview' && <OverviewPanel teams={contenders} />}

        {activeTab === 'selecoes' && <TeamsPanel />}

        {activeTab === 'mapa' && <BracketMap />}

        {activeTab === 'voto' && <VoteMapPanel />}

        {activeTab === 'ranking' && (
          <div className="space-y-6 animate-enter">
            <div>
              <h2 className="text-xl font-semibold text-text-primary tracking-tight">Tabela de Probabilidades</h2>
              <p className="text-sm text-text-secondary mt-1">
                Probabilidades de título via casas esportivas (The Odds API) + Elo.
              </p>
            </div>
            <TeamTable teams={teams} />
          </div>
        )}

        {activeTab === 'simulacao' && <SimulationPanel teams={contenders} />}
        {activeTab === 'confronto' && <HeadToHead teams={contenders} />}
        {activeTab === 'graficos' && <ChartsPanel teams={contenders} />}
        {activeTab === 'metodologia' && <MethodologyPanel />}
      </main>

      <footer className="border-t border-border mt-auto overflow-x-clip">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-text-tertiary text-center sm:text-left">
          <span className="break-words max-w-full">MatchScope · Odds: The Odds API + Kalshi/Poly · Jogos: openfootball + football-data + API-Football</span>
          <span className="break-words max-w-full shrink-0">
            Dados base: {DATA_LAST_UPDATED}
            {oddsLastUpdated && (
              <> · Odds: {new Date(oddsLastUpdated).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</>
            )}
          </span>
        </div>
      </footer>
    </div>
  )
}

function App() {
  return (
    <TournamentProvider>
      <AppContent />
    </TournamentProvider>
  )
}

export default App
