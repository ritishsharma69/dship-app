import Container from '@mui/material/Container'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'

const Step = ({ icon, title, desc }: { icon: string; title: string; desc: string }) => (
  <Box sx={{ p: 2.5, borderRadius: 3, border: '1px solid rgba(0,0,0,0.06)', background: '#FAFAFA', display: 'flex', gap: 2, alignItems: 'flex-start' }}>
    <Box sx={{ fontSize: 28, lineHeight: 1, flexShrink: 0, mt: 0.3 }}>{icon}</Box>
    <Box>
      <Typography sx={{ fontWeight: 700, fontSize: 15, color: '#1f2937' }}>{title}</Typography>
      <Typography variant="body2" sx={{ color: '#4b5563', mt: 0.3, lineHeight: 1.6 }}>{desc}</Typography>
    </Box>
  </Box>
)

export default function ShippingPage() {
  const email = 'khushiyanstore@gmail.com'
  return (
    <Container sx={{ py: { xs: 4, md: 6 } }}>
      <Box sx={{ maxWidth: 720, mx: 'auto' }}>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Box sx={{ fontSize: 48, mb: 1 }}>🚚</Box>
          <Typography sx={{ fontFamily: 'Georgia, serif', fontSize: { xs: 28, md: 36 }, fontWeight: 800, color: '#1f2937' }}>Shipping Policy</Typography>
          <Typography color="text.secondary" sx={{ mt: 1, fontSize: 15 }}>
            We deliver your orders safely, on time, and with care.
          </Typography>
        </Box>
        <Box sx={{ display: 'grid', gap: 2 }}>
          <Step icon="📦" title="Processing Time" desc="All orders are processed within 1-2 business days. Weekend/holiday orders ship the next working day." />
          <Step icon="🕐" title="Delivery Timeframe" desc="Once shipped, delivery takes 3-7 business days depending on your location." />
          <Step icon="💰" title="Shipping Charges" desc="Charges (if any) are shown at checkout. Free shipping on qualifying orders as per active offers." />
          <Step icon="📍" title="Delivery Locations" desc="We currently ship across India. Please ensure correct address and contact details." />
          <Step icon="📲" title="Tracking" desc="You'll receive an email/SMS with tracking details once your order is dispatched." />
          <Step icon="⏳" title="Delays" desc="Occasional delays due to weather or courier issues may occur. We appreciate your patience." />
          <Step icon="🔄" title="Replacement/Exchange" desc="Replacement or exchange products are delivered in 5-7 business days." />
        </Box>
        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Questions? Write to <a href={`mailto:${email}?subject=Shipping%20query`} style={{ color: '#6D28D9', fontWeight: 600 }}>{email}</a>
          </Typography>
        </Box>
      </Box>
    </Container>
  )
}

