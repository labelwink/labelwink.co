import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/requireAdmin';
import { sendTelegramMessage } from '@/lib/telegram';

export const runtime = 'nodejs';

type RouteCtx = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: RouteCtx) {
  // Allow CRON_SECRET bypass for automated tasks
  const authHeader = req.headers.get('authorization');
  const isCron = authHeader === `Bearer ${process.env.CRON_SECRET}`;

  if (!isCron) {
    const guard = await requireAdmin();
    if (guard instanceof NextResponse) return guard;
  }

  const { id } = await params;
  try {
    const { activate } = await req.json();
    const supabase = createAdminSupabaseClient();

    // 1. Fetch sale details
    const { data: sale, error: fetchErr } = await supabase
      .from('seasonal_sales')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchErr || !sale) {
      return NextResponse.json({ error: 'Sale not found' }, { status: 404 });
    }

    if (sale.is_active === activate) {
      return NextResponse.json({ message: `Sale is already ${activate ? 'active' : 'inactive'}` });
    }

    // 2. Identify products to update
    const productQuery = supabase.from('products').select('id, price, compare_at_price');
    const variantQuery = supabase.from('product_variants').select('id, product_id, price, compare_at_price');

    if (sale.applies_to === 'products') {
      productQuery.in('id', sale.product_ids);
      variantQuery.in('product_id', sale.product_ids);
    } else if (sale.applies_to === 'collections') {
      // Assuming collection_ids are category_ids as verified in storefront
      productQuery.in('category_id', sale.collection_ids);
      
      // For variants, we need to join or find products first
      const { data: catProducts } = await supabase.from('products').select('id').in('category_id', sale.collection_ids);
      const productIds = (catProducts || []).map(p => p.id);
      variantQuery.in('product_id', productIds);
    } else if (sale.applies_to === 'all') {
      // No filter needed
    }

    const { data: products } = await productQuery;
    const { data: variants } = await variantQuery;

    if (!products || products.length === 0) {
      // Just update the sale status if no products found
      await supabase.from('seasonal_sales').update({ is_active: activate }).eq('id', id);
      return NextResponse.json({ success: true, message: 'No products affected' });
    }

    // 3. Batch update logic
    const discountFactor = 1 - (sale.discount_percent / 100);

    if (activate) {
      // ACTIVATE: Store current price in compare_at_price, apply discount to price
      for (const p of products) {
        // Only update if not already discounted (compare_at_price is null)
        if (!p.compare_at_price) {
          const newPrice = Math.round(p.price * discountFactor);
          await supabase.from('products')
            .update({ price: newPrice, compare_at_price: p.price })
            .eq('id', p.id);
        }
      }
      if (variants) {
        for (const v of variants) {
          if (!v.compare_at_price) {
            const newPrice = Math.round(v.price * discountFactor);
            await supabase.from('product_variants')
              .update({ price: newPrice, compare_at_price: v.price })
              .eq('id', v.id);
          }
        }
      }
    } else {
      // DEACTIVATE: Restore price from compare_at_price, clear compare_at_price
      for (const p of products) {
        if (p.compare_at_price) {
          await supabase.from('products')
            .update({ price: p.compare_at_price, compare_at_price: null })
            .eq('id', p.id);
        }
      }
      if (variants) {
        for (const v of variants) {
          if (v.compare_at_price) {
            await supabase.from('product_variants')
              .update({ price: v.compare_at_price, compare_at_price: null })
              .eq('id', v.id);
          }
        }
      }
    }

    // 4. Update sale record
    const { error: updateErr } = await supabase
      .from('seasonal_sales')
      .update({ is_active: activate })
      .eq('id', id);

    if (updateErr) throw new Error(updateErr.message);

    // 5. Notify
    const statusText = activate ? '🟢 ACTIVATED' : '🔴 DEACTIVATED';
    await sendTelegramMessage(
      `🛍️ <b>Seasonal Sale Update</b>\n\n` +
      `<b>Sale:</b> ${sale.name}\n` +
      `<b>Discount:</b> ${sale.discount_percent}%\n` +
      `<b>Status:</b> ${statusText}\n` +
      `<b>Affected Products:</b> ${products.length}\n` +
      `<b>Time:</b> ${new Date().toLocaleString('en-IN')}`
    );

    return NextResponse.json({ success: true, affected: products.length });
  } catch (err: any) {
    console.error('Activation error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
