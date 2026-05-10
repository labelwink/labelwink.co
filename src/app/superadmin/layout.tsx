'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

const navSections = [
  {
    title: 'STORE MANAGEMENT',
    items: [
      { label: 'Admin Dashboard', href: '/admin' },
      { label: 'Orders',          href: '/admin/orders' },
      { label: 'Products',        href: '/admin/products' },
      { label: 'Inventory',       href: '/admin/inventory' },
      { label: 'Customers',       href: '/admin/customers' },
      { label: 'Discounts',       href: '/admin/discounts' },
      { label: 'Returns',         href: '/admin/returns' },
      { label: 'Reviews',         href: '/admin/reviews' },
      { label: 'Analytics',       href: '/admin/analytics' },
    ],
  },
  {
    title: 'MASTER DATA',
    items: [
      { label: 'Attributes & Sizes', href: '/superadmin/master-data' },
      { label: 'Categories',         href: '/superadmin/categories' },
      { label: 'Collections',        href: '/superadmin/collections' },
    ],
  },
  {
    title: 'CONTENT',
    items: [
      { label: 'Pages / CMS',     href: '/superadmin/cms' },
      { label: 'Banners',         href: '/superadmin/banners' },
      { label: 'Email Templates', href: '/superadmin/email-templates' },
    ],
  },
  {
    title: 'INTEGRATIONS',
    items: [
      { label: 'Razorpay',      href: '/superadmin/integrations/razorpay' },
      { label: 'Shiprocket',    href: '/superadmin/integrations/shiprocket' },
      { label: 'Telegram',      href: '/superadmin/integrations/telegram' },
      { label: 'Email / Brevo', href: '/superadmin/integrations/email' },
    ],
  },
  {
    title: 'USERS',
    items: [
      { label: 'All Users',      href: '/superadmin/users' },
      { label: 'Admins & Roles', href: '/superadmin/users/roles' },
    ],
  },
  {
    title: 'FINANCE',
    items: [
      { label: 'GST Invoices', href: '/superadmin/gst-invoices' },
      { label: 'Accounting',   href: '/admin/accounting' },
    ],
  },
  {
    title: 'SYSTEM',
    items: [
      { label: 'System Logs',  href: '/superadmin/logs' },
      { label: 'Site Settings', href: '/superadmin/settings' },
    ],
  },
]

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router   = useRouter()
  const [collapsed, setCollapsed] = useState(false)
  const [authChecked, setAuthChecked] = useState(false)

  // Client-side role guard
  useEffect(() => {
    fetch('/api/admin/profile')
      .then(r => (r.ok ? r.json() : null))
      .then(data => {
        if (!data || data.role !== 'super_admin') {
          router.replace('/admin/login')
        } else {
          setAuthChecked(true)
        }
      })
      .catch(() => router.replace('/admin/login'))
  }, [router])

  if (!authChecked) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#1C3829' }}>
        <div style={{ textAlign: 'center', color: '#C9A84C' }}>
          <div style={{ fontSize: '24px', fontWeight: 700, marginBottom: '8px' }}>LabelWink</div>
          <div style={{ fontSize: '12px', opacity: 0.7 }}>Verifying access…</div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f9fafb', fontFamily: "'Inter', -apple-system, sans-serif" }}>
      {/* Sidebar */}
      <aside style={{
        width: collapsed ? '64px' : '240px',
        background: '#1C3829',
        borderRight: '1px solid rgba(255,255,255,0.08)',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        top: 0,
        left: 0,
        height: '100%',
        zIndex: 40,
        transition: 'width 200ms ease',
        overflowY: 'auto',
        overflowX: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          background: '#1C3829',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          padding: collapsed ? '16px 12px' : '16px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
          minHeight: '64px',
        }}>
          {!collapsed && (
            <div>
              <p style={{ fontSize: '18px', fontWeight: 300, color: '#ffffff', margin: 0, lineHeight: 1 }}>
                Label<span style={{ fontWeight: 700, color: '#C9A84C' }}>Wink</span>
              </p>
              <span style={{
                display: 'inline-block',
                marginTop: '6px',
                fontSize: '9px',
                fontWeight: 700,
                textTransform: 'uppercase' as const,
                letterSpacing: '0.1em',
                color: '#1C3829',
                background: '#C9A84C',
                padding: '2px 8px',
                borderRadius: '4px',
              }}>
                Super Admin
              </span>
            </div>
          )}
          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: 'none',
              color: '#ffffff',
              cursor: 'pointer',
              borderRadius: '6px',
              padding: '6px 8px',
              fontSize: '12px',
              flexShrink: 0,
            }}
          >
            {collapsed ? '→' : '←'}
          </button>
        </div>

        {/* Superadmin dashboard link */}
        <div style={{ padding: '8px 8px 0' }}>
          <Link
            href="/superadmin"
            prefetch
            style={{
              display: 'flex',
              alignItems: 'center',
              height: '40px',
              padding: '0 12px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: pathname === '/superadmin' ? 600 : 500,
              color: pathname === '/superadmin' ? '#C9A84C' : 'rgba(255,255,255,0.8)',
              textDecoration: 'none',
              background: pathname === '/superadmin' ? 'rgba(201,168,76,0.15)' : 'transparent',
              transition: 'all 150ms',
              overflow: 'hidden',
              whiteSpace: 'nowrap',
            }}
          >
            {collapsed ? '◉' : '★ Super Admin Overview'}
          </Link>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '4px 0', overflowY: 'auto' }}>
          {navSections.map(section => (
            <div key={section.title} style={{ marginBottom: '4px' }}>
              {!collapsed && (
                <p style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  textTransform: 'uppercase' as const,
                  letterSpacing: '0.08em',
                  color: 'rgba(201,168,76,0.6)',
                  padding: '14px 20px 6px',
                  margin: 0,
                }}>
                  {section.title}
                </p>
              )}
              {section.items.map(item => {
                const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href + '/'))
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    prefetch
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      height: '38px',
                      padding: '0 12px',
                      marginLeft: '8px',
                      marginRight: '8px',
                      marginBottom: '2px',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: isActive ? 600 : 400,
                      color: isActive ? '#C9A84C' : 'rgba(255,255,255,0.7)',
                      textDecoration: 'none',
                      background: isActive ? 'rgba(201,168,76,0.15)' : 'transparent',
                      transition: 'all 150ms',
                      overflow: 'hidden',
                      whiteSpace: 'nowrap',
                    }}
                    onMouseEnter={e => {
                      if (!isActive) {
                        (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.08)'
                        ;(e.currentTarget as HTMLElement).style.color = '#ffffff'
                      }
                    }}
                    onMouseLeave={e => {
                      if (!isActive) {
                        (e.currentTarget as HTMLElement).style.background = 'transparent'
                        ;(e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.7)'
                      }
                    }}
                  >
                    {collapsed ? '•' : item.label}
                  </Link>
                )
              })}
            </div>
          ))}
        </nav>

        {/* Footer links */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', padding: '12px 8px' }}>
          <Link
            href="/"
            prefetch
            style={{ display: 'block', padding: '8px 12px', fontSize: '12px', color: 'rgba(255,255,255,0.5)', textDecoration: 'none', borderRadius: '6px', transition: 'color 150ms' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#C9A84C')}
            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.5)')}
          >
            {collapsed ? '🏠' : '→ View Store'}
          </Link>
          <button
            type="button"
            onClick={async () => { await fetch('/api/admin/auth/logout', { method: 'POST' }); router.replace('/admin/login') }}
            style={{
              display: 'block', width: '100%', textAlign: 'left',
              padding: '8px 12px', fontSize: '12px', color: 'rgba(255,255,255,0.5)',
              background: 'none', border: 'none', cursor: 'pointer',
              borderRadius: '6px', transition: 'color 150ms',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = '#f87171')}
            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.5)')}
          >
            {collapsed ? '×' : 'Logout'}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main
        className="page-transition flex-1 min-h-screen bg-gray-50"
        style={{
          marginLeft: collapsed ? '64px' : '240px',
          color: '#1a2e1e',
          transition: 'margin-left 200ms ease',
        }}
      >
        {/* Top bar */}
        <div style={{
          background: '#ffffff',
          borderBottom: '1px solid #e5e7eb',
          padding: '0 24px',
          height: '56px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 30,
        }}>
          <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: 500 }}>
            Super Admin Panel <span style={{ color: '#d1d5db' }}>›</span> Dashboard
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{
              background: '#C9A84C',
              color: '#1C3829',
              fontSize: '10px',
              fontWeight: 700,
              padding: '3px 10px',
              borderRadius: '20px',
              textTransform: 'uppercase' as const,
              letterSpacing: '0.08em',
            }}>
              Super Admin
            </span>
          </div>
        </div>
        <div style={{ padding: '32px' }}>
          {children}
        </div>
      </main>
    </div>
  )
}
