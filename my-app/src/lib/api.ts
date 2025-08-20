// Small API helper with base URL, timeout, JSON handling, and optional pink loader
import { withLoader } from './loader'

const DEFAULT_TIMEOUT_MS = 12000

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
  if (!res.ok) {
    const msg = ct.includes('application/json') ? (await res.json()).message : await res.text()
    throw new Error(msg || `HTTP ${res.status}`)
  }
  if (ct.includes('application/json')) return (await res.json()) as T
  // Fallback: try text
  return (await res.text()) as unknown as T
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

