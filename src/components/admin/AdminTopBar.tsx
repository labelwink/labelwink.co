'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut, Menu, ExternalLink, Bell, ShoppingBag, Check } from 'lucide-react'
import { useSidebar } from '@/components/admin/AdminSidebar'

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

const NOTIF_ICON: Record<string, any> = {
  new_order: ShoppingBag,
  low_stock: Bell,
  new_review: Bell,
}

export function AdminTopBar() {
  const router = useRouter()
  const { setIsOpen } = useSidebar()
  const [notifications, setNotifications] = useState<any[]>([])
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const unread = notifications.filter(n => !n.read).length

  const fetchNotifications = () => {
    fetch('/api/admin/notifications')
      .then(r => r.ok ? r.json() : [])
      .then(data => Array.isArray(data) && setNotifications(data))
      .catch(() => {})
  }

  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 30000)
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

  const handleNotifClick = (notif: any) => {
    markRead(notif.id)
    setOpen(false)
    const orderId = notif.data?.order_id
    if (orderId) router.push(`/admin/orders/${orderId}`)
  }

  const handleLogout = async () => {
    await fetch('/api/admin/auth/logout', { method: 'POST' })
    router.push('/admin/login')
    router.refresh()
  }

  return (
    <header className="h-[60px] bg-[#1b3a34] px-6 flex items-center justify-between flex-shrink-0">
      {/* Left: hamburger (mobile) */}
      <button
        onClick={() => setIsOpen(true)}
        className="lg:hidden text-white/70 hover:text-white transition-colors p-1"
        aria-label="Open menu"
      >
        <Menu size={22} />
      </button>
      <div className="hidden lg:block" />

      {/* Right: actions */}
      <div className="flex items-center gap-3">
        {/* Notification Bell */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setOpen(o => !o)}
            className="relative text-white/70 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/10"
            aria-label="Notifications"
          >
            <Bell size={20} />
            {unread > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </button>

          {open && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-100 z-50 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <span className="font-semibold text-sm text-[#1a1a1a]">Notifications</span>
                {unread > 0 && (
                  <button onClick={() => markRead()} className="text-xs text-[#1b3a34] hover:underline font-medium flex items-center gap-1">
                    <Check size={12} /> Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
                {notifications.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-8">No notifications</p>
                ) : (
                  notifications.slice(0, 10).map(notif => {
                    const Icon = NOTIF_ICON[notif.type] || Bell
                    return (
                      <button
                        key={notif.id}
                        onClick={() => handleNotifClick(notif)}
                        className={`w-full text-left flex gap-3 px-4 py-3 hover:bg-gray-50 transition-colors ${!notif.read ? 'bg-blue-50/60' : ''}`}
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${!notif.read ? 'bg-[#1b3a34]' : 'bg-gray-100'}`}>
                          <Icon size={14} className={!notif.read ? 'text-white' : 'text-gray-400'} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-[#1a1a1a] truncate">{notif.title}</p>
                          <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{notif.body}</p>
                          <p className="text-[10px] text-gray-400 mt-1">{timeAgo(notif.created_at)}</p>
                        </div>
                        {!notif.read && <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-2" />}
                      </button>
                    )
                  })
                )}
              </div>
            </div>
          )}
        </div>

        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-white border border-white/30 hover:border-white/60 rounded-xl px-4 py-1.5 text-sm font-medium transition-colors"
        >
          View Live Site <ExternalLink size={14} />
        </a>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-white/70 hover:text-white border border-white/20 hover:border-white/50 rounded-xl px-3 py-1.5 text-sm transition-colors"
          aria-label="Logout"
        >
          <LogOut size={16} />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  )
}
