import type { SupabaseClient } from '@supabase/supabase-js';

export type CollectionFilter = {
  slug: string;
  name: string;
  collectionId?: string;
  categoryId?: string;
  tagSlugs: string[];
};

/** Related category slugs when collection naming differs (kurti-sets vs kurta-sets). */
const CATEGORY_SLUG_ALIASES: Record<string, string[]> = {
  'kurti-sets': ['kurta-sets'],
  'kurta-sets': ['kurti-sets'],
};

/**
 * Resolves a storefront collection slug to product filter criteria.
 * Matches collections table, categories table, tags, and known slug aliases.
 */
export async function resolveCollectionFilter(
  supabase: SupabaseClient,
  slug: string
): Promise<CollectionFilter | null> {
  const tagSlugs = new Set<string>([slug]);
  let name = slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  let collectionId: string | undefined;
  let categoryId: string | undefined;

  const { data: collection } = await supabase
    .from('collections')
    .select('id, name, slug')
    .eq('slug', slug)
    .eq('visible', true)
    .maybeSingle();

  if (collection) {
    name = collection.name;
    collectionId = collection.id;
    tagSlugs.add(collection.slug);
  }

  const categorySlugs = [slug, ...(CATEGORY_SLUG_ALIASES[slug] ?? [])];
  for (const categorySlug of categorySlugs) {
    const { data: category } = await supabase
      .from('categories')
      .select('id, name, slug')
      .eq('slug', categorySlug)
      .eq('is_active', true)
      .maybeSingle();

    if (category) {
      if (!collection) name = category.name;
      categoryId = category.id;
      tagSlugs.add(category.slug);
    }
  }

  if (!collectionId && !categoryId) {
    return { slug, name, tagSlugs: [...tagSlugs] };
  }

  return { slug, name, collectionId, categoryId, tagSlugs: [...tagSlugs] };
}

/** Applies OR filters for collection_id, category_id, and tag slugs. */
export function applyCollectionFilter<T extends { or: (filters: string) => T }>(
  query: T,
  filter: CollectionFilter
): T {
  const parts: string[] = [];

  if (filter.collectionId) {
    parts.push(`collection_id.eq.${filter.collectionId}`);
  }
  if (filter.categoryId) {
    parts.push(`category_id.eq.${filter.categoryId}`);
  }
  for (const tag of filter.tagSlugs) {
    parts.push(`tags.cs.{${tag}}`);
  }

  if (parts.length === 0) return query;
  return query.or(parts.join(','));
}
