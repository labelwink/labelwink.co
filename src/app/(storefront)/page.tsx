import Image from 'next/image';
import Link from 'next/link';
import { Suspense } from 'react';
import type { Metadata } from 'next';
import { Truck, RotateCcw, Lock, Sparkles } from 'lucide-react';
import { LeafPattern } from '@/components/ui/LeafPattern';

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || '';
  try {
    const res = await fetch(`${baseUrl}/api/storefront/settings`, { next: { revalidate: 3600 } });
    const settings = res.ok ? await res.json() : null;
    return {
      title: settings?.store_name || 'LabelWink',
      description: settings?.store_tagline || 'Modern Ethnic Fashion for Women',
    };
  } catch {
    return { title: 'LabelWink | Modern Ethnic Fashion' };
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
      style={{
        background: '#FAF5E9', borderRadius: '12px',
        border: '1px solid #E8DFC8', overflow: 'hidden',
        textDecoration: 'none', display: 'block',
        transition: 'border-color 200ms, transform 200ms',
        cursor: 'pointer',
      }}
      className="product-card-hover"
    >
      {/* Image */}
      <div style={{ position: 'relative', aspectRatio: '3/4', background: '#FAF5E9', overflow: 'hidden' }}>
        {product.images?.[0] || product.image_url ? (
          <Image
            src={product.images?.[0] || product.image_url}
            alt={product.name}
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
  const freeShipping = settings?.free_shipping_above || settings?.free_shipping_threshold || 999;
  const returnDays = settings?.return_window_days || 7;

  return (
    <main style={{ minHeight: '100vh', background: '#FDF8F0' }}>
      <style dangerouslySetInnerHTML={{ __html: `
        .product-card-hover:hover {
          border-color: #c9a84c !important;
          transform: translateY(-2px);
        }
        .collection-card:hover {
          transform: scale(1.02);
          border-bottom: 3px solid #c9a84c !important;
        }
      `}} />

      {/* SECTION 1: Hero Banner */}
      <section style={{
        position: 'relative',
        height: 'min(90vh, 700px)',
        background: banner?.image_url ? 'transparent' : 'linear-gradient(135deg, #1C3829 0%, #24472F 60%, #1C3829 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden',
      }}>
        {banner?.image_url && (
          <Image
            src={banner.image_url}
            alt={banner.title || 'Hero Banner'}
            fill
            priority
            sizes="100vw"
            style={{ objectFit: 'cover', opacity: 0.7 }}
          />
        )}
        {/* Botanical pattern overlay */}
        <LeafPattern opacity={0.05} id="hero" />
        {/* Gradient overlay */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 1,
          background: banner?.image_url
            ? 'linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.5) 100%)'
            : 'linear-gradient(to bottom, rgba(28,56,41,0.4) 0%, rgba(28,56,41,0.2) 100%)',
        }} />

        {/* Hero content */}
        <div style={{
          position: 'relative', zIndex: 10, textAlign: 'center',
          padding: '0 24px', maxWidth: '700px',
        }}>
          <span style={{
            display: 'inline-block', marginBottom: '16px',
            fontSize: '12px', fontWeight: 500,
            textTransform: 'uppercase', letterSpacing: '0.15em',
            color: '#C9A84C',
          }}>
            {banner?.subtitle || 'Better Together'}
          </span>
          <h1 style={{
            fontSize: 'clamp(32px, 6vw, 64px)',
            fontWeight: 600, color: '#ffffff', lineHeight: 1.1,
            marginBottom: '16px',
          }}>
            {banner?.title || 'The New Season · 2026'}
          </h1>
          <p style={{
            fontSize: 'clamp(15px, 2vw, 18px)', color: 'rgba(253,248,240,0.85)',
            marginBottom: '32px', lineHeight: 1.6,
          }}>
            {banner?.description || 'From coffee dates to weekend getaways — your perfect pair starts with what you wear'}
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link
              href={banner?.cta_link || '/products'}
              className="bg-[#C9A84C] text-[#1C3829] font-semibold px-6 py-3 rounded-full hover:bg-[#D4B76A] transition-all duration-300"
              style={{ display: 'inline-flex', alignItems: 'center', textDecoration: 'none', fontSize: '15px' }}
            >
              {banner?.cta_text || 'Shop Now'}
            </Link>
            <Link
              href="/collections"
              className="border border-white text-white px-6 py-3 rounded-full hover:bg-white hover:text-[#1C3829] transition-all duration-300"
              style={{ display: 'inline-flex', alignItems: 'center', textDecoration: 'none', fontSize: '15px', fontWeight: 500 }}
            >
              View Collections
            </Link>
          </div>
        </div>
      </section>

      {/* SECTION 2: Featured Collections */}
      {collections && collections.length > 0 && (
        <section style={{ padding: '64px 24px', maxWidth: '1400px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 600, color: '#1C3829', marginBottom: '8px' }}>Shop by Collection</h2>
            <p style={{ fontSize: '14px', color: '#6B6B5A' }}>Explore our curated collections</p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {collections.slice(0, 6).map((c: any) => (
              <Link
                key={c.id}
                href={`/collections/${c.slug}`}
                className="collection-card relative aspect-square rounded-2xl overflow-hidden cursor-pointer group"
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
              href="/collections"
              className="border border-[#1C3829] text-[#1C3829] px-6 py-2.5 rounded-lg hover:bg-[#1C3829] hover:text-white transition-colors duration-300"
              style={{ display: 'inline-flex', alignItems: 'center', textDecoration: 'none', fontSize: '14px', fontWeight: 500 }}
            >
              View All Collections
            </Link>
          </div>
        </section>
      )}

      {/* SECTION 3: Featured Products */}
      {featuredProducts && featuredProducts.length > 0 && (
        <section style={{ padding: '64px 24px', background: '#FDF8F0' }}>
          <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h2 style={{ fontSize: '24px', fontWeight: 600, color: '#1C3829', marginBottom: '4px' }}>Featured Pieces</h2>
                <p style={{ fontSize: '14px', color: '#6B6B5A' }}>Handpicked for you</p>
              </div>
              <Link href="/products" style={{ fontSize: '14px', color: '#c9a84c', textDecoration: 'none', fontWeight: 500 }}>
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
              { icon: <Truck size={28} />, title: 'Fast Delivery', subtitle: 'On qualifying orders' },
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
        <section style={{ padding: '64px 24px', background: '#FDF8F0' }}>
          <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
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
