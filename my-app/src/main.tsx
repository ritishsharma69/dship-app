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

// Pre-warm backend on Render free tier (cold start takes 30-60s)
fetch('/api/ping').catch(() => {})

// Install global fetch loader: show overlay on slow network calls
import('./lib/loader').then(({ show, hide }) => {
  const orig = window.fetch
  window.fetch = async (input: any, init?: any) => {
    let timer: number | null = window.setTimeout(() => show(''), 450)
    try {
      const res = await orig(input, init)
      return res
    } finally {
      if (timer) window.clearTimeout(timer)
      hide()
    }
  }
})

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
