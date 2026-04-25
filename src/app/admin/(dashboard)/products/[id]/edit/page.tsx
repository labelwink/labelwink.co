import { createAdminClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import ProductForm from '@/components/admin/ProductForm'

export const metadata = { title: 'Edit Product' }

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createAdminClient()
  const { data: product } = await supabase
    .from('products')
    .select('*, product_variants(*)')
    .eq('id', id)
    .single()

  if (!product) notFound()

  return (
    <div className="space-y-6">
      <div>
        <nav className="text-sm text-[#6b7280] mb-1">Admin › Products › <span className="text-[#1a1a1a]">Edit Product</span></nav>
        <h1 className="text-2xl font-bold text-[#1a1a1a]">Edit Product</h1>
      </div>
      <ProductForm product={product} />
    </div>
  )
}
