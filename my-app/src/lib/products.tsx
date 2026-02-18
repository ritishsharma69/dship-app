import React, { createContext, useContext, useEffect, useState } from 'react'
import type { Product } from '../types'
import { apiGetJson } from './api'

// Demo products are useful when backend/DB isn't configured.
// Set VITE_DEMO_PRODUCTS=true in Vite env to force demo mode.
const DEMO_SINGLE_PRODUCT = String((import.meta as any).env?.VITE_DEMO_PRODUCTS || '').toLowerCase() === 'true'

function svgDataUri(svg: string) {
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

const DEMO_IMAGES = [
  svgDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" width="900" height="900" viewBox="0 0 900 900">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#0b0b0b"/>
          <stop offset="0.55" stop-color="#1f2937"/>
          <stop offset="1" stop-color="#7c3aed"/>
        </linearGradient>
      </defs>
      <rect width="900" height="900" rx="64" fill="url(#bg)"/>
      <rect x="260" y="140" width="380" height="620" rx="58" fill="#0f172a" stroke="rgba(255,255,255,0.18)" stroke-width="3"/>
      <rect x="288" y="188" width="324" height="524" rx="40" fill="#0b1220"/>
      <circle cx="450" cy="724" r="6" fill="rgba(255,255,255,0.28)"/>
      <text x="450" y="100" text-anchor="middle" font-family="ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto" font-weight="900" font-size="46" fill="rgba(255,255,255,0.92)">iPhone 17 Pro</text>
      <text x="450" y="846" text-anchor="middle" font-family="ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto" font-weight="800" font-size="22" fill="rgba(255,255,255,0.72)">Demo product image</text>
    </svg>
  `),
  svgDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" width="900" height="900" viewBox="0 0 900 900">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#111827"/>
          <stop offset="0.5" stop-color="#f59e0b"/>
          <stop offset="1" stop-color="#0b0b0b"/>
        </linearGradient>
      </defs>
      <rect width="900" height="900" rx="64" fill="url(#bg)"/>
      <rect x="250" y="160" width="400" height="600" rx="62" fill="#0a0a0a" stroke="rgba(255,255,255,0.18)" stroke-width="3"/>
      <rect x="288" y="210" width="324" height="500" rx="40" fill="#0f172a"/>
      <text x="450" y="110" text-anchor="middle" font-family="ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto" font-weight="900" font-size="46" fill="rgba(255,255,255,0.92)">iPhone 17 Pro</text>
      <text x="450" y="842" text-anchor="middle" font-family="ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto" font-weight="800" font-size="22" fill="rgba(255,255,255,0.72)">Titanium • Pro Camera</text>
    </svg>
  `),
  svgDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" width="900" height="900" viewBox="0 0 900 900">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#0b0b0b"/>
          <stop offset="0.6" stop-color="#0ea5e9"/>
          <stop offset="1" stop-color="#111827"/>
        </linearGradient>
      </defs>
      <rect width="900" height="900" rx="64" fill="url(#bg)"/>
      <rect x="250" y="160" width="400" height="600" rx="62" fill="#0b1220" stroke="rgba(255,255,255,0.18)" stroke-width="3"/>
      <rect x="288" y="210" width="324" height="500" rx="40" fill="#0a0f1a"/>
      <text x="450" y="110" text-anchor="middle" font-family="ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto" font-weight="900" font-size="46" fill="rgba(255,255,255,0.92)">iPhone 17 Pro</text>
      <text x="450" y="842" text-anchor="middle" font-family="ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto" font-weight="800" font-size="22" fill="rgba(255,255,255,0.72)">A-series Pro • 120Hz</text>
    </svg>
  `),
	  svgDataUri(`
	    <svg xmlns="http://www.w3.org/2000/svg" width="900" height="900" viewBox="0 0 900 900">
	      <defs>
	        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
	          <stop offset="0" stop-color="#fff7ed"/>
	          <stop offset="0.5" stop-color="#fef3c7"/>
	          <stop offset="1" stop-color="#ffffff"/>
	        </linearGradient>
	      </defs>
	      <rect width="900" height="900" rx="64" fill="url(#bg)"/>
	      <rect x="250" y="150" width="400" height="610" rx="66" fill="#0b0b0b" stroke="rgba(15,23,42,0.10)" stroke-width="3"/>
	      <rect x="285" y="195" width="330" height="520" rx="46" fill="#05070d"/>
	      <circle cx="450" cy="730" r="6" fill="rgba(255,255,255,0.22)"/>
	      <text x="450" y="110" text-anchor="middle" font-family="ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto" font-weight="900" font-size="46" fill="rgba(15,23,42,0.82)">iPhone 17 Pro</text>
	      <text x="450" y="842" text-anchor="middle" font-family="ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto" font-weight="800" font-size="22" fill="rgba(15,23,42,0.56)">Clean • No glare</text>
	    </svg>
	  `),
]

const DEMO_BASE_PRODUCT: Product = {
  id: 'iphone-17-pro',
  slug: 'iphone-17-pro',
  title: 'iPhone 17 Pro',
  brand: 'Apple',
  price: 134900,
  compareAtPrice: 149900,
  images: DEMO_IMAGES,
  bullets: [
    'A-series Pro performance for smooth everyday use',
    'Pro camera system for crisp photos and video',
    'Premium build with a clean, minimal design',
    'All‑day battery with fast charging support',
  ],
  sku: 'IPHONE-17-PRO-DEMO',
  inventoryStatus: 'IN_STOCK',
  descriptionHeading: 'Built to feel premium everywhere in the UI',
  descriptionPoints: [
    'High-contrast visuals for hero + grid cards',
    'Multiple gallery images for the product page',
    'Consistent branding for layout testing',
  ],
}

const DEMO_PRODUCTS: Product[] = Array.from({ length: 12 }, (_, i) => {
  const n = i + 1
  return {
    ...DEMO_BASE_PRODUCT,
    id: `iphone-17-pro-${n}`,
    slug: `iphone-17-pro-${n}`,
    sku: `IPHONE-17-PRO-DEMO-${String(n).padStart(2, '0')}`,
  }
})

// Build slug from product title (or server-provided slug)
export function productSlug(p: Product): string {
  if ((p as any).slug) return (p as any).slug
  return p.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

interface ProductsCtx {
  products: Product[]
  productsBySlug: Record<string, Product>
  loading: boolean
}

const Ctx = createContext<ProductsCtx>({
  products: [],
  productsBySlug: {},
  loading: true,
})

export function ProductsProvider({ children }: { children: React.ReactNode }) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (DEMO_SINGLE_PRODUCT) {
      setProducts(DEMO_PRODUCTS)
      setLoading(false)
      return
    }

    let cancelled = false

    apiGetJson<Product[]>('/api/products', { timeoutMs: 8000 })
      .then((data) => {
        if (!cancelled) {
          setProducts(Array.isArray(data) ? data : [])
        }
      })
      .catch(() => {
        // If API fails, show nothing (no hardcoded products)
        if (!cancelled) setProducts([])
      })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  const productsBySlug: Record<string, Product> = {}
  for (const p of products) {
    productsBySlug[productSlug(p)] = p
  }

  return (
    <Ctx.Provider value={{ products, productsBySlug, loading }}>
      {children}
    </Ctx.Provider>
  )
}

export function useProducts() {
  return useContext(Ctx)
}

