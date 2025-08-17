import { useState } from 'react'
import { useRouter } from '../lib/router'
import { useToast } from '../lib/toast'
// MUI
import Container from '@mui/material/Container'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Alert from '@mui/material/Alert'

interface OrderLite { id: string; createdAt: string; status: string; total?: number; itemsCount?: number; customer?: any; address?: any; items?: any[]; paymentMethod?: string; totals?: any }

export default function OrdersPage() {
  const [email, setEmail] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [code, setCode] = useState('')
  const [token, setToken] = useState<string | null>(null)
  const [list, setList] = useState<OrderLite[]>([])
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(false)
  const [sendingOtp, setSendingOtp] = useState(false)
  const [verifyingOtp, setVerifyingOtp] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [open, setOpen] = useState<Record<string, boolean>>({})
  const { push } = useToast()
  const { navigate } = useRouter()

  const validEmail = /^\S+@\S+\.\S+$/.test(email.trim())
  // const fmtINR = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })

  async function requestOtp() {
    setError(null); setInfo(null)
    if (!validEmail) { setError('Enter a valid email'); return }
    setSendingOtp(true)
    // show pink loader
    const overlay = document.createElement('div')
    overlay.id = 'pink-loader-overlay'
    overlay.className = 'pink-loader-overlay'
    overlay.innerHTML = '<div class="pink-loader-card"><div class="pink-spinner"><span class="blob a"></span><span class="blob b"></span><span class="blob c"></span><span class="ring"></span></div><div class="pink-loader-text">Sending OTP…</div></div>'
    document.body.appendChild(overlay)
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/auth/request-otp`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: email.trim() })
      })
      if (!res.ok) throw new Error(await res.text())
      setOtpSent(true)
      setInfo(`OTP has been sent to ${email.trim()}`)
      push(`OTP sent to ${email.trim()}`)
    } catch (e: any) {
      const msg = e?.message || 'Failed to send OTP'
      setError(msg); push(msg)
    } finally {
      setSendingOtp(false)
      const el = document.getElementById('pink-loader-overlay'); if (el) el.remove()
    }
  }

  async function verifyOtp() {
    setError(null); setVerifyingOtp(true)
    // show pink loader
    const overlay = document.createElement('div')
    overlay.id = 'pink-loader-overlay'
    overlay.className = 'pink-loader-overlay'
    overlay.innerHTML = '<div class="pink-loader-card"><div class="pink-spinner"><span class="blob a"></span><span class="blob b"></span><span class="blob c"></span><span class="ring"></span></div><div class="pink-loader-text">Verifying…</div></div>'
    document.body.appendChild(overlay)
    try {
      const trimmedEmail = email.trim()
      const trimmedCode = code.trim()
      if (!trimmedEmail || !trimmedCode) { setError('Enter email and OTP'); return }

      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmedEmail, code: trimmedCode })
      })

      let payload: any = null
      const ct = res.headers.get('content-type') || ''
      if (ct.includes('application/json')) {
        try { payload = await res.json() } catch { payload = null }
      } else {
        try { payload = { message: await res.text() } } catch { payload = null }
      }

      if (!res.ok) {
        const msg = payload?.message || payload?.error || (res.status === 400 ? 'OTP is not correct' : `Failed to verify OTP (${res.status})`)
        setError(msg); push(msg)
        return
      }

      const tok = payload?.token
      if (tok) {
        setToken(tok)
        try {
          localStorage.setItem('auth_token', tok)
          localStorage.setItem('auth_email', trimmedEmail)
        } catch {}
        await loadOrders(tok)
      } else {
        setError('Verification succeeded but no token received')
      }
    } catch (e: any) {
      const msg = 'Network error while verifying OTP'
      setError(msg); push(msg)
    } finally {
      setVerifyingOtp(false)
      const el = document.getElementById('pink-loader-overlay'); if (el) el.remove()
    }
  }
  async function loadOrders(tok?: string) {
    setError(null); setLoading(true); setList([])
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/orders/me`, {
        headers: tok ? { 'Authorization': `Bearer ${tok}` } : undefined
      })
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      setIsAdmin(!!data.isAdmin)
      setList(data.orders || [])
    } catch (e: any) {
      setError(e?.message || 'Failed to fetch orders')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Container sx={{ py: 3 }}>
      <Paper variant="outlined" square elevation={0} sx={{ width: '100%', maxWidth: token ? '100%' : 640, mx: 'auto', p: token ? 2 : 3, borderRadius: 0, borderColor: 'rgba(0,0,0,0.18)' }}>
        <Typography variant="h4" align="center" sx={{ fontWeight: 800, mb: 1 }}>Your Orders</Typography>
        <Typography align="center" color="text.secondary" sx={{ mb: 2 }}>Enter your email to login</Typography>

        {!token ? (
          <Stack spacing={2}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25} alignItems={{ xs: 'stretch', sm: 'center' }}>
              <TextField fullWidth value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" size="medium" />
              {!otpSent ? (
                <Button variant="contained" onClick={requestOtp} disabled={!validEmail || sendingOtp} sx={{ minWidth: 150, borderRadius: 0, py: 1.2, fontWeight: 'bold', backgroundColor: '#FF3F6C', color: '#FFFFFF', '&:hover': { backgroundColor: '#E73962' }, '&.Mui-disabled': { backgroundColor: '#FCA5A5', color: '#FFFFFF' } }}>
                  {sendingOtp ? 'Sending…' : 'Send OTP'}
                </Button>
              ) : (
                <Stack direction="row" spacing={1} alignItems="center">
                  <TextField value={code} onChange={e=>setCode(e.target.value)} placeholder="OTP" inputProps={{ inputMode: 'numeric', pattern: '[0-9]*', maxLength: 6 }} sx={{ width: 160 }} />
                  <Button variant="contained" onClick={verifyOtp} disabled={!code || verifyingOtp} sx={{ minWidth: 120, borderRadius: 0, py: 1.1, fontWeight: 'bold', backgroundColor: '#FF3F6C', color: '#FFFFFF', '&:hover': { backgroundColor: '#E73962' }, '&.Mui-disabled': { backgroundColor: '#FCA5A5', color: '#FFFFFF' } }}>
                    {verifyingOtp ? 'Verifying…' : 'Verify'}
                  </Button>
                </Stack>
              )}
            </Stack>
            {info && <Alert severity="success" sx={{ justifyContent: 'center', wordBreak: 'break-word' }}>{info}</Alert>}
            {error && <Alert severity="error" sx={{ justifyContent: 'center', wordBreak: 'break-word' }}>{error}</Alert>}
          </Stack>
        ) : null}

        {token && error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}

        {token && (
          <div style={{ marginTop: 16 }}>
            <div style={{ display: 'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
              <div style={{ color:'#6b7280' }}>{isAdmin ? 'Viewing all orders (admin)' : `Logged in as ${email}`}</div>
              <button className="btn" onClick={()=>{ setToken(null); setList([]); setIsAdmin(false); setOtpSent(false); setCode('') }}>Logout</button>
            </div>
            {list.length === 0 && !loading ? (
              <div style={{ color: '#6b7280' }}>No orders yet.</div>
            ) : (
              <div>
                {isAdmin ? (
                  <div style={{ display: 'grid', gap: 12 }}>
                    {list.map((o) => (
                      <div key={o.id} className="card" style={{ padding: 16 }}>
                        <button onClick={() => setOpen(prev => ({...prev, [o.id]: !prev[o.id]}))} style={{ all:'unset', display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center', cursor: 'pointer', width: '100%' }}>
                          <div>
                            <div style={{ fontWeight: 700 }}>{o.customer?.name || '-'}</div>
                            <div className="muted" style={{ color:'#6b7280', fontSize:12 }}>{o.customer?.email || ''}</div>
                          </div>
                          <div style={{ display:'flex', gap:8, alignItems:'center', color:'#6b7280' }}>
                            <span>#{o.id.slice(-8)} • {new Date(o.createdAt).toLocaleString()}</span>
                            <span className={`fa-solid fa-chevron-${open[o.id] ? 'up' : 'down'}`} />
                          </div>
                        </button>
                        {open[o.id] ? (
                          <div style={{ marginTop: 8, display:'grid', gap:10 }}>
                            <div style={{ display:'grid', gap:6 }}>
                              <div><b>Status:</b> <span style={{ textTransform:'capitalize' }}>{o.status}</span></div>
                              <div><b>Payment:</b> {o.paymentMethod || 'cod'}</div>
                              <div><b>Address:</b> {o.address?.line1}, {o.address?.city}, {o.address?.state} {o.address?.zip}</div>
                            </div>
                            <div>
                              <div style={{ fontWeight: 600, marginBottom: 6 }}>Items</div>
                              <div style={{ border: '1px dashed var(--color-border)', borderRadius: 8, padding: 8 }}>
                                {(o.items||[]).map((i, idx) => (
                                  <div key={idx} className="list-row" style={{ display:'flex', justifyContent:'space-between' }}>
                                    <div>{i.title} × {i.quantity}</div>
                                    <div>₹{i.unitPrice}</div>
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div style={{ marginTop: 4, display:'flex', justifyContent:'space-between' }}>
                              <div className="muted" style={{ color:'#6b7280' }}>Items: {o.itemsCount ?? (o.items||[]).reduce((a,i)=>a+Number(i.quantity||0),0)}</div>
                              <div style={{ fontWeight: 700 }}>Total: ₹{o.total ?? o.totals?.total ?? '-'}</div>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--color-border)' }}>
                          <th style={{ padding: 8 }}>Order ID</th>
                          <th style={{ padding: 8 }}>Placed</th>
                          <th style={{ padding: 8 }}>Status</th>
                          <th style={{ padding: 8 }}>Items</th>
                          <th style={{ padding: 8 }}>Total</th>
                          <th style={{ padding: 8 }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {list.map((o) => (
                          <tr key={o.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                            <td style={{ padding: 8 }}><code>#{o.id.slice(-8)}</code></td>
                            <td style={{ padding: 8 }}>{new Date(o.createdAt).toLocaleString()}</td>
                            <td style={{ padding: 8, textTransform: 'capitalize' }}>{o.status}</td>
                            <td style={{ padding: 8 }}>{o.itemsCount ?? '-'}</td>
                            <td style={{ padding: 8 }}>₹{o.total ?? '-'}</td>
                            <td style={{ padding: 8 }}>
                              <button className="btn" onClick={() => navigate(`/order/return?orderId=${encodeURIComponent(o.id)}`)}>Return/Cancel</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </Paper>
    </Container>
  )
}

