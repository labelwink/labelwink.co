import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { Star, Truck, ShieldCheck, RefreshCcw } from 'lucide-react';
import { ProductImage } from '@/components/storefront/ProductImage';
import { PincodeChecker } from '@/components/storefront/PincodeChecker';
import { ProductImageGallery } from '@/components/storefront/ProductImageGallery';
import { ProductActions } from '@/components/storefront/ProductActions';
import { WishlistButton } from '@/components/storefront/WishlistButton';
import { ProductInfoTabs } from '@/components/storefront/ProductInfoTabs';
import WriteReviewForm from '@/components/storefront/WriteReviewForm';
import { generateProductSchema, generateBreadcrumbSchema } from '@/lib/json-ld';
import Script from 'next/script';
import Link from 'next/link';
import Image from 'next/image';


export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const resolvedParams = await params;
  const supabase = await createClient();
  const { data: product } = await supabase
    .from('products')
    .select('name, description, seo_title, seo_description, og_image_cloudinary_id, price')
    .eq('slug', resolvedParams.slug)
    .single();

  if (!product) return { title: 'Product Not Found' };

  const { data: settings } = await supabase.from('shop_settings').select('store_name').single();

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const canonical = `${siteUrl}/products/${resolvedParams.slug}`;

  return {
    title: product.seo_title || `${product.name} | ${settings?.store_name || process.env.NEXT_PUBLIC_STORE_NAME}`,
    description: product.seo_description || product.description,
    alternates: {
      canonical,
    },
    openGraph: {
      title: product.name,
      description: product.description || undefined,
      images: product.og_image_cloudinary_id ? [{ url: `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/${product.og_image_cloudinary_id}` }] : [],
    }
  };
}



