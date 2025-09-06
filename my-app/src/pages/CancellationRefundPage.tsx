import Container from '@mui/material/Container'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import Stack from '@mui/material/Stack'

export default function CancellationRefundPage() {
  const email = 'khushiyanstore@gmail.com'
  return (
    <Container sx={{ py: 3 }}>
      <Paper variant="outlined" square elevation={0} sx={{ width: '100%', maxWidth: 980, mx: 'auto', p: 3, borderRadius: 0, textAlign: 'left', borderColor: 'rgba(0,0,0,0.18)' }}>
        <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>Cancellation & Refund</Typography>
        <Typography color="text.secondary" sx={{ mb: 2 }}>
          Clear and fair policy for cancellations and refunds.
        </Typography>

        <Typography variant="h6" sx={{ mt: 1 }}>Order cancellation</Typography>
        <Stack spacing={1} sx={{ color: 'var(--color-text)' }}>
          <div>• You can cancel your order before dispatch for a full refund.</div>
          <div>• If the order has been shipped, please refuse delivery or raise a return request after delivery.</div>
        </Stack>

        <Typography variant="h6" sx={{ mt: 1 }}>Returns eligibility</Typography>
        <Stack spacing={1} sx={{ color: 'var(--color-text)' }}>
          <div>• Returns are accepted only for genuine product issues/defects.</div>
          <div>• Please submit clear photos/videos showing the issue within 48 hours of delivery.</div>
          <div>• Items must be unused and in original packaging with all accessories.</div>
        </Stack>

        <Typography variant="h6" sx={{ mt: 1 }}>Refund timeline</Typography>
        <Stack spacing={1} sx={{ color: 'var(--color-text)' }}>
          <div>• Once the return is approved and picked up, refund is initiated within 2–5 working days.</div>
          <div>• Refund will be credited to the original payment method.</div>
        </Stack>

        <Typography variant="h6" sx={{ mt: 1 }}>How to request</Typography>
        <Stack spacing={1} sx={{ color: 'var(--color-text)' }}>
          <div>• Go to Your Orders and click on the Return/Cancel button for the order.</div>
          <div>• Alternatively, email us with your Order ID and issue details at <a href={`mailto:${email}?subject=Cancellation/Refund%20request`}>{email}</a>.</div>
        </Stack>

        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          Last updated: {new Date().toLocaleDateString()}
        </Typography>
      </Paper>
    </Container>
  )
}

