import { useEffect, useMemo, useState } from 'react'
import AdminGuard from '../admin/AdminGuard'
import AdminLayout from '../admin/AdminLayout'
import { getAuthToken } from '../lib/auth'
import { apiDeleteJson, apiGetJson, apiPatchJson } from '../lib/api'
import { useRouter } from '../lib/router'
import { useToast } from '../lib/toast'

import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import LinearProgress from '@mui/material/LinearProgress'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

type AdminStatus = 'pending' | 'accepted' | 'delivered'

type OrderLite = {
  id: string
  createdAt?: string
  status?: string
  totalPrice?: number
  totals?: any
  total?: number
  paymentMethod?: string
  customer?: any
  address?: any
  items?: any[]
  itemsCount?: number
}

export default function AdminOrdersPage() {
  const tok = useMemo(() => getAuthToken() || '', [])
  const { navigate } = useRouter()
  const { push } = useToast()

  const [list, setList] = useState<OrderLite[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [q, setQ] = useState('')
  const [open, setOpen] = useState<Record<string, boolean>>({})
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  async function load() {
    setError(null)
    setLoading(true)
    try {
      const data = await apiGetJson<any>('/api/orders/me', { authToken: tok, timeoutMs: 45000 })
      setList(Array.isArray(data?.orders) ? data.orders : [])
    } catch (e: any) {
      setError(e?.message || 'Failed to load orders')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() /* eslint-disable-next-line */ }, [])

  async function setOrderStatus(orderId: string, newStatus: AdminStatus) {
    try {
      const updated = await apiPatchJson<any>(`/api/orders/${orderId}/status`, { status: newStatus }, { authToken: tok, loaderText: 'Updating…', timeoutMs: 45000 })
      setList(prev => prev.map(o => o.id === orderId ? { ...o, status: updated?.status || newStatus } : o))
      push(`Status set to ${newStatus}`)
    } catch (e: any) {
      push(e?.message || 'Failed to update status')
    }
  }

  async function deleteOrder(orderId: string) {
    setDeleting(true)
    try {
      await apiDeleteJson(`/api/orders/${orderId}`, undefined, { authToken: tok, loaderText: 'Deleting…', timeoutMs: 45000 })
      setList(prev => prev.filter(o => o.id !== orderId))
      push('Order deleted')
      setConfirmDelete(null)
    } catch (e: any) {
      push(e?.message || 'Failed to delete order')
    } finally {
      setDeleting(false)
    }
  }

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase()
    if (!t) return list
    return list.filter((o) => {
      const hay = [
        o.id,
        o.customer?.name,
        o.customer?.email,
        o.address?.city,
        o.address?.phone,
        o.paymentMethod,
        o.status,
      ].filter(Boolean).join(' ').toLowerCase()
      return hay.includes(t)
    })
  }, [q, list])

  return (
    <AdminGuard>
      <AdminLayout
        title="Orders"
        actions={
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" onClick={() => navigate('/admin/returns')}>Returns</Button>
            <Button variant="contained" onClick={load} disabled={loading}>Refresh</Button>
          </Stack>
        }
      >
        <Paper sx={{ p: 2, borderRadius: 3 }}>
          <Stack spacing={1.5}>
            <TextField label="Search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Order id, name, email, city…" />
            {loading ? <LinearProgress /> : null}
            {error ? <Typography color="error" fontWeight={700}>{error}</Typography> : null}
            <Typography variant="body2" color="text.secondary">Total: {filtered.length}</Typography>
          </Stack>
        </Paper>

        <div style={{ display: 'grid', gap: 10, marginTop: 12 }}>
          {filtered.map((o) => {
            const isOpen = !!open[o.id]
            const statusColor = o.status === 'pending' ? '#f59e0b' : o.status === 'accepted' ? '#3b82f6' : '#10b981'
            const statusBg = o.status === 'pending' ? '#fffbeb' : o.status === 'accepted' ? '#eff6ff' : '#ecfdf5'
            return (
              <div key={o.id} style={{ borderRadius: 12, border: '1px solid rgba(0,0,0,0.08)', background: '#fff', overflow: 'hidden' }}>
                <button onClick={() => setOpen(prev => ({ ...prev, [o.id]: !prev[o.id] }))} style={{ all: 'unset', cursor: 'pointer', width: '100%', display: 'block', padding: 14, boxSizing: 'border-box' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 15, color: '#1f2937' }}>#{o.id.slice(-8)}</div>
                      <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{o.customer?.name || '-'} · {o.customer?.email || ''}{o.address?.city ? ` · ${o.address.city}` : ''}</div>
                      <div style={{ fontSize: 13, color: '#374151', marginTop: 6 }}><b>Total:</b> ₹{o.total ?? o.totals?.total ?? Math.round(Number(o.totalPrice ?? o.totals?.grandTotal ?? 0))}  <b>Pay:</b> {o.paymentMethod || 'cod'}</div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, color: '#9ca3af', whiteSpace: 'nowrap' }}>{o.createdAt ? new Date(o.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : ''}{o.createdAt ? ', ' : ''}{o.createdAt ? new Date(o.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : ''}</div>
                      <div style={{ marginTop: 6, display: 'inline-block', padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, color: statusColor, background: statusBg, border: `1px solid ${statusColor}22`, textTransform: 'capitalize' }}>{o.status || 'pending'}</div>
                    </div>
                  </div>
                </button>
                {isOpen && (
                  <div style={{ padding: '0 14px 14px', display: 'grid', gap: 10, borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                    <div style={{ paddingTop: 12, display: 'grid', gap: 6 }}>
                      <div style={{ fontSize: 14 }}><b>📍 Address:</b> {o.address?.line1}{o.address?.city ? `, ${o.address.city}` : ''}{o.address?.state ? `, ${o.address.state}` : ''} {o.address?.zip || ''}</div>
                      <div style={{ fontSize: 14 }}><b>📞 Phone:</b> {o.customer?.phone || o.address?.phone || '-'}</div>
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
                        {(!o.items || o.items.length === 0) && <div style={{ color: '#9ca3af', fontSize: 13 }}>No items data</div>}
                      </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 14 }}>
                      <span style={{ color: '#6b7280' }}>Items: {o.itemsCount ?? (o.items || []).reduce((a: number, i: any) => a + Number(i.quantity || 0), 0)}</span>
                      <span style={{ fontWeight: 800, fontSize: 15, color: '#1f2937' }}>Total: ₹{o.total ?? o.totals?.total ?? '-'}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
                      <b>Status:</b>
                      <select value={(o.status as any) || 'pending'} onChange={(e) => setOrderStatus(o.id, e.target.value as AdminStatus)} style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid rgba(0,0,0,0.12)', fontSize: 13 }}>
                        <option value="pending">Pending</option>
                        <option value="accepted">Accepted</option>
                        <option value="delivered">Delivered</option>
                      </select>
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {o.status !== 'accepted' && (
                        <button onClick={() => setOrderStatus(o.id, 'accepted')} style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid rgba(0,0,0,0.12)', background: '#eff6ff', color: '#2563eb', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Mark Accepted</button>
                      )}
                      {o.status !== 'delivered' && (
                        <button onClick={() => setOrderStatus(o.id, 'delivered')} style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid rgba(0,0,0,0.12)', background: '#ecfdf5', color: '#059669', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Mark Delivered</button>
                      )}
                      <button onClick={() => { const a = o.address; navigator.clipboard.writeText(`${o.customer?.name || ''}\n${a?.line1 || ''}\n${a?.city || ''}, ${a?.state || ''} ${a?.zip || ''}\n${o.customer?.phone || a?.phone || ''}`); push('Address copied!') }} style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid rgba(0,0,0,0.12)', background: '#f9fafb', color: '#374151', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>📋 Copy Address</button>
                      <button onClick={() => { const a = o.address; window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${a?.line1 || ''} ${a?.city || ''} ${a?.state || ''} ${a?.zip || ''}`)}`, '_blank') }} style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid rgba(0,0,0,0.12)', background: '#f9fafb', color: '#374151', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>📍 Open in Maps</button>
                      <button onClick={() => setConfirmDelete(o.id)} style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid #fecaca', background: '#fef2f2', color: '#dc2626', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>🗑️ Delete</button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {!loading && filtered.length === 0 ? (
          <Typography color="text.secondary" sx={{ mt: 2 }}>No orders.</Typography>
        ) : null}

        {/* Delete confirmation dialog */}
        {confirmDelete && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'grid', placeItems: 'center', zIndex: 9999 }}>
            <div style={{ background: '#fff', borderRadius: 16, padding: 24, maxWidth: 400, width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
              <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 12, color: '#1f2937' }}>🗑️ Delete Order?</div>
              <div style={{ color: '#6b7280', fontSize: 14, marginBottom: 20 }}>
                Are you sure you want to delete order <b>#{confirmDelete.slice(-8)}</b>? This action cannot be undone.
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button onClick={() => setConfirmDelete(null)} disabled={deleting} style={{ padding: '10px 20px', borderRadius: 8, border: '1px solid rgba(0,0,0,0.12)', background: '#f9fafb', color: '#374151', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                <button onClick={() => deleteOrder(confirmDelete)} disabled={deleting} style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: '#dc2626', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>{deleting ? 'Deleting…' : 'Delete'}</button>
              </div>
            </div>
          </div>
        )}
      </AdminLayout>
    </AdminGuard>
  )
}

