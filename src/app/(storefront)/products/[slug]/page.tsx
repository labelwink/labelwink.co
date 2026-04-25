import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { Share2, Star, Truck, ShieldCheck, RefreshCcw } from 'lucide-react';
import { ProductImage } from '@/components/storefront/ProductImage';
import { PincodeChecker } from '@/components/storefront/PincodeChecker';
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

  // Fetch reviews separately to avoid inner join issues
  const { data: reviews } = await supabase
    .from('reviews')
    .select('*, users(name)')
    .eq('product_id', product.id)
    .eq('status', 'approved')
    .order('created_at', { ascending: false });

  // Fetch related products
  const { data: relatedProducts } = await supabase
    .from('products')
    .select('id, name, slug, product_variants(*), product_images(*)')
    .eq('category_id', product.category_id)
    .eq('is_active', true)
    .neq('id', product.id)
    .limit(4);

  const avgRating = reviews?.length 
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
    : 0;

  const firstVariant = product.product_variants?.[0];
  const discount = (firstVariant?.mrp && firstVariant?.price)
    ? Math.round(((firstVariant.mrp - firstVariant.price) / firstVariant.mrp) * 100) 
    : 0;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    brand: { '@type': 'Brand', name: 'Label Wink' },
    offers: {
      '@type': 'Offer',
      price: firstVariant?.price,
      priceCurrency: 'INR',
      availability: firstVariant?.stock_qty > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock'
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20 mb-20">
        <div className="flex flex-col-reverse md:flex-row gap-6">
          <div className="flex md:flex-col gap-4 overflow-x-auto md:overflow-y-auto md:w-24 scrollbar-hide">
            {product.product_images?.map((img: any, i: number) => (
              <div key={i} className="w-20 md:w-24 aspect-[3/4] flex-shrink-0 bg-sage/5 border border-transparent hover:border-teal transition-all">
                <ProductImage publicId={img.cloudinary_public_id} alt="" width={100} height={130} className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
          <div className="flex-1 bg-sage/5 aspect-[3/4] relative overflow-hidden border border-sage/10">
            <ProductImage 
              publicId={product.product_images?.[0]?.cloudinary_public_id || 'labelwink/products/placeholder'} 
              alt={product.name} 
              width={1000} 
              height={1333} 
              className="w-full h-full object-cover animate-in fade-in duration-1000" 
              priority 
            />
            {discount > 0 && (
              <div className="absolute top-6 left-6">
                <span className="bg-destructive text-cream text-[11px] uppercase tracking-[0.2em] px-3 py-1.5 font-bold shadow-xl">
                  {discount}% OFF
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col space-y-10">
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
            <span className="text-4xl font-heading font-bold text-charcoal">₹{firstVariant?.price?.toLocaleString()}</span>
            {firstVariant?.mrp > firstVariant?.price && (
              <span className="text-xl text-muted-foreground line-through opacity-50">₹{firstVariant.mrp.toLocaleString()}</span>
            )}
          </div>

          <div className="text-charcoal/70 leading-relaxed italic font-medium">{product.description}</div>

          <div className="space-y-4">
            <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
              <span>Select Size</span>
              <button className="text-teal underline underline-offset-4">Size Guide</button>
            </div>
            <div className="flex flex-wrap gap-3">
              {product.product_variants?.map((v: any) => (
                <button key={v.id} className={`w-14 h-14 flex items-center justify-center text-xs font-bold transition-all border ${v.id === firstVariant?.id ? 'border-charcoal bg-charcoal text-cream' : 'border-sage/20 text-charcoal/60'}`}>{v.size}</button>
              ))}
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <Button className="flex-1 h-16 bg-charcoal text-cream rounded-none text-xs font-bold tracking-[0.3em] uppercase">Add To Cart</Button>
            <Button variant="outline" className="w-16 h-16 border-sage/30 text-charcoal rounded-none"><Share2 className="w-5 h-5" /></Button>
          </div>

          <PincodeChecker />

          <div className="grid grid-cols-3 gap-4 pt-8 border-t border-sage/10 text-center">
            <div className="space-y-2"><Truck className="w-5 h-5 mx-auto text-teal" /><p className="text-[9px] font-bold uppercase tracking-tighter text-muted-foreground">Free Shipping</p></div>
            <div className="space-y-2"><RefreshCcw className="w-5 h-5 mx-auto text-teal" /><p className="text-[9px] font-bold uppercase tracking-tighter text-muted-foreground">Easy Returns</p></div>
            <div className="space-y-2"><ShieldCheck className="w-5 h-5 mx-auto text-teal" /><p className="text-[9px] font-bold uppercase tracking-tighter text-muted-foreground">Secure Pay</p></div>
          </div>

          <Accordion type="single" collapsible className="w-full border-t border-sage/10">
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
    </div>
  );
}

export async function generateStaticParams() {
  const supabase = createClient();
  const { data } = await supabase.from('products').select('slug').eq('is_active', true);
  return data?.map(({ slug }) => ({ slug })) ?? [];
}

export const revalidate = 60;
