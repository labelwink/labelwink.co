'use client'

import React, { ReactNode } from 'react'

interface Props {
  children?: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false
  }

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ErrorBoundary caught error]:', error, errorInfo)
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="p-6 border border-red-900/20 bg-red-950/5 text-center rounded-none">
          <h3 className="text-[#c9a84c] font-bold uppercase tracking-widest text-sm mb-2">
            Something went wrong
          </h3>
          <p className="text-[#9aab9e] text-xs mb-4">
            This section failed to load correctly.
          </p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="text-[10px] uppercase tracking-[0.2em] font-black border border-[#c9a84c] text-[#c9a84c] px-4 py-2 hover:bg-[#c9a84c] hover:text-black transition-all"
          >
            Retry Section
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
