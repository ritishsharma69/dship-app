import { useState } from 'react'
import { Box, Button, Chip, Container, IconButton, InputBase, Typography } from '@mui/material'
import LocalShippingOutlined from '@mui/icons-material/LocalShippingOutlined'
import PaymentsOutlined from '@mui/icons-material/PaymentsOutlined'
import VerifiedOutlined from '@mui/icons-material/VerifiedOutlined'
import InstagramIcon from '@mui/icons-material/Instagram'
import { useRouter } from '../lib/router'
import { useToast } from '../lib/toast'

// Shared site footer — rendered globally in App.tsx so every page has the same bottom bar.
export default function Footer() {
  const { navigate } = useRouter()
  const { push } = useToast()
  const [newsEmail, setNewsEmail] = useState('')

  const link = (label: string, to: string) => (
    <Button key={label} onClick={() => navigate(to)} color="inherit" sx={{ justifyContent: 'flex-start', p: 0, minWidth: 0, color: 'rgba(255,255,255,0.75)', textTransform: 'none', fontWeight: 500, '&:hover': { color: '#fff', background: 'none' } }}>{label}</Button>
  )

  return (
    <Box component="footer" sx={{ mt: 2, color: '#fff', backgroundColor: '#111114' }}>
      <Container sx={{ py: { xs: 4, md: 5 }, display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1.4fr 0.8fr 1fr 1.2fr' }, gap: { xs: 3, md: 4 }, alignItems: 'start' }}>
        {/* Brand */}
        <Box>
          <Box
            role="img"
            aria-label="Khushiyan Store"
            sx={{
              // Asset has transparent padding; crop precisely to the artwork region.
              height: 52,
              width: 171,
              backgroundImage: 'url(/logo.png)',
              backgroundRepeat: 'no-repeat',
              backgroundSize: '173% auto',
              backgroundPosition: '43.7% 44.8%',
            }}
          />
          <Typography variant="body2" sx={{ opacity: 0.85, mt: 1.2, maxWidth: 260 }}>
            Bringing happiness to your home with premium quality essentials.
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
            <IconButton
              aria-label="Instagram"
              size="small"
              component="a"
              href="https://www.instagram.com/khushiyan_store"
              target="_blank"
              rel="noopener noreferrer"
              sx={{ width: 34, height: 34, color: '#fff', background: 'linear-gradient(135deg, #F58529, #DD2A7B, #8134AF)', '&:hover': { background: 'linear-gradient(135deg, #F58529, #DD2A7B, #8134AF)', opacity: 0.85 } }}
            >
              <InstagramIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Box>
        </Box>

        {/* Shop */}
        <Box>
          <Typography sx={{ fontWeight: 900, fontSize: 12.5, letterSpacing: 1, textTransform: 'uppercase', mb: 1.4, opacity: 0.95 }}>Shop</Typography>
          <Box sx={{ display: 'grid', gap: 0.7, justifyItems: 'start' }}>
            {link('Best Sellers', '/featured')}
            {link('New Arrivals', '/featured')}
            {link('All Products', '/featured')}
            {link('Track Order', '/orders')}
          </Box>
        </Box>

        {/* Help & Support */}
        <Box>
          <Typography sx={{ fontWeight: 900, fontSize: 12.5, letterSpacing: 1, textTransform: 'uppercase', mb: 1.4, opacity: 0.95 }}>Help &amp; Support</Typography>
          <Box sx={{ display: 'grid', gap: 0.7, justifyItems: 'start' }}>
            {link('Contact Us', '/contact')}
            {link('Shipping Policy', '/shipping')}
            {link('Returns & Refunds', '/shipping')}
            {link('Privacy Policy', '/privacy')}
            {link('Terms & Conditions', '/terms-conditions')}
          </Box>
        </Box>

        {/* Newsletter */}
        <Box>
          <Typography sx={{ fontWeight: 900, fontSize: 12.5, letterSpacing: 1, textTransform: 'uppercase', mb: 1.4, opacity: 0.95 }}>Newsletter</Typography>
          <Typography variant="body2" sx={{ opacity: 0.75, mb: 1.5 }}>
            Subscribe for exclusive offers and latest updates
          </Typography>
          <Box
            component="form"
            onSubmit={(e) => { e.preventDefault(); if (newsEmail.trim()) { push('Subscribed! Thank you 💗'); setNewsEmail('') } }}
            sx={{ display: 'flex', alignItems: 'center', bgcolor: '#fff', borderRadius: 999, p: 0.4, pl: 1.8, maxWidth: 340 }}
          >
            <InputBase
              value={newsEmail}
              onChange={(e) => setNewsEmail(e.target.value)}
              placeholder="Enter your email"
              type="email"
              sx={{ flex: 1, fontSize: 13.5, color: '#1A1A1E' }}
              inputProps={{ 'aria-label': 'Email for newsletter' }}
            />
            <Button type="submit" variant="contained" disableElevation sx={{ borderRadius: 999, px: 2.2, py: 0.8, fontWeight: 800, fontSize: 13, textTransform: 'none', bgcolor: '#7C3AED', '&:hover': { bgcolor: '#6D28D9' } }}>
              Subscribe
            </Button>
          </Box>
          <Typography variant="body2" sx={{ opacity: 0.7, mt: 2 }}>Email: khushiyanstore@gmail.com</Typography>
        </Box>
      </Container>

      {/* Bottom bar */}
      <Box sx={{ borderTop: '1px solid rgba(255,255,255,0.10)' }}>
        <Container sx={{ py: 1.8, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1.5 }}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            <Chip icon={<LocalShippingOutlined sx={{ fontSize: '15px !important' }} />} label="2–5 Days Delivery" size="small" sx={{ bgcolor: 'rgba(255,255,255,0.08)', color: '#fff', '& .MuiChip-icon': { color: 'rgba(255,255,255,0.9)' }, fontWeight: 700, fontSize: 11.5 }} />
            <Chip icon={<PaymentsOutlined sx={{ fontSize: '15px !important' }} />} label="COD Available" size="small" sx={{ bgcolor: 'rgba(255,255,255,0.08)', color: '#fff', '& .MuiChip-icon': { color: 'rgba(255,255,255,0.9)' }, fontWeight: 700, fontSize: 11.5 }} />
            <Chip icon={<VerifiedOutlined sx={{ fontSize: '15px !important' }} />} label="Secure Checkout" size="small" sx={{ bgcolor: 'rgba(255,255,255,0.08)', color: '#fff', '& .MuiChip-icon': { color: 'rgba(255,255,255,0.9)' }, fontWeight: 700, fontSize: 11.5 }} />
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="caption" sx={{ opacity: 0.85, fontWeight: 700 }}>We Accept</Typography>
            <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.7, px: 1.4, py: 0.6, borderRadius: 999, background: 'linear-gradient(135deg, #22C55E 0%, #15803D 100%)', border: '1px solid rgba(255,255,255,0.18)', boxShadow: '0 2px 10px rgba(34,197,94,0.35)' }}>
              <PaymentsOutlined sx={{ fontSize: 15, color: '#fff' }} />
              <Typography sx={{ fontSize: 11.5, fontWeight: 800, color: '#fff', letterSpacing: 0.4, lineHeight: 1, whiteSpace: 'nowrap' }}>
                Cash on Delivery
              </Typography>
            </Box>
          </Box>
          <Typography variant="caption" sx={{ opacity: 0.75 }}>© {new Date().getFullYear()} Khushiyan Store. All rights reserved.</Typography>
        </Container>
      </Box>
    </Box>
  )
}
