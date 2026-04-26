import { ProductCard } from '@/components/product/ProductCard';
import Link from 'next/link';

interface NewArrivalsProps {
  products: any[];
}

export function NewArrivals({ products }: NewArrivalsProps) {
  if (!products || products.length === 0) return null;

  return (
    <section className="py-16 bg-[#f5f0e8]">
      <div className="text-center mb-10 px-4">
        <p className="text-[10px] md:text-xs tracking-[0.3em] text-[#c9a84c] mb-2 font-medium">
          Fresh Every Week
        </p>
        <h2 className="font-serif text-3xl text-[#1a3a34]">New Arrivals</h2>
        <p className="text-gray-500 mt-2 text-sm">Step into elegance with our latest ethnic wear</p>
      </div>

      {/* Horizontal scroll on mobile, 4-col grid on desktop */}
      <div className="flex gap-4 overflow-x-auto pb-4 px-4 snap-x snap-mandatory md:grid md:grid-cols-4 md:overflow-visible md:px-8 md:max-w-7xl md:mx-auto scrollbar-hide">
        {products.map((product) => {
          const variant = product.product_variants?.[0];
          const primaryImage =
            product.product_images?.find((img: any) => img.is_primary || img.is_cover) ||
            product.product_images?.[0];
          const imgPublicId = primaryImage?.cloudinary_public_id && !primaryImage.cloudinary_public_id.startsWith('http')
            ? primaryImage.cloudinary_public_id
            : null
          const imgUrl = primaryImage?.url || primaryImage?.cloudinary_public_id || ''

          return (
            <div key={product.id} className="snap-start min-w-[220px] md:min-w-0">
              <ProductCard
                id={product.id}
                name={product.name}
                slug={product.slug}
                basePrice={product.price || variant?.price || 0}
                compareAtPrice={product.mrp || variant?.mrp || null}
                publicId={imgPublicId || (imgUrl.startsWith('http') ? imgUrl : undefined)}
                image={imgUrl}
                isNewArrival={true}
              />
            </div>
          );
        })}
      </div>

      <div className="text-center mt-8 px-4">
        <Link
          href="/products"
          className="inline-block border border-[#1a3a34] text-[#1a3a34] px-8 py-3 text-sm tracking-widest hover:bg-[#1a3a34] hover:text-white transition-colors rounded-sm"
        >
          View All Products
        </Link>
      </div>
    </section>
  );
}
