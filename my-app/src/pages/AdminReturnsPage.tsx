import { useEffect, useMemo, useState } from 'react'
import AdminGuard from '../admin/AdminGuard'
import AdminLayout from '../admin/AdminLayout'
import { getAuthToken } from '../lib/auth'
import { apiGetJson, apiPostJson } from '../lib/api'
import { useRouter } from '../lib/router'

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


  return (
    <AdminGuard>
      <AdminLayout
        title="Returns"
        actions={
          <button className="btn" onClick={() => navigate('/admin/orders')}>Back to Orders</button>
        }
      >
        <div style={{ marginTop: 8, display: 'flex', gap: 8, alignItems: 'center' }}>
          <input className="input" placeholder="Search email, order, details…" value={q} onChange={e => setQ(e.target.value)} style={{ maxWidth: 320 }} />
          <span className="muted">Open: {openList.length} · Resolved: {resolvedList.length}</span>
        </div>

        {error && <div style={{ color: 'crimson', marginTop: 10 }}>{error}</div>}
        {loading ? (
          <div className="muted" style={{ marginTop: 12 }}>Loading…</div>
        ) : (
          <div style={{ overflowX: 'auto', marginTop: 12 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--color-border)' }}>
                  <th style={{ padding: 8 }}>When</th>
                  <th style={{ padding: 8 }}>Order</th>
                  <th style={{ padding: 8 }}>Email</th>
                  <th style={{ padding: 8 }}>Details</th>
                  <th style={{ padding: 8 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {openList.map((r) => (
                  <tr key={r.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: 8 }}>{r.createdAt ? new Date(r.createdAt).toLocaleString() : '-'}</td>
                    <td style={{ padding: 8 }}><code>#{String(r.orderId).slice(-8)}</code></td>
                    <td style={{ padding: 8 }}>{r.email}</td>
                    <td style={{ padding: 8, maxWidth: 420 }}>
                      <div style={{ whiteSpace: 'pre-wrap' }}>{r.customReason || (r.reasons || []).join(', ') || '-'}</div>
                    </td>
                    <td style={{ padding: 8 }}>
                      <button className="btn" onClick={() => markResolved(r.id)}>Mark Resolved</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {openList.length === 0 && !loading ? (
              <div className="muted" style={{ marginTop: 12 }}>No open return requests.</div>
            ) : null}

            <div style={{ overflowX: 'auto', marginTop: 24 }}>
              <h3 style={{ margin: '0 0 8px' }}>Resolved</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--color-border)' }}>
                    <th style={{ padding: 8 }}>When</th>
                    <th style={{ padding: 8 }}>Order</th>
                    <th style={{ padding: 8 }}>Email</th>
                    <th style={{ padding: 8 }}>Details</th>
                    <th style={{ padding: 8 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {resolvedList.map((r) => (
                    <tr key={r.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: 8 }}>{r.createdAt ? new Date(r.createdAt).toLocaleString() : '-'}</td>
                      <td style={{ padding: 8 }}><code>#{String(r.orderId).slice(-8)}</code></td>
                      <td style={{ padding: 8 }}>{r.email}</td>
                      <td style={{ padding: 8, maxWidth: 420 }}>
                        <div style={{ whiteSpace: 'pre-wrap' }}>{r.customReason || (r.reasons || []).join(', ') || '-'}</div>
                      </td>
                      <td style={{ padding: 8 }}>
                        <button className="btn" onClick={() => reopen(r.id)}>Reopen</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {resolvedList.length === 0 && !loading ? (
                <div className="muted" style={{ marginTop: 12 }}>No resolved returns yet.</div>
              ) : null}
            </div>
          </div>
        )}
      </AdminLayout>
    </AdminGuard>
  )
}

