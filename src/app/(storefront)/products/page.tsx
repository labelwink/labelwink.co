import { createClient } from '@/lib/supabase/server';
import { CollectionFiltersClient } from '@/components/storefront/CollectionFiltersClient';

export const metadata = {
  title: 'All Products | Label Wink',
  description: 'Browse our complete collection of ethnic and fusion wear — kurtis, co-ords, dresses and more.',
}

export const revalidate = 60;

export default async function AllProductsPage() {
  const supabase = await createClient();

  const { data: products } = await supabase
    .from('products')
    .select(`
      id, name, slug, tags, fabric, occasion, is_active,
      product_variants (id, size, color, color_hex, price, mrp, stock_qty, image_cloudinary_ids),
      product_images (cloudinary_public_id, url, is_primary, is_cover, sort_order)
    `)
    .eq('visible', true)
    .order('created_at', { ascending: false });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="text-xs tracking-wider text-muted-foreground uppercase mb-4">
          Home / Products
        </div>
        <div className="flex flex-col md:flex-row justify-between items-baseline gap-4 border-b border-sage/20 pb-6">
          <h1 className="font-heading text-4xl text-charcoal">All Products</h1>
          <span className="text-sm text-charcoal/70">{products?.length || 0} Products</span>
        </div>
      </div>

      <CollectionFiltersClient products={products ?? []} />
    </div>
  );
}
