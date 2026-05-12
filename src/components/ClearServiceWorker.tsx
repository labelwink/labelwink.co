'use client'
import { useEffect } from 'react'

/**
 * One-time cleanup: unregisters any previously installed service workers
 * and clears their caches. Renders nothing to the DOM.
 * Remove this component after 1 week in production once all users
 * have had the old SW cleaned up.
 */
export default function ClearServiceWorker() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .getRegistrations()
        .then(registrations => {
          registrations.forEach(r => r.unregister())
        })
        .catch(() => {})
    }
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => caches.delete(name))
      }).catch(() => {})
    }
  }, [])

  return null
}
