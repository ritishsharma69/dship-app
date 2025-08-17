import { showPinkLoader, hidePinkLoader } from '../components/PinkLoader'

export function show(text?: string) { showPinkLoader(text) }
export function hide() { hidePinkLoader() }

/** Wrap a promise with the loader, showing it after a short delay to avoid flicker. */
export async function withLoader<T>(promise: Promise<T>, text = 'Loading…', delayMs = 300): Promise<T> {
  let timer: number | null = null
  try {
    timer = window.setTimeout(() => show(text), delayMs)
    const result = await promise
    return result
  } finally {
    if (timer) window.clearTimeout(timer)
    hide()
  }
}

/**
 * fetchWithLoader: like fetch() but shows the pink loader if it takes longer than delayMs.
 */
export function fetchWithLoader(input: RequestInfo | URL, init?: RequestInit, opts?: { text?: string; delayMs?: number }) {
  const { text = 'Loading…', delayMs = 300 } = opts || {}
  return withLoader(fetch(input, init), text, delayMs)
}

