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

  const payload = await verifyAdminToken(token) as Record<string, unknown> | null
  if (!payload) redirect('/admin/login')

  // Role guard — only admin and super_admin may enter
  const role = payload.role as string | undefined
  if (!role || !['admin', 'super_admin'].includes(role)) {
    redirect('/admin/login')
  }

  return (
    <SidebarProvider>
      <div
        className="flex h-screen overflow-hidden"
        style={{ background: '#faf8f4', fontFamily: "'Inter', -apple-system, sans-serif" }}
      >
        <AdminSidebar />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <AdminTopBar />
          <main className="page-transition flex-1 overflow-y-auto overflow-x-hidden bg-gray-50 min-h-screen">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}
