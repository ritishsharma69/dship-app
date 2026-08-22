import { Box, Typography } from '@mui/material'
import PolicyLayout, { SUPPORT_EMAIL } from '../components/PolicyLayout'
import SupportAgentOutlined from '@mui/icons-material/SupportAgentOutlined'
import MailOutlineRounded from '@mui/icons-material/MailOutlineRounded'
import ScheduleRounded from '@mui/icons-material/ScheduleRounded'
import LocalShippingOutlined from '@mui/icons-material/LocalShippingOutlined'
import { useRouter } from '../lib/router'

function InfoCard({ icon, tone, color, title, desc, right }: {
  icon: React.ReactNode; tone: string; color: string; title: string; desc: string; right: React.ReactNode
}) {
  return (
    <Box sx={{ p: { xs: 2.2, md: 2.8 }, borderRadius: '20px', bgcolor: '#fff', border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 4px 14px rgba(15,23,42,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1.5 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.4 }}>
        <Box sx={{ width: 40, height: 40, borderRadius: '12px', display: 'grid', placeItems: 'center', bgcolor: tone, color, flexShrink: 0 }}>{icon}</Box>
        <Box>
          <Typography sx={{ fontWeight: 800, fontSize: 15 }}>{title}</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.2 }}>{desc}</Typography>
        </Box>
      </Box>
      {right}
    </Box>
  )
}

export default function ContactUsPage() {
  const { navigate } = useRouter()
  return (
    <PolicyLayout
      docTitle="Contact Us — Khushiyan Store | Email, Support & Help"
      chip="We're Here to Help"
      chipIcon={<SupportAgentOutlined />}
      title="Contact Us"
      subtitle="We'd love to hear from you. Reach out and we'll respond within a few hours."
      emailSubject="Support request"
    >
      <InfoCard icon={<MailOutlineRounded />} tone="rgba(124,58,237,0.10)" color="#7C3AED" title="Email" desc="For orders, returns & support"
        right={<a href={`mailto:${SUPPORT_EMAIL}?subject=Support%20request`} style={{ color: '#7C3AED', fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>{SUPPORT_EMAIL}</a>} />
      <InfoCard icon={<ScheduleRounded />} tone="rgba(245,158,11,0.14)" color="#B45309" title="Business Hours" desc="When we're available"
        right={<Typography sx={{ fontWeight: 700, fontSize: 14, color: '#374151' }}>Mon–Sat, 10 AM – 6 PM</Typography>} />
      <InfoCard icon={<LocalShippingOutlined />} tone="rgba(14,165,233,0.12)" color="#075985" title="Track Your Order" desc="Check status, request returns or cancellations"
        right={<Typography onClick={() => navigate('/orders')} sx={{ color: '#7C3AED', fontWeight: 800, fontSize: 14, cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}>Your Orders →</Typography>} />
    </PolicyLayout>
  )
}

