import { useEffect, useMemo, useState } from 'react'
import AdminGuard from '../admin/AdminGuard'
import AdminLayout from '../admin/AdminLayout'
import { getAuthToken } from '../lib/auth'
import { apiGetJson, apiPatchJson } from '../lib/api'
import { useRouter } from '../lib/router'
import { useToast } from '../lib/toast'

import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import LinearProgress from '@mui/material/LinearProgress'
import MenuItem from '@mui/material/MenuItem'
import Paper from '@mui/material/Paper'
import Select from '@mui/material/Select'
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
  paymentMethod?: string
  customer?: any
  address?: any
}

export default function AdminOrdersPage() {
  const tok = useMemo(() => getAuthToken() || '', [])
  const { navigate } = useRouter()
  const { push } = useToast()

  const [list, setList] = useState<OrderLite[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [q, setQ] = useState('')

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

        {filtered.map((o) => (
          <Paper key={o.id} sx={{ p: 2, borderRadius: 3 }}>
            <Stack spacing={1}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ sm: 'center' }}>
                <Typography fontWeight={900}>#{String(o.id).slice(-8)}</Typography>
                <Box sx={{ flex: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  {o.createdAt ? new Date(o.createdAt).toLocaleString() : ''}
                </Typography>
              </Stack>

              <Typography variant="body2" color="text.secondary">
                {o.customer?.name ? `${o.customer?.name} · ` : ''}{o.customer?.email || ''}{o.address?.city ? ` · ${o.address.city}` : ''}
              </Typography>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ sm: 'center' }}>
                <Typography variant="body2"><b>Total:</b> ₹{Math.round(Number(o.totalPrice ?? o.totals?.grandTotal ?? 0)).toLocaleString('en-IN')}</Typography>
                <Typography variant="body2" color="text.secondary"><b>Pay:</b> {o.paymentMethod || '-'}</Typography>
                <Box sx={{ flex: 1 }} />
                <Select size="small" value={(o.status as any) || 'pending'} onChange={(e) => setOrderStatus(o.id, e.target.value as AdminStatus)}>
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="accepted">Accepted</MenuItem>
                  <MenuItem value="delivered">Delivered</MenuItem>
                </Select>
              </Stack>
            </Stack>
          </Paper>
        ))}

        {!loading && filtered.length === 0 ? (
          <Typography color="text.secondary">No orders.</Typography>
        ) : null}
      </AdminLayout>
    </AdminGuard>
  )
}

