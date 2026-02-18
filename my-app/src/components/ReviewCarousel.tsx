import { useEffect, useState } from 'react'
import { reviewsBySlug } from '../data'

export default function ReviewCarousel() {
  const [idx, setIdx] = useState(0)
  const slug = (typeof window !== 'undefined' ? (window.location.pathname.split('/').filter(Boolean)[1]) : 'mini-butterfly-massager') || 'mini-butterfly-massager'
  const reviews = reviewsBySlug[slug]
  const testimonials = reviews?.testimonials ?? []
  useEffect(() => {
    if (testimonials.length === 0) return
    const t = setInterval(() => setIdx((i) => (i + 1) % testimonials.length), 4000)
    return () => clearInterval(t)
  }, [testimonials.length])
  if (testimonials.length === 0) return null
  const t = testimonials[idx % testimonials.length]
  return (
    <div style={{ border: '1px solid var(--color-border)', borderRadius: 12, padding: 16 }}>
      <p style={{ fontStyle: 'italic', color: '#000000' }}>“{t.quote}”</p>
      <p style={{ marginTop: 8, color: '#000000' }}>— {t.author} · Loved how Adivasi oil reduced hair fall and made hair stronger!</p>
    </div>
  )
}

