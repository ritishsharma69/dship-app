import { useMemo, useState } from 'react'
import { apiGetJson, apiPostJson } from '../lib/api'
import { useRouter } from '../lib/router'
import { clearAuth, getAuthToken, setAuth } from '../lib/auth'
import { useToast } from '../lib/toast'

import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Container from '@mui/material/Container'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

export default function AdminLoginPage() {
  const { navigate } = useRouter()
  const { push } = useToast()

  const existing = useMemo(() => getAuthToken(), [])
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const validEmail = /^\S+@\S+\.\S+$/.test(email.trim())

  async function requestOtp() {
    setError(null)
    if (!validEmail) { setError('Enter a valid email'); return }
    const addr = email.trim().toLowerCase()
    if (addr !== 'khushiyanstore@gmail.com') {
      setError('Only khushiyanstore@gmail.com can access admin panel')
      return
    }
    setBusy(true)
    try {
      try {
        await apiPostJson('/api/auth/request-otp', { email: addr }, { loaderText: 'Sending OTP…', timeoutMs: 45000 })
      } catch (err: any) {
        // warm server + retry on cold start timeouts
        if (String(err?.message || '').toLowerCase().includes('timed out')) {
          await apiGetJson('/api/ping', { timeoutMs: 4000 }).catch(() => {})
          await new Promise(r => setTimeout(r, 1500))
          await apiPostJson('/api/auth/request-otp', { email: addr }, { loaderText: 'Retrying…', timeoutMs: 45000 })
        } else {
          throw err
        }
      }
      setOtpSent(true)
      push('OTP sent')
    } catch (e: any) {
      const msg = e?.message || 'Failed to send OTP'
      setError(msg)
      push(msg)
    } finally {
      setBusy(false)
    }
  }

  async function verifyOtp() {
    setError(null)
    const trimmedEmail = email.trim().toLowerCase()
    const trimmedCode = code.trim().replace(/[^0-9]/g, '')
    if (!trimmedEmail || !trimmedCode) { setError('Enter email and OTP'); return }
    setBusy(true)
    try {
      const payload = await apiPostJson<any>('/api/auth/verify-otp', { email: trimmedEmail, code: trimmedCode }, { loaderText: 'Verifying…', timeoutMs: 45000 })
      const tok = payload?.token
      if (!tok) throw new Error('No token received')
      setAuth(tok, trimmedEmail)
      push('Logged in')
      navigate('/admin/dashboard', { replace: true })
    } catch (e: any) {
      const msg = e?.message || 'Failed to verify OTP'
      setError(msg)
      push(msg)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: 'linear-gradient(135deg, #4C1D95 0%, #6D28D9 25%, #FF3F6C 75%, #FF6B8A 100%)' }}>
      <Container maxWidth="sm" sx={{ py: 5 }}>
        <Paper sx={{ p: { xs: 2.5, sm: 4 }, borderRadius: 3, background: 'rgba(255,255,255,0.98)', backdropFilter: 'blur(12px)', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
          <Stack spacing={1.25}>
            <Box sx={{ background: 'linear-gradient(135deg, #FF3F6C 0%, #FF6B8A 100%)', color: '#fff', p: 2, borderRadius: 2, mb: 1 }}>
              <Typography variant="overline" sx={{ fontWeight: 900, letterSpacing: 0.8, opacity: 0.9 }}>
                DSHIP
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 900, lineHeight: 1.05 }}>
                Admin Login
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">
              Use the same OTP login used in <b>Your Orders</b>. Token will be stored in this browser.
            </Typography>

            {existing ? (
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, mt: 1 }}>
                <Stack spacing={1} direction={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'stretch', sm: 'center' }}>
                  <Typography variant="body2" sx={{ flex: 1 }}>
                    You’re already logged in.
                  </Typography>
                  <Button variant="contained" onClick={() => navigate('/admin/dashboard', { replace: true })}>
                    Go to Dashboard
                  </Button>
                  <Button variant="outlined" onClick={() => { clearAuth(); push('Logged out'); }}>
                    Logout
                  </Button>
                </Stack>
              </Paper>
            ) : null}

            <Stack spacing={1.25} sx={{ mt: 1.5 }}>
              <TextField label="Admin Email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
              {otpSent && (
                <TextField label="OTP" value={code} onChange={(e) => setCode(e.target.value)} inputMode="numeric" />
              )}

              {error ? (
                <Typography variant="body2" sx={{ color: 'crimson', fontWeight: 700 }}>
                  {error}
                </Typography>
              ) : null}

              {!otpSent ? (
                <Button size="large" variant="contained" disabled={!validEmail || busy} onClick={requestOtp} sx={{ background: 'linear-gradient(90deg, #FF3F6C 0%, #FF6B8A 100%)', '&:hover': { background: 'linear-gradient(90deg, #E73962 0%, #E75A7A 100%)' }, '&:disabled': { background: 'rgba(0,0,0,0.12)' } }}>
                  {busy ? 'Sending…' : 'Send OTP'}
                </Button>
              ) : (
                <Button size="large" variant="contained" disabled={busy} onClick={verifyOtp} sx={{ background: 'linear-gradient(90deg, #FF3F6C 0%, #FF6B8A 100%)', '&:hover': { background: 'linear-gradient(90deg, #E73962 0%, #E75A7A 100%)' }, '&:disabled': { background: 'rgba(0,0,0,0.12)' } }}>
                  {busy ? 'Verifying…' : 'Verify & Login'}
                </Button>
              )}

              <Button variant="text" onClick={() => navigate('/', { replace: false })} sx={{ color: '#4C1D95', '&:hover': { background: 'rgba(76,29,149,0.08)' } }}>
                Back to Store
              </Button>
            </Stack>
          </Stack>
        </Paper>
      </Container>
    </Box>
  )
}
