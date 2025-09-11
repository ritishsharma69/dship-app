import { useEffect, useState } from 'react'
import { apiGetJson, apiPostJson } from '../lib/api'
import { useRouter } from '../lib/router'

export default function PaymentPhonePeReturnPage() {
  const [status, setStatus] = useState<'idle'|'loading'|'completed'|'failed'|'pending'|'error'>('idle')
  const [message, setMessage] = useState<string>('')
  const { navigate } = useRouter()

  useEffect(() => {
    document.title = 'Processing payment…'
    const last = localStorage.getItem('pp_last_order') || ''
    if (!last) { setStatus('error'); setMessage('Missing order reference'); return }
    setStatus('loading')
    apiGetJson<any>(`/api/payments/phonepe/status?merchantOrderId=${encodeURIComponent(last)}`)
      .then(async (res) => {
        const st = String(res?.state || '').toUpperCase()
        if (st === 'COMPLETED') {
          try {
            setMessage('Payment successful. Placing your order…')
            const raw = localStorage.getItem('pp_pending_order') || ''
            const payload = raw ? JSON.parse(raw) : null
            if (!payload) { setStatus('error'); setMessage('Payment succeeded, but order details are missing.'); return }
            payload.paymentMethod = 'phonepe'
            payload.payment = { provider: 'phonepe', merchantOrderId: last, state: 'COMPLETED', captured: true }
            const data = await apiPostJson<any>('/api/orders', payload)
            const oid = data?.id || data?._id || ''
            localStorage.removeItem('pp_pending_order')
            localStorage.removeItem('pp_last_order')
            try { localStorage.removeItem('cart:v1') } catch {}
            setStatus('completed')
            navigate(`/success?orderId=${encodeURIComponent(oid)}`)
          } catch (e) {
            setStatus('error'); setMessage('Payment succeeded, but order placement failed. Please contact support with your payment reference.')
          }
        } else if (st === 'FAILED') {
          setStatus('failed'); setMessage('Payment failed. Please try again.')
        } else {
          setStatus('pending'); setMessage('Payment is pending. We will update your order once it completes.')
        }
      })
      .catch((e) => { setStatus('error'); setMessage(e?.message || 'Could not fetch status') })
  }, [])

  return (
    <div className="container">
      <div className="page-surface" style={{ padding: 24, textAlign: 'center' }}>
        <h2>PhonePe Payment Status</h2>
        <p className="small-muted" style={{ marginTop: 8 }}>{message || 'Please wait…'}</p>
        {status === 'loading' && <div style={{ marginTop: 16 }}>Checking status…</div>}
        <div style={{ marginTop: 24, display: 'flex', justifyContent: 'center', gap: 8 }}>
          <button className="btn" onClick={() => navigate('/')}>Go to Home</button>
          <button className="btn btn-primary" onClick={() => navigate('/orders')}>View My Orders</button>
        </div>
      </div>
    </div>
  )
}

