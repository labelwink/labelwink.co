import { createAdminClient } from '@/lib/supabase/server'
import AddProductClient from './AddProductClient'

export default async function AddProductPage() {
  const supabase = createAdminClient() // service role — sees ALL categories

  const { data: categories, error } = await supabase
    .from('categories')
    .select('id, name, slug, is_active')
    .order('sort_order', { ascending: true })

  if (!categories || categories.length === 0) {
    return (
      <div className="p-8 font-body">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-6 flex gap-4">
          <span className="text-2xl">⚠️</span>
          <div>
            <p className="font-semibold text-amber-900">No categories found</p>
            <p className="text-sm text-amber-700 mt-1">
              Create at least one category before adding products.
            </p>
            <a href="/admin/categories"
              className="inline-block mt-3 bg-amber-900 text-white text-sm px-4 py-2 rounded-lg">
              Manage Categories →
            </a>
          </div>
        </div>
      </div>
    )
  }

  return <AddProductClient categories={categories} />
}
