'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut, Menu, ExternalLink, Bell, ShoppingBag, Star, RotateCcw, Check } from 'lucide-react'
import { useSidebar } from '@/components/admin/AdminSidebar'
import type { AdminNotification } from '@/types'

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

const NOTIF_ICONS: Record<string, React.ElementType> = {
  new_order:      ShoppingBag,
  low_stock:      Bell,
  new_review:     Star,
  return_request: RotateCcw,
}

const NOTIF_COLORS: Record<string, string> = {
  new_order:      'bg-blue-100 text-blue-600',
  low_stock:      'bg-amber-100 text-amber-600',
  new_review:     'bg-purple-100 text-purple-600',
  return_request: 'bg-orange-100 text-orange-600',
}

export function AdminTopBar() {
  const router = useRouter()
  const { setIsOpen } = useSidebar()
  const [notifications, setNotifications] = useState<AdminNotification[]>([])
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const unread = notifications.filter(n => !n.is_read).length

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/admin/notifications')
      if (res.ok) {
        const data: AdminNotification[] = await res.json()
        if (Array.isArray(data)) setNotifications(data)
      }
    } catch {
      // fail silently
    }
  }

  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 30_000)
    return () => clearInterval(interval)
  }, [])

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const markRead = async (id?: string) => {
    const body = id ? { id } : { mark_all: true }
    await fetch('/api/admin/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    fetchNotifications()
  }

  const handleNotifClick = (notif: AdminNotification) => {
    markRead(notif.id)
    setOpen(false)
    const orderId = (notif.data as Record<string, string> | null)?.order_id
    if (orderId) router.push(`/admin/orders/${orderId}`)
  }

  const handleLogout = async () => {
    await fetch('/api/admin/auth/logout', { method: 'POST' })
    router.push('/admin/login')
    router.refresh()
  }

  return (
    <header className="h-[56px] bg-[#1b3a34] px-5 flex items-center justify-between flex-shrink-0 border-b border-white/[0.08]">
      {/* Left: hamburger (mobile) */}
      <button
        onClick={() => setIsOpen(true)}
        className="lg:hidden text-white/70 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/10"
        aria-label="Open menu"
      >
        <Menu size={20} />
      </button>
      <div className="hidden lg:block" />

      {/* Right: actions */}
      <div className="flex items-center gap-2">

        {/* Notification Bell */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setOpen(o => !o)}
            className="relative text-white/70 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/10"
            aria-label="Notifications"
          >
            <Bell size={18} />
            {unread > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </button>

          {open && (
            <div className="absolute right-0 mt-2 w-[320px] bg-white rounded-xl shadow-2xl border border-gray-100 z-50 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <span className="font-semibold text-sm text-[#1a1a1a]">Notifications</span>
                {unread > 0 && (
                  <button
                    onClick={() => markRead()}
                    className="text-xs text-[#1b3a34] hover:underline font-medium flex items-center gap-1"
                  >
                    <Check size={11} /> Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-[340px] overflow-y-auto divide-y divide-gray-50">
                {notifications.length === 0 ? (
                  <div className="text-sm text-gray-400 text-center py-10 flex flex-col items-center gap-2">
                    <Bell size={24} className="text-gray-200" />
                    <p>No notifications</p>
                  </div>
                ) : (
                  notifications.slice(0, 12).map(notif => {
                    const Icon = NOTIF_ICONS[notif.type ?? ''] ?? Bell
                    const colorClass = NOTIF_COLORS[notif.type ?? ''] ?? 'bg-gray-100 text-gray-400'
                    return (
                      <button
                        key={notif.id}
                        onClick={() => handleNotifClick(notif)}
                        className={`w-full text-left flex gap-3 px-4 py-3 hover:bg-gray-50 transition-colors ${!notif.is_read ? 'bg-blue-50/50' : ''}`}
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${colorClass}`}>
                          <Icon size={14} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-[#1a1a1a] truncate">{notif.title}</p>
                          <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{notif.body}</p>
                          <p className="text-[10px] text-gray-400 mt-1">{timeAgo(notif.created_at)}</p>
                        </div>
                        {!notif.is_read && (
                          <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-2" />
                        )}
                      </button>
                    )
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* View site */}
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden sm:flex items-center gap-1.5 text-white/70 hover:text-white border border-white/20 hover:border-white/40 rounded-lg px-3 py-1.5 text-xs font-medium transition-all"
        >
          <ExternalLink size={13} />
          Store
        </a>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 text-white/60 hover:text-white border border-white/20 hover:border-white/40 rounded-lg px-3 py-1.5 text-xs font-medium transition-all"
          aria-label="Logout"
        >
          <LogOut size={13} />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  )
}
