import { useEffect, useRef, useState, useLayoutEffect, useMemo } from 'react'
import { gsap, canAnimate } from '../lib/gsap'
import type { Product } from '../types'
import { optimizeImage } from '../lib/cloudinary'
import { useWishlist } from '../lib/wishlist'

import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import FavoriteBorderRounded from '@mui/icons-material/FavoriteBorderRounded'
import FavoriteRounded from '@mui/icons-material/FavoriteRounded'
import ShareRounded from '@mui/icons-material/ShareRounded'
import PlayArrowRounded from '@mui/icons-material/PlayArrowRounded'

export default function MediaGallery({ product }: { product: Product }) {
  const images = product.images ?? []
  const [active, setActive] = useState(() => (product.youtubeUrl && images.length > 0 ? 1 : 0))
  const [lightbox, setLightbox] = useState(false)
  const { has, toggle } = useWishlist()
  const liked = has(product.id)
  const [broken, setBroken] = useState<Record<number, true>>({})
  const mainRef = useRef<HTMLDivElement>(null)

  const pct = product.compareAtPrice && product.compareAtPrice > product.price
    ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
    : null

  const onShare = async () => {
    try {
      if (navigator.share) await navigator.share({ title: product.title, url: window.location.href })
      else await navigator.clipboard.writeText(window.location.href)
    } catch { /* user cancelled */ }
  }

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
      <Box sx={{ display: 'flex', gap: 1.5, flexDirection: { xs: 'column', sm: 'row' } }}>
        {/* Thumbnail rail — vertical on desktop, horizontal below on mobile */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'row', sm: 'column' },
            gap: 1.25,
            order: { xs: 2, sm: 1 },
            overflowX: { xs: 'auto', sm: 'visible' },
            overflowY: { xs: 'visible', sm: 'auto' },
            maxHeight: { sm: 480 },
            flexShrink: 0,
            pb: { xs: 0.5, sm: 0 },
            '&::-webkit-scrollbar': { display: 'none' },
          }}
        >
          {media.map((m, i) => (
            <Box
              key={(m.type === 'image' ? 'img' : 'yt') + i}
              component="button"
              onClick={() => setActive(i)}
              className="thumb"
              aria-label={`Show media ${i + 1}`}
              sx={{
                width: { xs: 64, sm: 72 },
                height: { xs: 64, sm: 72 },
                flexShrink: 0,
                p: 0,
                overflow: 'hidden',
                borderRadius: '14px',
                cursor: 'pointer',
                background: '#F3F4F6',
                border: i === active ? '2px solid #7C3AED' : '2px solid transparent',
                outline: i === active ? 'none' : '1px solid #E5E7EB',
                outlineOffset: '-1px',
                transition: 'border-color 0.15s ease, transform 0.15s ease',
                '&:hover': { transform: 'scale(1.04)' },
                display: 'grid',
                placeItems: 'center',
              }}
            >
              {m.type === 'youtube' ? (
                <Box sx={{ width: '100%', height: '100%', background: '#111827', display: 'grid', placeItems: 'center' }}>
                  <Box sx={{ width: 26, height: 26, borderRadius: '50%', background: '#7C3AED', display: 'grid', placeItems: 'center' }}>
                    <PlayArrowRounded sx={{ fontSize: 18, color: '#fff' }} />
                  </Box>
                </Box>
              ) : (m.src && !broken[i]) ? (
                <img
                  src={optimizeImage(m.src, 'thumb')}
                  alt={`${product.title} ${i + 1}`}
                  style={{ width: '100%', height: '100%', objectFit: 'contain', background: '#F3F4F6' }}
                  loading="lazy"
                  onError={() => setBroken((b) => ({ ...b, [i]: true }))}
                />
              ) : (
                <Placeholder label="—" height="100%" />
              )}
            </Box>
          ))}
        </Box>

        {/* Main media */}
        <Box ref={mainRef} sx={{ position: 'relative', flex: 1, minWidth: 0, order: { xs: 1, sm: 2 } }}>
          <Box
            sx={{
              position: 'relative',
              borderRadius: '20px',
              overflow: 'hidden',
              background: '#F3F4F6',
              border: '1px solid #EEF0F3',
            }}
          >
            {media[active]?.type === 'youtube' ? (
              <Box sx={{ position: 'relative', width: '100%', background: '#000' }}>
                <Box sx={{ position: 'relative', paddingTop: '56.25%' }}>
                  <iframe
                    src={embedSrc || media[active].src}
                    title="Product video"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }}
                  />
                </Box>
              </Box>
            ) : (
              <button
                onClick={() => setLightbox(true)}
                title="Tap to zoom"
                aria-label="Open image"
                style={{ padding: 0, border: 'none', background: 'transparent', width: '100%', cursor: 'zoom-in', display: 'block' }}
              >
                {media[active]?.src && !broken[active] ? (
                  <img
                    src={optimizeImage(media[active]?.src, 'product')}
                    alt={product.title}
                    className="gallery-main"
                    loading="lazy"
                    style={{ width: '100%', aspectRatio: '1 / 1', objectFit: 'contain', display: 'block' }}
                    onError={() => setBroken((b) => ({ ...b, [active]: true }))}
                  />
                ) : (
                  <Placeholder label="Image will appear when available" height={360} />
                )}
              </button>
            )}

            {/* Discount badge */}
            {pct != null && (
              <Box
                sx={{
                  position: 'absolute',
                  top: 16,
                  left: 16,
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  background: '#EF2B62',
                  color: '#fff',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  lineHeight: 1.1,
                  boxShadow: '0 4px 14px rgba(239,43,98,0.4)',
                  pointerEvents: 'none',
                }}
              >
                <Box component="span" sx={{ fontSize: 15, fontWeight: 900 }}>{pct}%</Box>
                <Box component="span" sx={{ fontSize: 10, fontWeight: 800, letterSpacing: 0.5 }}>OFF</Box>
              </Box>
            )}

            {/* Heart / Share */}
            <Box sx={{ position: 'absolute', top: 12, right: 12, display: 'flex', flexDirection: 'column', gap: 1 }}>
              <IconButton
                aria-label={liked ? 'Remove from wishlist' : 'Add to wishlist'}
                onClick={() => toggle(product.id)}
                sx={{ background: '#fff', boxShadow: '0 2px 10px rgba(0,0,0,0.10)', width: 40, height: 40, '&:hover': { background: '#fff' } }}
              >
                {liked
                  ? <FavoriteRounded sx={{ fontSize: 20, color: '#EF2B62' }} />
                  : <FavoriteBorderRounded sx={{ fontSize: 20, color: '#374151' }} />}
              </IconButton>
              <IconButton
                aria-label="Share product"
                onClick={onShare}
                sx={{ background: '#fff', boxShadow: '0 2px 10px rgba(0,0,0,0.10)', width: 40, height: 40, '&:hover': { background: '#fff' } }}
              >
                <ShareRounded sx={{ fontSize: 19, color: '#374151' }} />
              </IconButton>
            </Box>
          </Box>
        </Box>
      </Box>

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
	              src={optimizeImage(media[active]?.src, 'full')}
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
