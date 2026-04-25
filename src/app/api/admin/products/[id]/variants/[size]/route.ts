import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; size: string }> }
) {
  const { id, size } = await params
  const supabase = createAdminClient()
  const body = await req.json()

  const { data, error } = await supabase
    .from('product_variants')
    .update({ stock_qty: body.stock_qty })
    .eq('product_id', id)
    .eq('size', decodeURIComponent(size))
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
