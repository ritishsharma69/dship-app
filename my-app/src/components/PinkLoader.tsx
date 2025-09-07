import { createRoot, type Root } from 'react-dom/client'
import { Box } from '@mui/material'

/**
 * Minimal pink + dark loader (centered, simple)
 * No card, only a subtle circular ring with a few orbits.
 * Public API preserved: showPinkLoader(text?), hidePinkLoader()
 */

declare global { interface Window { __pinkLoaderCount?: number } }

let root: Root | null = null
let containerEl: HTMLDivElement | null = null
let currentText = 'Loading...'
let version = 0 // increment on mount; used to avoid racing unmounts

function mount(text?: string) {
  if (!containerEl) {
    containerEl = document.createElement('div')
    containerEl.id = 'mui-gsap-loader'
    Object.assign(containerEl.style, { position: 'fixed', inset: '0', zIndex: '2000' })
    document.body.appendChild(containerEl)
  }
  if (!root) root = createRoot(containerEl)
  currentText = text || currentText
  version++
  root.render(<Overlay text={currentText} />)
}

function unmount() {
  // Schedule unmount outside the current React commit to avoid
  // "Attempted to synchronously unmount a root while React was already rendering".
  const scheduledVersion = version
  setTimeout(() => {
    // If a new show() ran after we scheduled this unmount, skip.
    if (scheduledVersion !== version) return
    // Also ensure the ref-count is still 0.
    if ((window.__pinkLoaderCount ?? 0) > 0) return
    try {
      if (root) root.unmount()
      if (containerEl?.parentElement) containerEl.parentElement.removeChild(containerEl)
    } finally {
      root = null
      containerEl = null
    }
  }, 0)
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
  // Brand loader: keep page visible; only subtle blur, no colored background. Spinner ring is purple.
  const PINK = '#FF2A6D'
  const GOLD = '#C7A100' // for bag gradient only
  const PURPLE = '#6D28D9'
  const TRACK = 'rgba(124,58,237,0.22)'
  const OVERLAY_BG = 'rgba(0,0,0,0.04)'

  const size = 96
  const thickness = 6

  return (
    <Box sx={{
      position: 'fixed', inset: 0,
      display: 'grid', placeItems: 'center',
      background: OVERLAY_BG, // keep page visible under
      backdropFilter: 'blur(1.5px) saturate(110%)',
      zIndex: 2000
    }}>
      <div style={{ display:'grid', placeItems:'center', gap: 12 }}>
        <div style={{ position: 'relative', width: size, height: size }}>
          {/* Track ring */}
          <span style={{ position:'absolute', inset: 0, borderRadius: 999, border: `${thickness}px solid ${TRACK}` }} />
          {/* Rotating arc (purple) using conic-gradient and mask to create stroke */}
          <span style={{
            position:'absolute', inset: 0, borderRadius: 999,
            background: `conic-gradient(${PURPLE} 0 90deg, rgba(0,0,0,0) 90deg)`,
            WebkitMask: `radial-gradient(farthest-side, transparent calc(100% - ${thickness}px), #000 0)` as any,
            mask: `radial-gradient(farthest-side, transparent calc(100% - ${thickness}px), #000 0)` as any,
            animation: 'spin 1.05s linear infinite'
          }} />
          {/* Center bag icon */}
          <div style={{ position:'absolute', inset: thickness + 8, display:'grid', placeItems:'center' }}>
            <BagIcon pink={PINK} gold={GOLD} />
          </div>
        </div>
        <div style={{ fontWeight: 800, color: '#4C1D95', letterSpacing: 0.3 }}>{text || 'Loading...'}</div>
      </div>
    </Box>
  )
}

function BagIcon({ pink, gold }: { pink: string; gold: string }) {
  // Simple shopping bag with smile; gradient from pink to dark yellow
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bagGrad" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={pink} />
          <stop offset="1" stopColor={gold} />
        </linearGradient>
      </defs>
      {/* Bag body */}
      <rect x="12" y="18" width="40" height="36" rx="6" fill="url(#bagGrad)" />
      {/* Handles */}
      <path d="M20 22c0-6 4-10 12-10s12 4 12 10" stroke="#fff" strokeWidth="3" strokeLinecap="round" fill="none" />
      {/* Eyes */}
      <circle cx="28" cy="36" r="2" fill="#fff" />
      <circle cx="40" cy="36" r="2" fill="#fff" />
      {/* Smile */}
      <path d="M28 42c2 2 6 2 8 0" stroke="#fff" strokeWidth="3" strokeLinecap="round" fill="none" />
    </svg>
  )
}

export default function PinkLoader() { return null }
