'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect, createContext, useContext } from 'react'
import {
  LayoutDashboard,
  Package,
  ClipboardList,
  ShoppingBag,
  Users,
  Layers,
  Tag,
  Star,
  RotateCcw,
  BarChart2,
  Settings,
  X,
  ExternalLink,
  ChevronDown,
  Gift,
  Image as ImageIcon,
  LogOut,
  Crown,
  Monitor,
  FileText,
} from 'lucide-react'

// ── Sidebar Context ──────────────────────────────────────────────────────────
interface SidebarContextValue {
  isOpen: boolean
  setIsOpen: (v: boolean) => void
}

const SidebarContext = createContext<SidebarContextValue>({
  isOpen: false,
  setIsOpen: () => {},
})

export function useSidebar() { return useContext(SidebarContext) }

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  return (
    <SidebarContext.Provider value={{ isOpen, setIsOpen }}>
      {children}
    </SidebarContext.Provider>
  )
}

// ── Types ─────────────────────────────────────────────────────────────────────
interface BadgeCounts {
  pending_orders: number
  low_stock: number
  pending_reviews: number
  pending_returns: number
}

interface NavItem {
  href: string
  label: string
  icon: React.ElementType
  exact?: boolean
  badge?: keyof BadgeCounts
}

interface NavGroup {
  label: string
  items: NavItem[]
}

const navGroups: NavGroup[] = [
  {
    label: 'OVERVIEW',
    items: [
      { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
    ],
  },
  {
    label: 'COMMERCE',
    items: [
      { href: '/admin/orders',     label: 'Orders',     icon: ShoppingBag,   badge: 'pending_orders' },
      { href: '/admin/products',   label: 'Products',   icon: Package },
      { href: '/admin/categories', label: 'Categories', icon: Tag },
      { href: '/admin/inventory',  label: 'Inventory',  icon: ClipboardList, badge: 'low_stock' },
      { href: '/admin/customers',  label: 'Customers',  icon: Users },
    ],
  },
  {
    label: 'CONTENT',
    items: [
      { href: '/admin/cms',         label: 'CMS',         icon: Layers },
      { href: '/admin/cms/pages',   label: 'Pages',       icon: FileText },
      { href: '/admin/collections', label: 'Collections', icon: ImageIcon },
      { href: '/admin/media',       label: 'Media',       icon: Monitor },
    ],
  },
  {
    label: 'TOOLS',
    items: [
      { href: '/admin/discounts', label: 'Discounts', icon: Gift },
      { href: '/admin/returns',   label: 'Returns',   icon: RotateCcw, badge: 'pending_returns' },
      { href: '/admin/analytics', label: 'Analytics', icon: BarChart2 },
      { href: '/admin/reviews',   label: 'Reviews',   icon: Star, badge: 'pending_reviews' },
    ],
  },
  {
    label: 'FINANCE',
    items: [
      { href: '/admin/accounting',   label: 'Accounting',   icon: BarChart2 },
      { href: '/admin/gst-invoices', label: 'GST Invoices', icon: FileText },
    ],
  },
  {
    label: 'SETTINGS',
    items: [
      { href: '/admin/settings', label: 'Settings', icon: Settings },
    ],
  },
]

// ── NavItem Component ─────────────────────────────────────────────────────────
function SidebarNavItem({
  item,
  badges,
  onClick,
}: {
  item: NavItem
  badges: BadgeCounts
  onClick?: () => void
}) {
  const pathname = usePathname()
  const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href)
  const Icon = item.icon
  const badgeCount = item.badge ? badges[item.badge] : 0

  return (
    <Link
      href={item.href}
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '40px',
        padding: isActive ? '0 12px 0 9px' : '0 12px',
        marginLeft: '8px',
        marginRight: '8px',
        marginBottom: '2px',
        borderRadius: '8px',
        fontSize: '14px',
        fontWeight: isActive ? 600 : 500,
        color: isActive ? '#1C3829' : '#5a7060',
        textDecoration: 'none',
        background: isActive ? '#eef5f1' : 'transparent',
        borderLeft: isActive ? '3px solid #1C3829' : '3px solid transparent',
        transition: 'all 150ms',
        cursor: 'pointer',
      }}
      onMouseEnter={e => {
        if (!isActive) {
          (e.currentTarget as HTMLElement).style.background = '#f5f2ec'
          ;(e.currentTarget as HTMLElement).style.color = '#1a2e1e'
        }
      }}
      onMouseLeave={e => {
        if (!isActive) {
          (e.currentTarget as HTMLElement).style.background = 'transparent'
          ;(e.currentTarget as HTMLElement).style.color = '#5a7060'
        }
      }}
    >
      <span style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
        <Icon
          size={16}
          style={{ color: isActive ? '#2d5a3d' : '#9aab9e', flexShrink: 0 }}
        />
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {item.label}
        </span>
      </span>
      {badgeCount > 0 && (
        <span style={{
          flexShrink: 0,
          fontSize: '10px',
          fontWeight: 700,
          padding: '2px 6px',
          borderRadius: '4px',
          minWidth: '18px',
          textAlign: 'center',
          background: isActive ? '#1C3829' : '#fdf0ef',
          color: isActive ? '#ffffff' : '#c0392b',
        }}>
          {badgeCount > 99 ? '99+' : badgeCount}
        </span>
      )}
    </Link>
  )
}

