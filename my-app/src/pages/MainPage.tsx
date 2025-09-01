import { useEffect, useMemo, useState, useLayoutEffect, useRef } from 'react'
import { gsap, canAnimate } from '../lib/gsap'
import { productsBySlug, product as localProduct, reviewsBySlug, liveNames, liveCities } from '../data'
import { events } from '../analytics'
import type { Product } from '../types'
import MediaGallery from '../components/MediaGallery'
import FeatureList from '../components/FeatureList'
import ReviewGrid from '../components/ReviewGrid'

import { useCart } from '../lib/cart'
import { useRouter } from '../lib/router'
import { useToast } from '../lib/toast'

// MUI
import Container from '@mui/material/Container'
import Paper from '@mui/material/Paper'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'

import { Suspense, lazy } from 'react'
const LiveSalesToast = lazy(() => import('../components/LiveSalesToast'))

import { AddShoppingCart, ShoppingCartCheckout, FlashOn, Star, StarHalf, NotificationsNone, LocalOffer, Payments, CheckCircle } from '@mui/icons-material'

const formatINR = (amount: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount)
const pctOff = (price: number, original?: number) => !original || original <= price ? null : Math.round(((original - price) / original) * 100)

export default function MainPage() {
  const [p, setP] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [error] = useState<string | null>(null)

  useEffect(() => {
    // Pick by slug from the URL: /p/:slug; default to mini-butterfly-massager for single-product site
    const slug = (window.location.pathname.split('/').filter(Boolean)[1]) || 'mini-butterfly-massager'
    const chosen = productsBySlug[slug] ?? localProduct
    setP(chosen)
    setLoading(false)
  }, [])

  const out = p?.inventoryStatus === 'OUT_OF_STOCK'

  // SEO title and description
  useEffect(() => {
    if (!p) return
    document.title = `${p.title} — ${p.bullets[0]} | ${p.brand ?? 'Brand'}`
    const baseDesc = p.description || [p.descriptionHeading, ...(p.descriptionPoints ?? [])].filter(Boolean).join(' • ') || `${p.bullets.slice(0, 3).join(' • ')}`
    const desc = `${baseDesc}`.slice(0, 160)
    let meta = document.querySelector('meta[name="description"]') as HTMLMetaElement | null
    if (!meta) { meta = document.createElement('meta'); meta.name = 'description'; document.head.appendChild(meta) }
    meta!.content = desc
  }, [p])

  // JSON-LD
  const jsonLd: any = useMemo(() => {
    if (!p) return {}
    const slug = (window.location.pathname.split('/').filter(Boolean)[1]) || 'mini-butterfly-massager'
    const rev = reviewsBySlug[slug]
    return {
      '@context': 'https://schema.org', '@type': 'Product', name: p.title, sku: p.sku,
      brand: p.brand ? { '@type': 'Brand', name: p.brand } : undefined,
      image: p.images,
      aggregateRating: { '@type': 'AggregateRating', ratingValue: rev.ratingAvg.toFixed(1), reviewCount: rev.ratingCount },
      offers: {
        '@type': 'Offer', priceCurrency: 'INR', price: p.price,
        availability: out ? 'https://schema.org/OutOfStock' : 'https://schema.org/InStock',
        url: typeof window !== 'undefined' ? window.location.href : undefined,
      },
    }
  }, [p, out])

  useEffect(() => {
    if (!p) return
    events.view_item({ id: p.id, title: p.title, price: p.price })
  }, [p])

  const pct = p ? pctOff(p.price, p.compareAtPrice ?? undefined) : null


	  // Live sales toast state (6s visible, then hidden for 5s, repeat)
	  const [showToast, setShowToast] = useState(false)
	  const [currentName, setCurrentName] = useState('')
	  const [currentCity, setCurrentCity] = useState('')
	  const [timeAgo, setTimeAgo] = useState('a few seconds ago')
	  const cycleRef = useRef<number | null>(null)
	  useEffect(() => {
	    const pick = () => {
	      const n = liveNames[Math.floor(Math.random() * liveNames.length)]
	      const c = liveCities[Math.floor(Math.random() * liveCities.length)]
	      setCurrentName(n)
	      setCurrentCity(c)
	      const mins = Math.floor(Math.random() * 59) + 1
	      setTimeAgo(`${mins} minutes ago`)
	    }
	    pick()
	    setShowToast(true)
	    let visible = true
	    cycleRef.current = window.setInterval(() => {
	      visible = !visible
	      if (visible) pick()
	      setShowToast(visible)
	    }, visible ? 6000 : 5000)
	    // The above interval delay won't change dynamically; use two alternating timeouts instead

			// Override with 5s show / 15s gap cycle
			if (cycleRef.current) window.clearInterval(cycleRef.current)
			const __clearToastTimer = () => { if (cycleRef.current) window.clearTimeout(cycleRef.current) }
			const __showThenHide = () => {
			  pick()
			  setShowToast(true)
			  __clearToastTimer()
			  cycleRef.current = window.setTimeout(() => {
			    setShowToast(false)
			    cycleRef.current = window.setTimeout(__showThenHide, 15000)
			  }, 5000)
			}
			__showThenHide()

	    return () => { if (cycleRef.current) window.clearInterval(cycleRef.current) }
	  }, [])



  // GSAP animations (place hooks before any early returns to keep order stable)
  const heroRef = useRef<HTMLDivElement>(null)
  const pageRef = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    if (!canAnimate() || !heroRef.current) return

    // Hero-only animations scoped to heroRef; target the element directly
    const ctx = gsap.context(() => {
      gsap.from(heroRef.current!, { y: 26, opacity: 0, duration: 0.6, ease: 'power2.out' })
      gsap.from('.hero-stagger', { y: 12, opacity: 0, duration: 0.5, stagger: 0.08, delay: 0.15, ease: 'power2.out' })
      gsap.to('.btn-buy', { scale: 1.03, yoyo: true, repeat: -1, duration: 0.7, ease: 'sine.inOut', repeatDelay: 3 })
    }, heroRef)

    // Page-wide reveal animations disabled to avoid initial hidden content on load
    return () => { ctx.revert() }
  }, [p])


  // Cart + navigation + toast hooks (must be before any early returns)
  const { add, count } = useCart()
  const { navigate } = useRouter()
  const { push } = useToast()
  const hasItems = count > 0

  // Guarded UI returns after hooks to keep hook order stable
  // While loading, we rely on global Pink Loader overlay; render nothing to avoid plain text.
  if (loading) return null
  if (error) return <Container sx={{ py: 3, color: 'crimson' }}>Error: {error}</Container>
  if (!p) return <Container sx={{ py: 3 }}>No product found</Container>

  function handleAddToCart(product: Product) {
    if (count > 0) {
      // If there is already at least one item, take user to checkout
      return navigate('/checkout')
    }
    add({ product, quantity: 1 })
    push('Added to cart')
    if (canAnimate()) {
      const el = document.createElement('div')
      el.className = 'cart-fly'
      el.innerHTML = '<i class="fa-solid fa-cart-shopping"></i>'
      Object.assign(el.style, { position: 'fixed', left: '50%', top: '50%', transform: 'translate(-50%,-50%) scale(0.6)', fontSize: '56px', color: '#111827', background: '#fff', borderRadius: '50%', width: '96px', height: '96px', display: 'grid', placeItems: 'center', boxShadow: '0 8px 30px rgba(0,0,0,0.15)', zIndex: '10000' })
      document.body.appendChild(el)
      gsap.to(el, { scale: 1.1, duration: 0.22, ease: 'power2.out', onComplete: () => {
        gsap.to(el, { y: -120, scale: 0.8, duration: 0.35, ease: 'back.in(1.4)', onComplete: () => {
          gsap.to(el, { x: window.innerWidth/2 - 40, y: -window.innerHeight/2 + 40, scale: 0.3, opacity: 0.0, duration: 0.5, ease: 'power2.in', onComplete: () => el.remove() })
        }})
      }})
    }
    // Do not navigate anywhere after add (per requirement)
  }

  function handleBuyNow(product: Product) {
    add({ product, quantity: 1 })
    events.cta_click({ id: product.id, step: 'begin_checkout' })
    navigate('/checkout')
  }


  return (
    <div ref={pageRef}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />


	      {/* Page surface wrapper for white center with grey gutters */}
	      <div className="container">
	        <div className="page-surface">

          {/* Live sales popup */}
          <Suspense fallback={null}>
            <LiveSalesToast
              open={showToast}
              name={currentName}
              city={currentCity}
              title={p.title}
              image={p.images[0]}
              timeAgo={timeAgo}
              onClose={() => setShowToast(false)}
            />
          </Suspense>

      {/* Product + Details grid (Myntra-style layout) */}
      <Container sx={{ py: 3 }}>
        <Box className="product-grid" sx={{ display: 'grid', gap: 4, gridTemplateColumns: { xs: '1fr', md: '1.1fr 0.9fr' }, alignItems: 'start' }}>
          {/* Left side - Product Images */}
          <Paper className="sticky-media" sx={{ p: 1 }}>
            <MediaGallery product={p} />
          </Paper>

          {/* Right side - Product Details */}
          <Box sx={{ pl: { md: 2 } }}>
            {/* Product Title */}
            <Typography variant="h4" sx={{ mb: 1, fontWeight: 800, lineHeight: 1.2, color: '#000000' }}>
              {p.title}
            </Typography>

            {/* Rating */}
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
              <Star fontSize="small" sx={{ color: '#000000' }} />
              <Star fontSize="small" sx={{ color: '#000000' }} />
              <Star fontSize="small" sx={{ color: '#000000' }} />
              <Star fontSize="small" sx={{ color: '#000000' }} />
              <StarHalf fontSize="small" sx={{ color: '#000000' }} />
              <Typography variant="body2" sx={{ color: '#000000' }}>({(reviewsBySlug[(window.location.pathname.split('/').filter(Boolean)[1]) || 'head-massager']?.ratingCount) ?? 0} reviews)</Typography>
            </Stack>

            {/* Price */}
            <Stack direction="row" spacing={1.5} alignItems="baseline" flexWrap="wrap" sx={{ mb: 3 }}>
              <Typography variant="h4" component="strong" sx={{ color: '#000000' }}>{formatINR(p.price)}</Typography>
              {p.compareAtPrice ? <Typography variant="body1" sx={{ textDecoration: 'line-through', color: '#666666' }}>{formatINR(p.compareAtPrice)}</Typography> : null}
              {pct ? <Typography variant="body1" sx={{ color: '#FF6B35', fontWeight: 'bold' }}>({pct}% OFF)</Typography> : null}
            </Stack>

            {/* Action Buttons - Between Price and Trust Badges */}
            {out ? (
              <Button fullWidth size="large" variant="contained" startIcon={<NotificationsNone />} onClick={() => events.cta_click({ id: p.id, step: 'add_to_cart' })} sx={{ mb: 3, borderRadius: 0, py: 1.5, fontWeight: 'bold', backgroundColor: '#6B7280', '&:hover': { backgroundColor: '#4B5563' } }}>
                Notify Me
              </Button>
            ) : (
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25} sx={{ mb: 3 }}>
                <Button size="large" variant="outlined" startIcon={hasItems ? <ShoppingCartCheckout /> : <AddShoppingCart />} onClick={() => handleAddToCart(p)} sx={{
                  flex: 0.8,
                  borderRadius: 0,
                  py: 1.2,
                  fontWeight: 'bold',
                  backgroundColor: '#FFFFFF',
                  color: '#374151',
                  border: '2px solid #D1D5DB',
                  '&:hover': {
                    backgroundColor: '#F9FAFB',
                    border: '2px solid #9CA3AF'
                  }
                }}>
                  {hasItems ? 'GO TO CART' : 'ADD TO CART'}
                </Button>
                <Button size="large" variant="contained" startIcon={<FlashOn />} onClick={() => handleBuyNow(p)} sx={{
                  flex: 1.2,
                  borderRadius: 0,
                  py: 1.8,
                  fontWeight: 'bold',
                  backgroundColor: '#FF3F6C',
                  color: '#FFFFFF',
                  '&:hover': {
                    backgroundColor: '#E73962'
                  }
                }}>
                  BUY NOW
                </Button>
              </Stack>
            )}




            {/* Product Features */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" sx={{ mb: 1.5, color: '#000000', fontWeight: 800 }}>Why you’ll love it</Typography>
              <Paper sx={{ p: 2, mb: 1.5, border: '1px dashed var(--color-border)', borderRadius: 2 }}>
                <Typography variant="subtitle1" fontWeight={700} sx={{ color: '#000000', fontSize: 18 }}>{p.bullets[0]}</Typography>
              </Paper>
              <FeatureList bullets={p.bullets.slice(1)} />
            </Box>




            {/* Payment Offer */}
            <Paper sx={{ p: { xs: 1.5, sm: 2 }, mb: 0, border: '1px dashed var(--color-border)', borderRadius: 2 }}>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                <LocalOffer fontSize="small" sx={{ color: '#FF3F6C' }} />
                <Typography fontWeight={800} sx={{ color: '#000000', fontSize: { xs: 16, sm: 18 } }}>Payment Offer</Typography>
              </Stack>
              <Typography sx={{ color: '#000000', fontSize: { xs: 15, sm: 16 }, lineHeight: 1.45, mb: 1 }}>
                <Box component="span" sx={{ color: '#FF3F6C', fontWeight: 800 }}>Extra 5% OFF</Box> (up to ₹50) on online payments
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, border: '1px solid #ffe0e7', background: '#fff5f7', color: '#111827', borderRadius: '999px', px: 1.2, py: 0.6, fontSize: 12, whiteSpace: 'nowrap' }}>
                  <Payments sx={{ fontSize: 14, color: '#FF3F6C' }} /> UPI/Cards
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, border: '1px solid #ffe0e7', background: '#fff5f7', color: '#111827', borderRadius: '999px', px: 1.2, py: 0.6, fontSize: 12, whiteSpace: 'nowrap' }}>
                  <CheckCircle sx={{ fontSize: 14, color: '#FF3F6C' }} /> Instant confirmation
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, border: '1px solid #ffe0e7', background: '#fff5f7', color: '#111827', borderRadius: '999px', px: 1.2, py: 0.6, fontSize: 12, whiteSpace: 'nowrap' }}>
                  <CheckCircle sx={{ fontSize: 14, color: '#FF3F6C' }} /> Secure payments
                </Box>
              </Box>
            </Paper>

	            {/* Marketing Banner below Payment Offer */}
	            <Box sx={{ mt: 2 }}>
	              <img src="/banner.jpeg" alt="Offer banner" style={{ width: '100%', borderRadius: 12, display: 'block' }} />
	            </Box>



          </Box>
        </Box>
      </Container>

      {/* Social proof */}
      <Container sx={{ py: 2 }}>
        <Box className="reveal" sx={{ p: 2, display: 'grid', gap: 1.5, textAlign: 'center', boxShadow: 'none', border: 'none' }}>
          <Typography variant="h6" sx={{ color: '#000000', fontWeight: 'bold' }}>What customers say</Typography>
          <ReviewGrid />
        </Box>
      </Container>

      {/* Shipping */}
      <Container sx={{ py: 2 }}>
        <Box className="reveal" sx={{ p: 2, display: 'grid', gap: 1, textAlign: 'center', boxShadow: 'none', border: 'none' }}>
          <Typography variant="h6" sx={{ color: '#000000', fontWeight: 'bold' }}>Shipping</Typography>
          <Typography sx={{ color: '#000000' }}>Ships across India. Processing within 24–48h. Tracking shared via SMS/Email.</Typography>
        </Box>
      </Container>

      {/* Final CTA */}
      <Container sx={{ py: 3 }}>
        <Box className="reveal" sx={{ p: 2, display: 'flex', justifyContent: 'center', gap: 1.5, flexWrap: 'wrap', boxShadow: 'none', border: 'none' }}>
          {out ? (
            <Button variant="contained" onClick={() => events.cta_click({ id: p.id, step: 'add_to_cart' })} sx={{ borderRadius: 0, py: 1.5, px: 4, fontWeight: 'bold', backgroundColor: '#6B7280', '&:hover': { backgroundColor: '#4B5563' } }}>Notify Me</Button>
          ) : (
            <>
              <Button variant="outlined" onClick={() => handleBuyNow(p)} sx={{ borderRadius: 0, py: 1.2, px: 4, fontWeight: 'bold', backgroundColor: '#FFFFFF', color: '#374151', border: '2px solid #D1D5DB', '&:hover': { backgroundColor: '#F9FAFB', border: '2px solid #9CA3AF' } }}>Get it now — limited stock</Button>
            </>
          )}
        </Box>
      </Container>

      {/* Close page-surface wrapper */}
        </div>
      </div>

      {/* Footer */}
      <footer style={{
        backgroundColor: '#f8f9fa',
        padding: '20px 0',
        textAlign: 'center',
        borderTop: '1px solid #e9ecef',
        marginTop: '40px',
        color: '#000000'
      }}>
        <Container>
          <Typography variant="body2" sx={{ color: '#000000' }}>
            All rights reserved to KhushiyanStoreLtd
          </Typography>
        </Container>
      </footer>
    </div>
  )
}

