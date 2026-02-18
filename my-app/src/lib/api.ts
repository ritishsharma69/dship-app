// Small API helper with base URL, timeout, JSON handling, and optional pink loader
import { withLoader } from './loader'

const DEFAULT_TIMEOUT_MS = 20000

function getBaseUrl() {
  const cfg = (import.meta as any).env?.VITE_API_BASE_URL
  if (cfg) return String(cfg)
  if (typeof window !== 'undefined') return window.location.origin
  return 'http://localhost:5000'
}

function toUrl(pathOrUrl: string): string {
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl
  const base = getBaseUrl()
  if (pathOrUrl.startsWith('/')) return base + pathOrUrl
  return base + '/' + pathOrUrl
}

export interface ApiOptions {
  timeoutMs?: number
  loaderText?: string
  authToken?: string | null
}

export interface JsonInit extends RequestInit {
  json?: unknown
}

async function doFetch(input: RequestInfo | URL, init?: RequestInit, timeoutMs = DEFAULT_TIMEOUT_MS): Promise<Response> {
  const controller = new AbortController()
  const t = window.setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(input, { ...init, signal: controller.signal })
    return res
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      throw new Error('Request timed out. Please try again.')
    }
    throw err
  } finally {
    window.clearTimeout(t)
  }
}

async function doFetchWithOptionalLoader(input: RequestInfo | URL, init: RequestInit | undefined, opts: ApiOptions | undefined): Promise<Response> {
  if (opts?.loaderText) {
    return withLoader(doFetch(input, init, opts.timeoutMs), opts.loaderText)
  }
  return doFetch(input, init, opts?.timeoutMs)
}

async function parseJsonOrThrow<T>(res: Response): Promise<T> {
  const ct = res.headers.get('content-type') || ''
  const text = await res.text()
  const tryJson = () => { try { return JSON.parse(text) } catch { return null } }
  if (!res.ok) {
    const j = ct.includes('application/json') ? tryJson() : tryJson() // try regardless
    const msg = (j && (j.message || j.error || (Array.isArray((j as any).errors) && (j as any).errors[0]?.message))) || text || `HTTP ${res.status}`
    throw new Error(typeof msg === 'string' ? msg : `HTTP ${res.status}`)
  }
  if (ct.includes('application/json')) {
    const j = tryJson()
    return (j ?? (text as unknown)) as T
  }
  // Fallback to text when content-type is not JSON
  return (text as unknown) as T
}

export async function apiJson<T = any>(pathOrUrl: string, init?: JsonInit, opts?: ApiOptions): Promise<T> {
  const url = toUrl(pathOrUrl)
  const headers: Record<string, string> = {
    ...(init?.headers as any),
  }
  let body = init?.body
  if (init && 'json' in init && init.json !== undefined) {
    headers['Content-Type'] ||= 'application/json'
    body = JSON.stringify(init.json)
  }
  if (opts?.authToken) {
    headers['Authorization'] = `Bearer ${opts.authToken}`
  }
  const res = await doFetchWithOptionalLoader(url, { ...init, headers, body }, opts)
  return parseJsonOrThrow<T>(res)
}

export function apiGetJson<T = any>(path: string, opts?: ApiOptions) {
  return apiJson<T>(path, { method: 'GET' }, opts)
}

export function apiPostJson<T = any>(path: string, json?: unknown, opts?: ApiOptions) {
  return apiJson<T>(path, { method: 'POST', json }, opts)
}

export function apiPatchJson<T = any>(path: string, json?: unknown, opts?: ApiOptions) {
  return apiJson<T>(path, { method: 'PATCH', json }, opts)
}

export function apiDeleteJson<T = any>(path: string, json?: unknown, opts?: ApiOptions) {
  return apiJson<T>(path, { method: 'DELETE', json }, opts)
}

