import Link from 'next/link';
import { ProductImage } from '@/components/storefront/ProductImage';
import { createClient } from '@/lib/supabase/server';

interface Collection {
  id: string;
  name: string;
  slug: string;
  image_cloudinary_id?: string;
  image_url?: string;
  description?: string;
  product_count?: number;
}

async function getCollections(): Promise<Collection[]> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from('collections')
      .select('id, name, slug, image_cloudinary_id, image_url, description')
      .eq('visible', true)
      .order('sort_order', { ascending: true })
      .limit(6);
    return data || [];
  } catch {
    return [];
  }
}

export async function CollectionsShowcase() {
  const collections = await getCollections();

  const placeholderSlots = Math.max(0, 3 - collections.length);

  return (
    <section className="py-16 px-4 md:px-8 bg-white">
      <div className="text-center mb-10">
        <p className="text-[10px] md:text-xs tracking-[0.3em] text-[#c9a84c] mb-2 font-medium">
          Shop by Category
        </p>
        <h2 className="font-serif text-3xl text-[#1a3a34]">Our Collections</h2>
        <p className="text-gray-500 mt-2 text-sm">Curated ethnic wear for every occasion</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-6xl mx-auto">
        {collections.map(col => (
          <Link
            key={col.id}
            href={`/collections/${col.slug}`}
            className="group relative overflow-hidden rounded-xl aspect-[3/4] block shadow-sm"
          >
            {col.image_cloudinary_id ? (
              <ProductImage
                publicId={col.image_cloudinary_id}
                alt={col.name}
                width={600}
                height={800}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                quality="auto:best"
                sizes="(max-width: 768px) 50vw, 33vw"
              />
            ) : col.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={col.image_url}
                alt={col.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            ) : (
              <div className="w-full h-full bg-[#1a3a34] flex items-center justify-center">
                <span className="text-[#c9a84c] text-5xl font-serif">LW</span>
              </div>
            )}
            <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/70 to-transparent" />
            <div className="absolute bottom-4 left-4 text-white">
              <p className="font-serif text-lg leading-tight">{col.name}</p>
              {col.product_count !== undefined && (
                <p className="text-xs text-white/70">{col.product_count} pieces</p>
              )}
            </div>
          </Link>
        ))}

        {/* Placeholder "More Coming Soon" cards */}
        {Array.from({ length: placeholderSlots }).map((_, i) => (
          <div
            key={`placeholder-${i}`}
            className="relative overflow-hidden rounded-xl aspect-[3/4] bg-[#1a3a34]/10 flex flex-col items-center justify-center border-2 border-dashed border-[#1a3a34]/20"
          >
            <span className="text-[#c9a84c] text-4xl font-serif mb-2">LW</span>
            <p className="text-[#1a3a34]/60 text-sm font-medium tracking-wide">More Coming Soon</p>
          </div>
        ))}
      </div>
    </section>
  );
}
