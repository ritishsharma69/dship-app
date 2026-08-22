import { useEffect, useMemo, useState } from 'react'
import { Box, Container, Typography, Card, IconButton, Skeleton, Button, Menu, MenuItem } from '@mui/material'
import {
  StarRounded, ChevronLeft, ChevronRight, FavoriteBorderRounded, FavoriteRounded,
  ShoppingCartRounded, GridViewRounded, FilterAltOutlined, SwapVertRounded, KeyboardArrowDownRounded,
  VerifiedUserOutlined, CachedRounded, KitchenOutlined, HomeOutlined, SpaOutlined,
  DevicesOutlined, LocalMallOutlined, VisibilityOutlined,
} from '@mui/icons-material'
import { useProducts, productSlug } from '../lib/products'
import { useWishlist } from '../lib/wishlist'
import { useRouter } from '../lib/router'
import { optimizeImage } from '../lib/cloudinary'

const CATEGORIES = [
  { label: 'Kitchen', icon: KitchenOutlined },
  { label: 'Home & Living', icon: HomeOutlined },
  { label: 'Beauty', icon: SpaOutlined },
  { label: 'Health', icon: FavoriteBorderRounded },
  { label: 'Electronics', icon: DevicesOutlined },
  { label: 'Accessories', icon: LocalMallOutlined },
] as const

// Derive a display category from the product title (products have no category field).
function categoryOf(title: string): string {
  const t = (title || '').toLowerCase()
  if (/(juicer|blender|tumbler|bottle|mixer|chopper|kitchen|cook|mug|flask)/.test(t)) return 'Kitchen'
  if (/(scalp|massag|therapy|posture|relief|health)/.test(t)) return 'Health'
  if (/(serum|skin|beauty|makeup|facial|cream|lipstick)/.test(t)) return 'Beauty'
  if (/(lamp|light|decor|cushion|candle|vase|table|home)/.test(t)) return 'Home & Living'
  if (/(charger|earbud|headphone|speaker|smart|watch|cable|usb|electronic)/.test(t)) return 'Electronics'
  return 'Accessories'
}

// Deterministic pseudo-random rating per product (stable across renders).
function seeded(id: string) {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0
  const a = Math.abs(h)
  return { rating: 4.3 + (a % 7) / 10, reviews: 120 + (a % 180) }
}

