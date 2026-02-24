import React from 'react'

interface State { hasError: boolean; error: Error | null }

export default class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null })
  }

  handleReload = () => {
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      const isChunkError =
        this.state.error?.message?.includes('Loading chunk') ||
        this.state.error?.message?.includes('dynamically imported module') ||
        this.state.error?.message?.includes('Failed to fetch')

      return (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          minHeight: '60vh', padding: 32, textAlign: 'center', gap: 16
        }}>
          <div style={{ fontSize: 48 }}>{isChunkError ? '📡' : '⚠️'}</div>
          <h2 style={{ margin: 0, fontSize: 20, color: '#1f2937' }}>
            {isChunkError ? 'Connection issue' : 'Something went wrong'}
          </h2>
          <p style={{ margin: 0, color: '#6b7280', fontSize: 14, maxWidth: 360 }}>
            {isChunkError
              ? 'Page load failed — please check your internet and try again.'
              : 'An unexpected error occurred. Please try again.'}
          </p>
          <div style={{ display: 'flex', gap: 12 }}>
            <button
              onClick={this.handleRetry}
              style={{
                padding: '10px 24px', borderRadius: 10, border: 'none',
                background: '#6D28D9', color: '#fff', fontWeight: 700,
                cursor: 'pointer', fontSize: 14
              }}
            >
              Try Again
            </button>
            <button
              onClick={this.handleReload}
              style={{
                padding: '10px 24px', borderRadius: 10, border: '1px solid #d1d5db',
                background: '#fff', color: '#374151', fontWeight: 600,
                cursor: 'pointer', fontSize: 14
              }}
            >
              Reload Page
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

