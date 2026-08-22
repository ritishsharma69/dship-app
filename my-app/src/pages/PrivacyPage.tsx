import PolicyLayout, { PolicySection } from '../components/PolicyLayout'
import LockOutlined from '@mui/icons-material/LockOutlined'
import DescriptionOutlined from '@mui/icons-material/DescriptionOutlined'
import TuneRounded from '@mui/icons-material/TuneRounded'
import HandshakeOutlined from '@mui/icons-material/HandshakeOutlined'
import GppGoodOutlined from '@mui/icons-material/GppGoodOutlined'
import CheckCircleOutlined from '@mui/icons-material/CheckCircleOutlined'

export default function PrivacyPage() {
  return (
    <PolicyLayout
      docTitle="Privacy Policy — Khushiyan Store"
      chip="Your Data, Protected"
      chipIcon={<LockOutlined />}
      title="Privacy Policy"
      subtitle="We respect your privacy and keep your information safe."
      emailSubject="Privacy request"
    >
      <PolicySection icon={<DescriptionOutlined />} tone="rgba(124,58,237,0.10)" color="#7C3AED" title="What We Collect" items={[
        'Name, email, phone and shipping address (for fulfilling orders).',
        'Order details like products, quantity, amount and timestamps.',
        'Basic device/usage info (pages viewed, referrer) to improve the site.',
      ]} />
      <PolicySection icon={<TuneRounded />} tone="rgba(14,165,233,0.12)" color="#075985" title="How We Use Your Data" items={[
        'Process and deliver your order, and send updates (order/OTP emails).',
        'Provide customer support and handle returns/cancellations.',
        'Improve our product pages, checkout and service experience.',
      ]} />
      <PolicySection icon={<HandshakeOutlined />} tone="rgba(245,158,11,0.14)" color="#B45309" title="Sharing" items={[
        'We do not sell your personal data.',
        'We may share minimal data with trusted partners (payment/shipping) strictly to complete your order.',
      ]} />
      <PolicySection icon={<GppGoodOutlined />} tone="rgba(34,197,94,0.12)" color="#166534" title="Security" items={[
        'Data is transmitted over HTTPS.',
        'Access to systems is restricted and monitored.',
      ]} />
      <PolicySection icon={<CheckCircleOutlined />} tone="rgba(240,42,77,0.10)" color="#F02A4D" title="Your Choices" items={[
        'Request access, correction or deletion of your data anytime.',
        'Unsubscribe from non-essential emails by replying unsubscribe.',
      ]} />
    </PolicyLayout>
  )
}
