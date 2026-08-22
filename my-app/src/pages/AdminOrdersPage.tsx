import { useEffect, useMemo, useState } from 'react'
import AdminGuard from '../admin/AdminGuard'
import AdminLayout from '../admin/AdminLayout'
import { getAuthToken } from '../lib/auth'
import { apiDeleteJson, apiGetJson, apiPatchJson } from '../lib/api'
import { useRouter } from '../lib/router'
import { useToast } from '../lib/toast'

import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import LinearProgress from '@mui/material/LinearProgress'
import MenuItem from '@mui/material/MenuItem'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

import ContentCopyRoundedIcon from '@mui/icons-material/ContentCopyRounded'
import PlaceRoundedIcon from '@mui/icons-material/PlaceRounded'
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded'
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded'
import LocalShippingRoundedIcon from '@mui/icons-material/LocalShippingRounded'
import InboxRoundedIcon from '@mui/icons-material/InboxRounded'
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded'

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
            <Button variant="outlined" onClick={() => navigate('/admin/returns')}
              sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2, color: '#fff', borderColor: 'rgba(255,255,255,0.5)', '&:hover': { borderColor: '#fff', bgcolor: 'rgba(255,255,255,0.08)' } }}>Returns</Button>
            <Button variant="contained" onClick={load} disabled={loading}
              sx={{ textTransform: 'none', fontWeight: 800, borderRadius: 2, bgcolor: '#fff', color: '#7C3AED', '&:hover': { bgcolor: '#f3e8ff' } }}>Refresh</Button>
          </Stack>
        }
      >
        <Paper elevation={0} sx={{ p: 2, borderRadius: 3, border: '1px solid #eee' }}>
          <Stack spacing={1.5}>
            <TextField label="Search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Order id, name, email, city…" size="small" />
            {loading ? <LinearProgress sx={{ borderRadius: 1, '& .MuiLinearProgress-bar': { bgcolor: '#7C3AED' }, bgcolor: 'rgba(124,58,237,0.12)' }} /> : null}
            {error ? <Typography color="error" fontWeight={700}>{error}</Typography> : null}
            <Typography variant="body2" color="text.secondary">Total: {filtered.length}</Typography>
          </Stack>
        </Paper>

        <Stack spacing={1.25}>
          {filtered.map((o) => {
            const isOpen = !!open[o.id]
            const status = (o.status || 'pending') as AdminStatus
            const statusSx = status === 'pending'
              ? { color: '#b45309', bgcolor: '#fffbeb', borderColor: '#fde68a' }
              : status === 'accepted'
                ? { color: '#1d4ed8', bgcolor: '#eff6ff', borderColor: '#bfdbfe' }
                : { color: '#047857', bgcolor: '#ecfdf5', borderColor: '#a7f3d0' }
            return (
              <Paper key={o.id} elevation={0} sx={{ borderRadius: 3, border: '1px solid #eee', overflow: 'hidden', transition: 'box-shadow 0.2s ease, border-color 0.2s ease', '&:hover': { borderColor: 'rgba(124,58,237,0.35)', boxShadow: '0 4px 16px rgba(124,58,237,0.08)' } }}>
                <Box component="button" onClick={() => setOpen(prev => ({ ...prev, [o.id]: !prev[o.id] }))}
                  sx={{ all: 'unset', cursor: 'pointer', width: '100%', display: 'block', p: 1.75, boxSizing: 'border-box' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1 }}>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography sx={{ fontWeight: 800, fontSize: 15, color: '#1f2937', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        #{o.id.slice(-8)}
                        <ExpandMoreRoundedIcon sx={{ fontSize: 18, color: '#9ca3af', transition: 'transform 0.2s ease', transform: isOpen ? 'rotate(180deg)' : 'none' }} />
                      </Typography>
                      <Typography sx={{ fontSize: 12, color: '#6b7280', mt: 0.25 }}>{o.customer?.name || '-'} · {o.customer?.email || ''}{o.address?.city ? ` · ${o.address.city}` : ''}</Typography>
                      <Typography sx={{ fontSize: 13, color: '#374151', mt: 0.75 }}><b>Total:</b> ₹{o.total ?? o.totals?.total ?? Math.round(Number(o.totalPrice ?? o.totals?.grandTotal ?? 0))}  <b>Pay:</b> {o.paymentMethod || 'cod'}</Typography>
                    </Box>
                    <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
                      <Typography sx={{ fontSize: 12, color: '#9ca3af', whiteSpace: 'nowrap' }}>{o.createdAt ? new Date(o.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : ''}{o.createdAt ? ', ' : ''}{o.createdAt ? new Date(o.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : ''}</Typography>
                      <Chip label={status} size="small" variant="outlined"
                        sx={{ mt: 0.75, fontWeight: 700, fontSize: 12, textTransform: 'capitalize', ...statusSx }} />
                    </Box>
                  </Box>
                </Box>
                {isOpen && (
                  <Box sx={{ px: 1.75, pb: 1.75, display: 'grid', gap: 1.25, borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                    <Box sx={{ pt: 1.5, display: 'grid', gap: 0.75 }}>
                      <Typography sx={{ fontSize: 14 }}><b>📍 Address:</b> {o.address?.line1}{o.address?.city ? `, ${o.address.city}` : ''}{o.address?.state ? `, ${o.address.state}` : ''} {o.address?.zip || ''}</Typography>
                      <Typography sx={{ fontSize: 14 }}><b>📞 Phone:</b> {o.customer?.phone || o.address?.phone || '-'}</Typography>
                    </Box>
                    <Box>
                      <Typography sx={{ fontWeight: 800, fontSize: 14, mb: 0.75, color: '#1f2937' }}>🛒 Items</Typography>
                      <Box sx={{ borderRadius: 2, border: '1px solid rgba(0,0,0,0.06)', bgcolor: '#fafafa', p: 1.25 }}>
                        {(o.items || []).map((item: any, idx: number) => (
                          <Box key={idx} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5, fontSize: 13, borderBottom: idx < (o.items || []).length - 1 ? '1px solid rgba(0,0,0,0.04)' : 'none' }}>
                            <span>{item.title} × {item.quantity}</span>
                            <Box component="span" sx={{ fontWeight: 700 }}>₹{item.unitPrice}</Box>
                          </Box>
                        ))}
                        {(!o.items || o.items.length === 0) && <Typography sx={{ color: '#9ca3af', fontSize: 13 }}>No items data</Typography>}
                      </Box>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography sx={{ fontSize: 14, color: '#6b7280' }}>Items: {o.itemsCount ?? (o.items || []).reduce((a: number, i: any) => a + Number(i.quantity || 0), 0)}</Typography>
                      <Typography sx={{ fontWeight: 800, fontSize: 15, color: '#1f2937' }}>Total: ₹{o.total ?? o.totals?.total ?? '-'}</Typography>
                    </Box>
                    <TextField select size="small" label="Status" value={status}
                      onChange={(e) => setOrderStatus(o.id, e.target.value as AdminStatus)}
                      sx={{ maxWidth: 200 }}>
                      <MenuItem value="pending">Pending</MenuItem>
                      <MenuItem value="accepted">Accepted</MenuItem>
                      <MenuItem value="delivered">Delivered</MenuItem>
                    </TextField>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {status !== 'accepted' && (
                        <Button size="small" variant="outlined" startIcon={<CheckCircleRoundedIcon />} onClick={() => setOrderStatus(o.id, 'accepted')}
                          sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2, color: '#1d4ed8', borderColor: '#bfdbfe', '&:hover': { borderColor: '#1d4ed8', bgcolor: '#eff6ff' } }}>Mark Accepted</Button>
                      )}
                      {status !== 'delivered' && (
                        <Button size="small" variant="outlined" startIcon={<LocalShippingRoundedIcon />} onClick={() => setOrderStatus(o.id, 'delivered')}
                          sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2, color: '#047857', borderColor: '#a7f3d0', '&:hover': { borderColor: '#047857', bgcolor: '#ecfdf5' } }}>Mark Delivered</Button>
                      )}
                      <Button size="small" variant="outlined" startIcon={<ContentCopyRoundedIcon />}
                        onClick={() => { const a = o.address; navigator.clipboard.writeText(`${o.customer?.name || ''}\n${a?.line1 || ''}\n${a?.city || ''}, ${a?.state || ''} ${a?.zip || ''}\n${o.customer?.phone || a?.phone || ''}`); push('Address copied!') }}
                        sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2, color: '#374151', borderColor: 'rgba(0,0,0,0.16)', '&:hover': { borderColor: '#374151', bgcolor: '#f9fafb' } }}>Copy Address</Button>
                      <Button size="small" variant="outlined" startIcon={<PlaceRoundedIcon />}
                        onClick={() => { const a = o.address; window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${a?.line1 || ''} ${a?.city || ''} ${a?.state || ''} ${a?.zip || ''}`)}`, '_blank') }}
                        sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2, color: '#374151', borderColor: 'rgba(0,0,0,0.16)', '&:hover': { borderColor: '#374151', bgcolor: '#f9fafb' } }}>Open in Maps</Button>
                      <Button size="small" variant="outlined" color="error" startIcon={<DeleteOutlineRoundedIcon />} onClick={() => setConfirmDelete(o.id)}
                        sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2, '&:hover': { bgcolor: '#fef2f2' } }}>Delete</Button>
                    </Box>
                  </Box>
                )}
              </Paper>
            )
          })}
        </Stack>

        {!loading && filtered.length === 0 ? (
          <Paper elevation={0} sx={{ borderRadius: 3, border: '1px dashed #ddd', p: 4, textAlign: 'center' }}>
            <InboxRoundedIcon sx={{ fontSize: 40, color: '#c4b5fd' }} />
            <Typography sx={{ fontWeight: 800, color: '#374151', mt: 1 }}>No orders found</Typography>
            <Typography variant="body2" color="text.secondary">{q ? 'Search badal ke try karo.' : 'Naye orders yahan dikhenge.'}</Typography>
          </Paper>
        ) : null}

        {/* Delete confirmation dialog */}
        <Dialog open={!!confirmDelete} onClose={() => !deleting && setConfirmDelete(null)} maxWidth="xs" fullWidth
          PaperProps={{ sx: { borderRadius: 3 } }}>
          <DialogTitle sx={{ fontWeight: 800 }}>Delete Order?</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary">
              Are you sure you want to delete order <b>#{(confirmDelete || '').slice(-8)}</b>? This action cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setConfirmDelete(null)} disabled={deleting}
              sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2, color: '#374151' }}>Cancel</Button>
            <Button variant="contained" color="error" disabled={deleting} onClick={() => confirmDelete && deleteOrder(confirmDelete)}
              startIcon={deleting ? <CircularProgress size={14} sx={{ color: '#fff' }} /> : <DeleteOutlineRoundedIcon />}
              sx={{ textTransform: 'none', fontWeight: 800, borderRadius: 2 }}>
              {deleting ? 'Deleting…' : 'Delete'}
            </Button>
          </DialogActions>
        </Dialog>
      </AdminLayout>
    </AdminGuard>
  )
}

