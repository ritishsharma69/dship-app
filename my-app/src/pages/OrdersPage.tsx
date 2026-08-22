import { useEffect, useMemo, useState } from 'react'
import { useRouter } from '../lib/router'
import { useToast } from '../lib/toast'
import { apiGetJson, apiPostJson } from '../lib/api'
// MUI
import Container from '@mui/material/Container'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Alert from '@mui/material/Alert'
import Link from '@mui/material/Link'
import Skeleton from '@mui/material/Skeleton'
import LocalShippingOutlined from '@mui/icons-material/LocalShippingOutlined'
import MailOutlineRounded from '@mui/icons-material/MailOutlineRounded'
import RefreshRounded from '@mui/icons-material/RefreshRounded'
import LogoutRounded from '@mui/icons-material/LogoutRounded'
import ExpandMoreRounded from '@mui/icons-material/ExpandMoreRounded'
import LocationOnOutlined from '@mui/icons-material/LocationOnOutlined'
import LocalPhoneOutlined from '@mui/icons-material/LocalPhoneOutlined'
import ShoppingBagOutlined from '@mui/icons-material/ShoppingBagOutlined'
import ReplayRounded from '@mui/icons-material/ReplayRounded'

// Shared pill-button style for the logged-in header actions
const PILL_BTN = {
  px: 1.8, py: 0.7, borderRadius: 999, textTransform: 'none', fontSize: 13, fontWeight: 700,
  color: '#374151', bgcolor: '#fff', border: '1px solid #E5E7EB',
  '&:hover': { borderColor: '#7C3AED', color: '#7C3AED', bgcolor: '#fff' },
} as const

interface OrderLite { id: string; createdAt: string; status: string; total?: number; itemsCount?: number; customer?: any; address?: any; items?: any[]; paymentMethod?: string; totals?: any; hasReturn?: boolean }

