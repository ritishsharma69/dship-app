import Container from '@mui/material/Container'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'

export default function ContactUsPage() {
  const support = 'khushiyanstore@gmail.com'
  return (
    <Container sx={{ py: { xs: 4, md: 6 } }}>
      <Box sx={{ maxWidth: 620, mx: 'auto', textAlign: 'center' }}>
        <Box sx={{ fontSize: 48, mb: 1 }}>📬</Box>
        <Typography sx={{ fontFamily: 'Georgia, serif', fontSize: { xs: 28, md: 36 }, fontWeight: 800, mb: 1, color: '#1f2937' }}>Contact Us</Typography>
        <Typography color="text.secondary" sx={{ mb: 4, fontSize: 15 }}>
          We'd love to hear from you. Reach out and we'll respond within a few hours.
        </Typography>

        <Box sx={{ display: 'grid', gap: 2, textAlign: 'left' }}>
          <Box sx={{ p: 2.5, borderRadius: 3, border: '1px solid rgba(0,0,0,0.08)', background: 'linear-gradient(135deg, #F3E8FF 0%, #FFF 100%)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
            <Box>
              <Typography sx={{ fontWeight: 700, fontSize: 15, color: '#1f2937' }}>📧 Email</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.3 }}>For orders, returns & support</Typography>
            </Box>
            <a href={`mailto:${support}?subject=Support%20request`} style={{ color: '#6D28D9', fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>{support}</a>
          </Box>
          <Box sx={{ p: 2.5, borderRadius: 3, border: '1px solid rgba(0,0,0,0.08)', background: 'linear-gradient(135deg, #E0F7FA 0%, #FFF 100%)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
            <Box>
              <Typography sx={{ fontWeight: 700, fontSize: 15, color: '#1f2937' }}>🕐 Business Hours</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.3 }}>When we're available</Typography>
            </Box>
            <Typography sx={{ fontWeight: 600, fontSize: 14, color: '#374151' }}>Mon–Sat, 10 AM – 6 PM</Typography>
          </Box>
        </Box>
      </Box>
    </Container>
  )
}

