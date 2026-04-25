'use client'

import { useRouter } from 'next/navigation'
import { LogOut, Menu, ExternalLink } from 'lucide-react'
import { useSidebar } from '@/components/admin/AdminSidebar'

export function AdminTopBar() {
  const router = useRouter()
  const { setIsOpen } = useSidebar()

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
