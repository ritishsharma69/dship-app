import { Box, Typography, Chip } from '@mui/material'
import StarRounded from '@mui/icons-material/StarRounded'
import StarBorderRounded from '@mui/icons-material/StarBorderRounded'
import VerifiedOutlined from '@mui/icons-material/VerifiedOutlined'
import LocationOnRounded from '@mui/icons-material/LocationOnRounded'

export interface Testimonial {
  name: string
  city: string
  quote: string
  rating: number
  img?: string
  accent?: string
}

// Keyframes for the vertical marquee (ported from the Tailwind marquee component)
const MARQUEE_CSS = `
@keyframes kh-marquee-vertical {
  from { transform: translateY(0); }
  to { transform: translateY(calc(-100% - 16px)); }
}
`

function TCard({ t }: { t: Testimonial }) {
  const accent = t.accent || '#F02A4D'
  return (
    <Box sx={{
      width: 230, flexShrink: 0, bgcolor: '#fff', borderRadius: '16px',
      border: '1px solid rgba(0,0,0,0.07)', boxShadow: '0 6px 18px rgba(15,23,42,0.06)', p: 1.8,
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.1 }}>
        {t.img ? (
          <Box component="img" src={t.img} alt={t.name} loading="lazy"
            sx={{ width: 38, height: 38, borderRadius: '50%', objectFit: 'cover', border: '2px solid #fff', boxShadow: '0 2px 8px rgba(0,0,0,0.14)' }} />
        ) : (
          <Box sx={{ width: 38, height: 38, borderRadius: '50%', display: 'grid', placeItems: 'center', bgcolor: `${accent}1F`, color: accent, fontWeight: 900, fontSize: 15 }}>
            {t.name.charAt(0)}
          </Box>
        )}
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ fontWeight: 800, fontSize: 13, lineHeight: 1.2, whiteSpace: 'nowrap' }}>{t.name}</Typography>
          <Typography sx={{ fontSize: 11, color: 'text.secondary', display: 'inline-flex', alignItems: 'center', gap: 0.2, mt: 0.2 }}>
            <LocationOnRounded sx={{ fontSize: 12 }} /> {t.city}
          </Typography>
        </Box>
        <Box sx={{ flexGrow: 1 }} />
        <Chip icon={<VerifiedOutlined sx={{ fontSize: '11px !important' }} />} label="Verified" size="small"
          sx={{ height: 20, fontSize: 9.5, fontWeight: 800, bgcolor: 'rgba(34,197,94,0.12)', color: '#166534', '& .MuiChip-icon': { color: '#16a34a', ml: 0.5 }, '& .MuiChip-label': { px: 0.7 } }} />
      </Box>
      <Box sx={{ display: 'inline-flex', mt: 1, color: '#F59E0B' }}>
        {Array.from({ length: 5 }).map((_, i) => (
          i < t.rating
            ? <StarRounded key={i} sx={{ fontSize: 15 }} />
            : <StarBorderRounded key={i} sx={{ fontSize: 15, color: 'rgba(120,120,120,0.45)' }} />
        ))}
      </Box>
      <Typography sx={{ mt: 0.6, fontSize: 12.5, lineHeight: 1.55, color: '#2b2b2b' }}>
        “{t.quote}”
      </Typography>
    </Box>
  )
}

function MarqueeColumn({ items, reverse, duration }: { items: Testimonial[]; reverse?: boolean; duration: number }) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', gap: '16px', height: '100%' }}>
      {[0, 1, 2].map((rep) => (
        <Box key={rep} data-marquee-group sx={{
          display: 'flex', flexDirection: 'column', gap: '16px', flexShrink: 0,
          animation: `kh-marquee-vertical ${duration}s linear infinite`,
          animationDirection: reverse ? 'reverse' : 'normal',
        }}>
          {items.map((t) => <TCard key={t.name} t={t} />)}
        </Box>
      ))}
    </Box>
  )
}

/**
 * 3D vertical-marquee testimonials wall (ported from the shadcn/Tailwind
 * "3d-testimonials" component to plain CSS + MUI for this codebase).
 */
export default function Testimonials3D({ reviews }: { reviews: Testimonial[] }) {
  return (
    <Box sx={{
      position: 'relative', borderRadius: '20px', overflow: 'hidden',
      border: '1px solid rgba(0,0,0,0.06)',
      background: 'linear-gradient(160deg, #FFF5F6 0%, #FFFDF8 55%, #FDF2F8 100%)',
      height: { xs: 380, md: 480 },
      display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      perspective: '300px',
      '&:hover [data-marquee-group]': { animationPlayState: 'paused' },
    }}>
      <style>{MARQUEE_CSS}</style>
      <Box sx={{
        display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '16px', height: '110%',
        transform: 'translateX(-100px) translateY(0px) translateZ(-100px) rotateX(20deg) rotateY(-10deg) rotateZ(20deg)',
      }}>
        <MarqueeColumn items={reviews} duration={40} />
        <MarqueeColumn items={reviews} reverse duration={44} />
        <Box sx={{ display: { xs: 'none', sm: 'contents' } }}>
          <MarqueeColumn items={reviews} duration={38} />
        </Box>
        <Box sx={{ display: { xs: 'none', md: 'contents' } }}>
          <MarqueeColumn items={reviews} reverse duration={46} />
        </Box>
      </Box>
      {/* Edge fade overlays */}
      <Box sx={{ pointerEvents: 'none', position: 'absolute', left: 0, right: 0, top: 0, height: '22%', background: 'linear-gradient(to bottom, #FFF5F6, transparent)' }} />
      <Box sx={{ pointerEvents: 'none', position: 'absolute', left: 0, right: 0, bottom: 0, height: '22%', background: 'linear-gradient(to top, #FDF2F8, transparent)' }} />
      <Box sx={{ pointerEvents: 'none', position: 'absolute', top: 0, bottom: 0, left: 0, width: '18%', background: 'linear-gradient(to right, #FFF5F6, transparent)' }} />
      <Box sx={{ pointerEvents: 'none', position: 'absolute', top: 0, bottom: 0, right: 0, width: '18%', background: 'linear-gradient(to left, #FDF2F8, transparent)' }} />
    </Box>
  )
}
