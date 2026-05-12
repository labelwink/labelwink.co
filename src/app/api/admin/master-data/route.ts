import { requireAdmin } from '@/lib/requireAdmin'
import { createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// Legacy endpoint — ProductForm now uses /api/admin/attributes instead.
// This is kept for backward compatibility.
export async function GET(req: NextRequest) {
  const guard = await requireAdmin()
  if (guard instanceof NextResponse) return guard

  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('product_attributes')
    .select('id, type, value, label, sort_order')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const grouped: Record<string, Array<{id: string; value: string; label: string}>> = {
    sizes: [], colors: [], fabrics: [], sleeve_types: [],
    occasions: [], fits: [], patterns: [], customs: [],
  }

  const map: Record<string, string> = {
    size: 'sizes', color: 'colors', fabric: 'fabrics',
    sleeve_type: 'sleeve_types', occasion: 'occasions',
    fit: 'fits', pattern: 'patterns', custom: 'customs',
  }

  data?.forEach(attr => {
    const key = map[attr.type]
    if (key) grouped[key].push({ id: attr.id, value: attr.value, label: attr.label })
  })

  return NextResponse.json(grouped)
}
