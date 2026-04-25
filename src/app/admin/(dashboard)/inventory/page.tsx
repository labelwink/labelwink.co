import { createAdminClient } from '@/lib/supabase/server'
import InventoryClient from './InventoryClient'

export default async function InventoryPage() {
  const supabase = createAdminClient()

  const { data: products, error } = await supabase
    .from('products')
    .select(`
      id, name, 
      product_variants(id, size, color, sku, stock_qty, price)
    `)
    .order('name', { ascending: true })

  if (error) {
    return <div>Error loading inventory: {error.message}</div>
  }

  // Flatten the products and variants for the table
  const inventoryData = products?.flatMap(p => 
    (p.product_variants as any[]).map(v => ({
      id: v.id,
      productName: p.name,
      size: v.size,
      color: v.color,
      sku: v.sku || 'N/A',
      stock: v.stock_qty,
      price: v.price,
      productId: p.id
    }))
  ) || []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-heading font-semibold text-charcoal">Inventory / Stock</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage stock quantities for all product variants.</p>
      </div>

      <InventoryClient initialData={inventoryData} />
    </div>
  )
}
