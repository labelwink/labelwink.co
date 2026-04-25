import { createAdminClient } from '@/lib/supabase/server'
import { LayoutGrid, Plus, Edit2, Power } from 'lucide-react'
import Link from 'next/link'

export default async function CategoriesPage() {
  const supabase = createAdminClient()
  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .order('sort_order')

  return (
    <div className="space-y-8 font-body">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="admin-page-title">Categories</h1>
          <p className="text-sm text-gray-400 mt-1">{categories?.length ?? 0} categories total</p>
        </div>
        <Link href="/admin/categories/new"
          className="bg-charcoal text-white px-6 py-3 rounded-xl text-sm font-bold uppercase tracking-widest hover:bg-charcoal/90 transition-colors flex items-center gap-2">
          <Plus size={18} /> Add Category
        </Link>
      </div>

      {!categories?.length ? (
        <div className="text-center py-24 border-2 border-dashed border-sage/20 rounded-2xl bg-white">
          <div className="w-20 h-20 bg-sage/5 rounded-full flex items-center justify-center mx-auto mb-6 text-sage">
            <LayoutGrid size={40} />
          </div>
          <h3 className="text-lg font-semibold text-charcoal">No categories yet</h3>
          <p className="text-sm text-gray-400 mt-1 mb-8">Categories organize your products on the storefront navigation.</p>
          <Link href="/admin/categories/new"
            className="bg-teal text-white px-8 py-3 rounded-xl text-sm font-bold uppercase tracking-widest">
            Create First Category
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-sage/20 overflow-hidden shadow-sm">
          <table className="w-full">
            <thead className="bg-sage/5 border-b border-sage/10">
              <tr>
                <th className="px-6 py-4 admin-table-header">Name</th>
                <th className="px-6 py-4 admin-table-header">Slug</th>
                <th className="px-6 py-4 admin-table-header text-center">Sort Order</th>
                <th className="px-6 py-4 admin-table-header text-center">Status</th>
                <th className="px-6 py-4 admin-table-header"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sage/5">
              {categories.map(cat => (
                <tr key={cat.id} className="hover:bg-sage/5 transition-colors group">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-sage/10 rounded flex items-center justify-center text-teal">
                        <LayoutGrid size={16} />
                      </div>
                      <span className="text-sm font-bold text-charcoal">{cat.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-sm text-gray-400 font-mono">/{cat.slug}</td>
                  <td className="px-6 py-5 text-sm text-center text-gray-500 font-medium">{cat.sort_order}</td>
                  <td className="px-6 py-5 text-center">
                    <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full ${
                      cat.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-500'
                    }`}>
                      {cat.is_active ? 'Visible' : 'Hidden'}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <Link href={`/admin/categories/${cat.id}/edit`}
                      className="text-xs font-bold text-teal hover:underline uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-end gap-2">
                      <Edit2 size={12} /> Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
