import { reviews } from '../data'

export default function RatingSummary() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span>⭐️⭐️⭐️⭐️{reviews.ratingAvg >= 4.8 ? '⭐️' : '✩'}</span>
      <span style={{ color: '#000000' }}>({reviews.ratingCount} reviews)</span>
    </div>
  )
}

