/** React */
import { useEffect, useRef, useState } from 'react'
import { useCart } from '../lib/cart'
import { useRouter } from '../lib/router'
import { useToast } from '../lib/toast'
import { events } from '../analytics'
import { apiPostJson } from '../lib/api'
import DiscountModal from '../components/DiscountModal'

async function loadRazorpayScript() {
  if (document.getElementById('razorpay-js')) return true
  return new Promise<boolean>((resolve) => {
    const s = document.createElement('script')
    s.src = 'https://checkout.razorpay.com/v1/checkout.js'
    s.id = 'razorpay-js'
    s.onload = () => resolve(true)
    s.onerror = () => resolve(false)
    document.body.appendChild(s)
  })
}

export default function CheckoutPage() {
  const { items, clear, update } = useCart()
  const { navigate } = useRouter()
  const { push } = useToast()
  const hasPaymentKey = !!import.meta.env.VITE_RAZORPAY_KEY_ID
  const [paymentMethod, setPaymentMethod] = useState<string>(hasPaymentKey ? 'razorpay' : 'cod')

  // Discount modal state
  const [showDiscount, setShowDiscount] = useState(false)
  const [pendingProductId, setPendingProductId] = useState<string | null>(null)
  // Do NOT auto-apply coupon; only apply when user explicitly claims it
  const [couponApplied, setCouponApplied] = useState<boolean>(false)
  const exitedOnceRef = useRef(false)

  // Show discount only when user navigates away from Checkout the first time
  // but do NOT auto-apply without user action
  useEffect(() => {
    const onPop = () => {
      if (!exitedOnceRef.current) {
        setShowDiscount(true)
        exitedOnceRef.current = true
      }
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

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

    // Show submitting overlay (global loader wrapper already exists; no double overlay)

    // Gather form data
    const form = e.target as HTMLFormElement
    const fd = new FormData(form)
    const paymentMethod = String(fd.get('payment') || 'cod')

    // Prepare order payload
    const payload: any = {
      email: fd.get('email'),
      name: fd.get('name'),
      phone: fd.get('phone'),
      address: {
        country: fd.get('country'), line1: fd.get('line1'), line2: fd.get('line2'),
        city: fd.get('city'), state: fd.get('state'), zip: fd.get('zip')
      },
      items: items.map(i => ({ productId: i.product.id, title: i.product.title, quantity: i.quantity, unitPrice: i.product.price })),
      totals: { subtotal, shipping, tax, total },
      paymentMethod
    }


    try {
      if (paymentMethod === 'razorpay') {
        if (!hasPaymentKey) { push('Payment key not configured'); return }
        // Online payment via Razorpay
        const ok = await loadRazorpayScript()
        if (!ok) throw new Error('Failed to load Razorpay')
        const key = import.meta.env.VITE_RAZORPAY_KEY_ID

        // 1) Create Razorpay order on server
        const { order } = await apiPostJson<any>(`/api/payments/razorpay/order`, { amount: total, receipt: `rcpt_${Date.now()}` })

        // 2) Open Razorpay Checkout
        const rzp = new (window as any).Razorpay({
          key,
          amount: order.amount,
          currency: order.currency,
          order_id: order.id,
          name: 'Order Payment',
          description: 'Pay securely',
          prefill: { name: String(fd.get('name')||''), email: String(fd.get('email')||''), contact: String(fd.get('phone')||'') },
          notes: { source: 'dship' },
          theme: { color: '#ff2a6d' },
          handler: async (resp: any) => {
            // 3) Verify signature
            const verify = await apiPostJson<any>(`/api/payments/razorpay/verify`, resp)
            if (!verify.valid) { push('Payment verification failed'); return }

            // 4) Place order in DB as paid
            payload.payment = { provider: 'razorpay', orderId: resp.razorpay_order_id, paymentId: resp.razorpay_payment_id, signature: resp.razorpay_signature, captured: true }
            const data = await apiPostJson<any>(`/api/orders`, payload)
            clear(); push('Payment successful!')
            const oid = data.id || data._id || ''
            navigate(`/success?orderId=${encodeURIComponent(oid)}`)
          },
          modal: {
            ondismiss: () => { push('Payment cancelled') }
          }
        })
        rzp.open()
        return
      } else {
        // COD
        const data = await apiPostJson<any>(`/api/orders`, payload)
        clear(); push('Order placed!')
        const oid = data.id || data._id || ''
        navigate(`/success?orderId=${encodeURIComponent(oid)}`)
      }
    } catch (err: any) {
      push(err?.message || 'Payment failed. Try again.')
    }
  }

  return (
    <div className="container">
      <div className="page-surface checkout-surface">
        {!items.length ? (
          <div className="card" style={{ padding: 24, textAlign: 'center' }}>
            <h2 style={{ marginBottom: 8 }}>Your cart is empty</h2>
            <button className="btn btn-primary" onClick={() => navigate('/')}>Continue Shopping</button>
          </div>
        ) : (
          <div>
            <header style={{ padding: '8px 8px 12px 8px' }}>
              <h1 style={{ margin: 0, fontSize: 24, letterSpacing: 0.2 }}>Checkout</h1>
            </header>
            <div className="checkout-grid">
              <form className="card checkout-form" onSubmit={placeOrder}>
                <div style={{ fontWeight: 800 }}>Contact</div>
                <div className="form-grid">
                  <input className="input" name="email" placeholder="Email" required type="email" />
                  <input className="input" name="phone" placeholder="Phone" required pattern="[0-9]{10}" />
                  <input className="input" name="name" placeholder="Full name" required style={{ gridColumn: '1 / -1' }} />
                </div>

                <div style={{ fontWeight: 800, marginTop: 6 }}>Shipping</div>
                <div className="form-grid">
                  <input className="input" name="line1" placeholder="Address line 1" required style={{ gridColumn: '1 / -1' }} />
                  <input className="input" name="line2" placeholder="Address line 2 (optional)" style={{ gridColumn: '1 / -1' }} />
                  <input className="input" name="city" placeholder="City" required />
                  <input className="input" name="state" placeholder="State" required />
                  <input className="input" name="zip" placeholder="PIN/ZIP" required pattern="[0-9]{6}" />
                </div>
                <input type="hidden" name="country" value="India" />

                <div style={{ fontWeight: 800, marginTop: 6 }}>Payment</div>
                <label className="payment-row" style={{ gap: 8, alignItems: 'flex-start' as const }}>
                  <input type="radio" name="payment" value="razorpay" defaultChecked={hasPaymentKey} disabled={!hasPaymentKey}
                    onChange={() => setPaymentMethod('razorpay')} />
                  <div>
                    <div style={{ fontWeight: 600 }}>Pay Online</div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4, color: '#111' }}>
                      {['UPI','Cards','NetBanking'].map((t, i) => (
                        <span key={i} className="pill" style={{ opacity: hasPaymentKey ? 1 : 0.55 }}>{t}</span>
                      ))}
                    </div>
                    {!hasPaymentKey && (
                      <div style={{ color: 'var(--color-muted)', fontSize: 12, marginTop: 4 }}>Configure payment key to enable</div>
                    )}
                  </div>
                </label>
                <label className="payment-row" style={{ gap: 8, alignItems: 'flex-start' as const }}>
                  <input type="radio" name="payment" value="cod" defaultChecked={!hasPaymentKey}
                    onChange={() => setPaymentMethod('cod')} />
                  <div>
                    <div style={{ fontWeight: 600 }}>Cash on Delivery (COD)</div>
                    <div style={{ color: 'var(--color-muted)', fontSize: 12, marginTop: 4 }}>Pay with cash when your order arrives</div>
                  </div>
                </label>
                <button className="btn btn-buy order-btn" type="submit">{paymentMethod === 'razorpay' ? 'Pay & Order' : 'Place COD Order'}</button>
              </form>

              <aside className="card order-summary-card">
                <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 4 }}>Order Summary</div>
                {items.slice(0,5).map(i => (
                  <div key={i.product.id} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8, alignItems: 'center', padding: '8px 0', borderBottom: '1px dashed var(--color-border)' }}>
                    <div style={{ fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{i.product.title}</div>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                      <div className="qty-stepper">
                        <button type="button" className="stepper-btn" onClick={() => {
                          const nextQty = i.quantity - 1
                          if (nextQty <= 0) {
                            setPendingProductId(i.product.id)
                            setShowDiscount(true)
                          } else {
                            update(i.product.id, nextQty)
                          }
                        }}>-</button>
                        <span className="stepper-value">x{i.quantity}</span>
                        <button type="button" className="stepper-btn" onClick={() => update(i.product.id, i.quantity + 1)}>+</button>
                      </div>
                      <span style={{ fontWeight: 800 }}>₹{i.product.price * i.quantity}</span>
                      <button
                        type="button"
                        className="btn btn-remove"
                        onClick={() => { setPendingProductId(i.product.id); setShowDiscount(true) }}
                        style={{ marginLeft: 6 }}
                        aria-label={`Remove ${i.product.title} from cart`}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
                {items.length > 5 && (
                  <div className="small-muted" style={{ paddingTop: 6 }}>
                    +{items.length - 5} more item(s)
                  </div>
                )}
                <div className="list-row"><span>Subtotal</span><span>₹{subtotal}</span></div>
                {couponApplied && (
                  <div className="list-row" style={{ color:'#22c55e' }}>
                    <span>Coupon (YOUARESPECIAL)</span><span>-₹50</span>
                  </div>
                )}
                <div className="list-row"><span>Shipping</span><span>₹{shipping}</span></div>
                <div className="list-row"><span>Tax</span><span>₹{tax}</span></div>
                <div className="order-total">
                  <span>Total</span><span>₹{Math.max(0, total - (couponApplied ? 50 : 0))}</span>
                </div>
              </aside>
            </div>
          </div>
        )}
      </div>

      {/* Discount modal */}
      <DiscountModal
        open={showDiscount}
        onClose={() => {
          // No Thanks: apply the pending 0-qty update if any
          if (pendingProductId) {
            update(pendingProductId, 0)
            setPendingProductId(null)
          }
          setShowDiscount(false)
        }}
        onClaim={async () => {
          try {
            setCouponApplied(true)
            push('₹50 OFF applied')
            // Keep cart as-is; user claimed discount so we won't remove the item
            setShowDiscount(false)
          } catch {}
        }}
      />
    </div>
  )
}

