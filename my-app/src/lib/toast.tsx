import React, { createContext, useContext, useState, useCallback } from 'react'

interface Toast { id: number; text: string }

const ToastCtx = createContext<{ push: (text: string) => void } | null>(null)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const push = useCallback((text: string) => {
    const id = Date.now() + Math.random()
    setToasts((prev) => [...prev, { id, text }])
    setTimeout(() => setToasts((prev) => prev.filter(t => t.id !== id)), 2200)
  }, [])

  const PINK = '#FF3F6C'

  return (
    <ToastCtx.Provider value={{ push }}>
      {children}
      {/* Toast styles */}
      <style>
        {`
        @keyframes toast-in-out {
          0% { transform: translateY(24px) scale(0.98); opacity: 0; }
          12% { transform: translateY(0) scale(1); opacity: 1; }
          80% { opacity: 1; }
          100% { transform: translateY(8px); opacity: 0; }
        }
        `}
      </style>
      {/* Bottom-center stack */}
      <div style={{ position: 'fixed', bottom: 18, left: '50%', transform: 'translateX(-50%)', display: 'grid', gap: 10, zIndex: 9999, pointerEvents: 'none' as const }}>
        {toasts.map(t => (
          <div
            key={t.id}
            style={{
              padding: '12px 16px',
              background: PINK,
              color: '#FFFFFF',
              borderRadius: 999,
              boxShadow: '0 10px 28px rgba(255,63,108,0.35), 0 4px 10px rgba(0,0,0,0.18)',
              fontWeight: 800,
              letterSpacing: 0.2,
              animation: 'toast-in-out 2.2s ease both',
              pointerEvents: 'none',
            }}
          >
            {t.text}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastCtx)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}

