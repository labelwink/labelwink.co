'use client'
import { Bell, User, LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export function AdminTopBar({ userName }: { userName: string }) {
  const supabase = createClient()
  const router = useRouter()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/account/login')
  }

  return (
    <header className="h-16 bg-white border-b border-sage/10 px-8 flex items-center justify-between">
      <div className="flex items-center gap-4">
        {/* Placeholder for Breadcrumbs or Search if needed later */}
      </div>

      <div className="flex items-center gap-6">
        <button className="text-gray-400 hover:text-charcoal transition-colors">
          <Bell size={20} />
        </button>
        
        <div className="flex items-center gap-3 pl-6 border-l border-sage/10">
          <div className="text-right">
            <p className="text-sm font-semibold text-charcoal">{userName}</p>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Store Manager</p>
          </div>
          <button 
            onClick={handleLogout}
            className="w-10 h-10 bg-sage/5 rounded-full flex items-center justify-center text-charcoal hover:bg-sage/10 transition-colors group"
          >
            <LogOut size={18} className="group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>
    </header>
  )
}
