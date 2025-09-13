import React, { createContext, useContext, useMemo, useState } from 'react'
import type { Product } from '../types'
import { productsBySlug } from '../data'

export interface CartItem { product: Product, quantity: number }
interface CartCtx {
  items: CartItem[]
  add: (item: CartItem) => void
  update: (productId: string, quantity: number) => void
  remove: (productId: string) => void
  clear: () => void
  count: number
}

const KEY = 'cart:v1'
const Ctx = createContext<CartCtx | null>(null)

function readStorage(): CartItem[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    return JSON.parse(raw)
  } catch { return [] }
}

function writeStorage(items: CartItem[]) {
  try { localStorage.setItem(KEY, JSON.stringify(items)) } catch {}
}

function normalizeCartItems(input: CartItem[]): CartItem[] {
  try {
    const byId: Record<string, Product> = {}
    Object.values(productsBySlug).forEach((p) => { byId[p.id] = p })
    return input.filter((i) => !!byId[i.product.id]).map((i) => ({ ...i, product: byId[i.product.id] }))
  } catch { return input }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(normalizeCartItems(readStorage()))

  const add = (item: CartItem) => {
    setItems(prev => {
      const existing = prev.find(i => i.product.id === item.product.id)
      const next = existing
        ? prev.map(i => i.product.id === item.product.id ? { ...i, quantity: i.quantity + item.quantity } : i)
        : [...prev, item]
      writeStorage(next)
      return next
    })
  }
  const update = (productId: string, quantity: number) => {
    setItems(prev => {
      const next = quantity <= 0 ? prev.filter(i => i.product.id !== productId) : prev.map(i => i.product.id === productId ? { ...i, quantity } : i)
      writeStorage(next)
      return next
    })
  }
  const remove = (productId: string) => {
    setItems(prev => { const next = prev.filter(i => i.product.id !== productId); writeStorage(next); return next })
  }
  const clear = () => { writeStorage([]); setItems([]) }

  const count = useMemo(() => items.reduce((n, i) => n + i.quantity, 0), [items])
  const value = useMemo(() => ({ items, add, update, remove, clear, count }), [items])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useCart() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}

