import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/requireAdmin';

export const runtime = 'nodejs';

/**
 * GET /api/admin/seasonal-sales
 * Returns all seasonal sales ordered by start date
 */
export async function GET() {
  const guard = await requireAdmin();
  if (guard instanceof NextResponse) return guard;

  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from('seasonal_sales')
    .select('*')
    .order('starts_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

/**
 * POST /api/admin/seasonal-sales
 * Creates a new seasonal sale record
 */
export async function POST(req: NextRequest) {
  const guard = await requireAdmin();
  if (guard instanceof NextResponse) return guard;

  try {
    const body = await req.json();
    const { 
      name, 
      discount_percent, 
      applies_to, 
      collection_ids = [], 
      product_ids = [], 
      starts_at, 
      ends_at, 
      is_active = true 
    } = body;

    // Validation
    if (!name || !discount_percent || !starts_at || !ends_at) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const discount = Number(discount_percent);
    if (isNaN(discount) || discount < 1 || discount > 90) {
      return NextResponse.json({ error: 'Discount must be between 1% and 90%' }, { status: 400 });
    }

    const start = new Date(starts_at);
    const end = new Date(ends_at);
    const now = new Date();

    if (start >= end) {
      return NextResponse.json({ error: 'Starts at must be before ends at' }, { status: 400 });
    }

    if (end <= now) {
      return NextResponse.json({ error: 'Ends at must be in the future' }, { status: 400 });
    }

    const supabase = createAdminSupabaseClient();
    const { data, error } = await supabase
      .from('seasonal_sales')
      .insert([{
        name,
        discount_percent: discount,
        applies_to,
        collection_ids,
        product_ids,
        starts_at: start.toISOString(),
        ends_at: end.toISOString(),
        is_active
      }])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
