import { reviewsBySlug } from '../data'

export default function RatingSummary() {
  const slug = (typeof window !== 'undefined' ? (window.location.pathname.split('/').filter(Boolean)[1]) : 'mini-butterfly-massager') || 'mini-butterfly-massager'
  const reviews = reviewsBySlug[slug]
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span>⭐️⭐️⭐️⭐️{reviews.ratingAvg >= 4.8 ? '⭐️' : '✩'}</span>
      <span style={{ color: '#000000' }}>({reviews.ratingCount} reviews)</span>
    </div>
  )
}

