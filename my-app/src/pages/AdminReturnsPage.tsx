import { useEffect, useMemo, useState } from 'react'
import AdminGuard from '../admin/AdminGuard'
import AdminLayout from '../admin/AdminLayout'
import { getAuthToken } from '../lib/auth'
import { apiGetJson, apiPostJson } from '../lib/api'
import { useRouter } from '../lib/router'

import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import LinearProgress from '@mui/material/LinearProgress'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded'
import ReplayRoundedIcon from '@mui/icons-material/ReplayRounded'
import InboxRoundedIcon from '@mui/icons-material/InboxRounded'

interface ReturnRec {
  id: string
  orderId: string
  email: string
  reasons?: string[]
  customReason?: string
  images?: string[]
  status?: string
  createdAt?: string
}

export default function AdminReturnsPage() {
  const { navigate } = useRouter()
  const [list, setList] = useState<ReturnRec[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [q, setQ] = useState('')

  const token = useMemo(() => getAuthToken() || '', [])

  useEffect(() => {
    document.title = 'Return Requests'
    if (!token) return
    setLoading(true)
    apiGetJson<{ returns: ReturnRec[] }>('/api/returns/admin', { authToken: token })
      .then((r) => setList(r?.returns || []))
      .catch((e: any) => setError(e?.message || 'Failed to load'))
      .finally(() => setLoading(false))
  }, [token])


  const filtered = useMemo(() => {
    const t = q.toLowerCase().trim()
    if (!t) return list
    return list.filter((r) => {
      const hay = [r.email, r.orderId, r.customReason, ...(r.reasons || [])].join(' ').toLowerCase()
      return hay.includes(t)
    })
  }, [q, list])

  const openList = useMemo(() => filtered.filter(r => (r.status || 'open') !== 'resolved'), [filtered])
  const resolvedList = useMemo(() => filtered.filter(r => (r.status || 'open') === 'resolved'), [filtered])

  async function markResolved(id: string) {
    try {
      await apiPostJson(`/api/returns/${id}/resolve`, {}, { authToken: token, loaderText: 'Marking resolved…' })
      setList(prev => prev.map(x => x.id === id ? { ...x, status: 'resolved' } : x))
    } catch (e: any) {
      setError(e?.message || 'Failed to resolve')
    }
  }

  async function reopen(id: string) {
    try {
      await apiPostJson(`/api/returns/${id}/reopen`, {}, { authToken: token, loaderText: 'Reopening…' })
      setList(prev => prev.map(x => x.id === id ? { ...x, status: 'open' } : x))
    } catch (e: any) {
      setError(e?.message || 'Failed to reopen')
    }
  }


  function ReturnsTable({ rows, action }: { rows: ReturnRec[]; action: (r: ReturnRec) => React.ReactNode }) {
    return (
      <TableContainer sx={{ borderRadius: 2, border: '1px solid #f0f0f0' }}>
        <Table size="small" sx={{ minWidth: 640 }}>
          <TableHead>
            <TableRow sx={{ '& th': { fontWeight: 800, color: '#374151', bgcolor: '#fafafa', whiteSpace: 'nowrap' } }}>
              <TableCell>When</TableCell>
              <TableCell>Order</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Details</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.id} hover>
                <TableCell sx={{ whiteSpace: 'nowrap' }}>{r.createdAt ? new Date(r.createdAt).toLocaleString() : '-'}</TableCell>
                <TableCell><code>#{String(r.orderId).slice(-8)}</code></TableCell>
                <TableCell>{r.email}</TableCell>
                <TableCell sx={{ maxWidth: 420 }}>
                  <Box sx={{ whiteSpace: 'pre-wrap' }}>{r.customReason || (r.reasons || []).join(', ') || '-'}</Box>
                </TableCell>
                <TableCell sx={{ whiteSpace: 'nowrap' }}>{action(r)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    )
  }

  function EmptyState({ text }: { text: string }) {
    return (
      <Box sx={{ borderRadius: 2, border: '1px dashed #ddd', p: 3, textAlign: 'center' }}>
        <InboxRoundedIcon sx={{ fontSize: 32, color: '#c4b5fd' }} />
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{text}</Typography>
      </Box>
    )
  }

  return (
    <AdminGuard>
      <AdminLayout
        title="Returns"
        actions={
          <Button variant="outlined" onClick={() => navigate('/admin/orders')}
            sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2, color: '#fff', borderColor: 'rgba(255,255,255,0.5)', '&:hover': { borderColor: '#fff', bgcolor: 'rgba(255,255,255,0.08)' } }}>
            Back to Orders
          </Button>
        }
      >
        <Paper elevation={0} sx={{ p: 2, borderRadius: 3, border: '1px solid #eee' }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ xs: 'stretch', sm: 'center' }}>
            <TextField size="small" placeholder="Search email, order, details…" value={q} onChange={e => setQ(e.target.value)} sx={{ maxWidth: { sm: 320 }, flex: 1 }} />
            <Stack direction="row" spacing={1}>
              <Chip size="small" label={`Open: ${openList.length}`} sx={{ fontWeight: 700, color: '#b45309', bgcolor: '#fffbeb', border: '1px solid #fde68a' }} />
              <Chip size="small" label={`Resolved: ${resolvedList.length}`} sx={{ fontWeight: 700, color: '#047857', bgcolor: '#ecfdf5', border: '1px solid #a7f3d0' }} />
            </Stack>
          </Stack>
          {error && <Typography color="error" fontWeight={700} sx={{ mt: 1.5 }}>{error}</Typography>}
          {loading && <LinearProgress sx={{ mt: 1.5, borderRadius: 1, '& .MuiLinearProgress-bar': { bgcolor: '#7C3AED' }, bgcolor: 'rgba(124,58,237,0.12)' }} />}
        </Paper>

        {!loading && (
          <>
            <Paper elevation={0} sx={{ p: 2, borderRadius: 3, border: '1px solid #eee' }}>
              <Typography sx={{ fontWeight: 800, fontSize: 15, mb: 1.5, color: '#111827' }}>🟡 Open requests</Typography>
              {openList.length > 0 ? (
                <ReturnsTable rows={openList} action={(r) => (
                  <Button size="small" variant="outlined" startIcon={<CheckCircleRoundedIcon />} onClick={() => markResolved(r.id)}
                    sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2, color: '#047857', borderColor: '#a7f3d0', '&:hover': { borderColor: '#047857', bgcolor: '#ecfdf5' } }}>
                    Mark Resolved
                  </Button>
                )} />
              ) : (
                <EmptyState text="No open return requests." />
              )}
            </Paper>

            <Paper elevation={0} sx={{ p: 2, borderRadius: 3, border: '1px solid #eee' }}>
              <Typography sx={{ fontWeight: 800, fontSize: 15, mb: 1.5, color: '#111827' }}>🟢 Resolved</Typography>
              {resolvedList.length > 0 ? (
                <ReturnsTable rows={resolvedList} action={(r) => (
                  <Button size="small" variant="outlined" startIcon={<ReplayRoundedIcon />} onClick={() => reopen(r.id)}
                    sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2, color: '#7C3AED', borderColor: 'rgba(124,58,237,0.4)', '&:hover': { borderColor: '#7C3AED', bgcolor: 'rgba(124,58,237,0.06)' } }}>
                    Reopen
                  </Button>
                )} />
              ) : (
                <EmptyState text="No resolved returns yet." />
              )}
            </Paper>
          </>
        )}
      </AdminLayout>
    </AdminGuard>
  )
}

