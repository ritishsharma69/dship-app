import React, { createContext, useContext, useMemo, useState } from 'react'

interface WishlistCtx {
  ids: string[]
  has: (productId: string) => boolean
  toggle: (productId: string) => void
  remove: (productId: string) => void
  count: number
}

const KEY = 'wishlist:v1'
const Ctx = createContext<WishlistCtx | null>(null)

function readStorage(): string[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === 'string') : []
  } catch { return [] }
}

function writeStorage(ids: string[]) {
  try { localStorage.setItem(KEY, JSON.stringify(ids)) } catch {}
}

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [ids, setIds] = useState<string[]>(readStorage())

  const toggle = (productId: string) => {
    setIds(prev => {
      const next = prev.includes(productId) ? prev.filter(id => id !== productId) : [...prev, productId]
      writeStorage(next)
      return next
    })
  }
  const remove = (productId: string) => {
    setIds(prev => { const next = prev.filter(id => id !== productId); writeStorage(next); return next })
  }
  const has = (productId: string) => ids.includes(productId)

  const value = useMemo(() => ({ ids, has, toggle, remove, count: ids.length }), [ids])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useWishlist() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useWishlist must be used within WishlistProvider')
  return ctx
}
