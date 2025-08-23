import { useState } from 'react'
import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import { Close } from '@mui/icons-material'

interface DiscountModalProps {
  open: boolean
  onClose: () => void
  onClaim: () => void
}

export default function DiscountModal({ open, onClose, onClaim }: DiscountModalProps) {
  const [claiming, setClaiming] = useState(false)

  const handleClaim = async () => {
    setClaiming(true)
    try {
      await onClaim()
    } finally {
      setClaiming(false)
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          background: 'linear-gradient(135deg, #ffffff 0%, #fef7f7 100%)',
          boxShadow: '0 20px 60px rgba(255,63,108,0.25), 0 8px 30px rgba(0,0,0,0.12)',
          overflow: 'visible',
          position: 'relative',
        }
      }}
    >
      {/* Close button */}
      <IconButton
        onClick={onClose}
        sx={{
          position: 'absolute',
          right: 8,
          top: 8,
          color: '#9CA3AF',
          zIndex: 1,
          '&:hover': { color: '#6B7280' }
        }}
      >
        <Close />
      </IconButton>

      <DialogContent sx={{ p: 0, textAlign: 'center', position: 'relative' }}>
        {/* Decorative circles */}
        <Box sx={{
          position: 'absolute',
          top: -20,
          left: -20,
          width: 80,
          height: 80,
          borderRadius: '50%',
          background: 'linear-gradient(45deg, #FF3F6C20, #FF3F6C10)',
          zIndex: 0,
        }} />
        <Box sx={{
          position: 'absolute',
          bottom: -30,
          right: -30,
          width: 100,
          height: 100,
          borderRadius: '50%',
          background: 'linear-gradient(45deg, #FF3F6C15, #FF3F6C08)',
          zIndex: 0,
        }} />

        <Box sx={{ p: 4, position: 'relative', zIndex: 1 }}>
          {/* Main discount circle */}
          <Box sx={{
            width: 140,
            height: 140,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #FF3F6C 0%, #E73962 100%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            mx: 'auto',
            mb: 3,
            boxShadow: '0 12px 40px rgba(255,63,108,0.4), inset 0 2px 0 rgba(255,255,255,0.2)',
            position: 'relative',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: -8,
              left: -8,
              right: -8,
              bottom: -8,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #FF3F6C30, #E7396230)',
              zIndex: -1,
            }
          }}>
            <Typography sx={{
              fontSize: 16,
              fontWeight: 800,
              color: '#FFFFFF',
              letterSpacing: 0.5,
              textShadow: '0 2px 4px rgba(0,0,0,0.2)'
            }}>
              ₹50
            </Typography>
            <Typography sx={{
              fontSize: 12,
              fontWeight: 700,
              color: '#FFFFFF',
              opacity: 0.9,
              textShadow: '0 1px 2px rgba(0,0,0,0.2)'
            }}>
              OFF
            </Typography>
          </Box>

          {/* Heading */}
          <Typography variant="h5" sx={{
            fontWeight: 800,
            color: '#111827',
            mb: 1,
            fontSize: { xs: 22, sm: 26 }
          }}>
            Wait! Don't Miss Out
          </Typography>

          <Typography sx={{
            color: '#6B7280',
            mb: 3,
            fontSize: 15,
            lineHeight: 1.5
          }}>
            Get ₹50 off your next purchase with this exclusive coupon
          </Typography>

          {/* Coupon code display */}
          <Box sx={{
            background: 'linear-gradient(135deg, #F3F4F6 0%, #E5E7EB 100%)',
            border: '2px dashed #FF3F6C',
            borderRadius: 2,
            p: 2,
            mb: 3,
            position: 'relative'
          }}>
            <Typography sx={{
              fontFamily: 'monospace',
              fontSize: 18,
              fontWeight: 800,
              color: '#FF3F6C',
              letterSpacing: 2
            }}>
              YOUARESPECIAL
            </Typography>
            <Typography sx={{
              fontSize: 12,
              color: '#6B7280',
              mt: 0.5
            }}>
              Use this code at checkout
            </Typography>
          </Box>

          {/* Action buttons */}
          <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
            <Button
              variant="contained"
              size="large"
              onClick={handleClaim}
              disabled={claiming}
              sx={{
                flex: 1,
                py: 1.5,
                borderRadius: 2,
                fontWeight: 800,
                fontSize: 16,
                background: 'linear-gradient(135deg, #FF3F6C 0%, #E73962 100%)',
                boxShadow: '0 8px 25px rgba(255,63,108,0.35)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #E73962 0%, #D1335A 100%)',
                  boxShadow: '0 12px 35px rgba(255,63,108,0.45)',
                  transform: 'translateY(-1px)'
                },
                '&:disabled': {
                  background: '#FCA5A5',
                  color: '#FFFFFF'
                }
              }}
            >
              {claiming ? 'Claiming...' : 'CLAIM NOW'}
            </Button>
            <Button
              variant="outlined"
              size="large"
              onClick={onClose}
              sx={{
                flex: 1,
                py: 1.5,
                borderRadius: 2,
                fontWeight: 700,
                fontSize: 14,
                color: '#6B7280',
                borderColor: '#D1D5DB',
                '&:hover': {
                  borderColor: '#9CA3AF',
                  background: '#F9FAFB'
                }
              }}
            >
              No Thanks
            </Button>
          </Box>

          {/* Small print */}
          <Typography sx={{
            fontSize: 11,
            color: '#9CA3AF',
            mt: 2,
            lineHeight: 1.4
          }}>
            * Valid for 7 days. Minimum order ₹299. Cannot be combined with other offers.
          </Typography>
        </Box>
      </DialogContent>
    </Dialog>
  )
}
