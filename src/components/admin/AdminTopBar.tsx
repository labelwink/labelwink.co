'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut, Menu, ExternalLink, Bell, ShoppingBag, Star, RotateCcw, Check, Package } from 'lucide-react'
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
  low_stock:      Package,
  new_review:     Star,
  return_request: RotateCcw,
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
        const json = await res.json()
        const items = Array.isArray(json) ? json : (json.notifications ?? [])
        setNotifications(items)
      }
    } catch {}
  }

  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 30_000)
    return () => clearInterval(interval)
  }, [])

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
    const d = (notif.data as Record<string, string> | null) ?? {}
    if (notif.type === 'low_stock')      { router.push('/admin/inventory'); return }
    if (notif.type === 'new_review')     { router.push('/admin/reviews');   return }
    if (notif.type === 'return_request') { router.push('/admin/returns');   return }
    if (d.order_id) router.push(`/admin/orders/${d.order_id}`)
  }

  const handleLogout = async () => {
    await fetch('/api/admin/auth/logout', { method: 'POST' })
    router.push('/admin/login')
    router.refresh()
  }

  return (
    <header style={{
      height: '64px',
      background: '#ffffff',
      borderBottom: '1px solid #e8e2d6',
      padding: '0 24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexShrink: 0,
      position: 'sticky',
      top: 0,
      zIndex: 30,
    }}>
      {/* Left: hamburger (mobile) */}
      <button
        onClick={() => setIsOpen(true)}
        className="lg:hidden"
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: '#5a7060', padding: '8px', borderRadius: '8px',
          display: 'flex', alignItems: 'center',
          transition: 'color 150ms, background 150ms',
        }}
        aria-label="Open menu"
      >
        <Menu size={20} />
      </button>
      <div className="hidden lg:block" />

      {/* Right: actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>

        {/* Notification Bell */}
        <div style={{ position: 'relative' }} ref={dropdownRef}>
          <button
            onClick={() => setOpen(o => !o)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: '#5a7060', padding: '8px', borderRadius: '8px',
              position: 'relative', display: 'flex', alignItems: 'center',
              transition: 'color 150ms, background 150ms',
            }}
            aria-label="Notifications"
          >
            <Bell size={18} />
            {unread > 0 && (
              <span style={{
                position: 'absolute', top: '4px', right: '4px',
                background: '#c0392b', color: '#ffffff',
                fontSize: '9px', fontWeight: 700,
                width: '16px', height: '16px', borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </button>

          {open && (
            <div style={{
              position: 'absolute', right: 0, top: '100%', marginTop: '8px',
              width: '320px', background: '#ffffff',
              border: '1px solid #e8e2d6', borderRadius: '12px',
              boxShadow: '0 8px 24px rgba(26,46,30,0.12)',
              zIndex: 50, overflow: 'hidden',
            }}>
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '12px 16px', borderBottom: '1px solid #f5f2ec',
              }}>
                <span style={{ fontSize: '14px', fontWeight: 600, color: '#1a2e1e' }}>Notifications</span>
                {unread > 0 && (
                  <button
                    onClick={() => markRead()}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      fontSize: '12px', color: '#1C3829', fontWeight: 500,
                      display: 'flex', alignItems: 'center', gap: '4px',
                    }}
                  >
                    <Check size={11} /> Mark all read
                  </button>
                )}
              </div>

              <div style={{ maxHeight: '340px', overflowY: 'auto' }}>
                {notifications.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 16px', color: '#9aab9e', fontSize: '14px' }}>
                    <Bell size={24} style={{ color: '#d4cebf', margin: '0 auto 8px' }} />
                    <p>No notifications</p>
                  </div>
                ) : (
                  notifications.slice(0, 12).map(notif => {
                    const Icon = NOTIF_ICONS[notif.type ?? ''] ?? Bell
                    return (
                      <button
                        key={notif.id}
                        onClick={() => handleNotifClick(notif)}
                        style={{
                          width: '100%', textAlign: 'left',
                          display: 'flex', gap: '12px',
                          padding: '12px 16px',
                          background: notif.is_read ? 'transparent' : '#eef5f1',
                          border: 'none', borderBottom: '1px solid #f5f2ec',
                          cursor: 'pointer', transition: 'background 150ms',
                        }}
                      >
                        <div style={{
                          width: '32px', height: '32px', borderRadius: '8px', flexShrink: 0,
                          background: '#eef5f1', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: '#1C3829',
                        }}>
                          <Icon size={14} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: '13px', fontWeight: 600, color: '#1a2e1e', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {notif.title}
                          </p>
                          <p style={{ fontSize: '12px', color: '#9aab9e', marginTop: '2px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as any, overflow: 'hidden' }}>
                            {notif.body}
                          </p>
                          <p style={{ fontSize: '10px', color: '#d4cebf', marginTop: '4px' }}>
                            {timeAgo(notif.created_at)}
                          </p>
                        </div>
                        {!notif.is_read && (
                          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#1C3829', flexShrink: 0, marginTop: '8px' }} />
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
          className="hidden sm:flex"
          style={{
            alignItems: 'center', gap: '6px',
            color: '#5a7060', border: '1px solid #e8e2d6',
            borderRadius: '8px', padding: '6px 12px',
            fontSize: '13px', fontWeight: 500, textDecoration: 'none',
            transition: 'color 150ms, border-color 150ms, background 150ms',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#2d5a3d'; (e.currentTarget as HTMLElement).style.borderColor = '#2d5a3d'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#5a7060'; (e.currentTarget as HTMLElement).style.borderColor = '#e8e2d6'; }}
        >
          <ExternalLink size={13} />
          Store
        </a>

        {/* Logout */}
        <button
          onClick={handleLogout}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            color: '#5a7060', border: '1px solid #e8e2d6',
            borderRadius: '8px', padding: '6px 12px',
            fontSize: '13px', fontWeight: 500,
            background: 'none', cursor: 'pointer',
            transition: 'color 150ms, border-color 150ms',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#c0392b'; (e.currentTarget as HTMLElement).style.borderColor = '#f5c6c2'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#5a7060'; (e.currentTarget as HTMLElement).style.borderColor = '#e8e2d6'; }}
          aria-label="Logout"
        >
          <LogOut size={13} />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  )
}
