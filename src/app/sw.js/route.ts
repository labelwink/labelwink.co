import { NextResponse } from 'next/server'

/**
 * GET /sw.js
 * Returns a minimal self-unregistering service worker.
 * Browsers that cached a reference to /sw.js will install this
 * empty SW, which immediately unregisters itself — stopping
 * the 404 log noise after 1-2 page loads.
 */
export async function GET() {
  return new NextResponse(
    `// LabelWink — Service worker disabled
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', () => {
  self.registration.unregister()
  self.clients.claim()
})`,
    {
      status: 200,
      headers: {
        'Content-Type': 'application/javascript; charset=utf-8',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Service-Worker-Allowed': '/',
      },
    }
  )
}
