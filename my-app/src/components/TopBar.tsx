import { useState } from 'react'
import AppBar from '@mui/material/AppBar'
import Toolbar from '@mui/material/Toolbar'
import IconButton from '@mui/material/IconButton'
import Drawer from '@mui/material/Drawer'
import List from '@mui/material/List'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Button from '@mui/material/Button'
import Badge from '@mui/material/Badge'
import Box from '@mui/material/Box'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'

import { ShoppingCart, Menu as MenuIcon, Lock, MailOutline, AssignmentOutlined, ArrowBackIosNew, LocalShipping, MoreHoriz } from '@mui/icons-material'
import { useCart } from '../lib/cart'
import { useRouter } from '../lib/router'


// Inline fallback logo to avoid network delays if /mainlogo.png is slow/unavailable
const FALLBACK_LOGO = 'data:image/svg+xml;utf8,' + encodeURIComponent(
  "<svg xmlns='http://www.w3.org/2000/svg' width='240' height='72'>" +
  "<rect width='100%' height='100%' fill='#0b0b0b'/>" +
  "<text x='50%' y='52%' dominant-baseline='middle' text-anchor='middle' fill='#fff' font-family='system-ui,Arial' font-size='22' font-weight='700'>Khushiyan Store</text>" +
  "</svg>"
)

