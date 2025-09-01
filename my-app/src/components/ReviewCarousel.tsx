import { useEffect, useState } from 'react'
import { reviewsBySlug } from '../data'

export default function ReviewCarousel() {
  const [idx, setIdx] = useState(0)
  const slug = (typeof window !== 'undefined' ? (window.location.pathname.split('/').filter(Boolean)[1]) : 'mini-butterfly-massager') || 'mini-butterfly-massager'
  const reviews = reviewsBySlug[slug]
  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % reviews.testimonials.length), 4000)
    return () => clearInterval(t)
  }, [reviews.testimonials.length])
  const t = reviews.testimonials[idx]
  return (
    <div style={{ border: '1px solid var(--color-border)', borderRadius: 12, padding: 16 }}>
      <p style={{ fontStyle: 'italic', color: '#000000' }}>“{t.quote}”</p>
      <p style={{ marginTop: 8, color: '#000000' }}>— {t.author} · Loved how Adivasi oil reduced hair fall and made hair stronger!</p>
    </div>
  )
}

