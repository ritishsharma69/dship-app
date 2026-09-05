import { useEffect, useMemo, useState, useLayoutEffect, useRef, Suspense, lazy } from 'react'
import { gsap, canAnimate } from '../lib/gsap'
import { liveNames, liveCities } from '../data'
import { useProducts, productSlug } from '../lib/products'
import { optimizeImage } from '../lib/cloudinary'
import { events } from '../analytics'
import type { Product } from '../types'
const MediaGallery = lazy(() => import('../components/MediaGallery'))
const ReviewGrid = lazy(() => import('../components/ReviewGrid'))

import { useCart } from '../lib/cart'
import { useRouter } from '../lib/router'
import { useToast } from '../lib/toast'

// MUI
import Container from '@mui/material/Container'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import Skeleton from '@mui/material/Skeleton'
import Collapse from '@mui/material/Collapse'

const LiveSalesToast = lazy(() => import('../components/LiveSalesToast'))

import { AddShoppingCart, ShoppingCartCheckout, FlashOn, Star, StarHalf, NotificationsNone, LocalOffer, Payments, CheckCircle, DiamondOutlined, PaymentsOutlined, LocalShippingOutlined, CachedRounded, VerifiedUserOutlined, CheckRounded, BoltRounded, BatteryChargingFullRounded, WaterDropOutlined, GppGoodOutlined, ExpandMoreRounded, ChatBubbleOutlineRounded, EastRounded, ShoppingCartRounded, LocalShipping, MenuBookRounded } from '@mui/icons-material'

const formatINR = (amount: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount)
const pctOff = (price: number, original?: number) => !original || original <= price ? null : Math.round(((original - price) / original) * 100)

