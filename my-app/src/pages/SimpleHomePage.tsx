import { useEffect, useMemo, useRef, useState } from 'react'
import { Box, Button, Card, CardActionArea, CardContent, Chip, Container, IconButton, Paper, Snackbar, TextField, Typography } from '@mui/material'
import CheckCircleRounded from '@mui/icons-material/CheckCircleRounded'
import CloseRounded from '@mui/icons-material/CloseRounded'
import GroupsRounded from '@mui/icons-material/GroupsRounded'
import LocalShippingOutlined from '@mui/icons-material/LocalShippingOutlined'
import PaymentsOutlined from '@mui/icons-material/PaymentsOutlined'
import StarRounded from '@mui/icons-material/StarRounded'
import VerifiedOutlined from '@mui/icons-material/VerifiedOutlined'
import { useRouter } from '../lib/router'
import { gsap } from '../lib/gsap'
import { productSlug, useProducts } from '../lib/products'

const money = (v?: number) => (v == null ? '' : new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v))

export default function SimpleHomePage() {
  const { navigate } = useRouter()
  const { products, productsBySlug } = useProducts()
  const rootRef = useRef<HTMLDivElement | null>(null)
  const [slideIdx, setSlideIdx] = useState(0)
  const [email, setEmail] = useState('')
  const [subToastOpen, setSubToastOpen] = useState(false)

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
      return { id: slug, title: p.title, image: p.images?.[0], price: p.price, compareAt: p.compareAtPrice, slug: '/p/' + slug }
    })
  }, [products, productsBySlug])

  const popular = useMemo(() => featured.slice(0, 6), [featured])

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

    const tones = ['#F4EEE6', '#F6F1E9', '#F2ECE2', '#F5EFE6', '#F3EDE4']
    const spans = [
      { md: 'span 7', row: 'span 2' },
      { md: 'span 5', row: 'span 1' },
      { md: 'span 5', row: 'span 1' },
      { md: 'span 6', row: 'span 1' },
      { md: 'span 6', row: 'span 1' },
    ]

    return picks.map((p, i) => {
      const slug = productSlug(p)
      return {
        key: slug,
        title: p.title,
        subtitle: p.bullets?.[0] || p.brand || 'Explore now',
        image: p.images?.[0],
        href: '/p/' + slug,
        tone: tones[i % tones.length],
        span: spans[i % spans.length],
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
                <Chip label="Cash on delivery" size="small" variant="outlined" sx={{ bgcolor: 'rgba(255,255,255,0.7)' }} />
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
                  Shop {curr.title}
                </Button>
                <Button variant="text" onClick={() => navigate('/contact')} sx={{ fontWeight: 800, color: '#2b2b2b' }}>Need help?</Button>
              </Box>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)' }, gap: 1.2, mt: 1.2 }}>
                {['Free fast delivery', 'Easy returns', 'COD available', 'SSL secure'].map((t) => (
                  <Box key={t} sx={{ border: '1px solid rgba(0,0,0,0.06)', borderRadius: 3, px: 1.2, py: 1, bgcolor: 'rgba(255,255,255,0.75)' }}>
                    <Typography sx={{ fontWeight: 850, fontSize: 13 }}>{t}</Typography>
                  </Box>
                ))}
              </Box>
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
          <Box sx={{ display: 'flex', alignItems: 'end', justifyContent: 'space-between', gap: 2, mb: 1.5 }}>
            <Box>
              <Typography sx={{ fontFamily: 'Georgia, Times New Roman, serif', fontSize: { xs: 22, md: 28 }, fontWeight: 700 }}>Featured</Typography>
              <Typography variant="body2" color="text.secondary">Handpicked bestsellers (scroll)</Typography>
            </Box>
            <Button variant="text" onClick={() => navigate('/')} sx={{ fontWeight: 800, color: '#2b2b2b' }}>View all</Button>
          </Box>
          <Box sx={{ display: 'flex', gap: 2, overflowX: 'auto', pb: 1, scrollSnapType: 'x mandatory' }}>
            {featured.map((p) => (
              <Card key={p.id} elevation={0} sx={{ minWidth: 240, scrollSnapAlign: 'start', borderRadius: 4, border: '1px solid rgba(0,0,0,0.06)', overflow: 'hidden', bgcolor: '#fff' }}>
                <CardActionArea onClick={() => navigate(p.slug)}>
                  <Box sx={{ height: 180, bgcolor: '#fff', display: 'grid', placeItems: 'center' }}>
				      <Media src={p.image} alt={p.title} />
                  </Box>
                  <CardContent sx={{ p: 1.5 }}>
                    <Typography sx={{ fontWeight: 900, fontSize: 14, mb: 0.5 }} noWrap>{p.title}</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                      <Typography sx={{ fontWeight: 950 }}>{money(p.price)}</Typography>
                      {p.compareAt ? <Typography variant="caption" sx={{ color: 'text.secondary', textDecoration: 'line-through' }}>{money(p.compareAt)}</Typography> : null}
                    </Box>
                  </CardContent>
                </CardActionArea>
              </Card>
            ))}
          </Box>
        </Box>

        {/* Bento (dynamic products) */}
        <Box data-anim="fade" sx={{ mb: { xs: 3, md: 5 } }}>
          <Typography sx={{ fontFamily: 'Georgia, Times New Roman, serif', fontSize: { xs: 22, md: 28 }, fontWeight: 700, mb: 1.5 }}>Explore</Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(12, 1fr)' }, gridAutoRows: { md: 150 }, gap: 2 }}>
            {bentoItems.map((c) => (
              <Card key={c.key} elevation={0} sx={{ gridColumn: { md: c.span.md }, gridRow: { md: c.span.row }, borderRadius: 4, border: '1px solid rgba(0,0,0,0.06)', overflow: 'hidden', bgcolor: c.tone }}>
                <CardActionArea onClick={() => navigate(c.href)} sx={{ height: '100%' }}>
                  <Box sx={{ height: '100%', display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1.1fr 0.9fr' }, alignItems: 'center', gap: 2, p: { xs: 2, md: 2.5 } }}>
                    <Box>
                      <Typography sx={{ fontFamily: 'Georgia, Times New Roman, serif', fontSize: { xs: 20, md: 26 }, fontWeight: 700, lineHeight: 1.05 }}>{c.title}</Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.6 }}>{c.subtitle}</Typography>
                      <Button variant="text" sx={{ px: 0, mt: 1, fontWeight: 900, color: '#2b2b2b' }}>Shop now</Button>
                    </Box>
                    <Box sx={{ height: { xs: 180, md: '100%' }, display: 'grid', placeItems: 'center', bgcolor: 'rgba(255,255,255,0.65)', borderRadius: 3, border: '1px solid rgba(0,0,0,0.05)' }}>
				      <Media src={c.image} alt={c.title} />
                    </Box>
                  </Box>
                </CardActionArea>
              </Card>
            ))}
          </Box>
        </Box>

        {/* Most Popular */}
        <Box data-anim="fade" sx={{ mb: { xs: 3, md: 5 } }}>
          <Box sx={{ display: 'flex', alignItems: 'end', justifyContent: 'space-between', gap: 2, mb: 1.5 }}>
            <Box>
              <Typography sx={{ fontFamily: 'Georgia, Times New Roman, serif', fontSize: { xs: 22, md: 28 }, fontWeight: 700 }}>Most Popular</Typography>
              <Typography variant="body2" color="text.secondary">These get reordered again and again</Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(3, 1fr)' }, gap: 2 }}>
            {popular.map((p) => (
              <Card key={p.id} elevation={0} sx={{ borderRadius: 4, border: '1px solid rgba(0,0,0,0.06)', overflow: 'hidden', bgcolor: '#fff' }}>
                <CardActionArea onClick={() => navigate(p.slug)}>
                  <Box sx={{ height: 260, display: 'grid', placeItems: 'center', bgcolor: '#fff' }}>
				      <Media src={p.image} alt={p.title} />
                  </Box>
                  <CardContent sx={{ p: 2 }}>
                    <Typography sx={{ fontWeight: 950, mb: 0.4 }}>{p.title}</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                      <Typography sx={{ fontWeight: 950 }}>{money(p.price)}</Typography>
                      {p.compareAt ? <Typography variant="caption" sx={{ color: 'text.secondary', textDecoration: 'line-through' }}>{money(p.compareAt)}</Typography> : null}
                    </Box>
                  </CardContent>
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

