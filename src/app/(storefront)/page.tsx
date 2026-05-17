import Image from 'next/image';
import Link from 'next/link';
import { Suspense } from 'react';
import type { Metadata } from 'next';
import { Truck, RotateCcw, Lock, Sparkles } from 'lucide-react';
import { LeafPattern } from '@/components/ui/LeafPattern';
import { cloudinaryOptimize } from '@/lib/utils/cloudinary';

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || '';
  try {
    const res = await fetch(`${baseUrl}/api/storefront/settings`, { next: { revalidate: 3600 } });
    const settings = res.ok ? await res.json() : null;
    const storeName = settings?.store_name || 'LabelWink';
    const tagLine = settings?.store_tagline || 'Modern Ethnic Fashion for Women';
    return {
      title: {
        absolute: `${storeName} | ${tagLine}`
      },
      description: tagLine,
    };
  } catch {
    return {
      title: {
        absolute: 'LabelWink | Modern Ethnic Fashion'
      }
    };
  }
}

async function getHomepageData() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '');
  try {
    const [settingsRes, bannersRes, featuredProductsRes, collectionsRes, newArrivalsRes, sectionsRes] = await Promise.all([
      fetch(`${baseUrl}/api/storefront/settings`, { next: { revalidate: 60 } }),
      fetch(`${baseUrl}/api/storefront/banners`, { next: { revalidate: 60 } }),
      fetch(`${baseUrl}/api/storefront/products?featured=true&limit=8`, { next: { revalidate: 60 } }),
      fetch(`${baseUrl}/api/storefront/collections`, { next: { revalidate: 60 } }),
      fetch(`${baseUrl}/api/storefront/products?sort=newest&limit=8`, { next: { revalidate: 60 } }),
      fetch(`${baseUrl}/api/storefront/sections`, { next: { revalidate: 60 } }),
    ]);

    const settings         = settingsRes.ok ? await settingsRes.json() : {};
    const banners          = bannersRes.ok ? await bannersRes.json() : [];
    const featuredData     = featuredProductsRes.ok ? await featuredProductsRes.json() : {};
    const collections      = collectionsRes.ok ? await collectionsRes.json() : [];
    const newArrivalsData  = newArrivalsRes.ok ? await newArrivalsRes.json() : {};
    const sections         = sectionsRes.ok ? await sectionsRes.json() : [];

    const featuredProducts = featuredData.products || featuredData || [];
    const newArrivals      = newArrivalsData.products || newArrivalsData || [];

    return { settings, banners, featuredProducts, collections, newArrivals, sections };
  } catch (err) {
    console.error('Homepage fetch error:', err);
    return { settings: {}, banners: [], featuredProducts: [], collections: [], newArrivals: [], sections: [] };
  }
}

