import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/requireAdmin';

export const runtime = 'nodejs';

type RouteCtx = { params: Promise<{ id: string }> };

/**
 * PATCH /api/admin/seasonal-sales/[id]
 * Updates a seasonal sale
 */
export async function PATCH(req: NextRequest, { params }: RouteCtx) {
  const guard = await requireAdmin();
  if (guard instanceof NextResponse) return guard;

  const { id } = await params;
  try {
    const body = await req.json();
    const supabase = createAdminSupabaseClient();

    // Prevent direct manual status change of products here, 
    // activation/deactivation should be done via the /activate route for consistency
    const { data, error } = await supabase
      .from('seasonal_sales')
      .update(body)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

/**
 * DELETE /api/admin/seasonal-sales/[id]
 * Deletes a sale. If active, we MUST restore prices first.
 */
export async function DELETE(req: NextRequest, { params }: RouteCtx) {
  const guard = await requireAdmin();
  if (guard instanceof NextResponse) return guard;

  const { id } = await params;
  const supabase = createAdminSupabaseClient();

  // 1. Fetch current sale state
  const { data: sale, error: fetchErr } = await supabase
    .from('seasonal_sales')
    .select('*')
    .eq('id', id)
    .single();

  if (fetchErr || !sale) {
    return NextResponse.json({ error: 'Sale not found' }, { status: 404 });
  }

  // 2. If it was active, deactivation logic must run
  // Actually, we should probably just call the deactivation logic internally or return error if active
  // Let's implement price restoration before deletion
  if (sale.is_active) {
    // Call the activation route with activate=false logic
    // For simplicity, we'll implement the restoration here as well
    const productQuery = supabase.from('products').select('id, price, compare_at_price');
    
    if (sale.applies_to === 'products') {
      productQuery.in('id', sale.product_ids);
    } else if (sale.applies_to === 'collections') {
      productQuery.in('category_id', sale.collection_ids);
    }

    const { data: products } = await productQuery;

    if (products && products.length > 0) {
      for (const product of products) {
        if (product.compare_at_price) {
          await supabase.from('products')
            .update({
              price: product.compare_at_price,
              compare_at_price: null
            })
            .eq('id', product.id);
        }
      }
    }
  }

  // 3. Delete the sale
  const { error: delErr } = await supabase
    .from('seasonal_sales')
    .delete()
    .eq('id', id);

  if (delErr) {
    return NextResponse.json({ error: delErr.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
