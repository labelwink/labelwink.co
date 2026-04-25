import { createAdminClient } from '@/lib/supabase/server'
import { Users, Search, IndianRupee, ShoppingBag, Plus } from 'lucide-react'
import Link from 'next/link'

export default async function CustomersPage({
  searchParams,
}: { searchParams: Promise<{ q?: string; page?: string }> }) {
  const resolvedSearchParams = await searchParams
  const supabase = createAdminClient()
  const page = Number(resolvedSearchParams.page ?? 1)
  const limit = 25
  const offset = (page - 1) * limit

  let query = supabase
    .from('users')
    .select(`
      id, name, phone, email, wink_points, created_at,
      orders!left (id, total, payment_status)
    `, { count: 'exact' })
    .eq('role', 'customer')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (resolvedSearchParams.q) {
    query = query.or(
      `name.ilike.%${resolvedSearchParams.q}%,phone.ilike.%${resolvedSearchParams.q}%,email.ilike.%${resolvedSearchParams.q}%`
    )
  }

  const { data: rawCustomers, count, error } = await query

  if (error) console.error('Customers error:', error.message)

  const customers = (rawCustomers ?? []).map(c => {
    const paid = (c.orders as any[])?.filter((o: any) => o.payment_status === 'paid') ?? []
    const totalSpent = paid.reduce((s: number, o: any) => s + Number(o.total), 0)
    const orderCount = paid.length
    const segment =
      orderCount >= 10 || totalSpent >= 30000 ? 'VIP' :
      orderCount >= 3 ? 'Regular' :
      orderCount === 0 ? 'Inactive' : 'New'
    return { ...c, totalSpent, orderCount, segment }
  })

  return (
    <div className="space-y-8 font-body">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="admin-page-title">Customers</h1>
          <p className="text-sm text-gray-400 mt-1">{count ?? 0} registered customers total</p>
        </div>
      </div>

      <div className="bg-white border border-sage/20 rounded-2xl shadow-sm overflow-hidden">
        {/* Search & Filters */}
        <div className="p-6 border-b border-sage/10 flex flex-col md:flex-row gap-4 items-center justify-between bg-sage/5">
          <form method="GET" className="relative w-full max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input 
              name="q" 
              defaultValue={resolvedSearchParams.q}
              placeholder="Search by name, email, or phone..."
              className="w-full bg-white border border-sage/20 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:border-teal outline-none transition-all"
            />
          </form>
          
          <div className="flex gap-2">
            <div className="bg-white px-4 py-2 rounded-xl border border-sage/20 flex items-center gap-2">
               <Users size={16} className="text-teal" />
               <span className="text-xs font-bold uppercase tracking-widest text-charcoal">{count ?? 0} Total</span>
            </div>
          </div>
        </div>

        {customers.length === 0 ? (
          <div className="py-24 text-center">
            <div className="w-16 h-16 bg-sage/10 rounded-full flex items-center justify-center mx-auto mb-4 text-sage">
              <Users size={32} />
            </div>
            <h3 className="text-lg font-semibold text-charcoal">No customers found</h3>
            <p className="text-sm text-gray-400 mt-1">
              {resolvedSearchParams.q ? `No results match "${resolvedSearchParams.q}"` : 'Your customer list is currently empty.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-sage/5 border-b border-sage/10">
                  <th className="px-6 py-4 admin-table-header">Customer</th>
                  <th className="px-6 py-4 admin-table-header">Contact</th>
                  <th className="px-6 py-4 admin-table-header text-right">Orders</th>
                  <th className="px-6 py-4 admin-table-header text-right">Total Spent</th>
                  <th className="px-6 py-4 admin-table-header text-center">Segment</th>
                  <th className="px-6 py-4 admin-table-header text-right">Wink Points</th>
                  <th className="px-6 py-4 admin-table-header">Joined</th>
                  <th className="px-6 py-4 admin-table-header"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sage/5">
                {customers.map((c: any) => (
                  <tr key={c.id} className="hover:bg-sage/5 transition-colors group">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-teal/5 text-teal rounded-full flex items-center justify-center font-bold text-sm">
                          {c.name?.[0] || 'U'}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-charcoal">{c.name || 'Anonymous User'}</p>
                          <p className="text-[10px] uppercase tracking-widest text-gray-400 font-medium">ID: {c.id.slice(0, 8)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <p className="text-sm text-gray-600">{c.email || '—'}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{c.phone || '—'}</p>
                    </td>
                    <td className="px-6 py-5 text-right font-mono text-sm text-charcoal">{c.orderCount}</td>
                    <td className="px-6 py-5 text-right">
                      <p className="text-sm font-bold text-charcoal">₹{c.totalSpent.toLocaleString('en-IN')}</p>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full ${
                        c.segment === 'VIP' ? 'bg-purple-100 text-purple-700' :
                        c.segment === 'Regular' ? 'bg-blue-50 text-blue-700' :
                        c.segment === 'Inactive' ? 'bg-red-50 text-red-500' :
                        'bg-emerald-50 text-emerald-700'
                      }`}>{c.segment}</span>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex items-center justify-end gap-1.5 text-gold font-bold text-sm">
                        <Tag size={12} /> {c.wink_points?.toLocaleString('en-IN') ?? 0}
                      </div>
                    </td>
                    <td className="px-6 py-5 text-xs text-gray-400 font-medium uppercase tracking-wider">
                      {new Date(c.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-5 text-right">
                      <Link 
                        href={`/admin/customers/${c.id}`}
                        className="text-xs font-bold text-teal hover:underline uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        Details →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {(count ?? 0) > limit && (
          <div className="p-6 bg-sage/5 border-t border-sage/10 flex justify-between items-center">
            <p className="text-xs text-gray-400 font-medium uppercase tracking-widest">
              Showing {offset + 1}–{Math.min(offset + limit, count ?? 0)} of {count}
            </p>
            <div className="flex gap-2">
              {page > 1 && (
                <Link 
                  href={`?page=${page - 1}${resolvedSearchParams.q ? `&q=${resolvedSearchParams.q}` : ''}`}
                  className="px-4 py-2 bg-white border border-sage/20 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-sage/5 transition-colors"
                >
                  Previous
                </Link>
              )}
              {offset + limit < (count ?? 0) && (
                <Link 
                  href={`?page=${page + 1}${resolvedSearchParams.q ? `&q=${resolvedSearchParams.q}` : ''}`}
                  className="px-4 py-2 bg-white border border-sage/20 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-sage/5 transition-colors"
                >
                  Next Page
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
