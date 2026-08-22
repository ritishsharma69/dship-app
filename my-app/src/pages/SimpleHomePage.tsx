import { useEffect, useMemo, useRef } from 'react'
import { Box, Button, Card, CardActionArea, CardContent, Chip, Container, IconButton, Skeleton, Typography } from '@mui/material'
import CheckCircleRounded from '@mui/icons-material/CheckCircleRounded'
import GroupsRounded from '@mui/icons-material/GroupsRounded'
import LocalShippingOutlined from '@mui/icons-material/LocalShippingOutlined'
import PaymentsOutlined from '@mui/icons-material/PaymentsOutlined'
import StarRounded from '@mui/icons-material/StarRounded'
import StarHalfRounded from '@mui/icons-material/StarHalfRounded'
import StarBorderRounded from '@mui/icons-material/StarBorderRounded'
import ShoppingBagOutlined from '@mui/icons-material/ShoppingBagOutlined'
import VisibilityOutlined from '@mui/icons-material/VisibilityOutlined'
import LocalFireDepartmentRounded from '@mui/icons-material/LocalFireDepartmentRounded'
import ReplayRounded from '@mui/icons-material/ReplayRounded'
import GppGoodOutlined from '@mui/icons-material/GppGoodOutlined'
import WorkspacePremiumOutlined from '@mui/icons-material/WorkspacePremiumOutlined'
import SupportAgentOutlined from '@mui/icons-material/SupportAgentOutlined'
import AutoAwesomeRounded from '@mui/icons-material/AutoAwesomeRounded'
import ArrowForwardRounded from '@mui/icons-material/ArrowForwardRounded'
import FavoriteBorderRounded from '@mui/icons-material/FavoriteBorderRounded'
import FavoriteRounded from '@mui/icons-material/FavoriteRounded'
import CardGiftcardOutlined from '@mui/icons-material/CardGiftcardOutlined'
import LockRounded from '@mui/icons-material/LockRounded'
import { useRouter } from '../lib/router'
import { gsap } from '../lib/gsap'
import { productSlug, useProducts } from '../lib/products'
import { optimizeImage } from '../lib/cloudinary'
import { useCart } from '../lib/cart'
import { useWishlist } from '../lib/wishlist'
import { useToast } from '../lib/toast'
import TestimonialsWall from '../components/TestimonialsWall'

const money = (v?: number) => (v == null ? '' : new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v))

// Homepage testimonials — picked from real store reviews (see data.ts). Indian faces from Unsplash.
const HOME_REVIEWS = [
  { name: 'Harleen C.', city: 'Ludhiana', quote: 'Delivery fast aur product quality solid. Packing bhi kaafi achhi thi.', rating: 5, accent: '#F02A4D', img: 'https://images.unsplash.com/photo-1745237015356-cefb04c70b46?w=96&h=96&fit=facearea&facepad=2.5&auto=format&q=70' },
  { name: 'Ayan D.', city: 'Jaipur', quote: 'Build quality premium hai — photos me jaisa dikhaya, waisa hi mila.', rating: 5, accent: '#7C5CFC', img: 'https://images.unsplash.com/photo-1595152772835-219674b2a8a6?w=96&h=96&fit=facearea&facepad=2.5&auto=format&q=70' },
  { name: 'Devika J.', city: 'Pune', quote: 'Value for money — definitely recommend. COD option se order karna easy laga.', rating: 5, accent: '#EC4899', img: 'https://images.unsplash.com/photo-1544725176-7c40e5a71c5e?w=96&h=96&fit=facearea&facepad=2.5&auto=format&q=70' },
  { name: 'Heena O.', city: 'Indore', quote: 'Package safely aaya, scratch free. 3 din me delivery ho gayi.', rating: 4, accent: '#0EA5E9', img: 'https://images.unsplash.com/photo-1602233158242-3ba0ac4d2167?w=96&h=96&fit=facearea&facepad=2.5&auto=format&q=70' },
  { name: 'Tara P.', city: 'Delhi', quote: 'Gift diya — sabko pasand aaya. Website se order karna simple tha.', rating: 5, accent: '#10B981' },
  { name: 'Yasir K.', city: 'Hyderabad', quote: 'Price ke hisaab se badiya product. Support team bhi responsive hai.', rating: 5, accent: '#F59E0B', img: 'https://images.unsplash.com/photo-1618077360395-f3068be8e001?w=96&h=96&fit=facearea&facepad=2.5&auto=format&q=70' },
]

