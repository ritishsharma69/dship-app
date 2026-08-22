import PolicyLayout, { PolicySection } from '../components/PolicyLayout'
import LocalShippingOutlined from '@mui/icons-material/LocalShippingOutlined'
import ReplayRounded from '@mui/icons-material/ReplayRounded'

export default function ShippingReturnsPage() {
  return (
    <PolicyLayout
      docTitle="Shipping & Returns — Khushiyan Store"
      chip="Clear & Fair"
      chipIcon={<LocalShippingOutlined />}
      title="Shipping & Returns"
      subtitle="Simple policy to keep things clear and fair."
      emailSubject="Shipping/Returns support"
    >
      <PolicySection icon={<LocalShippingOutlined />} tone="rgba(14,165,233,0.12)" color="#075985" title="Shipping" items={[
        'Orders are usually dispatched within 24–48 hours on business days.',
        'Delivery typically takes 3–7 working days depending on your location.',
      ]} />
      <PolicySection icon={<ReplayRounded />} tone="rgba(124,58,237,0.10)" color="#7C3AED" title="Returns & Cancellations" items={[
        'To request a Return or Cancellation, go to Your Orders and tap the Return/Cancel button.',
        'Please state a clear and valid reason. Returns are accepted only for genuine product issues/defects.',
        'If there is no problem/defect with the product, the return will not be accepted.',
        'Attaching photos/videos helps us resolve things faster.',
      ]} />
    </PolicyLayout>
  )
}

