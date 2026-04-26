import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

// POST: bulk update is_featured and sort_order for collections
// Body: Array<{ id: string; is_featured: boolean; sort_order: number }>
export async function POST(req: NextRequest) {
  const supabase = createAdminClient()
  const items: { id: string; is_featured: boolean; sort_order: number }[] = await req.json()

  const updates = await Promise.all(
    items.map(({ id, is_featured, sort_order }) =>
      supabase
        .from('collections')
        .update({ is_featured, sort_order } as any)
        .eq('id', id)
    )
  )

  const failed = updates.filter(r => r.error)
  if (failed.length > 0) {
    return NextResponse.json({ error: failed[0].error?.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
