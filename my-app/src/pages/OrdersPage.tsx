import { useEffect, useMemo, useState } from 'react'
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

  // Admin UI filters/sort/search
  const [q, setQ] = useState('')
  const [statusFilter, setStatusFilter] = useState<AdminStatus | 'all'>('all')
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'cod' | 'razorpay'>('all')
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'amount_desc' | 'amount_asc'>('newest')


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

  const validEmail = /^\S+@\S+\.\S+$/.test(email.trim())
  // const fmtINR = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })
  const filteredSorted = useMemo(() => {
    let arr = list.slice()
    // Text search in id, name, email, city, state
    const t = q.trim().toLowerCase()
    if (t) {
      arr = arr.filter(o =>
        o.id.toLowerCase().includes(t) ||
        String(o.customer?.name || '').toLowerCase().includes(t) ||
        String(o.customer?.email || '').toLowerCase().includes(t) ||
        String(o.address?.city || '').toLowerCase().includes(t) ||
        String(o.address?.state || '').toLowerCase().includes(t)
      )
    }
    if (statusFilter !== 'all') arr = arr.filter(o => o.status === statusFilter)
    if (paymentFilter !== 'all') arr = arr.filter(o => (o.paymentMethod || 'cod') === paymentFilter)
    switch (sortBy) {
      case 'oldest':
        arr.sort((a,b)=> new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()); break
      case 'amount_desc':
        arr.sort((a,b)=> (b.total ?? b.totals?.total ?? 0) - (a.total ?? a.totals?.total ?? 0)); break
      case 'amount_asc':
        arr.sort((a,b)=> (a.total ?? a.totals?.total ?? 0) - (b.total ?? b.totals?.total ?? 0)); break
      default:
        arr.sort((a,b)=> new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    }
    return arr
  }, [list, q, statusFilter, paymentFilter, sortBy])


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


  // Admin helper actions
  async function setOrderStatus(orderId: string, newStatus: AdminStatus) {
    try {
      const tok = token || localStorage.getItem('auth_token')
      const updated = await apiPatchJson<any>(`/api/orders/${orderId}/status`, { status: newStatus }, tok ? { authToken: tok } : undefined)
      setList(prev => prev.map(x => x.id === orderId ? { ...x, status: updated.status } : x))
      push(`Status updated to ${newStatus}`)
    } catch (err: any) {
      push(err?.message || 'Failed to update status')
    }
  }
  function handleRefresh() {
    const tok = token || localStorage.getItem('auth_token') || undefined
    loadOrders(tok as any)
  }

  function copyAddress(o: OrderLite) {
    const addr = `${o.customer?.name || ''}, ${o.address?.line1 || ''}, ${o.address?.city || ''}, ${o.address?.state || ''} ${o.address?.zip || ''}`.trim()
    try {
      // @ts-ignore
      navigator?.clipboard?.writeText(addr)
      push('Address copied')
    } catch {}
  }
  function openMaps(o: OrderLite) {
    const addr = `${o.address?.line1 || ''}, ${o.address?.city || ''}, ${o.address?.state || ''} ${o.address?.zip || ''}`.trim()
    window.open(`https://www.google.com/maps/search/${encodeURIComponent(addr)}`, '_blank')
  }
  function expandAll(ids: string[], openVal: boolean) {
    setOpen(prev => {
      const next = { ...prev }
      ids.forEach(id => { next[id] = openVal })
      return next
    })
  }


  return (
    <Container className="orders-page" sx={{ py: 3 }}>
      <Paper variant="outlined" square elevation={0} sx={{ width: '100%', maxWidth: 680, mx: 'auto', p: 2, borderRadius: 2, borderColor: 'rgba(0,0,0,0.12)', backgroundImage: 'radial-gradient(80% 50% at 50% 0%, rgba(255,63,108,0.06), transparent 70%)' }}>

        <Typography variant="h5" align="center" sx={{ fontWeight: 800, mb: 1 }}>Your Orders</Typography>
        <Typography align="center" color="text.secondary" sx={{ mb: 2, fontSize: 14 }}>Enter your email to login</Typography>

        {!token ? (
          <Stack spacing={1.25}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ xs: 'stretch', sm: 'center' }}>
              <TextField fullWidth value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" size="small" />
              {!otpSent ? (
                <Button variant="contained" onClick={requestOtp} disabled={!validEmail || sendingOtp} sx={{ minWidth: 120, borderRadius: 1, py: 1, fontWeight: 'bold', backgroundColor: '#FF3F6C', color: '#FFFFFF', '&:hover': { backgroundColor: '#E73962' }, '&.Mui-disabled': { backgroundColor: '#FCA5A5', color: '#FFFFFF' } }}>
                  {sendingOtp ? 'Sending…' : 'Send OTP'}
                </Button>
              ) : (
                <Stack direction="row" spacing={1} alignItems="center">
                  <TextField value={code} onChange={e=>setCode(e.target.value)} placeholder="OTP" size="small" inputProps={{ inputMode: 'numeric', pattern: '[0-9]*', maxLength: 6 }} sx={{ width: 140 }} />
                  <Button variant="contained" onClick={verifyOtp} disabled={!code || verifyingOtp} sx={{ minWidth: 100, borderRadius: 1, py: 0.9, fontWeight: 'bold', backgroundColor: '#FF3F6C', color: '#FFFFFF', '&:hover': { backgroundColor: '#E73962' }, '&.Mui-disabled': { backgroundColor: '#FCA5A5', color: '#FFFFFF' } }}>

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
          <div style={{ marginTop: 12 }}>
            <div className="orders-head" style={{ display: 'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
              <div className="orders-head-note" style={{ color:'#6b7280', fontSize: 12 }}>{isAdmin ? 'Viewing all orders (admin)' : `Logged in as ${email}`}</div>
              <div style={{ display:'flex', gap:8 }}>
                <button className="btn" onClick={handleRefresh} title="Refresh orders" aria-label="Refresh orders">
                  <span className="fa-solid fa-rotate-right" style={{ marginRight: 6 }} /> Refresh
                </button>
                <button className="btn" style={{ padding: '8px 12px' }} onClick={handleLogout} title="Logout" aria-label="Logout">
                  <span className="fa-solid fa-right-from-bracket" style={{ marginRight: 6 }} /> Logout
                </button>
              </div>
            </div>
                {isAdmin && (
                  <div className="admin-tools" style={{ display:'grid', gap:8, marginBottom:10 }}>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:8 }}>
                      <input className="input" placeholder="Search name, email, city, order id…" value={q} onChange={e=>setQ(e.target.value)} />
                      <select className="input" value={statusFilter} onChange={e=>setStatusFilter(e.target.value as any)}>
                        <option value="all">All statuses</option>
                        <option value="pending">Pending</option>
                        <option value="accepted">Accepted</option>
                        <option value="delivered">Delivered</option>
                      </select>
                      <select className="input" value={paymentFilter} onChange={e=>setPaymentFilter(e.target.value as any)}>
                        <option value="all">All payments</option>
                        <option value="cod">COD</option>
                        <option value="razorpay">Online</option>
                      </select>
                      <select className="input" value={sortBy} onChange={e=>setSortBy(e.target.value as any)}>
                        <option value="newest">Newest first</option>
                        <option value="oldest">Oldest first</option>
                        <option value="amount_desc">Amount high → low</option>
                        <option value="amount_asc">Amount low → high</option>
                      </select>
                    </div>
                  <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
                    <button className="btn" onClick={()=>expandAll(filteredSorted.map(o=>o.id), true)}>Expand All</button>
                    <button className="btn" onClick={()=>expandAll(filteredSorted.map(o=>o.id), false)}>Collapse All</button>
                  </div>
                  </div>
                )}
            {list.length === 0 && !loading ? (
              <div style={{ color: '#6b7280' }}>No orders yet.</div>
            ) : (
              <div>
                {isAdmin ? (
                  <div className="orders-list" style={{ display: 'grid', gap: 10 }}>
                    {filteredSorted.map((o) => (
                      <div key={o.id} className="card order-card" style={{ padding: 12, borderRadius: 10, borderColor: 'var(--color-border)', background:'#fff' }}>
                        <button className="order-head" onClick={() => setOpen(prev => ({...prev, [o.id]: !prev[o.id]}))} style={{ all:'unset', display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center', cursor: 'pointer', width: '100%' }}>
                          <div className="order-cust">
                            <div className="order-name" style={{ fontWeight: 700 }}>{o.customer?.name || '-'}</div>
                            <div className="order-email muted" style={{ color:'#6b7280', fontSize:12 }}>{o.customer?.email || ''}</div>
                          </div>
                          <div className="order-meta" style={{ display:'flex', gap:10, alignItems:'center', color:'#6b7280' }}>
                            <span className="badge order-status" style={{ textTransform: 'capitalize', background: o.status==='pending' ? '#fff7ed' : o.status==='accepted' ? '#ecfeff' : '#ecfdf5', border: '1px solid var(--color-border)' }}>{o.status}</span>
                            <span className="order-id-time" style={{ display:'none' }}>#{o.id.slice(-8)} • {new Date(o.createdAt).toLocaleString()}</span>
                            <span className={`fa-solid fa-chevron-${open[o.id] ? 'up' : 'down'}`} />
                          </div>
                        </button>
                        {open[o.id] ? (
                          <div className="order-details" style={{ marginTop: 8, display:'grid', gap:8 }}>
                            <div style={{ display:'grid', gap:6 }}>
                              <div className="order-status-row" style={{ display:'flex', alignItems:'center', gap:8 }}>
                                  <b>Status:</b>
                                  <select defaultValue={o.status as AdminStatus} onChange={(e)=>setOrderStatus(o.id, e.target.value as AdminStatus)} style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid var(--color-border)' }}>
                                    <option value="pending">Pending</option>
                                    <option value="accepted">Accepted</option>
                                    <option value="delivered">Delivered</option>
                                  </select>
                                </div>
                              <div className="order-pay"><b>Payment:</b> {o.paymentMethod || 'cod'}</div>
                              <div className="order-addr"><b>Address:</b> {o.address?.line1}, {o.address?.city}, {o.address?.state} {o.address?.zip}</div>
                            </div>
                            <div>
                              <div style={{ fontWeight: 800, marginBottom: 4 }}>Items</div>
                              <div className="order-items" style={{ border: '1px dashed var(--color-border)', borderRadius: 8, padding: 8 }}>
                                {(o.items||[]).map((i, idx) => (
                                  <div key={idx} className="list-row" style={{ display:'flex', justifyContent:'space-between' }}>
                                    <div>{i.title} × {i.quantity}</div>
                                    <div>₹{i.unitPrice}</div>
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div className="order-summary" style={{ marginTop: 2, display:'flex', justifyContent:'space-between' }}>
                              <div className="muted" style={{ color:'#6b7280' }}>Items: {o.itemsCount ?? (o.items||[]).reduce((a,i)=>a+Number(i.quantity||0),0)}</div>
                              <div style={{ fontWeight: 700 }}>Total: ₹{o.total ?? o.totals?.total ?? '-'}</div>
                            </div>
                              <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginTop: 8 }}>
                                {o.status !== 'accepted' && (
                                  <button className="btn" onClick={()=>setOrderStatus(o.id, 'accepted' as AdminStatus)}>Mark Accepted</button>
                                )}
                                {o.status !== 'delivered' && (
                                  <button className="btn" onClick={()=>setOrderStatus(o.id, 'delivered' as AdminStatus)}>Mark Delivered</button>
                                )}
                                <button className="btn" onClick={()=>copyAddress(o)}>Copy Address</button>
                                <button className="btn" onClick={()=>openMaps(o)}>Open in Maps</button>
                              </div>
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                ) : (
                                <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
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
                        {filteredSorted.map((o) => (
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

