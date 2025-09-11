import { useEffect, useRef, useState } from 'react'
import { Container, Box, Card, CardActionArea, CardContent, CardMedia, Typography, Chip, Button, IconButton } from '@mui/material'
import { useRouter } from '../lib/router'
import { ArrowBackIosNew, ArrowForwardIos, LocalShipping, WorkspacePremium, Payments, SupportAgent, WhatsApp, VerifiedUser, Autorenew } from '@mui/icons-material'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

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

const slides: Slide[] = [
  { type: 'image', src: '/products/head-massager/1.jpg', heading: 'Relax. Recharge. Repeat.', sub: 'Electric Head & Body Massager', cta: 'Buy Now', link: '/p/head-massager' },
  { type: 'image', src: '/products/posture-corrector/1.jpg', heading: 'Sit Right. Stand Tall.', sub: 'Posture Corrector Back Brace', cta: 'Buy Now', link: '/p/posture-corrector' },
  { type: 'image', src: '/products/head-massager/3.jpg', heading: 'Cordless & Rechargeable', sub: 'Use anywhere, anytime', cta: 'Buy Now', link: '/p/head-massager' },
]

const items: CardItem[] = [
  { id: 'head-massager', title: 'Electric Head & Body Massager', price: 999, compareAt: 1899, image: '/products/head-massager/1.jpg' },
  { id: 'posture-corrector', title: 'Posture Corrector Back Brace', price: 699, compareAt: 1499, image: '/products/posture-corrector/p1.jpg' },
  { id: 'foot-massager', title: 'Electric Foot Massager Mat', price: 999, compareAt: 1799, image: '/products/foot-massager/fm1.jpg' },
  { id: 'kitchen-weighing-scale', title: 'Kitchen Weighing Scale', price: 1, compareAt: 1199, image: '/products/kitchen-weighing-scale/ws1.jpg' },
  { id: 'p4', title: 'Product 4', comingSoon: true },
  { id: 'p5', title: 'Product 5', comingSoon: true },
  { id: 'p6', title: 'Product 6', comingSoon: true },
]

const money = (v?: number) => (v == null ? '' : new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v))

