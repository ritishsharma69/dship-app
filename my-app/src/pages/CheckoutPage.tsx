/** React */
import { useEffect, useRef, useState, Suspense, lazy } from 'react'
import { useCart } from '../lib/cart'
import { useRouter } from '../lib/router'
import { useToast } from '../lib/toast'
import { events } from '../analytics'
import { apiGetJson, apiPostJson } from '../lib/api'
const DiscountModal = lazy(() => import('../components/DiscountModal'))
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'



export default function CheckoutPage() {
  const { items, clear, update } = useCart()
  const { navigate } = useRouter()
  const { push } = useToast()
  const [paymentMethod, setPaymentMethod] = useState<string>('cod')

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
    <div className="container" style={{ background: '#f8fafc' }}>
      <div className="page-surface checkout-surface" style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 16px', paddingBottom: 40 }}>
        {!items.length ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '65vh', textAlign: 'center', gap: 16, padding: 32, background: '#fff', borderRadius: 16, border: '1px solid rgba(0,0,0,0.06)' }}>
            <div style={{ fontSize: 64, lineHeight: 1 }}>🛒</div>
            <h2 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: '#1f2937' }}>Your cart is empty</h2>
            <p style={{ margin: 0, color: '#6b7280', fontSize: 14, maxWidth: 320 }}>Looks like you haven't added anything yet. Browse our collection and find something you love!</p>
            <button className="btn btn-primary" onClick={() => navigate('/')} style={{ marginTop: 8, padding: '12px 32px', borderRadius: 12, fontSize: 15, fontWeight: 700, background: 'linear-gradient(135deg, #FF3F6C 0%, #E73962 100%)', color: '#fff', border: 'none', cursor: 'pointer' }}>
              Continue Shopping
            </button>
          </div>
        ) : (
          <div>
            <div className="checkout-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 24, alignItems: 'start' }}>
              <form className="card checkout-form" onSubmit={placeOrder} ref={formRef} style={{ background: '#fff', borderRadius: 16, padding: 24, border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
                
                {/* Contact Section */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                  <span style={{ fontSize: 24 }}>📧</span>
                  <div style={{ fontWeight: 800, fontSize: 18, color: '#1f2937' }}>Contact Information</div>
                </div>
                <div className="form-grid" style={{ display: 'grid', gap: 12 }}>
                  <input className="input" name="email" placeholder="📧 Email address" required type="email" inputMode="email" style={{ padding: '14px 16px', borderRadius: 10, border: '1px solid #e5e7eb', fontSize: 15 }} />
                  <input className="input" name="phone" placeholder="📱 Phone number" required pattern="[0-9]{10}" inputMode="numeric" maxLength={10} onInput={onDigits10} title="Enter 10-digit mobile number" style={{ padding: '14px 16px', borderRadius: 10, border: '1px solid #e5e7eb', fontSize: 15 }} />
                  <input className="input" name="name" placeholder="👤 Full name" required style={{ gridColumn: '1 / -1', padding: '14px 16px', borderRadius: 10, border: '1px solid #e5e7eb', fontSize: 15 }} maxLength={50} minLength={2} onInput={allowLetters} />
                </div>

                {/* Shipping Section */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 24, marginBottom: 16 }}>
                  <span style={{ fontSize: 24 }}>🚚</span>
                  <div style={{ fontWeight: 800, fontSize: 18, color: '#1f2937' }}>Shipping Address</div>
                </div>
                <div className="form-grid" style={{ display: 'grid', gap: 12 }}>
                  <input className="input" name="line1" placeholder="🏠 Address line 1" required style={{ gridColumn: '1 / -1', padding: '14px 16px', borderRadius: 10, border: '1px solid #e5e7eb', fontSize: 15 }} minLength={5} maxLength={120} />
                  <input className="input" name="line2" placeholder="🏢 Address line 2 (optional)" style={{ gridColumn: '1 / -1', padding: '14px 16px', borderRadius: 10, border: '1px solid #e5e7eb', fontSize: 15 }} maxLength={120} />
                  <input className="input" name="city" placeholder="🌆 City" required pattern="[A-Za-z\\s]{2,40}" maxLength={40} onInput={allowLetters} title="Letters and spaces only" style={{ padding: '14px 16px', borderRadius: 10, border: '1px solid #e5e7eb', fontSize: 15 }} />
                  <input className="input" name="state" placeholder="🗺️ State" required pattern="[A-Za-z\\s]{2,40}" maxLength={40} onInput={allowLetters} title="Letters and spaces only" style={{ padding: '14px 16px', borderRadius: 10, border: '1px solid #e5e7eb', fontSize: 15 }} />
                  <input className="input" name="zip" placeholder="📍 PIN Code" required pattern="[0-9]{6}" inputMode="numeric" maxLength={6} onInput={onDigits6} title="Enter 6-digit PIN code" style={{ padding: '14px 16px', borderRadius: 10, border: '1px solid #e5e7eb', fontSize: 15 }} />
                </div>
                <input type="hidden" name="country" value="India" />

                {/* Payment Section */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 24, marginBottom: 16 }}>
                  <span style={{ fontSize: 24 }}>💳</span>
                  <div style={{ fontWeight: 800, fontSize: 18, color: '#1f2937' }}>Payment Method</div>
                </div>
                {/* PhonePe option - temporarily disabled
                <label className="payment-row" style={{ gap: 8, alignItems: 'flex-start' as const }}>
                  <input type="radio" name="payment" value="phonepe" defaultChecked={true}
                    onChange={() => setPaymentMethod('phonepe')} />
                  <div>
                    <div style={{ fontWeight: 600 }}>PhonePe (UPI, Cards, NetBanking)</div>
                    <div className="small-muted" style={{ marginTop: 4 }}>You’ll be redirected to PhonePe to complete payment</div>
                  </div>
                </label>
                */}
                <label style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 18px', borderRadius: 12, border: '2px solid #FF3F6C', background: 'linear-gradient(135deg, #fff5f7 0%, #fff 100%)', cursor: 'pointer', marginBottom: 20 }}>
                  <input type="radio" name="payment" value="cod" defaultChecked={true}
                    onChange={() => setPaymentMethod('cod')} style={{ width: 20, height: 20, accentColor: '#FF3F6C' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 15, color: '#1f2937', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span>💵</span> Cash on Delivery (COD)
                    </div>
                    <div style={{ color: '#6b7280', fontSize: 13, marginTop: 4 }}>Pay with cash when your order arrives at your doorstep</div>
                  </div>
                  <span style={{ background: '#22c55e', color: '#fff', padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>Available</span>
                </label>

                {paymentMethod !== 'cod' ? (
                  <button className="btn btn-buy order-btn" type="submit" style={{ width: '100%', padding: '16px 24px', borderRadius: 12, fontSize: 16, fontWeight: 800, background: 'linear-gradient(135deg, #FF3F6C 0%, #E73962 100%)', color: '#fff', border: 'none', cursor: 'pointer', boxShadow: '0 4px 15px rgba(255,63,108,0.3)' }}>🛒 Pay & Order</button>
                ) : (
                  <button className="btn btn-buy order-btn" type="button" onClick={() => setShowConfirmCOD(true)} style={{ width: '100%', padding: '16px 24px', borderRadius: 12, fontSize: 16, fontWeight: 800, background: 'linear-gradient(135deg, #FF3F6C 0%, #E73962 100%)', color: '#fff', border: 'none', cursor: 'pointer', boxShadow: '0 4px 15px rgba(255,63,108,0.3)' }}>🛒 Place COD Order</button>
                )}
              </form>

              <aside className="card order-summary-card" style={{ background: '#fff', borderRadius: 16, padding: '16px', border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 4px 20px rgba(0,0,0,0.04)', height: 'fit-content', overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                  <span style={{ fontSize: 24 }}>📦</span>
                  <div style={{ fontWeight: 800, fontSize: 18, color: '#1f2937' }}>Order Summary</div>
                </div>
                {items.slice(0,5).map(i => (
                  <div key={i.product.id} style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', padding: '12px 0', borderBottom: '1px dashed var(--color-border)' }}>
                    <img
                      src={i.product.images?.[0] || '/placeholder.png'}
                      alt={i.product.title}
                      style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 8, border: '1px solid #eee', flexShrink: 0 }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: 14 }}>{i.product.title}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                        <div className="qty-stepper" style={{ transform: 'scale(0.9)', transformOrigin: 'left' }}>
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
                        <span style={{ fontWeight: 800, fontSize: 14 }}>₹{i.product.price * i.quantity}</span>
                        <button
                          type="button"
                          className="btn btn-remove"
                          onClick={() => { setPendingProductId(i.product.id); setShowDiscount(true) }}
                          style={{ padding: '4px 10px', fontSize: 12 }}
                          aria-label={`Remove ${i.product.title} from cart`}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {items.length > 5 && (
                  <div className="small-muted" style={{ paddingTop: 6 }}>
                    +{items.length - 5} more item(s)
                  </div>
                )}
                {/* Price breakdown */}
                <div style={{ marginTop: 16, padding: '12px 0', borderTop: '1px dashed #e5e7eb' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, color: '#6b7280', fontSize: 14 }}>
                    <span>Subtotal</span><span style={{ color: '#1f2937', fontWeight: 600 }}>₹{subtotal}</span>
                  </div>
                  {couponApplied && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, color: '#22c55e', fontSize: 14 }}>
                      <span>🎉 Coupon</span><span style={{ fontWeight: 600 }}>-₹50</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, color: '#6b7280', fontSize: 14 }}>
                    <span>🚚 Shipping</span><span style={{ color: shipping === 0 ? '#22c55e' : '#1f2937', fontWeight: 600 }}>{shipping === 0 ? 'FREE' : `₹${shipping}`}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, color: '#6b7280', fontSize: 14 }}>
                    <span>Tax</span><span style={{ color: '#1f2937', fontWeight: 600 }}>₹{tax}</span>
                  </div>
                </div>

                {/* Total */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'linear-gradient(135deg, #fff5f7 0%, #fff 100%)', borderRadius: 12, border: '2px solid #FF3F6C' }}>
                  <span style={{ fontWeight: 800, fontSize: 16, color: '#1f2937' }}>Total</span>
                  <span style={{ fontWeight: 900, fontSize: 20, color: '#FF3F6C' }}>₹{Math.max(0, total - (couponApplied ? 50 : 0))}</span>
                </div>

                {/* Trust badges */}
                <div style={{ marginTop: 16, display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#f0fdf4', color: '#166534', padding: '5px 10px', borderRadius: 16, fontSize: 10, fontWeight: 600 }}>
                    🔒 Secure
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#fef3c7', color: '#92400e', padding: '5px 10px', borderRadius: 16, fontSize: 10, fontWeight: 600 }}>
                    🚚 Fast
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#ede9fe', color: '#5b21b6', padding: '5px 10px', borderRadius: 16, fontSize: 10, fontWeight: 600 }}>
                    ↩️ Returns
                  </span>
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
      <Suspense fallback={null}>
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
      </Suspense>
    </div>
  )
}

