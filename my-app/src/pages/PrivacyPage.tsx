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

export default function PrivacyPage() {
  const email = 'khushiyanstore@gmail.com'
  return (
    <Container sx={{ py: { xs: 4, md: 6 } }}>
      <Box sx={{ maxWidth: 720, mx: 'auto' }}>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Box sx={{ fontSize: 48, mb: 1 }}>🔒</Box>
          <Typography sx={{ fontFamily: 'Georgia, serif', fontSize: { xs: 28, md: 36 }, fontWeight: 800, color: '#1f2937' }}>Privacy Policy</Typography>
          <Typography color="text.secondary" sx={{ mt: 1, fontSize: 15 }}>
            We respect your privacy and keep your information safe.
          </Typography>
        </Box>
        <Box sx={{ display: 'grid', gap: 2 }}>
          <Section icon="📋" title="What we collect" items={[
            'Name, email, phone and shipping address (for fulfilling orders).',
            'Order details like products, quantity, amount and timestamps.',
            'Basic device/usage info (pages viewed, referrer) to improve the site.',
          ]} />
          <Section icon="⚙️" title="How we use your data" items={[
            'Process and deliver your order, and send updates (order/OTP emails).',
            'Provide customer support and handle returns/cancellations.',
            'Improve our product pages, checkout and service experience.',
          ]} />
          <Section icon="🤝" title="Sharing" items={[
            'We do not sell your personal data.',
            'We may share minimal data with trusted partners (payment/shipping) strictly to complete your order.',
          ]} />
          <Section icon="🛡️" title="Security" items={[
            'Data is transmitted over HTTPS.',
            'Access to systems is restricted and monitored.',
          ]} />
          <Section icon="✅" title="Your choices" items={[
            'Request access, correction or deletion of your data anytime.',
            'Unsubscribe from non-essential emails by replying unsubscribe.',
          ]} />
        </Box>
        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Questions? Write to <a href={`mailto:${email}?subject=Privacy%20request`} style={{ color: '#6D28D9', fontWeight: 600 }}>{email}</a>
          </Typography>
        </Box>
      </Box>
    </Container>
  )
}
