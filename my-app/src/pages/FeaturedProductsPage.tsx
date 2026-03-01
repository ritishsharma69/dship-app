import { useMemo, useState } from 'react'
import { Box, Container, Typography, Card, CardContent, IconButton, Skeleton, Chip, Button } from '@mui/material'
import { ArrowBack, Star, ArrowForward, ChevronLeft, ChevronRight, FilterList, GridView, ViewList } from '@mui/icons-material'
import { useProducts, productSlug } from '../lib/products'
import { useRouter } from '../lib/router'

export default function FeaturedProductsPage() {
  const { products, productsBySlug, loading } = useProducts()
  const { navigate } = useRouter()
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [featImgIdx, setFeatImgIdx] = useState<Record<string, number>>({})

  const featured = useMemo(() => {
    const base = products.length ? products : Object.values(productsBySlug)
    return base.map((p) => {
      const slug = productSlug(p)
      const tags = (p.bullets || []).slice(1, 4).filter(Boolean)
      return {
        id: p.id,
        title: p.title,
        price: p.price,
        compareAt: p.compareAtPrice,
        images: p.images || [],
        tags,
        slug: '/p/' + slug,
        available: p.availableQuantity !== 0,
        rating: 4.5 + Math.random() * 0.5,
        reviews: Math.floor(100 + Math.random() * 200),
      }
    })
  }, [products, productsBySlug])

  const handlePrevImg = (id: string, total: number) => {
    setFeatImgIdx(prev => ({ ...prev, [id]: ((prev[id] || 0) - 1 + total) % total }))
  }
  const handleNextImg = (id: string, total: number) => {
    setFeatImgIdx(prev => ({ ...prev, [id]: ((prev[id] || 0) + 1) % total }))
  }

  return (
    <Box sx={{ minHeight: '100vh', background: 'linear-gradient(180deg, #fafafa 0%, #fff 50%, #f5f0eb 100%)' }}>
      {/* Hero Header */}
      <Box sx={{ 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
        py: { xs: 4, md: 6 }, position: 'relative', overflow: 'hidden',
        '&::before': {
          content: '""', position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          background: 'radial-gradient(circle at 20% 80%, rgba(255,255,255,0.2) 0%, transparent 50%)',
        }
      }}>
        <Container>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton onClick={() => navigate('/')} sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: '#fff', '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' } }}>
              <ArrowBack />
            </IconButton>
            <Box>
              <Typography sx={{ fontFamily: 'Georgia, serif', fontSize: { xs: 28, md: 38 }, fontWeight: 700, color: '#fff', textShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                Featured Products ✨
              </Typography>
              <Typography sx={{ color: 'rgba(255,255,255,0.9)', fontSize: { xs: 14, md: 16 }, mt: 0.5 }}>
                Handpicked bestsellers curated just for you
              </Typography>
            </Box>
          </Box>
        </Container>
      </Box>

      <Container sx={{ py: { xs: 3, md: 4 } }}>
        {/* Toolbar */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip label={`${featured.length} Products`} sx={{ bgcolor: '#667eea', color: '#fff', fontWeight: 600 }} />
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <IconButton onClick={() => setViewMode('grid')} sx={{ bgcolor: viewMode === 'grid' ? '#667eea' : '#f0f0f0', color: viewMode === 'grid' ? '#fff' : '#666', '&:hover': { bgcolor: viewMode === 'grid' ? '#5a67d8' : '#e0e0e0' } }}>
              <GridView />
            </IconButton>
            <IconButton onClick={() => setViewMode('list')} sx={{ bgcolor: viewMode === 'list' ? '#667eea' : '#f0f0f0', color: viewMode === 'list' ? '#fff' : '#666', '&:hover': { bgcolor: viewMode === 'list' ? '#5a67d8' : '#e0e0e0' } }}>
              <ViewList />
            </IconButton>
          </Box>
        </Box>

        {/* Products Grid/List */}
        {loading && featured.length === 0 ? (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)', lg: 'repeat(4, 1fr)' }, gap: 2.5 }}>
            {[1,2,3,4,5,6,7,8].map(i => (
              <Card key={i} elevation={0} sx={{ borderRadius: 4, overflow: 'hidden', border: '1px solid rgba(0,0,0,0.06)' }}>
                <Skeleton variant="rectangular" height={280} animation="wave" />
                <CardContent><Skeleton width="60%" /><Skeleton width="40%" /></CardContent>
              </Card>
            ))}
          </Box>
        ) : (
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: viewMode === 'grid' 
              ? { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)', lg: 'repeat(4, 1fr)' }
              : '1fr',
            gap: viewMode === 'grid' ? 2.5 : 2 
          }}>
            {featured.map((p) => {
              const price = Number(p.price || 0)
              const compareAt = Number(p.compareAt || 0)
              const pct = compareAt > price && compareAt > 0 ? Math.round(((compareAt - price) / compareAt) * 100) : 0
              const currentImg = featImgIdx[p.id] || 0

              if (viewMode === 'list') {
                return (
                  <Card key={p.id} elevation={0} onClick={() => navigate(p.slug)} sx={{ 
                    borderRadius: 3, overflow: 'hidden', cursor: 'pointer', 
                    border: '1px solid rgba(0,0,0,0.06)', display: 'flex', 
                    transition: 'all 0.3s ease', '&:hover': { boxShadow: '0 8px 30px rgba(0,0,0,0.12)', transform: 'translateY(-2px)' }
                  }}>
                    <Box sx={{ width: 200, height: 160, flexShrink: 0, position: 'relative', bgcolor: '#f8f8f8' }}>
                      {p.images[0] && <Box component="img" src={p.images[0]} alt={p.title} sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                      {pct > 0 && <Chip label={`${pct}% OFF`} size="small" sx={{ position: 'absolute', top: 8, right: 8, bgcolor: '#ef4444', color: '#fff', fontWeight: 700, fontSize: 11 }} />}
                    </Box>
                    <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', p: 2.5 }}>
                      <Typography sx={{ fontWeight: 700, fontSize: 16, mb: 0.5, color: '#1a1a2e' }}>{p.title}</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                        {[...Array(5)].map((_, i) => <Star key={i} sx={{ fontSize: 14, color: i < Math.floor(p.rating) ? '#fbbf24' : '#e5e7eb' }} />)}
                        <Typography sx={{ fontSize: 12, color: '#666', ml: 0.5 }}>{p.reviews}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography sx={{ fontWeight: 800, fontSize: 20, color: '#1a1a2e' }}>₹{price.toLocaleString()}</Typography>
                        {compareAt > price && <Typography sx={{ fontSize: 14, color: '#999', textDecoration: 'line-through' }}>₹{compareAt.toLocaleString()}</Typography>}
                      </Box>
                    </CardContent>
                  </Card>
                )
              }

              return (
                <Card key={p.id} elevation={0} sx={{ 
                  borderRadius: 4, overflow: 'hidden', cursor: 'pointer',
                  border: '1px solid rgba(0,0,0,0.06)', bgcolor: '#fff',
                  transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': { boxShadow: '0 20px 50px rgba(0,0,0,0.15)', transform: 'translateY(-8px)' }
                }}>
                  {/* Image Section */}
                  <Box sx={{ position: 'relative', height: 280, bgcolor: '#f8f8f8', overflow: 'hidden' }} onClick={() => navigate(p.slug)}>
                    {p.images[currentImg] ? (
                      <Box component="img" src={p.images[currentImg]} alt={p.title} sx={{ 
                        width: '100%', height: '100%', objectFit: 'cover',
                        transition: 'transform 0.5s ease', '&:hover': { transform: 'scale(1.05)' }
                      }} />
                    ) : (
                      <Box sx={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center' }}>
                        <Typography sx={{ color: '#999' }}>No Image</Typography>
                      </Box>
                    )}
                    {/* Discount Badge */}
                    {pct > 0 && (
                      <Chip label={`${pct}% OFF`} size="small" sx={{ 
                        position: 'absolute', top: 12, right: 12, 
                        bgcolor: '#ef4444', color: '#fff', fontWeight: 800, fontSize: 11,
                        boxShadow: '0 4px 12px rgba(239, 68, 68, 0.4)'
                      }} />
                    )}
                    {/* Image Navigation */}
                    {p.images.length > 1 && (
                      <>
                        <IconButton size="small" onClick={(e) => { e.stopPropagation(); handlePrevImg(p.id, p.images.length) }} sx={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', bgcolor: 'rgba(255,255,255,0.9)', '&:hover': { bgcolor: '#fff' }, width: 32, height: 32 }}>
                          <ChevronLeft sx={{ fontSize: 18 }} />
                        </IconButton>
                        <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleNextImg(p.id, p.images.length) }} sx={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', bgcolor: 'rgba(255,255,255,0.9)', '&:hover': { bgcolor: '#fff' }, width: 32, height: 32 }}>
                          <ChevronRight sx={{ fontSize: 18 }} />
                        </IconButton>
                        {/* Dots */}
                        <Box sx={{ position: 'absolute', bottom: 10, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 0.5 }}>
                          {p.images.map((_, di) => (
                            <Box key={di} sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: di === currentImg ? '#667eea' : 'rgba(255,255,255,0.7)', transition: 'all 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                          ))}
                        </Box>
                      </>
                    )}
                  </Box>

                  {/* Content */}
                  <CardContent sx={{ p: 2 }} onClick={() => navigate(p.slug)}>
                    {/* Tags */}
                    {p.tags.length > 0 && (
                      <Typography sx={{ fontSize: 11, color: '#667eea', fontWeight: 600, mb: 0.5, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        {p.tags[0]}
                      </Typography>
                    )}
                    <Typography sx={{ fontWeight: 700, fontSize: 15, mb: 0.8, color: '#1a1a2e', lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {p.title}
                    </Typography>
                    
                    {/* Rating */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} sx={{ fontSize: 14, color: i < Math.floor(p.rating) ? '#fbbf24' : '#e5e7eb' }} />
                      ))}
                      <Typography sx={{ fontSize: 12, color: '#666', ml: 0.3 }}>{p.reviews}</Typography>
                    </Box>

                    {/* Price */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 'auto' }}>
                      <Typography sx={{ fontWeight: 900, fontSize: 20, color: '#1a1a2e' }}>₹{price.toLocaleString()}</Typography>
                      {compareAt > price && (
                        <Typography sx={{ fontSize: 14, color: '#999', textDecoration: 'line-through' }}>₹{compareAt.toLocaleString()}</Typography>
                      )}
                    </Box>

                    {/* Shop Button */}
                    <Button fullWidth variant="contained" endIcon={<ArrowForward />} sx={{ 
                      mt: 1.5, borderRadius: 2.5, py: 1, fontWeight: 700, fontSize: 13, textTransform: 'none',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      boxShadow: '0 4px 15px rgba(102, 126, 234, 0.35)',
                      '&:hover': { background: 'linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%)', boxShadow: '0 6px 20px rgba(102, 126, 234, 0.45)' }
                    }}>
                      View Product
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </Box>
        )}
      </Container>
    </Box>
  )
}

