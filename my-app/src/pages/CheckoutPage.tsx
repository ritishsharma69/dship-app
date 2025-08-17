/** React */
import { useEffect } from 'react'
import { useCart } from '../lib/cart'
import { useRouter } from '../lib/router'
import { useToast } from '../lib/toast'
import { events } from '../analytics'

export default function CheckoutPage() {
  const { items, update, remove, clear } = useCart()
  const { navigate } = useRouter()
  const { push } = useToast()

  useEffect(() => {
    // SEO noindex + canonical
    const mRobots = document.createElement('meta')
    mRobots.name = 'robots'
    mRobots.content = 'noindex'
    document.head.appendChild(mRobots)
    const link = document.createElement('link')
    link.rel = 'canonical'
    link.href = `${location.origin}/checkout`
    document.head.appendChild(link)
    // Analytics
    events.cta_click({ id: items[0]?.product.id ?? 'unknown', step: 'begin_checkout' })
    return () => { document.head.removeChild(mRobots); document.head.removeChild(link) }
  }, [])

  const subtotal = items.reduce((sum, i) => sum + i.product.price * i.quantity, 0)
  const shipping = subtotal > 0 ? 0 : 0
  const tax = 0
  const total = subtotal + shipping + tax

  async function placeOrder(e: React.FormEvent) {
    e.preventDefault()
    if (!items.length) { push('Cart is empty'); return }

    // Show submitting overlay
    // Pink loader overlay
    const root = document.body
    const overlay = document.createElement('div')
    overlay.id = 'pink-loader-overlay'
    overlay.className = 'pink-loader-overlay'
    overlay.innerHTML = '<div class="pink-loader-card"><div class="pink-spinner"><span class="blob a"></span><span class="blob b"></span><span class="blob c"></span><span class="ring"></span></div><div class="pink-loader-text">Placing your order…</div></div>'
    root.appendChild(overlay)

    // Gather form data (used for mock order and future integration)
    const form = e.target as HTMLFormElement
    const fd = new FormData(form)
    // Prepare payload (used in mock + for future API integration)
    const payload = {
      email: fd.get('email'),
      name: fd.get('name'),
      phone: fd.get('phone'),
      address: {
        country: fd.get('country'), line1: fd.get('line1'), line2: fd.get('line2'),
        city: fd.get('city'), state: fd.get('state'), zip: fd.get('zip')
      },
      items: items.map(i => ({ productId: i.product.id, title: i.product.title, quantity: i.quantity, unitPrice: i.product.price })),
      totals: { subtotal, shipping, tax, total }
    } as const
    void payload // keep for analytics/diagnostics; avoids TS unused error

    try {
      const base = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'
      const res = await fetch(`${base}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (!res.ok) throw new Error(await res.text() || 'Order failed')
      const data = await res.json()
      clear()
      push('Order placed!')
      const oid = data.id || data._id || ''
      navigate(`/success?orderId=${encodeURIComponent(oid)}`)
    } catch (err: any) {
      push(err?.message || 'Payment failed. Try again.')
    } finally {
      // Remove overlay if still present
      overlay.remove()
    }
  }

  return (
    <div className="container">
      <div className="page-surface">
        {!items.length ? (
          <div className="card" style={{ padding: 24, textAlign: 'center' }}>
            <h2 style={{ marginBottom: 8 }}>Your cart is empty</h2>
            <button className="btn btn-primary" onClick={() => navigate('/')}>Continue Shopping</button>
          </div>
        ) : (
          <div>
            <header style={{ padding: '8px 8px 16px 8px' }}>
              <h1 style={{ margin: 0, fontSize: 28, letterSpacing: 0.2 }}>Checkout</h1>
            </header>
            <div className="checkout-grid">
              <form className="card checkout-form" onSubmit={placeOrder}>
                <div style={{ fontWeight: 700 }}>Contact</div>
                <input className="input" name="email" placeholder="Email" required type="email" />
                <input className="input" name="name" placeholder="Full name" required />
                <input className="input" name="phone" placeholder="Phone" required pattern="[0-9]{10}" />

                <div style={{ fontWeight: 700, marginTop: 8 }}>Shipping address</div>
                <input className="input" name="country" placeholder="Country" required defaultValue="India" />
                <input className="input" name="line1" placeholder="Address line 1" required />
                <input className="input" name="line2" placeholder="Address line 2" />
                <div className="address-row-2">
                  <input className="input" name="city" placeholder="City" required />
                  <input className="input" name="state" placeholder="State" required />
                </div>
                <input className="input" name="zip" placeholder="PIN/ZIP" required pattern="[0-9]{6}" />

                <div style={{ fontWeight: 700, marginTop: 8 }}>Payment</div>
                <label className="payment-row">
                  <input type="checkbox" name="cod" defaultChecked required /> Cash on Delivery (COD)
                </label>
                <button className="btn btn-buy order-btn" type="submit">Order Now</button>
              </form>

              <aside className="card order-summary-card">
                <div style={{ fontWeight: 800, fontSize: 20, marginBottom: 4 }}>Order Summary</div>
                {items.map(i => (
                  <div key={i.product.id} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 8, alignItems: 'center', padding: '12px 0', borderBottom: '1px dashed var(--color-border)' }}>
                    <div style={{ fontWeight: 600 }}>{i.product.title}</div>
                    <div className="qty-stepper">
                      <button className="stepper-btn" aria-label="Decrease" onClick={() => update(i.product.id, i.quantity - 1)}>-</button>
                      <span className="stepper-value" aria-live="polite">{i.quantity}</span>
                      <button className="stepper-btn" aria-label="Increase" onClick={() => update(i.product.id, i.quantity + 1)}>+</button>
                    </div>
                    <div style={{ fontWeight: 700 }}>₹{i.product.price * i.quantity}</div>
                    <div style={{ gridColumn: '1 / -1', marginTop: 10 }}>
                      <button className="btn btn-remove order-btn" onClick={() => remove(i.product.id)}>Remove</button>
                    </div>
                  </div>
                ))}
                <div className="list-row"><span>Subtotal</span><span>₹{subtotal}</span></div>
                <div className="list-row"><span>Shipping</span><span>₹{shipping}</span></div>
                <div className="list-row"><span>Tax</span><span>₹{tax}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: 18, marginTop: 4 }}>
                  <span>Total</span><span>₹{total}</span>
                </div>
              </aside>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

