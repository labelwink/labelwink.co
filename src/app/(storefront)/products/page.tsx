import { Metadata } from 'next'
import { ProductsPageClient } from '@/components/storefront/ProductsPageClient'
import { createClient } from '@/lib/supabase/server'

export async function generateMetadata({ searchParams }: { searchParams: Promise<{ collection?: string }> }): Promise<Metadata> {
  const resolvedSearchParams = await searchParams;
  const collectionSlug = resolvedSearchParams.collection;

  if (collectionSlug) {
    const supabase = await createClient();
    const { data: collection } = await supabase
      .from('collections')
      .select('name')
      .eq('slug', collectionSlug)
      .single();

    if (collection) {
      return {
        title: `${collection.name} Collection`,
        description: `Explore our exclusive ${collection.name} collection at LabelWink.`,
      };
    }
  }

  return {
    title: 'All Products',
    description: 'Browse our full collection of modern ethnic wear, dresses, and more.',
  };
}

export default async function ProductsPage({ searchParams }: { searchParams: Promise<{ collection?: string }> }) {
  const resolvedSearchParams = await searchParams;
  const collectionSlug = resolvedSearchParams.collection;
  
  let initialTitle = 'All Products';
  if (collectionSlug) {
    const supabase = await createClient();
    const { data: collection } = await supabase
      .from('collections')
      .select('name')
      .eq('slug', collectionSlug)
      .single();
    if (collection) initialTitle = `${collection.name} Collection`;
  }

  return <ProductsPageClient initialTitle={initialTitle} />;
}