export default function OrdersPage() {
  useEffect(() => { document.title = 'My Orders — Khushiyan Store | Track Your Order' }, [])
  const [email, setEmail] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [code, setCode] = useState('')
  const [token, setToken] = useState<string | null>(null)
  const [list, setList] = useState<OrderLite[]>([])
  const [loading, setLoading] = useState(false)
  const [sendingOtp, setSendingOtp] = useState(false)
  const [verifyingOtp, setVerifyingOtp] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [open, setOpen] = useState<Record<string, boolean>>({})
  // resend countdown (seconds)
  const [resendIn, setResendIn] = useState<number>(0)

  const { push } = useToast()
  const { navigate } = useRouter()




  // Keep user logged in across refresh and preload orders
  useEffect(() => {
    try {
      const tok = localStorage.getItem('auth_token')
      const em = localStorage.getItem('auth_email') || ''
      if (tok) {
        setToken(tok)
        if (em) setEmail(em)
        loadOrders(tok)
      }
    } catch {}

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Warm the server to avoid cold-start delay affecting OTP
  useEffect(() => {
    apiGetJson('/api/ping', { timeoutMs: 4000 }).catch(()=>{})
  }, [])


  // Count down to enable "Resend OTP"
  useEffect(() => {
    if (!otpSent) return
    if (resendIn <= 0) return
    const t = window.setTimeout(() => setResendIn(s => (s > 0 ? s - 1 : 0)), 1000)
    return () => window.clearTimeout(t)
  }, [otpSent, resendIn])


  const validEmail = /^\S+@\S+\.\S+$/.test(email.trim())
  const sorted = useMemo(() => {
    return list.slice().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [list])


  async function requestOtp() {
    setError(null); setInfo(null)
    if (!validEmail) { setError('Enter a valid email'); return }
    setSendingOtp(true)
    try {
      const addr = email.trim()
      try {
        await apiPostJson('/api/auth/request-otp', { email: addr }, { loaderText: 'Sending OTP…', timeoutMs: 45000 })
      } catch (err: any) {
        const em = String(err?.message || '').toLowerCase()
        if (em.includes('timed out')) {
          await apiGetJson('/api/ping', { timeoutMs: 4000 }).catch(()=>{})
          await new Promise(r => setTimeout(r, 1500))
          await apiPostJson('/api/auth/request-otp', { email: addr }, { loaderText: 'Retrying…', timeoutMs: 45000 })
        } else {
          throw err
        }
      }
      setOtpSent(true)
      setResendIn(60)
      setInfo(`OTP has been sent to ${addr}`)
      push(`OTP sent to ${addr}`)
    } catch (e: any) {
      const msg = e?.message || 'Failed to send OTP'
      // restart countdown on resend
      setResendIn(60)
      // Note: keep OTP UI visible for resending
      setOtpSent(true)


      setError(msg); push(msg)
    } finally {
      setSendingOtp(false)
    }
  }

  async function verifyOtp() {
    setError(null); setVerifyingOtp(true)
    try {
	      const trimmedEmail = email.trim()
	      const normalizedEmail = trimmedEmail.toLowerCase()
	      const trimmedCode = code.trim().replace(/[^0-9]/g, '')
	      if (!normalizedEmail || !trimmedCode) { setError('Enter email and OTP'); return }

      let payload: any
      try {
	        payload = await apiPostJson<any>('/api/auth/verify-otp', { email: normalizedEmail, code: trimmedCode }, { timeoutMs: 45000 })
      } catch (err: any) {
        const em = String(err?.message || '').toLowerCase()
        if (em.includes('timed out')) {
          await apiGetJson('/api/ping', { timeoutMs: 4000 }).catch(()=>{})
          await new Promise(r => setTimeout(r, 1500))
	          payload = await apiPostJson<any>('/api/auth/verify-otp', { email: normalizedEmail, code: trimmedCode }, { timeoutMs: 45000 })
        } else {
          throw err
        }
      }

      const tok = payload?.token
      if (tok) {
        setToken(tok)
        try {
          localStorage.setItem('auth_token', tok)
	          localStorage.setItem('auth_email', normalizedEmail)
        } catch {}
        await loadOrders(tok)
      } else {
        setError('Verification succeeded but no token received')
      }
    } catch (e: any) {
      const msg = e?.message || 'Failed to verify OTP'
      setError(msg); push(msg)
    } finally {
      setVerifyingOtp(false)
    }
  }
  async function loadOrders(tok?: string) {
    setError(null); setLoading(true); setList([])
    try {
      const data = await apiGetJson<any>('/api/orders/me', tok ? { authToken: tok } : undefined)
      setList(data.orders || [])
    } catch (e: any) {
      setError(e?.message || 'Failed to fetch orders')
    } finally {
      setLoading(false)
    }
  }

  function handleLogout() {
    try {
      localStorage.removeItem('auth_token')
      localStorage.removeItem('auth_email')
    } catch {}
    setToken(null)
    setEmail('')
    setCode('')
    setOtpSent(false)
    setInfo(null)
    setError(null)
    setList([])
    setOpen({})
    setLoading(false)
    setSendingOtp(false)
    setVerifyingOtp(false)
  }

  function handleRefresh() {
    const tok = token || localStorage.getItem('auth_token') || undefined
    loadOrders(tok as any)
  }


  return (
    <Box sx={{ minHeight: '70vh', bgcolor: '#fff' }}>
    <Container className="orders-page" sx={{ pt: { xs: 2, md: 2.5 }, pb: { xs: 4, md: 6 } }}>
      {/* Hero banner — matches homepage/featured gradient language */}
      <Box sx={{
        position: 'relative', borderRadius: '24px', overflow: 'hidden', textAlign: 'center',
        background: 'linear-gradient(100deg, #5B3FC4 0%, #7C4FD8 40%, #A458E8 78%, #E687C8 100%)',
        px: { xs: 2.5, md: 6 }, py: { xs: 4, md: 5 }, mb: { xs: 3, md: 4 },
      }}>
        <Box sx={{ position: 'absolute', top: -70, left: -50, width: 220, height: 220, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,0.14) 0%, transparent 70%)' }} />
        <Box sx={{ position: 'absolute', bottom: -80, right: -40, width: 260, height: 260, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,0.10) 0%, transparent 70%)' }} />
        <Box sx={{ position: 'relative' }}>
          <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.7, px: 1.5, py: 0.55, borderRadius: 999, bgcolor: 'rgba(255,255,255,0.16)', border: '1px solid rgba(255,255,255,0.25)', mb: 1.5 }}>
            <LocalShippingOutlined sx={{ fontSize: 14, color: '#FBBF24' }} />
            <Typography sx={{ fontSize: 11.5, fontWeight: 700, color: '#fff', letterSpacing: 0.4, lineHeight: 1, textTransform: 'uppercase' }}>Track Order</Typography>
          </Box>
          <Typography sx={{ fontFamily: 'Georgia, Times New Roman, serif', fontSize: { xs: 28, md: 40 }, fontWeight: 700, color: '#fff', lineHeight: 1.15 }}>Your Orders</Typography>
          <Typography sx={{ mt: 1, fontSize: { xs: 14, md: 15.5 }, color: 'rgba(255,255,255,0.88)', maxWidth: 560, mx: 'auto' }}>
            {token ? 'View, track and manage your recent orders' : 'Login with your email OTP to view and track your orders'}
          </Typography>
        </Box>
      </Box>

      <Box sx={{ maxWidth: 760, mx: 'auto' }}>
        {!token ? (
          <Box sx={{ maxWidth: 460, mx: 'auto', p: { xs: 2.5, md: 3.5 }, borderRadius: '24px', bgcolor: '#fff', border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 8px 30px rgba(15,23,42,0.06)', textAlign: 'center' }}>
            <Box sx={{ width: 52, height: 52, borderRadius: '16px', mx: 'auto', display: 'grid', placeItems: 'center', bgcolor: 'rgba(124,58,237,0.10)', color: '#7C3AED', mb: 1.5 }}>
              <MailOutlineRounded />
            </Box>
            <Typography sx={{ fontWeight: 800, fontSize: 17 }}>{otpSent ? 'Enter OTP' : 'Login with Email'}</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.4, mb: 2.2 }}>
              {otpSent ? 'We\u2019ve sent a 6-digit code to your email' : 'We\u2019ll send a one-time password to verify it\u2019s you'}
            </Typography>
            <Stack spacing={1.4}>
              <TextField id="orders-email" name="email" autoComplete="email" fullWidth value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" size="small" />
              {!otpSent ? (
                <Button variant="contained" fullWidth onClick={requestOtp} disabled={!validEmail || sendingOtp} sx={{ borderRadius: '12px', py: 1.1, fontWeight: 800, textTransform: 'none', fontSize: 14, backgroundColor: '#7C3AED', color: '#fff', boxShadow: '0 6px 16px rgba(124,58,237,0.30)', '&:hover': { backgroundColor: '#6D28D9' }, '&.Mui-disabled': { backgroundColor: 'rgba(124,58,237,0.35)', color: '#fff' } }}>
                  {sendingOtp ? 'Sending…' : 'Send OTP'}
                </Button>
              ) : (
                <>
                  <TextField id="orders-otp" name="otp" autoComplete="one-time-code" fullWidth value={code} onChange={e=>setCode(e.target.value)} placeholder="6-digit OTP" size="small" inputProps={{ inputMode: 'numeric', pattern: '[0-9]*', maxLength: 6, style: { textAlign: 'center', letterSpacing: 6, fontWeight: 800 } }} />
                  <Button variant="contained" fullWidth onClick={verifyOtp} disabled={!code || verifyingOtp} sx={{ borderRadius: '12px', py: 1.1, fontWeight: 800, textTransform: 'none', fontSize: 14, backgroundColor: '#7C3AED', color: '#fff', boxShadow: '0 6px 16px rgba(124,58,237,0.30)', '&:hover': { backgroundColor: '#6D28D9' }, '&.Mui-disabled': { backgroundColor: 'rgba(124,58,237,0.35)', color: '#fff' } }}>
                    {verifyingOtp ? 'Verifying…' : 'Verify & View Orders'}
                  </Button>
                  {resendIn > 0 ? (
                    <Typography component="div" sx={{ fontSize: 12.5, color: '#6b7280' }}>Resend OTP in <b>{resendIn}s</b></Typography>
                  ) : (
                    <Link component="button" underline="hover" onClick={requestOtp} sx={{ fontSize: 12.5, fontWeight: 700, color: '#7C3AED', p: 0 }}>Resend OTP</Link>
                  )}
                </>
              )}
              {info && <Alert severity="success" sx={{ wordBreak: 'break-word', borderRadius: '12px', textAlign: 'left' }}>{info}</Alert>}
              {error && <Alert severity="error" sx={{ wordBreak: 'break-word', borderRadius: '12px', textAlign: 'left' }}>{error}</Alert>}
            </Stack>
          </Box>
        ) : null}

        {token && error && <Alert severity="error" sx={{ mt: 2, borderRadius: '12px' }}>{error}</Alert>}

        {token && (
          <Box sx={{ mt: 1 }}>
            {/* Logged-in header row */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1, mb: 2 }}>
              <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.8, px: 1.5, py: 0.6, borderRadius: 999, bgcolor: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.22)' }}>
                <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: '#10B981', flexShrink: 0 }} />
                <Typography sx={{ fontSize: 12.5, fontWeight: 600, color: '#047857', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: { xs: 200, sm: 320 } }}>{email}</Typography>
              </Box>
              <Stack direction="row" spacing={1}>
                <Button onClick={handleRefresh} startIcon={<RefreshRounded sx={{ fontSize: '16px !important' }} />} sx={PILL_BTN}>Refresh</Button>
                <Button onClick={handleLogout} startIcon={<LogoutRounded sx={{ fontSize: '16px !important' }} />} sx={PILL_BTN}>Logout</Button>
              </Stack>
            </Box>
            {loading ? (
              <Box sx={{ display: 'grid', gap: 1.5 }}>
                {[1,2,3].map(i => (
                  <Box key={i} sx={{ borderRadius: '16px', border: '1px solid rgba(0,0,0,0.06)', background: '#fff', p: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Skeleton width="30%" height={22} animation="wave" />
                      <Skeleton width="20%" height={22} animation="wave" />
                    </Box>
                    <Skeleton width="60%" height={16} animation="wave" sx={{ mb: 0.5 }} />
                    <Skeleton width="45%" height={16} animation="wave" />
                  </Box>
                ))}
              </Box>
            ) : list.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 5, px: 2, borderRadius: '24px', border: '1px dashed rgba(124,58,237,0.30)', bgcolor: 'rgba(124,58,237,0.03)' }}>
                <Box sx={{ width: 52, height: 52, borderRadius: '16px', mx: 'auto', display: 'grid', placeItems: 'center', bgcolor: 'rgba(124,58,237,0.10)', color: '#7C3AED', mb: 1.5 }}>
                  <ShoppingBagOutlined />
                </Box>
                <Typography sx={{ fontWeight: 800, fontSize: 16 }}>No orders yet</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.4, mb: 2 }}>When you place an order, it will show up here.</Typography>
                <Button onClick={() => navigate('/')} sx={{ px: 2.4, py: 0.9, borderRadius: 999, textTransform: 'none', fontSize: 13.5, fontWeight: 800, color: '#fff', bgcolor: '#7C3AED', boxShadow: '0 6px 16px rgba(124,58,237,0.30)', '&:hover': { bgcolor: '#6D28D9' } }}>Start Shopping</Button>
              </Box>
            ) : (
              <Box className="orders-list" sx={{ display: 'grid', gap: 1.5 }}>
                {sorted.map((o) => {
                  const isOpen = !!open[o.id]
                  const statusColor = o.status === 'pending' ? '#f59e0b' : o.status === 'accepted' ? '#3b82f6' : '#10b981'
                  const statusBg = o.status === 'pending' ? '#fffbeb' : o.status === 'accepted' ? '#eff6ff' : '#ecfdf5'
                  const dt = o.createdAt ? new Date(o.createdAt) : null
                  const dateStr = dt ? dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : ''
                  const timeStr = dt ? dt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : ''
                  return (
                    <Box key={o.id} sx={{ borderRadius: '16px', border: '1px solid rgba(0,0,0,0.07)', bgcolor: '#fff', overflow: 'hidden', transition: 'border-color 0.2s ease, box-shadow 0.2s ease', '&:hover': { borderColor: 'rgba(124,58,237,0.35)', boxShadow: '0 6px 20px rgba(15,23,42,0.06)' } }}>
                      <button
                        onClick={() => setOpen(prev => ({ ...prev, [o.id]: !prev[o.id] }))}
                        style={{
                          all: 'unset',
                          cursor: 'pointer',
                          width: '100%',
                          display: 'block',
                          padding: 16,
                          boxSizing: 'border-box',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                          <div style={{ minWidth: 0, flex: '1 1 auto' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span style={{ fontWeight: 800, fontSize: 15, color: '#1f2937' }}>#{o.id.slice(-8)}</span>
                              <ExpandMoreRounded sx={{ fontSize: 18, color: '#9CA3AF', transition: 'transform 0.2s ease', transform: isOpen ? 'rotate(180deg)' : 'none' }} />
                            </div>
                            <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {o.customer?.name} · {o.customer?.email}{o.address?.city ? ` · ${o.address.city}` : ''}
                            </div>
                            <div style={{ fontSize: 13, color: '#374151', marginTop: 6 }}><b>Total:</b> ₹{o.total ?? o.totals?.total ?? '-'}  <b>Pay:</b> {o.paymentMethod || 'cod'}</div>
                          </div>
                          <div style={{ textAlign: 'right', flex: '0 1 auto', minWidth: 0, maxWidth: 210 }}>
                            <div style={{ fontSize: 12, color: '#9ca3af', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {dateStr}{dateStr && timeStr ? ', ' : ''}{timeStr}
                            </div>
                            <div style={{ marginTop: 6, display: 'inline-block', padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, color: statusColor, background: statusBg, border: `1px solid ${statusColor}22`, textTransform: 'capitalize' }}>{o.status}</div>
                          </div>
                        </div>
                      </button>
                      {isOpen && (
                        <div style={{ padding: '0 16px 16px', display: 'grid', gap: 10, borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                          <div style={{ paddingTop: 12, display: 'grid', gap: 6 }}>
                            <Box sx={{ display: 'flex', gap: 0.8, alignItems: 'flex-start', fontSize: 14, color: '#374151' }}>
                              <LocationOnOutlined sx={{ fontSize: 17, color: '#7C3AED', mt: 0.2, flexShrink: 0 }} />
                              <span>{o.address?.line1}{o.address?.city ? `, ${o.address.city}` : ''}{o.address?.state ? `, ${o.address.state}` : ''} {o.address?.zip || ''}</span>
                            </Box>
                            <Box sx={{ display: 'flex', gap: 0.8, alignItems: 'center', fontSize: 14, color: '#374151' }}>
                              <LocalPhoneOutlined sx={{ fontSize: 17, color: '#7C3AED', flexShrink: 0 }} />
                              <span>{o.customer?.phone || '-'}</span>
                            </Box>
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 6, color: '#1f2937' }}>Items</div>
                            <div style={{ borderRadius: 12, border: '1px solid rgba(0,0,0,0.06)', background: '#FAFAFA', padding: 10 }}>
                              {(o.items || []).map((item: any, idx: number) => (
                                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 13, borderBottom: idx < (o.items || []).length - 1 ? '1px solid rgba(0,0,0,0.04)' : 'none' }}>
                                  <span>{item.title} × {item.quantity}</span>
                                  <span style={{ fontWeight: 600 }}>₹{item.unitPrice}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 14 }}>
                            <span style={{ color: '#6b7280' }}>Items: {o.itemsCount ?? (o.items || []).reduce((a: number, i: any) => a + Number(i.quantity || 0), 0)}</span>
                            <span style={{ fontWeight: 800, fontSize: 15, color: '#1f2937' }}>Total: ₹{o.total ?? o.totals?.total ?? '-'}</span>
                          </div>
                          {o.hasReturn ? (
                            <div style={{ padding: '8px 12px', borderRadius: 12, background: '#fef3c7', border: '1px solid #fbbf24', fontSize: 13, color: '#92400e' }}>⚠️ Return requested for this order</div>
                          ) : (
                            (Date.now() - new Date(o.createdAt).getTime() <= 3 * 24 * 60 * 60 * 1000) && (
                              <Button onClick={() => navigate(`/order/return?orderId=${encodeURIComponent(o.id)}`)} startIcon={<ReplayRounded sx={{ fontSize: '16px !important' }} />}
                                sx={{ justifySelf: 'start', px: 2, py: 0.7, borderRadius: 999, textTransform: 'none', fontSize: 13, fontWeight: 700, color: '#7C3AED', bgcolor: 'rgba(124,58,237,0.07)', border: '1px solid rgba(124,58,237,0.25)', '&:hover': { bgcolor: 'rgba(124,58,237,0.12)' } }}>
                                Return / Cancel
                              </Button>
                            )
                          )}
                        </div>
                      )}
                    </Box>
                  )
                })}
              </Box>
            )}
          </Box>
        )}
      </Box>
    </Container>
    </Box>
  )
}

