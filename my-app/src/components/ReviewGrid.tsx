import { memo, useMemo } from 'react'
import { reviews } from '../data'

function ReviewGridInner() {
  const items = useMemo(() => reviews.testimonials.slice(0, 20), [])
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
      {items.map((t, i) => (
        <div key={i} className="card" style={{ borderRadius: 12, borderColor: 'var(--color-border)', padding: 12 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
            <div style={{ fontWeight: 800, fontSize: 14, color:'#111827' }}>{t.author}</div>
          </div>
          <div style={{ display:'flex', gap:2, marginBottom:6 }}>
            {Array.from({ length: 5 }).map((_, s) => (
              <span key={s} className={`fa-${(t.rating ?? 5) > s ? 'solid' : 'regular'} fa-star`} style={{ color: '#f59e0b', fontSize: 12 }} />
            ))}
          </div>
          <div style={{ color:'#111827', fontSize: 14 }}>“{t.quote}”</div>
        </div>
      ))}
    </div>
  )
}

export default memo(ReviewGridInner)
