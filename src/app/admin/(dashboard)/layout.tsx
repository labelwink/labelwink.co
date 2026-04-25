import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { verifyAdminToken } from '@/lib/adminAuth'
import { AdminSidebar, SidebarProvider } from '@/components/admin/AdminSidebar'
import { AdminTopBar } from '@/components/admin/AdminTopBar'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: { default: 'Admin', template: '%s — Label Wink Admin' },
  robots: { index: false, follow: false },
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const token = cookieStore.get('admin_session')?.value

  if (!token) redirect('/admin/login')

  const payload = await verifyAdminToken(token)
  if (!payload) redirect('/admin/login')

  return (
    <SidebarProvider>
      <div className="flex h-screen bg-[#f9f9f9] overflow-hidden font-body">
        <AdminSidebar />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <AdminTopBar />
          <main className="flex-1 overflow-y-auto p-6 lg:p-8">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}