export default function SimpleHomePage() {
  const { navigate } = useRouter()
  const { products, productsBySlug, loading: productsLoading, retryCount } = useProducts()
  const { add } = useCart()
  const { has: isWished, toggle: toggleWish } = useWishlist()
  const { push } = useToast()
  const rootRef = useRef<HTMLDivElement | null>(null)


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
      return <Box component="img" loading="lazy" src={src} alt={alt} sx={{ width: '100%', height: '100%', objectFit: 'contain' }} onError={(e: any) => { e.target.onerror = null; e.target.style.display = 'none'; e.target.parentElement?.querySelector('[data-fallback]')?.removeAttribute('hidden') }} />
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
        raw: p,
      }
    })
  }, [products, productsBySlug])

  // SEO: Homepage title, description & canonical
  useEffect(() => {
    document.title = 'Khushiyan Store — Best Home & Kitchen Essentials | Free Delivery India'
    let meta = document.querySelector('meta[name="description"]') as HTMLMetaElement | null
    if (!meta) { meta = document.createElement('meta'); meta.name = 'description'; document.head.appendChild(meta) }
    meta.content = 'Shop premium home & kitchen essentials at Khushiyan Store. Hand juicers, massagers, table lamps & more. Free fast delivery, COD available, easy returns across India.'
    // Canonical
    let canon = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null
    if (!canon) { canon = document.createElement('link'); canon.rel = 'canonical'; document.head.appendChild(canon) }
    canon.href = 'https://www.khushiyan.store/'
    return () => { canon?.remove() }
  }, [])

  // JSON-LD: WebSite + Organization + ItemList schema
  const homeLd = useMemo(() => ({
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        name: 'Khushiyan Store',
        url: 'https://www.khushiyan.store/',
        potentialAction: { '@type': 'SearchAction', target: 'https://www.khushiyan.store/featured?q={search_term_string}', 'query-input': 'required name=search_term_string' },
      },
      {
        '@type': 'Organization',
        name: 'Khushiyan Store',
        url: 'https://www.khushiyan.store/',
        logo: 'https://www.khushiyan.store/mainlogo.png',
        contactPoint: { '@type': 'ContactPoint', email: 'support@khushiyan.store', contactType: 'customer service' },
      },
      {
        '@type': 'ItemList',
        name: 'Featured Products',
        itemListElement: featured.map((p, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          url: `https://www.khushiyan.store${p.slug}`,
          name: p.title,
        })),
      },
    ],
  }), [featured])

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

  const bentoItems = useMemo(() => {
    const base = products.length ? products : Object.values(productsBySlug)
    // Featured shows the first 6 products — Explore shows the rest (no repeats)
    const picks = base.slice(6, 11)

    const toneGradients = [
      'linear-gradient(135deg, #E8F5E9 0%, #FFF8E1 50%, #FFF 100%)',   // green-fruity (juicer vibes)
      'linear-gradient(135deg, #F3E5F5 0%, #E8EAF6 50%, #FFF 100%)',   // pink-pastel (tumbler vibes)
      'linear-gradient(135deg, #E0F7FA 0%, #F1F8E9 50%, #FFF 100%)',   // mint-fresh (scalp/wellness)
      'linear-gradient(135deg, #FFF3E0 0%, #FBE9E7 50%, #FFF 100%)',   // warm-peach
      'linear-gradient(135deg, #F3E5F5 0%, #FCE4EC 50%, #FFF 100%)',   // lavender-rose
    ]
    const fullSpans = [
      { md: 'span 7', row: 'span 2', big: true },
      { md: 'span 5', row: 'span 1', big: false },
      { md: 'span 5', row: 'span 1', big: false },
      { md: 'span 6', row: 'span 1', big: false },
      { md: 'span 6', row: 'span 1', big: false },
    ]
    const spans = picks.length >= 4 ? fullSpans : picks.map(() => ({ md: 'span 6', row: 'span 1', big: false }))

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
    <Box sx={{ background: '#FFFFFF' }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(homeLd) }} />
      <Container sx={{ py: { xs: 2.5, md: 5 } }} ref={rootRef}>
        {/* Hero — Everyday Essentials (girl with shopping bags) — full-bleed like the mockup */}
        <Box data-anim="fade" sx={{ mb: { xs: 2, md: 3 } }}>
          <Card elevation={0} sx={{
            borderRadius: 0, border: 'none', overflow: 'hidden',
            mx: 'calc(50% - 50vw)', mt: { xs: -2.5, md: -5 },
            background: 'linear-gradient(120deg, #FBF3EA 0%, #F9EDE2 55%, #F6E7DA 100%)',
          }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1.05fr 0.95fr' }, alignItems: 'stretch' }}>
              {/* Left: copy — padding keeps text aligned with the page container */}
              <Box sx={{ pt: { xs: 3, sm: 4, md: 6 }, pb: { xs: 3, sm: 4, md: 12 }, pr: { xs: 2.5, md: 4 }, pl: { xs: 2.5, sm: 3.5, md: 'max(48px, calc((100vw - 1240px) / 2))' }, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: { xs: 1.8, md: 2.2 }, minHeight: { md: 620 }, minWidth: 0 }}>
                <Chip
                  icon={<LocalFireDepartmentRounded sx={{ fontSize: '16px !important', color: '#F97316 !important' }} />}
                  label="TRENDING NOW"
                  size="small"
                  sx={{ alignSelf: 'flex-start', bgcolor: '#FDEBD8', color: '#B45309', fontWeight: 800, fontSize: 11, letterSpacing: 0.8, px: 0.5 }}
                />
                <Typography component="h1" sx={{ fontFamily: 'Georgia, Times New Roman, serif', fontSize: { xs: 34, sm: 42, md: 52 }, lineHeight: 1.06, letterSpacing: -0.5, fontWeight: 800, color: '#1A1A1E' }}>
                  Everyday Essentials,
                  <Box component="span" sx={{ display: 'block' }}>Delivered with</Box>
                  <Box component="span" sx={{ display: 'block', color: '#7C3AED' }}>Love &amp; Happiness.</Box>
                </Typography>
                <Typography sx={{ color: '#4B5563', fontSize: { xs: 14.5, md: 16.5 }, lineHeight: 1.6 }}>
                  Premium quality home &amp; kitchen must-haves.
                  <Box component="span" sx={{ display: 'block' }}>Carefully curated. Fast delivery. Loved by 10,000+ happy customers.</Box>
                </Typography>

                {/* Trust strip — icons inside soft peach circular chips, like the mockup */}
                <Box sx={{ display: 'flex', flexWrap: 'wrap', maxWidth: '100%', gap: { xs: 1.5, sm: 0 }, alignItems: 'stretch', mt: 1, py: { sm: 0.5 } }}>
                  {[
                    { icon: <LocalShippingOutlined sx={{ fontSize: 20, color: '#AC420C' }} />, t: <>FREE FAST<br />DELIVERY</>, d: '2–5 Days Delivery' },
                    { icon: <ReplayRounded sx={{ fontSize: 20, color: '#AC420C' }} />, t: <>7 DAYS<br />EASY RETURNS</>, d: 'No Questions Asked' },
                    { icon: <GppGoodOutlined sx={{ fontSize: 20, color: '#AC420C' }} />, t: <>SECURE<br />CHECKOUT</>, d: '100% Safe & Secure' },
                    { icon: <StarRounded sx={{ fontSize: 20, color: '#F59E0B' }} />, t: <>4.8 ★<br />RATING</>, d: 'From 10,000+ Happy Customers' },
                  ].map((s, i) => (
                    <Box key={i} sx={{ display: 'flex', gap: 1, alignItems: 'flex-start', flex: { xs: '1 1 42%', sm: '1 1 0' }, minWidth: 0, pr: { sm: 1 }, pl: { sm: i > 0 ? 1.4 : 0 }, borderLeft: { sm: i > 0 ? '1px solid rgba(0,0,0,0.10)' : 'none' } }}>
                      <Box sx={{ width: 40, height: 40, borderRadius: '50%', bgcolor: '#FBEBD4', display: 'grid', placeItems: 'center', flexShrink: 0 }}>{s.icon}</Box>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography sx={{ fontSize: 10.5, fontWeight: 800, color: '#1F2937', lineHeight: 1.3, letterSpacing: 0.2 }}>{s.t}</Typography>
                        <Typography sx={{ fontSize: 10, color: '#6B7280', fontWeight: 500, lineHeight: 1.35, mt: 0.3 }}>{s.d}</Typography>
                      </Box>
                    </Box>
                  ))}
                </Box>

                {/* CTAs */}
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center', mt: { xs: 1, md: 2 } }}>
                  <Button
                    variant="contained"
                    onClick={() => navigate('/featured')}
                    startIcon={<ShoppingBagOutlined />}
                    endIcon={<ArrowForwardRounded />}
                    sx={{ px: 3.5, py: 1.6, borderRadius: '14px', fontWeight: 800, fontSize: 14.5, letterSpacing: 0.5, backgroundColor: '#7C3AED', boxShadow: '0 12px 28px rgba(124,58,237,0.3)', '&:hover': { backgroundColor: '#6D28D9' } }}
                  >
                    SHOP NOW
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => navigate('/featured')}
                    startIcon={<VisibilityOutlined />}
                    sx={{ px: 3, py: 1.55, borderRadius: '14px', fontWeight: 800, fontSize: 13.5, color: '#111827', bgcolor: '#fff', border: 'none', boxShadow: '0 6px 20px rgba(0,0,0,0.07)', '&:hover': { bgcolor: '#fff', border: 'none', boxShadow: '0 8px 24px rgba(0,0,0,0.11)' } }}
                  >
                    EXPLORE BEST SELLERS
                  </Button>
                </Box>

                <Chip
                  icon={<AutoAwesomeRounded sx={{ fontSize: '15px !important', color: '#D97706 !important' }} />}
                  label="Limited Stock – Shop Now Before It's Gone!"
                  sx={{ alignSelf: 'flex-start', mt: { xs: 0.5, md: 1 }, bgcolor: '#FBEDDA', color: '#9A4E1C', fontWeight: 600, fontSize: 13, borderRadius: 999, px: 1.2, height: 40 }}
                />
              </Box>

              {/* Right: hero girl image + floating review card */}
              <Box sx={{ position: 'relative', minHeight: { xs: 320, sm: 400, md: 'auto' } }}>
                {/* Image with diagonal organic curve on the left edge (desktop) — stays inside its own column */}
                <Box sx={{
                  position: 'absolute', inset: 0,
                  borderRadius: { xs: 0, md: '42% 0 0 16% / 88% 0 0 38%' },
                  overflow: 'hidden',
                }}>
                  <Box
                    component="img"
                    fetchPriority="high"
                    src="/home-herogirl.png"
                    alt="Happy customer shopping with Khushiyan Store bags"
                    sx={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: { xs: 'center 20%', md: 'center top' }, display: 'block' }}
                    onError={(e: any) => { e.target.style.display = 'none' }}
                  />
                </Box>
                {/* Floating social-proof card — bottom-left, clear of the stats bar overlap */}
                <Box sx={{
                  position: 'absolute', bottom: { xs: 14, md: 100 }, left: { xs: 12, md: '4%' }, right: { xs: 12, md: 'auto' },
                  bgcolor: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(8px)',
                  borderRadius: 3.5, px: 2.2, py: 1.5, boxShadow: '0 16px 40px rgba(0,0,0,0.18)',
                  display: 'flex', alignItems: 'center', gap: 1.5, maxWidth: 380, width: { md: 'max-content' },
                }}>
                  <Box sx={{ display: 'flex', flexShrink: 0 }}>
                    {[
                      // Indian customer faces (Unsplash, face-cropped)
                      'https://images.unsplash.com/photo-1745237015356-cefb04c70b46?w=96&h=96&fit=facearea&facepad=2.5&auto=format&q=70',
                      'https://images.unsplash.com/photo-1595152772835-219674b2a8a6?w=96&h=96&fit=facearea&facepad=2.5&auto=format&q=70',
                      'https://images.unsplash.com/photo-1544725176-7c40e5a71c5e?w=96&h=96&fit=facearea&facepad=2.5&auto=format&q=70',
                      'https://images.unsplash.com/photo-1618077360395-f3068be8e001?w=96&h=96&fit=facearea&facepad=2.5&auto=format&q=70',
                    ].map((src, i) => (
                      <Box key={i} component="img" src={src} alt="" loading="lazy" sx={{
                        width: 32, height: 32, borderRadius: '50%', ml: i > 0 ? -1.1 : 0,
                        border: '2px solid #fff', objectFit: 'cover', display: 'block',
                        bgcolor: '#eee',
                      }} />
                    ))}
                  </Box>
                  <Box sx={{ minWidth: 0 }}>
                    <Box sx={{ display: 'inline-flex', gap: 0.1 }}>
                      {Array.from({ length: 5 }).map((_, i) => (
                        <StarRounded key={i} sx={{ fontSize: 15, color: '#F59E0B' }} />
                      ))}
                    </Box>
                    <Typography sx={{ fontSize: 11.5, fontWeight: 700, color: '#374151', lineHeight: 1.35 }}>
                      Join 10,000+ happy customers<Box component="span" sx={{ display: { md: 'block' } }}> who shop with confidence!</Box>
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Box>
          </Card>

          {/* Stats bar — wide white card overlapping the hero bottom, top corners rounded, merges into the white page below (like the mockup) */}
          <Card elevation={0} sx={{ mt: { xs: 1.5, md: -7 }, mx: { xs: 0, md: 'calc(50% - 50vw + 36px)' }, mb: { md: 0 }, position: 'relative', zIndex: 2, borderRadius: { xs: 4, md: '32px 32px 0 0' }, border: 'none', bgcolor: '#fff', boxShadow: '0 -14px 40px rgba(0,0,0,0.07)' }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: { xs: 1.5, md: 0 }, px: { xs: 2, md: 5 }, py: { xs: 2, md: 3.5 } }}>
              {[
                { icon: <LocalShippingOutlined sx={{ fontSize: 22, color: '#F02A4D' }} />, bg: '#FCE1E4', k: 'FREE Delivery', v: 'Across All India' },
                { icon: <PaymentsOutlined sx={{ fontSize: 22, color: '#D97706' }} />, bg: '#FCEFD4', k: 'COD Available', v: 'Pay on Delivery' },
                { icon: <ReplayRounded sx={{ fontSize: 22, color: '#EA7317' }} />, bg: '#FBE8D8', k: 'Easy Returns', v: '7 Days Return Policy' },
                { icon: <GppGoodOutlined sx={{ fontSize: 22, color: '#7C3AED' }} />, bg: '#E9E1FA', k: 'Secure Checkout', v: '100% Protected Payments' },
              ].map((s, i) => (
                <Box key={s.v} sx={{ display: 'flex', alignItems: 'center', justifyContent: { md: 'center' }, gap: 1.5, py: 0.5, borderLeft: { md: i > 0 ? '1px solid rgba(0,0,0,0.08)' : 'none' } }}>
                  <Box sx={{ width: 44, height: 44, borderRadius: '50%', bgcolor: s.bg, display: 'grid', placeItems: 'center', flexShrink: 0 }}>{s.icon}</Box>
                  <Box>
                    <Typography sx={{ fontWeight: 800, fontSize: { xs: 13.5, md: 15 }, color: '#111827', lineHeight: 1.2 }}>{s.k}</Typography>
                    <Typography sx={{ fontSize: { xs: 11, md: 12 }, color: '#6B7280', fontWeight: 500 }}>{s.v}</Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          </Card>
        </Box>

        {/* Featured Collection — mockup style */}
        <Box data-anim="fade" sx={{ mb: { xs: 3, md: 5 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, mb: 2.5, flexWrap: 'wrap' }}>
            <Box>
              <Typography sx={{ fontFamily: 'Georgia, Times New Roman, serif', fontSize: { xs: 26, md: 34 }, fontWeight: 800, color: '#1A1A1E', lineHeight: 1.15 }}>Featured Collection</Typography>
              <Box sx={{ width: 52, height: 3, borderRadius: 999, bgcolor: '#F02A4D', mt: 0.8, mb: 1 }} />
              <Typography sx={{ fontSize: 13.5, color: '#6B7280' }}>{productsLoading && featured.length === 0 ? 'Loading products…' : 'Handpicked bestsellers loved by thousands of happy customers.'}</Typography>
            </Box>
            <Button
              variant="outlined"
              onClick={() => navigate('/featured')}
              endIcon={<ArrowForwardRounded sx={{ fontSize: '17px !important' }} />}
              sx={{ borderRadius: 999, px: 2.6, py: 1, fontWeight: 700, fontSize: 13, color: '#F02A4D', borderColor: 'rgba(240,42,77,0.35)', bgcolor: '#fff', '&:hover': { borderColor: '#F02A4D', bgcolor: 'rgba(240,42,77,0.04)' } }}
            >
              View All Products
            </Button>
          </Box>
          {productsLoading && featured.length === 0 ? (
            <Box>
              {retryCount > 0 && (
                <Box sx={{
                  mb: 2, p: 2, borderRadius: 2,
                  background: 'linear-gradient(135deg, #fef3c7 0%, #fce7f3 100%)',
                  border: '1px solid rgba(251,191,36,0.3)',
                  display: 'flex', alignItems: 'center', gap: 1.5
                }}>
                  <Box sx={{
                    width: 20, height: 20, borderRadius: '50%',
                    border: '2px solid #f59e0b', borderTopColor: 'transparent',
                    animation: 'spin 1s linear infinite',
                    '@keyframes spin': { '100%': { transform: 'rotate(360deg)' } }
                  }} />
                  <Typography sx={{ fontSize: 14, color: '#92400e', fontWeight: 600 }}>
                    Server starting up... Please wait ({retryCount}/6)
                  </Typography>
                </Box>
              )}
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
            </Box>
          ) : (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)', lg: 'repeat(6, 1fr)' }, gap: { xs: 1.5, md: 2 } }}>
            {featured.slice(0, 6).map((p, pi) => {
              const price = Number(p.price || 0)
              const compareAt = Number(p.compareAt || 0)
              const pct = compareAt > price && compareAt > 0 ? Math.round(((compareAt - price) / compareAt) * 100) : 0
              const rAvg = Number((p as any).ratingAvg || 4.5)
              const rCount = Number((p as any).ratingCount || 0) || (120 + ((pi * 37) % 240))
              return (
                <Card
                  key={p.id}
                  elevation={0}
                  onClick={() => navigate(p.slug)}
                  sx={{
                    borderRadius: '16px',
                    overflow: 'hidden',
                    border: '1px solid rgba(0,0,0,0.07)',
                    bgcolor: '#fff',
                    cursor: 'pointer',
                    display: 'flex', flexDirection: 'column',
                    transition: 'all 0.35s ease',
                    '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 16px 40px rgba(0,0,0,0.10)' },
                    '&:hover .feat-img': { transform: 'scale(1.05)' },
                  }}
                >
                  {/* Image area — 4:3 ratio matches the AI-generated cover images so they fill edge-to-edge */}
                  <Box sx={{ position: 'relative', aspectRatio: '4 / 3', overflow: 'hidden', bgcolor: '#fafafa', borderRadius: '12px', m: 1, flexShrink: 0 }}>
                    {p.images[0] ? (
                      <Box component="img" loading="lazy" className="feat-img" src={optimizeImage(p.images[0], 'card')} alt={`${p.title} - Buy online at best price in India | Khushiyan Store`} sx={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block', transition: 'transform 0.6s ease' }} onError={(e: any) => { e.target.onerror = null; e.target.style.display = 'none' }} />
                    ) : (
                      <Media src={undefined} alt={p.title} />
                    )}
                    {/* Discount badge — pink pill, top-left */}
                    {pct > 0 && (
                      <Box sx={{ position: 'absolute', top: 8, left: 8, zIndex: 2, bgcolor: '#F02A4D', px: 1.1, py: 0.35, borderRadius: 999, fontSize: 10.5, fontWeight: 800, color: '#fff', boxShadow: '0 2px 8px rgba(240,42,77,0.35)' }}>
                        {pct}% OFF
                      </Box>
                    )}
                    {/* Wishlist heart — top-right */}
                    <IconButton
                      size="small"
                      aria-label="Add to wishlist"
                      onClick={(e) => { e.stopPropagation(); const adding = !isWished(p.id); toggleWish(p.id); push(adding ? 'Added to wishlist ❤️' : 'Removed from wishlist') }}
                      sx={{ position: 'absolute', top: 6, right: 6, zIndex: 2, width: 30, height: 30, bgcolor: 'rgba(255,255,255,0.92)', boxShadow: '0 2px 8px rgba(0,0,0,0.10)', '&:hover': { bgcolor: '#fff' } }}
                    >
                      {isWished(p.id)
                        ? <FavoriteRounded sx={{ fontSize: 16, color: '#F02A4D' }} />
                        : <FavoriteBorderRounded sx={{ fontSize: 16, color: '#374151' }} />}
                    </IconButton>
                  </Box>

                  {/* Content */}
                  <CardContent sx={{ p: 1.5, pt: 0.8, display: 'flex', flexDirection: 'column', flex: 1, '&:last-child': { pb: 1.5 } }}>
                    <Typography sx={{ fontWeight: 700, fontSize: 13.5, color: '#1A1A1E', lineHeight: 1.3, mb: 0.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {p.title}
                    </Typography>

                    <Typography sx={{ fontSize: 11, color: '#6B7280', lineHeight: 1.45, mb: 1, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {p.subtitle}
                    </Typography>

                    {/* Rating */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4, mb: 1 }}>
                      <Box sx={{ display: 'inline-flex', gap: 0.1 }}>
                        {Array.from({ length: 5 }).map((_, i) => (
                          <StarRounded key={i} sx={{ fontSize: 13, color: i < Math.round(rAvg) ? '#F59E0B' : '#E5E7EB' }} />
                        ))}
                      </Box>
                      <Typography sx={{ fontSize: 10.5, color: '#374151', fontWeight: 700 }}>{rAvg.toFixed(1)}</Typography>
                      <Typography sx={{ fontSize: 10.5, color: '#9CA3AF', fontWeight: 600 }}>({rCount})</Typography>
                    </Box>

                    {/* Price row */}
                    <Box sx={{ mt: 'auto', display: 'flex', alignItems: 'baseline', gap: 0.8, mb: 1.2 }}>
                      <Typography sx={{ fontWeight: 800, fontSize: 17, letterSpacing: -0.3, color: '#F02A4D' }}>{money(price)}</Typography>
                      {compareAt > price ? <Typography sx={{ fontSize: 12, color: '#9CA3AF', textDecoration: 'line-through', fontWeight: 500 }}>{money(compareAt)}</Typography> : null}
                    </Box>

                    {/* Add to Cart */}
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<ShoppingBagOutlined sx={{ fontSize: '15px !important' }} />}
                      onClick={(e) => { e.stopPropagation(); add({ product: (p as any).raw, quantity: 1 }); push('Added to cart') }}
                      sx={{
                        borderRadius: '10px', py: 0.9, fontWeight: 700, fontSize: 12, letterSpacing: 0.2,
                        color: '#F02A4D', borderColor: 'rgba(240,42,77,0.35)', bgcolor: '#FFF7F8',
                        '&:hover': { borderColor: '#F02A4D', bgcolor: 'rgba(240,42,77,0.08)' },
                      }}
                    >
                      Add to Cart
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </Box>
          )}

          {/* Bottom highlights strip — soft pink pill bar, like the mockup */}
          <Box sx={{ mt: { xs: 2.5, md: 4 }, bgcolor: '#FDF1F0', borderRadius: '24px', px: { xs: 2.5, md: 4 }, py: { xs: 2, md: 2.2 }, display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(5, 1fr)' }, gap: { xs: 1.8, md: 1 } }}>
            {[
              { icon: <StarBorderRounded sx={{ fontSize: 22, color: '#F02A4D' }} />, bg: '#FCE1E4', k: '10,000+', v: 'Happy Customers' },
              { icon: <WorkspacePremiumOutlined sx={{ fontSize: 22, color: '#D97706' }} />, bg: '#FCEFD4', k: '500+', v: 'Quality Products' },
              { icon: <GppGoodOutlined sx={{ fontSize: 22, color: '#16A34A' }} />, bg: '#DCF3E1', k: '100% Original', v: 'Sourced with Quality' },
              { icon: <SupportAgentOutlined sx={{ fontSize: 22, color: '#2563EB' }} />, bg: '#DBE9FC', k: '24/7 Support', v: "We're Here to Help" },
              { icon: <CardGiftcardOutlined sx={{ fontSize: 22, color: '#7C3AED' }} />, bg: '#E9E1FA', k: 'Exciting Deals', v: 'Every Single Day' },
            ].map((s) => (
              <Box key={s.k} sx={{ display: 'flex', alignItems: 'center', gap: 1.4, justifyContent: { md: 'center' } }}>
                <Box sx={{ width: 42, height: 42, borderRadius: '50%', bgcolor: s.bg, display: 'grid', placeItems: 'center', flexShrink: 0 }}>{s.icon}</Box>
                <Box>
                  <Typography sx={{ fontWeight: 800, fontSize: 14, color: '#1A1A1E', lineHeight: 1.2 }}>{s.k}</Typography>
                  <Typography sx={{ fontSize: 11.5, color: '#6B7280', fontWeight: 500 }}>{s.v}</Typography>
                </Box>
              </Box>
            ))}
          </Box>
        </Box>

        {/* More to Explore — products beyond Featured (no repeats) */}
        {bentoItems.length >= 2 && (
        <Box data-anim="fade" sx={{ mb: { xs: 3, md: 5 } }}>
          <Typography sx={{ fontFamily: 'Georgia, Times New Roman, serif', fontSize: { xs: 22, md: 28 }, fontWeight: 700, mb: 1.5 }}>More to Explore</Typography>
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
        </Box>
        )}

        {/* Customer Reviews — Wall of Love */}
        <Box data-anim="fade" sx={{ mb: { xs: 4, md: 6 }, textAlign: 'center' }}>
          <Chip
            icon={<FavoriteRounded sx={{ fontSize: '13px !important' }} />}
            label="Wall of Love"
            size="small"
            sx={{ mb: 1.2, height: 26, px: 0.5, fontSize: 11, fontWeight: 800, letterSpacing: 0.4, textTransform: 'uppercase', bgcolor: 'rgba(124,58,237,0.08)', color: '#7C3AED', border: '1px solid rgba(124,58,237,0.18)', '& .MuiChip-icon': { color: '#7C3AED' } }}
          />
          <Typography sx={{ fontFamily: 'Georgia, Times New Roman, serif', fontSize: { xs: 26, md: 34 }, fontWeight: 700, lineHeight: 1.15 }}>
            Loved by <Box component="span" sx={{ color: '#7C3AED' }}>10,000+</Box> Customers
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>Real reviews from verified buyers across India</Typography>

          {/* Stats bar */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', gap: { xs: 1.2, md: 0 }, mt: 2.2 }}>
            {[
              { icon: <StarRounded fontSize="small" />, k: '4.8/5', v: 'Average Rating', tone: 'rgba(245,158,11,0.14)', color: '#B45309' },
              { icon: <GroupsRounded fontSize="small" />, k: '10,000+', v: 'Happy Customers', tone: 'rgba(124,58,237,0.10)', color: '#7C3AED' },
              { icon: <GppGoodOutlined fontSize="small" />, k: '100%', v: 'Verified Reviews', tone: 'rgba(16,185,129,0.12)', color: '#059669' },
            ].map((s, si) => (
              <Box key={s.v} sx={{ display: 'flex', alignItems: 'center' }}>
                {si > 0 && <Box sx={{ width: '1px', height: 34, bgcolor: 'rgba(0,0,0,0.08)', mx: { xs: 0, md: 2 }, display: { xs: 'none', md: 'block' } }} />}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.1, px: 1.8, py: 1, borderRadius: '14px', bgcolor: '#fff', border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 4px 14px rgba(15,23,42,0.05)' }}>
                  <Box sx={{ width: 36, height: 36, borderRadius: '50%', display: 'grid', placeItems: 'center', bgcolor: s.tone, color: s.color }}>{s.icon}</Box>
                  <Box sx={{ lineHeight: 1.15, textAlign: 'left' }}>
                    <Typography sx={{ fontWeight: 900, fontSize: 14.5 }}>{s.k}</Typography>
                    <Typography sx={{ fontSize: 11.5, color: 'text.secondary', fontWeight: 600 }}>{s.v}</Typography>
                  </Box>
                </Box>
              </Box>
            ))}
          </Box>

          {/* Upright marquee testimonial wall */}
          <TestimonialsWall reviews={HOME_REVIEWS} />
        </Box>

        {/* About / Trust */}
        <Box data-anim="fade" sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1.05fr 0.95fr' }, gap: 2, mb: { xs: 4, md: 6 } }}>
          <Card elevation={0} sx={{ borderRadius: '24px', border: '1px solid rgba(240,42,77,0.10)', overflow: 'hidden', background: 'linear-gradient(180deg, #FFF5F6 0%, #FFF9F7 100%)' }}>
            <Box sx={{ p: { xs: 2.2, md: 3 } }}>
              <Typography sx={{ fontSize: 11, fontWeight: 900, letterSpacing: 1, textTransform: 'uppercase', color: '#F02A4D', display: 'inline-flex', alignItems: 'center', gap: 0.6 }}>
                <FavoriteRounded sx={{ fontSize: 13 }} /> Our Promise
              </Typography>
              <Typography sx={{ fontFamily: 'Georgia, Times New Roman, serif', fontSize: { xs: 22, md: 28 }, fontWeight: 700, mt: 0.5 }}>Why Customers Trust Us</Typography>

              {/* Promise chips */}
              <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {[
                  { t: 'Quality Checked', icon: <GppGoodOutlined sx={{ fontSize: 17 }} />, color: '#166534', tone: 'rgba(34,197,94,0.10)' },
                  { t: 'Fast & Safe Delivery', icon: <LocalShippingOutlined sx={{ fontSize: 17 }} />, color: '#075985', tone: 'rgba(14,165,233,0.10)' },
                  { t: 'Easy Returns', icon: <ReplayRounded sx={{ fontSize: 17 }} />, color: '#0f766e', tone: 'rgba(20,184,166,0.10)' },
                  { t: 'Secure Payments', icon: <LockRounded sx={{ fontSize: 17 }} />, color: '#92400e', tone: 'rgba(245,158,11,0.12)' },
                  { t: 'Responsive Support', icon: <SupportAgentOutlined sx={{ fontSize: 17 }} />, color: '#4338ca', tone: 'rgba(99,102,241,0.10)' },
                ].map((p) => (
                  <Box key={p.t} sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.8, px: 1.3, py: 0.7, borderRadius: 999, bgcolor: '#fff', border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 2px 8px rgba(15,23,42,0.04)' }}>
                    <Box sx={{ width: 26, height: 26, borderRadius: '50%', display: 'grid', placeItems: 'center', bgcolor: p.tone, color: p.color }}>{p.icon}</Box>
                    <Typography sx={{ fontSize: 12, fontWeight: 800, color: '#1A1A1E' }}>{p.t}</Typography>
                  </Box>
                ))}
              </Box>

              {/* Stat tiles */}
              <Box sx={{ mt: 2, display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(4, 1fr)' }, gap: 1.2 }}>
                {[
                  { k: '10,000+', v: 'Happy Customers', icon: <GroupsRounded />, color: '#F02A4D', tone: 'rgba(240,42,77,0.10)' },
                  { k: '4.8/5', v: 'Average Rating', icon: <StarRounded />, color: '#B45309', tone: 'rgba(245,158,11,0.14)' },
                  { k: '2–5 Days', v: 'Fast Delivery', icon: <LocalShippingOutlined />, color: '#075985', tone: 'rgba(14,165,233,0.12)' },
                  { k: 'COD', v: 'Available', icon: <PaymentsOutlined />, color: '#166534', tone: 'rgba(34,197,94,0.12)' },
                ].map((s) => (
                  <Box key={s.v} sx={{ display: 'grid', justifyItems: 'center', textAlign: 'center', gap: 0.6, px: 1, py: 1.6, borderRadius: '16px', bgcolor: '#fff', border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 4px 14px rgba(15,23,42,0.04)' }}>
                    <Box sx={{ width: 38, height: 38, borderRadius: '50%', display: 'grid', placeItems: 'center', bgcolor: s.tone, color: s.color }}>{s.icon}</Box>
                    <Typography sx={{ fontWeight: 900, fontSize: 16, lineHeight: 1 }}>{s.k}</Typography>
                    <Typography sx={{ fontSize: 11, color: 'text.secondary', fontWeight: 700, lineHeight: 1.1 }}>{s.v}</Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          </Card>

          <Card elevation={0} sx={{ borderRadius: '24px', border: '1px solid rgba(245,158,11,0.14)', overflow: 'hidden', background: 'linear-gradient(180deg, #FFF9EC 0%, #FFFDF6 100%)' }}>
            <Box sx={{ p: { xs: 2.2, md: 3 } }}>
              <Typography sx={{ fontSize: 11, fontWeight: 900, letterSpacing: 1, textTransform: 'uppercase', color: '#B45309', display: 'inline-flex', alignItems: 'center', gap: 0.6 }}>
                <GppGoodOutlined sx={{ fontSize: 14 }} /> Shop With Confidence
              </Typography>
              <Typography sx={{ fontFamily: 'Georgia, Times New Roman, serif', fontSize: { xs: 22, md: 28 }, fontWeight: 700, mt: 0.5 }}>Your Security, Our Priority</Typography>

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1.2fr 0.8fr' }, gap: 2, alignItems: 'center', mt: 2 }}>
                <Box sx={{ display: 'grid', gap: 1.4 }}>
                  {[
                    { t: 'Easy Returns & Replacement', d: 'Damaged or wrong item? We make it right — fast.' },
                    { t: 'Secure SSL Checkout', d: 'Pay easily with Cash on Delivery.' },
                    { t: 'Real Human Support', d: 'Mon–Sat, 10 AM – 6 PM • khushiyanstore@gmail.com' },
                  ].map((g) => (
                    <Box key={g.t} sx={{ display: 'flex', gap: 1.2, alignItems: 'flex-start' }}>
                      <CheckCircleRounded sx={{ color: '#16a34a', fontSize: 22, mt: 0.2 }} />
                      <Box>
                        <Typography sx={{ fontWeight: 800, fontSize: 14.5, lineHeight: 1.3 }}>{g.t}</Typography>
                        <Typography variant="body2" color="text.secondary">{g.d}</Typography>
                      </Box>
                    </Box>
                  ))}
                </Box>

                <Box sx={{ display: 'grid', justifyItems: 'center', gap: 1.5 }}>
                  <Box sx={{ position: 'relative', width: 120, height: 120, display: 'grid', placeItems: 'center' }}>
                    <Box sx={{ position: 'absolute', inset: 0, borderRadius: '32px', background: 'radial-gradient(circle at 50% 40%, rgba(240,42,77,0.14) 0%, rgba(240,42,77,0.04) 70%)' }} />
                    <GppGoodOutlined sx={{ fontSize: 74, color: '#F02A4D' }} />
                    <CheckCircleRounded sx={{ position: 'absolute', right: 8, bottom: 10, fontSize: 28, color: '#16a34a', bgcolor: '#fff', borderRadius: '50%' }} />
                  </Box>
                  <Box sx={{ px: 2.2, py: 1.1, borderRadius: '16px', bgcolor: '#fff', border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 4px 14px rgba(15,23,42,0.05)', textAlign: 'center' }}>
                    <Typography sx={{ fontWeight: 900, fontSize: 16, lineHeight: 1.1 }}>100%</Typography>
                    <Typography sx={{ fontSize: 11.5, color: 'text.secondary', fontWeight: 700 }}>Safe Shopping</Typography>
                  </Box>
                </Box>
              </Box>
            </Box>
          </Card>
        </Box>

      </Container>

    </Box>
  )
}

