import { useEffect, useMemo, useRef, useState } from 'react'
import { Box, Button, Card, CardActionArea, CardContent, Chip, Container, IconButton, Paper, Skeleton, Snackbar, TextField, Typography } from '@mui/material'
import CheckCircleRounded from '@mui/icons-material/CheckCircleRounded'
import CloseRounded from '@mui/icons-material/CloseRounded'
import GroupsRounded from '@mui/icons-material/GroupsRounded'
import LocalShippingOutlined from '@mui/icons-material/LocalShippingOutlined'
import PaymentsOutlined from '@mui/icons-material/PaymentsOutlined'
import StarRounded from '@mui/icons-material/StarRounded'
import StarHalfRounded from '@mui/icons-material/StarHalfRounded'
import StarBorderRounded from '@mui/icons-material/StarBorderRounded'
// ShoppingBagOutlined removed – using Explore button now
import ArrowForwardRounded from '@mui/icons-material/ArrowForwardRounded'
import ChevronLeftRounded from '@mui/icons-material/ChevronLeftRounded'
import ChevronRightRounded from '@mui/icons-material/ChevronRightRounded'
import LocationOnRounded from '@mui/icons-material/LocationOnRounded'
import VerifiedOutlined from '@mui/icons-material/VerifiedOutlined'
import { useRouter } from '../lib/router'
import { gsap } from '../lib/gsap'
import { productSlug, useProducts } from '../lib/products'

const money = (v?: number) => (v == null ? '' : new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v))

