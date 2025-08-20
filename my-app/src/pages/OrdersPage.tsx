import { useState } from 'react'
import { useRouter } from '../lib/router'
import { useToast } from '../lib/toast'
import { apiGetJson, apiPostJson, apiPatchJson } from '../lib/api'
// MUI
import Container from '@mui/material/Container'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Alert from '@mui/material/Alert'

interface OrderLite { id: string; createdAt: string; status: string; total?: number; itemsCount?: number; customer?: any; address?: any; items?: any[]; paymentMethod?: string; totals?: any }

type AdminStatus = 'pending' | 'accepted' | 'delivered'

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
    try {
      await apiPostJson('/api/auth/request-otp', { email: email.trim() })
      setOtpSent(true)
      setInfo(`OTP has been sent to ${email.trim()}`)
      push(`OTP sent to ${email.trim()}`)
    } catch (e: any) {
      const msg = e?.message || 'Failed to send OTP'
      setError(msg); push(msg)
    } finally {
      setSendingOtp(false)
    }
  }

  async function verifyOtp() {
    setError(null); setVerifyingOtp(true)
    try {
      const trimmedEmail = email.trim()
      const trimmedCode = code.trim()
      if (!trimmedEmail || !trimmedCode) { setError('Enter email and OTP'); return }

      const payload = await apiPostJson<any>('/api/auth/verify-otp', { email: trimmedEmail, code: trimmedCode })

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
    }
  }
  async function loadOrders(tok?: string) {
    setError(null); setLoading(true); setList([])
    try {
      const data = await apiGetJson<any>('/api/orders/me', tok ? { authToken: tok } : undefined)
      setIsAdmin(!!data.isAdmin)
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
    setIsAdmin(false)
    setOpen({})
    setLoading(false)
    setSendingOtp(false)
    setVerifyingOtp(false)
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
                  <TextField
                    value={code}
                    onChange={e=>setCode(e.target.value)}
                    placeholder="OTP"
                    inputProps={{ inputMode: 'numeric', pattern: '[0-9]*', maxLength: 6 }}
                    sx={{ width: 160 }}
                  />
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
              <button className="btn" onClick={handleLogout}>Logout</button>
            </div>
            {list.length === 0 && !loading ? (
              <div style={{ color: '#6b7280' }}>No orders yet.</div>
            ) : (
              <div>
                {isAdmin ? (
                  <div style={{ display: 'grid', gap: 12 }}>
                    {list.map((o) => (
                      <div key={o.id} className="card" style={{ padding: 16, borderRadius: 12, borderColor: 'var(--color-border)', background:'#fff' }}>
                        <button onClick={() => setOpen(prev => ({...prev, [o.id]: !prev[o.id]}))} style={{ all:'unset', display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center', cursor: 'pointer', width: '100%' }}>
                          <div>
                            <div style={{ fontWeight: 700 }}>{o.customer?.name || '-'}</div>
                            <div className="muted" style={{ color:'#6b7280', fontSize:12 }}>{o.customer?.email || ''}</div>
                          </div>
                          <div style={{ display:'flex', gap:12, alignItems:'center', color:'#6b7280' }}>
                            <span className="badge" style={{ textTransform: 'capitalize', background: o.status==='pending' ? '#fff7ed' : o.status==='accepted' ? '#ecfeff' : '#ecfdf5', border: '1px solid var(--color-border)' }}>{o.status}</span>
                            <span>#{o.id.slice(-8)} • {new Date(o.createdAt).toLocaleString()}</span>
                            <span className={`fa-solid fa-chevron-${open[o.id] ? 'up' : 'down'}`} />
                          </div>
                        </button>
                        {open[o.id] ? (
                          <div style={{ marginTop: 8, display:'grid', gap:10 }}>
                            <div style={{ display:'grid', gap:6 }}>
                              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                                  <b>Status:</b>
                                  <select defaultValue={o.status as AdminStatus} onChange={async (e)=>{
                                    const newStatus = e.target.value as AdminStatus
                                    try {
                                      const tok = token || localStorage.getItem('auth_token')
                                      const updated = await apiPatchJson<any>(`/api/orders/${o.id}/status`, { status: newStatus }, tok ? { authToken: tok } : undefined)
                                      setList(prev => prev.map(x => x.id === o.id ? { ...x, status: updated.status } : x))
                                      push(`Status updated to ${newStatus}`)
                                    } catch (err: any) {
                                      push(err?.message || 'Failed to update status')
                                    }
                                  }} style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid var(--color-border)' }}>
                                    <option value="pending">Pending</option>
                                    <option value="accepted">Accepted</option>
                                    <option value="delivered">Delivered</option>
                                  </select>
                                </div>
                              <div><b>Payment:</b> {o.paymentMethod || 'cod'}</div>
                              <div><b>Address:</b> {o.address?.line1}, {o.address?.city}, {o.address?.state} {o.address?.zip}</div>
                            </div>
                            <div>
                              <div style={{ fontWeight: 800, marginBottom: 6 }}>Items</div>
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

