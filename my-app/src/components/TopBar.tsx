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
import InputBase from '@mui/material/InputBase'
import Divider from '@mui/material/Divider'
import { Menu as MenuIcon, Lock, MailOutline, AssignmentOutlined, ArrowBackIosNew, LocalShipping, LocalShippingOutlined, PaymentsOutlined, CachedRounded, SearchRounded, PersonOutlineRounded, ShoppingCartOutlined, KeyboardArrowDownRounded, FavoriteBorderRounded, HomeOutlined, StorefrontOutlined, StarBorderRounded, AutoAwesomeOutlined } from '@mui/icons-material'
import { useCart } from '../lib/cart'
import { useWishlist } from '../lib/wishlist'
import { useRouter } from '../lib/router'

export default function TopBar() {
  const { count } = useCart()
  const { count: wishCount } = useWishlist()
  const { navigate, path } = useRouter()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const go = (to: string) => { setDrawerOpen(false); navigate(to) }
  const showBack = path !== '/' && !path.startsWith('/p/')
  const back = () => { if (window.history.length > 1) window.history.back(); else navigate('/') }
  const active = (to: string) => path === to




  const primaryLogoSrc = `${import.meta.env.BASE_URL}logo.png`

  return (
    <AppBar position="sticky" color="transparent" sx={{ borderRadius: 0,
      background: 'rgba(255,255,255,0.96)',
      borderBottom: '1px solid rgba(0,0,0,0.06)',
      boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
      color: '#1F2937',
      backdropFilter: 'saturate(140%) blur(12px)',
      WebkitBackdropFilter: 'saturate(140%) blur(12px)',
      overflow: 'visible'
    }}>
      {/* Announcement bar — light blush pink, like the mockup. Single line on all screens. */}
      <Box sx={{ bgcolor: '#FDE9F2', color: '#1F2937', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: { xs: 1, sm: 3.5 }, px: { xs: 0.5, sm: 1 }, py: 0.7, fontSize: { xs: 9.5, sm: 12 }, fontWeight: 700, letterSpacing: { xs: 0, sm: 0.2 }, flexWrap: 'nowrap', overflow: 'hidden' }}>
        <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: { xs: 0.4, sm: 0.6 }, whiteSpace: 'nowrap', flexShrink: 0 }}>
          <LocalShippingOutlined sx={{ fontSize: { xs: 12, sm: 15 }, color: '#F59E0B' }} /> FREE Delivery All India
        </Box>
        <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: { xs: 0.4, sm: 0.6 }, whiteSpace: 'nowrap', flexShrink: 0 }}>
          <PaymentsOutlined sx={{ fontSize: { xs: 12, sm: 15 }, color: '#F97316' }} /> COD Available
        </Box>
        <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: { xs: 0.4, sm: 0.6 }, whiteSpace: 'nowrap', flexShrink: 0 }}>
          <CachedRounded sx={{ fontSize: { xs: 12, sm: 15 }, color: '#EC4899' }} /> Easy Returns &amp; Refunds
        </Box>
      </Box>
		      <Toolbar
		        disableGutters
		        sx={{
		          width: '100%',
		          px: 0,
		          // Keep navbar height stable; logo must fit inside this.
		          height: { xs: 64, sm: 70, md: 76 },
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
				    role="img"
				    aria-label="Khushiyan Store"
				    sx={{
				      // Asset has lots of transparent padding around the artwork; crop precisely to
				      // the artwork bounding box so the logo sits perfectly centered in the navbar.
				      height: { xs: 40, sm: 46, md: 52 },
				      width: { xs: 132, sm: 151, md: 171 },
				      backgroundImage: `url(${primaryLogoSrc})`,
				      backgroundRepeat: 'no-repeat',
				      backgroundSize: '173% auto',
				      backgroundPosition: '43.7% 44.8%',
				    }}
				  />
	      	</IconButton>

        {/* Desktop nav: centered links, like the mockup */}
        <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 0.5, mx: 'auto' }}>
          {([
            { to: '/', label: 'Home', caret: false },
            { to: '/featured', label: 'Shop', caret: false },
            { to: '/featured', label: 'Best Sellers', caret: false },
            { to: '/featured', label: 'New Arrivals', caret: false },
            { to: '/orders', label: 'Track Order', caret: false },
          ]).map((l) => {
            const isActive = active(l.to) && (l.to !== '/featured' || l.label === 'Shop')
            return (
              <Button
                key={l.label}
                onClick={() => go(l.to)}
                endIcon={l.caret ? <KeyboardArrowDownRounded sx={{ fontSize: '18px !important', ml: -0.6 }} /> : undefined}
                sx={{
                  minWidth: 0, px: 1.8, py: 0.8, borderRadius: 2, position: 'relative',
                  textTransform: 'none', fontWeight: isActive ? 800 : 600, fontSize: 14.5,
                  color: isActive ? '#7C3AED' : '#111827',
                  '&:hover': { color: '#7C3AED', bgcolor: 'rgba(124,58,237,0.06)' },
                  '&::after': isActive ? {
                    content: '""', position: 'absolute', left: '22%', right: '22%', bottom: 3,
                    height: 2.5, borderRadius: 999, bgcolor: '#7C3AED',
                  } : undefined,
                }}
              >
                {l.label}
              </Button>
            )
          })}
        </Box>

        {/* Desktop right: search input, account, wishlist, cart (mockup order) */}
        <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 0.8, mr: 5 }}>
          {/* Search box — card-style rounded corners (12px, like product-card insets) */}
          <Box sx={{ display: 'flex', alignItems: 'center', width: 180, height: 36, px: 1.5, borderRadius: '12px', bgcolor: '#F9FAFB', border: '1px solid #E5E7EB', '&:focus-within': { borderColor: '#7C3AED', bgcolor: '#fff' } }}>
            <InputBase
              placeholder="Search products..."
              onKeyDown={(e) => { if (e.key === 'Enter') go('/featured') }}
              sx={{ flex: 1, fontSize: 13, fontWeight: 600, color: '#374151', '& input::placeholder': { color: '#9CA3AF', opacity: 1, fontWeight: 500 } }}
            />
            <SearchRounded onClick={() => go('/featured')} sx={{ fontSize: 17, color: '#6B7280', cursor: 'pointer', '&:hover': { color: '#7C3AED' } }} />
          </Box>
          <IconButton onClick={() => go('/orders')} aria-label="Account" sx={{ color: '#1F2937' }}>
            <PersonOutlineRounded sx={{ fontSize: 24 }} />
          </IconButton>
          <IconButton onClick={() => go('/wishlist')} aria-label="Wishlist" sx={{ color: '#1F2937' }}>
            <Badge badgeContent={wishCount} invisible={wishCount === 0} sx={{ '& .MuiBadge-badge': { bgcolor: '#7C3AED', color: '#fff', fontWeight: 800, fontSize: 10.5, minWidth: 17, height: 17 } }}>
              <FavoriteBorderRounded sx={{ fontSize: 24 }} />
            </Badge>
          </IconButton>
          <IconButton onClick={() => go('/checkout')} aria-label="Cart" sx={{ color: '#1F2937' }}>
            <Badge badgeContent={count} invisible={count === 0} sx={{ '& .MuiBadge-badge': { bgcolor: '#7C3AED', color: '#fff', fontWeight: 800, fontSize: 10.5, minWidth: 17, height: 17 } }}>
              <ShoppingCartOutlined sx={{ fontSize: 24 }} />
            </Badge>
          </IconButton>
        </Box>

        {/* Spacer for mobile so hamburger stays on right */}
        <Box sx={{ flexGrow: 1, display: { xs: 'inline-flex', md: 'none' } }} />

        {/* Mobile hamburger */}
        <IconButton color="inherit" aria-label="menu" onClick={() => setDrawerOpen(true)} sx={{ display: { xs: 'inline-flex', md: 'none' }, mr: 4 }}>
          <MenuIcon fontSize="medium" />
        </IconButton>
        {/* Mobile drawer — mirrors the desktop topbar: search + same nav links + account/wishlist/cart */}
        <Drawer anchor="right" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
          <Box sx={{ width: 290, maxWidth: '85vw', p: 1.5 }} role="presentation">
            {/* Search — same style as the desktop search box */}
            <Box sx={{ display: 'flex', alignItems: 'center', height: 40, px: 1.5, mb: 1, borderRadius: '12px', bgcolor: '#F9FAFB', border: '1px solid #E5E7EB', '&:focus-within': { borderColor: '#7C3AED', bgcolor: '#fff' } }}>
              <InputBase
                placeholder="Search products..."
                onKeyDown={(e) => { if (e.key === 'Enter') go('/featured') }}
                sx={{ flex: 1, fontSize: 13, fontWeight: 600, color: '#374151', '& input::placeholder': { color: '#9CA3AF', opacity: 1, fontWeight: 500 } }}
              />
              <SearchRounded onClick={() => go('/featured')} sx={{ fontSize: 17, color: '#6B7280', cursor: 'pointer' }} />
            </Box>

            {/* Main nav — same items as the desktop topbar */}
            <List sx={{ py: 0.5 }}>
              {([
                { to: '/', label: 'Home', icon: <HomeOutlined /> },
                { to: '/featured', label: 'Shop', icon: <StorefrontOutlined /> },
                { to: '/featured', label: 'Best Sellers', icon: <StarBorderRounded /> },
                { to: '/featured', label: 'New Arrivals', icon: <AutoAwesomeOutlined /> },
                { to: '/orders', label: 'Track Order', icon: <LocalShippingOutlined /> },
              ]).map((l) => {
                const isActive = active(l.to) && (l.to !== '/featured' || l.label === 'Shop')
                return (
                  <ListItemButton key={l.label} onClick={() => go(l.to)} sx={{ borderRadius: 2, mb: 0.25, ...(isActive && { bgcolor: 'rgba(124,58,237,0.08)', '&:hover': { bgcolor: 'rgba(124,58,237,0.12)' } }) }}>
                    <ListItemIcon sx={{ minWidth: 38, color: isActive ? '#7C3AED' : '#6B7280' }}>{l.icon}</ListItemIcon>
                    <ListItemText primary={l.label} primaryTypographyProps={{ fontSize: 14, fontWeight: isActive ? 800 : 600, color: isActive ? '#7C3AED' : '#374151' }} />
                  </ListItemButton>
                )
              })}
            </List>

            <Divider sx={{ my: 0.5 }} />

            {/* Account / Wishlist / Cart — same as desktop icon row */}
            <List sx={{ py: 0.5 }}>
              <ListItemButton onClick={() => go('/orders')} sx={{ borderRadius: 2 }}>
                <ListItemIcon sx={{ minWidth: 38, color: '#6B7280' }}><PersonOutlineRounded /></ListItemIcon>
                <ListItemText primary="Account" primaryTypographyProps={{ fontSize: 14, fontWeight: 600, color: '#374151' }} />
              </ListItemButton>
              <ListItemButton onClick={() => go('/wishlist')} sx={{ borderRadius: 2 }}>
                <ListItemIcon sx={{ minWidth: 38, color: '#6B7280' }}>
                  <Badge badgeContent={wishCount} invisible={wishCount === 0} sx={{ '& .MuiBadge-badge': { bgcolor: '#7C3AED', color: '#fff', fontWeight: 800, fontSize: 10.5, minWidth: 17, height: 17 } }}>
                    <FavoriteBorderRounded />
                  </Badge>
                </ListItemIcon>
                <ListItemText primary="Wishlist" primaryTypographyProps={{ fontSize: 14, fontWeight: 600, color: '#374151' }} />
              </ListItemButton>
              <ListItemButton onClick={() => go('/checkout')} sx={{ borderRadius: 2 }}>
                <ListItemIcon sx={{ minWidth: 38, color: '#6B7280' }}>
                  <Badge badgeContent={count} invisible={count === 0} sx={{ '& .MuiBadge-badge': { bgcolor: '#7C3AED', color: '#fff', fontWeight: 800, fontSize: 10.5, minWidth: 17, height: 17 } }}>
                    <ShoppingCartOutlined />
                  </Badge>
                </ListItemIcon>
                <ListItemText primary="Cart" primaryTypographyProps={{ fontSize: 14, fontWeight: 600, color: '#374151' }} />
              </ListItemButton>
            </List>

            <Divider sx={{ my: 0.5 }} />

            {/* Help & policies */}
            <List dense sx={{ py: 0.5 }}>
              <ListItemButton onClick={() => go('/contact')} sx={{ borderRadius: 2 }}>
                <ListItemIcon sx={{ minWidth: 38, color: '#9CA3AF' }}><MailOutline fontSize="small" /></ListItemIcon>
                <ListItemText primary="Contact Us" primaryTypographyProps={{ fontSize: 13, color: '#6B7280' }} />
              </ListItemButton>
              <ListItemButton onClick={() => go('/shipping')} sx={{ borderRadius: 2 }}>
                <ListItemIcon sx={{ minWidth: 38, color: '#9CA3AF' }}><LocalShipping fontSize="small" /></ListItemIcon>
                <ListItemText primary="Shipping Policy" primaryTypographyProps={{ fontSize: 13, color: '#6B7280' }} />
              </ListItemButton>
              <ListItemButton onClick={() => go('/cancellation-refund')} sx={{ borderRadius: 2 }}>
                <ListItemIcon sx={{ minWidth: 38, color: '#9CA3AF' }}><AssignmentOutlined fontSize="small" /></ListItemIcon>
                <ListItemText primary="Cancellation & Refund" primaryTypographyProps={{ fontSize: 13, color: '#6B7280' }} />
              </ListItemButton>
              <ListItemButton onClick={() => go('/privacy')} sx={{ borderRadius: 2 }}>
                <ListItemIcon sx={{ minWidth: 38, color: '#9CA3AF' }}><Lock fontSize="small" /></ListItemIcon>
                <ListItemText primary="Privacy" primaryTypographyProps={{ fontSize: 13, color: '#6B7280' }} />
              </ListItemButton>
              <ListItemButton onClick={() => go('/terms-conditions')} sx={{ borderRadius: 2 }}>
                <ListItemIcon sx={{ minWidth: 38, color: '#9CA3AF' }}><Lock fontSize="small" /></ListItemIcon>
                <ListItemText primary="Terms & Conditions" primaryTypographyProps={{ fontSize: 13, color: '#6B7280' }} />
              </ListItemButton>
            </List>
          </Box>
        </Drawer>
      </Toolbar>
    </AppBar>
  )
}

