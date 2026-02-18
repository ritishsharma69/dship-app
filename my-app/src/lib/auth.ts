// LocalStorage-backed auth helpers for the demo OTP auth flow
// Token format (server): base64("email|timestamp")

const TOKEN_KEY = 'auth_token'
const EMAIL_KEY = 'auth_email'

export function getAuthToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function getAuthEmail(): string {
  try {
    return localStorage.getItem(EMAIL_KEY) || ''
  } catch {
    return ''
  }
}

export function setAuth(token: string, email?: string) {
  try {
    localStorage.setItem(TOKEN_KEY, String(token || ''))
    if (email != null) localStorage.setItem(EMAIL_KEY, String(email || ''))
  } catch {
    // ignore storage errors
  }
}

export function clearAuth() {
  try {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(EMAIL_KEY)
  } catch {
    // ignore
  }
}

function decodeBase64(raw: string): string {
  // Browser first
  if (typeof atob === 'function') return atob(raw)
  // Fallback for environments that provide Buffer
  const B: any = (globalThis as any).Buffer
  if (B?.from) return B.from(raw, 'base64').toString('utf8')
  throw new Error('No base64 decoder available')
}

export function decodeDemoTokenEmail(token: string): string | null {
  const raw = String(token || '').replace(/^Bearer\s+/i, '').trim()
  if (!raw) return null
  try {
    const decoded = decodeBase64(raw)
    const email = String(decoded.split('|')[0] || '').trim().toLowerCase()
    return email || null
  } catch {
    return null
  }
}

