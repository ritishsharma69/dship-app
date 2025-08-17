import { useEffect, useMemo } from 'react'
import { getOrderById } from '../lib/orders'

export default function OrderSuccessPage() {
  useEffect(() => {
    const mRobots = document.createElement('meta')
    mRobots.name = 'robots'
    mRobots.content = 'noindex'
    document.head.appendChild(mRobots)
    return () => { document.head.removeChild(mRobots) }
  }, [])

  const orderId = useMemo(() => new URLSearchParams(window.location.search).get('orderId') || '', [])
  const order = orderId ? getOrderById(orderId) : null

  const message = order ? (
    `New COD Order\n` +
    `Order ID: ${orderId}\n` +
    `Name: ${String(order.customer.name)}\n` +
    `Phone: ${String(order.customer.phone || '')}\n` +
    `Email: ${String(order.customer.email || '')}\n` +
    `Address: ${String(order.address.line1)}${order.address.line2 ? ', ' + String(order.address.line2) : ''}, ` +
    `${String(order.address.city)}, ${String(order.address.state)} ${String(order.address.zip)}, ${String(order.address.country)}\n` +
    `Items: ${order.items.map(i => `${i.title} x${i.quantity}`).join(', ')}\n` +
    `Total: ₹${order.totals.total}`
  ) : ''

  const whatsappHref = `https://wa.me/91${encodeURIComponent('7681909401')}?text=${encodeURIComponent(message)}`
  const mailHref = `mailto:ritishfj@gmail.com?subject=${encodeURIComponent('New COD Order ' + orderId)}&body=${encodeURIComponent(message)}`

  if (!orderId) {
    return (
      <div className="container" style={{ padding: 24, textAlign: 'center' }}>
        <h1>We couldn't find your order</h1>
        <p>Please check the link. If you need help, contact support.</p>
        <a className="btn btn-primary" href="/">Back to Home</a>
      </div>
    )
  }

  return (
    <div className="container" style={{ padding: 24 }}>
      <div className="page-surface" style={{ padding: 16, borderRadius: 14 }}>
        <header style={{ textAlign: 'center', marginBottom: 16 }}>
          <div className="success-hero">
            <svg className="checkmark" width="72" height="72" viewBox="0 0 64 64" aria-hidden="true">
              <circle className="check-circle" cx="32" cy="32" r="24"></circle>
              <path className="check-path" d="M20 34 L28 42 L44 26"></path>
            </svg>
          </div>
          <h1>Thank you!</h1>
          <div className="muted">Order #{orderId}</div>
        </header>

        <div className="success-grid">
          {/* Order Summary */}
          <section className="card" style={{ padding: 16, borderRadius: 12 }}>
            <h2 style={{ marginBottom: 8 }}>Order Summary</h2>
            {order ? (
              <>
                {order.items.map((it) => (
                  <div key={it.productId} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 8, alignItems: 'center' }}>
                    <div>{it.title}</div>
                    <div>x{it.quantity}</div>
                    <div>₹{it.price * it.quantity}</div>
                  </div>
                ))}
                <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)', margin: '10px 0' }} />
                <div style={{ display:'flex', justifyContent:'space-between' }}><span>Subtotal</span><span>₹{order.totals.subtotal}</span></div>
                <div style={{ display:'flex', justifyContent:'space-between' }}><span>Shipping</span><span>₹{order.totals.shipping}</span></div>
                <div style={{ display:'flex', justifyContent:'space-between' }}><span>Tax</span><span>₹{order.totals.tax}</span></div>
                <div style={{ display:'flex', justifyContent:'space-between', fontWeight:800 }}><span>Total</span><span>₹{order.totals.total}</span></div>
              </>
            ) : (
              <p className="muted">Details will be available once processing completes.</p>
            )}
          </section>

          {/* Address + Next Steps */}
          <section className="card" style={{ padding: 16, borderRadius: 12 }}>
            <h2 style={{ marginBottom: 8 }}>Shipping address</h2>
            {order ? (
              <div className="muted">
                <div>{String(order.customer.name)}</div>
                {order.customer.phone && <div>{String(order.customer.phone)}</div>}
                <div>{String(order.address.line1)}{order.address.line2 ? `, ${order.address.line2}` : ''}</div>
                <div>{String(order.address.city)}, {String(order.address.state)} {String(order.address.zip)}</div>
                <div>{String(order.address.country)}</div>
              </div>
            ) : (
              <p className="muted">We'll email your shipping confirmation soon.</p>
            )}

            <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginTop: 12 }}>
              {/* <a className="btn btn-primary" href={`/order/track/${encodeURIComponent(orderId)}`}>Track your order</a> */}
              {order && <a className="btn" style={{ background:'#25D366', color:'#fff' }} href={whatsappHref} target="_blank" rel="noreferrer">Send WhatsApp</a>}
              {order && <a className="btn" style={{ background:'var(--color-text)', color:'#fff' }} href={mailHref}>Send Email</a>}
            </div>

            <div style={{ marginTop: 16 }}>
              <div className="card" style={{ padding: 12, background:'#f8fafc' }}>
                <strong>Need help?</strong>
                <div className="muted">Email support@example.com or chat with us.</div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

