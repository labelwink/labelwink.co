import { createClient } from './server';

export async function getProducts(categorySlug?: string) {
  const supabase = await createClient();
  
  let query = supabase
    .from('products')
    .select(`
      *,
      product_variants (*),
      product_images (*)
    `)
    .eq('is_active', true);

  if (categorySlug && categorySlug !== 'all') {
    // Join with categories table to filter by slug
    const { data: category } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', categorySlug)
      .single();
    
    if (category) {
      query = query.eq('category_id', category.id);
    }
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching products:', error);
    return [];
  }

  return data;
}

export async function getProductBySlug(slug: string) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      product_variants (*),
      product_images (*)
    `)
    .eq('slug', slug)
    .single();

  if (error) {
    console.error('Error fetching product:', error);
    return null;
  }

  return data;
}
