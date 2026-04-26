import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'
type Ctx = { params: Promise<{ id: string; size: string }> }

/** PATCH /api/admin/products/[id]/variants/[size] — update stock_qty (and optionally sku) */
export async function PATCH(req: NextRequest, { params }: Ctx) {
  const { id, size } = await params
  const decodedSize  = decodeURIComponent(size)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase     = createAdminSupabaseClient() as any
  const body         = await req.json()

  const allowed: Record<string, unknown> = {}
  if ('stock_qty'          in body) allowed.stock_qty          = Number(body.stock_qty)
  if ('sku'                in body) allowed.sku                = body.sku
  if ('low_stock_threshold' in body) allowed.low_stock_threshold = Number(body.low_stock_threshold)

  const { data, error } = await supabase
    .from('product_variants')
    .update(allowed)
    .eq('product_id', id)
    .eq('size', decodedSize)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
