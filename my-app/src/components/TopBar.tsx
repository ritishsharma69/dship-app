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
import { ShoppingCart, Menu as MenuIcon, Lock, MailOutline, AssignmentOutlined, ArrowBackIosNew, LocalShipping, Description } from '@mui/icons-material'
import { useCart } from '../lib/cart'
import { useRouter } from '../lib/router'

export default function TopBar() {
  const { count } = useCart()
  const { navigate, path } = useRouter()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const go = (to: string) => { setDrawerOpen(false); navigate(to) }
  const showBack = path !== '/' && !path.startsWith('/p/')
  const back = () => { if (window.history.length > 1) window.history.back(); else navigate('/') }
  const active = (to: string) => path === to




  const primaryLogoSrc = `${import.meta.env.BASE_URL}logo.png`
  const fallbackLogoSrc = `${import.meta.env.BASE_URL}mainlogo.png`

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
		      <Toolbar
		        disableGutters
		        sx={{
		          width: '100%',
		          px: 0,
		          // Keep navbar height stable; logo must fit inside this.
		          height: { xs: 72, sm: 82, md: 90 },
		          overflow: 'hidden',
		          alignItems: 'center',
		        }}
		      >
        {/* Left: Back (mobile) + Logo */}
        {showBack && (
          <IconButton color="inherit" onClick={back} aria-label="Back" sx={{ display: { xs: 'inline-flex', md: 'none' }, ml: 1, mr: 0.5 }}>
            <ArrowBackIosNew sx={{ fontSize: 20 }} />
          </IconButton>
        )}
	      	<IconButton
	      	  color="inherit"
	      	  onClick={() => go('/')}
	      	  aria-label="Home"
	      	  disableRipple
	      	  sx={{
	      	    mr: 1,
		      	    ml: { xs: 1, md: 3 },
		      	    p: 0,
	      	    '&:hover': { backgroundColor: 'transparent' },
	      	  }}
	      	>
				  <Box
				    component="img"
					    src={primaryLogoSrc}
					    onError={(e) => {
					      // In production the repo/deploy might not include /logo.png yet.
					      // Fall back to /mainlogo.png so the brand always shows.
					      const img = e.currentTarget as HTMLImageElement
					      if (img.dataset.fallbackApplied) return
					      img.dataset.fallbackApplied = '1'
					      img.src = fallbackLogoSrc
					    }}
				    alt="Khushiyan Store"
				    loading="eager"
				    sx={{
				      // Keep navbar height stable, but "zoom" logo to avoid transparent padding in asset.
				      // Add top offset as requested (without making navbar taller).
				      mt: '15px',
				      height: { xs: 52, sm: 58, md: 70 },
				      width: { xs: 220, sm: 280, md: 340 },
				      maxWidth: { xs: '78vw', sm: '70vw', md: 420 },
				      objectFit: 'cover',
				      objectPosition: 'left center',
				      display: 'block',
				      borderRadius: 2,
				      boxShadow: '0 10px 22px rgba(0,0,0,0.35)',
				    }}
				  />
	      	</IconButton>

        {/* Desktop actions: all links in a single row */}
        <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 1, ml: 'auto', mr: 6 }}>
          <Button color="inherit" onClick={() => go('/orders')} startIcon={<AssignmentOutlined sx={{ fontSize: '20px !important', color: active('/orders') ? '#F59E0B' : 'inherit' }} />} sx={{ minWidth: 0, px: 1.5, py: 0.6, textTransform: 'none', fontWeight: 700, fontSize: 13.5, color: active('/orders') ? '#F59E0B' : 'inherit' }}>
            Orders
          </Button>
          <Button color="inherit" onClick={() => go('/contact')} startIcon={<MailOutline sx={{ fontSize: '20px !important', color: active('/contact') ? '#F59E0B' : 'inherit' }} />} sx={{ minWidth: 0, px: 1.5, py: 0.6, textTransform: 'none', fontWeight: 700, fontSize: 13.5, color: active('/contact') ? '#F59E0B' : 'inherit' }}>
            Contact
          </Button>
          <Button color="inherit" onClick={() => go('/privacy')} startIcon={<Lock sx={{ fontSize: '20px !important', color: active('/privacy') ? '#F59E0B' : 'inherit' }} />} sx={{ minWidth: 0, px: 1.5, py: 0.6, textTransform: 'none', fontWeight: 700, fontSize: 13.5, color: active('/privacy') ? '#F59E0B' : 'inherit' }}>
            Privacy
          </Button>
          <Button color="inherit" onClick={() => go('/shipping')} startIcon={<LocalShipping sx={{ fontSize: '20px !important', color: active('/shipping') ? '#F59E0B' : 'inherit' }} />} sx={{ minWidth: 0, px: 1.5, py: 0.6, textTransform: 'none', fontWeight: 700, fontSize: 13.5, color: active('/shipping') ? '#F59E0B' : 'inherit' }}>
            Shipping
          </Button>
          <Button color="inherit" onClick={() => go('/cancellation-refund')} startIcon={<Description sx={{ fontSize: '20px !important', color: active('/cancellation-refund') ? '#F59E0B' : 'inherit' }} />} sx={{ minWidth: 0, px: 1.5, py: 0.6, textTransform: 'none', fontWeight: 700, fontSize: 13.5, whiteSpace: 'nowrap', color: active('/cancellation-refund') ? '#F59E0B' : 'inherit' }}>
            Cancellation
          </Button>
          <Button color="inherit" onClick={() => go('/terms-conditions')} startIcon={<Lock sx={{ fontSize: '20px !important', color: active('/terms-conditions') ? '#F59E0B' : 'inherit' }} />} sx={{ minWidth: 0, px: 1.5, py: 0.6, textTransform: 'none', fontWeight: 700, fontSize: 13.5, whiteSpace: 'nowrap', color: active('/terms-conditions') ? '#F59E0B' : 'inherit' }}>
            Terms
          </Button>
          <Button color="inherit" onClick={() => go('/checkout')} startIcon={<Badge badgeContent={count} color="error"><ShoppingCart sx={{ fontSize: '20px !important', color: active('/checkout') ? '#F59E0B' : 'inherit' }} /></Badge>} sx={{ minWidth: 0, px: 1.5, py: 0.6, textTransform: 'none', fontWeight: 700, fontSize: 13.5, color: active('/checkout') ? '#F59E0B' : 'inherit' }} aria-label="Cart">
            Cart
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

