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

export default function CancellationRefundPage() {
  const email = 'khushiyanstore@gmail.com'
  return (
    <Container sx={{ py: { xs: 4, md: 6 } }}>
      <Box sx={{ maxWidth: 720, mx: 'auto' }}>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Box sx={{ fontSize: 48, mb: 1 }}>🔄</Box>
          <Typography sx={{ fontFamily: 'Georgia, serif', fontSize: { xs: 28, md: 36 }, fontWeight: 800, color: '#1f2937' }}>Cancellation & Refund</Typography>
          <Typography color="text.secondary" sx={{ mt: 1, fontSize: 15 }}>
            Clear and fair policy for cancellations and refunds.
          </Typography>
        </Box>
        <Box sx={{ display: 'grid', gap: 2 }}>
          <Section icon="❌" title="Order Cancellation" items={[
            'You can cancel your order before dispatch for a full refund.',
          ]} />
          <Section icon="📦" title="Returns Eligibility" items={[
            'Returns are accepted only for genuine product issues/defects.',
            'Please submit clear photos/videos showing the issue within 48 hours of delivery.',
            'Items must be unused and in original packaging with all accessories.',
          ]} />

          <Section icon="💰" title="Refund Timeline" items={[
            'Once the return is approved and picked up, refund is credited to the original payment method within 2-5 working days.',
          ]} />
          <Section icon="📝" title="How to Request" items={[
            'Go to Your Orders and click on the Return/Cancel button for the order.',
            'Alternatively, email us with your Order ID and issue details.',
          ]} />
        </Box>
        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Need help? Write to <a href={`mailto:${email}?subject=Cancellation/Refund%20request`} style={{ color: '#6D28D9', fontWeight: 600 }}>{email}</a>
          </Typography>
        </Box>
      </Box>
    </Container>
  )
}
