import { useEffect, useRef, useState, useMemo } from 'react'
import { Container, Box, Card, CardActionArea, CardContent, CardMedia, Typography, Chip, Button, IconButton } from '@mui/material'
import { useRouter } from '../lib/router'
import { ArrowBackIosNew, ArrowForwardIos, LocalShipping, WorkspacePremium, Payments, SupportAgent, WhatsApp, VerifiedUser, Autorenew } from '@mui/icons-material'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { productSlug, useProducts } from '../lib/products'

// Register GSAP plugin once (client only)
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

interface CardItem {
  id: string
  title: string
  price?: number
  compareAt?: number
  image?: string
  comingSoon?: boolean
}

interface Slide {
  type: 'image' | 'youtube' | 'video'
  src: string
  heading: string
  sub?: string
  cta?: string
  link?: string
  bg?: string
  poster?: string
}

const money = (v?: number) => (v == null ? '' : new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v))

function HeroCarousel() {
  const { navigate } = useRouter()
  const { products } = useProducts()
  const [i, setI] = useState(0)

  // Build slides dynamically from products
  const slides: Slide[] = useMemo(() => {
    const withImages = products.filter((p) => Array.isArray(p.images) && p.images.some(Boolean))
    return withImages.map((p, idx) => ({
      type: 'image' as const,
      src: p.images?.[1] || p.images?.[0] || '',
      heading: idx === 0 ? 'Relax. Recharge. Repeat.' : p.title,
      sub: p.title,
      cta: 'Buy Now',
	      link: `/p/${productSlug(p)}`,
    }))
  }, [products])

  useEffect(() => { if (slides.length === 0) return; const t = setInterval(() => setI(p => (p + 1) % slides.length), 4000); return () => clearInterval(t) }, [slides.length])
  const s = slides[i % Math.max(slides.length, 1)] || { type: 'image' as const, src: '', heading: 'Loading...', sub: '', cta: 'Buy Now', link: '/' }
  const go = (n: number) => {
    if (slides.length === 0) return
    setI(p => (p + n + slides.length) % slides.length)
  }
  const bg = s.bg || (s.type === 'image' ? s.src : undefined)
  return (
    <Box sx={{ position: 'relative', height: { xs: 280, sm: 360, md: 440 }, borderRadius: 3, overflow: 'hidden', mb: 3 }}>
      {bg && (<Box sx={{ position: 'absolute', inset: 0, backgroundImage: `url(${bg})`, backgroundSize: 'cover', backgroundPosition: 'center', filter: 'blur(22px)', transform: 'scale(1.15)', opacity: 0.18 }} />)}
      <Box sx={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0.8) 100%)' }} />
      <Box sx={{ position: 'relative', height: '100%', display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1.1fr 0.9fr' }, alignItems: 'center', gap: 2, px: { xs: 2, md: 4 } }}>
        <Box sx={{ display: 'grid', placeItems: 'center' }}>
	          {s.type === 'image' && s.src ? (
	            <img src={s.src} alt={s.heading} style={{ width: '100%', maxWidth: 560, height: '100%', objectFit: 'contain', filter: 'drop-shadow(0 12px 38px rgba(0,0,0,0.25))' }} />
	          ) : (
	            <Box sx={{ width: '100%', maxWidth: 560, height: { xs: 180, sm: 240, md: 320 }, borderRadius: 3, border: '1px solid rgba(0,0,0,0.08)', background: 'linear-gradient(135deg, rgba(251,247,241,1) 0%, rgba(246,240,230,1) 55%, rgba(248,243,206,0.65) 100%)', display: 'grid', placeItems: 'center' }}>
	              <Typography color="text.secondary" sx={{ fontWeight: 800 }}>Products will appear here</Typography>
	            </Box>
	          )}
        </Box>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 900, lineHeight: 1.1, color: '#000', mb: 1 }}>{s.heading}</Typography>
          <Typography variant="h6" sx={{ color: '#111', opacity: 0.85, mb: 2 }}>{s.sub}</Typography>
          <Button className="btn-buy" variant="contained" size="large" onClick={() => s.link && navigate(s.link)} sx={{ borderRadius: 0, py: 1.2, px: 3, fontWeight: 800, backgroundColor: '#111827', '&:hover': { backgroundColor: '#000' } }}>{s.cta ?? 'Buy Now'}</Button>
        </Box>
      </Box>
      {slides.length > 0 ? (
        <>
          <IconButton aria-label="Previous" onClick={() => go(-1)} size="large" sx={{ position: 'absolute', top: '50%', left: 8, transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.8)', '&:hover': { background: '#fff' } }}><ArrowBackIosNew fontSize="small" /></IconButton>
          <IconButton aria-label="Next" onClick={() => go(1)} size="large" sx={{ position: 'absolute', top: '50%', right: 8, transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.8)', '&:hover': { background: '#fff' } }}><ArrowForwardIos fontSize="small" /></IconButton>
        </>
      ) : null}
      <Box sx={{ position: 'absolute', bottom: 10, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 1 }}>
        {slides.map((_, idx) => (<Box key={idx} onClick={() => setI(idx)} sx={{ width: idx === i ? 22 : 10, height: 10, borderRadius: 999, background: idx === i ? '#111827' : 'rgba(0,0,0,0.25)', cursor: 'pointer', transition: 'all .2s' }} />))}
      </Box>
    </Box>
  )
}

function FeatureStrip() {
  const items = [
    { icon: <LocalShipping />, text: 'Free fast delivery' },
    { icon: <WorkspacePremium />, text: '1‑year warranty' },
    { icon: <Payments />, text: 'COD + UPI available' },
    { icon: <SupportAgent />, text: 'Support on WhatsApp' },
  ]
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 1.5, mb: 3 }}>
      {items.map((it, idx) => (
        <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1.2, border: '1px dashed var(--color-border)', borderRadius: 2, background: '#fafafa' }}>
          {it.icon}
          <Typography variant="body2" sx={{ fontWeight: 700 }}>{it.text}</Typography>
        </Box>
      ))}
    </Box>
  )
}

