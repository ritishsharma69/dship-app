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
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import LockOutlined from '@mui/icons-material/LockOutlined'
import LocalShippingOutlined from '@mui/icons-material/LocalShippingOutlined'
import PaymentsOutlined from '@mui/icons-material/PaymentsOutlined'
import ShoppingBagOutlined from '@mui/icons-material/ShoppingBagOutlined'
import CheckRounded from '@mui/icons-material/CheckRounded'
import ReplayRounded from '@mui/icons-material/ReplayRounded'
import VerifiedUserOutlined from '@mui/icons-material/VerifiedUserOutlined'
import SupportAgentOutlined from '@mui/icons-material/SupportAgentOutlined'
import AccessTimeRounded from '@mui/icons-material/AccessTimeRounded'

// Apple-style input — purple focus ring comes from the .ck-in style block below
const INPUT: React.CSSProperties = {
  width: '100%', height: 52, padding: '0 16px', borderRadius: 14,
  border: '1.5px solid #E5E7EB', fontSize: 15, fontWeight: 500, color: '#1f2937',
  outline: 'none', background: '#fff', boxSizing: 'border-box',
  transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
}

/** Section header: tinted icon tile + title, matching the homepage card language. */
function SectionHead({ icon, tone, color, title }: { icon: React.ReactNode; tone: string; color: string; title: string }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.4, mb: 2 }}>
      <Box sx={{ width: 40, height: 40, borderRadius: '12px', display: 'grid', placeItems: 'center', bgcolor: tone, color, flexShrink: 0 }}>{icon}</Box>
      <Typography sx={{ fontWeight: 800, fontSize: 16.5, color: '#1f2937' }}>{title}</Typography>
    </Box>
  )
}

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

  // Savings vs MRP (compareAtPrice) + coupon — shown as a green highlight in the summary
  const mrpTotal = items.reduce((sum, i) => sum + (i.product.compareAtPrice || i.product.price) * i.quantity, 0)
  const payable = Math.max(0, total - (couponApplied ? 50 : 0))
  const saved = Math.max(0, mrpTotal - subtotal) + (couponApplied ? 50 : 0)

  // Deal countdown — gentle urgency, resets each visit
  const [dealLeft, setDealLeft] = useState(14 * 60 + 37)
  useEffect(() => {
    const t = setInterval(() => setDealLeft(s => (s > 0 ? s - 1 : 0)), 1000)
    return () => clearInterval(t)
  }, [])
  const dealMin = String(Math.floor(dealLeft / 60)).padStart(2, '0')
  const dealSec = String(dealLeft % 60).padStart(2, '0')


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
    <div className="container" style={{ background: 'linear-gradient(180deg, #FAF7FF 0%, #FFFFFF 60%)' }}>
      {/* Apple-style purple focus ring for the plain inputs */}
      <style>{`
        .ck-in:focus { border-color: #7C3AED !important; box-shadow: 0 0 0 4px rgba(124,58,237,0.13); }
        .ck-in::placeholder { color: #9CA3AF; }
      `}</style>
      <div className="page-surface checkout-surface" style={{ maxWidth: 1140, margin: '0 auto', padding: '24px 16px 48px' }}>
        {!items.length ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '65vh', textAlign: 'center', gap: 1.5, p: 4, bgcolor: '#fff', borderRadius: '24px', border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 8px 30px rgba(15,23,42,0.05)' }}>
            <Box sx={{ width: 64, height: 64, borderRadius: '20px', display: 'grid', placeItems: 'center', bgcolor: 'rgba(124,58,237,0.10)', color: '#7C3AED' }}>
              <ShoppingBagOutlined sx={{ fontSize: 30 }} />
            </Box>
            <Typography sx={{ fontFamily: 'Georgia, Times New Roman, serif', fontSize: 26, fontWeight: 700, color: '#1f2937' }}>Your cart is empty</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 320 }}>Looks like you haven't added anything yet. Browse our collection and find something you love!</Typography>
            <Button onClick={() => navigate('/')} sx={{ mt: 1, px: 3.5, py: 1.2, borderRadius: 999, textTransform: 'none', fontSize: 14.5, fontWeight: 800, color: '#fff', background: 'linear-gradient(135deg, #7C3AED 0%, #EC4899 100%)', boxShadow: '0 10px 24px rgba(124,58,237,0.30)', '&:hover': { background: 'linear-gradient(135deg, #6D28D9 0%, #DB2777 100%)' } }}>
              Continue Shopping
            </Button>
          </Box>
        ) : (
          <div>
            {/* Hero header — secure checkout + progress */}
            <Box sx={{ textAlign: 'center', mb: { xs: 3, md: 4 } }}>
              <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.7, px: 1.6, py: 0.6, borderRadius: 999, bgcolor: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.20)', mb: 1.2 }}>
                <LockOutlined sx={{ fontSize: 14, color: '#7C3AED' }} />
                <Typography sx={{ fontSize: 11.5, fontWeight: 800, color: '#7C3AED', letterSpacing: 0.6, lineHeight: 1, textTransform: 'uppercase' }}>Secure Checkout</Typography>
              </Box>
              <Typography sx={{ fontFamily: 'Georgia, Times New Roman, serif', fontSize: { xs: 27, md: 36 }, fontWeight: 700, color: '#1f2937', lineHeight: 1.15 }}>Almost There!</Typography>
              <Typography sx={{ mt: 0.6, fontSize: { xs: 13.5, md: 15 }, color: '#6B7280' }}>Complete your order in less than 30 seconds</Typography>

              {/* Step indicator: Cart ✓ — Checkout ● — Complete */}
              <Box sx={{ mt: 2.2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                {[
                  { label: 'Cart', state: 'done' },
                  { label: 'Checkout', state: 'active' },
                  { label: 'Complete', state: 'todo' },
                ].map((s, idx) => (
                  <Box key={s.label} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {idx > 0 && <Box sx={{ width: { xs: 28, md: 56 }, height: 2, borderRadius: 2, background: s.state === 'todo' ? '#E5E7EB' : 'linear-gradient(90deg, #7C3AED, #A458E8)' }} />}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.7 }}>
                      <Box sx={{
                        width: 22, height: 22, borderRadius: '50%', display: 'grid', placeItems: 'center', fontSize: 11, fontWeight: 800, flexShrink: 0,
                        ...(s.state === 'done' && { bgcolor: '#7C3AED', color: '#fff' }),
                        ...(s.state === 'active' && { bgcolor: '#fff', color: '#7C3AED', border: '2px solid #7C3AED', boxShadow: '0 0 0 4px rgba(124,58,237,0.15)' }),
                        ...(s.state === 'todo' && { bgcolor: '#fff', color: '#9CA3AF', border: '2px solid #E5E7EB' }),
                      }}>
                        {s.state === 'done' ? <CheckRounded sx={{ fontSize: 13 }} /> : <Box component="span" sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: 'currentColor' }} />}
                      </Box>
                      <Typography sx={{ fontSize: { xs: 11.5, md: 12.5 }, fontWeight: s.state === 'active' ? 800 : 600, color: s.state === 'active' ? '#7C3AED' : s.state === 'done' ? '#374151' : '#9CA3AF' }}>{s.label}</Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            </Box>

            <Box className="checkout-grid" sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1.35fr) minmax(0, 1fr)' }, gap: 3, alignItems: 'start' }}>
              {/* ——— Left: form card ——— */}
              <form className="card checkout-form" onSubmit={placeOrder} ref={formRef} style={{ background: '#fff', borderRadius: 24, padding: 'clamp(20px, 3vw, 28px)', border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 8px 30px rgba(15,23,42,0.05)' }}>

                {/* Shipping details */}
                <SectionHead icon={<LocalShippingOutlined sx={{ fontSize: 20 }} />} tone="rgba(124,58,237,0.10)" color="#7C3AED" title="Shipping Details" />
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.5 }}>
                  <input className="ck-in" name="name" placeholder="Full name" required style={INPUT} maxLength={50} minLength={2} onInput={allowLetters} />
                  <input className="ck-in" name="phone" placeholder="Phone number" required pattern="[0-9]{10}" inputMode="numeric" maxLength={10} onInput={onDigits10} title="Enter 10-digit mobile number" style={INPUT} />
                  <input className="ck-in" name="line1" placeholder="Address line 1" required style={{ ...INPUT, gridColumn: '1 / -1' }} minLength={5} maxLength={120} />
                  <input className="ck-in" name="line2" placeholder="Address line 2 (optional)" style={{ ...INPUT, gridColumn: '1 / -1' }} maxLength={120} />
                  <input className="ck-in" name="city" placeholder="City" required pattern="[A-Za-z\\s]{2,40}" maxLength={40} onInput={allowLetters} title="Letters and spaces only" style={INPUT} />
                  <input className="ck-in" name="state" placeholder="State" required pattern="[A-Za-z\\s]{2,40}" maxLength={40} onInput={allowLetters} title="Letters and spaces only" style={INPUT} />
                  <input className="ck-in" name="zip" placeholder="PIN Code" required pattern="[0-9]{6}" inputMode="numeric" maxLength={6} onInput={onDigits6} title="Enter 6-digit PIN code" style={INPUT} />
                  <input className="ck-in" name="email" placeholder="Email address" required type="email" inputMode="email" style={INPUT} />
                </Box>
                <input type="hidden" name="country" value="India" />

                {/* Payment method */}
                <Box sx={{ mt: 3.5 }}>
                  <SectionHead icon={<PaymentsOutlined sx={{ fontSize: 20 }} />} tone="rgba(245,158,11,0.14)" color="#B45309" title="Payment Method" />
                </Box>
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
                <label style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 18px', borderRadius: 16, border: '2px solid #7C3AED', background: 'linear-gradient(135deg, rgba(124,58,237,0.06) 0%, #fff 70%)', cursor: 'pointer', boxShadow: '0 4px 14px rgba(124,58,237,0.10)' }}>
                  <input type="radio" name="payment" value="cod" defaultChecked={true}
                    onChange={() => setPaymentMethod('cod')} style={{ width: 20, height: 20, accentColor: '#7C3AED' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 800, fontSize: 15, color: '#1f2937' }}>Cash on Delivery (COD)</div>
                    <div style={{ color: '#6b7280', fontSize: 13, marginTop: 3 }}>Pay with cash when your order arrives at your doorstep</div>
                  </div>
                  <span style={{ background: 'rgba(16,185,129,0.10)', color: '#047857', border: '1px solid rgba(16,185,129,0.25)', padding: '4px 10px', borderRadius: 999, fontSize: 11, fontWeight: 800 }}>Available</span>
                </label>
                <Box sx={{ mt: 1.2, display: 'flex', alignItems: 'center', gap: 1.6, px: 2.2, py: 1.6, borderRadius: '16px', border: '1.5px dashed #E5E7EB', bgcolor: '#FAFAFA', opacity: 0.75 }}>
                  <Box sx={{ width: 20, height: 20, borderRadius: '50%', border: '2px solid #D1D5DB', flexShrink: 0 }} />
                  <Box sx={{ flex: 1 }}>
                    <Typography sx={{ fontWeight: 700, fontSize: 14.5, color: '#6B7280' }}>UPI / Cards / NetBanking</Typography>
                    <Typography sx={{ fontSize: 12.5, color: '#9CA3AF', mt: 0.2 }}>Online payments launching soon</Typography>
                  </Box>
                  <Typography sx={{ fontSize: 11, fontWeight: 800, color: '#9CA3AF', px: 1.2, py: 0.4, borderRadius: 999, bgcolor: '#F3F4F6' }}>Coming Soon</Typography>
                </Box>

                {/* Trust mini-bar above CTA */}
                <Box sx={{ mt: 2.5, mb: 1.5, display: 'flex', justifyContent: 'center', gap: { xs: 1.5, sm: 3 }, flexWrap: 'wrap' }}>
                  {[
                    { icon: <LockOutlined sx={{ fontSize: 13 }} />, t: 'SSL Secured' },
                    { icon: <LocalShippingOutlined sx={{ fontSize: 13 }} />, t: 'Free Shipping' },
                    { icon: <ReplayRounded sx={{ fontSize: 13 }} />, t: 'Easy Returns' },
                  ].map(b => (
                    <Box key={b.t} sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, color: '#6B7280' }}>
                      {b.icon}
                      <Typography sx={{ fontSize: 11.5, fontWeight: 600 }}>{b.t}</Typography>
                    </Box>
                  ))}
                </Box>

                {paymentMethod !== 'cod' ? (
                  <button className="btn btn-buy order-btn" type="submit" style={{ width: '100%', height: 60, borderRadius: 16, fontSize: 16.5, fontWeight: 800, background: 'linear-gradient(135deg, #7C3AED 0%, #EC4899 100%)', color: '#fff', border: 'none', cursor: 'pointer', boxShadow: '0 16px 34px rgba(124,58,237,0.28)' }}>Pay & Complete Order • ₹{payable}</button>
                ) : (
                  <button className="btn btn-buy order-btn" type="button" onClick={() => setShowConfirmCOD(true)} style={{ width: '100%', height: 60, borderRadius: 16, fontSize: 16.5, fontWeight: 800, background: 'linear-gradient(135deg, #7C3AED 0%, #EC4899 100%)', color: '#fff', border: 'none', cursor: 'pointer', boxShadow: '0 16px 34px rgba(124,58,237,0.28)' }}>Complete Order • ₹{payable}</button>
                )}
              </form>

              {/* ——— Right: sticky order summary ——— */}
              <Box component="aside" className="card order-summary-card" sx={{ bgcolor: '#fff', borderRadius: '24px', p: { xs: 2.2, md: 2.8 }, border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 8px 30px rgba(15,23,42,0.05)', height: 'fit-content', overflow: 'hidden', position: { md: 'sticky' }, top: { md: 110 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.4 }}>
                    <Box sx={{ width: 40, height: 40, borderRadius: '12px', display: 'grid', placeItems: 'center', bgcolor: 'rgba(124,58,237,0.10)', color: '#7C3AED' }}>
                      <ShoppingBagOutlined sx={{ fontSize: 20 }} />
                    </Box>
                    <Typography sx={{ fontWeight: 800, fontSize: 16.5, color: '#1f2937' }}>Your Order</Typography>
                  </Box>
                  <Typography sx={{ fontSize: 12, fontWeight: 800, color: '#7C3AED', px: 1.2, py: 0.4, borderRadius: 999, bgcolor: 'rgba(124,58,237,0.08)' }}>{items.reduce((n, i) => n + i.quantity, 0)} item{items.reduce((n, i) => n + i.quantity, 0) > 1 ? 's' : ''}</Typography>
                </Box>

                {items.slice(0,5).map(i => {
                  const mrp = i.product.compareAtPrice && i.product.compareAtPrice > i.product.price ? i.product.compareAtPrice : 0
                  const offPct = mrp ? Math.round((1 - i.product.price / mrp) * 100) : 0
                  return (
                    <Box key={i.product.id} sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start', p: 1.2, mb: 1, borderRadius: '16px', border: '1px solid rgba(0,0,0,0.05)', bgcolor: '#FAFAFC' }}>
                      <img
                        src={i.product.images?.[0] || '/placeholder.png'}
                        alt={i.product.title}
                        style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 12, border: '1px solid #eee', flexShrink: 0, background: '#fff' }}
                      />
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography sx={{ fontWeight: 700, fontSize: 13.5, color: '#1f2937', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{i.product.title}</Typography>
                        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.8, mt: 0.4 }}>
                          <Typography sx={{ fontWeight: 800, fontSize: 14.5, color: '#1f2937' }}>₹{i.product.price * i.quantity}</Typography>
                          {mrp > 0 && <Typography sx={{ fontSize: 12, color: '#9CA3AF', textDecoration: 'line-through' }}>₹{mrp * i.quantity}</Typography>}
                          {offPct > 0 && <Typography sx={{ fontSize: 10.5, fontWeight: 800, color: '#047857', px: 0.8, py: 0.2, borderRadius: 999, bgcolor: 'rgba(16,185,129,0.10)' }}>{offPct}% OFF</Typography>}
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.8, flexWrap: 'wrap' }}>
                          <div className="qty-stepper" style={{ transform: 'scale(0.85)', transformOrigin: 'left' }}>
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
                          <Typography
                            component="button"
                            type="button"
                            onClick={() => { setPendingProductId(i.product.id); setShowDiscount(true) }}
                            aria-label={`Remove ${i.product.title} from cart`}
                            sx={{ all: 'unset', cursor: 'pointer', fontSize: 12, fontWeight: 700, color: '#9CA3AF', '&:hover': { color: '#DC2626', textDecoration: 'underline' } }}
                          >
                            Remove
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  )
                })}
                {items.length > 5 && (
                  <Typography sx={{ fontSize: 12.5, color: '#6B7280', pt: 0.5 }}>+{items.length - 5} more item(s)</Typography>
                )}

                {/* Savings highlight */}
                {saved > 0 && (
                  <Box sx={{ mt: 1.5, px: 1.8, py: 1.1, borderRadius: '12px', bgcolor: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.7 }}>
                    <Typography sx={{ fontSize: 13.5, fontWeight: 800, color: '#047857' }}>You Saved ₹{saved} 🎉</Typography>
                  </Box>
                )}

                {/* Price breakdown */}
                <Box sx={{ mt: 2, pt: 1.5, borderTop: '1px dashed #E5E7EB', display: 'grid', gap: 1.1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                    <Typography sx={{ fontSize: 13.5, color: '#6B7280' }}>Subtotal</Typography>
                    <Typography sx={{ fontSize: 13.5, fontWeight: 700, color: '#1f2937' }}>₹{subtotal}</Typography>
                  </Box>
                  {couponApplied && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography sx={{ fontSize: 13.5, color: '#047857' }}>Coupon 🎉</Typography>
                      <Typography sx={{ fontSize: 13.5, fontWeight: 700, color: '#047857' }}>-₹50</Typography>
                    </Box>
                  )}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography sx={{ fontSize: 13.5, color: '#6B7280' }}>Shipping</Typography>
                    <Typography sx={{ fontSize: 13.5, fontWeight: 800, color: shipping === 0 ? '#047857' : '#1f2937' }}>{shipping === 0 ? 'FREE' : `₹${shipping}`}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography sx={{ fontSize: 13.5, color: '#6B7280' }}>Tax</Typography>
                    <Typography sx={{ fontSize: 13.5, fontWeight: 700, color: '#1f2937' }}>₹{tax}</Typography>
                  </Box>
                </Box>

                {/* Total */}
                <Box sx={{ mt: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 2, py: 1.6, borderRadius: '16px', background: 'linear-gradient(135deg, rgba(124,58,237,0.07) 0%, #fff 70%)', border: '2px solid #7C3AED' }}>
                  <Typography sx={{ fontWeight: 800, fontSize: 15.5, color: '#1f2937' }}>Total</Typography>
                  <Typography sx={{ fontWeight: 900, fontSize: 21, color: '#7C3AED' }}>₹{payable}</Typography>
                </Box>

                {/* Deal countdown */}
                {dealLeft > 0 && (
                  <Box sx={{ mt: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.7, px: 1.8, py: 1, borderRadius: '12px', bgcolor: 'rgba(245,158,11,0.10)', border: '1px solid rgba(245,158,11,0.25)' }}>
                    <AccessTimeRounded sx={{ fontSize: 15, color: '#B45309' }} />
                    <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: '#92400E' }}>🔥 Deal expires in <Box component="span" sx={{ fontWeight: 900, fontVariantNumeric: 'tabular-nums' }}>{dealMin}:{dealSec}</Box></Typography>
                  </Box>
                )}

                {/* Trust pills */}
                <Box sx={{ mt: 2, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
                  {[
                    { icon: <VerifiedUserOutlined sx={{ fontSize: 15 }} />, t: '100% Secure', tone: 'rgba(16,185,129,0.08)', color: '#047857' },
                    { icon: <LocalShippingOutlined sx={{ fontSize: 15 }} />, t: 'Free Delivery', tone: 'rgba(14,165,233,0.08)', color: '#075985' },
                    { icon: <ReplayRounded sx={{ fontSize: 15 }} />, t: 'Easy Returns', tone: 'rgba(124,58,237,0.08)', color: '#6D28D9' },
                    { icon: <SupportAgentOutlined sx={{ fontSize: 15 }} />, t: 'Support', tone: 'rgba(245,158,11,0.10)', color: '#B45309' },
                  ].map(b => (
                    <Box key={b.t} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.6, py: 0.9, borderRadius: '10px', bgcolor: b.tone, color: b.color }}>
                      {b.icon}
                      <Typography sx={{ fontSize: 11.5, fontWeight: 700 }}>{b.t}</Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            </Box>
          </div>
        )}
      </div>

      {/* COD confirmation modal */}
      <Dialog open={showConfirmCOD} onClose={() => setShowConfirmCOD(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: '24px' } }}>
        <DialogTitle sx={{ fontWeight: 800 }}>Confirm COD Order</DialogTitle>
        <DialogContent>
          <div style={{ color: '#6B7280', fontSize: 14, marginBottom: 8 }}>
            Are you sure you want to place this order with Cash on Delivery?
          </div>
          <div className="small-muted">Items: {items.length} • Total: ₹{payable}</div>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button variant="outlined" onClick={() => setShowConfirmCOD(false)} sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 700, borderColor: '#E5E7EB', color: '#374151', '&:hover': { borderColor: '#7C3AED', color: '#7C3AED', bgcolor: 'rgba(124,58,237,0.04)' } }}>No</Button>
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
            sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 800, background: 'linear-gradient(135deg, #7C3AED 0%, #EC4899 100%)', boxShadow: '0 8px 20px rgba(124,58,237,0.28)', '&:hover': { background: 'linear-gradient(135deg, #6D28D9 0%, #DB2777 100%)' } }}
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

