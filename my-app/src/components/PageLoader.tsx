import { Box } from '@mui/material'

/**
 * Lightweight route-transition fallback: a slim animated progress bar at the top
 * of the viewport (like YouTube/GitHub). Non-blocking — no full-screen overlay,
 * so the current page stays visible while the next chunk loads.
 */
export default function PageLoader() {
  return (
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
  )
}

