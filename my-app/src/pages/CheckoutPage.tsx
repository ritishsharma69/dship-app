/** React */
import { useEffect, useRef, useState } from 'react'
import { useCart } from '../lib/cart'
import { useRouter } from '../lib/router'
import { useToast } from '../lib/toast'
import { events } from '../analytics'
import { apiGetJson, apiPostJson } from '../lib/api'
import DiscountModal from '../components/DiscountModal'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'



export default function CheckoutPage() {
  const { items, clear, update } = useCart()
  const { navigate } = useRouter()
  const { push } = useToast()
  const [paymentMethod, setPaymentMethod] = useState<string>('phonepe')

  // Discount modal state
  // COD confirmation modal
  const [showConfirmCOD, setShowConfirmCOD] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)

  const [showDiscount, setShowDiscount] = useState(false)
  const [pendingProductId, setPendingProductId] = useState<string | null>(null)
  // Do NOT auto-apply coupon; only apply when user explicitly claims it
  const [couponApplied, setCouponApplied] = useState<boolean>(false)
  // Input filters
  const allowLetters = (e: any) => {
    const el = e.currentTarget as HTMLInputElement
    el.value = el.value.replace(/[^a-zA-Z\s]/g, '').replace(/\s{2,}/g, ' ')
  }
  const digitsOnly = (max: number) => (e: any) => {
    const el = e.currentTarget as HTMLInputElement
    el.value = el.value.replace(/[^0-9]/g, '').slice(0, max)
  }
  const onDigits10 = digitsOnly(10)
  const onDigits6 = digitsOnly(6)

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

  // Warm the server (reduce cold-start latency)
  useEffect(() => {
    apiGetJson('/api/ping', { timeoutMs: 4000 }).catch(() => {})
  }, [])




  const subtotal = items.reduce((sum, i) => sum + i.product.price * i.quantity, 0)
  const shipping = subtotal > 0 ? 0 : 0
  const tax = 0
  const total = subtotal + shipping + tax


  // Idempotent request id for safe retries
  const reqIdRef = useRef<string>('')
  function ensureReqId() {
    if (!reqIdRef.current) {
      reqIdRef.current = `${Date.now()}_${Math.random().toString(36).slice(2,10)}`
    }
    return reqIdRef.current
  }

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
      email: String(fd.get('email')||''),
      name: String(fd.get('name')||''),
      phone: String(fd.get('phone')||''),
      address: {
        country: String(fd.get('country')||''), line1: String(fd.get('line1')||''), line2: String(fd.get('line2')||''),
        city: String(fd.get('city')||''), state: String(fd.get('state')||''), zip: String(fd.get('zip')||'')
      },
      items: items.map(i => ({ productId: String(i.product.id), title: String(i.product.title), quantity: Number(i.quantity), unitPrice: Number(i.product.price) })),
      totals: { subtotal: Number(subtotal), shipping: Number(shipping), tax: Number(tax), total: Number(total) },
      paymentMethod: String(paymentMethod || 'cod')
    }


    try {
      if (paymentMethod === 'phonepe') {
        // PhonePe Standard Checkout
        // Persist the order payload for completing after redirect
        payload.requestId = ensureReqId()
        const resp = await apiPostJson<any>(`/api/payments/phonepe/checkout`, {
          amount: Math.round(total * 100), // paisa
          redirectUrl: `${location.origin}/payment/phonepe/return`
        }, { loaderText: 'Redirecting to PhonePe…' })
        if (!resp?.redirectUrl) throw new Error('Failed to create PhonePe checkout')
        localStorage.setItem('pp_last_order', String(resp.merchantOrderId || ''))
        localStorage.setItem('pp_pending_order', JSON.stringify(payload))
        window.location.href = resp.redirectUrl
        return
      } else {
        // COD
        payload.requestId = ensureReqId()
        try {
          const data = await apiPostJson<any>(`/api/orders`, payload, {
            loaderText: 'Placing COD order…\nPlease don\'t press Back; stay on this screen',
            timeoutMs: 45000,
          })
          clear(); push('Order placed!')
          const oid = data.id || data._id || ''
          navigate(`/success?orderId=${encodeURIComponent(oid)}`)
        } catch (e: any) {
          const msg = String(e?.message || '').toLowerCase()
          if (msg.includes('timed out')) {
            await new Promise(r => setTimeout(r, 2000))
            const data = await apiPostJson<any>(`/api/orders`, payload, {
              loaderText: 'Retrying…\nPlease don\'t press Back; stay on this screen',
              timeoutMs: 45000,
            })
            clear(); push('Order placed!')
            const oid = data.id || data._id || ''
            navigate(`/success?orderId=${encodeURIComponent(oid)}`)
          } else {
            throw e
          }
        }
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
              <form className="card checkout-form" onSubmit={placeOrder} ref={formRef}>
                <div style={{ fontWeight: 800 }}>Contact</div>
                <div className="form-grid">
                  <input className="input" name="email" placeholder="Email" required type="email" inputMode="email" />
                  <input className="input" name="phone" placeholder="Phone" required pattern="[0-9]{10}" inputMode="numeric" maxLength={10} onInput={onDigits10} title="Enter 10-digit mobile number" />
                  <input className="input" name="name" placeholder="Full name" required style={{ gridColumn: '1 / -1' }} maxLength={50} minLength={2} pattern="[A-Za-z\\s]{2,50}" onInput={allowLetters} title="Letters and spaces only" />
                </div>

                <div style={{ fontWeight: 800, marginTop: 6 }}>Shipping</div>
                <div className="form-grid">
                  <input className="input" name="line1" placeholder="Address line 1" required style={{ gridColumn: '1 / -1' }} minLength={5} maxLength={120} />
                  <input className="input" name="line2" placeholder="Address line 2 (optional)" style={{ gridColumn: '1 / -1' }} maxLength={120} />
                  <input className="input" name="city" placeholder="City" required pattern="[A-Za-z\\s]{2,40}" maxLength={40} onInput={allowLetters} title="Letters and spaces only" />
                  <input className="input" name="state" placeholder="State" required pattern="[A-Za-z\\s]{2,40}" maxLength={40} onInput={allowLetters} title="Letters and spaces only" />
                  <input className="input" name="zip" placeholder="PIN/ZIP" required pattern="[0-9]{6}" inputMode="numeric" maxLength={6} onInput={onDigits6} title="Enter 6-digit PIN code" />
                </div>
                <input type="hidden" name="country" value="India" />

                <div style={{ fontWeight: 800, marginTop: 6 }}>Payment</div>
                <label className="payment-row" style={{ gap: 8, alignItems: 'flex-start' as const }}>
                  <input type="radio" name="payment" value="phonepe" defaultChecked={true}
                    onChange={() => setPaymentMethod('phonepe')} />
                  <div>
                    <div style={{ fontWeight: 600 }}>PhonePe (UPI, Cards, NetBanking)</div>
                    <div className="small-muted" style={{ marginTop: 4 }}>You’ll be redirected to PhonePe to complete payment</div>
                  </div>
                </label>
                <label className="payment-row" style={{ gap: 8, alignItems: 'flex-start' as const }}>
                  <input type="radio" name="payment" value="cod"
                    onChange={() => setPaymentMethod('cod')} />
                  <div>
                    <div style={{ fontWeight: 600 }}>Cash on Delivery (COD)</div>
                    <div style={{ color: 'var(--color-muted)', fontSize: 12, marginTop: 4 }}>Pay with cash when your order arrives</div>
                  </div>
                </label>
                {paymentMethod !== 'cod' ? (
                  <button className="btn btn-buy order-btn" type="submit">Pay & Order</button>
                ) : (
                  <button className="btn btn-buy order-btn" type="button" onClick={() => setShowConfirmCOD(true)}>Place COD Order</button>
                )}
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

      {/* COD confirmation modal */}
      <Dialog open={showConfirmCOD} onClose={() => setShowConfirmCOD(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Confirm COD Order</DialogTitle>
        <DialogContent>
          <div style={{ color: '#6B7280', fontSize: 14, marginBottom: 8 }}>
            Are you sure you want to place this order with Cash on Delivery?
          </div>
          <div className="small-muted">Items: {items.length} • Total: ₹{Math.max(0, total - (couponApplied ? 50 : 0))}</div>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button variant="outlined" onClick={() => setShowConfirmCOD(false)}>No</Button>
          <Button
            variant="contained"
            onClick={() => {
              const f = formRef.current
              if (!f) return
              if (typeof (f as any).reportValidity === 'function' && !(f as any).reportValidity()) {
                return
              }
              setShowConfirmCOD(false)
              f.requestSubmit()
            }}
            sx={{ background: 'linear-gradient(135deg, #FF3F6C 0%, #E73962 100%)' }}
          >
            Yes, Place Order
          </Button>
        </DialogActions>
      </Dialog>

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

