import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { RouterProvider } from './lib/router'
import { CartProvider } from './lib/cart'
import { ToastProvider } from './lib/toast'
import { ProductsProvider } from './lib/products'
import { ThemeProvider, CssBaseline } from '@mui/material'
import theme from './theme'
import { showPinkLoader, hidePinkLoader } from './components/PinkLoader'

// Install global fetch loader SYNCHRONOUSLY to avoid race conditions
// Shows loader only for slow requests (>500ms) and handles parallel requests properly
let activeRequests = 0
let loaderTimer: number | null = null
const origFetch = window.fetch

window.fetch = async (input: any, init?: any) => {
  // Skip loader for ping, analytics, and chat requests (chatbot has its own loader)
  const url = typeof input === 'string' ? input : (input as Request)?.url || ''
  const skipLoader = url.includes('/api/ping') || url.includes('collect?') || url.includes('analytics') || url.includes('/api/chat')

  if (!skipLoader) {
    activeRequests++
    if (activeRequests === 1 && !loaderTimer) {
      loaderTimer = window.setTimeout(() => {
        if (activeRequests > 0) showPinkLoader('Loading...')
      }, 500) // Show loader only if request takes >500ms
    }
  }

  try {
    const res = await origFetch(input, init)
    return res
  } finally {
    if (!skipLoader) {
      activeRequests = Math.max(0, activeRequests - 1)
      if (activeRequests === 0) {
        if (loaderTimer) {
          window.clearTimeout(loaderTimer)
          loaderTimer = null
        }
        hidePinkLoader()
      }
    }
  }
}

// Pre-warm backend on Render free tier (cold start takes 30-60s)
fetch('/api/ping').catch(() => {})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <RouterProvider>
        <ProductsProvider>
          <CartProvider>
            <ToastProvider>
              <App />
            </ToastProvider>
          </CartProvider>
        </ProductsProvider>
      </RouterProvider>
    </ThemeProvider>
  </StrictMode>,
)
