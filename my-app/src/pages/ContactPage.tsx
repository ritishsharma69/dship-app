import Container from '@mui/material/Container'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import Stack from '@mui/material/Stack'

export default function ContactPage() {
  const support = 'khushiyanstore@gmail.com'
  return (
    <Container sx={{ py: 3 }}>
      <Paper variant="outlined" square elevation={0} sx={{ width: '100%', maxWidth: 820, mx: 'auto', p: 3, borderRadius: 0, borderColor: 'rgba(0,0,0,0.18)' }}>
        <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>Contact Us</Typography>
        <Typography color="text.secondary" sx={{ mb: 2 }}>
          For returns/cancellations, tap the Return/Cancel button from Your Orders section.
        </Typography>

        <Stack spacing={1.5}>
          <div className="list-row"><span>Email</span><a href={`mailto:${support}?subject=Return/Cancellation%20request`}>{support}</a></div>
          <div className="list-row"><span>Business Hours</span><span>Mon–Sat, 10 AM – 6 PM</span></div>
        </Stack>

        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          We typically respond within a few hours.
        </Typography>
      </Paper>
    </Container>
  )
}
