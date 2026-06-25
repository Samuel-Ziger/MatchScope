interface HeaderProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

const TABS = [
  { id: 'overview', label: 'Visão Geral' },
  { id: 'agora', label: 'Agora' },
  { id: 'selecoes', label: 'Seleções' },
  { id: 'mapa', label: 'Mapa / Chaves' },
  { id: 'voto', label: 'Voto Popular' },
  { id: 'ranking', label: 'Probabilidades' },
  { id: 'simulacao', label: 'Simulação' },
  { id: 'confronto', label: 'Confronto' },
  { id: 'graficos', label: 'Análise' },
  { id: 'metodologia', label: 'Metodologia' },
]

export function Header({ activeTab, onTabChange }: HeaderProps) {
  return (
    <header className="border-b border-border bg-surface-1/95 backdrop-blur-sm sticky top-0 z-50 overflow-x-clip max-w-full">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 min-w-0">
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-md bg-surface-3 border border-border flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 32 32" fill="none">
                <circle cx="16" cy="16" r="9" stroke="#4f8ff7" strokeWidth="1.5" />
                <path d="M7 16h18M16 7c-2 2.5-3.2 5.5-3.2 9s1.2 6.5 3.2 9M16 7c2 2.5 3.2 5.5 3.2 9s-1.2 6.5-3.2 9" stroke="#4f8ff7" strokeWidth="1.2" opacity="0.5" />
              </svg>
            </div>
            <div>
              <h1 className="text-sm font-semibold text-text-primary leading-none">MatchScope</h1>
              <p className="text-[11px] text-text-tertiary mt-0.5">Copa do Mundo FIFA 2026</p>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-0.5">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`px-3 py-1.5 rounded-md text-[13px] font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-surface-3 text-text-primary'
                    : 'text-text-secondary hover:text-text-primary hover:bg-surface-2'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <nav className="md:hidden flex gap-1 pb-3 overflow-x-auto overscroll-x-contain">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'bg-surface-3 text-text-primary'
                  : 'text-text-secondary'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
    </header>
  )
}