function HeroCarousel() {
  const { navigate } = useRouter()
  const [i, setI] = useState(0)
  useEffect(() => { const t = setInterval(() => setI(p => (p + 1) % slides.length), 4000); return () => clearInterval(t) }, [])
  const s = slides[i]
  const go = (n: number) => setI(p => (p + n + slides.length) % slides.length)
  const bg = s.bg || (s.type === 'image' ? s.src : undefined)
  return (
    <Box sx={{ position: 'relative', height: { xs: 280, sm: 360, md: 440 }, borderRadius: 3, overflow: 'hidden', mb: 3 }}>
      {bg && (<Box sx={{ position: 'absolute', inset: 0, backgroundImage: `url(${bg})`, backgroundSize: 'cover', backgroundPosition: 'center', filter: 'blur(22px)', transform: 'scale(1.15)', opacity: 0.18 }} />)}
      <Box sx={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0.8) 100%)' }} />
      <Box sx={{ position: 'relative', height: '100%', display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1.1fr 0.9fr' }, alignItems: 'center', gap: 2, px: { xs: 2, md: 4 } }}>
        <Box sx={{ display: 'grid', placeItems: 'center' }}>
          {s.type === 'image' && (<img src={s.src} alt={s.heading} style={{ width: '100%', maxWidth: 560, height: '100%', objectFit: 'contain', filter: 'drop-shadow(0 12px 38px rgba(0,0,0,0.25))' }} />)}
          {s.type === 'youtube' && (
            <div style={{ position: 'relative', width: '100%' }}>
              <div style={{ position: 'relative', paddingTop: '56.25%' }}>
                <iframe src={s.src.replace('watch?v=', 'embed/').replace('youtu.be/', 'www.youtube.com/embed/') + '?autoplay=1&mute=1&playsinline=1&rel=0'} title="Hero video" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0, borderRadius: 12 }} />
              </div>
            </div>
          )}
          {s.type === 'video' && (
            <video autoPlay muted loop playsInline poster={s.poster} style={{ width: '100%', maxWidth: 560, borderRadius: 12, boxShadow: '0 12px 38px rgba(0,0,0,0.16)' }}>
              <source src={s.src} />
            </video>
          )}
        </Box>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 900, lineHeight: 1.1, color: '#000', mb: 1 }}>{s.heading}</Typography>
          <Typography variant="h6" sx={{ color: '#111', opacity: 0.85, mb: 2 }}>{s.sub}</Typography>
          <Button className="btn-buy" variant="contained" size="large" onClick={() => s.link && navigate(s.link)} sx={{ borderRadius: 0, py: 1.2, px: 3, fontWeight: 800, backgroundColor: '#111827', '&:hover': { backgroundColor: '#000' } }}>{s.cta ?? 'Buy Now'}</Button>
        </Box>
      </Box>
      <IconButton aria-label="Previous" onClick={() => go(-1)} size="large" sx={{ position: 'absolute', top: '50%', left: 8, transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.8)', '&:hover': { background: '#fff' } }}><ArrowBackIosNew fontSize="small" /></IconButton>
      <IconButton aria-label="Next" onClick={() => go(1)} size="large" sx={{ position: 'absolute', top: '50%', right: 8, transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.8)', '&:hover': { background: '#fff' } }}><ArrowForwardIos fontSize="small" /></IconButton>
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
  const cats = ['Home', 'Fitness', 'Wellness', 'Gadgets', 'Lifestyle', 'Massage', 'Accessories']
  useEffect(() => {
    const q = gsap.utils.toArray('.cat-chip') as HTMLElement[]
    gsap.fromTo(q, { y: 8, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.05, duration: 0.28, ease: 'power2.out', scrollTrigger: { trigger: '#cat-strip' } })
  }, [])
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
  const deals = [
    { title: 'Head & Body Massager', img: '/products/head-massager/1.jpg', off: 40, tag: 'Deal of the Day' },
    { title: 'Head & Body Massager', img: '/products/head-massager/2.jpg', off: 35, tag: 'Hot' },
    { title: 'Head & Body Massager', img: '/products/head-massager/3.jpg', off: 30, tag: 'Limited' },
    { title: 'Head & Body Massager', img: '/products/head-massager/1.jpg', off: 25, tag: 'Trending' },
  ]
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
            <CardMedia component="img" height="160" image={d.img} alt={d.title} sx={{ objectFit: 'contain', background: '#fff' }} />
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
  return (
    <Card sx={{ mb: 3, borderRadius: 3, overflow: 'hidden', border: '1px solid var(--color-border)' }}>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1.1fr 0.9fr' }, alignItems: 'center' }}>
        <Box sx={{ p: { xs: 2, md: 3 }, display: 'grid', placeItems: 'center' }}>
          <img src="/products/head-massager/1.jpg" alt="Electric Head & Body Massager" style={{ width: '100%', maxWidth: 560, objectFit: 'contain' }} />
        </Box>
        <Box sx={{ p: { xs: 2, md: 3 } }}>
          <Typography variant="overline" sx={{ letterSpacing: 1.5 }}>Trending</Typography>
          <Typography variant="h4" sx={{ fontWeight: 900, mb: 1 }}>Electric Head & Body Massager</Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>Relax muscles, improve blood flow, and melt stress at home.</Typography>
          <Button variant="contained" onClick={() => navigate('/p/head-massager')} sx={{ fontWeight: 800 }}>Buy Now</Button>
        </Box>
      </Box>
    </Card>
  )
}

export default function LandingPage() {
  const { navigate } = useRouter()
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
          const clickable = !it.comingSoon && (it.id === 'head-massager' || it.id === 'posture-corrector' || it.id === 'foot-massager' || it.id === 'kitchen-weighing-scale')
          const onClick = () => clickable && navigate(`/p/${it.id}`)
          return (
            <Box key={it.id}>
              <Card elevation={0} sx={{ border: '1px solid var(--color-border)', borderRadius: 3, overflow: 'hidden', transition: 'transform .18s ease, box-shadow .18s ease', '&:hover': { transform: 'translateY(-3px)', boxShadow: '0 12px 34px rgba(0,0,0,0.08)' } }}>
                <CardActionArea onClick={onClick} disabled={!clickable}>
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
                      {it.comingSoon && <Chip label="Coming soon" size="small" color="default" />}
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                      <Typography variant="h6" sx={{ fontWeight: 900 }}>{money(it.price)}</Typography>
                      {it.compareAt && (<Typography variant="body2" color="text.secondary" sx={{ textDecoration: 'line-through' }}>{money(it.compareAt)}</Typography>)}
                    </Box>
                    {!clickable && (<Typography variant="caption" color="text.secondary">Tap disabled — content to be added</Typography>)}
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

