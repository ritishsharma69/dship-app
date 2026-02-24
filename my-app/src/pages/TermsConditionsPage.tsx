import Container from '@mui/material/Container'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'

const Section = ({ icon, title, items }: { icon: string; title: string; items: string[] }) => (
  <Box sx={{ p: 2.5, borderRadius: 3, border: '1px solid rgba(0,0,0,0.06)', background: '#FAFAFA' }}>
    <Typography sx={{ fontWeight: 700, fontSize: 16, mb: 1, color: '#1f2937' }}>{icon} {title}</Typography>
    <ul style={{ margin: 0, paddingLeft: 20, listStyle: 'disc', color: '#374151', lineHeight: 1.8, fontSize: 14 }}>
      {items.map((t, i) => <li key={i}>{t}</li>)}
    </ul>
  </Box>
)

export default function TermsConditionsPage() {
  const email = 'khushiyanstore@gmail.com'
  return (
    <Container sx={{ py: { xs: 4, md: 6 } }}>
      <Box sx={{ maxWidth: 720, mx: 'auto' }}>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Box sx={{ fontSize: 48, mb: 1 }}>📜</Box>
          <Typography sx={{ fontFamily: 'Georgia, serif', fontSize: { xs: 28, md: 36 }, fontWeight: 800, color: '#1f2937' }}>Terms & Conditions</Typography>
          <Typography color="text.secondary" sx={{ mt: 1, fontSize: 15 }}>
            By using our website and placing an order, you agree to the terms below.
          </Typography>
        </Box>
        <Box sx={{ display: 'grid', gap: 2 }}>
          <Section icon="🌐" title="Use of the Website" items={[
            'You agree to provide accurate information and not misuse the site.',
            'Content (text, images) is for personal, non-commercial use.',
          ]} />
          <Section icon="🛒" title="Orders & Pricing" items={[
            'All orders are subject to availability and acceptance.',
            'Prices may change without notice. Obvious pricing errors may be cancelled/refunded.',
          ]} />
          <Section icon="💳" title="Payments" items={[
            'We accept secure online payments (UPI/Cards). Orders are processed after payment confirmation.',
          ]} />
          <Section icon="🚚" title="Shipping" items={[
            'Dispatch in 24-48 business hours. Delivery typically 3-7 working days depending on location.',
            'Tracking details are shared via SMS/Email after dispatch.',
          ]} />
          <Section icon="🔄" title="Cancellations & Refunds" items={[
            'You may request cancellation before dispatch for a full refund.',
            'For returns due to genuine product issues/defects, please raise a request with photos/video. Eligibility is subject to inspection.',
          ]} />
          <Section icon="⚖️" title="Warranty & Liability" items={[
            'Products are intended for normal home use. Khushiyan is not liable for indirect or consequential damages.',
          ]} />
        </Box>
        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Need help? Write to <a href={`mailto:${email}?subject=Terms%20query`} style={{ color: '#6D28D9', fontWeight: 600 }}>{email}</a>
          </Typography>
        </Box>
      </Box>
    </Container>
  )
}
