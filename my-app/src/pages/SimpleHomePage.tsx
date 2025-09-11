import { useEffect, useRef, useState } from 'react'
import { Box, Button, Card, CardActionArea, CardContent, CardMedia, Container, Typography } from '@mui/material'
import { useRouter } from '../lib/router'
import { gsap } from '../lib/gsap'
import { productsBySlug } from '../data'

// Minimal, clean home page
// - Big type hero, lots of white space
// - One featured product, rest placeholders
// - Subtle fade/slide animations only

const product = {
  id: 'head-massager',
  title: 'Electric Head & Body Massager',
  price: 999,
  compareAt: 1899,
  image: '/products/head-massager/1.jpg',
  slug: '/p/head-massager',
}

// Slides for the hero (auto-rotate)
const heroSlides = Object.entries(productsBySlug)
  .map(([slug, p]) => ({
    id: slug,
    title: p.title,
    price: p.price,
    compareAt: p.compareAtPrice,
    image: p.images?.[1] || p.images?.[0],
    slug: '/p/' + slug,
  }))


const placeholders = Object.entries(productsBySlug)
  .filter(([slug]) => slug !== 'head-massager')
  .map(([slug, p]) => ({
    id: slug,
    title: p.title,
    image: p.images?.[0],
    price: p.price,
    compareAt: p.compareAtPrice,
    slug: '/p/' + slug,
  }))

const money = (v?: number) => (v == null ? '' : new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v))

export default function SimpleHomePage() {
  const { navigate } = useRouter()
  const rootRef = useRef<HTMLDivElement | null>(null)
  const [slideIdx, setSlideIdx] = useState(0)

  // Subtle reveals
  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const q = gsap.utils.selector(root)
    const ctx = gsap.context(() => {
      gsap.from(q('.fade-up'), { y: 16, opacity: 0, duration: 0.35, ease: 'power2.out', stagger: 0.06, scrollTrigger: { trigger: root, start: 'top 80%' } })
      gsap.from(q('.card'), { y: 12, opacity: 0, duration: 0.28, ease: 'power2.out', stagger: 0.05, scrollTrigger: { trigger: '.product-grid', start: 'top 85%' } })
    }, root)
    return () => ctx.revert()
  }, [])

  // Auto-rotate hero every 4s
  useEffect(() => {
    const id = setInterval(() => setSlideIdx(i => (i + 1) % heroSlides.length), 4000)
    return () => clearInterval(id)
  }, [])

  // Fade-in animation when slide changes
  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const q = gsap.utils.selector(root)
    const tl = gsap.timeline()
    tl.fromTo(q('.hero-visual'), { opacity: 0 }, { opacity: 1, duration: 0.4, ease: 'power2.out' })
      .fromTo(q('.hero-text'), { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out' }, '<')
  }, [slideIdx])

  const curr = heroSlides[slideIdx]

  return (
    <Container sx={{ py: { xs: 3, md: 6 } }} ref={rootRef}>
      {/* Hero */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1.1fr 0.9fr' }, alignItems: 'center', gap: { xs: 2, md: 4 }, mb: { xs: 4, md: 6 } }}>
        <Box className="fade-up hero-text" sx={{ pr: { md: 4 } }}>
          <Typography variant="h3" sx={{ fontWeight: 900, lineHeight: 1.05, mb: 1 }}>Feel Better. Live Lighter.</Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>Curated wellness tools that just work. No clutter, no noise — only quality.</Typography>
          <Button variant="contained" size="large" onClick={() => navigate(curr.slug)} sx={{ fontWeight: 800, backgroundColor: 'var(--color-buy)', border: '1px solid #ff2f60', '&:hover': { backgroundColor: 'var(--color-buy-hover)' } }}>Explore {curr.title}</Button>

        </Box>
        <Box className="fade-up hero-visual" sx={{ display: 'grid', placeItems: 'center' }}>
          <Box component="img" src={curr.image} alt={curr.title} sx={{ maxWidth: 560, width: '100%', objectFit: 'contain', borderRadius: 2, boxShadow: '0 8px 24px rgba(0,0,0,0.06)' }} />
        </Box>
      </Box>

      {/* Benefits: pill style like the screenshot */}
      <Box className="fade-up" sx={{ my: 3 }}>
        <Box className="benefits-grid" sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 2 }}>
          {['Free fast delivery', 'Easy returns', 'Cash on delivery', 'SSL secure'].map((text, i) => (
            <Card key={i} className="benefit-pill" elevation={0}>
              <Typography sx={{ fontWeight: 800, textAlign: 'center' }}>{text}</Typography>
            </Card>
          ))}
        </Box>
      </Box>



      {/* Grid */}
      <Box className="product-grid" sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' }, gap: 2 }}>
        {/* Real product */}
        <Card className="card" elevation={0} sx={{ border: '1px solid var(--color-border)', borderRadius: 2 }}>
          <CardActionArea onClick={() => navigate(product.slug)}>
            <CardMedia component="img" height="240" image={product.image} alt={product.title} sx={{ objectFit: 'contain', background: '#fff' }} />
            <CardContent>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: .5 }}>{product.title}</Typography>
              <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 900 }}>{money(product.price)}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ textDecoration: 'line-through' }}>{money(product.compareAt)}</Typography>
              </Box>
            </CardContent>
          </CardActionArea>
        </Card>

        {/* Additional products */}
        {placeholders.map(p => (
          p.title ? (
            <Card key={p.id} className="card" elevation={0} sx={{ border: '1px solid var(--color-border)', borderRadius: 2 }}>
              <CardActionArea onClick={() => p.slug && navigate(p.slug)}>
                <CardMedia component="img" height="240" image={p.image} alt={p.title} sx={{ objectFit: 'contain', background: '#fff' }} />
                <CardContent>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: .5 }}>{p.title}</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 900 }}>{money(p.price)}</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ textDecoration: 'line-through' }}>{money(p.compareAt)}</Typography>
                  </Box>
                </CardContent>
              </CardActionArea>
            </Card>
          ) : (
            <Card key={p.id} className="card" elevation={0} sx={{ border: '1px dashed var(--color-border)', background: '#fafafa' }}>
              <CardContent sx={{ height: 240, display: 'grid', placeItems: 'center', textAlign: 'center' }}>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: .5 }}>Coming soon</Typography>
                  <Typography variant="body2" color="text.secondary">New product cards will appear here</Typography>
                </Box>
              </CardContent>
            </Card>
          )
        ))}
      </Box>

      {/* Footer note */}
      <Box className="fade-up" sx={{ mt: 5, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">Need help choosing? Ping us on WhatsApp.</Typography>
      </Box>
    </Container>
  )
}

