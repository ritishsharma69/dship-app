import { useMemo } from 'react'

export default function OrderTrackPage() {
  const orderId = useMemo(() => window.location.pathname.split('/').pop() || '', [])
  return (
    <div className="container" style={{ padding: 24, textAlign: 'center' }}>
      <h1>Track Order</h1>
      <p className="muted">Tracking details for: {orderId}</p>
      <div className="card" style={{ padding: 16, marginTop: 12 }}>
        <div className="muted">Tracking will be available after shipping.</div>
      </div>
      <div style={{ marginTop: 16 }}>
        <a className="btn btn-primary" href={`/order/success?orderId=${encodeURIComponent(orderId)}`}>Back to Order</a>
      </div>
    </div>
  )
}

