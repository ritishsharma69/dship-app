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
import Typography from '@mui/material/Typography'
import { Menu as MenuIcon, Lock, MailOutline, AssignmentOutlined, ArrowBackIosNew, LocalShippingOutlined, PaymentsOutlined, CachedRounded, SearchRounded, PersonOutlineRounded, ShoppingCartOutlined, KeyboardArrowDownRounded, FavoriteBorderRounded, HomeOutlined, StorefrontOutlined, StarBorderRounded, AutoAwesomeOutlined, CloseRounded, DescriptionOutlined, ChevronRightRounded, MailOutlineRounded } from '@mui/icons-material'
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
        {/* Mobile drawer — homepage-inspired: gradient header, icon tiles, section labels, support CTA */}
        <Drawer anchor="right" open={drawerOpen} onClose={() => setDrawerOpen(false)}
          PaperProps={{ sx: { width: 300, maxWidth: '86vw', borderRadius: '20px 0 0 20px', overflow: 'hidden' } }}>
          <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }} role="presentation">
            {/* Gradient header — matches homepage/policy hero language */}
            <Box sx={{ position: 'relative', px: 2, pt: 2, pb: 2.2, background: 'linear-gradient(100deg, #5B3FC4 0%, #7C4FD8 45%, #A458E8 100%)', flexShrink: 0 }}>
              <Box sx={{ position: 'absolute', top: -50, right: -40, width: 160, height: 160, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,0.16) 0%, transparent 70%)' }} />
              <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                <Box>
                  <Typography sx={{ fontFamily: 'Georgia, Times New Roman, serif', fontSize: 19, fontWeight: 700, color: '#fff', lineHeight: 1.2 }}>Khushiyan Store</Typography>
                  <Typography sx={{ fontSize: 11.5, color: 'rgba(255,255,255,0.85)', mt: 0.2 }}>Happiness, delivered to your door</Typography>
                </Box>
                <IconButton onClick={() => setDrawerOpen(false)} aria-label="Close menu" sx={{ color: '#fff', bgcolor: 'rgba(255,255,255,0.14)', border: '1px solid rgba(255,255,255,0.25)', width: 32, height: 32, '&:hover': { bgcolor: 'rgba(255,255,255,0.22)' } }}>
                  <CloseRounded sx={{ fontSize: 18 }} />
                </IconButton>
              </Box>
              {/* Search — sits inside the gradient header */}
              <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', height: 40, px: 1.5, borderRadius: '12px', bgcolor: '#fff', boxShadow: '0 4px 14px rgba(0,0,0,0.10)' }}>
                <InputBase
                  placeholder="Search products..."
                  onKeyDown={(e) => { if (e.key === 'Enter') go('/featured') }}
                  sx={{ flex: 1, fontSize: 13, fontWeight: 600, color: '#374151', '& input::placeholder': { color: '#9CA3AF', opacity: 1, fontWeight: 500 } }}
                />
                <SearchRounded onClick={() => go('/featured')} sx={{ fontSize: 17, color: '#7C3AED', cursor: 'pointer' }} />
              </Box>
            </Box>

            <Box sx={{ flex: 1, overflowY: 'auto', p: 1.5 }}>
              {/* Main nav */}
              <Typography sx={{ px: 1, pt: 0.5, pb: 0.6, fontSize: 10.5, fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase', color: '#9CA3AF' }}>Menu</Typography>
              <List sx={{ py: 0 }}>
                {([
                  { to: '/', label: 'Home', icon: <HomeOutlined sx={{ fontSize: 18 }} /> },
                  { to: '/featured', label: 'Shop', icon: <StorefrontOutlined sx={{ fontSize: 18 }} /> },
                  { to: '/featured', label: 'Best Sellers', icon: <StarBorderRounded sx={{ fontSize: 18 }} /> },
                  { to: '/featured', label: 'New Arrivals', icon: <AutoAwesomeOutlined sx={{ fontSize: 18 }} /> },
                  { to: '/orders', label: 'Track Order', icon: <LocalShippingOutlined sx={{ fontSize: 18 }} /> },
                ]).map((l) => {
                  const isActive = active(l.to) && (l.to !== '/featured' || l.label === 'Shop')
                  return (
                    <ListItemButton key={l.label} onClick={() => go(l.to)} sx={{ borderRadius: '12px', mb: 0.4, px: 1, py: 0.7, ...(isActive && { bgcolor: 'rgba(124,58,237,0.08)', '&:hover': { bgcolor: 'rgba(124,58,237,0.12)' } }) }}>
                      <ListItemIcon sx={{ minWidth: 44 }}>
                        <Box sx={{ width: 34, height: 34, borderRadius: '10px', display: 'grid', placeItems: 'center', bgcolor: isActive ? '#7C3AED' : 'rgba(124,58,237,0.08)', color: isActive ? '#fff' : '#7C3AED' }}>{l.icon}</Box>
                      </ListItemIcon>
                      <ListItemText primary={l.label} primaryTypographyProps={{ fontSize: 14, fontWeight: isActive ? 800 : 600, color: isActive ? '#7C3AED' : '#374151' }} />
                      {isActive && <ChevronRightRounded sx={{ fontSize: 18, color: '#7C3AED' }} />}
                    </ListItemButton>
                  )
                })}
              </List>

              {/* Account / Wishlist / Cart */}
              <Typography sx={{ px: 1, pt: 1.2, pb: 0.6, fontSize: 10.5, fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase', color: '#9CA3AF' }}>My Account</Typography>
              <List sx={{ py: 0 }}>
                {([
                  { to: '/orders', label: 'Account', icon: <PersonOutlineRounded sx={{ fontSize: 18 }} />, tone: 'rgba(14,165,233,0.10)', color: '#0284C7', badge: 0 },
                  { to: '/wishlist', label: 'Wishlist', icon: <FavoriteBorderRounded sx={{ fontSize: 18 }} />, tone: 'rgba(236,72,153,0.10)', color: '#DB2777', badge: wishCount },
                  { to: '/checkout', label: 'Cart', icon: <ShoppingCartOutlined sx={{ fontSize: 18 }} />, tone: 'rgba(245,158,11,0.12)', color: '#B45309', badge: count },
                ]).map((l) => (
                  <ListItemButton key={l.label} onClick={() => go(l.to)} sx={{ borderRadius: '12px', mb: 0.4, px: 1, py: 0.7 }}>
                    <ListItemIcon sx={{ minWidth: 44 }}>
                      <Box sx={{ width: 34, height: 34, borderRadius: '10px', display: 'grid', placeItems: 'center', bgcolor: l.tone, color: l.color }}>{l.icon}</Box>
                    </ListItemIcon>
                    <ListItemText primary={l.label} primaryTypographyProps={{ fontSize: 14, fontWeight: 600, color: '#374151' }} />
                    {l.badge > 0 && (
                      <Box sx={{ minWidth: 20, height: 20, px: 0.6, borderRadius: 999, display: 'grid', placeItems: 'center', bgcolor: '#7C3AED', color: '#fff', fontSize: 11, fontWeight: 800 }}>{l.badge}</Box>
                    )}
                  </ListItemButton>
                ))}
              </List>

              {/* Help & policies */}
              <Typography sx={{ px: 1, pt: 1.2, pb: 0.6, fontSize: 10.5, fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase', color: '#9CA3AF' }}>Help & Policies</Typography>
              <List dense sx={{ py: 0 }}>
                {([
                  { to: '/contact', label: 'Contact Us', icon: <MailOutline sx={{ fontSize: 16 }} /> },
                  { to: '/shipping', label: 'Shipping Policy', icon: <LocalShippingOutlined sx={{ fontSize: 16 }} /> },
                  { to: '/cancellation-refund', label: 'Cancellation & Refund', icon: <AssignmentOutlined sx={{ fontSize: 16 }} /> },
                  { to: '/privacy', label: 'Privacy', icon: <Lock sx={{ fontSize: 16 }} /> },
                  { to: '/terms-conditions', label: 'Terms & Conditions', icon: <DescriptionOutlined sx={{ fontSize: 16 }} /> },
                ]).map((l) => (
                  <ListItemButton key={l.label} onClick={() => go(l.to)} sx={{ borderRadius: '10px', px: 1, py: 0.55, '&:hover .drawer-help-label': { color: '#7C3AED' } }}>
                    <ListItemIcon sx={{ minWidth: 32, color: '#9CA3AF' }}>{l.icon}</ListItemIcon>
                    <ListItemText primary={l.label} primaryTypographyProps={{ className: 'drawer-help-label', fontSize: 13, fontWeight: 500, color: '#6B7280' }} />
                  </ListItemButton>
                ))}
              </List>
            </Box>

            {/* Support CTA — pinned at the bottom */}
            <Box sx={{ flexShrink: 0, m: 1.5, mt: 0, p: 1.6, borderRadius: '16px', bgcolor: 'rgba(124,58,237,0.05)', border: '1px solid rgba(124,58,237,0.14)', display: 'flex', alignItems: 'center', gap: 1.2 }}>
              <Box sx={{ width: 36, height: 36, borderRadius: '12px', display: 'grid', placeItems: 'center', bgcolor: '#7C3AED', color: '#fff', flexShrink: 0 }}>
                <MailOutlineRounded sx={{ fontSize: 18 }} />
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography sx={{ fontSize: 12.5, fontWeight: 800, color: '#1F2937', lineHeight: 1.2 }}>Need help?</Typography>
                <Typography onClick={() => go('/contact')} sx={{ fontSize: 12, fontWeight: 700, color: '#7C3AED', cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}>Contact support →</Typography>
              </Box>
            </Box>
          </Box>
        </Drawer>
      </Toolbar>
    </AppBar>
  )
}