export default function MainPage() {
  const [p, setP] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [error] = useState<string | null>(null)
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  const { productsBySlug, loading: productsLoading } = useProducts()

  useEffect(() => {
    // Pick by slug from the URL: /p/:slug; default to first product
    const slug = (window.location.pathname.split('/').filter(Boolean)[1]) || ''
    const chosen = productsBySlug[slug] ?? Object.values(productsBySlug)[0] ?? null
    setP(chosen)
    setLoading(productsLoading && !chosen)
  }, [productsBySlug, productsLoading])

  const out = p?.inventoryStatus === 'OUT_OF_STOCK'

  // Related products for internal linking
  const relatedProducts = useMemo(() => {
    if (!p) return []
    const currentSlug = window.location.pathname.split('/').filter(Boolean)[1] || ''
    return Object.entries(productsBySlug)
      .filter(([slug]) => slug !== currentSlug)
      .slice(0, 4)
      .map(([, prod]) => ({
        title: prod.title,
        image: prod.images?.[0],
        price: prod.price,
        compareAt: prod.compareAtPrice,
        ratingAvg: prod.ratingAvg,
        ratingCount: prod.ratingCount,
        href: '/p/' + (prod.slug || productSlug(prod)),
      }))
  }, [p, productsBySlug])

  // SEO title, description & OG tags
  useEffect(() => {
    if (!p) return
    const title = `${p.title} — ${p.bullets[0]} | ${p.brand ?? 'Khushiyan Store'}`
    document.title = title
    const baseDesc = p.description || [p.descriptionHeading, ...(p.descriptionPoints ?? [])].filter(Boolean).join(' • ') || `${p.bullets.slice(0, 3).join(' • ')}`
    const desc = `${baseDesc}`.slice(0, 160)

    const setMeta = (attr: string, key: string, content: string) => {
      let el = document.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null
      if (!el) { el = document.createElement('meta'); el.setAttribute(attr, key); document.head.appendChild(el) }
      el.content = content
    }
    setMeta('name', 'description', desc)
    setMeta('property', 'og:title', title)
    setMeta('property', 'og:description', desc)
    setMeta('property', 'og:image', p.images[0] || 'https://www.khushiyan.store/mainlogo.png')
    setMeta('property', 'og:url', window.location.href)
    setMeta('property', 'og:type', 'product')
    setMeta('name', 'twitter:card', 'summary_large_image')
    setMeta('name', 'twitter:title', title)
    setMeta('name', 'twitter:description', desc)
    setMeta('name', 'twitter:image', p.images[0] || 'https://www.khushiyan.store/mainlogo.png')

    // Canonical
    let canon = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null
    if (!canon) { canon = document.createElement('link'); canon.rel = 'canonical'; document.head.appendChild(canon) }
    canon.href = window.location.href.split('?')[0]
  }, [p])

  // Generate FAQ data for product
  const productFaqs = useMemo(() => {
    if (!p) return []
    const title = p.title
    const price = formatINR(p.price)
    return [
      { question: `What is the price of ${title}?`, answer: `The ${title} is available at ${price} on Khushiyan Store with free delivery across India.` },
      { question: `Is Cash on Delivery available for ${title}?`, answer: `Yes, Cash on Delivery (COD) is available for the ${title}. You can also pay online via UPI, cards, or net banking.` },
      { question: `What is the delivery time for ${title}?`, answer: `The ${title} is typically delivered within 2-5 business days across India. Tracking details are shared via SMS and email.` },
      { question: `Can I return the ${title}?`, answer: `Yes, easy returns are available. If you're not satisfied, you can initiate a return within the return window. Visit our Returns page for details.` },
      { question: `Is ${title} original and brand new?`, answer: `Yes, all products on Khushiyan Store including the ${title} are 100% brand new and quality checked before dispatch.` },
    ]
  }, [p])

  // JSON-LD Product + BreadcrumbList + FAQPage
  const jsonLd: any = useMemo(() => {
    if (!p) return {}
    const desc = p.description || p.bullets?.slice(0, 3).join('. ') || ''
    return {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'Product', name: p.title, sku: p.sku,
          description: desc.slice(0, 300),
          brand: p.brand ? { '@type': 'Brand', name: p.brand } : undefined,
          image: p.images,
          aggregateRating: (p.ratingCount ?? 0) > 0 ? { '@type': 'AggregateRating', ratingValue: (p.ratingAvg ?? 0).toFixed(1), reviewCount: p.ratingCount } : undefined,
          offers: {
            '@type': 'Offer', priceCurrency: 'INR', price: p.price,
            availability: out ? 'https://schema.org/OutOfStock' : 'https://schema.org/InStock',
            url: typeof window !== 'undefined' ? window.location.href : undefined,
            seller: { '@type': 'Organization', name: 'Khushiyan Store' },
          },
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.khushiyan.store/' },
            { '@type': 'ListItem', position: 2, name: p.title, item: typeof window !== 'undefined' ? window.location.href : undefined },
          ],
        },
        {
          '@type': 'FAQPage',
          mainEntity: productFaqs.map(faq => ({
            '@type': 'Question',
            name: faq.question,
            acceptedAnswer: { '@type': 'Answer', text: faq.answer },
          })),
        },
      ],
    }
  }, [p, out, productFaqs])

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
			    cycleRef.current = window.setTimeout(__showThenHide, 8000)
			  }, 7000)
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
  if (loading) return (
    <Container sx={{ py: 3 }}>
      <Box sx={{ display: 'grid', gap: 4, gridTemplateColumns: { xs: '1fr', md: '1.1fr 0.9fr' }, alignItems: 'start' }}>
        <Skeleton variant="rectangular" sx={{ width: '100%', height: { xs: 300, md: 420 }, borderRadius: 2 }} animation="wave" />
        <Box>
          <Skeleton width="80%" height={40} animation="wave" sx={{ mb: 1 }} />
          <Skeleton width="40%" height={24} animation="wave" sx={{ mb: 2 }} />
          <Skeleton width="50%" height={36} animation="wave" sx={{ mb: 3 }} />
          <Skeleton variant="rectangular" height={48} animation="wave" sx={{ mb: 1, borderRadius: 1 }} />
          <Skeleton variant="rectangular" height={48} animation="wave" sx={{ mb: 3, borderRadius: 1 }} />
          <Skeleton variant="rectangular" height={80} animation="wave" sx={{ borderRadius: 2, mb: 2 }} />
          <Skeleton width="60%" height={24} animation="wave" />
          <Skeleton width="100%" height={20} animation="wave" />
          <Skeleton width="90%" height={20} animation="wave" />
          <Skeleton width="70%" height={20} animation="wave" />
        </Box>
      </Box>
    </Container>
  )
  if (error) return <Container sx={{ py: 3, color: 'crimson' }}>Error: {error}</Container>
  if (!p) return <Container sx={{ py: 3 }}>No product found</Container>

  function handleAddToCart(product: Product) {
    if (count > 0) {
      // If there is already at least one item, take user to checkout
      return navigate('/checkout')
    }
    add({ product, quantity: 1 })
    events.add_to_cart({ id: product.id, price: product.price })
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
    events.add_to_cart({ id: product.id, price: product.price })
    events.cta_click({ id: product.id, step: 'begin_checkout' })
    navigate('/checkout')
  }

  // Feature highlights under the gallery (juicer-aware with generic fallback)
  const isJuicer = /juicer|blender/i.test(p.title)
  const highlights = isJuicer ? [
    { icon: <BoltRounded sx={{ fontSize: 20, color: '#7C3AED' }} />, bg: '#F1EBFC', title: 'Powerful Blending', caption: '30-sec quick blend' },
    { icon: <BatteryChargingFullRounded sx={{ fontSize: 20, color: '#16A34A' }} />, bg: '#E7F6EC', title: 'Long Battery Life', caption: 'Upto 15 uses' },
    { icon: <WaterDropOutlined sx={{ fontSize: 20, color: '#2563EB' }} />, bg: '#E8F0FE', title: 'Easy to Clean', caption: 'Detachable parts' },
    { icon: <GppGoodOutlined sx={{ fontSize: 20, color: '#EA7A23' }} />, bg: '#FDF0E4', title: 'Safe Materials', caption: 'BPA free & food grade' },
  ] : [
    { icon: <BoltRounded sx={{ fontSize: 20, color: '#7C3AED' }} />, bg: '#F1EBFC', title: 'Premium Quality', caption: 'Quality checked' },
    { icon: <LocalShippingOutlined sx={{ fontSize: 20, color: '#16A34A' }} />, bg: '#E7F6EC', title: 'Fast Delivery', caption: 'Across India' },
    { icon: <CachedRounded sx={{ fontSize: 20, color: '#2563EB' }} />, bg: '#E8F0FE', title: 'Easy Returns', caption: 'Hassle-free' },
    { icon: <GppGoodOutlined sx={{ fontSize: 20, color: '#EA7A23' }} />, bg: '#FDF0E4', title: 'Safe Materials', caption: 'Quality assured' },
  ]

  // "Why you'll love it?" grid — bullets + description points, deduped
  const loveItPoints = Array.from(new Set([...(p.bullets ?? []), ...(p.descriptionPoints ?? [])])).slice(0, 8)

  // Purple premium card copy
  const premiumHeading = p.descriptionHeading || 'Premium Quality Product'
  const premiumSub = (p.description || '').split(/(?<=[.!?])\s/)[0] || p.bullets[0] || ''

  const trustCards = [
    { icon: <PaymentsOutlined sx={{ fontSize: 18, color: '#16A34A' }} />, l1: 'COD', l2: 'Available' },
    { icon: <LocalShippingOutlined sx={{ fontSize: 18, color: '#16A34A' }} />, l1: 'Free Fast', l2: 'Delivery' },
    { icon: <CachedRounded sx={{ fontSize: 18, color: '#16A34A' }} />, l1: 'Easy', l2: 'Returns' },
    { icon: <VerifiedUserOutlined sx={{ fontSize: 18, color: '#16A34A' }} />, l1: 'SSL', l2: 'Secure' },
  ]

  return (
    <div ref={pageRef}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />


	      {/* Page surface wrapper for white center with grey gutters */}
	      <div className="container">
	        <div className="page-surface">

          {/* Visual Breadcrumb Navigation */}
          <Container sx={{ pt: { xs: 0.75, md: 1.5 }, pb: 0.5 }}>
            <Box component="nav" aria-label="Breadcrumb" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontSize: 13, color: '#6b7280' }}>
              <Box component="a" href="/" sx={{ color: '#6D28D9', textDecoration: 'none', fontWeight: 600, '&:hover': { textDecoration: 'underline' } }}>Home</Box>
              <span>›</span>
              <Box component="a" href="/featured" sx={{ color: '#6D28D9', textDecoration: 'none', fontWeight: 600, '&:hover': { textDecoration: 'underline' } }}>Products</Box>
              <span>›</span>
              <Typography component="span" sx={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>{p?.title || 'Product'}</Typography>
            </Box>
          </Container>

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
      <Container sx={{ pt: { xs: 0.5, md: 3 }, pb: 3 }}>
        {/* minmax(0, …) so the thumbnail scroller can't force the column (and page) wider than the viewport */}
        <Box className="product-grid" sx={{ display: 'grid', gap: { xs: 2, md: 4 }, py: { xs: 0.5, md: 2 }, gridTemplateColumns: { xs: 'minmax(0, 1fr)', md: 'minmax(0, 1.1fr) minmax(0, 0.9fr)' }, alignItems: 'start' }}>
          {/* Left side - Product Images */}
          <Box className="sticky-media" sx={{ minWidth: 0 }}>
            <Suspense fallback={<Skeleton variant="rectangular" sx={{ width: '100%', height: { xs: 300, md: 420 }, borderRadius: 2 }} animation="wave" />}>
              <MediaGallery product={p} />
            </Suspense>

            {/* Feature highlights under gallery — desktop/tablet only; on mobile they render below the CTAs to keep buttons above the fold */}
            <Box sx={{ display: { xs: 'none', sm: 'grid' }, gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)' }, gap: 1.5, mt: 2.5 }}>
              {highlights.map((h, i) => (
                <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 38, height: 38, borderRadius: '50%', background: h.bg, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                    {h.icon}
                  </Box>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography sx={{ fontSize: 12.5, fontWeight: 800, color: '#111827', lineHeight: 1.25 }}>{h.title}</Typography>
                    <Typography sx={{ fontSize: 11, color: '#6B7280', lineHeight: 1.3 }}>{h.caption}</Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>

          {/* Right side - Product Details */}
          <Box sx={{ pl: { md: 2 } }}>
            {/* Best Seller + SKU row */}
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.25 }}>
              <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.6, background: '#FDEEE4', color: '#EA6A12', borderRadius: '999px', px: 1.4, py: 0.5, fontSize: 12, fontWeight: 800 }}>
                🔥 Best Seller
              </Box>
              <Typography sx={{ fontSize: 12, color: '#9CA3AF', fontWeight: 600 }}>SKU: {p.sku}</Typography>
            </Stack>

            {/* Product Title */}
            <Typography component="h1" variant="h4" sx={{ mb: 1, fontWeight: 800, lineHeight: 1.2, color: '#111827' }}>
              {p.title}
            </Typography>

            {/* Rating */}
            <Stack direction="row" spacing={0.25} alignItems="center" sx={{ mb: 2 }}>
              {Array.from({ length: 5 }).map((_, i) => {
                const rating = p.ratingAvg ?? 0
                const isHalf = rating > i && rating < i + 1
                const isFull = rating > i + 0.5
                return isHalf ? (
                  <StarHalf key={i} fontSize="small" sx={{ color: '#F59E0B' }} />
                ) : (
                  <Star key={i} fontSize="small" sx={{ color: isFull ? '#F59E0B' : '#E5E7EB' }} />
                )
              })}
              <Typography variant="body2" sx={{ color: '#374151', pl: 1, fontWeight: 600 }}>
                {p.ratingAvg ? `${p.ratingAvg.toFixed(1)}/5` : 'No rating'} ({(p.ratingCount) ?? 0} reviews)
              </Typography>
            </Stack>

            {/* Price */}
            <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" sx={{ mb: 1.5 }}>
              <Typography component="strong" sx={{ color: '#111827', fontWeight: 900, fontSize: { xs: 30, sm: 34 }, lineHeight: 1 }}>{formatINR(p.price)}</Typography>
              {p.compareAtPrice ? <Typography sx={{ textDecoration: 'line-through', color: '#9CA3AF', fontSize: 17 }}>{formatINR(p.compareAtPrice)}</Typography> : null}
              {pct ? (
                <Box sx={{ background: '#FDE7EF', color: '#EF2B62', borderRadius: '999px', px: 1.4, py: 0.4, fontSize: 12.5, fontWeight: 800 }}>
                  {pct}% OFF
                </Box>
              ) : null}
            </Stack>

            {/* Stock status */}
            <Stack direction="row" spacing={1.25} alignItems="center" sx={{ mb: 2.5 }}>
              {out ? (
                <Stack direction="row" spacing={0.6} alignItems="center">
                  <Box sx={{ width: 8, height: 8, borderRadius: '50%', background: '#EF4444' }} />
                  <Typography sx={{ fontSize: 13, fontWeight: 800, color: '#EF4444' }}>Out of Stock</Typography>
                </Stack>
              ) : (
                <>
                  <Stack direction="row" spacing={0.6} alignItems="center">
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', background: '#16A34A' }} />
                    <Typography sx={{ fontSize: 13, fontWeight: 800, color: '#16A34A' }}>
                      {p.inventoryStatus === 'LOW_STOCK' ? 'Low Stock' : 'In Stock'}
                    </Typography>
                  </Stack>
                  <Typography sx={{ fontSize: 13, color: '#D1D5DB' }}>|</Typography>
                  <Typography sx={{ fontSize: 13, color: '#6B7280' }}>Ships within 24 hours</Typography>
                </>
              )}
            </Stack>

            {/* Action Buttons */}
            {out ? (
              <Button fullWidth size="large" variant="contained" startIcon={<NotificationsNone />} onClick={() => events.cta_click({ id: p.id, step: 'add_to_cart' })} sx={{ mb: 2.5, borderRadius: '12px', py: 1.5, fontWeight: 800, backgroundColor: '#6B7280', '&:hover': { backgroundColor: '#4B5563' } }}>
                Notify Me
              </Button>
            ) : (
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mb: 2.5 }}>
                <Button size="large" variant="outlined" startIcon={hasItems ? <ShoppingCartCheckout /> : <AddShoppingCart />} onClick={() => handleAddToCart(p)} sx={{
                  flex: 1,
                  borderRadius: '12px',
                  py: 1.4,
                  fontWeight: 800,
                  letterSpacing: 0.4,
                  backgroundColor: '#FFFFFF',
                  color: '#7C3AED',
                  border: '2px solid #7C3AED',
                  '&:hover': {
                    backgroundColor: '#F6F2FD',
                    border: '2px solid #6D28D9'
                  }
                }}>
                  {hasItems ? 'GO TO CART' : 'ADD TO CART'}
                </Button>
                <Button className="btn-buy" size="large" variant="contained" startIcon={<FlashOn />} onClick={() => handleBuyNow(p)} sx={{
                  flex: 1,
                  borderRadius: '12px',
                  py: 1.4,
                  fontWeight: 800,
                  letterSpacing: 0.4,
                  color: '#FFFFFF',
                  background: 'linear-gradient(90deg, #6D28D9 0%, #8B5CF6 100%)',
                  boxShadow: '0 8px 20px rgba(124,58,237,0.35)',
                  '&:hover': {
                    background: 'linear-gradient(90deg, #5B21B6 0%, #7C3AED 100%)',
                    boxShadow: '0 8px 20px rgba(124,58,237,0.45)'
                  }
                }}>
                  BUY NOW
                </Button>
              </Stack>
            )}

            {/* Premium purple card — below CTAs so buttons stay above the fold on mobile */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, background: '#F2EEFC', borderRadius: '16px', p: 2, mb: 2.5 }}>
              <Box sx={{ width: 44, height: 44, borderRadius: '50%', background: '#fff', display: 'grid', placeItems: 'center', flexShrink: 0, boxShadow: '0 2px 8px rgba(124,58,237,0.15)' }}>
                <DiamondOutlined sx={{ fontSize: 22, color: '#7C3AED' }} />
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography sx={{ fontSize: 14.5, fontWeight: 800, color: '#7C3AED', lineHeight: 1.3 }}>{premiumHeading}</Typography>
                <Typography sx={{ fontSize: 13, color: '#374151', lineHeight: 1.4 }}>{premiumSub}</Typography>
              </Box>
            </Box>

            {/* Feature highlights — mobile only (desktop shows them under the gallery) */}
            <Box sx={{ display: { xs: 'grid', sm: 'none' }, gridTemplateColumns: 'repeat(2, 1fr)', gap: 1.5, mb: 2.5 }}>
              {highlights.map((h, i) => (
                <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 38, height: 38, borderRadius: '50%', background: h.bg, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                    {h.icon}
                  </Box>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography sx={{ fontSize: 12.5, fontWeight: 800, color: '#111827', lineHeight: 1.25 }}>{h.title}</Typography>
                    <Typography sx={{ fontSize: 11.5, color: '#6B7280', lineHeight: 1.3 }}>{h.caption}</Typography>
                  </Box>
                </Box>
              ))}
            </Box>

            {/* Trust badges */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)' }, gap: 1.25, mb: 3 }}>
              {trustCards.map((t, i) => (
                <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1, background: '#F0FAF3', border: '1px solid #DCF2E3', borderRadius: '12px', p: 1.25 }}>
                  <Box sx={{ width: 32, height: 32, borderRadius: '9px', background: '#DFF3E6', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                    {t.icon}
                  </Box>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography sx={{ fontSize: 12, fontWeight: 800, color: '#111827', lineHeight: 1.25 }}>{t.l1}</Typography>
                    <Typography sx={{ fontSize: 11.5, color: '#4B5563', lineHeight: 1.25 }}>{t.l2}</Typography>
                  </Box>
                </Box>
              ))}
            </Box>

            {/* Why you'll love it */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" sx={{ mb: 1.5, color: '#111827', fontWeight: 800 }}>Why you’ll love it?</Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, gap: 1.25 }}>
                {loveItPoints.map((pt, i) => (
                  <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1, background: '#fff', border: '1px solid #EEF0F3', borderRadius: '12px', p: 1.25, boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
                    <Box sx={{ width: 22, height: 22, borderRadius: '50%', background: '#7C3AED', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                      <CheckRounded sx={{ fontSize: 14, color: '#fff' }} />
                    </Box>
                    <Typography sx={{ fontSize: 12.5, fontWeight: 600, color: '#111827', lineHeight: 1.35 }}>{pt}</Typography>
                  </Box>
                ))}
              </Box>
            </Box>

            {/* Description Section */}
            {(p.descriptionHeading || p.description) && (
              <Box sx={{ mb: 3, background: '#fff', border: '1px solid #EEF0F3', borderRadius: '16px', p: 2.5, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                <Stack direction="row" alignItems="center" spacing={1.25} sx={{ mb: 1.75 }}>
                  <Box sx={{ width: 40, height: 40, borderRadius: '12px', background: '#F2EEFC', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                    <MenuBookRounded sx={{ fontSize: 20, color: '#7C3AED' }} />
                  </Box>
                  <Box>
                    <Typography component="h2" sx={{ color: '#111827', fontWeight: 800, fontSize: 17, lineHeight: 1.25 }}>
                      {p.descriptionHeading || 'Product Details'}
                    </Typography>
                    <Typography sx={{ fontSize: 12, color: '#9CA3AF', fontWeight: 600 }}>Everything you need to know</Typography>
                  </Box>
                </Stack>
                {p.description && (
                  <Box sx={{ display: 'grid', gap: 1.5 }}>
                    {p.description.split(/\n\s*\n/).map((para, i) => (
                      <Typography key={i} sx={{ color: '#374151', fontSize: 14, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                        {para.trim()}
                      </Typography>
                    ))}
                  </Box>
                )}
              </Box>
            )}

          </Box>
        </Box>
      </Container>

      {/* Offers strip — Payment / Shipping / Limited-time */}
      <Container sx={{ py: 2 }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 2, alignItems: 'stretch' }}>
          {/* Payment Offer */}
          <Box sx={{ background: '#FDF1F4', border: '1px solid #FBE3EA', borderRadius: '16px', p: 2.25 }}>
            <Stack direction="row" alignItems="center" spacing={1.25} sx={{ mb: 1 }}>
              <Box sx={{ width: 40, height: 40, borderRadius: '50%', background: '#fff', display: 'grid', placeItems: 'center', boxShadow: '0 2px 8px rgba(239,43,98,0.12)', flexShrink: 0 }}>
                <LocalOffer sx={{ fontSize: 19, color: '#EF2B62' }} />
              </Box>
              <Typography sx={{ fontWeight: 800, color: '#111827', fontSize: 16 }}>Payment Offer</Typography>
            </Stack>
            <Typography sx={{ color: '#374151', fontSize: 13.5, mb: 1.5 }}>
              <Box component="span" sx={{ color: '#EF2B62', fontWeight: 800 }}>Cash on Delivery</Box> available on all orders!
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, background: '#fff', color: '#111827', borderRadius: '999px', px: 1.3, py: 0.6, fontSize: 11.5, fontWeight: 600, whiteSpace: 'nowrap', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <Payments sx={{ fontSize: 14, color: '#EF2B62' }} /> COD Available
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, background: '#fff', color: '#111827', borderRadius: '999px', px: 1.3, py: 0.6, fontSize: 11.5, fontWeight: 600, whiteSpace: 'nowrap', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <CheckCircle sx={{ fontSize: 14, color: '#EF2B62' }} /> Fast Delivery
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, background: '#fff', color: '#111827', borderRadius: '999px', px: 1.3, py: 0.6, fontSize: 11.5, fontWeight: 600, whiteSpace: 'nowrap', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <CheckCircle sx={{ fontSize: 14, color: '#EF2B62' }} /> Easy Returns
              </Box>
            </Box>
          </Box>

          {/* Shipping */}
          <Box sx={{ background: '#F4F1FD', border: '1px solid #E9E2FA', borderRadius: '16px', p: 2.25 }}>
            <Stack direction="row" alignItems="center" spacing={1.25} sx={{ mb: 1 }}>
              <Box sx={{ width: 40, height: 40, borderRadius: '12px', background: '#7C3AED', display: 'grid', placeItems: 'center', boxShadow: '0 4px 12px rgba(124,58,237,0.25)', flexShrink: 0 }}>
                <LocalShipping sx={{ fontSize: 19, color: '#fff' }} />
              </Box>
              <Typography sx={{ fontWeight: 800, color: '#111827', fontSize: 16 }}>Shipping</Typography>
            </Stack>
            <Typography sx={{ color: '#374151', fontSize: 13.5, lineHeight: 1.55, mb: 1.5 }}>
              Ships across India.<br />Processing within 24–48h.<br />Tracking shared via SMS/Email.
            </Typography>
            {out ? (
              <Button size="small" variant="contained" onClick={() => events.cta_click({ id: p.id, step: 'add_to_cart' })} sx={{ borderRadius: '9px', px: 2, py: 0.75, fontWeight: 800, fontSize: 12.5, textTransform: 'none', backgroundColor: '#6B7280', '&:hover': { backgroundColor: '#4B5563' } }}>
                Notify Me
              </Button>
            ) : (
              <Button size="small" variant="contained" onClick={() => handleBuyNow(p)} sx={{ borderRadius: '9px', px: 2, py: 0.75, fontWeight: 800, fontSize: 12.5, textTransform: 'none', background: '#7C3AED', boxShadow: '0 4px 12px rgba(124,58,237,0.3)', '&:hover': { background: '#6D28D9' } }}>
                Get it now — Limited Stock!
              </Button>
            )}
          </Box>

          {/* Limited-time offers */}
          <Box sx={{ background: 'linear-gradient(135deg, #FBF7F1 0%, #F6F0E6 55%, rgba(248,243,206,0.8) 100%)', border: '1px solid #F1E8D8', borderRadius: '16px', p: 2.25, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1.5 }}>
            <Box>
              <Typography sx={{ fontWeight: 800, color: '#111827', fontSize: 16, mb: 0.5 }}>Limited-time offers</Typography>
              <Typography sx={{ color: '#374151', fontSize: 13.5, lineHeight: 1.5 }}>Checkout with online payment for extra savings.</Typography>
            </Box>
            <Box aria-hidden sx={{ fontSize: 52, lineHeight: 1, flexShrink: 0 }}>🎁</Box>
          </Box>
        </Box>
      </Container>

      {/* FAQ + You May Also Like */}
      <Container sx={{ py: 2 }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '0.9fr 1.4fr' }, gap: 2, alignItems: 'start' }}>
          {/* FAQ card */}
          <Box sx={{ background: '#fff', border: '1px solid #EEF0F3', borderRadius: '16px', p: 2.5, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <Typography component="h2" sx={{ color: '#111827', fontWeight: 800, fontSize: 17, mb: 2 }}>Frequently Asked Questions</Typography>
            <Box sx={{ display: 'grid', gap: 1.25 }}>
              {productFaqs.map((faq, i) => (
                <Box key={i} sx={{ border: '1px solid #EEF0F3', borderRadius: '10px', overflow: 'hidden' }}>
                  <Box
                    component="button"
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    aria-expanded={openFaq === i}
                    sx={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, background: '#fff', border: 'none', cursor: 'pointer', textAlign: 'left', px: 1.75, py: 1.4 }}
                  >
                    <Typography component="h3" sx={{ fontWeight: 700, fontSize: 13.5, color: '#111827', lineHeight: 1.35 }}>{faq.question}</Typography>
                    <ExpandMoreRounded sx={{ fontSize: 20, color: '#6B7280', flexShrink: 0, transform: openFaq === i ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }} />
                  </Box>
                  <Collapse in={openFaq === i}>
                    <Typography sx={{ px: 1.75, pb: 1.5, fontSize: 13, color: '#4B5563', lineHeight: 1.6 }}>{faq.answer}</Typography>
                  </Collapse>
                </Box>
              ))}
            </Box>
            <Stack direction="row" spacing={0.75} alignItems="center" justifyContent="center" sx={{ mt: 2 }}>
              <Typography sx={{ fontSize: 13, color: '#6B7280' }}>More Questions?</Typography>
              <Box component="a" href="/contact" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, color: '#7C3AED', fontWeight: 700, fontSize: 13, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>
                <ChatBubbleOutlineRounded sx={{ fontSize: 15 }} /> Contact our support team
              </Box>
            </Stack>
          </Box>

          {/* You May Also Like card */}
          {relatedProducts.length > 0 && (
            <Box sx={{ background: '#fff', border: '1px solid #EEF0F3', borderRadius: '16px', p: 2.5, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
                <Typography component="h2" sx={{ fontWeight: 800, color: '#111827', fontSize: 17 }}>You May Also Like</Typography>
                <Box component="a" href="/featured" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, color: '#7C3AED', fontWeight: 700, fontSize: 13, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>
                  View All <EastRounded sx={{ fontSize: 15 }} />
                </Box>
              </Stack>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)' }, gap: 1.5 }}>
                {relatedProducts.map((rp, i) => (
                  <Box key={i} component="a" href={rp.href} sx={{ textDecoration: 'none', color: 'inherit', border: '1px solid #EEF0F3', borderRadius: '12px', overflow: 'hidden', display: 'flex', flexDirection: 'column', transition: 'box-shadow 0.15s ease, transform 0.15s ease', '&:hover': { boxShadow: '0 6px 16px rgba(0,0,0,0.08)', transform: 'translateY(-2px)' } }}>
                    {rp.image && <Box component="img" loading="lazy" src={optimizeImage(rp.image, 'card')} alt={`${rp.title} - Buy online at Khushiyan Store`} sx={{ width: '100%', aspectRatio: '1 / 1', objectFit: 'contain', p: 1, backgroundColor: '#F7F8FA', borderRadius: 0 }} />}
                    <Box sx={{ p: 1.25, display: 'flex', flexDirection: 'column', flex: 1 }}>
                      <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: '#111827', lineHeight: 1.3, mb: 0.5 }}>{rp.title}</Typography>
                      <Stack direction="row" spacing={0.2} alignItems="center" sx={{ mb: 0.75 }}>
                        {Array.from({ length: 5 }).map((_, s) => (
                          <Star key={s} sx={{ fontSize: 13, color: (rp.ratingAvg ?? 0) > s + 0.5 ? '#F59E0B' : '#E5E7EB' }} />
                        ))}
                        <Typography sx={{ fontSize: 11, color: '#9CA3AF', pl: 0.4 }}>({rp.ratingCount ?? 0})</Typography>
                      </Stack>
                      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mt: 'auto' }}>
                        <Stack direction="row" spacing={0.75} alignItems="center">
                          <Typography sx={{ fontSize: 13.5, fontWeight: 800, color: '#111827' }}>{formatINR(rp.price)}</Typography>
                          {rp.compareAt && rp.compareAt > rp.price ? <Typography sx={{ fontSize: 11, color: '#C4C9D0', textDecoration: 'line-through' }}>{formatINR(rp.compareAt)}</Typography> : null}
                        </Stack>
                        <Box sx={{ width: 28, height: 28, borderRadius: '8px', background: '#7C3AED', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                          <ShoppingCartRounded sx={{ fontSize: 15, color: '#fff' }} />
                        </Box>
                      </Stack>
                    </Box>
                  </Box>
                ))}
              </Box>
            </Box>
          )}
        </Box>
      </Container>

      {/* Social proof */}
      <Container sx={{ py: 3 }}>
        <Box className="reveal" sx={{ display: 'grid', gap: 2.5 }}>
          <Box sx={{ textAlign: 'center' }}>
            <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.6, background: '#F2EEFC', color: '#7C3AED', borderRadius: '999px', px: 1.6, py: 0.5, fontSize: 12, fontWeight: 800, mb: 1.25 }}>
              <Star sx={{ fontSize: 14, color: '#F59E0B' }} /> Customer Reviews
            </Box>
            <Typography component="h2" sx={{ color: '#111827', fontWeight: 800, fontSize: { xs: 22, sm: 26 }, lineHeight: 1.2 }}>
              What customers say
            </Typography>
            {(p.ratingCount ?? 0) > 0 && (
              <Stack direction="row" spacing={0.75} alignItems="center" justifyContent="center" sx={{ mt: 1 }}>
                <Stack direction="row" spacing={0.2}>
                  {Array.from({ length: 5 }).map((_, s) => {
                    const rating = p.ratingAvg ?? 0
                    const isHalf = rating > s && rating < s + 1
                    const isFull = rating > s + 0.5
                    return isHalf ? (
                      <StarHalf key={s} sx={{ fontSize: 17, color: '#F59E0B' }} />
                    ) : (
                      <Star key={s} sx={{ fontSize: 17, color: isFull ? '#F59E0B' : '#E5E7EB' }} />
                    )
                  })}
                </Stack>
                <Typography sx={{ fontSize: 13.5, color: '#374151', fontWeight: 700 }}>{(p.ratingAvg ?? 0).toFixed(1)}/5</Typography>
                <Typography sx={{ fontSize: 13.5, color: '#9CA3AF' }}>· based on {p.ratingCount} reviews</Typography>
              </Stack>
            )}
          </Box>
          <Suspense fallback={<Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>{[1,2,3,4].map(i => <Skeleton key={i} variant="rectangular" height={100} animation="wave" sx={{ borderRadius: 2 }} />)}</Box>}>
            <ReviewGrid />
          </Suspense>
        </Box>
      </Container>

      {/* Close page-surface wrapper */}
        </div>
      </div>

    </div>
  )
}

