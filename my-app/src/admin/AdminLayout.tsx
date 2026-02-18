import { useMemo, useState } from 'react'
import { useRouter } from '../lib/router'
import { clearAuth, decodeDemoTokenEmail, getAuthEmail, getAuthToken } from '../lib/auth'

import AppBar from '@mui/material/AppBar'
import Box from '@mui/material/Box'
import CssBaseline from '@mui/material/CssBaseline'
import Divider from '@mui/material/Divider'
import Drawer from '@mui/material/Drawer'
import IconButton from '@mui/material/IconButton'
import List from '@mui/material/List'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Stack from '@mui/material/Stack'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useTheme } from '@mui/material/styles'

import MenuIcon from '@mui/icons-material/Menu'
import DashboardIcon from '@mui/icons-material/Dashboard'
import Inventory2Icon from '@mui/icons-material/Inventory2'
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong'
import AssignmentReturnIcon from '@mui/icons-material/AssignmentReturn'
import LogoutIcon from '@mui/icons-material/Logout'
import StorefrontIcon from '@mui/icons-material/Storefront'

const drawerWidth = 272

type NavItem = { label: string; path: string; icon: React.ReactNode }

export default function AdminLayout({ title, children, actions }: { title: string; children: React.ReactNode; actions?: React.ReactNode }) {
  const { path, navigate } = useRouter()
  const theme = useTheme()
  const mdUp = useMediaQuery(theme.breakpoints.up('md'))
  const [mobileOpen, setMobileOpen] = useState(false)

  const email = useMemo(() => {
    const saved = getAuthEmail()
    if (saved) return saved
    const tok = getAuthToken()
    return (tok && decodeDemoTokenEmail(tok)) || ''
  }, [])

  const nav: NavItem[] = [
    { label: 'Dashboard', path: '/admin/dashboard', icon: <DashboardIcon /> },
    { label: 'Products', path: '/admin/products', icon: <Inventory2Icon /> },
    { label: 'Orders', path: '/admin/orders', icon: <ReceiptLongIcon /> },
    { label: 'Returns', path: '/admin/returns', icon: <AssignmentReturnIcon /> },
  ]

  const go = (to: string) => {
    setMobileOpen(false)
    navigate(to)
  }

  const onLogout = () => {
    clearAuth()
    setMobileOpen(false)
    navigate('/admin/login', { replace: true })
  }

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'linear-gradient(180deg, #ffffff 0%, #faf5f0 100%)' }}>
      <Box sx={{ px: 2, py: 2.25, background: 'linear-gradient(135deg, #FF3F6C 0%, #FF6B8A 100%)', color: '#fff', borderRadius: '0 0 12px 0' }}>
        <Typography variant="subtitle2" sx={{ opacity: 0.9, fontWeight: 900, letterSpacing: 0.4 }}>
          DSHIP
        </Typography>
        <Typography variant="h6" sx={{ fontWeight: 900, lineHeight: 1.1 }}>
          Admin Panel
        </Typography>
        {email ? (
          <Typography variant="caption" sx={{ display: 'block', mt: 0.75, opacity: 0.85 }}>
            {email}
          </Typography>
        ) : null}
      </Box>
      <Divider />
      <List sx={{ px: 1.25, py: 1 }}>
        {nav.map((it) => (
          <ListItemButton
            key={it.path}
            selected={path === it.path}
            onClick={() => go(it.path)}
            sx={{
              borderRadius: 2,
              mb: 0.75,
              '&.Mui-selected': { background: 'linear-gradient(90deg, rgba(255,63,108,0.12) 0%, rgba(76,29,149,0.08) 100%)' },
              '&.Mui-selected .MuiListItemIcon-root': { color: '#FF3F6C' },
            }}
          >
            <ListItemIcon sx={{ minWidth: 38 }}>{it.icon}</ListItemIcon>
            <ListItemText primary={it.label} primaryTypographyProps={{ fontWeight: 800 }} />
          </ListItemButton>
        ))}
      </List>
      <Box sx={{ flex: 1 }} />
      <Divider />
      <Box sx={{ p: 1.25, display: 'grid', gap: 1 }}>
        <Button variant="outlined" startIcon={<StorefrontIcon />} onClick={() => window.location.assign('/')}
          sx={{ borderRadius: 2, justifyContent: 'flex-start', borderColor: '#FF3F6C', color: '#FF3F6C', '&:hover': { background: 'rgba(255,63,108,0.08)' } }}>
          View Store
        </Button>
        <Button variant="contained" startIcon={<LogoutIcon />} onClick={onLogout}
          sx={{ borderRadius: 2, justifyContent: 'flex-start', background: 'linear-gradient(90deg, #FF3F6C 0%, #FF6B8A 100%)', '&:hover': { background: 'linear-gradient(90deg, #E73962 0%, #E75A7A 100%)' } }}>
          Logout
        </Button>
      </Box>
    </Box>
  )

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', background: 'linear-gradient(135deg, #f8f8f8 0%, #faf5f0 100%)' }}>
      <CssBaseline />
      <AppBar position="fixed" sx={{ zIndex: theme.zIndex.drawer + 1, background: 'linear-gradient(90deg, #2D3748 0%, #4A5568 100%)', width: `calc(100% - ${drawerWidth}px)`, marginLeft: `${drawerWidth}px` }}>
        <Toolbar sx={{ gap: 1.5 }}>
          {!mdUp && (
            <IconButton color="inherit" edge="start" onClick={() => setMobileOpen(true)}>
              <MenuIcon />
            </IconButton>
          )}
          <Typography variant="h6" sx={{ fontWeight: 900, flex: 1 }}>
            {title}
          </Typography>
          {actions}
        </Toolbar>
      </AppBar>

      {/* Drawer */}
      <Box component="nav" sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{ display: { xs: 'block', md: 'none' }, '& .MuiDrawer-paper': { width: drawerWidth } }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{ display: { xs: 'none', md: 'block' }, '& .MuiDrawer-paper': { width: drawerWidth, boxSizing: 'border-box' } }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Content */}
      <Box component="main" sx={{ flexGrow: 1, p: { xs: 2, md: 3 }, width: '100%' }}>
        <Toolbar />
        <Stack spacing={2.25}>
          {children}
        </Stack>
      </Box>
    </Box>
  )
}
