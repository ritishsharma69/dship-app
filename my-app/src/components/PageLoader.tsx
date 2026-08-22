import { Box, Typography } from '@mui/material'

/**
 * Route-transition fallback for the lazy page <Suspense>.
 * IMPORTANT: this must OCCUPY the main content area (not just overlay it) —
 * otherwise <main> collapses to 0px while a chunk loads and the Footer jumps
 * up into the viewport (the "broken" flash between loader and page).
 *
 * Renders a full-height centered brand spinner (same look as the #initial-loader
 * in index.html, so a hard refresh feels like one continuous loader) plus a slim
 * top progress bar for in-app navigations.
 */
export default function PageLoader() {
  return (
    <>
      {/* Slim top progress bar */}
      <Box sx={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 2100, height: 3, overflow: 'hidden', bgcolor: 'rgba(124,58,237,0.12)' }}>
        <Box
          sx={{
            height: '100%',
            width: '35%',
            borderRadius: 999,
            background: 'linear-gradient(90deg, #7c3aed, #FF2A6D)',
            animation: 'pageloader-slide 0.9s ease-in-out infinite',
            '@keyframes pageloader-slide': {
              '0%': { transform: 'translateX(-100%)' },
              '100%': { transform: 'translateX(400%)' },
            },
          }}
        />
      </Box>
      {/* Full-height placeholder that fills <main> and keeps the Footer below the fold */}
      <Box sx={{ minHeight: 'calc(100dvh - 64px)', display: 'grid', placeItems: 'center', bgcolor: '#fff' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ position: 'relative', width: 64, height: 64 }}>
            <Box sx={{ position: 'absolute', inset: 0, borderRadius: 999, border: '4px solid rgba(109,40,217,0.18)' }} />
            <Box sx={{
              position: 'absolute', inset: 0, borderRadius: 999,
              border: '4px solid transparent', borderTopColor: '#6D28D9',
              animation: 'pageloader-spin 1s linear infinite',
              '@keyframes pageloader-spin': { to: { transform: 'rotate(360deg)' } },
            }} />
          </Box>
          <Typography sx={{ fontWeight: 800, fontSize: 15, color: '#4C1D95', letterSpacing: 0.3 }}>Loading...</Typography>
        </Box>
      </Box>
    </>
  )
}

