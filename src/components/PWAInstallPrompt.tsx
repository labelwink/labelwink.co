'use client'

import { useState, useEffect, useRef } from 'react'
import { X } from 'lucide-react'

export function PWAInstallPrompt() {
  const [show, setShow] = useState(false)
  const deferredPromptRef = useRef<any>(null)

  useEffect(() => {
    // Don't show if already dismissed this session
    if ((window as any).__pwaDismissed) return
    // Don't show if already dismissed persistently
    if (localStorage.getItem('pwa_dismissed') === 'true') return

    // Don't show if already installed (display-mode: standalone)
    if (window.matchMedia('(display-mode: standalone)').matches) return

    const handler = (e: Event) => {
      e.preventDefault()
      deferredPromptRef.current = e
      setShow(true)
    }

    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (!deferredPromptRef.current) return
    deferredPromptRef.current.prompt()
    const { outcome } = await deferredPromptRef.current.userChoice
    if (outcome === 'accepted') {
      setShow(false)
    }
    deferredPromptRef.current = null
  }

  const handleDismiss = () => {
    setShow(false)
    ;(window as any).__pwaDismissed = true
    localStorage.setItem('pwa_dismissed', 'true')
  }

  if (!show) return null

  return (
    <div style={{
      position: 'fixed',
      bottom: '80px',
      left: '16px',
      zIndex: 40,
      maxWidth: '280px',
      borderRadius: '12px',
      background: '#1C3829',
      color: 'white',
      boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
      padding: '12px 16px',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
    }}>
      <span className="text-xl flex-shrink-0">📱</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold leading-tight">Add LabelWink</p>
        <p style={{ fontSize: '11px', opacity: 0.7, marginTop: '2px' }}>Quick access, offline support</p>
      </div>
      <button
        type="button"
        onClick={handleInstall}
        className="bg-[#C9A84C] text-[#1C3829] text-xs font-semibold px-3 py-1.5 rounded-md hover:bg-[#D4B76A] flex-shrink-0 transition-colors"
      >
        Install
      </button>
      <button
        type="button"
        onClick={handleDismiss}
        className="text-white/60 hover:text-white ml-auto flex-shrink-0 transition-colors"
        aria-label="Dismiss"
      >
        <X size={16} />
      </button>
    </div>
  )
}

/**
 * Client component to register the service worker.
 * Rendered once in the storefront layout.
 */
export function ServiceWorkerRegistration() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch((err) => {
        console.error('SW registration failed:', err)
      })
    }
  }, [])

  return null
}
