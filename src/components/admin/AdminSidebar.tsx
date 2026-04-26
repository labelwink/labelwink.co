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
  FileText,
  Layers,
  Tag,
  Star,
  RotateCcw,
  Megaphone,
  BarChart2,
  Settings,
  X,
  ExternalLink,
  ChevronDown,
  Gift,
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

export function useSidebar() {
  return useContext(SidebarContext)
}

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  return (
    <SidebarContext.Provider value={{ isOpen, setIsOpen }}>
      {children}
    </SidebarContext.Provider>
  )
}

// ── Badge Counts (live from API) ─────────────────────────────────────────────
interface BadgeCounts {
  pending_orders: number
  low_stock: number
  pending_reviews: number
  pending_returns: number
}

// ── Nav Structure ─────────────────────────────────────────────────────────────
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
    label: 'Storefront',
    items: [
      { href: '/admin',            label: 'Dashboard',   icon: LayoutDashboard, exact: true },
      { href: '/admin/analytics',  label: 'Analytics',   icon: BarChart2 },
    ],
  },
  {
    label: 'Catalogue',
    items: [
      { href: '/admin/products',    label: 'Products',    icon: Package },
      { href: '/admin/inventory',   label: 'Inventory',   icon: ClipboardList, badge: 'low_stock' },
      { href: '/admin/collections', label: 'Collections', icon: Layers },
      { href: '/admin/categories',  label: 'Categories',  icon: Tag },
    ],
  },
  {
    label: 'Commerce',
    items: [
      { href: '/admin/orders',    label: 'Orders',    icon: ShoppingBag,  badge: 'pending_orders' },
      { href: '/admin/returns',   label: 'Returns',   icon: RotateCcw,    badge: 'pending_returns' },
      { href: '/admin/customers', label: 'Customers', icon: Users },
      { href: '/admin/reviews',   label: 'Reviews',   icon: Star,         badge: 'pending_reviews' },
      { href: '/admin/discounts', label: 'Discounts', icon: Gift },
    ],
  },
  {
    label: 'Content',
    items: [
      { href: '/admin/cms',     label: 'CMS & Banners', icon: Megaphone },
      { href: '/admin/pages',   label: 'Pages',          icon: FileText },
    ],
  },
  {
    label: 'System',
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
      className={`
        group flex items-center justify-between gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium
        transition-all duration-150 w-full
        ${isActive
          ? 'bg-[#c9a84c]/15 text-[#e8c97a] border-l-2 border-[#c9a84c] pl-[10px]'
          : 'text-white/55 hover:text-white/90 hover:bg-white/6 border-l-2 border-transparent pl-[10px]'
        }
      `}
    >
      <span className="flex items-center gap-2.5 min-w-0">
        <Icon
          size={15}
          strokeWidth={isActive ? 2.5 : 1.8}
          className={isActive ? 'text-[#c9a84c]' : 'text-white/40 group-hover:text-white/70'}
        />
        <span className="truncate">{item.label}</span>
      </span>
      {badgeCount > 0 && (
        <span className={`
          flex-shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center
          ${isActive ? 'bg-[#c9a84c] text-[#1b3a34]' : 'bg-red-500/80 text-white'}
        `}>
          {badgeCount > 99 ? '99+' : badgeCount}
        </span>
      )}
    </Link>
  )
}

// ── Sidebar Content ───────────────────────────────────────────────────────────
function SidebarContent({ badges, onNavClick }: { badges: BadgeCounts; onNavClick?: () => void }) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})

  const toggleGroup = (label: string) => {
    setCollapsed(prev => ({ ...prev, [label]: !prev[label] }))
  }

  return (
    <aside className="w-[230px] flex-shrink-0 bg-[#162f2a] text-white flex flex-col h-full overflow-y-auto border-r border-white/[0.06]">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/[0.08]">
        <p
          className="font-bold text-base tracking-[0.2em] bg-gradient-to-r from-[#e8c97a] to-[#b8862a] bg-clip-text text-transparent"
          style={{ fontFamily: 'Georgia, serif' }}
        >
          LABEL WINK
        </p>
        <p className="text-[#f5ede0]/35 text-[10px] mt-0.5 tracking-wider">Admin Dashboard</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2.5 py-3 space-y-1 overflow-y-auto">
        {navGroups.map((group) => {
          const isCollapsed = collapsed[group.label]
          const hasActiveBadge = group.items.some(
            item => item.badge && badges[item.badge] > 0
          )

          return (
            <div key={group.label}>
              {/* Group header */}
              <button
                onClick={() => toggleGroup(group.label)}
                className="w-full flex items-center justify-between px-2 py-1.5 mb-0.5 group"
              >
                <span className="text-[10px] font-semibold tracking-[0.12em] text-white/30 group-hover:text-white/50 transition-colors uppercase">
                  {group.label}
                </span>
                <span className="flex items-center gap-1.5">
                  {hasActiveBadge && isCollapsed && (
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
                  )}
                  <ChevronDown
                    size={11}
                    className={`text-white/25 transition-transform duration-200 ${isCollapsed ? '-rotate-90' : ''}`}
                  />
                </span>
              </button>

              {/* Group items */}
              {!isCollapsed && (
                <div className="space-y-0.5 mb-2">
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

      {/* Footer */}
      <div className="px-2.5 py-3 border-t border-white/[0.08]">
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] text-white/40 hover:text-white/80 hover:bg-white/6 transition-all"
        >
          <ExternalLink size={14} />
          View Storefront
        </a>
      </div>
    </aside>
  )
}

// ── Main AdminSidebar ─────────────────────────────────────────────────────────
export function AdminSidebar() {
  const { isOpen, setIsOpen } = useSidebar()
  const pathname = usePathname()
  const [badges, setBadges] = useState<BadgeCounts>({
    pending_orders: 0,
    low_stock: 0,
    pending_reviews: 0,
    pending_returns: 0,
  })

  // Close on route change
  useEffect(() => {
    setIsOpen(false)
  }, [pathname, setIsOpen])

  // Lock body scroll when mobile drawer open
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  // Fetch badge counts
  useEffect(() => {
    const fetchBadges = async () => {
      try {
        const res = await fetch('/api/admin/badge-counts', { cache: 'no-store' })
        if (res.ok) {
          const data = await res.json()
          setBadges(data)
        }
      } catch {
        // fail silently — badges are non-critical
      }
    }

    fetchBadges()
    const interval = setInterval(fetchBadges, 60_000)  // refresh every 60s
    return () => clearInterval(interval)
  }, [])

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden lg:flex">
        <SidebarContent badges={badges} />
      </div>

      {/* Mobile drawer */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />
          {/* Drawer */}
          <div className="relative flex">
            <SidebarContent badges={badges} onNavClick={() => setIsOpen(false)} />
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-[-44px] text-white bg-[#162f2a] rounded-full p-2 border border-white/20"
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
