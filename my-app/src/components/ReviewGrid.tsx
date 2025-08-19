import { reviews } from '../data'

export default function ReviewGrid() {
  const items = reviews.testimonials.slice(0, 20)
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
      {items.map((t, i) => (
        <div key={i} className="card" style={{ borderRadius: 12, borderColor: 'var(--color-border)', padding: 12 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
            <img src={t.avatar || `https://i.pravatar.cc/100?img=${(i%50)+1}`} alt="avatar" style={{ width: 28, height: 28, borderRadius: '999px' }} />
            <div style={{ fontWeight: 800, fontSize: 14, color:'#111827' }}>{t.author}</div>
          </div>
          <div style={{ color:'#111827', fontSize: 14 }}>“{t.quote}”</div>
        </div>
      ))}
    </div>
  )
}