export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  const supabase = await createClient();

  const { data: settings } = await supabase.from('shop_settings').select('store_name').single();

  // Fetch user session for WriteReviewForm and wishlist check
  const { data: { user } } = await supabase.auth.getUser();

  // Will be set after product fetch
  let isWishlisted = false;

  const { data: product, error } = await supabase
    .from('products')
    .select(`
      *,
      categories (id, name, slug),
      product_variants (*),
      product_images (*)
    `)
    .eq('slug', resolvedParams.slug)
    .eq('is_active', true)
    .single();

  if (error || !product) notFound();

  // Re-check wishlist with actual product ID
  let hasPurchased = false;
  if (user) {
    const [wlResult, purchaseResult] = await Promise.all([
      supabase
        .from('wishlists')
        .select('id')
        .eq('product_id', product.id)
        .eq('user_id', user.id)
        .maybeSingle(),
      // Gate: user must have a DELIVERED order containing this product
      supabase
        .from('order_items')
        .select('id, orders!inner(user_id, status)')
        .eq('product_id', product.id)
        .eq('orders.user_id', user.id)
        .eq('orders.status', 'delivered')
        .limit(1),
    ]);
    isWishlisted = !!wlResult.data;
    hasPurchased = (purchaseResult.data?.length ?? 0) > 0;
  }

  // Fetch reviews separately to avoid inner join issues

  const { data: reviews } = await supabase
    .from('reviews')
    .select('id, rating, title, body, is_verified_purchase, admin_reply, created_at, profiles(full_name)')
    .eq('product_id', product.id)
    .eq('status', 'approved')
    .order('created_at', { ascending: false });

  // Fetch related products
  const { data: relatedProducts } = await supabase
    .from('products')
    .select('id, name, slug, product_variants(*), product_images(*)')
    .eq('category_id', product.category_id)
    .eq('visible', true)
    .neq('id', product.id)
    .limit(4);

  const avgRating = reviews?.length 
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
    : 0;

  const firstVariant = product.product_variants?.[0];
  const allOutOfStock = product.product_variants && product.product_variants.length > 0
    ? product.product_variants.every((v: any) => (v.stock_qty ?? v.stock ?? 0) === 0 || v.is_active === false)
    : false;
  // Fall back to product-level price/mrp if variant price is 0 or missing
  const displayPrice = firstVariant?.price || product.price || product.selling_price || null;
  const displayMrp = firstVariant?.mrp || product.mrp || product.compare_at_price || null;
  const discount = (displayMrp && displayPrice)
    ? Math.round(((displayMrp - displayPrice) / displayMrp) * 100) 
    : 0;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const storefrontSettings = { 
    store_name: process.env.NEXT_PUBLIC_STORE_NAME || settings?.store_name || 'LabelWink', 
    store_url: siteUrl 
  };

  const productImages = product.product_images?.map((img: any) => img.url) || [];

  const productSchema = generateProductSchema({
    name: product.name,
    description: product.description,
    price: Number(displayPrice),
    compare_at_price: Number(displayMrp),
    images: productImages,
    slug: product.slug,
    reviews_summary: reviews && reviews.length > 0 ? {
      avg_rating: Number(avgRating),
      total_count: reviews.length
    } : undefined
  }, storefrontSettings);

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: siteUrl },
    { name: 'Products', url: `${siteUrl}/products` },
    { name: product.name, url: `${siteUrl}/products/${product.slug}` }
  ]);

  return (
    <div className="container mx-auto px-4 py-8 pb-28 md:pb-8">
      <Script
        id="product-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      <Script
        id="breadcrumb-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      
      <div className="text-[10px] tracking-[0.2em] text-muted-foreground uppercase mb-8 flex items-center gap-2">
        <Link href="/" className="hover:text-[#1C3829] transition-colors">Home</Link> 
        <span className="opacity-40">/</span>
        {product.categories && (
          <>
            <Link href={`/collections/${product.categories.slug}`} className="hover:text-[#1C3829] transition-colors">{product.categories.name}</Link>
            <span className="opacity-40">/</span>
          </>
        )}
        <span className="text-[#1A1A1A] font-bold">{product.name}</span>
      </div>

      <div className="flex flex-col md:flex-row gap-6 md:gap-12 lg:gap-20 mb-20">
        <div className="w-full md:w-1/2">
          {product.product_images && product.product_images.length > 0 ? (
            <ProductImageGallery
              images={product.product_images}
              cloudName={process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || ''}
            />
          ) : (
            <div className="aspect-[3/4] bg-[#FAF5E9] rounded-2xl flex items-center justify-center text-gray-300">
              No image
            </div>
          )}
          {discount > 0 && (
            <div className="absolute top-4 left-4 z-10">
              <span className="bg-green-100 text-green-800 text-xs uppercase tracking-wide px-2.5 py-1 rounded-md font-bold">
                {discount}% OFF
              </span>
            </div>
          )}
        </div>

        <div className="w-full md:w-1/2 flex flex-col space-y-10 px-0 md:px-0">
          <div className="space-y-4">
            <h1 className="font-heading text-4xl md:text-5xl text-[#1A1A1A] font-semibold">{product.name}</h1>
            <div className="flex items-center gap-6">
              <div className="flex text-[#c9a84c]">
                {[1,2,3,4,5].map(i => <Star key={i} className={`w-4 h-4 ${i <= Number(avgRating) ? 'fill-current' : 'text-[#E8DFC8]'}`} />)}
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground border-b border-[#E8DFC8] pb-0.5">{reviews?.length || 0} Reviews</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 border-b border-[#E8DFC8] pb-6">
            <span className="text-4xl font-heading font-bold text-[#1B3A2D]">
              {displayPrice
                ? `₹${Number(displayPrice).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                : 'Price not available'}
            </span>
            {displayMrp && displayPrice && displayMrp > displayPrice && (
              <span className="text-xl text-[#6B6B5A] line-through">₹{Number(displayMrp).toLocaleString('en-IN')}</span>
            )}
            {product.product_variants && product.product_variants.length > 0 && (
              <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${allOutOfStock ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                {allOutOfStock ? 'Out of Stock' : 'In Stock'}
              </span>
            )}
          </div>

          {product.short_description && product.short_description.length > 3 && (
            <p className="text-[#444] text-sm leading-relaxed">{product.short_description}</p>
          )}
          {product.description && product.description.length > 3 && (
            <div className="text-[#444] leading-relaxed font-medium">{product.description}</div>
          )}

          {/* Stock status */}
          {(() => {
            const hasVariants = product.product_variants && product.product_variants.length > 0
            const allOutOfStock = hasVariants && product.product_variants.every((v: any) => (v.stock_qty ?? v.stock ?? 0) === 0 || v.is_active === false)
            if (!hasVariants) return <p className="text-sm text-gray-500">Contact us for availability</p>
            if (allOutOfStock) return <p className="text-sm text-red-500 font-medium">Currently out of stock</p>
            return null
          })()}

          {/* Desktop ProductActions */}
          <div className="hidden md:block">
            <div className="flex items-center gap-3 mb-4">
              <WishlistButton
                productId={product.id}
                variantId={product.product_variants?.[0]?.id}
                initialWishlisted={isWishlisted}
                className="w-14 h-14 border border-[#E8DFC8] text-[#1A1A1A] rounded-none hover:border-[#1C3829] transition-colors flex items-center justify-center flex-shrink-0 disabled:opacity-50"
              />
            </div>
            <ProductActions
              productId={product.id}
              productName={product.name}
              productSlug={product.slug}
              variants={product.product_variants ?? []}
              publicId={product.product_images?.[0]?.url}
              sizeGuide={product.size_guide ?? null}
            />

          </div>

          {/* Mobile ProductActions */}
          <div className="md:hidden">
            <div className="flex items-center gap-3 mb-4">
              <WishlistButton
                productId={product.id}
                variantId={product.product_variants?.[0]?.id}
                initialWishlisted={isWishlisted}
                className="w-12 h-12 border border-[#E8DFC8] text-[#1A1A1A] rounded-none hover:border-[#1C3829] transition-colors flex items-center justify-center flex-shrink-0 disabled:opacity-50"
              />
            </div>
            <ProductActions
              productId={product.id}
              productName={product.name}
              productSlug={product.slug}
              variants={product.product_variants ?? []}
              publicId={product.product_images?.[0]?.url}
              sizeGuide={product.size_guide ?? null}
            />
          </div>

          <PincodeChecker />

          <div className="grid grid-cols-3 gap-4 pt-8 border-t border-[#E8DFC8] text-center">
            <div className="space-y-2"><Truck className="w-5 h-5 mx-auto text-[#c9a84c]" /><p className="text-[9px] font-bold uppercase tracking-tighter text-muted-foreground">Fast Dispatch</p></div>
            <div className="space-y-2"><RefreshCcw className="w-5 h-5 mx-auto text-[#c9a84c]" /><p className="text-[9px] font-bold uppercase tracking-tighter text-muted-foreground">Easy Returns</p></div>
            <div className="space-y-2"><ShieldCheck className="w-5 h-5 mx-auto text-[#c9a84c]" /><p className="text-[9px] font-bold uppercase tracking-tighter text-muted-foreground">Secure Pay</p></div>
          </div>
        </div>
      </div>

      {/* Product Info Tabs */}
      <ProductInfoTabs
        description={product.description}
        additionalInfo={product.additional_info ?? null}
        fabricMaterial={product.fabric ?? null}
        sleeveType={null}
        fitType={product.fit ?? null}
        occasionTags={product.occasion ? [product.occasion] : (product.tags ?? null)}
        careInstructions={null}
        sizeGuide={product.size_chart_data ?? null}
        weight={product.weight}
        hsnCode={product.hsn_code}
      />

        {/* Reviews Section */}
      <section className="mt-12 border-t border-[#E8DFC8] pt-10">
        <h2 className="text-2xl font-heading font-semibold mb-8 text-[#1A1A1A]">Customer Reviews</h2>

        {reviews && reviews.length > 0 && (() => {
          const avg = Number(avgRating);
          // Rating distribution
          const dist = [5,4,3,2,1].map(star => ({
            star,
            count: reviews.filter((r: any) => r.rating === star).length,
          }));
          return (
            <div className="flex flex-col sm:flex-row gap-8 mb-10 p-6 bg-[#FAF5E9] rounded-2xl">
              {/* Big score */}
              <div className="flex flex-col items-center justify-center min-w-[100px]">
                <span className="text-6xl font-heading font-bold text-[#1A1A1A] leading-none">{avg.toFixed(1)}</span>
                <div className="flex text-yellow-400 my-2">
                  {[1,2,3,4,5].map(i => (
                    <Star key={i} className={`w-4 h-4 ${i <= Math.round(avg) ? 'fill-current' : 'text-gray-200'}`} />
                  ))}
                </div>
                <span className="text-xs text-[#6B6B5A] font-semibold">{reviews.length} review{reviews.length !== 1 ? 's' : ''}</span>
              </div>
              {/* Distribution bars */}
              <div className="flex-1 space-y-2">
                {dist.map(({ star, count }) => {
                  const pct = reviews.length ? Math.round((count / reviews.length) * 100) : 0;
                  return (
                    <div key={star} className="flex items-center gap-3">
                      <span className="text-xs font-bold text-[#6B6B5A] w-4 text-right">{star}</span>
                      <Star className="w-3 h-3 fill-yellow-400 text-yellow-400 flex-shrink-0" />
                      <div className="flex-1 bg-[#E8DFC8] rounded-full h-2">
                        <div
                          className="bg-yellow-400 h-2 rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs text-[#E8DFC8] w-6 text-right">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}

        {/* Review list */}
        {reviews && reviews.length > 0 ? (
          <div className="space-y-0 divide-y divide-[#E8DFC8]">
            {reviews.map((r: any) => {
              const reviewerName = (r.profiles as { full_name?: string } | null)?.full_name || 'Verified Buyer';
              return (
                <div key={r.id} className="py-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex text-yellow-400 mb-2">
                      {[1,2,3,4,5].map(i => (
                        <Star key={i} className={`w-4 h-4 ${i <= r.rating ? 'fill-current' : 'text-gray-200'}`} />
                      ))}
                    </div>
                    {r.is_verified_purchase && (
                      <span className="text-[9px] font-bold uppercase tracking-widest text-green-700 bg-green-50 border border-green-100 px-2 py-0.5 rounded-full flex-shrink-0">
                        ✓ Verified Purchase
                      </span>
                    )}
                  </div>
                  {r.title && <p className="font-semibold text-[#1A1A1A] text-sm mt-1">{r.title}</p>}
                  {r.body && <p className="text-[#6B6B5A] text-sm mt-1.5 leading-relaxed">{r.body}</p>}
                  {r.admin_reply && (
                    <div className="mt-3 ml-4 pl-4 border-l-2 border-[#c9a84c] bg-[#FDF8F0] rounded-r-lg py-2 pr-3">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-[#c9a84c] mb-1">Label Wink Reply</p>
                      <p className="text-sm text-[#1A1A1A] leading-relaxed">{r.admin_reply}</p>
                    </div>
                  )}
                  <p className="text-xs text-[#E8DFC8] mt-3">
                    {reviewerName} · {new Date(r.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-[#6B6B5A] italic mb-6">No reviews yet. Be the first to review this product!</p>
        )}

        {/* Write review form — only for users who received this product */}
        <WriteReviewForm productId={product.id} isLoggedIn={!!user} hasPurchased={hasPurchased} />
      </section>

      {/* Related Products */}
      {relatedProducts && relatedProducts.length > 0 && (
        <section className="mt-16 border-t border-[#E8DFC8] pt-10">
          <h2 className="text-xl font-heading font-semibold text-[#1A1A1A] mb-6">You may also like</h2>
          <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide">
            {relatedProducts.map((rp: any) => {
              const rpImg = rp.product_images?.find((i: any) => i.is_cover || i.is_primary) || rp.product_images?.[0]
              const rpVariant = rp.product_variants?.[0]
              const rpPrice = rpVariant?.price || 0
              const rpMrp = rpVariant?.mrp || null
              const rpDiscount = rpMrp && rpMrp > rpPrice ? Math.round(((rpMrp - rpPrice) / rpMrp) * 100) : 0
              const rpImg1 = rpImg?.url || (rpImg?.cloudinary_public_id
                ? `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/f_auto,q_auto,w_300/${rpImg.cloudinary_public_id}`
                : null)
              return (
                <Link
                  key={rp.id}
                  href={`/products/${rp.slug}`}
                  className="flex-shrink-0 w-[180px] group"
                >
                  <div className="aspect-[3/4] bg-[#FAF5E9] rounded-sm overflow-hidden relative mb-2.5">
                    {rpImg1 ? (
                      <Image 
                        src={rpImg1} 
                        alt={rp.name} 
                        fill
                        sizes="180px"
                        className="object-cover transition-transform duration-500 group-hover:scale-105" 
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#E8DFC8] text-xs">No image</div>
                    )}
                    {rpDiscount > 0 && (
                      <span className="absolute top-2 left-2 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5">{rpDiscount}% OFF</span>
                    )}
                  </div>
                  <p className="text-xs font-medium text-[#1A1A1A] line-clamp-2 group-hover:text-[#c9a84c] transition-colors">{rp.name}</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-sm font-bold text-[#1A1A1A]">₹{rpPrice.toLocaleString('en-IN')}</span>
                    {rpMrp && rpMrp > rpPrice && <span className="text-xs text-[#6B6B5A] line-through">₹{rpMrp.toLocaleString('en-IN')}</span>}
                  </div>
                </Link>
              )
            })}
          </div>
        </section>
      )}
    </div>
  );
}



export async function generateStaticParams() {
  // Cannot use createClient() here as it reads cookies — use direct fetch instead
  const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/products?select=slug&is_active=eq.true`;
  const res = await fetch(url, {
    headers: {
      apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
      Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''}`,
    },
  });
  if (!res.ok) return [];
  const data: { slug: string }[] = await res.json();
  return data.map(({ slug }) => ({ slug }));
}

export const revalidate = 60;
