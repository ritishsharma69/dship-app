import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { Box, Container, Typography, Button } from '@mui/material'
import CheckRounded from '@mui/icons-material/CheckRounded'
import MailOutlineRounded from '@mui/icons-material/MailOutlineRounded'

export const SUPPORT_EMAIL = 'khushiyanstore@gmail.com'

/** One content card: icon in a tinted tile + title + check-bulleted points. */
export function PolicySection({ icon, tone, color, title, items }: {
  icon: ReactNode
  tone: string
  color: string
  title: string
  items: string[]
}) {
  return (
    <Box sx={{ p: { xs: 2.2, md: 2.8 }, borderRadius: '20px', bgcolor: '#fff', border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 4px 14px rgba(15,23,42,0.04)' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.4, mb: 1.4 }}>
        <Box sx={{ width: 40, height: 40, borderRadius: '12px', display: 'grid', placeItems: 'center', bgcolor: tone, color, flexShrink: 0 }}>{icon}</Box>
        <Typography sx={{ fontWeight: 800, fontSize: 15.5 }}>{title}</Typography>
      </Box>
      <Box sx={{ display: 'grid', gap: 1 }}>
        {items.map((t) => (
          <Box key={t} sx={{ display: 'flex', gap: 1.1, alignItems: 'flex-start' }}>
            <CheckRounded sx={{ fontSize: 16, color: '#7C3AED', mt: 0.4, flexShrink: 0 }} />
            <Typography variant="body2" sx={{ color: '#374151', lineHeight: 1.65 }}>{t}</Typography>
          </Box>
        ))}
      </Box>
    </Box>
  )
}

/**
 * Shared shell for policy/help pages — purple gradient hero (matches the
 * homepage/featured banner language), centered content column and a support CTA.
 */
export default function PolicyLayout({ docTitle, chip, chipIcon, title, subtitle, emailSubject, children }: {
  docTitle: string
  chip: string
  chipIcon: ReactNode
  title: ReactNode
  subtitle: string
  emailSubject: string
  children: ReactNode
}) {
  useEffect(() => { document.title = docTitle }, [docTitle])
  return (
    <Box sx={{ minHeight: '70vh', bgcolor: '#fff' }}>
      <Container sx={{ pt: { xs: 2, md: 2.5 }, pb: { xs: 4, md: 6 } }}>
        {/* Hero banner */}
        <Box sx={{
          position: 'relative', borderRadius: '24px', overflow: 'hidden', textAlign: 'center',
          background: 'linear-gradient(100deg, #5B3FC4 0%, #7C4FD8 40%, #A458E8 78%, #E687C8 100%)',
          px: { xs: 2.5, md: 6 }, py: { xs: 4, md: 5.5 }, mb: { xs: 3, md: 4 },
        }}>
          {/* Decorative glows */}
          <Box sx={{ position: 'absolute', top: -70, left: -50, width: 220, height: 220, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,0.14) 0%, transparent 70%)' }} />
          <Box sx={{ position: 'absolute', bottom: -80, right: -40, width: 260, height: 260, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,0.10) 0%, transparent 70%)' }} />

          <Box sx={{ position: 'relative' }}>
            <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.7, px: 1.5, py: 0.55, borderRadius: 999, bgcolor: 'rgba(255,255,255,0.16)', border: '1px solid rgba(255,255,255,0.25)', mb: 1.5 }}>
              <Box sx={{ display: 'grid', placeItems: 'center', color: '#FBBF24', '& svg': { fontSize: 14 } }}>{chipIcon}</Box>
              <Typography sx={{ fontSize: 11.5, fontWeight: 700, color: '#fff', letterSpacing: 0.4, lineHeight: 1, textTransform: 'uppercase' }}>{chip}</Typography>
            </Box>
            <Typography sx={{ fontFamily: 'Georgia, Times New Roman, serif', fontSize: { xs: 28, md: 40 }, fontWeight: 700, color: '#fff', lineHeight: 1.15 }}>{title}</Typography>
            <Typography sx={{ mt: 1, fontSize: { xs: 14, md: 15.5 }, color: 'rgba(255,255,255,0.88)', maxWidth: 560, mx: 'auto' }}>{subtitle}</Typography>
          </Box>
        </Box>

        {/* Content */}
        <Box sx={{ maxWidth: 760, mx: 'auto', display: 'grid', gap: 2 }}>
          {children}
        </Box>

        {/* Support CTA */}
        <Box sx={{ maxWidth: 760, mx: 'auto', mt: 3, p: { xs: 2.2, md: 2.8 }, borderRadius: '20px', bgcolor: 'rgba(124,58,237,0.05)', border: '1px solid rgba(124,58,237,0.14)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1.5 }}>
          <Box>
            <Typography sx={{ fontWeight: 800, fontSize: 15.5 }}>Still have questions?</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.3 }}>Our team replies within a few hours — Mon–Sat, 10 AM – 6 PM</Typography>
          </Box>
          <Button href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(emailSubject)}`} startIcon={<MailOutlineRounded sx={{ fontSize: '17px !important' }} />}
            sx={{ px: 2.2, py: 1, borderRadius: 999, textTransform: 'none', fontSize: 13.5, fontWeight: 800, color: '#fff', bgcolor: '#7C3AED', boxShadow: '0 6px 16px rgba(124,58,237,0.30)', '&:hover': { bgcolor: '#6D28D9' } }}>
            Email Support
          </Button>
        </Box>
      </Container>
    </Box>
  )
}
