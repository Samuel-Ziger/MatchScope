import type { ApiEvent, ApiFixtureItem, ApiResponse } from './types'

const BASE = '/api/football'

export class ApiFootballError extends Error {
  apiErrors?: Record<string, string> | string[]

  constructor(message: string, apiErrors?: Record<string, string> | string[]) {
    super(message)
    this.name = 'ApiFootballError'
    this.apiErrors = apiErrors
  }
}

export interface FetchMeta {
  remaining?: number
  limit?: number
}

export function formatApiErrors(errors: Record<string, string> | string[] | undefined): string {
  if (!errors) return 'Erro desconhecido'
  if (Array.isArray(errors)) return errors.join(' · ')
  const values = Object.values(errors)
  return values.length > 0 ? values.join(' · ') : 'Erro desconhecido'
}

function parseErrors(errors: Record<string, string> | string[] | undefined): boolean {
  if (!errors) return false
  if (Array.isArray(errors)) return errors.length > 0
  return Object.keys(errors).length > 0
}

async function apiGet<T>(
  path: string,
  options: { throwOnApiError?: boolean } = {},
): Promise<{ data: ApiResponse<T>; meta: FetchMeta } | null> {
  const throwOnApiError = options.throwOnApiError ?? true

  let res: Response
  try {
    res = await fetch(`${BASE}${path}`)
  } catch {
    throw new ApiFootballError('Sem conexão com a API — verifique se o servidor está rodando (npm run dev)')
  }

  if (!res.ok) {
    throw new ApiFootballError(`HTTP ${res.status}`)
  }

  const data = (await res.json()) as ApiResponse<T>
  if (parseErrors(data.errors)) {
    if (!throwOnApiError) return null
    throw new ApiFootballError(formatApiErrors(data.errors), data.errors)
  }

  const remaining = res.headers.get('x-ratelimit-requests-remaining')
  const limit = res.headers.get('x-ratelimit-requests-limit')

  return {
    data,
    meta: {
      remaining: remaining ? Number(remaining) : undefined,
      limit: limit ? Number(limit) : undefined,
    },
  }
}

export async function fetchLiveFixtures(): Promise<{ fixtures: ApiFixtureItem[]; meta: FetchMeta }> {
  const result = await apiGet<ApiFixtureItem[]>('/fixtures?live=all')
  if (!result) return { fixtures: [], meta: {} }
  return { fixtures: result.data.response ?? [], meta: result.meta }
}

export async function fetchFixturesByDate(date: string): Promise<{ fixtures: ApiFixtureItem[]; meta: FetchMeta } | null> {
  const result = await apiGet<ApiFixtureItem[]>(`/fixtures?date=${date}`, { throwOnApiError: false })
  if (!result) return null
  return { fixtures: result.data.response ?? [], meta: result.meta }
}

export async function fetchFixtureEvents(fixtureId: number): Promise<{ events: ApiEvent[]; meta: FetchMeta } | null> {
  const result = await apiGet<ApiEvent[]>(`/fixtures/events?fixture=${fixtureId}`, { throwOnApiError: false })
  if (!result) return null
  return { events: result.data.response ?? [], meta: result.meta }
}

export async function fetchApiStatus(): Promise<{ meta: FetchMeta }> {
  const result = await apiGet<unknown>('/status')
  if (!result) return { meta: {} }
  return { meta: result.meta }
}
