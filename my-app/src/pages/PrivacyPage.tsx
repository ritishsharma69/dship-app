import Container from '@mui/material/Container'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'

export default function PrivacyPage() {
  const email = 'khushiyanstore@gmail.com'
  return (
    <Container sx={{ py: 3 }}>
      <Paper variant="outlined" square elevation={0} sx={{ width: '100%', maxWidth: 980, mx: 'auto', p: 3, borderRadius: 0, textAlign: 'left', borderColor: 'rgba(0,0,0,0.18)' }}>
        <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>Privacy</Typography>
        <Typography color="text.secondary" sx={{ mb: 2 }}>
          We respect your privacy and are committed to keeping your information safe. This policy explains what we collect, why we collect it, and how you can control your data.
        </Typography>

        <Typography variant="h6" sx={{ mt: 1 }}>What we collect</Typography>
        <ul style={{ color: 'var(--color-text)', paddingLeft: 20, listStyle: 'disc' }}>
          <li>Name, email, phone and shipping address (for fulfilling orders).</li>
          <li>Order details like products, quantity, amount and timestamps.</li>
          <li>Basic device/usage info (pages viewed, referrer) to improve the site.</li>
        </ul>

        <Typography variant="h6" sx={{ mt: 1 }}>How we use your data</Typography>
        <ul style={{ color: 'var(--color-text)', paddingLeft: 20, listStyle: 'disc' }}>
          <li>Process and deliver your order, and send updates (order/OTP emails).</li>
          <li>Provide customer support and handle returns/cancellations.</li>
          <li>Improve our product pages, checkout and service experience.</li>
        </ul>

        <Typography variant="h6" sx={{ mt: 1 }}>Sharing</Typography>
        <ul style={{ color: 'var(--color-text)', paddingLeft: 20, listStyle: 'disc' }}>
          <li>We do not sell your personal data.</li>
          <li>We may share minimal data with trusted partners (payment/shipping) strictly to complete your order.</li>
        </ul>

        <Typography variant="h6" sx={{ mt: 1 }}>Security</Typography>
        <ul style={{ color: 'var(--color-text)', paddingLeft: 20, listStyle: 'disc' }}>
          <li>Data is transmitted over HTTPS.</li>
          <li>Access to systems is restricted and monitored.</li>
        </ul>

        <Typography variant="h6" sx={{ mt: 1 }}>Your choices</Typography>
        <ul style={{ color: 'var(--color-text)', paddingLeft: 20, listStyle: 'disc' }}>
          <li>Request access, correction or deletion of your data anytime.</li>
          <li>Unsubscribe from non‑essential emails by replying “unsubscribe”.</li>
        </ul>

        <Typography variant="h6" sx={{ mt: 1 }}>Contact</Typography>
        <Typography sx={{ m: 0 }}>
          For privacy questions or return/cancellation support, write to <a href={`mailto:${email}?subject=Privacy/Support%20request`}>{email}</a>.
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          Last updated: {new Date().toLocaleDateString()}
        </Typography>
      </Paper>
    </Container>
  )
}

