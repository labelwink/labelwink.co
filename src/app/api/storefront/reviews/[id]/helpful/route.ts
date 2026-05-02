import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  if (!id) return NextResponse.json({ error: 'Review id required' }, { status: 400 })

  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('reviews')
    .update({ helpful_count: supabase.rpc('increment_helpful', { row_id: id }) as any })
    .eq('id', id)
    .select('helpful_count')
    .single()

  // Fallback: manual increment if RPC unavailable
  if (error) {
    const { data: current } = await supabase
      .from('reviews').select('helpful_count').eq('id', id).single()

    const { data: updated, error: updateErr } = await supabase
      .from('reviews')
      .update({ helpful_count: (current?.helpful_count ?? 0) + 1 })
      .eq('id', id)
      .select('helpful_count')
      .single()

    if (updateErr) return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
    return NextResponse.json({ helpful_count: updated?.helpful_count ?? 0 })
  }

  return NextResponse.json({ helpful_count: data?.helpful_count ?? 0 })
}
