import { requireAdmin } from '@/lib/requireAdmin'
import { createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const guard = await requireAdmin()
  if (guard instanceof NextResponse) return guard

  const supabase = createAdminClient()

  const { data, error: dbError } = await supabase
    .from('product_attributes')
    .select('type, value, label')
    .eq('is_active', true)
    .order('display_order', { ascending: true })

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 })
  }

  // Group by type
  const grouped: Record<string, Array<{value: string, label: string}>> = {
    sizes: [],
    colors: [],
    fabrics: [],
    sleeves: [],
    occasions: [],
    fits: [],
  }

  data?.forEach(attr => {
    const typeKey = {
      size: 'sizes',
      color: 'colors',
      fabric: 'fabrics',
      sleeve_type: 'sleeves',
      occasion: 'occasions',
      fit: 'fits',
    }[attr.type] as keyof typeof grouped

    if (typeKey) {
      grouped[typeKey].push({
        value: attr.value,
        label: attr.label,
      })
    }
  })

  return NextResponse.json(grouped)
}
