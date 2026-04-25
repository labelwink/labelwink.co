'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Package, ShoppingBag, Users, LayoutGrid,
  Tag, Image, Star, BarChart2, Settings, ExternalLink
} from 'lucide-react'

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/admin/products', label: 'Products', icon: Package },
  { href: '/admin/inventory', label: 'Inventory / Stock', icon: ShoppingBag },
  { href: '/admin/categories', label: 'Collections', icon: LayoutGrid },
  { href: '/admin/pages', label: 'Pages Content', icon: Image },
  { href: '/admin/policies', label: 'Policies', icon: Star },
  { href: '/admin/cms', label: 'Hero / Banners', icon: Image },
  { href: '/admin/navigation', label: 'Navigation', icon: ExternalLink },
  { href: '/admin/analytics', label: 'Analytics', icon: BarChart2 },
]

export function AdminSidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-56 flex-shrink-0 bg-charcoal text-white flex flex-col h-full overflow-y-auto font-body">
      {/* Logo */}
      <div className="px-5 py-6 border-b border-white/10">
        <p className="font-brand text-lg font-semibold tracking-brand">LABEL WINK</p>
        <p className="text-white/40 text-[10px] uppercase tracking-widest mt-0.5">Admin Portal</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map(({ href, label, icon: Icon, exact }) => {
          const isActive = exact ? pathname === href : pathname.startsWith(href)
          return (
            <Link key={href} href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                isActive
                  ? 'bg-white/15 text-white font-medium'
                  : 'text-white/60 hover:text-white hover:bg-white/8'
              }`}>
              <Icon size={16} strokeWidth={isActive ? 2.5 : 1.8} />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Bottom actions */}
      <div className="px-3 py-4 border-t border-white/10 space-y-0.5">
        <Link href="/admin/settings"
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
            pathname === '/admin/settings'
              ? 'bg-white/15 text-white'
              : 'text-white/60 hover:text-white hover:bg-white/8'
          }`}>
          <Settings size={16} />
          Settings
        </Link>
        <a href="/" target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-white/60 hover:text-white hover:bg-white/8 transition-all">
          <ExternalLink size={16} />
          View Storefront
        </a>
      </div>
    </aside>
  )
}
