import { memo, useMemo } from 'react'
import { useProducts } from '../lib/products'
import { Star, StarHalf } from '@mui/icons-material'

function ReviewGridInner() {
  const { productsBySlug } = useProducts()
  const slug = (typeof window !== 'undefined' ? (window.location.pathname.split('/').filter(Boolean)[1]) : '') || ''
  const product = productsBySlug[slug]
  const items = useMemo(() => (product?.testimonials ?? []).slice(0, 20), [product])
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
      {items.map((t, i) => (
        <div key={i} className="card" style={{ borderRadius: 12, borderColor: 'var(--color-border)', padding: 12 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:8, marginBottom:8 }}>
            <div style={{ fontWeight: 800, fontSize: 14, color:'#111827' }}>{t.author}</div>
            <div style={{ display:'flex', gap:2 }}>
              {Array.from({ length: 5 }).map((_, s) => {
                const rating = t.rating ?? 5
                const isHalf = rating > s && rating < s + 1
                const isFull = rating > s + 0.5
                return isHalf ? (
                  <StarHalf key={s} sx={{ fontSize: 16, color: '#f59e0b' }} />
                ) : (
                  <Star key={s} sx={{ fontSize: 16, color: isFull ? '#f59e0b' : '#e5e7eb' }} />
                )
              })}
            </div>
          </div>
          <div style={{ color:'#111827', fontSize: 14 }}>“{t.quote}”</div>
        </div>
      ))}
    </div>
  )
}

export default memo(ReviewGridInner)
