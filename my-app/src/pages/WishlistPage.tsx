import { useEffect, useMemo } from 'react'
import { Box, Button, Container, IconButton, Typography } from '@mui/material'
import { FavoriteRounded, FavoriteBorderRounded, StarRounded, ShoppingCartRounded, EastRounded } from '@mui/icons-material'
import { useProducts, productSlug } from '../lib/products'
import { useWishlist } from '../lib/wishlist'
import { useCart } from '../lib/cart'
import { useToast } from '../lib/toast'
import { useRouter } from '../lib/router'
import { events } from '../analytics'
import { optimizeImage } from '../lib/cloudinary'

const money = (v?: number) => (v == null ? '' : new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v))

export default function WishlistPage() {
  const { products, productsBySlug } = useProducts()
  const { ids, remove } = useWishlist()
  const { add } = useCart()
  const { push } = useToast()
  const { navigate } = useRouter()

  useEffect(() => { document.title = 'My Wishlist — Khushiyan Store' }, [])

  const items = useMemo(() => {
    const all = products.length ? products : Object.values(productsBySlug)
    return all.filter(p => ids.includes(p.id))
  }, [products, productsBySlug, ids])

  return (
    <Box sx={{ background: '#F8FAFC', minHeight: '60vh' }}>
      <Container sx={{ py: { xs: 3, md: 4 } }}>
        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.6, background: '#F2EEFC', color: '#7C3AED', borderRadius: '999px', px: 1.6, py: 0.5, fontSize: 12, fontWeight: 800, mb: 1.25 }}>
            <FavoriteRounded sx={{ fontSize: 14, color: '#EF2B62' }} /> Saved for later
          </Box>
          <Typography component="h1" sx={{ color: '#111827', fontWeight: 800, fontSize: { xs: 24, sm: 28 }, lineHeight: 1.2 }}>
            My Wishlist
          </Typography>
          <Typography sx={{ color: '#6B7280', fontSize: 14, mt: 0.5 }}>
            {items.length > 0 ? `${items.length} ${items.length === 1 ? 'item' : 'items'} saved` : 'Your favourite products, all in one place'}
          </Typography>
        </Box>

        {items.length === 0 ? (
          /* Empty state */
          <Box sx={{ background: '#fff', border: '1px solid #EEF0F3', borderRadius: '20px', p: { xs: 4, sm: 6 }, textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', maxWidth: 520, mx: 'auto' }}>
            <Box sx={{ width: 72, height: 72, borderRadius: '50%', background: '#FDF1F4', display: 'grid', placeItems: 'center', mx: 'auto', mb: 2 }}>
              <FavoriteBorderRounded sx={{ fontSize: 34, color: '#EF2B62' }} />
            </Box>
            <Typography sx={{ fontWeight: 800, color: '#111827', fontSize: 18, mb: 0.75 }}>No favourites yet</Typography>
            <Typography sx={{ color: '#6B7280', fontSize: 14, lineHeight: 1.6, mb: 2.5 }}>
              Tap the ♡ on any product to save it here — then come back anytime to shop your picks.
            </Typography>
            <Button onClick={() => navigate('/featured')} endIcon={<EastRounded />} sx={{ background: '#7C3AED', color: '#fff', textTransform: 'none', fontWeight: 800, borderRadius: '12px', px: 3, py: 1.1, '&:hover': { background: '#6D28D9' } }}>
              Explore Products
            </Button>
          </Box>
        ) : (
          /* Product grid */
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)', md: 'repeat(4, 1fr)' }, gap: { xs: 1.5, sm: 2 } }}>
            {items.map(p => {
              const pct = p.compareAtPrice && p.compareAtPrice > p.price ? Math.round(((p.compareAtPrice - p.price) / p.compareAtPrice) * 100) : null
              return (
                <Box
                  key={p.id}
                  onClick={() => navigate(`/p/${productSlug(p)}`)}
                  sx={{
                    background: '#fff', border: '1px solid #EEF0F3', borderRadius: '16px', overflow: 'hidden', cursor: 'pointer',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.04)', transition: 'box-shadow 0.15s ease, transform 0.15s ease', position: 'relative',
                    display: 'flex', flexDirection: 'column',
                    '&:hover': { boxShadow: '0 6px 16px rgba(0,0,0,0.08)', transform: 'translateY(-2px)' },
                  }}
                >
                  {/* Image */}
                  <Box sx={{ position: 'relative', background: '#F3F4F6' }}>
                    <img src={optimizeImage(p.images?.[0] || '', 'card')} alt={p.title} loading="lazy" style={{ width: '100%', aspectRatio: '1 / 1', objectFit: 'contain', display: 'block' }} />
                    {pct != null && (
                      <Box sx={{ position: 'absolute', top: 8, left: 8, background: '#7C3AED', color: '#fff', borderRadius: '999px', px: 1.1, py: 0.35, fontSize: 11, fontWeight: 800 }}>{pct}% OFF</Box>
                    )}
                    <IconButton
                      size="small"
                      aria-label="Remove from wishlist"
                      onClick={(e) => { e.stopPropagation(); remove(p.id); push('Removed from wishlist') }}
                      sx={{ position: 'absolute', top: 8, right: 8, width: 32, height: 32, bgcolor: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.12)', '&:hover': { bgcolor: '#fff' } }}
                    >
                      <FavoriteRounded sx={{ fontSize: 17, color: '#EF2B62' }} />
                    </IconButton>
                  </Box>
                  {/* Info */}
                  <Box sx={{ p: 1.5, display: 'flex', flexDirection: 'column', gap: 0.5, flex: 1 }}>
                    <Typography sx={{ fontWeight: 700, fontSize: 13.5, color: '#111827', lineHeight: 1.35, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {p.title}
                    </Typography>
                    {(p.ratingCount ?? 0) > 0 && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4 }}>
                        <StarRounded sx={{ fontSize: 15, color: '#F59E0B' }} />
                        <Typography sx={{ fontSize: 12, fontWeight: 700, color: '#374151' }}>{(p.ratingAvg ?? 0).toFixed(1)}</Typography>
                        <Typography sx={{ fontSize: 12, color: '#9CA3AF' }}>({p.ratingCount})</Typography>
                      </Box>
                    )}
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 'auto', pt: 0.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.6, minWidth: 0 }}>
                        <Typography sx={{ fontWeight: 800, fontSize: 15, color: '#111827' }}>{money(p.price)}</Typography>
                        {p.compareAtPrice && p.compareAtPrice > p.price && (
                          <Typography sx={{ fontSize: 12, color: '#9CA3AF', textDecoration: 'line-through' }}>{money(p.compareAtPrice)}</Typography>
                        )}
                      </Box>
                      <IconButton
                        size="small"
                        aria-label="Add to cart"
                        onClick={(e) => { e.stopPropagation(); add({ product: p, quantity: 1 }); events.add_to_cart({ id: p.id, price: p.price }); push('Added to cart 🛒') }}
                        sx={{ width: 32, height: 32, bgcolor: '#7C3AED', color: '#fff', flexShrink: 0, '&:hover': { bgcolor: '#6D28D9' } }}
                      >
                        <ShoppingCartRounded sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Box>
                  </Box>
                </Box>
              )
            })}
          </Box>
        )}
      </Container>
    </Box>
  )
}