export default function SimpleHomePage() {
  const { navigate } = useRouter()
  const { products, productsBySlug, loading: productsLoading } = useProducts()
  const rootRef = useRef<HTMLDivElement | null>(null)
  const [slideIdx, setSlideIdx] = useState(0)
  const [email, setEmail] = useState('')
  const [subToastOpen, setSubToastOpen] = useState(false)
  const [featImgIdx, setFeatImgIdx] = useState<Record<string, number>>({})

  const StarsRow = ({ value }: { value?: number }) => {
    const v = Math.max(0, Math.min(5, Number.isFinite(value as number) ? (value as number) : 0))
    const r = Math.round(v * 2) / 2
    const full = Math.floor(r)
    const half = r - full === 0.5
    return (
      <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.2, color: '#111' }}>
        {Array.from({ length: 5 }).map((_, i) => {
          if (i < full) return <StarRounded key={i} sx={{ fontSize: 16, color: '#111' }} />
          if (i === full && half) return <StarHalfRounded key={i} sx={{ fontSize: 16, color: '#111' }} />
          return <StarBorderRounded key={i} sx={{ fontSize: 16, color: 'rgba(17,17,17,0.55)' }} />
        })}
      </Box>
    )
  }

  const Media = ({ src, alt }: { src?: string; alt: string }) => {
    if (src) {
      return <Box component="img" src={src} alt={alt} sx={{ width: '100%', height: '100%', objectFit: 'contain' }} />
    }
    return (
      <Box
        aria-label={alt}
        sx={{
          width: '100%',
          height: '100%',
          display: 'grid',
          placeItems: 'center',
          background: 'linear-gradient(135deg, rgba(251,247,241,1) 0%, rgba(246,240,230,1) 55%, rgba(248,243,206,0.65) 100%)',
        }}
      >
        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800 }}>
          Image will appear when products load
        </Typography>
      </Box>
    )
  }

  const heroSlides = useMemo(() => {
    const base = products.length ? products : Object.values(productsBySlug)
    return base.slice(0, 5).map((p) => {
      const slug = productSlug(p)
      return {
        id: slug,
        title: p.title,
        price: p.price,
        compareAt: p.compareAtPrice,
        image: p.images?.[0],
        slug: '/p/' + slug,
      }
    })
  }, [products, productsBySlug])

  const featured = useMemo(() => {
    const base = products.length ? products : Object.values(productsBySlug)
    return base.slice(0, 10).map((p) => {
      const slug = productSlug(p)
			const tags = (p.bullets || []).slice(1, 4).filter(Boolean)
      return {
        id: slug,
        title: p.title,
        subtitle: p.bullets?.[0] || p.brand || 'Bestseller pick',
				tags: tags.length ? tags : (p.brand ? [p.brand] : []),
        images: (p as any).heroImages?.length ? (p as any).heroImages : (p.images || []),
        youtubeUrl: p.youtubeUrl,
        price: p.price,
        compareAt: p.compareAtPrice,
				ratingAvg: (p as any).ratingAvg,
				ratingCount: (p as any).ratingCount,
        slug: '/p/' + slug,
      }
    })
  }, [products, productsBySlug])

  const popular = useMemo(() => featured.slice(0, 10), [featured])

  // Scroll reveals
  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const q = gsap.utils.selector(root)
    const ctx = gsap.context(() => {
      gsap.from(q('[data-anim="fade"]'), {
        y: 18,
        opacity: 0,
        duration: 0.45,
        ease: 'power2.out',
        stagger: 0.06,
        scrollTrigger: { trigger: root, start: 'top 80%' },
      })
    }, root)
    return () => ctx.revert()
  }, [])

  // Auto-rotate hero every 4s
  useEffect(() => {
    if (heroSlides.length === 0) return
    const id = setInterval(() => setSlideIdx(i => (i + 1) % heroSlides.length), 4000)
    return () => clearInterval(id)
  }, [heroSlides.length])

  // Fade-in animation when slide changes
  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const q = gsap.utils.selector(root)
    const tl = gsap.timeline()
    tl.fromTo(q('.hero-visual'), { opacity: 0 }, { opacity: 1, duration: 0.35, ease: 'power2.out' })
      .fromTo(q('.hero-text'), { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.32, ease: 'power2.out' }, '<')
  }, [slideIdx])

  const curr = heroSlides[slideIdx % Math.max(heroSlides.length, 1)] || {
    title: 'Loading...',
    slug: '/',
    image: undefined as string | undefined,
    price: 0,
    compareAt: 0,
  }

  const bentoItems = useMemo(() => {
    const base = products.length ? products : Object.values(productsBySlug)
    const picks = base.slice(0, 5)

    const toneGradients = [
      'linear-gradient(135deg, #E8F5E9 0%, #FFF8E1 50%, #FFF 100%)',   // green-fruity (juicer vibes)
      'linear-gradient(135deg, #F3E5F5 0%, #E8EAF6 50%, #FFF 100%)',   // pink-pastel (tumbler vibes)
      'linear-gradient(135deg, #E0F7FA 0%, #F1F8E9 50%, #FFF 100%)',   // mint-fresh (scalp/wellness)
      'linear-gradient(135deg, #FFF3E0 0%, #FBE9E7 50%, #FFF 100%)',   // warm-peach
      'linear-gradient(135deg, #F3E5F5 0%, #FCE4EC 50%, #FFF 100%)',   // lavender-rose
    ]
    const spans = [
      { md: 'span 7', row: 'span 2', big: true },
      { md: 'span 5', row: 'span 1', big: false },
      { md: 'span 5', row: 'span 1', big: false },
      { md: 'span 6', row: 'span 1', big: false },
      { md: 'span 6', row: 'span 1', big: false },
    ]

    return picks.map((p, i) => {
      const slug = productSlug(p)
      return {
        key: slug,
        title: p.title,
        subtitle: p.bullets?.[0] || p.brand || 'Explore now',
        image: (p as any).heroImages?.[0] || p.images?.[0],
        href: '/p/' + slug,
        tone: toneGradients[i % toneGradients.length],
        span: spans[i % spans.length],
        big: spans[i % spans.length].big,
      }
    })
  }, [products, productsBySlug])

  return (
    <Box sx={{ background: 'radial-gradient(1200px 600px at 10% 0%, #fff 0%, #FBF7F1 45%, #F6F0E6 100%)' }}>
      <Container sx={{ py: { xs: 2.5, md: 5 } }} ref={rootRef}>
        {/* Top Bento (Hero) */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(12, 1fr)' }, gap: 2, mb: { xs: 3, md: 5 } }}>
          <Card data-anim="fade" elevation={0} sx={{ gridColumn: { md: '1 / span 7' }, borderRadius: 4, border: '1px solid rgba(0,0,0,0.06)', overflow: 'hidden', background: 'linear-gradient(135deg, #F7F1E9 0%, #FFF 100%)' }}>
            <Box sx={{ p: { xs: 2.2, md: 3.5 }, display: 'grid', gap: 1.4 }}>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Chip label="Premium Wellness" size="small" sx={{ bgcolor: '#F8F3CE', fontWeight: 800 }} />
              </Box>
              <Typography className="hero-text" sx={{ fontFamily: 'Georgia, Times New Roman, serif', fontSize: { xs: 34, md: 52 }, lineHeight: 1.02, letterSpacing: -0.5, fontWeight: 700 }}>
                Comfort essentials,
                <Box component="span" sx={{ display: 'block' }}>made to feel luxe.</Box>
              </Typography>
              <Typography color="text.secondary" sx={{ maxWidth: 520 }}>
                A warm, minimal collection of tools that help you recover faster and feel lighter — every day.
              </Typography>
              <Box sx={{ display: 'flex', gap: 1.2, flexWrap: 'wrap', alignItems: 'center', mt: 0.5 }}>
                <Button variant="contained" onClick={() => navigate(curr.slug)} sx={{ fontWeight: 900, px: 2.2, backgroundColor: 'var(--color-buy)', '&:hover': { backgroundColor: 'var(--color-buy-hover)' } }}>
                  {productsLoading && !products.length ? 'Shop Now' : `Shop ${curr.title}`}
                </Button>
                <Button variant="text" onClick={() => navigate('/contact')} sx={{ fontWeight: 800, color: '#2b2b2b' }}>Need help?</Button>
              </Box>
              <Box component="img" src="/home-banner.png" alt="Free delivery, Easy returns, COD, SSL secure" sx={{ width: '100%', mt: 0, mb: 0, borderRadius: 3, display: 'block', objectFit: 'contain' }} />
            </Box>
          </Card>

          <Card data-anim="fade" elevation={0} sx={{ gridColumn: { md: '8 / span 5' }, borderRadius: 4, border: '1px solid rgba(0,0,0,0.06)', overflow: 'hidden', bgcolor: '#fff' }}>
            <Box className="hero-visual" sx={{ height: { xs: 280, md: 420 }, display: 'grid', placeItems: 'center', p: 2, background: 'linear-gradient(180deg, rgba(255,255,255,1) 0%, rgba(248,243,206,0.25) 100%)' }}>
              <Media src={curr.image} alt={curr.title} />
            </Box>
          </Card>
        </Box>

        {/* Featured strip */}
        <Box data-anim="fade" sx={{ mb: { xs: 3, md: 5 } }}>
          <Box sx={{ display: 'flex', alignItems: 'end', justifyContent: 'space-between', gap: 2, mb: 2 }}>
            <Box>
              <Typography sx={{ fontFamily: 'Georgia, Times New Roman, serif', fontSize: { xs: 22, md: 28 }, fontWeight: 700 }}>Featured</Typography>
              <Typography variant="body2" color="text.secondary">{productsLoading && featured.length === 0 ? 'Loading products…' : 'Handpicked bestsellers'}</Typography>
            </Box>
            <Button variant="text" onClick={() => navigate('/')} sx={{ fontWeight: 800, color: '#2b2b2b' }}>View all</Button>
          </Box>
          {productsLoading && featured.length === 0 ? (
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: { xs: 1.5, md: 2 } }}>
              {[1,2,3,4,5,6].map(i => (
                <Card key={i} elevation={0} sx={{ borderRadius: '16px', overflow: 'hidden', border: '1px solid rgba(0,0,0,0.06)', bgcolor: '#fff' }}>
                  <Skeleton variant="rectangular" height={220} animation="wave" />
                  <CardContent sx={{ p: 1.5 }}>
                    <Skeleton width="70%" height={20} animation="wave" sx={{ mb: 0.5 }} />
                    <Skeleton width="40%" height={24} animation="wave" />
                  </CardContent>
                </Card>
              ))}
            </Box>
          ) : (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: { xs: 1.5, md: 2 } }}>
            {featured.slice(0, 6).map((p) => {
              const price = Number(p.price || 0)
              const compareAt = Number(p.compareAt || 0)
              const pct = compareAt > price && compareAt > 0 ? Math.round(((compareAt - price) / compareAt) * 100) : 0
              return (
                <Card
                  key={p.id}
                  elevation={0}
                  sx={{
                    borderRadius: '16px',
                    overflow: 'hidden',
                    border: '1px solid rgba(0,0,0,0.06)',
                    bgcolor: '#fff',
                    transition: 'all 0.35s ease',
                    '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 16px 40px rgba(0,0,0,0.10)' },
                    '&:hover .feat-img': { transform: 'scale(1.06)' },
                  }}
                >
                  <CardActionArea onClick={() => navigate(p.slug)} sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}>
                    {/* Image area */}
                    <Box sx={{ position: 'relative', height: { xs: 200, sm: 220, md: 240 }, overflow: 'hidden', bgcolor: '#fafafa' }}>
                      {(() => {
                        const imgs = p.images.length ? p.images : []
                        const idx = featImgIdx[p.id] || 0
                        const cur = imgs[idx] || imgs[0]
                        return cur ? (
                          <Box component="img" className="feat-img" src={cur} alt={p.title} sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform 0.6s ease' }} />
                        ) : (
                          <Media src={undefined} alt={p.title} />
                        )
                      })()}
                      {/* Left / Right arrows */}
                      {p.images.length > 1 && (
                        <>
                          <IconButton
                            size="small"
                            onClick={(e) => { e.stopPropagation(); e.preventDefault(); setFeatImgIdx(prev => ({ ...prev, [p.id]: ((prev[p.id] || 0) - 1 + p.images.length) % p.images.length })) }}
                            sx={{ position: 'absolute', left: 6, top: '50%', transform: 'translateY(-50%)', zIndex: 3, bgcolor: 'rgba(255,255,255,0.85)', boxShadow: '0 2px 8px rgba(0,0,0,0.12)', '&:hover': { bgcolor: '#fff' }, width: 28, height: 28 }}
                          >
                            <ChevronLeftRounded sx={{ fontSize: 18 }} />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={(e) => { e.stopPropagation(); e.preventDefault(); setFeatImgIdx(prev => ({ ...prev, [p.id]: ((prev[p.id] || 0) + 1) % p.images.length })) }}
                            sx={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', zIndex: 3, bgcolor: 'rgba(255,255,255,0.85)', boxShadow: '0 2px 8px rgba(0,0,0,0.12)', '&:hover': { bgcolor: '#fff' }, width: 28, height: 28 }}
                          >
                            <ChevronRightRounded sx={{ fontSize: 18 }} />
                          </IconButton>
                          {/* Dot indicators */}
                          <Box sx={{ position: 'absolute', bottom: 6, left: '50%', transform: 'translateX(-50%)', zIndex: 3, display: 'flex', gap: 0.5 }}>
                            {p.images.map((_, di) => (
                              <Box key={di} sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: di === (featImgIdx[p.id] || 0) ? '#111' : 'rgba(0,0,0,0.2)', transition: 'background 0.2s' }} />
                            ))}
                          </Box>
                        </>
                      )}
                      {/* Discount badge */}
                      {pct > 0 && (
                        <Box sx={{ position: 'absolute', top: 10, right: 10, zIndex: 2, background: 'linear-gradient(135deg, #ef4444, #dc2626)', px: 1.2, py: 0.35, borderRadius: 999, fontSize: 11, fontWeight: 800, color: '#fff', boxShadow: '0 2px 8px rgba(239,68,68,0.35)' }}>
                          {pct}% OFF
                        </Box>
                      )}
                    </Box>

                    {/* Content */}
                    <CardContent sx={{ p: 2, display: 'flex', flexDirection: 'column', flex: 1 }}>
                      {/* Tags */}
                      {(p as any).tags?.length > 0 && (
                        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 1 }}>
                          {((p as any).tags as string[]).slice(0, 2).map((tag, ti) => (
                            <Chip key={ti} label={tag} size="small" sx={{ height: 20, fontSize: 10, fontWeight: 700, bgcolor: 'rgba(0,0,0,0.05)', color: '#555' }} />
                          ))}
                        </Box>
                      )}

                      <Typography sx={{ fontWeight: 800, fontSize: { xs: 14, md: 15 }, lineHeight: 1.3, mb: 0.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {p.title}
                      </Typography>

                      <Typography variant="caption" sx={{ color: 'text.secondary', mb: 1, display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {p.subtitle}
                      </Typography>

                      {/* Rating */}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4, mb: 1 }}>
                        <Box sx={{ display: 'inline-flex', gap: 0.1 }}>
                          {Array.from({ length: 5 }).map((_, i) => (
                            <StarRounded key={i} sx={{ fontSize: 14, color: i < Math.round(Number((p as any).ratingAvg || 4.5)) ? '#f59e0b' : '#e5e7eb' }} />
                          ))}
                        </Box>
                        <Typography sx={{ fontSize: 11, color: '#333', fontWeight: 700 }}>
                          {Number((p as any).ratingAvg || 0) ? Number((p as any).ratingAvg).toFixed(1) : '4.5'}
                        </Typography>
                        <Typography sx={{ fontSize: 11, color: '#9ca3af', fontWeight: 600 }}>
                          / {Number((p as any).ratingCount || 0) || 0}
                        </Typography>
                      </Box>

                      {/* Price row */}
                      <Box sx={{ mt: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.8 }}>
                          <Typography sx={{ fontWeight: 900, fontSize: 18, letterSpacing: -0.3 }}>{money(p.price)}</Typography>
                          {p.compareAt ? <Typography sx={{ fontSize: 13, color: '#9ca3af', textDecoration: 'line-through', fontWeight: 500 }}>{money(p.compareAt)}</Typography> : null}
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4, color: '#111', fontSize: 12, fontWeight: 800 }}>
                          Shop <ArrowForwardRounded sx={{ fontSize: 16 }} />
                        </Box>
                      </Box>
                    </CardContent>
                  </CardActionArea>
                </Card>
              )
            })}
          </Box>
          )}
        </Box>

        {/* Bento (dynamic products) */}
        <Box data-anim="fade" sx={{ mb: { xs: 3, md: 5 } }}>
          <Typography sx={{ fontFamily: 'Georgia, Times New Roman, serif', fontSize: { xs: 22, md: 28 }, fontWeight: 700, mb: 1.5 }}>Explore</Typography>
          {productsLoading && bentoItems.length === 0 ? (
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 2 }}>
              {[1,2,3,4].map(i => (
                <Skeleton key={i} variant="rectangular" height={180} animation="wave" sx={{ borderRadius: 4 }} />
              ))}
            </Box>
          ) : (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(12, 1fr)' }, gridAutoRows: { md: 190 }, gap: 2 }}>
            {bentoItems.map((c) => (
              <Card key={c.key} elevation={0} sx={{ gridColumn: { md: c.span.md }, gridRow: { md: c.span.row }, borderRadius: 4, border: '1px solid rgba(0,0,0,0.06)', overflow: 'hidden', background: c.tone }}>
                <CardActionArea onClick={() => navigate(c.href)} sx={{ height: '100%' }}>
                  <Box sx={{ height: '100%', display: 'grid', gridTemplateColumns: c.big ? { xs: '1fr', sm: '1fr 1fr' } : { xs: '1fr', sm: '1.3fr 0.7fr' }, alignItems: 'center', gap: c.big ? 2 : 1.5, p: c.big ? { xs: 2, md: 3 } : { xs: 1.5, md: 2 } }}>
                    <Box sx={{ overflow: 'hidden' }}>
                      <Typography noWrap={!c.big} sx={{ fontFamily: 'Georgia, Times New Roman, serif', fontSize: c.big ? { xs: 22, md: 28 } : { xs: 16, md: 18 }, fontWeight: 700, lineHeight: 1.15 }}>{c.title}</Typography>
                      <Typography variant="body2" color="text.secondary" noWrap sx={{ mt: 0.4, fontSize: c.big ? 14 : 12 }}>{c.subtitle}</Typography>
                      <Button variant="text" size={c.big ? 'medium' : 'small'} sx={{ px: 0, mt: c.big ? 1.5 : 0.5, fontWeight: 900, color: '#2b2b2b', fontSize: c.big ? 14 : 12, minHeight: 'auto' }}>Shop now →</Button>
                    </Box>
                    <Box sx={{ height: { xs: 160, md: '100%' }, display: 'grid', placeItems: 'center', borderRadius: 3, overflow: 'hidden' }}>
                      <Media src={c.image} alt={c.title} />
                    </Box>
                  </Box>
                </CardActionArea>
              </Card>
            ))}
          </Box>
          )}
        </Box>

        {/* Most Popular */}
        <Box data-anim="fade" sx={{ mb: { xs: 3, md: 5 } }}>
          <Box sx={{ display: 'flex', alignItems: 'end', justifyContent: 'space-between', gap: 2, mb: 2.5 }}>
            <Box>
              <Typography sx={{ fontFamily: 'Georgia, Times New Roman, serif', fontSize: { xs: 22, md: 28 }, fontWeight: 700 }}>Most Popular</Typography>
              <Typography variant="body2" color="text.secondary">These get reordered again and again</Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(3, 1fr)', md: 'repeat(3, 1fr)' }, gap: { xs: 1.5, md: 2 } }}>
            {popular.map((p) => (
            <Card
              key={p.id}
              elevation={0}
              sx={{
                borderRadius: '14px',
                overflow: 'hidden',
                background: 'linear-gradient(to bottom, #1e293b, #0f172a)',
                border: 'none',
                boxShadow: '0 6px 24px rgba(0,0,0,0.25)',
                transition: 'all 0.4s ease',
                display: 'flex',
                flexDirection: 'column',
                cursor: 'pointer',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 12px 40px rgba(0,0,0,0.4)',
                },
                '&:hover .card-img': {
                  transform: 'scale(1.05)',
                },
              }}
            >
              <CardActionArea onClick={() => navigate(p.slug)} sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}>
                {/* Image / YouTube Video */}
                <Box sx={{ height: { xs: 180, sm: 220, md: 240 }, position: 'relative', width: '100%', overflow: 'hidden' }}>
                  {(() => {
                    // Extract YouTube embed URL if youtubeUrl is present
                    if ((p as any).youtubeUrl) {
                      const raw = (p as any).youtubeUrl as string
                      const ytId = (raw.match(/[?&]v=([^&]+)/) || raw.match(/youtu\.be\/([^?]+)/) || raw.match(/embed\/([^?]+)/))?.[1]
                      const embedUrl = ytId
                        ? `https://www.youtube.com/embed/${ytId}?autoplay=1&mute=1&loop=1&playlist=${ytId}&playsinline=1&controls=0&showinfo=0&rel=0`
                        : raw
                      return (
                        <Box sx={{ position: 'absolute', inset: 0, zIndex: 0 }}>
                          <iframe
                            src={embedUrl}
                            title={p.title}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            style={{ width: '100%', height: '100%', border: 0, objectFit: 'cover', pointerEvents: 'none' }}
                          />
                        </Box>
                      )
                    }
                    return p.images[0] ? (
                      <Box component="img" className="card-img" src={p.images[0]} alt={p.title} sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform 0.7s ease' }} />
                    ) : (
                      <Media src={p.images[0]} alt={p.title} />
                    )
                  })()}
                  <Box sx={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, #0f172a, rgba(15,23,42,0.3) 50%, transparent)', zIndex: 1 }} />

                  {/* Discount Badge */}
                  {(() => {
                    const price = Number(p.price || 0)
                    const compareAt = Number(p.compareAt || 0)
                    const pct = compareAt > price && compareAt > 0 ? Math.round(((compareAt - price) / compareAt) * 100) : 0
                    return pct ? (
                      <Box sx={{ position: 'absolute', top: 10, right: 10, zIndex: 10, background: 'linear-gradient(to right, #f59e0b, #f97316)', px: 1.2, py: 0.4, borderRadius: 999, fontSize: 11, fontWeight: 700, color: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>
                        {`-${pct}% OFF`}
                      </Box>
                    ) : null
                  })()}

                  {/* Title on Image */}
                  <Box sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, px: 2, pb: 1.2, zIndex: 10 }}>
                    <Typography sx={{ fontSize: { xs: 15, md: 17 }, fontWeight: 700, lineHeight: 1.25, color: '#fff', textShadow: '0 2px 8px rgba(0,0,0,0.5)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {p.title}
                    </Typography>
                  </Box>
                </Box>

                {/* Content */}
                <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, px: 2, pt: 1, pb: 2 }}>
                  <Typography sx={{ fontSize: 12, fontWeight: 500, color: '#fbbf24', mb: 0.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {p.subtitle || 'Premium quality'}
                  </Typography>
                  <Typography sx={{ fontSize: 12, lineHeight: 1.4, color: '#94a3b8', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', mb: 1 }}>
                    {(p as any).tags?.length ? (p as any).tags.join(' • ') : 'Premium quality & unbeatable value.'}
                  </Typography>

                  {/* Rating + Price */}
                  <Box sx={{ mt: 'auto', pt: 0.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4, mb: 0.5 }}>
                      <Box sx={{ display: 'inline-flex', gap: 0.1 }}>
                        {Array.from({ length: 5 }).map((_, i) => (
                          <StarRounded key={i} sx={{ fontSize: 14, color: i < Math.round(Number((p as any).ratingAvg || 4.5)) ? '#fbbf24' : '#475569' }} />
                        ))}
                      </Box>
                      <Typography sx={{ fontSize: 11, color: '#64748b' }}>
                        ({Number((p as any).ratingCount || 0) || 0})
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 0.6 }}>
                      <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.6 }}>
                        <Typography sx={{ fontWeight: 800, fontSize: 18, color: '#fff', letterSpacing: -0.3 }}>
                          {money(p.price)}
                        </Typography>
                        {p.compareAt ? (
                          <Typography sx={{ fontSize: 13, color: '#64748b', textDecoration: 'line-through', fontWeight: 500 }}>
                            {money(p.compareAt)}
                          </Typography>
                        ) : null}
                      </Box>
                      <Box
                        sx={{
                          px: 1.4,
                          py: 0.5,
                          borderRadius: 999,
                          background: 'linear-gradient(to right, #f59e0b, #f97316)',
                          fontSize: 11,
                          fontWeight: 800,
                          color: '#fff',
                          letterSpacing: 0.3,
                          whiteSpace: 'nowrap',
                          boxShadow: '0 2px 8px rgba(249,115,22,0.4)',
                        }}
                      >
                        Buy Now
                      </Box>
                    </Box>
                  </Box>
                </Box>
              </CardActionArea>
            </Card>
            ))}
          </Box>
        </Box>

        {/* About / Newsletter */}
        <Box data-anim="fade" sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1.1fr 0.9fr' }, gap: 2, mb: { xs: 4, md: 6 } }}>
          <Card elevation={0} sx={{ borderRadius: 4, border: '1px solid rgba(0,0,0,0.06)', overflow: 'hidden', bgcolor: '#fff' }}>
            <Box sx={{ p: { xs: 2.2, md: 3 } }}>
              <Typography sx={{ fontFamily: 'Georgia, Times New Roman, serif', fontSize: { xs: 22, md: 28 }, fontWeight: 700 }}>Our promise</Typography>
              <Typography color="text.secondary" sx={{ mt: 1 }}>
                Thoughtful products, clean visuals, and a premium experience — even when the API is down (fallback placeholders included).
              </Typography>
              <Box sx={{ mt: 2, display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(4, 1fr)' }, gap: 1.2 }}>
	                {[
	                  { k: '10k+', v: 'Happy customers', icon: <GroupsRounded fontSize="small" />, tone: 'rgba(245,158,11,0.18)', toneBorder: 'rgba(245,158,11,0.28)', iconColor: '#92400e' },
	                  { k: '4.8★', v: 'Avg rating', icon: <StarRounded fontSize="small" />, tone: 'rgba(124,58,237,0.14)', toneBorder: 'rgba(124,58,237,0.22)', iconColor: '#4c1d95' },
	                  { k: '2–5d', v: 'Fast delivery', icon: <LocalShippingOutlined fontSize="small" />, tone: 'rgba(14,165,233,0.14)', toneBorder: 'rgba(14,165,233,0.22)', iconColor: '#075985' },
	                  { k: 'COD', v: 'Available', icon: <PaymentsOutlined fontSize="small" />, tone: 'rgba(34,197,94,0.14)', toneBorder: 'rgba(34,197,94,0.22)', iconColor: '#166534' },
	                ].map((s) => (
	                  <Box
	                    key={s.v}
	                    sx={{
	                      display: 'flex',
	                      alignItems: 'center',
	                      gap: 1.1,
	                      px: 1.35,
	                      py: 1.15,
	                      borderRadius: 999,
	                      background: 'linear-gradient(180deg, #FFFFFF 0%, #FBF7F1 100%)',
	                      border: '1px solid rgba(15,23,42,0.10)',
	                      boxShadow: '0 10px 26px rgba(15,23,42,0.06)',
	                    }}
	                  >
	                    <Box
	                      sx={{
	                        width: 34,
	                        height: 34,
	                        borderRadius: 999,
	                        display: 'grid',
	                        placeItems: 'center',
	                        bgcolor: s.tone,
	                        border: `1px solid ${s.toneBorder}`,
	                        color: s.iconColor,
	                        flex: '0 0 auto',
	                      }}
	                    >
	                      {s.icon}
	                    </Box>
	                    <Box sx={{ minWidth: 0, display: 'grid', lineHeight: 1.05 }}>
	                      <Typography sx={{ fontWeight: 950, letterSpacing: -0.3, lineHeight: 1.05 }}>
	                        <Box
	                          component="span"
	                          sx={{
	                            display: 'inline-flex',
	                            alignItems: 'center',
	                            px: 0.85,
	                            py: 0.22,
	                            borderRadius: 999,
	                            bgcolor: 'rgba(248,243,206,0.85)',
	                            border: '1px solid rgba(245,158,11,0.22)',
	                          }}
	                        >
	                          {s.k}
	                        </Box>
	                      </Typography>
	                      <Typography variant="caption" sx={{ color: 'rgba(15,23,42,0.62)', fontWeight: 750 }} noWrap>
	                        {s.v}
	                      </Typography>
	                    </Box>
	                  </Box>
	                ))}
              </Box>
            </Box>
          </Card>

          <Card elevation={0} sx={{ borderRadius: 4, border: '1px solid rgba(0,0,0,0.06)', overflow: 'hidden', background: 'linear-gradient(135deg, rgba(248,243,206,0.75) 0%, rgba(255,255,255,1) 45%, rgba(246,240,230,1) 100%)' }}>
            <Box sx={{ p: { xs: 2.2, md: 3 } }}>
              <Typography sx={{ fontFamily: 'Georgia, Times New Roman, serif', fontSize: { xs: 22, md: 28 }, fontWeight: 700 }}>Newsletter</Typography>
              <Typography color="text.secondary" sx={{ mt: 1 }}>Get offers & restock alerts. No spam.</Typography>
              <Box sx={{ display: 'grid', gap: 1.2, mt: 2 }}>
                <TextField value={email} onChange={(e) => setEmail(e.target.value)} size="small" placeholder="Enter your email" />
                <Button
                  variant="contained"
	              	    onClick={() => {
	              	      setEmail('')
	              	      setSubToastOpen(true)
	              	    }}
                  sx={{ fontWeight: 950, backgroundColor: 'var(--color-buy)', '&:hover': { backgroundColor: 'var(--color-buy-hover)' } }}
                >
                  Subscribe
                </Button>
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.2 }}>
                By subscribing you agree to receive marketing emails.
              </Typography>
            </Box>
          </Card>
	        </Box>

	        {/* Pretty "card" toast for newsletter subscribe (replaces browser alert) */}
	        <Snackbar
	          open={subToastOpen}
	          autoHideDuration={2400}
	          onClose={(_, reason) => {
	            if (reason === 'clickaway') return
	            setSubToastOpen(false)
	          }}
	          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
	          sx={{ mb: { xs: 2.5, sm: 3.5 } }}
	        >
	          <Paper
	            elevation={0}
	            sx={{
	              px: 1.6,
	              py: 1.2,
	              borderRadius: 3,
	              border: '1px solid rgba(0,0,0,0.08)',
	              bgcolor: 'rgba(255,255,255,0.92)',
	              backdropFilter: 'saturate(130%) blur(8px)',
	              boxShadow: '0 18px 45px rgba(0,0,0,0.18)',
	              minWidth: { xs: 'calc(100vw - 40px)', sm: 420 },
	              maxWidth: 520,
	            }}
	          >
	            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
	              <Box
	                sx={{
	                  width: 36,
	                  height: 36,
	                  borderRadius: 2.2,
	                  display: 'grid',
	                  placeItems: 'center',
	                  bgcolor: 'rgba(34,197,94,0.12)',
	                }}
	              >
	                <CheckCircleRounded sx={{ color: '#16a34a' }} />
	              </Box>
	              <Box sx={{ minWidth: 0, flex: 1 }}>
	                <Typography sx={{ fontWeight: 950, lineHeight: 1.1 }}>Subscribed</Typography>
	                <Typography variant="body2" color="text.secondary" noWrap>
	                  You’ll get offers & restock alerts.
	                </Typography>
	              </Box>
	              <IconButton size="small" onClick={() => setSubToastOpen(false)} aria-label="Close">
	                <CloseRounded fontSize="small" />
	              </IconButton>
	            </Box>
	          </Paper>
	        </Snackbar>
	      </Container>

      {/* Footer */}
      <Box component="footer" sx={{ mt: 2, color: '#fff', backgroundColor: '#0b0b0b', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <Container sx={{ py: 4, display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '2fr 1fr 1fr' }, gap: 3, alignItems: 'start' }}>
		           	<Box sx={{ display: 'grid', gap: 1.1 }}>
		            	{/* Brand block (no glass card wrapper; keep content the same) */}
		            	<Box>
	            	  <Box sx={{ display: 'grid', lineHeight: 1.05 }}>
	            	      <Typography sx={{ fontWeight: 950, fontSize: 26, letterSpacing: -0.4, fontFamily: 'Georgia, Times New Roman, serif' }}>
	            	        Khushiyan Store
	            	      </Typography>
	            	      <Typography variant="caption" sx={{ opacity: 0.78, fontWeight: 800, letterSpacing: 0.2 }}>
	            	        Premium essentials • Fast delivery • Easy returns
	            	      </Typography>
	            	    </Box>

	            	  <Typography variant="body2" sx={{ opacity: 0.88, mt: 1.1, maxWidth: 520 }}>
	            	    Thoughtfully curated products with a clean, premium shopping experience.
	            	  </Typography>

	            	  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1.4 }}>
	            	    <Chip icon={<LocalShippingOutlined />} label="2–5 days delivery" size="small" sx={{ bgcolor: 'rgba(255,255,255,0.08)', color: '#fff', '& .MuiChip-icon': { color: 'rgba(255,255,255,0.9)' }, fontWeight: 800 }} />
	            	    <Chip icon={<PaymentsOutlined />} label="COD available" size="small" sx={{ bgcolor: 'rgba(255,255,255,0.08)', color: '#fff', '& .MuiChip-icon': { color: 'rgba(255,255,255,0.9)' }, fontWeight: 800 }} />
	            	    <Chip icon={<VerifiedOutlined />} label="Secure checkout" size="small" sx={{ bgcolor: 'rgba(255,255,255,0.08)', color: '#fff', '& .MuiChip-icon': { color: 'rgba(255,255,255,0.9)' }, fontWeight: 800 }} />
	            	  </Box>
	            	</Box>
	          </Box>
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 900, mb: 1 }}>Quick Links</Typography>
            <Box sx={{ display: 'grid', gap: 0.5 }}>
              <Button onClick={() => navigate('/orders')} color="inherit" sx={{ justifyContent: 'flex-start', p: 0, minWidth: 0, color: 'inherit', textTransform: 'none' }}>Your Orders</Button>
              <Button onClick={() => navigate('/contact')} color="inherit" sx={{ justifyContent: 'flex-start', p: 0, minWidth: 0, color: 'inherit', textTransform: 'none' }}>Contact Us</Button>
              <Button onClick={() => navigate('/privacy')} color="inherit" sx={{ justifyContent: 'flex-start', p: 0, minWidth: 0, color: 'inherit', textTransform: 'none' }}>Privacy Policy</Button>
              <Button onClick={() => navigate('/shipping')} color="inherit" sx={{ justifyContent: 'flex-start', p: 0, minWidth: 0, color: 'inherit', textTransform: 'none' }}>Shipping & Returns</Button>
              <Button onClick={() => navigate('/terms-conditions')} color="inherit" sx={{ justifyContent: 'flex-start', p: 0, minWidth: 0, color: 'inherit', textTransform: 'none' }}>Terms & Conditions</Button>
            </Box>
          </Box>
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 900, mb: 1 }}>Contact</Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>Email: khushiyanstore@gmail.com</Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>Mon–Sat, 10 AM – 6 PM</Typography>
          </Box>
        </Container>
        <Box sx={{ borderTop: '1px solid rgba(255,255,255,0.12)' }}>
          <Container sx={{ py: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
            <Typography variant="caption" sx={{ opacity: 0.8 }}>© {new Date().getFullYear()} Khushiyan Store. All rights reserved.</Typography>
            <Typography variant="caption" sx={{ opacity: 0.8 }}>Made with ❤ in India</Typography>
          </Container>
        </Box>
      </Box>
    </Box>
  )
}

