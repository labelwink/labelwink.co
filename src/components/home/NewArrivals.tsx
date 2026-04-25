import { ProductCard } from '@/components/product/ProductCard';
import Link from 'next/link';

interface NewArrivalsProps {
  products: any[];
}

export function NewArrivals({ products }: NewArrivalsProps) {
  if (!products || products.length === 0) return null;

  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-end mb-12">
          <div className="text-center md:text-left w-full">
            <p className="text-eyebrow mb-3">Freshly Added</p>
            <h2 className="text-section-heading">New Arrivals</h2>
          </div>
          <Link 
            href="/collections/all" 
            className="text-sm font-semibold text-charcoal hover:text-teal transition-colors border-b border-charcoal/20 pb-1"
          >
            View All Products
          </Link>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-12 sm:gap-x-8">
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
                image={primaryImage?.cloudinary_public_id || ''}
                isNewArrival={product.tags?.includes('new')}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}
