import { useEffect } from 'react'

export default function SuccessPage() {
  useEffect(() => {
    const mRobots = document.createElement('meta')
    mRobots.name = 'robots'
    mRobots.content = 'noindex'
    document.head.appendChild(mRobots)
    return () => { document.head.removeChild(mRobots) }
  }, [])

  const orderId = new URLSearchParams(window.location.search).get('orderId') || ''

  return (
    <div className="container" style={{ padding: 24 }}>
      <div className="page-surface card" style={{ padding: 24, maxWidth: 900, margin: '0 auto' }}>
        <section className="success-hero" style={{ textAlign: 'center' }}>
          {/* Animated checkmark */}
          <svg className="checkmark" viewBox="0 0 100 100" width="96" height="96" aria-hidden>
            <circle className="check-circle" cx="50" cy="50" r="45" />
            <path className="check-path" d="M30 52 L45 68 L72 38" />
          </svg>
          <h1 style={{ fontSize: 28, marginBottom: 6 }}>Order Completed</h1>
          <p className="muted" style={{ marginTop: 0 }}>Thanks for shopping with us! Your order was placed successfully.</p>

          <div className="card" style={{ padding: 16, display: 'inline-block', marginTop: 12 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--color-muted)' }}>Order ID</div>
            <div style={{ fontWeight: 800, letterSpacing: 0.3 }}>#{orderId}</div>
          </div>

          <div style={{ display:'flex', justifyContent:'center', gap:10, flexWrap:'wrap', marginTop: 16 }}>
            {/* <a className="btn btn-primary" href={`/order/track/${encodeURIComponent(orderId)}`}>Track Order</a> */}
            <a className="btn" href="/" style={{ background:'#111827', color:'#fff' }}>Back to Shopping</a>
          </div>
        </section>
      </div>
    </div>
  )
}
