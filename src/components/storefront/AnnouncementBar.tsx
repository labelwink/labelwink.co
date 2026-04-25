'use client'

import { useState, useEffect } from 'react'

interface AnnouncementBarProps {
  text: string
  color: string
  enabled: boolean
}

export function AnnouncementBar({ text, color, enabled }: AnnouncementBarProps) {
  const [dismissed, setDismissed] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    if (typeof window !== 'undefined' && sessionStorage.getItem('bar_dismissed') === '1') {
      setDismissed(true)
    }
  }, [])

  if (!enabled || !text || dismissed) return null
  if (!mounted) return null

  const dismiss = () => {
    sessionStorage.setItem('bar_dismissed', '1')
    setDismissed(true)
  }

  return (
    <div
      className="h-10 flex items-center justify-center relative text-white text-sm px-10"
      style={{ backgroundColor: color || '#1b3a34' }}
    >
      <span>{text}</span>
      <button
        onClick={dismiss}
        className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white transition-colors text-lg leading-none"
        aria-label="Dismiss announcement"
      >
        ✕
      </button>
    </div>
  )
}