function ProductCard({ product }: { product: any }) {
  const isNew = product.created_at && (Date.now() - new Date(product.created_at).getTime()) < 7 * 24 * 60 * 60 * 1000;
  const hasDiscount = product.compare_at_price && product.compare_at_price > product.price;
  const discount = hasDiscount ? Math.round((1 - product.price / product.compare_at_price) * 100) : 0;

  return (
    <Link
      href={`/products/${product.slug}`}
      className="product-card-hover group"
      style={{
        background: 'var(--labelwink-cream-card, #FAF5E9)', 
        borderRadius: '12px',
        border: '1px solid var(--labelwink-cream-border, #E8DFC8)', 
        overflow: 'hidden',
        textDecoration: 'none', 
        display: 'block',
        transition: 'all 300ms',
        cursor: 'pointer',
      }}
    >
      {/* Image */}
      <div style={{ position: 'relative', aspectRatio: '3/4', background: '#FAF5E9', overflow: 'hidden' }}>
        {product.product_images?.[0]?.url ? (
          <Image
            src={cloudinaryOptimize(product.product_images[0].url)}
            alt={product.product_images[0].alt || product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            style={{ objectFit: 'cover' }}
          />
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#E8DFC8' }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <path d="M16 10a4 4 0 01-8 0"/>
            </svg>
          </div>
        )}
        {/* Badges */}
        {isNew && (
          <span style={{
            position: 'absolute', top: '8px', left: '8px',
            background: 'rgba(201,168,76,0.9)', color: '#FDF8F0',
            fontSize: '10px', fontWeight: 700, padding: '3px 8px', borderRadius: '4px',
          }}>NEW</span>
        )}
        {hasDiscount && (
          <span style={{
            position: 'absolute', top: '8px', right: '8px',
            background: 'rgba(74,222,128,0.9)', color: '#FDF8F0',
            fontSize: '10px', fontWeight: 700, padding: '3px 8px', borderRadius: '4px',
          }}>SALE</span>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: '12px 16px 16px' }}>
        {product.collection_name && (
          <p style={{ fontSize: '11px', color: '#6B6B5A', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
            {product.collection_name}
          </p>
        )}
        <p style={{ fontSize: '14px', fontWeight: 500, color: '#1C3829', marginBottom: '8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {product.name}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '16px', fontWeight: 600, color: '#1C3829' }}>₹{product.price?.toLocaleString('en-IN')}</span>
          {hasDiscount && (
            <>
              <span style={{ fontSize: '13px', color: '#6B6B5A', textDecoration: 'line-through' }}>₹{product.compare_at_price?.toLocaleString('en-IN')}</span>
              <span style={{ fontSize: '12px', color: '#4ade80', fontWeight: 500 }}>{discount}% off</span>
            </>
          )}
        </div>
      </div>
    </Link>
  );
}

export default async function Home() {
  const { settings, banners, featuredProducts, collections, newArrivals } = await getHomepageData();

  const banner = Array.isArray(banners) ? banners.find((b: any) => b.is_active) || banners[0] : null;
  const returnDays = settings?.return_window_days || 7;

  return (
    <main style={{ minHeight: '100vh', background: '#FDF8F0' }}>
      <style dangerouslySetInnerHTML={{ __html: `
        .product-card-hover:hover {
          border-color: #c9a84c !important;
          transform: translateY(-4px);
          shadow: 0 10px 30px -10px rgba(28, 56, 41, 0.1);
        }
        .collection-card:hover {
          transform: scale(1.01);
          border-bottom: 2px solid #c9a84c !important;
        }
      `}} />

      {/* SECTION 1: Hero Banner */}
      <section className="w-full">
        <img
          src={cloudinaryOptimize("https://res.cloudinary.com/dcmbwtreb/image/upload/v1778707316/new_Landscape_Poster_1_a3dxgc.png", "f_auto,q_auto:best,w_1920")}
          alt="Better Together - LabelWink Hero Banner"
          className="w-full h-auto block"
          style={{ display: 'block' }}
        />

        <div className="relative z-10 pb-12 md:pb-16 lg:pb-20">
          <div className="mx-auto max-w-[1200px] text-center">
            <div className="flex flex-wrap gap-4 justify-center">
              {banner?.cta_text && (
                <Link
                  href={banner.cta_link && banner.cta_link !== '#' ? banner.cta_link : '/products'}
                  className="bg-labelwink-gold text-labelwink-green font-bold px-8 py-4 rounded-xl hover:bg-labelwink-gold-hover transition-all duration-300 shadow-xl uppercase tracking-widest text-xs inline-flex items-center"
                  style={{ textDecoration: 'none' }}
                >
                  {banner.cta_text}
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: Featured Collections */}
      {collections && collections.length > 0 && (
        <section id="collections" className="scroll-mt-20" style={{ padding: '64px 24px', maxWidth: '1400px', margin: '0 auto', position: 'relative' }}>
          <LeafPattern opacity={0.03} id="collections-pattern" />
          <div className="flex flex-col items-center text-center" style={{ marginBottom: '40px', position: 'relative', zIndex: 1, width: '100%' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 600, color: '#1C3829', marginBottom: '8px' }}>Shop by Collection</h2>
            <p style={{ fontSize: '14px', color: '#6B6B5A' }}>Explore our curated collections</p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {collections.slice(0, 6).map((c: any) => (
              <Link
                key={c.id}
                href={`/products?collection=${encodeURIComponent(c.slug ?? c.id)}`}
                className="collection-card relative aspect-square rounded-xl overflow-hidden cursor-pointer group"
                style={{
                  display: 'block', textDecoration: 'none',
                  transition: 'transform 200ms',
                }}
              >
                {c.image_url || c.banner_image_url ? (
                  <Image
                    src={c.image_url || c.banner_image_url}
                    alt={c.name}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 25vw"
                    style={{ objectFit: 'cover' }}
                  />
                ) : (
                  <div style={{
                    position: 'absolute', inset: 0,
                    background: 'linear-gradient(135deg, #FAF5E9 0%, #E8DFC8 100%)',
                  }} />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <h3 className="absolute bottom-4 left-4 text-white font-semibold text-lg group-hover:text-[#C9A84C] transition-colors" style={{ margin: 0 }}>
                  {c.name}
                </h3>
              </Link>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: '32px' }}>
            <Link
              href="/products"
              className="border border-labelwink-green text-labelwink-green px-8 py-3 rounded-lg hover:bg-labelwink-green hover:text-white transition-all duration-300 font-bold uppercase tracking-widest text-xs"
              style={{ display: 'inline-flex', alignItems: 'center', textDecoration: 'none' }}
            >
              View All Collections
            </Link>
          </div>
        </section>
      )}

      {/* SECTION 3: Featured Products */}
      {featuredProducts && featuredProducts.length > 0 && (
        <section style={{ padding: '64px 24px', background: '#FDF8F0', position: 'relative' }}>
          <LeafPattern opacity={0.03} id="featured-pattern" />
          <div style={{ maxWidth: '1400px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h2 style={{ fontSize: '24px', fontWeight: 600, color: '#1C3829', marginBottom: '4px' }}>Featured Pieces</h2>
                <p style={{ fontSize: '14px', color: '#6B6B5A' }}>Handpicked for you</p>
              </div>
              <Link href="/products?featured=true" style={{ fontSize: '14px', color: '#c9a84c', textDecoration: 'none', fontWeight: 500 }}>
                View All →
              </Link>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' }}>
              {featuredProducts.slice(0, 8).map((p: any) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* SECTION 4: Trust Badges */}
      <section style={{ padding: '48px 24px', borderTop: '1px solid #E8DFC8', borderBottom: '1px solid #E8DFC8', background: '#FDF8F0' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '32px' }}>
            {[
              { icon: <Truck size={28} />, title: 'Fast Delivery', subtitle: 'Standard shipping applies' },
              { icon: <RotateCcw size={28} />, title: `${returnDays}-day Easy Returns`, subtitle: 'Hassle-free returns' },
              { icon: <Lock size={28} />, title: 'Secure Payments', subtitle: 'Razorpay protected' },
              { icon: <Sparkles size={28} />, title: 'Handpicked Quality', subtitle: 'Curated collection' },
            ].map((b, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '12px' }}>
                <div style={{ color: '#c9a84c' }}>{b.icon}</div>
                <div>
                  <p style={{ fontSize: '14px', fontWeight: 600, color: '#1C3829', marginBottom: '4px' }}>{b.title}</p>
                  <p style={{ fontSize: '12px', color: '#6B6B5A' }}>{b.subtitle}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 5: New Arrivals */}
      {newArrivals && newArrivals.length > 0 && (
        <section style={{ padding: '64px 24px', background: '#FDF8F0', position: 'relative' }}>
          <LeafPattern opacity={0.03} id="new-arrivals-pattern" />
          <div style={{ maxWidth: '1400px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h2 style={{ fontSize: '24px', fontWeight: 600, color: '#1C3829', marginBottom: '4px' }}>New Arrivals</h2>
                <p style={{ fontSize: '14px', color: '#6B6B5A' }}>Fresh additions to our collection</p>
              </div>
              <Link href="/products?sort=newest" style={{ fontSize: '14px', color: '#c9a84c', textDecoration: 'none', fontWeight: 500 }}>
                View All →
              </Link>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' }}>
              {newArrivals.slice(0, 8).map((p: any) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Empty state if no content at all */}
      {(!banners || banners.length === 0) && (!featuredProducts || featuredProducts.length === 0) && (!newArrivals || newArrivals.length === 0) && (
        <section style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', padding: '64px 24px', textAlign: 'center' }}>
          <h1 style={{ fontSize: '32px', fontWeight: 600, color: '#1C3829', marginBottom: '12px' }}>Welcome to LabelWink</h1>
          <p style={{ fontSize: '16px', color: '#6B6B5A', marginBottom: '32px' }}>
            Add banners, collections, or products in Admin → CMS to populate this page.
          </p>
          <Link href="/admin" style={{
            display: 'inline-flex', alignItems: 'center',
            height: '44px', padding: '0 24px', borderRadius: '8px',
            background: '#FAF5E9', color: '#1C3829',
            fontWeight: 500, fontSize: '14px', textDecoration: 'none',
            border: '1px solid #E8DFC8',
          }}>
            Go to Admin
          </Link>
        </section>
      )}
    </main>
  );
}
