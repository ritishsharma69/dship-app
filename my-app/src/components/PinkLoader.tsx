import React, { useEffect, useRef } from 'react'
import { createRoot, Root } from 'react-dom/client'
import { Box, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import { gsap } from '../lib/gsap'

/**
 * Minimal pink + dark loader (centered, simple)
 * No card, only a subtle circular ring with a few orbits.
 * Public API preserved: showPinkLoader(text?), hidePinkLoader()
 */

declare global { interface Window { __pinkLoaderCount?: number } }

let root: Root | null = null
let containerEl: HTMLDivElement | null = null
let currentText = 'Loading…'

function mount(text?: string) {
  if (!containerEl) {
    containerEl = document.createElement('div')
    containerEl.id = 'mui-gsap-loader'
    Object.assign(containerEl.style, { position: 'fixed', inset: '0', zIndex: '2000' })
    document.body.appendChild(containerEl)
  }
  if (!root) root = createRoot(containerEl)
  currentText = text || currentText
  root.render(<Overlay text={currentText} />)
}

function unmount() {
  if (root) root.unmount()
  if (containerEl?.parentElement) containerEl.parentElement.removeChild(containerEl)
  root = null
  containerEl = null
}

export function showPinkLoader(text?: string) {
  window.__pinkLoaderCount = (window.__pinkLoaderCount ?? 0) + 1
  mount(text)
}

export function hidePinkLoader() {
  const count = Math.max(0, (window.__pinkLoaderCount ?? 0) - 1)
  window.__pinkLoaderCount = count
  if (count > 0) return
  unmount()
}

function Overlay({ text }: { text: string }) {
  const orbitRef = useRef<HTMLDivElement>(null)
  const ringRef = useRef<HTMLDivElement>(null)
  const haloRef = useRef<HTMLDivElement>(null)
  const textRef = useRef<HTMLDivElement>(null)

  // Keep pink, darken the rest
  const pink = '#FF2A6D'
  const dark = '#0B0B0F'
  const purple = '#4B2AA4'

  useEffect(() => {
    const spin = gsap.to(orbitRef.current, { rotate: 360, duration: 2.1, ease: 'linear', repeat: -1 })
    const pulse = gsap.to(ringRef.current, { scale: 1.045, duration: 1.2, yoyo: true, repeat: -1, ease: 'sine.inOut' })
    const halo = gsap.to(haloRef.current, { opacity: 0.9, duration: 1.6, yoyo: true, repeat: -1, ease: 'sine.inOut' })
    const textBlink = gsap.to(textRef.current, { opacity: 0.9, duration: 1, yoyo: true, repeat: -1, ease: 'sine.inOut' })
    return () => { spin.kill(); pulse.kill(); halo.kill(); textBlink.kill() }
  }, [])

  return (
    <Box sx={{
      position: 'fixed', inset: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column',
      background: `radial-gradient(900px circle at 50% 40%, ${alpha(purple, 0.12)}, transparent 70%), rgba(0,0,0,0.70)`,
      backdropFilter: 'blur(4px)'
    }}>
      {/* Simple circle */}
      <Box sx={{ position: 'relative', width: 140, height: 140, borderRadius: '50%', display: 'grid', placeItems: 'center' }}>
        {/* soft halo */}
        <Box ref={haloRef} sx={{ position: 'absolute', inset: 0, borderRadius: '50%', background: `radial-gradient(65% 65% at 50% 45%, ${alpha(pink, 0.25)}, ${alpha(purple, 0.18)} 60%, transparent 70%)`, filter: 'blur(8px)' }} />
        {/* ring */}
        <Box ref={ringRef} sx={{ position: 'absolute', inset: 22, borderRadius: '50%', border: `2px solid ${alpha(pink, 0.6)}`, boxShadow: `0 0 12px ${alpha(pink, 0.35)}, inset 0 0 18px ${alpha(purple, 0.45)}` }} />
        {/* single orbit with 3 dots */}
        <Box ref={orbitRef} sx={{ position: 'absolute', inset: 16 }}>
          <Dot sx={{ top: -6, left: '50%', transform: 'translateX(-50%)' }} color={pink} />
          <Dot sx={{ right: -6, top: '50%', transform: 'translateY(-50%)' }} color={alpha(purple, 0.8)} />
          <Dot sx={{ bottom: -6, left: '50%', transform: 'translateX(-50%)' }} color={alpha(dark, 0.8)} />
        </Box>
      </Box>

      <Typography ref={textRef} variant="caption" sx={{ mt: 1.6, fontWeight: 800, color: '#FDE7EF', letterSpacing: 0.4 }}>
        {text || 'Loading…'}
      </Typography>
    </Box>
  )
}

function Dot({ sx, color }: { sx: any; color: string }) {
  return <Box sx={{ position: 'absolute', width: 12, height: 12, borderRadius: '50%', bgcolor: color, boxShadow: `0 0 12px ${alpha(color, 0.8)}`, ...sx }} />
}

export default function PinkLoader() { return null }
