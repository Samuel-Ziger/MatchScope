export const DATA_SOURCES = {
  lastUpdated: '2026-06-23T10:29:00-07:00',
  lastUpdatedLabel: '23 de junho de 2026, 10:29 PDT',

  market: {
    name: 'The Odds API',
    description: 'Probabilidades de vencedor da Copa (mercado outrights) agregadas de casas esportivas US e EU. Atualização automática via cron na VPS: 08h, 14h, 20h e 02h (horário do servidor).',
    urls: [
      { label: 'The Odds API', url: 'https://the-odds-api.com/' },
      { label: 'Dashboard', url: 'https://dash.the-odds-api.com/' },
    ],
    volume24h: {
      value: '$72.1M',
      asOf: '23 de junho de 2026',
      help: {
        title: 'Volume 24h — Mercados agregados',
        paragraphs: [
          'É o volume financeiro total negociado nas últimas 24 horas nos mercados de previsão sobre o vencedor da Copa do Mundo 2026 — principalmente Kalshi (exchange regulada nos EUA) e Polymarket.',
          '“Mercados agregados” significa que o valor soma a atividade de várias plataformas, não de uma casa só. Quanto maior o volume, mais liquidez e interesse há nesses contratos de previsão.',
          'Este número é um snapshot de referência compilado em junho/2026. As probabilidades de título exibidas no app vêm da The Odds API (casas esportivas) — fonte diferente dos mercados de previsão acima.',
        ],
      },
    },
  },

  elo: {
    name: 'World Football Elo Ratings',
    description: 'Sistema Elo com ajuste por margem de vitória e vantagem de mando.',
    url: 'https://www.eloratings.net/',
    asOf: '22 de junho de 2026',
  },

  fifa: {
    name: 'FIFA World Ranking',
    description: 'Ranking oficial da FIFA para seleções masculinas.',
    url: 'https://www.fifa.com/fifa-world-ranking/men',
    asOf: 'junho de 2026',
  },

  tournament: {
    name: 'openfootball / worldcup.json',
    description: 'Calendário e resultados da Copa 2026 — dados públicos em JSON, sem API key.',
    urls: [
      { label: 'worldcup.json', url: 'https://github.com/openfootball/worldcup.json' },
      { label: 'JSON 2026', url: 'https://raw.githubusercontent.com/openfootball/worldcup.json/master/2026/worldcup.json' },
    ],
  },

  /** Fontes integradas ao sistema na VPS */
  apis: [
    {
      id: 'openfootball',
      name: 'openfootball / worldcup.json',
      provider: 'github.com/openfootball',
      purpose: 'Calendário, placares e gols da Copa 2026 (fase de grupos)',
      endpoint: 'GET 2026/worldcup.json',
      params: 'Repositório público · git pull na VPS',
      schedule: 'Cron na VPS — a cada 10 minutos',
      trigger: 'Automático + botão Atualizar (lê data/matches-sync.json)',
      docs: 'https://github.com/openfootball/worldcup.json',
      dashboard: 'https://github.com/openfootball/worldcup.json/tree/master/2026',
    },
    {
      id: 'the-odds-api',
      name: 'The Odds API',
      provider: 'the-odds-api.com',
      purpose: 'Probabilidades de título (mercado outrights)',
      endpoint: 'GET /v4/sports/soccer_fifa_world_cup_winner/odds',
      params: 'regions=us,eu · markets=outrights · oddsFormat=decimal',
      schedule: '4× ao dia (08h, 14h, 20h, 02h)',
      trigger: 'Automático (não usa o botão Atualizar)',
      docs: 'https://the-odds-api.com/liveapi/guides/v4/',
      dashboard: 'https://dash.the-odds-api.com/',
    },
    {
      id: 'vote-popular',
      name: 'Voto Popular MatchScope',
      provider: 'MatchScope',
      purpose: 'Mapa interativo — torcida vota na seleção campeã em tempo real',
      endpoint: 'GET/POST /api/votes',
      params: '1 voto por dispositivo · pode alterar até o fim da Copa',
      schedule: 'Tempo real (atualização a cada 8s)',
      trigger: 'Aba Voto Popular — clique na seleção',
      docs: 'Registro em data/votes.json',
      dashboard: 'GET /api/votes/export (token admin)',
    },
  ],
} as const
