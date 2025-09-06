import Container from '@mui/material/Container'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'

export default function ShippingPage() {
  const email = 'khushiyanstore@gmail.com'
  return (
    <Container sx={{ py: 3 }}>
      <Paper variant="outlined" square elevation={0} sx={{ width: '100%', maxWidth: 980, mx: 'auto', p: 3, borderRadius: 0, textAlign: 'left', borderColor: 'rgba(0,0,0,0.18)' }}>
        <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>Shipping</Typography>
        <Typography color="text.secondary" sx={{ mb: 2 }}>
          We ship across India with fast processing and tracking updates.
        </Typography>

        <Typography variant="h6" sx={{ mt: 1 }}>Dispatch & delivery</Typography>
        <ul style={{ color: 'var(--color-text)', paddingLeft: 20, listStyle: 'disc' }}>
          <li>Orders are dispatched within 24–48 business hours.</li>
          <li>Delivery typically takes 3–7 working days depending on your location.</li>
          <li>Tracking details are shared via SMS/Email after dispatch.</li>
        </ul>

        <Typography variant="h6" sx={{ mt: 1 }}>Support</Typography>
        <Typography sx={{ m: 0 }}>
          Questions? Write to <a href={`mailto:${email}?subject=Shipping%20support`}>{email}</a>.
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          Last updated: {new Date().toLocaleDateString()}
        </Typography>
      </Paper>
    </Container>
  )
}

