import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'

interface RouterCtx {
  path: string
  navigate: (to: string, opts?: { replace?: boolean }) => void
}

const Ctx = createContext<RouterCtx | null>(null)

export function RouterProvider({ children }: { children: React.ReactNode }) {
  const [path, setPath] = useState<string>(window.location.pathname || '/')

  useEffect(() => {
    const onPop = () => setPath(window.location.pathname || '/')
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  const navigate = (to: string, opts?: { replace?: boolean }) => {
    // No forced loader on route changes. Loader will appear only for real delays (via fetch wrapper/withLoader).
    if (opts?.replace) {
      window.history.replaceState({}, '', to)
    } else {
      window.history.pushState({}, '', to)
    }
    window.scrollTo({ top: 0 })
    setPath(window.location.pathname || '/')
  }

  const value = useMemo(() => ({ path, navigate }), [path])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useRouter() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useRouter must be used within RouterProvider')
  return ctx
}

function matchPath(pattern: string, current: string): boolean {
  if (pattern === current) return true
  // very small matcher: supports colon params like /order/track/:id
  const pSeg = pattern.split('/').filter(Boolean)
  const cSeg = current.split('/').filter(Boolean)
  if (pSeg.length !== cSeg.length) return false
  for (let i = 0; i < pSeg.length; i++) {
    if (pSeg[i].startsWith(':')) continue
    if (pSeg[i] !== cSeg[i]) return false
  }
  return true
}

export function Route({ path, children }: { path: string; children: React.ReactNode }) {
  const { path: current } = useRouter()
  if (matchPath(path, current)) return <>{children}</>
  return null
}

export function Switch({ children }: { children: React.ReactNode }) {
  const { path: current } = useRouter()
  // Proper first-match-wins: iterate Route children, render only the first match
  const arr = React.Children.toArray(children)
  for (const child of arr) {
    if (React.isValidElement<{ path?: string }>(child) && child.props.path !== undefined) {
      if (matchPath(child.props.path, current)) return <>{child}</>
    }
  }
  // No route matched — render fallback if present (child without path prop)
  for (const child of arr) {
    if (React.isValidElement<{ path?: string }>(child) && child.props.path === undefined) {
      return <>{child}</>
    }
  }
  return null
}

