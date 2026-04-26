import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { CollectionFiltersClient } from '@/components/storefront/CollectionFiltersClient';

export default async function CollectionPage({ 
  params, 
  searchParams 
}: { 
  params: Promise<{ slug: string }>
  searchParams: Promise<{ size?: string; color?: string; min_price?: string; max_price?: string; sort?: string }>
}) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const supabase = await createClient();

  // 1. Get category details
  const { data: category, error: catError } = await supabase
    .from('categories')
    .select('*')
    .eq('slug', resolvedParams.slug)
    .eq('is_active', true)
    .single();

  if (catError || !category) {
    if (resolvedParams.slug !== 'all') notFound();
  }

  // 2. Build product query — fetch all, filtering is client-side
  let query = supabase
    .from('products')
    .select(`
      id, name, slug, tags, fabric, occasion, is_active,
      product_variants (id, size, color, color_hex, price, mrp, stock_qty, image_cloudinary_ids),
      product_images (cloudinary_public_id, url, is_primary, is_cover, sort_order)
    `)
    .eq('visible', true)
    .order('created_at', { ascending: false });

  if (category) {
    query = query.eq('category_id', category.id);
  }

  const { data: products } = await query;

  const collectionName = category?.name || 'All Products';

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="text-xs tracking-wider text-muted-foreground uppercase mb-4">
          Home / Collections / {collectionName}
        </div>
        <div className="flex flex-col md:flex-row justify-between items-baseline gap-4 border-b border-sage/20 pb-6">
          <h1 className="font-heading text-4xl text-charcoal">{collectionName}</h1>
          <span className="text-sm text-charcoal/70">{products?.length || 0} Products</span>
        </div>
      </div>

      <CollectionFiltersClient
        products={products ?? []}
      />
    </div>
  );
}