function CategoryStrip() {
  const { products } = useProducts()
  const cats = useMemo(() => {
    const brands = Array.from(new Set(products.map((p) => (p.brand || '').trim()).filter(Boolean)))
    if (brands.length > 0) return brands.slice(0, 8)
    const keywords = Array.from(new Set(products.map((p) => (p.title || '').trim().split(' ')[0]).filter(Boolean)))
    return keywords.slice(0, 8)
  }, [products])
  useEffect(() => {
    if (cats.length === 0) return
    const q = gsap.utils.toArray('.cat-chip') as HTMLElement[]
    gsap.fromTo(q, { y: 8, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.05, duration: 0.28, ease: 'power2.out', scrollTrigger: { trigger: '#cat-strip' } })
  }, [cats.length])

  if (cats.length === 0) return null
  return (
    <Box id="cat-strip" sx={{ display: 'flex', gap: 1, overflowX: 'auto', pb: 1, mb: 2, scrollSnapType: 'x mandatory' }}>
      {cats.map((text, i) => (
        <Box key={i} className="cat-chip" sx={{ flex: '0 0 auto', border: '1px solid var(--color-border)', borderRadius: 999, px: 1.2, py: .6, background: '#fff', scrollSnapAlign: 'start' }}>
          <Typography variant="body2" sx={{ fontWeight: 700 }}>{text}</Typography>
        </Box>
      ))}
    </Box>
  )
}

function DealsCarousel() {
  const scrollerRef = useRef<HTMLDivElement | null>(null)
  const { products } = useProducts()
  const tags = ['Deal of the Day', 'Hot', 'Limited', 'Trending']
  const deals = products.slice(0, 4).map((p, idx) => {
    const off = p.compareAtPrice && p.compareAtPrice > p.price ? Math.round(((p.compareAtPrice - p.price) / p.compareAtPrice) * 100) : 0
    const img = (Array.isArray(p.images) && p.images.length > 0) ? (p.images?.[idx % p.images.length] || p.images?.[0]) : undefined
    return { title: p.title, img, off, tag: tags[idx % tags.length] }
  })
  useEffect(() => {
    const q = gsap.utils.toArray('.deal-card') as HTMLElement[]
    gsap.fromTo(q, { x: 20, opacity: 0 }, { x: 0, opacity: 1, stagger: 0.06, duration: 0.25, ease: 'power2.out', scrollTrigger: { trigger: '#deals-carousel' } })
  }, [])
  const scroll = (dir: number) => { const el = scrollerRef.current; if (!el) return; el.scrollBy({ left: dir * (el.clientWidth * 0.8), behavior: 'smooth' }) }
  return (
    <Box id="deals-carousel" sx={{ position: 'relative', mb: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="h6" sx={{ fontWeight: 900 }}>Deals for you</Typography>
        <Button size="small">View all</Button>
      </Box>
      <Box ref={scrollerRef} sx={{ display: 'flex', gap: 1.5, overflowX: 'auto', scrollSnapType: 'x mandatory', pb: 1 }}>
        {deals.map((d, idx) => (
          <Card key={idx} className="deal-card" sx={{ minWidth: 220, scrollSnapAlign: 'start', border: '1px solid var(--color-border)', borderRadius: 2 }}>
	            {d.img ? (
	              <CardMedia component="img" height="160" image={d.img} alt={d.title} sx={{ objectFit: 'contain', background: '#fff' }} />
	            ) : (
	              <Box sx={{ height: 160, display: 'grid', placeItems: 'center', background: 'linear-gradient(135deg, rgba(251,247,241,1) 0%, rgba(246,240,230,1) 55%, rgba(248,243,206,0.65) 100%)' }}>
	                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800 }}>Image coming soon</Typography>
	              </Box>
	            )}
            <CardContent>
              <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>{d.title}</Typography>
              <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5 }}>
                <Chip label={`${d.off}% Off`} size="small" color="error" />
                <Chip label={d.tag} size="small" color="success" />
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>
      <IconButton onClick={() => scroll(-1)} size="small" sx={{ position: 'absolute', top: '40%', left: -6, background: '#fff' }}><ArrowBackIosNew fontSize="small" /></IconButton>
      <IconButton onClick={() => scroll(1)} size="small" sx={{ position: 'absolute', top: '40%', right: -6, background: '#fff' }}><ArrowForwardIos fontSize="small" /></IconButton>
    </Box>
  )
}

function BenefitBar2() {
  const items = [
    { icon: <VerifiedUser />, text: 'Secure payments' },
    { icon: <Autorenew />, text: '7‑day returns' },
  ]
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: '1fr 1fr' }, gap: 1.5, my: 3 }}>
      {items.map((it, idx) => (
        <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1.2, border: '1px dashed var(--color-border)', borderRadius: 2, background: '#fafafa' }}>
          {it.icon}
          <Typography variant="body2" sx={{ fontWeight: 700 }}>{it.text}</Typography>
        </Box>
      ))}
    </Box>
  )
}

