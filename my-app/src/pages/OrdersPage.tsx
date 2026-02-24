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

interface OrderLite { id: string; createdAt: string; status: string; total?: number; itemsCount?: number; customer?: any; address?: any; items?: any[]; paymentMethod?: string; totals?: any; hasReturn?: boolean }

export default function OrdersPage() {
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
    <Container className="orders-page" sx={{ py: { xs: 4, md: 6 } }}>
      <Box sx={{ maxWidth: 720, mx: 'auto' }}>

        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Box sx={{ fontSize: 48, mb: 1 }}>📋</Box>
          <Typography sx={{ fontFamily: 'Georgia, serif', fontSize: { xs: 28, md: 36 }, fontWeight: 800, color: '#1f2937' }}>Your Orders</Typography>
          {!token && <Typography color="text.secondary" sx={{ mt: 1, fontSize: 15 }}>Enter your email to login</Typography>}
        </Box>

        {!token ? (
          <Box sx={{ p: 3, borderRadius: 3, border: '1px solid rgba(0,0,0,0.06)', background: '#FAFAFA', maxWidth: 520, mx: 'auto' }}>
            <Stack spacing={1.25}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ xs: 'stretch', sm: 'center' }}>
                <TextField id="orders-email" name="email" autoComplete="email" fullWidth value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" size="small" />
                {!otpSent ? (
                  <Button variant="contained" onClick={requestOtp} disabled={!validEmail || sendingOtp} sx={{ minWidth: 120, borderRadius: 2, py: 1, fontWeight: 'bold', backgroundColor: '#FF3F6C', color: '#FFFFFF', '&:hover': { backgroundColor: '#E73962' }, '&.Mui-disabled': { backgroundColor: '#FCA5A5', color: '#FFFFFF' } }}>
                    {sendingOtp ? 'Sending…' : 'Send OTP'}
                  </Button>
                ) : (
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ flexWrap: { xs: 'wrap', sm: 'nowrap' } }}>
                    <TextField id="orders-otp" name="otp" autoComplete="one-time-code" value={code} onChange={e=>setCode(e.target.value)} placeholder="OTP" size="small" inputProps={{ inputMode: 'numeric', pattern: '[0-9]*', maxLength: 6 }} sx={{ width: 140 }} />
                    <Button variant="contained" onClick={verifyOtp} disabled={!code || verifyingOtp} sx={{ minWidth: 100, borderRadius: 2, py: 0.9, fontWeight: 'bold', backgroundColor: '#FF3F6C', color: '#FFFFFF', '&:hover': { backgroundColor: '#E73962' }, '&.Mui-disabled': { backgroundColor: '#FCA5A5', color: '#FFFFFF' } }}>
                      {verifyingOtp ? 'Verifying…' : 'Verify'}
                    </Button>
                    {resendIn > 0 ? (
                      <Typography component="div" sx={{ fontSize: 12, color: '#6b7280', lineHeight: 1, alignSelf: 'center', whiteSpace: 'nowrap' }}>Reset OTP in {resendIn}s</Typography>
                    ) : (
                      <Link component="button" underline="hover" onClick={requestOtp} sx={{ fontSize: 12, alignSelf: 'center', whiteSpace: 'nowrap', p: 0 }}>Reset OTP</Link>
                    )}
                  </Stack>
                )}
              </Stack>
              {info && <Alert severity="success" sx={{ justifyContent: 'center', wordBreak: 'break-word', borderRadius: 2 }}>{info}</Alert>}
              {error && <Alert severity="error" sx={{ justifyContent: 'center', wordBreak: 'break-word', borderRadius: 2 }}>{error}</Alert>}
            </Stack>
          </Box>
        ) : null}

        {token && error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}

        {token && (
          <div style={{ marginTop: 12 }}>
            <div className="orders-head" style={{ display: 'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
              <div className="orders-head-note" style={{ color:'#6b7280', fontSize: 12 }}>Logged in as {email}</div>
              <div style={{ display:'flex', gap:8 }}>
                <button className="btn" onClick={handleRefresh} title="Refresh orders" aria-label="Refresh orders">
                  <span className="fa-solid fa-rotate-right" style={{ marginRight: 6 }} /> Refresh
                </button>
                <button className="btn" style={{ padding: '8px 12px' }} onClick={handleLogout} title="Logout" aria-label="Logout">
                  <span className="fa-solid fa-right-from-bracket" style={{ marginRight: 6 }} /> Logout
                </button>
              </div>
            </div>
            {list.length === 0 && !loading ? (
              <div style={{ color: '#6b7280' }}>No orders yet.</div>
            ) : (
              <div className="orders-list" style={{ display: 'grid', gap: 10 }}>
                {sorted.map((o) => {
                  const isOpen = !!open[o.id]
                  const statusColor = o.status === 'pending' ? '#f59e0b' : o.status === 'accepted' ? '#3b82f6' : '#10b981'
                  const statusBg = o.status === 'pending' ? '#fffbeb' : o.status === 'accepted' ? '#eff6ff' : '#ecfdf5'
	                  const dt = o.createdAt ? new Date(o.createdAt) : null
	                  const dateStr = dt ? dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : ''
	                  const timeStr = dt ? dt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : ''
                  return (
                    <div key={o.id} style={{ borderRadius: 12, border: '1px solid rgba(0,0,0,0.08)', background: '#fff', overflow: 'hidden' }}>
	                      <button
	                        onClick={() => setOpen(prev => ({ ...prev, [o.id]: !prev[o.id] }))}
	                        style={{
	                          all: 'unset',
	                          cursor: 'pointer',
	                          width: '100%',
	                          display: 'block',
	                          padding: 14,
	                          boxSizing: 'border-box',
	                        }}
	                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
	                          <div style={{ minWidth: 0, flex: '1 1 auto' }}>
                            <div style={{ fontWeight: 700, fontSize: 15, color: '#1f2937' }}>#{o.id.slice(-8)}</div>
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
                        <div style={{ padding: '0 14px 14px', display: 'grid', gap: 10, borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                          <div style={{ paddingTop: 12, display: 'grid', gap: 6 }}>
                            <div style={{ fontSize: 14 }}><b>📍 Address:</b> {o.address?.line1}{o.address?.city ? `, ${o.address.city}` : ''}{o.address?.state ? `, ${o.address.state}` : ''} {o.address?.zip || ''}</div>
                            <div style={{ fontSize: 14 }}><b>📞 Phone:</b> {o.customer?.phone || '-'}</div>
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 6, color: '#1f2937' }}>🛒 Items</div>
                            <div style={{ borderRadius: 8, border: '1px solid rgba(0,0,0,0.06)', background: '#FAFAFA', padding: 10 }}>
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
                            <div style={{ padding: '8px 12px', borderRadius: 8, background: '#fef3c7', border: '1px solid #fbbf24', fontSize: 13, color: '#92400e' }}>⚠️ Return requested for this order</div>
                          ) : (
                            (Date.now() - new Date(o.createdAt).getTime() <= 3 * 24 * 60 * 60 * 1000) && (
                              <button className="btn" onClick={() => navigate(`/order/return?orderId=${encodeURIComponent(o.id)}`)} style={{ padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600 }}>Return / Cancel</button>
                            )
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </Box>
    </Container>
  )
}

