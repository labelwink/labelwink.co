import { createAdminClient } from '@/lib/supabase/server'
import Link from 'next/link'

export const metadata = { title: 'Super Admin Dashboard' }
export const revalidate = 60

async function getDashboardStats() {
  try {
    const supabase = createAdminClient()
    const today = new Date().toISOString().split('T')[0]

    const [
      { count: totalUsers },
      { count: totalAdmins },
      { data: recentLogs },
      { count: todayOrders },
    ] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('profiles').select('*', { count: 'exact', head: true })
        .in('role', ['admin', 'super_admin', 'superadmin']),
      supabase.from('system_logs').select('*')
        .in('level', ['error', 'critical'])
        .eq('resolved', false)
        .order('created_at', { ascending: false })
        .limit(5),
      supabase.from('orders').select('*', { count: 'exact', head: true })
        .gte('created_at', today),
    ])

    return { totalUsers: totalUsers || 0, totalAdmins: totalAdmins || 0, recentLogs: recentLogs || [], todayOrders: todayOrders || 0 }
  } catch {
    return { totalUsers: 0, totalAdmins: 0, recentLogs: [], todayOrders: 0 }
  }
}

export default async function SuperAdminDashboard() {
  const { totalUsers, totalAdmins, recentLogs, todayOrders } = await getDashboardStats()

  const stats = [
    { label: 'Total Users',       value: totalUsers,   color: '#3b82f6', href: '/superadmin/users' },
    { label: 'Admins',            value: totalAdmins,  color: '#C9A84C', href: '/superadmin/users/roles' },
    { label: 'Orders Today',      value: todayOrders,  color: '#10b981', href: '/admin/orders' },
    { label: 'Unresolved Errors', value: recentLogs.length, color: '#ef4444', href: '/superadmin/logs' },
  ]

  const quickActions = [
    { label: 'Manage Attributes',  href: '/superadmin/master-data' },
    { label: 'Email Templates',    href: '/superadmin/email-templates' },
    { label: 'Integrations',       href: '/superadmin/integrations/razorpay' },
    { label: 'User Roles',         href: '/superadmin/users/roles' },
    { label: 'System Logs',        href: '/superadmin/logs' },
    { label: 'Site Settings',      href: '/superadmin/settings' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Super Admin Dashboard</h1>
          <p className="text-gray-500 text-sm mt-0.5">Platform-wide control and monitoring</p>
        </div>
        <span className="bg-[#C9A84C] text-[#1C3829] text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
          Super Admin
        </span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(stat => (
          <Link key={stat.label} href={stat.href} style={{ textDecoration: 'none' }}>
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow"
              style={{ borderLeft: `4px solid ${stat.color}` }}>
              <p className="text-gray-500 text-sm font-medium">{stat.label}</p>
              <p className="text-gray-900 text-2xl font-bold mt-1">{stat.value}</p>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent errors */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Recent Errors</h2>
            <Link href="/superadmin/logs" className="text-[#1C3829] text-sm hover:text-[#C9A84C] transition-colors">
              View all →
            </Link>
          </div>
          <div className="p-4">
            {recentLogs && recentLogs.length > 0 ? (
              <div className="space-y-3">
                {recentLogs.map((log: any) => (
                  <div key={log.id} className="bg-gray-50 rounded-lg p-3 text-sm">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="bg-red-50 text-red-700 border border-red-200 text-xs px-2 py-0.5 rounded-full font-medium">
                        {log.level}
                      </span>
                      <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">
                        {log.category}
                      </span>
                    </div>
                    <p className="text-gray-700 truncate">{log.message}</p>
                    <p className="text-gray-400 text-xs mt-1">
                      {new Date(log.created_at).toLocaleString('en-IN')}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-sm text-center py-8">
                ✓ No unresolved errors
              </p>
            )}
          </div>
        </div>

        {/* Quick actions */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Quick Actions</h2>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-2 gap-3">
              {quickActions.map(action => (
                <Link
                  key={action.href}
                  href={action.href}
                  className="bg-gray-50 hover:bg-[#1C3829] hover:text-white border border-gray-200 rounded-lg p-3 text-sm text-gray-700 transition-all duration-200 text-center font-medium"
                  style={{ textDecoration: 'none' }}
                >
                  {action.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
