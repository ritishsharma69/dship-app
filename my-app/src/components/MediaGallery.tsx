import { useEffect, useRef, useState, useLayoutEffect } from 'react'
import { gsap, canAnimate } from '../lib/gsap'
import type { Product } from '../types'

export default function MediaGallery({ product }: { product: Product }) {
  const [active, setActive] = useState(() => (product.youtubeUrl ? 1 : 0))
  const [lightbox, setLightbox] = useState(false)
  const mainRef = useRef<HTMLDivElement>(null)

  // Swipe to change
  useEffect(() => {
    const el = mainRef.current
    if (!el) return
    let startX = 0
    const onTouchStart = (e: TouchEvent) => { startX = e.touches[0].clientX }
    const onTouchEnd = (e: TouchEvent) => {
      const dx = e.changedTouches[0].clientX - startX
      if (Math.abs(dx) > 50) {
        setActive((prev) => {
          const next = dx < 0 ? prev + 1 : prev - 1
          if (next < 0) return 0
          if (next >= product.images.length) return product.images.length - 1
          return next
        })
      }
    }
    el.addEventListener('touchstart', onTouchStart)
    el.addEventListener('touchend', onTouchEnd)
    return () => {
      el.removeEventListener('touchstart', onTouchStart)
      el.removeEventListener('touchend', onTouchEnd)
    }
  }, [product.images.length])

  // Keyboard navigation in lightbox + body class to hide sticky UI
  useEffect(() => {
    if (!lightbox) {
      document.body.classList.remove('lightbox-open')
      return
    }

    document.body.classList.add('lightbox-open')
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightbox(false)
      if (e.key === 'ArrowRight') setActive((a) => Math.min(a + 1, product.images.length - 1))
      if (e.key === 'ArrowLeft') setActive((a) => Math.max(a - 1, 0))
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.classList.remove('lightbox-open')
    }
  }, [lightbox, product.images.length])

  const next = () => setActive((a) => Math.min(a + 1, product.images.length - 1))
  const prev = () => setActive((a) => Math.max(a - 1, 0))

  // Animations
  useLayoutEffect(() => {
    if (!canAnimate()) return
    const ctx = gsap.context(() => {
      gsap.from(mainRef.current, { opacity: 0, y: 20, duration: 0.5, ease: 'power2.out' })
      gsap.from('.thumb', { opacity: 0, y: 10, stagger: 0.06, duration: 0.4, ease: 'power2.out', delay: 0.1 })
    })
    return () => ctx.revert()
  }, [])

  // Build a media list that inserts YouTube video as the 2nd item if provided
  const media: Array<{ type: 'image' | 'youtube'; src: string; thumb?: string }> = (() => {
    const arr: Array<{ type: 'image' | 'youtube'; src: string; thumb?: string }> = product.images.map(src => ({ type: 'image', src }))
    if (product.youtubeUrl) {
      const ytId = (product.youtubeUrl.match(/[?&]v=([^&]+)/) || product.youtubeUrl.match(/youtu\.be\/([^?]+)/))?.[1]
      const thumb = ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : undefined
      arr.splice(1, 0, { type: 'youtube', src: product.youtubeUrl, thumb })
    }
    return arr
  })()

  // Compute proper YouTube embed URL (handles t/start params) so autoplay works
  const embedSrc = (() => {
    const m = media[active]
    if (!m || m.type !== 'youtube') return ''
    const raw = m.src
    const ytId = (raw.match(/[?&]v=([^&]+)/) || raw.match(/youtu\.be\/([^?]+)/))?.[1]
    if (!ytId) return raw
    const tParam = (raw.match(/[?&]t=([^&]+)/) || raw.match(/[?&]start=([^&]+)/))?.[1]
    let start = 0
    if (tParam) {
      if (/^\d+$/.test(tParam)) start = parseInt(tParam, 10)
      else {
        const mm = tParam.match(/(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?/)
        if (mm) start = (parseInt(mm[1]||'0')*3600) + (parseInt(mm[2]||'0')*60) + parseInt(mm[3]||'0')
      }
    }
    return `https://www.youtube.com/embed/${ytId}?autoplay=1&mute=1&playsinline=1&rel=0${start?`&start=${start}`:''}`
  })()

  // Adjust active index bounds if media length changed
  useEffect(() => {
    setActive((a) => Math.max(0, Math.min(a, media.length - 1)))
  }, [media.length])

  return (
    <section>
      <div ref={mainRef} style={{ position: 'relative' }}>
        {media[active]?.type === 'youtube' ? (
          <div style={{ position: 'relative', width: '100%', background: '#000' }}>
            <div style={{ position: 'relative', paddingTop: '56.25%' }}>
              <iframe
                src={embedSrc || media[active].src}
                title="Product video"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0, borderRadius: 8 }}
              />
            </div>
          </div>
        ) : (
          <button
            onClick={() => setLightbox(true)}
            title="Tap to zoom"
            aria-label="Open image"
            style={{ padding: 0, border: 'none', background: 'transparent', width: '100%', cursor: 'zoom-in' }}
          >
            <img
              src={media[active]?.src}
              alt={product.title}
              className="gallery-main"
              loading="lazy"
              onError={(e) => { (e.currentTarget as HTMLImageElement).src = 'https://placehold.co/1200x1200?text=Image' }}
            />
          </button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginTop: 8 }}>
        {media.map((m, i) => (
          <button
            key={(m.type==='image'?'img':'yt') + i}
            onClick={() => setActive(i)}
            className="thumb"
            style={{ border: i === active ? '2px solid #2563eb' : '1px solid #e5e7eb', borderRadius: 10, padding: 0, overflow: 'hidden', background: '#fff', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}
            aria-label={`Show media ${i + 1}`}
          >
            {m.type === 'youtube' ? (
              <div style={{ position: 'relative' }}>
                <img src={m.thumb || 'https://placehold.co/200x200?text=Video'} alt="Video thumbnail" style={{ width: '100%', height: 80, objectFit: 'cover', background: '#000' }} />
                <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}>
                  <div style={{ width: 20, height: 20, background: '#ff2a6d', clipPath: 'polygon(25% 20%, 25% 80%, 80% 50%)', borderRadius: 4, boxShadow: '0 1px 6px rgba(0,0,0,0.4)' }} />
                </div>
              </div>
            ) : (
              <img
                src={m.src}
                alt={`${product.title} ${i + 1}`}
                style={{ width: '100%', height: 80, objectFit: 'contain', background: '#fff' }}
                loading="lazy"
                onError={(e) => { (e.currentTarget as HTMLImageElement).src = 'https://placehold.co/200x200?text=Thumb' }}
              />
            )}
          </button>
        ))}
      </div>

      {lightbox && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setLightbox(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(0,0,0,0.95)',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20
          }}
        >
          <button
            onClick={(e) => { e.stopPropagation(); setLightbox(false) }}
            aria-label="Close"
            style={{
              position: 'absolute',
              top: 20,
              right: 20,
              background: 'rgba(0,0,0,0.8)',
              color: '#fff',
              border: '2px solid rgba(255,255,255,0.8)',
              borderRadius: '50%',
              width: 40,
              height: 40,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 18,
              fontWeight: 'bold',
              cursor: 'pointer',
              zIndex: 100001,
              boxShadow: '0 2px 10px rgba(0,0,0,0.3)'
            }}
          >
            ✕
          </button>

          {active > 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); prev() }}
              aria-label="Previous image"
              style={{ position: 'absolute', left: 16, background: 'rgba(0,0,0,0.8)', color: '#fff', border: '2px solid rgba(255,255,255,0.8)', borderRadius: '50%', width: 44, height: 44, fontSize: 20, zIndex: 100001, boxShadow: '0 2px 10px rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              ‹
            </button>
          )}

          <img
            src={product.images[active]}
            alt={product.title}
            style={{
              maxWidth: 'min(96vw,1200px)',
              maxHeight: '90vh',
              objectFit: 'contain',
              borderRadius: 12,
              background: '#fff',
              zIndex: 100000,
              boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
              border: '2px solid rgba(255,255,255,0.1)'
            }}
            onClick={(e) => e.stopPropagation()}
          />

          {active < product.images.length - 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); next() }}
              aria-label="Next image"
              style={{ position: 'absolute', right: 16, background: 'rgba(0,0,0,0.8)', color: '#fff', border: '2px solid rgba(255,255,255,0.8)', borderRadius: '50%', width: 44, height: 44, fontSize: 20, zIndex: 100001, boxShadow: '0 2px 10px rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              ›
            </button>
          )}
        </div>
      )}
    </section>
  )
}
