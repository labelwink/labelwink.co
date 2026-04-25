'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect, createContext, useContext } from 'react'
import {
  LayoutDashboard, Package, ClipboardList, ShoppingBag, Users,
  FileText, ScrollText, Layers, Navigation, Tag, Image,
  Settings, X, ExternalLink
} from 'lucide-react'

// Sidebar context for mobile toggle
const SidebarContext = createContext<{
  isOpen: boolean
  setIsOpen: (v: boolean) => void
}>({ isOpen: false, setIsOpen: () => {} })

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

const navGroups = [
  {
    items: [
      { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
      { href: '/admin/products', label: 'Products', icon: Package },
      { href: '/admin/inventory', label: 'Inventory', icon: ClipboardList },
      { href: '/admin/orders', label: 'Orders', icon: ShoppingBag },
      { href: '/admin/customers', label: 'Customers', icon: Users },
    ],
  },
  {
    items: [
      { href: '/admin/pages', label: 'Pages', icon: FileText },
      { href: '/admin/policies', label: 'Policies', icon: ScrollText },
      { href: '/admin/collections', label: 'Collections', icon: Layers },
      { href: '/admin/navigation', label: 'Navigation', icon: Navigation },
      { href: '/admin/discounts', label: 'Discounts', icon: Tag },
      { href: '/admin/media', label: 'Media', icon: Image },
    ],
  },
  {
    items: [
      { href: '/admin/settings', label: 'Settings', icon: Settings },
    ],
  },
]

function NavItem({
  href,
  label,
  icon: Icon,
  exact,
  onClick,
}: {
  href: string
  label: string
  icon: React.ElementType
  exact?: boolean
  onClick?: () => void
}) {
  const pathname = usePathname()
  const isActive = exact ? pathname === href : pathname.startsWith(href)

  return (
    <Link
      href={href}
      onClick={onClick}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all relative ${
        isActive
          ? 'bg-white/12 text-white font-medium border-l-[3px] border-white pl-[9px]'
          : 'text-white/60 hover:text-white hover:bg-white/7'
      }`}
    >
      <Icon size={16} strokeWidth={isActive ? 2.5 : 1.8} />
      {label}
    </Link>
  )
}

function SidebarContent({ onNavClick }: { onNavClick?: () => void }) {
  return (
    <aside className="w-[240px] flex-shrink-0 bg-[#1b3a34] text-white flex flex-col h-full overflow-y-auto">
      {/* Logo */}
      <div className="px-5 py-6 border-b border-white/10">
        <p
          className="font-bold text-lg tracking-widest bg-gradient-to-r from-[#e8c97a] to-[#b8862a] bg-clip-text text-transparent"
          style={{ fontFamily: 'var(--font-cinzel, Georgia, serif)' }}
        >
          LABEL WINK
        </p>
        <p className="text-[#f5ede0]/50 text-[10px] italic mt-0.5">Wear Wink</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-4">
        {navGroups.map((group, gi) => (
          <div key={gi}>
            {gi > 0 && <div className="border-t border-white/10 mb-4" />}
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <NavItem key={item.href} {...item} onClick={onNavClick} />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom actions */}
      <div className="px-3 py-4 border-t border-white/10">
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-white/60 hover:text-white hover:bg-white/7 transition-all"
        >
          <ExternalLink size={16} />
          View Storefront
        </a>
      </div>
    </aside>
  )
}

export function AdminSidebar() {
  const { isOpen, setIsOpen } = useSidebar()

  // Close on route change
  const pathname = usePathname()
  useEffect(() => {
    setIsOpen(false)
  }, [pathname, setIsOpen])

  // Lock scroll on mobile when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden lg:flex">
        <SidebarContent />
      </div>

      {/* Mobile drawer */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />
          {/* Drawer */}
          <div className="relative flex">
            <SidebarContent onNavClick={() => setIsOpen(false)} />
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-[-40px] text-white bg-[#1b3a34] rounded-full p-1.5"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}
    </>
  )
}