export default function TopBar() {
  const { count } = useCart()
  const { navigate, path } = useRouter()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const go = (to: string) => { setDrawerOpen(false); navigate(to) }
  const showBack = path !== '/' && !path.startsWith('/p/')
  const back = () => { if (window.history.length > 1) window.history.back(); else navigate('/') }
  const active = (to: string) => path === to
  const [moreEl, setMoreEl] = useState<null | HTMLElement>(null)
  const openMore = (e: any) => setMoreEl(e.currentTarget)
  const closeMore = () => setMoreEl(null)



  return (
    <AppBar position="sticky" color="transparent" sx={{ ml: 'calc(50% - 50vw)', mr: 'calc(50% - 50vw)', borderRadius: 0,
      background: `
        radial-gradient(1500px 280px at 85% -80px, rgba(88,28,135,0.32), transparent 64%),
        radial-gradient(1800px 420px at 55% -140px, rgba(76,29,149,0.12), transparent 72%),
        linear-gradient(180deg, #0a0a0a 0%, #111111 100%)
      `,
      borderBottom: '1px solid rgba(88,28,135,0.28)',
      boxShadow: '0 10px 32px rgba(0,0,0,0.28), inset 0 0 0 1px rgba(255,255,255,0.04), inset 0 -1px 0 rgba(88,28,135,0.14), inset 0 -2px 0 rgba(88,28,135,0.20)',
      color: '#FFFFFF',
      backdropFilter: 'saturate(120%) blur(6px)',
      overflow: 'visible'
    }}>
      <Toolbar disableGutters sx={{ width: '100%', px: 0, height: 90, overflow: 'visible' }}>
        {/* Left: Back (mobile) + Logo */}
        {showBack && (
          <IconButton color="inherit" onClick={back} aria-label="Back" sx={{ display: { xs: 'inline-flex', md: 'none' }, ml: 1, mr: 0.5 }}>
            <ArrowBackIosNew sx={{ fontSize: 20 }} />
          </IconButton>
        )}
        <IconButton color="inherit" onClick={() => go('/')} aria-label="Home" disableRipple sx={{ mr: 1, ml: { xs: 1, md: 6 }, '&:hover': { backgroundColor: 'transparent' } }}>
          <Box
            component="img"
            src="/mainlogo.png"
            alt="Main Logo"
            loading="eager"
            decoding="async"
            fetchPriority="high"
            onError={(e: any) => { e.currentTarget.src = FALLBACK_LOGO }}
            sx={{ height: 160, mt: '10px', width: 'auto', mr: 2.5, filter:'drop-shadow(0 8px 22px rgba(88,28,135,0.28))' }}
          />
        </IconButton>

        {/* Desktop actions compact: show key items + overflow menu */}
        <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'flex-end', gap: 1.5, ml: 'auto', mr: 6 }}>
          <Button color="inherit" onClick={() => go('/orders')} sx={{ minWidth: 72, lineHeight: 1, display: 'grid', placeItems: 'center', gap: 0.25, textTransform: 'none', fontWeight: 700 }}>
            <AssignmentOutlined fontSize="medium" sx={{ color: active('/orders') ? '#F59E0B' : 'inherit' }} />
            <Box component="span" sx={{ fontSize: 12.5, color: active('/orders') ? '#F59E0B' : 'inherit' }}>Your Orders</Box>
          </Button>
          <Button color="inherit" onClick={() => go('/contact')} sx={{ minWidth: 72, lineHeight: 1, display: 'grid', placeItems: 'center', gap: 0.25, textTransform: 'none', fontWeight: 700 }}>
            <MailOutline fontSize="medium" sx={{ color: active('/contact') ? '#F59E0B' : 'inherit' }} />
            <Box component="span" sx={{ fontSize: 12.5, color: active('/contact') ? '#F59E0B' : 'inherit' }}>Contact</Box>
          </Button>
          <Button color="inherit" onClick={(e) => openMore(e)} sx={{ minWidth: 64, lineHeight: 1, display: 'grid', placeItems: 'center', gap: 0.25, textTransform: 'none', fontWeight: 700 }} aria-controls={moreEl ? 'more-menu' : undefined} aria-haspopup="true" aria-expanded={Boolean(moreEl) ? 'true' : undefined}>
            <MoreHoriz fontSize="medium" />
            <Box component="span" sx={{ fontSize: 12.5 }}>More</Box>
          </Button>
          {/* Overflow menu */}
          <Menu id="more-menu" anchorEl={moreEl} open={Boolean(moreEl)} onClose={closeMore} keepMounted>
            <MenuItem onClick={() => { closeMore(); go('/privacy') }}>
              <ListItemIcon><Lock fontSize="small" /></ListItemIcon>
              <ListItemText>Privacy</ListItemText>
            </MenuItem>
            <MenuItem onClick={() => { closeMore(); go('/shipping') }}>
              <ListItemIcon><LocalShipping fontSize="small" /></ListItemIcon>
              <ListItemText>Shipping</ListItemText>
            </MenuItem>
            <MenuItem onClick={() => { closeMore(); go('/cancellation-refund') }}>
              <ListItemIcon><AssignmentOutlined fontSize="small" /></ListItemIcon>
              <ListItemText>Cancellation & Refund</ListItemText>
            </MenuItem>
            <MenuItem onClick={() => { closeMore(); go('/terms-conditions') }}>
              <ListItemIcon><Lock fontSize="small" /></ListItemIcon>
              <ListItemText>Terms & Conditions</ListItemText>
            </MenuItem>
          </Menu>
          <Button color="inherit" onClick={() => go('/checkout')} sx={{ minWidth: 72, lineHeight: 1, display: 'grid', placeItems: 'center', gap: 0.25, textTransform: 'none', fontWeight: 700 }} aria-label="Cart">
            <Badge badgeContent={count} color="error">
              <ShoppingCart fontSize="medium" sx={{ color: active('/checkout') ? '#F59E0B' : 'inherit' }} />
            </Badge>
            <Box component="span" sx={{ fontSize: 12.5, color: active('/checkout') ? '#F59E0B' : 'inherit' }}>Your Cart</Box>
          </Button>
        </Box>

        {/* Spacer for mobile so hamburger stays on right */}
        <Box sx={{ flexGrow: 1, display: { xs: 'inline-flex', md: 'none' } }} />

        {/* Mobile hamburger */}
        <IconButton color="inherit" aria-label="menu" onClick={() => setDrawerOpen(true)} sx={{ display: { xs: 'inline-flex', md: 'none' }, mr: 4 }}>
          <MenuIcon fontSize="medium" />
        </IconButton>
        <Drawer anchor="right" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
          <Box sx={{ width: 260, p: 1 }} role="presentation" onClick={() => setDrawerOpen(false)}>
            <List>
              <ListItemButton onClick={() => go('/orders')}>
                <ListItemIcon><AssignmentOutlined fontSize="medium" /></ListItemIcon>
                <ListItemText primary="Your Orders" />
              </ListItemButton>
              <ListItemButton onClick={() => go('/contact')}>
                <ListItemIcon><MailOutline fontSize="medium" /></ListItemIcon>
                <ListItemText primary="Contact Us" />
              </ListItemButton>
              <ListItemButton onClick={() => go('/privacy')}>
                <ListItemIcon><Lock fontSize="medium" /></ListItemIcon>
                <ListItemText primary="Privacy" />
              </ListItemButton>
              <ListItemButton onClick={() => go('/shipping')}>
                <ListItemIcon><LocalShipping fontSize="medium" /></ListItemIcon>
                <ListItemText primary="Shipping" />
              </ListItemButton>
              <ListItemButton onClick={() => go('/cancellation-refund')}>
                <ListItemIcon><AssignmentOutlined fontSize="medium" /></ListItemIcon>
                <ListItemText primary="Cancellation & Refund" />
              </ListItemButton>
              <ListItemButton onClick={() => go('/terms-conditions')}>
                <ListItemIcon><Lock fontSize="medium" /></ListItemIcon>
                <ListItemText primary="Terms & Conditions" />
              </ListItemButton>
              <ListItemButton onClick={() => go('/checkout')}>
                <ListItemIcon>
                  <Badge badgeContent={count} color="error">
                    <ShoppingCart fontSize="medium" />
                  </Badge>
                </ListItemIcon>
                <ListItemText primary="Cart" />
              </ListItemButton>
            </List>
          </Box>
        </Drawer>
      </Toolbar>
    </AppBar>
  )
}

