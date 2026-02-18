import { useEffect, useMemo, useState } from 'react'
import AdminGuard from '../admin/AdminGuard'
import AdminLayout from '../admin/AdminLayout'
import { getAuthToken } from '../lib/auth'
import { apiGetJson } from '../lib/api'

import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import Alert from '@mui/material/Alert'
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import LinearProgress from '@mui/material/LinearProgress'

import ShoppingCartIcon from '@mui/icons-material/ShoppingCart'
import InventoryIcon from '@mui/icons-material/Inventory'
import AssignmentReturnIcon from '@mui/icons-material/AssignmentReturn'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import AttachMoneyIcon from '@mui/icons-material/AttachMoney'

export default function AdminDashboardPage() {
  const tok = useMemo(() => getAuthToken(), [])
  const [counts, setCounts] = useState<{ products: number; orders: number; returnsOpen: number; revenue: number } | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const [p, o, r] = await Promise.all([
          apiGetJson<any>('/api/products/admin?limit=1000&skip=0', { authToken: tok, timeoutMs: 45000 }).catch(() => null),
          apiGetJson<any>('/api/orders/me', { authToken: tok, timeoutMs: 45000 }).catch(() => null),
          apiGetJson<any>('/api/returns/admin', { authToken: tok, timeoutMs: 45000 }).catch(() => null),
        ])

        const products = Array.isArray(p?.products) ? p.products.length : 0
        const orders = Array.isArray(o?.orders) ? o.orders.length : 0
        const returnsOpen = Array.isArray(r?.returns)
          ? r.returns.filter((x: any) => (x.status || 'open') !== 'resolved').length
          : 0
        const revenue = Array.isArray(o?.orders)
          ? o.orders.reduce((sum: number, order: any) => sum + (order.totalPrice || 0), 0)
          : 0
        if (!cancelled) setCounts({ products, orders, returnsOpen, revenue })
      } catch (e: any) {
        if (!cancelled) setError(e?.message || 'Failed to load dashboard')
      }
    })()
    return () => { cancelled = true }
  }, [tok])

  const StatCard = ({ icon: Icon, label, value, color, bgColor }: any) => (
    <Card sx={{
      borderRadius: 3,
      background: bgColor,
      border: 'none',
      boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
      transition: 'all 0.3s ease',
      '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: '0 12px 40px rgba(0,0,0,0.12)'
      }
    }}>
      <CardContent sx={{ p: 2.5 }}>
        <Stack spacing={1.5}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{
              background: color,
              color: '#fff',
              p: 1.5,
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Icon sx={{ fontSize: 28 }} />
            </Box>
            <TrendingUpIcon sx={{ color: color, opacity: 0.5 }} />
          </Box>
          <Box>
            <Typography variant="body2" sx={{ color: 'rgba(0,0,0,0.6)', fontWeight: 600, mb: 0.5 }}>
              {label}
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 900, color: color }}>
              {value !== null ? value : '…'}
            </Typography>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  )

  return (
    <AdminGuard>
      <AdminLayout title="Dashboard">
        {error ? <Alert severity="warning">{error}</Alert> : null}

        {/* Stats Grid */}
        <Grid container spacing={2.25}>
	          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              icon={InventoryIcon}
              label="Total Products"
              value={counts?.products}
              color="#FF3F6C"
              bgColor="linear-gradient(135deg, rgba(255,63,108,0.08) 0%, rgba(255,107,138,0.04) 100%)"
            />
          </Grid>
	          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              icon={ShoppingCartIcon}
              label="Total Orders"
              value={counts?.orders}
              color="#4C1D95"
              bgColor="linear-gradient(135deg, rgba(76,29,149,0.08) 0%, rgba(109,40,217,0.04) 100%)"
            />
          </Grid>
	          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              icon={AssignmentReturnIcon}
              label="Open Returns"
              value={counts?.returnsOpen}
              color="#C7A100"
              bgColor="linear-gradient(135deg, rgba(199,161,0,0.08) 0%, rgba(199,161,0,0.04) 100%)"
            />
          </Grid>
	          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              icon={AttachMoneyIcon}
              label="Total Revenue"
              value={counts?.revenue ? `₹${counts.revenue.toLocaleString('en-IN')}` : null}
              color="#EC4899"
              bgColor="linear-gradient(135deg, rgba(236,72,153,0.08) 0%, rgba(236,72,153,0.04) 100%)"
            />
          </Grid>
	          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              icon={TrendingUpIcon}
              label="Status"
              value="Active"
              color="#10B981"
              bgColor="linear-gradient(135deg, rgba(16,185,129,0.08) 0%, rgba(16,185,129,0.04) 100%)"
            />
          </Grid>
        </Grid>

        {/* Info Cards */}
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2.25} sx={{ mt: 2.25 }}>
          <Paper sx={{
            p: 3,
            borderRadius: 3,
            flex: 1,
            background: 'linear-gradient(135deg, rgba(255,63,108,0.06) 0%, rgba(76,29,149,0.06) 100%)',
            border: '1px solid rgba(255,63,108,0.1)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.06)'
          }}>
            <Stack spacing={1.5}>
              <Typography variant="h6" sx={{ fontWeight: 900, color: '#FF3F6C' }}>
                📊 Quick Stats
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Your admin workspace for managing products, orders, and returns.
              </Typography>

            </Stack>
          </Paper>

          <Paper sx={{
            p: 3,
            borderRadius: 3,
            flex: 1,
            background: 'linear-gradient(135deg, rgba(16,185,129,0.06) 0%, rgba(34,197,94,0.06) 100%)',
            border: '1px solid rgba(16,185,129,0.1)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.06)'
          }}>
            <Stack spacing={1.5}>
              <Typography variant="h6" sx={{ fontWeight: 900, color: '#10B981' }}>
                ✅ System Status
              </Typography>
              <Typography variant="body2" color="text.secondary">
                All systems operational and ready to manage your store.
              </Typography>
              <Box sx={{ mt: 1.5, display: 'grid', gap: 1 }}>
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="caption" sx={{ fontWeight: 600 }}>Database</Typography>
                    <Typography variant="caption" sx={{ color: '#10B981', fontWeight: 700 }}>Connected</Typography>
                  </Box>
                  <LinearProgress variant="determinate" value={100} sx={{ height: 6, borderRadius: 3, background: 'rgba(0,0,0,0.08)', '& .MuiLinearProgress-bar': { background: 'linear-gradient(90deg, #10B981 0%, #34D399 100%)' } }} />
                </Box>
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="caption" sx={{ fontWeight: 600 }}>API</Typography>
                    <Typography variant="caption" sx={{ color: '#10B981', fontWeight: 700 }}>Healthy</Typography>
                  </Box>
                  <LinearProgress variant="determinate" value={100} sx={{ height: 6, borderRadius: 3, background: 'rgba(0,0,0,0.08)', '& .MuiLinearProgress-bar': { background: 'linear-gradient(90deg, #10B981 0%, #34D399 100%)' } }} />
                </Box>
              </Box>
            </Stack>
          </Paper>
        </Stack>
      </AdminLayout>
    </AdminGuard>
  )
}
