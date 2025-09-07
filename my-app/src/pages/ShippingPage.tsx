import Container from '@mui/material/Container'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'

export default function ShippingPage() {
  const email = 'khushiyanstore@gmail.com'
  return (
    <Container sx={{ py: 3 }}>
      <Paper variant="outlined" square elevation={0} sx={{ width: '100%', maxWidth: 980, mx: 'auto', p: 3, borderRadius: 0, textAlign: 'left', borderColor: 'rgba(0,0,0,0.18)' }}>
        <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>Shipping Policy</Typography>
        <Typography color="text.secondary" sx={{ mb: 2 }}>
          At Khushiyan Store, we are committed to delivering your orders in a safe, timely, and reliable manner.
        </Typography>

        <ol style={{ color: 'var(--color-text)', paddingLeft: 20 }}>
          <li>
            <b>Order Processing Time:</b> All orders are processed within 1–2 business days. Orders placed on weekends or public holidays will be processed on the next working day.
          </li>
          <li>
            <b>Shipping Timeframe:</b> Once shipped, orders are typically delivered within 3–7 business days, depending on the delivery location.
          </li>
          <li>
            <b>Shipping Charges:</b> Shipping charges (if applicable) will be displayed at checkout before you complete your purchase. We offer free shipping on orders above a certain value (as mentioned on the website or promotional offers).
          </li>
          <li>
            <b>Delivery Locations:</b> We currently ship across India. Please ensure your full address and contact details are correct to avoid delivery delays.
          </li>
          <li>
            <b>Tracking Information:</b> You will receive an email or SMS with the tracking details once your order has been dispatched.
          </li>
          <li>
            <b>Delays or Issues:</b> While we aim to ensure timely delivery, delays can sometimes occur due to unforeseen circumstances (e.g., weather, courier delays). In such cases, we appreciate your patience and understanding.
          </li>
        </ol>

        <Typography sx={{ mt: 1 }}>
          For any shipping-related inquiries, please feel free to contact our support team at: <a href={`mailto:${email}?subject=Shipping%20support`}>{email}</a>
        </Typography>

        <Typography sx={{ mt: 1 }}>
          Replacement/Exchange product will be delivered in 5–7 business days.
        </Typography>

        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          Last updated: {new Date().toLocaleDateString()}
        </Typography>
      </Paper>
    </Container>
  )
}