export default function FeaturedProductsPage() {
  const { products, productsBySlug, loading } = useProducts()
  const { navigate } = useRouter()
  useEffect(() => { document.title = 'Featured Products — Khushiyan Store | Bestsellers & Trending' }, [])
  const { has: isWished, toggle: toggleWish } = useWishlist()
  const [activeCat, setActiveCat] = useState('All Products')
  const [sortBy, setSortBy] = useState<'featured' | 'price_asc' | 'price_desc'>('featured')
  const [sortAnchor, setSortAnchor] = useState<null | HTMLElement>(null)
  const [featImgIdx, setFeatImgIdx] = useState<Record<string, number>>({})

  const featured = useMemo(() => {
    const base = products.length ? products : Object.values(productsBySlug)
    return base.map((p) => {
      const slug = productSlug(p)
      const { rating, reviews } = seeded(p.id)
      return {
        id: p.id,
        title: p.title,
        price: p.price,
        compareAt: p.compareAtPrice,
        images: p.images || [],
        heroImage: (p.heroImages && p.heroImages[0]) || (p.images || [])[0] || '',
        cardImage: (p.cardImages && p.cardImages[0]) || '',
        category: categoryOf(p.title),
        slug: '/p/' + slug,
        available: p.inventoryStatus !== 'OUT_OF_STOCK',
        rating,
        reviews,
      }
    })
  }, [products, productsBySlug])

  const visible = useMemo(() => {
    const list = activeCat === 'All Products' ? featured : featured.filter((p) => p.category === activeCat)
    if (sortBy === 'price_asc') return [...list].sort((a, b) => Number(a.price || 0) - Number(b.price || 0))
    if (sortBy === 'price_desc') return [...list].sort((a, b) => Number(b.price || 0) - Number(a.price || 0))
    return list
  }, [featured, activeCat, sortBy])

  const handlePrevImg = (id: string, total: number) => {
    setFeatImgIdx(prev => ({ ...prev, [id]: ((prev[id] || 0) - 1 + total) % total }))
  }
  const handleNextImg = (id: string, total: number) => {
    setFeatImgIdx(prev => ({ ...prev, [id]: ((prev[id] || 0) + 1) % total }))
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#fff' }}>
      {/* Hero banner — rounded, inside container (mockup style) */}
      <Container sx={{ pt: { xs: 2, md: 2.5 } }}>
        <Box sx={{
          position: 'relative', borderRadius: { xs: 3, md: 3 }, overflow: 'hidden',
          background: 'linear-gradient(100deg, #5B3FC4 0%, #7C4FD8 32%, #A458E8 64%, #E687C8 100%)',
          px: { xs: 2.5, md: 8 }, py: { xs: 3.5, md: 4.5 },
          '&::before': {
            content: '""', position: 'absolute', inset: 0,
            background: 'radial-gradient(circle at 78% 22%, rgba(255,255,255,0.20) 0%, transparent 45%), radial-gradient(circle at 12% 90%, rgba(255,255,255,0.10) 0%, transparent 40%)',
          },
        }}>
          {/* Right: banner artwork — full composition visible (no crop), blended into the gradient with a left fade (mockup) */}
          <Box sx={{ display: { xs: 'none', md: 'flex' }, justifyContent: 'flex-end', position: 'absolute', top: 0, right: 0, bottom: 0, width: '52%', pointerEvents: 'none', overflow: 'hidden' }}>
            <Box component="img" src="/homepagebannerlogo.png" alt="Up to 50% off — featured products" sx={{
              height: '100%', width: 'auto', display: 'block',
              WebkitMaskImage: 'linear-gradient(to right, transparent 0%, #000 32%)',
              maskImage: 'linear-gradient(to right, transparent 0%, #000 32%)',
            }} />
          </Box>
          <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 3, minHeight: { md: 235 } }}>
            {/* Left: copy — extra left padding so it clears the carousel arrow */}
            <Box sx={{ flex: 1, minWidth: 0, pl: { xs: 0, md: 3.5 }, maxWidth: { md: '56%' } }}>
              <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.7, px: 1.5, py: 0.55, borderRadius: 999, bgcolor: 'rgba(255,255,255,0.16)', border: '1px solid rgba(255,255,255,0.25)', mb: 1.5 }}>
                <StarRounded sx={{ fontSize: 14, color: '#FBBF24' }} />
                <Typography sx={{ fontSize: 11.5, fontWeight: 700, color: '#fff', letterSpacing: 0.3, lineHeight: 1 }}>Handpicked For You</Typography>
              </Box>
              <Typography sx={{ fontFamily: 'Georgia, serif', fontSize: { xs: 25, sm: 34, md: 42 }, fontWeight: 700, color: '#fff', lineHeight: 1.1, whiteSpace: 'nowrap', textShadow: '0 2px 6px rgba(0,0,0,0.12)' }}>
                Featured Products ✨
              </Typography>
              <Typography sx={{ color: 'rgba(255,255,255,0.92)', fontSize: { xs: 13, md: 16.5 }, mt: 1 }}>
                Premium quality products curated just for you
              </Typography>
              {/* Trust items */}
              <Box sx={{ display: 'flex', gap: { xs: 1.5, sm: 2.5, md: 4.5 }, mt: { xs: 2.5, md: 3.5 }, flexWrap: 'wrap' }}>
                {[
                  { icon: <VerifiedUserOutlined sx={{ fontSize: { xs: 16, md: 19 } }} />, l1: '100% Original', l2: 'Products' },
                  { icon: <CachedRounded sx={{ fontSize: { xs: 16, md: 19 } }} />, l1: 'Easy Returns', l2: 'No Questions' },
                  { icon: <FavoriteBorderRounded sx={{ fontSize: { xs: 16, md: 19 } }} />, l1: 'Loved by', l2: 'Thousands' },
                ].map((t, i) => (
                  <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.7, md: 1 }, color: 'rgba(255,255,255,0.95)' }}>
                    {t.icon}
                    <Typography sx={{ fontSize: { xs: 10.5, md: 12 }, fontWeight: 600, lineHeight: 1.35, color: 'rgba(255,255,255,0.92)', whiteSpace: 'nowrap' }}>
                      {t.l1}<br />{t.l2}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          </Box>
        </Box>
      </Container>

      <Container sx={{ py: { xs: 2.5, md: 3 } }}>
        {/* Category chips + count + Filter/Sort (mockup toolbar) */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 1.2 }}>
          <Box onClick={() => setActiveCat('All Products')} sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.8, px: 1.8, py: 0.9, borderRadius: 999, cursor: 'pointer', bgcolor: activeCat === 'All Products' ? '#7C3AED' : '#fff', color: activeCat === 'All Products' ? '#fff' : '#374151', border: '1px solid', borderColor: activeCat === 'All Products' ? '#7C3AED' : '#E5E7EB', boxShadow: activeCat === 'All Products' ? '0 6px 16px rgba(124,58,237,0.30)' : 'none', transition: 'all 0.2s' }}>
            <GridViewRounded sx={{ fontSize: 15 }} />
            <Typography sx={{ fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap', lineHeight: 1 }}>All Products</Typography>
          </Box>
          {CATEGORIES.map((c) => {
            const Icon = c.icon
            const on = activeCat === c.label
            return (
              <Box key={c.label} onClick={() => setActiveCat(on ? 'All Products' : c.label)} sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.8, px: 1.8, py: 0.9, borderRadius: 999, cursor: 'pointer', bgcolor: on ? '#7C3AED' : '#fff', color: on ? '#fff' : '#374151', border: '1px solid', borderColor: on ? '#7C3AED' : '#E5E7EB', boxShadow: on ? '0 6px 16px rgba(124,58,237,0.30)' : 'none', transition: 'all 0.2s', '&:hover': { borderColor: '#7C3AED' } }}>
                <Icon sx={{ fontSize: 15 }} />
                <Typography sx={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', lineHeight: 1 }}>{c.label}</Typography>
              </Box>
            )
          })}
          <Box sx={{ width: 30, height: 30, borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', bgcolor: '#fff', border: '1px solid #E5E7EB', color: '#6B7280', flexShrink: 0, '&:hover': { borderColor: '#7C3AED', color: '#7C3AED' } }}>
            <ChevronRight sx={{ fontSize: 17 }} />
          </Box>
          <Box sx={{ flexGrow: 1 }} />
          <Typography sx={{ fontSize: 13, color: '#6B7280', fontWeight: 600, whiteSpace: 'nowrap' }}>{visible.length} Products</Typography>
          <Button onClick={() => setActiveCat('All Products')} startIcon={<FilterAltOutlined sx={{ fontSize: '17px !important' }} />} sx={{ px: 1.8, py: 0.7, borderRadius: 999, textTransform: 'none', fontSize: 13, fontWeight: 700, color: '#374151', bgcolor: '#fff', border: '1px solid #E5E7EB', '&:hover': { borderColor: '#7C3AED', bgcolor: '#fff' } }}>Filter</Button>
          <Button onClick={(e) => setSortAnchor(e.currentTarget)} startIcon={<SwapVertRounded sx={{ fontSize: '17px !important' }} />} endIcon={<KeyboardArrowDownRounded sx={{ fontSize: '17px !important' }} />} sx={{ px: 1.8, py: 0.7, borderRadius: 999, textTransform: 'none', fontSize: 13, fontWeight: 700, color: '#374151', bgcolor: '#fff', border: '1px solid #E5E7EB', '&:hover': { borderColor: '#7C3AED', bgcolor: '#fff' } }}>Sort</Button>
          <Menu anchorEl={sortAnchor} open={Boolean(sortAnchor)} onClose={() => setSortAnchor(null)}>
            <MenuItem selected={sortBy === 'featured'} onClick={() => { setSortBy('featured'); setSortAnchor(null) }}>Featured</MenuItem>
            <MenuItem selected={sortBy === 'price_asc'} onClick={() => { setSortBy('price_asc'); setSortAnchor(null) }}>Price: Low to High</MenuItem>
            <MenuItem selected={sortBy === 'price_desc'} onClick={() => { setSortBy('price_desc'); setSortAnchor(null) }}>Price: High to Low</MenuItem>
          </Menu>
        </Box>

        {/* Products Grid */}
        {loading && featured.length === 0 ? (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)', lg: 'repeat(4, 1fr)' }, gap: 2.5 }}>
            {[1,2,3,4,5,6,7,8].map(i => (
              <Card key={i} elevation={0} sx={{ borderRadius: 4, overflow: 'hidden', border: '1px solid #EEF0F3', p: 1.5 }}>
                <Skeleton variant="rounded" height={225} animation="wave" sx={{ borderRadius: 3 }} />
                <Box sx={{ px: 0.5, pt: 1.5 }}><Skeleton width="60%" /><Skeleton width="40%" /></Box>
              </Card>
            ))}
          </Box>
        ) : visible.length === 0 ? (
          <Box sx={{ py: 8, textAlign: 'center' }}>
            <Typography sx={{ fontSize: 16, fontWeight: 600, color: '#6B7280' }}>No products in this category yet</Typography>
            <Button onClick={() => setActiveCat('All Products')} sx={{ mt: 1.5, textTransform: 'none', fontWeight: 700, color: '#7C3AED' }}>View all products</Button>
          </Box>
        ) : (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)', lg: 'repeat(4, 1fr)' }, gap: 2.5 }}>
            {visible.map((p) => {
              const price = Number(p.price || 0)
              const compareAt = Number(p.compareAt || 0)
              const pct = compareAt > price && compareAt > 0 ? Math.round(((compareAt - price) / compareAt) * 100) : 0
              const currentImg = featImgIdx[p.id] || 0

              return (
                <Card key={p.id} elevation={0} sx={{
                  borderRadius: '16px', overflow: 'hidden', cursor: 'pointer', bgcolor: '#fff',
                  border: '1px solid #EEF0F3', p: 1.5, display: 'flex', flexDirection: 'column',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': { boxShadow: '0 18px 40px rgba(17,24,39,0.10)', transform: 'translateY(-6px)', borderColor: '#E4DBFA' },
                  '&:hover .quick-eye': { opacity: 1, transform: 'translateY(0)' },
                }}>
                  {/* Image (inset, rounded — mockup style). Primary image uses the AI-outpainted
                      square (fills edge-to-edge); gallery images fall back to contain. */}
                  <Box sx={{ position: 'relative', height: 225, bgcolor: '#fff', borderRadius: '12px', overflow: 'hidden' }} onClick={() => navigate(p.slug)}>
                    {p.images[currentImg] ? (
                      <Box component="img"
                        src={optimizeImage(currentImg === 0 && p.cardImage ? p.cardImage : p.images[currentImg], 'card')}
                        alt={p.title} sx={{
                          width: '100%', height: '100%',
                          objectFit: currentImg === 0 && p.cardImage ? 'cover' : 'contain',
                          p: currentImg === 0 && p.cardImage ? 0 : 1,
                          transition: 'transform 0.45s ease', '&:hover': { transform: 'scale(1.06)' },
                        }} />
                    ) : (
                      <Box sx={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center' }}>
                        <Typography sx={{ color: '#9CA3AF', fontSize: 13 }}>No Image</Typography>
                      </Box>
                    )}
                    {/* Discount badge — top-left (mockup) */}
                    {pct > 0 && (
                      <Box sx={{ position: 'absolute', top: 10, left: 10, px: 1.1, py: 0.45, borderRadius: 999, bgcolor: '#F43F5E', boxShadow: '0 4px 12px rgba(244,63,94,0.38)' }}>
                        <Typography sx={{ fontSize: 11, fontWeight: 800, color: '#fff', lineHeight: 1.2 }}>{pct}% OFF</Typography>
                      </Box>
                    )}
                    {/* Wishlist — top-right (mockup) */}
                    <IconButton size="small" onClick={(e) => { e.stopPropagation(); toggleWish(p.id) }} sx={{
                      position: 'absolute', top: 8, right: 8, width: 32, height: 32,
                      bgcolor: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.12)', '&:hover': { bgcolor: '#fff' },
                    }}>
                      {isWished(p.id)
                        ? <FavoriteRounded sx={{ fontSize: 17, color: '#F43F5E' }} />
                        : <FavoriteBorderRounded sx={{ fontSize: 17, color: '#374151' }} />}
                    </IconButton>
                    {/* Quick-view eye — bottom-right, shows on hover (mockup) */}
                    <Box className="quick-eye" onClick={(e) => { e.stopPropagation(); navigate(p.slug) }} sx={{
                      position: 'absolute', bottom: 8, right: 8, width: 32, height: 32, borderRadius: '50%',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      bgcolor: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.14)',
                      opacity: 0, transform: 'translateY(6px)', transition: 'all 0.25s ease',
                    }}>
                      <VisibilityOutlined sx={{ fontSize: 17, color: '#374151' }} />
                    </Box>
                    {/* Image navigation */}
                    {p.images.length > 1 && (
                      <>
                        <IconButton size="small" onClick={(e) => { e.stopPropagation(); handlePrevImg(p.id, p.images.length) }} sx={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', bgcolor: 'rgba(255,255,255,0.92)', '&:hover': { bgcolor: '#fff' }, width: 28, height: 28 }}>
                          <ChevronLeft sx={{ fontSize: 17 }} />
                        </IconButton>
                        <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleNextImg(p.id, p.images.length) }} sx={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', bgcolor: 'rgba(255,255,255,0.92)', '&:hover': { bgcolor: '#fff' }, width: 28, height: 28 }}>
                          <ChevronRight sx={{ fontSize: 17 }} />
                        </IconButton>
                        <Box sx={{ position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 0.5 }}>
                          {p.images.map((_, di) => (
                            <Box key={di} sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: di === currentImg ? '#7C3AED' : 'rgba(255,255,255,0.8)', transition: 'all 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                          ))}
                        </Box>
                      </>
                    )}
                  </Box>

                  {/* Content */}
                  <Box sx={{ px: 0.5, pt: 1.5, pb: 0.5, display: 'flex', flexDirection: 'column', flexGrow: 1 }} onClick={() => navigate(p.slug)}>
                    <Typography sx={{ fontSize: 11, color: '#7C3AED', fontWeight: 700, mb: 0.4, textTransform: 'uppercase', letterSpacing: 0.6 }}>
                      {p.category}
                    </Typography>
                    <Typography sx={{ fontWeight: 700, fontSize: 15, mb: 0.7, color: '#111827', lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {p.title}
                    </Typography>

                    {/* Rating */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3, mb: 1.2 }}>
                      {[...Array(5)].map((_, i) => (
                        <StarRounded key={i} sx={{ fontSize: 16, color: i < Math.round(p.rating) ? '#F59E0B' : '#E5E7EB' }} />
                      ))}
                      <Typography sx={{ fontSize: 12, color: '#6B7280', ml: 0.4, fontWeight: 600 }}>({p.reviews})</Typography>
                    </Box>

                    {/* Price + cart button (mockup) */}
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 'auto' }}>
                      <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.8 }}>
                        <Typography sx={{ fontWeight: 800, fontSize: 19, color: '#111827' }}>₹{price.toLocaleString()}</Typography>
                        {compareAt > price && (
                          <Typography sx={{ fontSize: 13, color: '#9CA3AF', textDecoration: 'line-through' }}>₹{compareAt.toLocaleString()}</Typography>
                        )}
                      </Box>
                      <IconButton onClick={(e) => { e.stopPropagation(); navigate(p.slug) }} sx={{
                        width: 40, height: 40, borderRadius: 2.5,
                        background: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)', color: '#fff',
                        boxShadow: '0 6px 16px rgba(124,58,237,0.35)',
                        '&:hover': { background: 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)' },
                      }}>
                        <ShoppingCartRounded sx={{ fontSize: 19 }} />
                      </IconButton>
                    </Box>
                  </Box>
                </Card>
              )
            })}
          </Box>
        )}
      </Container>
    </Box>
  )
}

