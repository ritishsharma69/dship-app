import { Box, Typography, Chip } from '@mui/material'
import StarRounded from '@mui/icons-material/StarRounded'
import StarBorderRounded from '@mui/icons-material/StarBorderRounded'
import VerifiedOutlined from '@mui/icons-material/VerifiedOutlined'
import LocationOnRounded from '@mui/icons-material/LocationOnRounded'
import FormatQuoteRounded from '@mui/icons-material/FormatQuoteRounded'

export interface Testimonial {
  name: string
  city: string
  quote: string
  rating: number
  img?: string
  accent?: string
}

// Vertical marquee keyframes; paused on hover and disabled for reduced-motion users.
const MARQUEE_CSS = `
@keyframes kh-wall-vertical {
  from { transform: translateY(0); }
  to { transform: translateY(calc(-100% - 16px)); }
}
@media (prefers-reduced-motion: reduce) {
  [data-marquee-group] { animation: none !important; }
}
`

function TCard({ t }: { t: Testimonial }) {
  const accent = t.accent || '#7C3AED'
  return (
    <Box sx={{
      position: 'relative', bgcolor: '#fff', borderRadius: '18px', p: 2, textAlign: 'left',
      border: '1px solid #EEF2F7', boxShadow: '0 8px 24px rgba(15,23,42,0.05)',
      transition: 'transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease',
      '&:hover': { transform: 'translateY(-3px)', borderColor: 'rgba(124,58,237,0.30)', boxShadow: '0 16px 34px rgba(124,58,237,0.12)' },
    }}>
      <FormatQuoteRounded sx={{ position: 'absolute', top: 10, right: 12, fontSize: 40, color: 'rgba(124,58,237,0.10)', transform: 'scaleX(-1)' }} />

      {/* Stars */}
      <Box sx={{ display: 'inline-flex', color: '#F59E0B' }}>
        {Array.from({ length: 5 }).map((_, i) => (
          i < t.rating
            ? <StarRounded key={i} sx={{ fontSize: 16 }} />
            : <StarBorderRounded key={i} sx={{ fontSize: 16, color: 'rgba(120,120,120,0.4)' }} />
        ))}
      </Box>

      {/* Quote */}
      <Typography sx={{ mt: 0.8, fontSize: 13.5, lineHeight: 1.6, color: '#334155', fontWeight: 500 }}>
        “{t.quote}”
      </Typography>

      {/* Footer: avatar + name + city + verified */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, mt: 1.6, pt: 1.4, borderTop: '1px solid #F1F5F9' }}>
        {t.img ? (
          <Box component="img" src={t.img} alt={t.name} loading="lazy"
            sx={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', border: '2px solid #fff', boxShadow: '0 0 0 2px rgba(124,58,237,0.25)' }} />
        ) : (
          <Box sx={{ width: 40, height: 40, borderRadius: '50%', display: 'grid', placeItems: 'center', bgcolor: `${accent}1A`, color: accent, fontWeight: 900, fontSize: 16, boxShadow: '0 0 0 2px rgba(124,58,237,0.15)' }}>
            {t.name.charAt(0)}
          </Box>
        )}
        <Box sx={{ minWidth: 0, flexGrow: 1 }}>
          <Typography sx={{ fontWeight: 800, fontSize: 13, lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.name}</Typography>
          <Typography sx={{ fontSize: 11, color: 'text.secondary', display: 'inline-flex', alignItems: 'center', gap: 0.2, mt: 0.2 }}>
            <LocationOnRounded sx={{ fontSize: 12 }} /> {t.city}
          </Typography>
        </Box>
        <Chip icon={<VerifiedOutlined sx={{ fontSize: '11px !important' }} />} label="Verified" size="small"
          sx={{ height: 20, fontSize: 9.5, fontWeight: 800, bgcolor: 'rgba(34,197,94,0.12)', color: '#166534', flexShrink: 0, '& .MuiChip-icon': { color: '#16a34a', ml: 0.5 }, '& .MuiChip-label': { px: 0.7 } }} />
      </Box>
    </Box>
  )
}

function MarqueeColumn({ items, reverse, duration }: { items: Testimonial[]; reverse?: boolean; duration: number }) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', gap: '16px', height: '100%' }}>
      {[0, 1].map((rep) => (
        <Box key={rep} aria-hidden={rep > 0} data-marquee-group sx={{
          display: 'flex', flexDirection: 'column', gap: '16px', flexShrink: 0,
          animation: `kh-wall-vertical ${duration}s linear infinite`,
          animationDirection: reverse ? 'reverse' : 'normal',
        }}>
          {items.map((t) => <TCard key={t.name} t={t} />)}
        </Box>
      ))}
    </Box>
  )
}

// Rotate the array so each column shows the reviews in a different order.
const rotate = <T,>(arr: T[], by: number) => [...arr.slice(by % arr.length), ...arr.slice(0, by % arr.length)]

/**
 * "Wall of Love" — upright vertical-marquee testimonial wall. Three columns
 * (two on mobile) scroll at different speeds/directions; pauses on hover.
 */
export default function TestimonialsWall({ reviews }: { reviews: Testimonial[] }) {
  return (
    <Box sx={{
      position: 'relative', mt: 3,
      height: { xs: 440, md: 540 },
      display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: '1fr 1fr 1fr' }, gap: 2,
      maskImage: 'linear-gradient(to bottom, transparent 0%, #000 10%, #000 90%, transparent 100%)',
      WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, #000 10%, #000 90%, transparent 100%)',
      '&:hover [data-marquee-group]': { animationPlayState: 'paused' },
    }}>
      <style>{MARQUEE_CSS}</style>
      <MarqueeColumn items={reviews} duration={42} />
      <MarqueeColumn items={rotate(reviews, 2)} reverse duration={50} />
      <Box sx={{ display: { xs: 'none', md: 'contents' } }}>
        <MarqueeColumn items={rotate(reviews, 4)} duration={46} />
      </Box>
    </Box>
  )
}
