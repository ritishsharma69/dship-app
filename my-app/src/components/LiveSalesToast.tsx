import React from 'react'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import Slide from '@mui/material/Slide'
import CloseIcon from '@mui/icons-material/Close'

export interface LiveSalesToastProps {
  open: boolean
  name: string
  city: string
  title: string
  image: string
  timeAgo: string
  onClose?: () => void
}

export default function LiveSalesToast({ open, name, city, title, image, timeAgo, onClose }: LiveSalesToastProps) {
  return (
    <Slide direction="up" in={open} mountOnEnter unmountOnExit>
      <Paper elevation={6} sx={{
        position: 'fixed', left: 16, bottom: 16, zIndex: 1100,
        p: 1.25, pr: 4, borderRadius: 2, border: '1px solid #e5e7eb',
        background: 'rgba(255,255,255,0.98)', width: 'min(92vw, 340px)'
      }}>
        <IconButton size="small" onClick={onClose} sx={{ position: 'absolute', right: 6, top: 6 }}>
          <CloseIcon fontSize="small" />
        </IconButton>
        <Stack direction="row" spacing={1.25} alignItems="center">
          <Box sx={{ width: 44, height: 44, borderRadius: '50%', overflow: 'hidden', border: '1px solid #e5e7eb', flexShrink: 0 }}>
            <img src={image} alt={title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="body2" sx={{ color: '#111827', lineHeight: 1.2, overflowWrap: 'anywhere' }}>
              Someone from {city} recently purchased
            </Typography>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#111827', lineHeight: 1.1, overflowWrap: 'anywhere' }}>
              {title}
            </Typography>
            <Typography variant="caption" sx={{ color: '#6B7280' }}>{timeAgo}</Typography>
          </Box>
        </Stack>
      </Paper>
    </Slide>
  )
}