// ── Sidebar Content ───────────────────────────────────────────────────────────
function SidebarContent({ badges, onNavClick, role }: { badges: BadgeCounts; onNavClick?: () => void; role?: string | null }) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})
  const toggle = (label: string) => setCollapsed(prev => ({ ...prev, [label]: !prev[label] }))

  const handleLogout = async () => {
    await fetch('/api/admin/auth/logout', { method: 'POST' })
    window.location.href = '/admin/login'
  }

  return (
    <aside style={{
      width: '240px',
      flexShrink: 0,
      background: '#ffffff',
      borderRight: '1px solid #e8e2d6',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      overflowY: 'auto',
    }}>
      {/* Logo Header */}
      <div style={{
        height: '64px',
        padding: '0 20px',
        borderBottom: '1px solid #e8e2d6',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        <div>
          <p style={{ fontSize: '20px', fontWeight: 300, color: '#1a2e1e', margin: 0, lineHeight: 1 }}>
            Label<span style={{ fontWeight: 700, color: '#2d5a3d' }}>Wink</span>
          </p>
        </div>
        <span style={{
          fontSize: '10px',
          fontWeight: 700,
          textTransform: 'uppercase' as const,
          letterSpacing: '0.08em',
          color: '#1C3829',
          background: '#eef5f1',
          padding: '3px 8px',
          borderRadius: '4px',
        }}>
          Admin
        </span>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '8px 0', overflowY: 'auto' }}>
        {navGroups.map((group) => {
          const isCollapsed = collapsed[group.label]
          return (
            <div key={group.label} style={{ marginBottom: '4px' }}>
              <button
                onClick={() => toggle(group.label)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  width: '100%', padding: '6px 20px',
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: '#9aab9e',
                  fontSize: '11px', fontWeight: 600,
                  textTransform: 'uppercase' as const,
                  letterSpacing: '0.08em',
                  marginTop: '12px',
                }}
              >
                <span>{group.label}</span>
                <ChevronDown
                  size={10}
                  style={{
                    color: '#d4cebf',
                    transform: isCollapsed ? 'rotate(-90deg)' : '',
                    transition: 'transform 200ms',
                  }}
                />
              </button>

              {!isCollapsed && (
                <div style={{ marginTop: '2px' }}>
                  {group.items.map(item => (
                    <SidebarNavItem
                      key={item.href}
                      item={item}
                      badges={badges}
                      onClick={onNavClick}
                    />
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </nav>

      {/* Super Admin Panel link — shown only for superadmin */}
      {(role === 'superadmin' || role === 'super_admin') && (
        <Link
          href="/superadmin"
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            margin: '0 8px 8px', padding: '8px 12px',
            borderRadius: '8px',
            background: 'rgba(201,168,76,0.15)',
            border: '1px solid rgba(201,168,76,0.3)',
            fontSize: '13px', fontWeight: 600,
            color: '#c9a84c', textDecoration: 'none',
            transition: 'background 150ms',
          }}
        >
          <Crown size={14} />
          Super Admin Panel
        </Link>
      )}

      {/* Footer */}
      <div style={{ borderTop: '1px solid #e8e2d6', padding: '12px 8px', background: '#faf8f4', flexShrink: 0 }}>
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            height: '36px', padding: '0 12px', borderRadius: '6px',
            fontSize: '13px', color: '#9aab9e', textDecoration: 'none',
            transition: 'color 150ms, background 150ms',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#2d5a3d'; (e.currentTarget as HTMLElement).style.background = '#eef5f1'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#9aab9e'; (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
        >
          <ExternalLink size={14} />
          View Storefront
        </a>
        <button
          onClick={handleLogout}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            height: '36px', padding: '0 12px', borderRadius: '6px',
            fontSize: '13px', color: '#9aab9e',
            background: 'none', border: 'none', cursor: 'pointer', width: '100%',
            transition: 'color 150ms, background 150ms',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#c0392b'; (e.currentTarget as HTMLElement).style.background = '#fdf0ef'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#9aab9e'; (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
        >
          <LogOut size={14} />
          Logout
        </button>
      </div>
    </aside>
  )
}

// ── Main AdminSidebar ─────────────────────────────────────────────────────────
export function AdminSidebar() {
  const { isOpen, setIsOpen } = useSidebar()
  const pathname = usePathname()
  const [role, setRole] = useState<string | null>(null)
  const [badges, setBadges] = useState<BadgeCounts>({
    pending_orders: 0,
    low_stock: 0,
    pending_reviews: 0,
    pending_returns: 0,
  })

  useEffect(() => { setIsOpen(false) }, [pathname, setIsOpen])

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  useEffect(() => {
    // Fetch role
    fetch('/api/admin/profile').then(r => r.ok ? r.json() : null).then(data => {
      if (data?.role) setRole(data.role)
    }).catch(() => {})
  }, [])

  useEffect(() => {
    const fetch_badges = async () => {
      try {
        const res = await fetch('/api/admin/badge-counts', { cache: 'no-store' })
        if (res.ok) setBadges(await res.json())
      } catch {}
    }
    fetch_badges()
    const interval = setInterval(fetch_badges, 60_000)
    return () => clearInterval(interval)
  }, [])

  return (
    <>
      {/* Desktop */}
      <div className="hidden lg:flex">
        <SidebarContent badges={badges} role={role} />
      </div>

      {/* Mobile drawer */}
      {isOpen && (
        <div className="lg:hidden" style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex' }}>
          <div
            style={{ position: 'absolute', inset: 0, background: 'rgba(26,46,30,0.4)', backdropFilter: 'blur(4px)' }}
            onClick={() => setIsOpen(false)}
          />
          <div style={{ position: 'relative', display: 'flex' }}>
            <SidebarContent badges={badges} role={role} onNavClick={() => setIsOpen(false)} />
            <button
              onClick={() => setIsOpen(false)}
              style={{
                position: 'absolute', top: '16px', right: '-44px',
                background: '#ffffff', border: '1px solid #e8e2d6',
                borderRadius: '50%', padding: '8px', cursor: 'pointer', color: '#5a7060',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(26,46,30,0.12)',
              }}
              aria-label="Close menu"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}
    </>
  )
}
