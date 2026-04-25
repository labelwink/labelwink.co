import { createAdminClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import EditProductClient from './EditProductClient'

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditProductPage({ params }: Props) {
  const resolvedParams = await params;
  const supabase = createAdminClient()

  const [
    { data: product, error: pError },
    { data: categories, error: cError }
  ] = await Promise.all([
    supabase
      .from('products')
      .select('*, product_images(*), categories(id, name)')
      .eq('id', resolvedParams.id)
      .single(),
    supabase
      .from('categories')
      .select('id, name')
      .order('sort_order')
  ])

  if (pError || !product) {
    console.error('Error fetching product:', pError)
    return notFound()
  }

  return <EditProductClient product={product} categories={categories || []} />
}
