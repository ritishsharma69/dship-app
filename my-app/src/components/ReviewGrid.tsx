import { memo, useMemo } from 'react'
import { useProducts } from '../lib/products'
import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { Star, StarHalf, CheckCircle } from '@mui/icons-material'

const AVATAR_COLORS = [
  'linear-gradient(135deg, #7C3AED 0%, #A855F7 100%)',
  'linear-gradient(135deg, #EF2B62 0%, #F472B6 100%)',
  'linear-gradient(135deg, #0EA5E9 0%, #38BDF8 100%)',
  'linear-gradient(135deg, #16A34A 0%, #4ADE80 100%)',
  'linear-gradient(135deg, #EA7A23 0%, #FBBF24 100%)',
]

function ReviewGridInner() {
  const { productsBySlug } = useProducts()
  const slug = (typeof window !== 'undefined' ? (window.location.pathname.split('/').filter(Boolean)[1]) : '') || ''
  const product = productsBySlug[slug]
  const items = useMemo(() => (product?.testimonials ?? []).slice(0, 20), [product])
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 1.75, textAlign: 'left' }}>
      {items.map((t, i) => (
        <Box
          key={i}
          sx={{
            background: '#fff',
            border: '1px solid #EEF0F3',
            borderRadius: '16px',
            p: 2,
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            display: 'flex',
            flexDirection: 'column',
            transition: 'box-shadow 0.15s ease, transform 0.15s ease',
            '&:hover': { boxShadow: '0 6px 16px rgba(0,0,0,0.08)', transform: 'translateY(-2px)' },
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1.25} sx={{ mb: 1.25 }}>
            <Box
              sx={{
                width: 38,
                height: 38,
                borderRadius: '50%',
                background: AVATAR_COLORS[i % AVATAR_COLORS.length],
                color: '#fff',
                display: 'grid',
                placeItems: 'center',
                fontSize: 14,
                fontWeight: 800,
                flexShrink: 0,
              }}
            >
              {t.author.trim().charAt(0).toUpperCase()}
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{ fontWeight: 800, fontSize: 13.5, color: '#111827', lineHeight: 1.3 }}>{t.author}</Typography>
              <Stack direction="row" alignItems="center" spacing={0.4}>
                <CheckCircle sx={{ fontSize: 12, color: '#16A34A' }} />
                <Typography sx={{ fontSize: 11, color: '#16A34A', fontWeight: 700 }}>Verified Buyer</Typography>
              </Stack>
            </Box>
          </Stack>
          <Stack direction="row" spacing={0.2} sx={{ mb: 1 }}>
            {Array.from({ length: 5 }).map((_, s) => {
              const rating = t.rating ?? 5
              const isHalf = rating > s && rating < s + 1
              const isFull = rating > s + 0.5
              return isHalf ? (
                <StarHalf key={s} sx={{ fontSize: 15, color: '#F59E0B' }} />
              ) : (
                <Star key={s} sx={{ fontSize: 15, color: isFull ? '#F59E0B' : '#E5E7EB' }} />
              )
            })}
          </Stack>
          <Typography sx={{ color: '#374151', fontSize: 13.5, lineHeight: 1.55 }}>“{t.quote}”</Typography>
        </Box>
      ))}
    </Box>
  )
}

export default memo(ReviewGridInner)
