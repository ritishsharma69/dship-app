import Container from '@mui/material/Container'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import Stack from '@mui/material/Stack'

export default function ShippingReturnsPage() {
  const email = 'khushiyanstore@gmail.com'
  return (
    <Container sx={{ py: 3 }}>
      <Paper variant="outlined" square elevation={0} sx={{ width: '100%', maxWidth: 980, mx: 'auto', p: 3, borderRadius: 0, textAlign: 'left', borderColor: 'rgba(0,0,0,0.18)' }}>
        <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>Shipping & Returns</Typography>
        <Typography color="text.secondary" sx={{ mb: 2 }}>
          Simple policy to keep things clear and fair.
        </Typography>

        <Typography variant="h6" sx={{ mt: 1 }}>Shipping</Typography>
        <ul style={{ color: 'var(--color-text)', paddingLeft: 20, listStyle: 'disc' }}>
          <li>Orders are usually dispatched within 24–48 hours on business days.</li>
          <li>Delivery typically takes 3–7 working days depending on your location.</li>
        </ul>

        <Typography variant="h6" sx={{ mt: 1 }}>Returns & Cancellations</Typography>
        <Stack spacing={1} sx={{ color: 'var(--color-text)' }}>
          <div>• To request a Return or Cancellation, go to Your Orders and tap the Return/Cancel button.</div>
          <div>• Please state a clear and valid reason. Returns are accepted only for genuine product issues/defects.</div>
          <div>• If there is no problem/defect with the product, the return will not be accepted.</div>
          <div>• Attaching photos/videos helps us resolve things faster.</div>
        </Stack>

        <Typography variant="h6" sx={{ mt: 1 }}>Need help?</Typography>
        <Typography sx={{ m: 0 }}>
          Write to <a href={`mailto:${email}?subject=Shipping/Returns%20support`}>{email}</a>. We typically reply within a few hours.
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          Last updated: {new Date().toLocaleDateString()}
        </Typography>
      </Paper>
    </Container>
  )
}

