export function generateSKU(slug?: string, size?: string): string {
  const slugPart = slug?.slice(0, 8).toUpperCase() ?? 'PROD'
  const sizePart = size?.toUpperCase() ?? 'STD'
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).slice(2, 6).toUpperCase()
  return `LW-${slugPart}-${sizePart}-${timestamp}-${random}`.slice(0, 40)
}

export async function generateUniqueSKU(supabase: any, slug: string, size: string): Promise<string> {
  let attempts = 0
  const MAX_ATTEMPTS = 5
  
  while (attempts < MAX_ATTEMPTS) {
    const sku = generateSKU(slug, size)
    const { data } = await supabase
      .from('product_variants')
      .select('id')
      .eq('sku', sku)
      .maybeSingle()
      
    if (!data) return sku
    attempts++
  }
  
  // Fallback to absolute unique if somehow the above fails
  return `LW-ALT-${Date.now()}-${Math.random().toString(36).substring(2, 10).toUpperCase()}`
}
