import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { Star, Truck, ShieldCheck, RefreshCcw } from 'lucide-react';
import { ProductImage } from '@/components/storefront/ProductImage';
import { PincodeChecker } from '@/components/storefront/PincodeChecker';
import { ProductImageGallery } from '@/components/storefront/ProductImageGallery';
import { ProductActions } from '@/components/storefront/ProductActions';
import WriteReviewForm from '@/components/storefront/WriteReviewForm';
import Script from 'next/script';
import Link from 'next/link';


export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const resolvedParams = await params;
  const supabase = createClient();
  const { data: product } = await supabase
    .from('products')
    .select('name, description, seo_title, seo_description, og_image_cloudinary_id')
    .eq('slug', resolvedParams.slug)
    .single();

  if (!product) return { title: 'Product Not Found' };

  return {
    title: product.seo_title || `${product.name} | Label Wink`,
    description: product.seo_description || product.description,
    openGraph: {
      title: product.name,
      description: product.description || undefined,
      images: product.og_image_cloudinary_id ? [{ url: `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/${product.og_image_cloudinary_id}` }] : [],
    }
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  const supabase = createClient();

  // Fetch user session for WriteReviewForm
  const { data: { user } } = await supabase.auth.getUser();

  const { data: product, error } = await supabase
    .from('products')
    .select(`
      *,
      categories (id, name, slug),
      product_variants (*),
      product_images (*)
    `)
    .eq('slug', resolvedParams.slug)
    .eq('visible', true)
    .single();

  if (error || !product) notFound();

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
  // Fall back to product-level price/mrp if variant price is 0 or missing
  const displayPrice = firstVariant?.price || product.price || product.selling_price || null;
  const displayMrp = firstVariant?.mrp || product.mrp || product.compare_at_price || null;
  const discount = (displayMrp && displayPrice)
    ? Math.round(((displayMrp - displayPrice) / displayMrp) * 100) 
    : 0;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    brand: { '@type': 'Brand', name: 'Label Wink' },
    offers: {
      '@type': 'Offer',
      price: displayPrice,
      priceCurrency: 'INR',
      availability: firstVariant?.stock_qty > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://labelwink.com'}/products/${product.slug}`,
    },
    ...(reviews && reviews.length > 0 && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: Number(avgRating).toFixed(1),
        reviewCount: reviews.length,
        bestRating: 5,
        worstRating: 1,
      },
      review: reviews.slice(0, 5).map((r: any) => ({
        '@type': 'Review',
        reviewRating: {
          '@type': 'Rating',
          ratingValue: r.rating,
          bestRating: 5,
        },
        name: r.title || `${r.rating}-star review`,
        reviewBody: r.body,
        author: {
          '@type': 'Person',
          name: (r.profiles as { full_name?: string } | null)?.full_name || 'Verified Buyer',
        },
        datePublished: r.created_at?.slice(0, 10),
      })),
    }),
  };

  return (
    <div className="container mx-auto px-4 py-8 pb-28 md:pb-8">
      <Script
        id="product-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      
      <div className="text-[10px] tracking-[0.2em] text-muted-foreground uppercase mb-8 flex items-center gap-2">
        <Link href="/" className="hover:text-charcoal transition-colors">Home</Link> 
        <span className="opacity-40">/</span>
        {product.categories && (
          <>
            <Link href={`/collections/${product.categories.slug}`} className="hover:text-charcoal transition-colors">{product.categories.name}</Link>
            <span className="opacity-40">/</span>
          </>
        )}
        <span className="text-charcoal font-bold">{product.name}</span>
      </div>

      <div className="flex flex-col md:flex-row gap-6 md:gap-12 lg:gap-20 mb-20">
        <div className="w-full md:w-1/2">
          {product.product_images && product.product_images.length > 0 ? (
            <ProductImageGallery
              images={product.product_images}
              cloudName={process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || ''}
            />
          ) : (
            <div className="aspect-[3/4] bg-sage/5 rounded-2xl flex items-center justify-center text-gray-300">
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
            <h1 className="font-heading text-4xl md:text-5xl text-charcoal font-medium">{product.name}</h1>
            <div className="flex items-center gap-6">
              <div className="flex text-teal">
                {[1,2,3,4,5].map(i => <Star key={i} className={`w-4 h-4 ${i <= Number(avgRating) ? 'fill-current' : 'text-sage/30'}`} />)}
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground border-b border-sage/40 pb-0.5">{reviews?.length || 0} Reviews</span>
            </div>
          </div>

          <div className="flex items-baseline gap-4 border-b border-sage/10 pb-6">
            <span className="text-4xl font-heading font-bold text-charcoal">
              {displayPrice
                ? `₹${Number(displayPrice).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                : 'Price not available'}
            </span>
            {displayMrp && displayPrice && displayMrp > displayPrice && (
              <span className="text-xl text-muted-foreground line-through opacity-50">₹{Number(displayMrp).toLocaleString('en-IN')}</span>
            )}
          </div>

          {product.short_description && product.short_description.length > 3 && (
            <p className="text-charcoal/60 text-sm leading-relaxed">{product.short_description}</p>
          )}
          {product.description && product.description.length > 3 && (
            <div className="text-charcoal/70 leading-relaxed font-medium">{product.description}</div>
          )}

          {/* Stock status */}
          {(() => {
            const hasVariants = product.product_variants && product.product_variants.length > 0
            const allOutOfStock = hasVariants && product.product_variants.every((v: any) => v.stock_qty === 0)
            if (!hasVariants) return <p className="text-sm text-gray-500">Contact us for availability</p>
            if (allOutOfStock) return <p className="text-sm text-red-500 font-medium">Currently out of stock</p>
            return null
          })()}

          {/* Desktop ProductActions */}
          <div className="hidden md:block">
            <ProductActions
              productId={product.id}
              productName={product.name}
              productSlug={product.slug}
              variants={product.product_variants ?? []}
              publicId={product.product_images?.[0]?.cloudinary_public_id}
            />
          </div>

          {/* Mobile ProductActions */}
          <div className="md:hidden">
            <ProductActions
              productId={product.id}
              productName={product.name}
              productSlug={product.slug}
              variants={product.product_variants ?? []}
              publicId={product.product_images?.[0]?.cloudinary_public_id}
            />
          </div>

          <PincodeChecker />

          <div className="grid grid-cols-3 gap-4 pt-8 border-t border-sage/10 text-center">
            <div className="space-y-2"><Truck className="w-5 h-5 mx-auto text-teal" /><p className="text-[9px] font-bold uppercase tracking-tighter text-muted-foreground">Free Shipping</p></div>
            <div className="space-y-2"><RefreshCcw className="w-5 h-5 mx-auto text-teal" /><p className="text-[9px] font-bold uppercase tracking-tighter text-muted-foreground">Easy Returns</p></div>
            <div className="space-y-2"><ShieldCheck className="w-5 h-5 mx-auto text-teal" /><p className="text-[9px] font-bold uppercase tracking-tighter text-muted-foreground">Secure Pay</p></div>
          </div>

          <Accordion className="w-full border-t border-sage/10">
            <AccordionItem value="details" className="border-sage/10">
              <AccordionTrigger className="text-[10px] font-bold uppercase tracking-[0.2em] py-6 hover:no-underline">Product Details</AccordionTrigger>
              <AccordionContent className="text-charcoal/70 text-xs leading-relaxed space-y-4 pb-6">
                <p><strong className="text-charcoal font-bold uppercase tracking-widest text-[9px]">Fabric:</strong> {product.fabric || 'Premium Handcrafted Fabric'}</p>
                <p><strong className="text-charcoal font-bold uppercase tracking-widest text-[9px]">Care:</strong> {product.care_instructions || 'Hand wash cold or dry clean'}</p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>

        {/* Reviews Section */}
      <section className="mt-12 border-t border-sage/10 pt-10">
        <h2 className="text-2xl font-heading font-semibold mb-8 text-charcoal">Customer Reviews</h2>

        {reviews && reviews.length > 0 && (() => {
          const avg = Number(avgRating);
          // Rating distribution
          const dist = [5,4,3,2,1].map(star => ({
            star,
            count: reviews.filter((r: any) => r.rating === star).length,
          }));
          return (
            <div className="flex flex-col sm:flex-row gap-8 mb-10 p-6 bg-sage/5 rounded-2xl">
              {/* Big score */}
              <div className="flex flex-col items-center justify-center min-w-[100px]">
                <span className="text-6xl font-heading font-bold text-charcoal leading-none">{avg.toFixed(1)}</span>
                <div className="flex text-yellow-400 my-2">
                  {[1,2,3,4,5].map(i => (
                    <Star key={i} className={`w-4 h-4 ${i <= Math.round(avg) ? 'fill-current' : 'text-gray-200'}`} />
                  ))}
                </div>
                <span className="text-xs text-charcoal/50 font-semibold">{reviews.length} review{reviews.length !== 1 ? 's' : ''}</span>
              </div>
              {/* Distribution bars */}
              <div className="flex-1 space-y-2">
                {dist.map(({ star, count }) => {
                  const pct = reviews.length ? Math.round((count / reviews.length) * 100) : 0;
                  return (
                    <div key={star} className="flex items-center gap-3">
                      <span className="text-xs font-bold text-charcoal/60 w-4 text-right">{star}</span>
                      <Star className="w-3 h-3 fill-yellow-400 text-yellow-400 flex-shrink-0" />
                      <div className="flex-1 bg-sage/20 rounded-full h-2">
                        <div
                          className="bg-yellow-400 h-2 rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs text-charcoal/40 w-6 text-right">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}

        {/* Review list */}
        {reviews && reviews.length > 0 ? (
          <div className="space-y-0 divide-y divide-sage/10">
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
                  {r.title && <p className="font-semibold text-charcoal text-sm mt-1">{r.title}</p>}
                  {r.body && <p className="text-charcoal/70 text-sm mt-1.5 leading-relaxed">{r.body}</p>}
                  {r.admin_reply && (
                    <div className="mt-3 ml-4 pl-4 border-l-2 border-teal/30 bg-teal/5 rounded-r-lg py-2 pr-3">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-teal mb-1">Label Wink Reply</p>
                      <p className="text-sm text-charcoal/80 leading-relaxed">{r.admin_reply}</p>
                    </div>
                  )}
                  <p className="text-xs text-charcoal/40 mt-3">
                    {reviewerName} · {new Date(r.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-charcoal/50 italic mb-6">No reviews yet. Be the first to review this product!</p>
        )}

        {/* Write review form */}
        <WriteReviewForm productId={product.id} isLoggedIn={!!user} />
      </section>
    </div>
  );
}


export async function generateStaticParams() {
  // Cannot use createClient() here as it reads cookies — use direct fetch instead
  const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/products?select=slug&visible=eq.true`;
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
