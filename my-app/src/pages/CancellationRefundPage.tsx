import PolicyLayout, { PolicySection } from '../components/PolicyLayout'
import ReplayRounded from '@mui/icons-material/ReplayRounded'
import CancelOutlined from '@mui/icons-material/CancelOutlined'
import Inventory2Outlined from '@mui/icons-material/Inventory2Outlined'
import PaymentsOutlined from '@mui/icons-material/PaymentsOutlined'
import EditNoteRounded from '@mui/icons-material/EditNoteRounded'

export default function CancellationRefundPage() {
  return (
    <PolicyLayout
      docTitle="Cancellation & Refund Policy — Khushiyan Store"
      chip="Fair & Transparent"
      chipIcon={<ReplayRounded />}
      title="Cancellation & Refund"
      subtitle="Clear and fair policy for cancellations and refunds."
      emailSubject="Cancellation/Refund request"
    >
      <PolicySection icon={<CancelOutlined />} tone="rgba(244,63,94,0.10)" color="#E11D48" title="Order Cancellation" items={[
        'You can cancel your order before dispatch for a full refund.',
      ]} />
      <PolicySection icon={<Inventory2Outlined />} tone="rgba(124,58,237,0.10)" color="#7C3AED" title="Returns Eligibility" items={[
        'Returns are accepted only for genuine product issues/defects.',
        'Please submit clear photos/videos showing the issue within 48 hours of delivery.',
        'Items must be unused and in original packaging with all accessories.',
      ]} />
      <PolicySection icon={<PaymentsOutlined />} tone="rgba(34,197,94,0.12)" color="#166534" title="Refund Timeline" items={[
        'Once the return is approved and picked up, refund is credited to the original payment method within 2-5 working days.',
      ]} />
      <PolicySection icon={<EditNoteRounded />} tone="rgba(14,165,233,0.12)" color="#075985" title="How to Request" items={[
        'Go to Your Orders and click on the Return/Cancel button for the order.',
        'Alternatively, email us with your Order ID and issue details.',
      ]} />
    </PolicyLayout>
  )
}
