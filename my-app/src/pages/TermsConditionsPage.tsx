import Container from '@mui/material/Container'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'

export default function TermsConditionsPage() {
  const email = 'khushiyanstore@gmail.com'
  return (
    <Container sx={{ py: 3 }}>
      <Paper variant="outlined" square elevation={0} sx={{ width: '100%', maxWidth: 980, mx: 'auto', p: 3, borderRadius: 0, textAlign: 'left', borderColor: 'rgba(0,0,0,0.18)' }}>
        <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>Terms & Conditions</Typography>
        <Typography color="text.secondary" sx={{ mb: 2 }}>
          Welcome to Khushiyan. By using our website and placing an order, you agree to the terms below.
        </Typography>

        <Typography variant="h6" sx={{ mt: 1 }}>1) Use of the website</Typography>
        <ul style={{ color: 'var(--color-text)', paddingLeft: 20, listStyle: 'disc' }}>
          <li>You agree to provide accurate information and not misuse the site.</li>
          <li>Content (text, images) is for personal, non-commercial use.</li>
        </ul>

        <Typography variant="h6" sx={{ mt: 1 }}>2) Orders & pricing</Typography>
        <ul style={{ color: 'var(--color-text)', paddingLeft: 20, listStyle: 'disc' }}>
          <li>All orders are subject to availability and acceptance.</li>
          <li>Prices may change without notice. Obvious pricing errors may be cancelled/refunded.</li>
        </ul>

        <Typography variant="h6" sx={{ mt: 1 }}>3) Payments</Typography>
        <ul style={{ color: 'var(--color-text)', paddingLeft: 20, listStyle: 'disc' }}>
          <li>We accept secure online payments (UPI/Cards). Orders are processed after payment confirmation.</li>
        </ul>

        <Typography variant="h6" sx={{ mt: 1 }}>4) Shipping</Typography>
        <ul style={{ color: 'var(--color-text)', paddingLeft: 20, listStyle: 'disc' }}>
          <li>Dispatch in 24–48 business hours. Delivery typically 3–7 working days depending on location.</li>
          <li>Tracking details are shared via SMS/Email after dispatch.</li>
        </ul>

        <Typography variant="h6" sx={{ mt: 1 }}>5) Cancellations & refunds</Typography>
        <ul style={{ color: 'var(--color-text)', paddingLeft: 20, listStyle: 'disc' }}>
          <li>You may request cancellation before dispatch for a full refund.</li>
          <li>For returns due to genuine product issues/defects, please raise a request with photos/video. Eligibility is subject to inspection.</li>
        </ul>

        <Typography variant="h6" sx={{ mt: 1 }}>6) Warranty & liability</Typography>
        <ul style={{ color: 'var(--color-text)', paddingLeft: 20, listStyle: 'disc' }}>
          <li>Products are intended for normal home use. Khushiyan is not liable for indirect or consequential damages.</li>
        </ul>

        <Typography variant="h6" sx={{ mt: 1 }}>7) Contact</Typography>
        <Typography sx={{ m: 0 }}>
          Need help? Write to <a href={`mailto:${email}?subject=Terms%20and%20Conditions%20query`}>{email}</a>.
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          Last updated: {new Date().toLocaleDateString()}
        </Typography>

      </Paper>
    </Container>
  )
}

