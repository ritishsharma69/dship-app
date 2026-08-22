import PolicyLayout, { PolicySection } from '../components/PolicyLayout'
import LocalShippingOutlined from '@mui/icons-material/LocalShippingOutlined'
import Inventory2Outlined from '@mui/icons-material/Inventory2Outlined'
import ScheduleRounded from '@mui/icons-material/ScheduleRounded'
import PaymentsOutlined from '@mui/icons-material/PaymentsOutlined'
import LocationOnOutlined from '@mui/icons-material/LocationOnOutlined'
import NotificationsActiveOutlined from '@mui/icons-material/NotificationsActiveOutlined'
import HourglassBottomRounded from '@mui/icons-material/HourglassBottomRounded'
import CachedRounded from '@mui/icons-material/CachedRounded'

export default function ShippingPage() {
  return (
    <PolicyLayout
      docTitle="Shipping Policy — Khushiyan Store | Free Fast Delivery"
      chip="Pan-India Delivery"
      chipIcon={<LocalShippingOutlined />}
      title="Shipping Policy"
      subtitle="We deliver your orders safely, on time, and with care."
      emailSubject="Shipping query"
    >
      <PolicySection icon={<Inventory2Outlined />} tone="rgba(124,58,237,0.10)" color="#7C3AED" title="Processing Time" items={[
        'All orders are processed within 1-2 business days. Weekend/holiday orders ship the next working day.',
      ]} />
      <PolicySection icon={<ScheduleRounded />} tone="rgba(14,165,233,0.12)" color="#075985" title="Delivery Timeframe" items={[
        'Once shipped, delivery takes 3-7 business days depending on your location.',
      ]} />
      <PolicySection icon={<PaymentsOutlined />} tone="rgba(34,197,94,0.12)" color="#166534" title="Shipping Charges" items={[
        'Charges (if any) are shown at checkout. Free shipping on qualifying orders as per active offers.',
      ]} />
      <PolicySection icon={<LocationOnOutlined />} tone="rgba(240,42,77,0.10)" color="#F02A4D" title="Delivery Locations" items={[
        'We currently ship across India. Please ensure correct address and contact details.',
      ]} />
      <PolicySection icon={<NotificationsActiveOutlined />} tone="rgba(245,158,11,0.14)" color="#B45309" title="Tracking" items={[
        "You'll receive an email/SMS with tracking details once your order is dispatched.",
      ]} />
      <PolicySection icon={<HourglassBottomRounded />} tone="rgba(99,102,241,0.10)" color="#4338CA" title="Delays" items={[
        'Occasional delays due to weather or courier issues may occur. We appreciate your patience.',
      ]} />
      <PolicySection icon={<CachedRounded />} tone="rgba(20,184,166,0.10)" color="#0F766E" title="Replacement / Exchange" items={[
        'Replacement or exchange products are delivered in 5-7 business days.',
      ]} />
    </PolicyLayout>
  )
}

