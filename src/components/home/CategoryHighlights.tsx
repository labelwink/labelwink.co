import Link from 'next/link';
import { ProductImage } from '@/components/storefront/ProductImage';

interface Category {
  id: string;
  name: string;
  slug: string;
  image_cloudinary_id?: string;
}

interface CategoryHighlightsProps {
  categories: Category[];
}

export function CategoryHighlights({ categories }: CategoryHighlightsProps) {
  if (!categories || categories.length === 0) return null;

  return (
    <section className="py-20 bg-cream">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="font-heading text-4xl text-charcoal mb-4">Shop By Category</h2>
          <p className="text-charcoal/70">Explore our curated collections for every occasion</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((category) => (
            <Link 
              key={category.id} 
              href={`/collections/${category.slug}`}
              className="group block relative overflow-hidden aspect-[3/4] bg-sage/10 rounded-sm"
            >
              <div className="absolute inset-0 z-0">
                <ProductImage 
                  publicId={category.image_cloudinary_id || 'labelwink/categories/placeholder'} 
                  alt={category.name}
                  width={600}
                  height={800}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-charcoal/80 via-charcoal/20 to-transparent opacity-80 z-10" />
              <div className="absolute bottom-0 left-0 right-0 p-6 text-center z-20">
                <h3 className="font-heading text-2xl text-cream mb-2 tracking-wide">{category.name}</h3>
                <span className="text-xs tracking-widest text-cream uppercase border-b border-cream/50 pb-1 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0 inline-block">
                  Explore
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