function FooterWhatsAppCTA() {
  return (
    <Box sx={{ my: 4, p: 2.5, border: '1px solid var(--color-border)', borderRadius: 3, background: 'linear-gradient(90deg,#10B98111,#10B98122)' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <WhatsApp color="success" />
          <Typography variant="h6" sx={{ fontWeight: 900 }}>Join WhatsApp for exclusive deals</Typography>
        </Box>
        <Button variant="contained" color="success" href="#" sx={{ fontWeight: 800 }}>Join Now</Button>
      </Box>
    </Box>
  )
}

function HighlightCard() {
  const { navigate } = useRouter()
  const { products } = useProducts()
  const featured = products[0]
  if (!featured) return null
  const slug = productSlug(featured)
  return (
    <Card sx={{ mb: 3, borderRadius: 3, overflow: 'hidden', border: '1px solid var(--color-border)' }}>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1.1fr 0.9fr' }, alignItems: 'center' }}>
        <Box sx={{ p: { xs: 2, md: 3 }, display: 'grid', placeItems: 'center' }}>
          <img src={featured.images?.[0] || ''} alt={featured.title} style={{ width: '100%', maxWidth: 560, objectFit: 'contain' }} />
        </Box>
        <Box sx={{ p: { xs: 2, md: 3 } }}>
          <Typography variant="overline" sx={{ letterSpacing: 1.5 }}>Trending</Typography>
          <Typography variant="h4" sx={{ fontWeight: 900, mb: 1 }}>{featured.title}</Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>{featured.bullets?.[0] || 'Check out this product'}</Typography>
          <Button variant="contained" onClick={() => navigate(`/p/${slug}`)} sx={{ fontWeight: 800 }}>Buy Now</Button>
        </Box>
      </Box>
    </Card>
  )
}

export default function LandingPage() {
  const { navigate } = useRouter()
  const { productsBySlug } = useProducts()

  // Build card items dynamically from products
  const items: CardItem[] = useMemo(() =>
    Object.entries(productsBySlug).map(([slug, p]) => ({
      id: slug, title: p.title, price: p.price, compareAt: p.compareAtPrice,
      image: p.images?.[0],
    })), [productsBySlug])

  return (
    <Container sx={{ py: 3 }}>
      <HeroCarousel />
      <FeatureStrip />
      <HighlightCard />
      <CategoryStrip />
      <DealsCarousel />
      <BenefitBar2 />
      <Box sx={{ mt: 1, mb: 2, textAlign: 'center' }}>
        <Typography variant="h5" sx={{ fontWeight: 900 }}>Top Picks</Typography>
        <Typography variant="body2" color="text.secondary">Curated for relaxation and wellness.</Typography>
      </Box>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' }, gap: 2.5 }}>
        {items.map((it) => {
          const onClick = () => navigate(`/p/${it.id}`)
          return (
            <Box key={it.id}>
              <Card elevation={0} sx={{ border: '1px solid var(--color-border)', borderRadius: 3, overflow: 'hidden', transition: 'transform .18s ease, box-shadow .18s ease', '&:hover': { transform: 'translateY(-3px)', boxShadow: '0 12px 34px rgba(0,0,0,0.08)' } }}>
                <CardActionArea onClick={onClick}>
                  {it.image ? (
                    <CardMedia component="img" height="260" image={it.image} alt={it.title} sx={{ objectFit: 'contain', background: '#fff' }} />
                  ) : (
                    <Box sx={{ height: 260, background: '#F3F4F6', display: 'grid', placeItems: 'center' }}>
                      <Typography color="text.disabled">Image coming soon</Typography>
                    </Box>
                  )}
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>{it.title}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                      <Typography variant="h6" sx={{ fontWeight: 900 }}>{money(it.price)}</Typography>
                      {it.compareAt && (<Typography variant="body2" color="text.secondary" sx={{ textDecoration: 'line-through' }}>{money(it.compareAt)}</Typography>)}
                    </Box>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Box>
          )
        })}
      </Box>
      <FooterWhatsAppCTA />
    </Container>
  )
}

