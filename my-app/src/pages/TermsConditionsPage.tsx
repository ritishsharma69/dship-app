import PolicyLayout, { PolicySection } from '../components/PolicyLayout'
import GavelRounded from '@mui/icons-material/GavelRounded'
import LanguageRounded from '@mui/icons-material/LanguageRounded'
import ShoppingCartOutlined from '@mui/icons-material/ShoppingCartOutlined'
import PaymentsOutlined from '@mui/icons-material/PaymentsOutlined'
import LocalShippingOutlined from '@mui/icons-material/LocalShippingOutlined'
import ReplayRounded from '@mui/icons-material/ReplayRounded'

export default function TermsConditionsPage() {
  return (
    <PolicyLayout
      docTitle="Terms & Conditions — Khushiyan Store"
      chip="The Fine Print, Simplified"
      chipIcon={<GavelRounded />}
      title="Terms & Conditions"
      subtitle="By using our website and placing an order, you agree to the terms below."
      emailSubject="Terms query"
    >
      <PolicySection icon={<LanguageRounded />} tone="rgba(124,58,237,0.10)" color="#7C3AED" title="Use of the Website" items={[
        'You agree to provide accurate information and not misuse the site.',
        'Content (text, images) is for personal, non-commercial use.',
      ]} />
      <PolicySection icon={<ShoppingCartOutlined />} tone="rgba(240,42,77,0.10)" color="#F02A4D" title="Orders & Pricing" items={[
        'All orders are subject to availability and acceptance.',
        'Prices may change without notice. Obvious pricing errors may be cancelled/refunded.',
      ]} />
      <PolicySection icon={<PaymentsOutlined />} tone="rgba(34,197,94,0.12)" color="#166534" title="Payments" items={[
        'We currently accept Cash on Delivery (COD). You pay when your order arrives.',
      ]} />
      <PolicySection icon={<LocalShippingOutlined />} tone="rgba(14,165,233,0.12)" color="#075985" title="Shipping" items={[
        'Dispatch in 24-48 business hours. Delivery typically 3-7 working days depending on location.',
        'Tracking details are shared via SMS/Email after dispatch.',
      ]} />
      <PolicySection icon={<ReplayRounded />} tone="rgba(245,158,11,0.14)" color="#B45309" title="Cancellations & Refunds" items={[
        'You may request cancellation before dispatch for a full refund.',
        'For returns due to genuine product issues/defects, please raise a request with photos/video. Eligibility is subject to inspection.',
      ]} />
      <PolicySection icon={<GavelRounded />} tone="rgba(99,102,241,0.10)" color="#4338CA" title="Warranty & Liability" items={[
        'Products are intended for normal home use. Khushiyan is not liable for indirect or consequential damages.',
      ]} />
    </PolicyLayout>
  )
}
