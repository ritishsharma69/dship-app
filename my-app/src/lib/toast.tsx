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
  return (
    <ToastCtx.Provider value={{ push }}>
      {children}
      <div style={{ position: 'fixed', top: 16, right: 16, display: 'grid', gap: 8, zIndex: 9999 }}>
        {toasts.map(t => (
          <div key={t.id} className="card" style={{ padding: '10px 12px', background: '#111827', color: '#fff', borderRadius: 10 }}>
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

