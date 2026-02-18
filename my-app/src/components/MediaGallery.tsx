import { useEffect, useRef, useState, useLayoutEffect, useMemo } from 'react'
import { gsap, canAnimate } from '../lib/gsap'
import type { Product } from '../types'

export default function MediaGallery({ product }: { product: Product }) {
  const images = product.images ?? []
  const [active, setActive] = useState(() => (product.youtubeUrl && images.length > 0 ? 1 : 0))
  const [lightbox, setLightbox] = useState(false)
  const [broken, setBroken] = useState<Record<number, true>>({})
  const mainRef = useRef<HTMLDivElement>(null)

  // Build a media list that inserts YouTube video as the 2nd item if provided
  const media: Array<{ type: 'image' | 'youtube'; src: string }> = useMemo(() => {
    const arr: Array<{ type: 'image' | 'youtube'; src: string }> = (product.images ?? []).map((src) => ({ type: 'image', src }))
    if (product.youtubeUrl) {
      arr.splice(1, 0, { type: 'youtube', src: product.youtubeUrl })
    }
    return arr
  }, [product.images, product.youtubeUrl])

  const imageIndexes = useMemo(() => {
    const idx: number[] = []
    for (let i = 0; i < media.length; i++) if (media[i]?.type === 'image') idx.push(i)
    return idx
  }, [media])

  const activeImagePos = useMemo(() => imageIndexes.indexOf(active), [imageIndexes, active])
  const prevImageIndex = activeImagePos > 0 ? imageIndexes[activeImagePos - 1] : null
  const nextImageIndex = activeImagePos >= 0 && activeImagePos < imageIndexes.length - 1 ? imageIndexes[activeImagePos + 1] : null

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
          if (next >= media.length) return Math.max(0, media.length - 1)
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
  }, [media.length])

  // Keyboard navigation in lightbox + body class to hide sticky UI
  useEffect(() => {
    if (!lightbox) {
      document.body.classList.remove('lightbox-open')
      return
    }

    document.body.classList.add('lightbox-open')
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightbox(false)
      if (e.key === 'ArrowRight') setActive((a) => Math.min(a + 1, media.length - 1))
      if (e.key === 'ArrowLeft') setActive((a) => Math.max(a - 1, 0))
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.classList.remove('lightbox-open')
    }
  }, [lightbox, media.length])

  // Animations
  useLayoutEffect(() => {
    if (!canAnimate()) return
    const ctx = gsap.context(() => {
      gsap.from(mainRef.current, { opacity: 0, y: 20, duration: 0.5, ease: 'power2.out' })
      gsap.from('.thumb', { opacity: 0, y: 10, stagger: 0.06, duration: 0.4, ease: 'power2.out', delay: 0.1 })
    })
    return () => ctx.revert()
  }, [])

  // Compute proper YouTube embed URL (handles t/start params) so autoplay works
  const embedSrc = useMemo(() => {
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
  }, [media, active])

  // Adjust active index bounds if media length changed
  useEffect(() => {
    setActive((a) => Math.max(0, Math.min(a, media.length - 1)))
  }, [media.length])

  const Placeholder = ({ label, height }: { label: string; height: number | string }) => (
    <div
      aria-label={label}
      style={{
        width: '100%',
        height,
        display: 'grid',
        placeItems: 'center',
        borderRadius: 10,
        background: 'linear-gradient(135deg, rgba(251,247,241,1) 0%, rgba(246,240,230,1) 55%, rgba(248,243,206,0.65) 100%)',
        border: '1px solid rgba(0,0,0,0.08)'
      }}
    >
      <div style={{ fontSize: 12, fontWeight: 800, opacity: 0.7 }}>{label}</div>
    </div>
  )

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
	            {media[active]?.src && !broken[active] ? (
	              <img
	                src={media[active]?.src}
	                alt={product.title}
	                className="gallery-main"
	                loading="lazy"
	                onError={() => setBroken((b) => ({ ...b, [active]: true }))}
	              />
	            ) : (
	              <Placeholder label="Image will appear when available" height={360} />
	            )}
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
	              <div style={{ position: 'relative', width: '100%', height: 80, background: '#0b0b0b', display: 'grid', placeItems: 'center' }}>
	                <div style={{ width: 20, height: 20, background: '#ff2a6d', clipPath: 'polygon(25% 20%, 25% 80%, 80% 50%)', borderRadius: 4, boxShadow: '0 1px 6px rgba(0,0,0,0.4)' }} />
	              </div>
            ) : (
	              (m.src && !broken[i]) ? (
	                <img
	                  src={m.src}
	                  alt={`${product.title} ${i + 1}`}
	                  style={{ width: '100%', height: 80, objectFit: 'contain', background: '#fff' }}
	                  loading="lazy"
	                  onError={() => setBroken((b) => ({ ...b, [i]: true }))}
	                />
	              ) : (
	                <Placeholder label="No image" height={80} />
	              )
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

	          {prevImageIndex != null && (
            <button
	              onClick={(e) => { e.stopPropagation(); setActive(prevImageIndex) }}
              aria-label="Previous image"
              style={{ position: 'absolute', left: 16, background: 'rgba(0,0,0,0.8)', color: '#fff', border: '2px solid rgba(255,255,255,0.8)', borderRadius: '50%', width: 44, height: 44, fontSize: 20, zIndex: 100001, boxShadow: '0 2px 10px rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              ‹
            </button>
          )}

	          {media[active]?.type === 'image' && media[active]?.src && !broken[active] ? (
	            <img
	              src={media[active]?.src}
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
	              onError={() => setBroken((b) => ({ ...b, [active]: true }))}
	            />
	          ) : (
	            <div onClick={(e) => e.stopPropagation()} style={{ width: 'min(96vw,1200px)' }}>
	              <Placeholder label="Image unavailable" height={420} />
	            </div>
	          )}

	          {nextImageIndex != null && (
            <button
	              onClick={(e) => { e.stopPropagation(); setActive(nextImageIndex) }}
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
