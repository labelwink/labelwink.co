import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { ProductCard } from '@/components/product/ProductCard';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { EmptyState } from '@/components/ui/EmptyState';

export default async function CollectionPage({ 
  params, 
  searchParams 
}: { 
  params: Promise<{ slug: string }>
  searchParams: Promise<{ size?: string; color?: string; min_price?: string; max_price?: string; sort?: string }>
}) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const supabase = createClient();

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

  // 2. Build product query
  let query = supabase
    .from('products')
    .select(`
      id, name, slug, tags, is_active,
      product_variants!inner (id, size, color, color_hex, price, mrp, stock_qty, image_cloudinary_ids),
      product_images (cloudinary_public_id, is_primary, sort_order)
    `)
    .eq('is_active', true);

  if (category) {
    query = query.eq('category_id', category.id);
  }

  // 3. Apply filters from URL
  if (resolvedSearchParams.size) query = query.eq('product_variants.size', resolvedSearchParams.size);
  if (resolvedSearchParams.color) query = query.eq('product_variants.color', resolvedSearchParams.color);
  if (resolvedSearchParams.min_price) query = query.gte('product_variants.price', Number(resolvedSearchParams.min_price));
  if (resolvedSearchParams.max_price) query = query.lte('product_variants.price', Number(resolvedSearchParams.max_price));

  // 4. Apply sort
  switch (resolvedSearchParams.sort) {
    case 'price_asc': query = query.order('price', { referencedTable: 'product_variants', ascending: true }); break;
    case 'price_desc': query = query.order('price', { referencedTable: 'product_variants', ascending: false }); break;
    case 'newest': default: query = query.order('created_at', { ascending: false }); break;
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
          <span className="text-sm text-charcoal/70">{products?.length || 0} Products Found</span>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Filters (Desktop) */}
        <aside className="hidden lg:block w-64 flex-shrink-0">
          <h2 className="text-sm font-semibold uppercase tracking-widest mb-6 font-sans">Filters</h2>
          <Accordion type="multiple" defaultValue={["size", "color", "price"]} className="w-full">
            <AccordionItem value="size" className="border-sage/20">
              <AccordionTrigger className="text-sm font-medium hover:no-underline">Size</AccordionTrigger>
              <AccordionContent>
                <div className="flex flex-wrap gap-2 pt-2">
                  {['XS', 'S', 'M', 'L', 'XL', 'XXL'].map((size) => (
                    <a 
                      key={size} 
                      href={`?size=${size}`}
                      className={`border rounded-sm w-10 h-10 flex items-center justify-center text-xs font-medium transition-colors ${
                        resolvedSearchParams.size === size ? 'bg-teal text-white border-teal' : 'border-sage/40 hover:border-teal'
                      }`}
                    >
                      {size}
                    </a>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </aside>

        {/* Product Grid */}
        <div className="flex-1">
          {!products || products.length === 0 ? (
            <EmptyState 
              icon="👗" 
              title="No products match your filters" 
              description="Try adjusting your filters or checking another collection." 
              action={{ label: "Clear Filters", href: `/collections/${resolvedParams.slug}` }} 
            />
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-10 sm:gap-x-6">
              {products.map((product) => {
                const variant = product.product_variants?.[0];
                const primaryImage = product.product_images?.find((img: any) => img.is_primary) || product.product_images?.[0];
                
                return (
                  <ProductCard 
                    key={product.id}
                    id={product.id}
                    name={product.name}
                    slug={product.slug}
                    basePrice={variant?.price || 0}
                    compareAtPrice={variant?.mrp || null}
                    publicId={primaryImage?.cloudinary_public_id}
                    isNewArrival={product.tags?.includes('new')}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
