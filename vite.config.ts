import { defineConfig, loadEnv, type Plugin, type ProxyOptions } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
// @ts-expect-error módulo ESM do servidor
import { createVotesHandler } from './server/votes-http.mjs'

function dataFilePlugin(fileName: string): Plugin {
  const filePath = () => join(process.cwd(), 'data', fileName)

  const handler = (
    req: import('node:http').IncomingMessage,
    res: import('node:http').ServerResponse,
    next: () => void,
  ) => {
    if (!req.url?.startsWith(`/data/${fileName}`)) return next()

    const path = filePath()
    const empty =
      fileName === 'odds.json'
        ? '{"updatedAt":null,"slot":null,"byTeamId":{}}'
        : '{"updatedAt":null,"source":"openfootball/worldcup.json","results":{}}'

    const body = existsSync(path) ? readFileSync(path, 'utf8') : empty

    res.statusCode = 200
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.setHeader('Cache-Control', 'no-cache')
    res.end(body)
  }

  return {
    name: `data-file-${fileName}`,
    configureServer(server: import('vite').ViteDevServer) {
      server.middlewares.use(handler)
    },
    configurePreviewServer(server: import('vite').PreviewServer) {
      server.middlewares.use(handler)
    },
  } satisfies Plugin
}

function votesApiPlugin(): Plugin {
  const dataDir = join(process.cwd(), 'data')
  const handler = createVotesHandler(dataDir)

  const middleware = (
    req: import('node:http').IncomingMessage,
    res: import('node:http').ServerResponse,
    next: () => void,
  ) => {
    if (!req.url?.startsWith('/api/votes')) return next()
    void handler(req, res)
  }

  return {
    name: 'votes-api',
    configureServer(server: import('vite').ViteDevServer) {
      server.middlewares.use(middleware)
    },
    configurePreviewServer(server: import('vite').PreviewServer) {
      server.middlewares.use(middleware)
    },
  } satisfies Plugin
}

function footballDataProxyPlugin(token: string): Plugin {
  const handler = async (req: import('node:http').IncomingMessage, res: import('node:http').ServerResponse, next: () => void) => {
    if (!req.url?.startsWith('/api/football-data')) return next()
    if (!token) {
      res.statusCode = 500
      res.end(JSON.stringify({ message: 'FOOTBALL_DATA_TOKEN não configurado no .env' }))
      return
    }

    const path = req.url.replace(/^\/api\/football-data/, '/v4')
    try {
      const upstream = await fetch(`https://api.football-data.org${path}`, {
        headers: { 'X-Auth-Token': token },
      })
      const body = await upstream.text()
      res.statusCode = upstream.status
      res.setHeader('Content-Type', upstream.headers.get('content-type') ?? 'application/json')
      res.end(body)
    } catch {
      res.statusCode = 502
      res.end(JSON.stringify({ message: 'Erro ao contactar football-data.org' }))
    }
  }

  return {
    name: 'football-data-proxy',
    configureServer(server) {
      server.middlewares.use(handler)
    },
    configurePreviewServer(server) {
      server.middlewares.use(handler)
    },
  }
}

function theOddsApiProxyPlugin(apiKey: string): Plugin {
  const handler = async (req: import('node:http').IncomingMessage, res: import('node:http').ServerResponse, next: () => void) => {
    if (!req.url?.startsWith('/api/the-odds')) return next()
    if (!apiKey) {
      res.statusCode = 500
      res.end(JSON.stringify({ message: 'THE_ODDS_API_KEY não configurado no .env' }))
      return
    }

    const path = req.url.replace(/^\/api\/the-odds/, '')
    const sep = path.includes('?') ? '&' : '?'
    const url = `https://api.the-odds-api.com${path}${sep}apiKey=${apiKey}`

    try {
      const upstream = await fetch(url)
      const body = await upstream.text()
      res.statusCode = upstream.status
      res.setHeader('Content-Type', upstream.headers.get('content-type') ?? 'application/json')
      const remaining = upstream.headers.get('x-requests-remaining')
      const used = upstream.headers.get('x-requests-used')
      if (remaining) res.setHeader('x-requests-remaining', remaining)
      if (used) res.setHeader('x-requests-used', used)
      res.end(body)
    } catch {
      res.statusCode = 502
      res.end(JSON.stringify({ message: 'Erro ao contactar The Odds API' }))
    }
  }

  return {
    name: 'the-odds-api-proxy',
    configureServer(server) {
      server.middlewares.use(handler)
    },
    configurePreviewServer(server) {
      server.middlewares.use(handler)
    },
  }
}

function worldCup26ProxyPlugin(): Plugin {
  const handler = async (req: import('node:http').IncomingMessage, res: import('node:http').ServerResponse, next: () => void) => {
    if (!req.url?.startsWith('/api/worldcup26')) return next()

    const path = req.url.replace(/^\/api\/worldcup26/, '')
    try {
      const upstream = await fetch(`https://worldcup26.ir${path}`)
      const body = await upstream.text()
      res.statusCode = upstream.status
      res.setHeader('Content-Type', upstream.headers.get('content-type') ?? 'application/json')
      res.setHeader('Cache-Control', 'no-cache')
      res.end(body)
    } catch {
      res.statusCode = 502
      res.end(JSON.stringify({ message: 'Erro ao contactar worldcup26.ir' }))
    }
  }

  return {
    name: 'worldcup26-proxy',
    configureServer(server) {
      server.middlewares.use(handler)
    },
    configurePreviewServer(server) {
      server.middlewares.use(handler)
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '')
  const apiFootballKey = env.API_FOOTBALL_KEY

  const footballProxy: ProxyOptions = {
    target: 'https://v3.football.api-sports.io',
    changeOrigin: true,
    rewrite: (path) => path.replace(/^\/api\/football/, ''),
    configure: (proxy) => {
      proxy.on('proxyReq', (proxyReq) => {
        if (apiFootballKey) proxyReq.setHeader('x-apisports-key', apiFootballKey)
      })
    },
  }

  return {
    plugins: [
      react(),
      tailwindcss(),
      dataFilePlugin('odds.json'),
      dataFilePlugin('matches-sync.json'),
      votesApiPlugin(),
      footballDataProxyPlugin(env.FOOTBALL_DATA_TOKEN ?? ''),
      theOddsApiProxyPlugin(env.THE_ODDS_API_KEY ?? ''),
      worldCup26ProxyPlugin(),
    ],
    server: {
      proxy: {
        '/api/football': footballProxy,
      },
    },
    preview: {
      proxy: {
        '/api/football': footballProxy,
      },
    },
  }
})
