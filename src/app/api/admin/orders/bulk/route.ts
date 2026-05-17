import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/requireAdmin'

export async function POST(req: NextRequest) {
  const guard = await requireAdmin()
  if (guard instanceof NextResponse) return guard

  const supabase = createAdminClient()
  try {
    const { action, order_ids } = await req.json()
    if (!Array.isArray(order_ids) || order_ids.length === 0 || order_ids.length > 50) {
      return NextResponse.json({ error: 'Provide 1 to 50 order IDs' }, { status: 400 })
    }

    const validActions = ['confirm', 'pack', 'cancel']
    if (!validActions.includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    const targetStatusMap: Record<string, string> = {
      confirm: 'confirmed',
      pack: 'packed',
      cancel: 'cancelled'
    }

    const targetStatus = targetStatusMap[action]
    const failed: Array<{ order_id: string; error: string }> = []
    let successCount = 0

    for (const id of order_ids) {
      const { data: order, error: fetchErr } = await supabase.from('orders').select('status, invoices(invoice_number)').eq('id', id).single()
      if (fetchErr || !order) {
        failed.push({ order_id: id, error: 'Not found' })
        continue
      }
      
      const { error: updateErr } = await supabase.from('orders').update({ status: targetStatus, updated_at: new Date().toISOString() }).eq('id', id)
      if (updateErr) {
        failed.push({ order_id: id, error: updateErr.message })
        continue
      }

      await supabase.from('order_status_history').insert({
        order_id: id,
        status: targetStatus,
        changed_by: 'admin',
        note: `Bulk ${action}`
      })

      const invoice_number = order.invoices?.[0]?.invoice_number || 'PENDING'
      await supabase.from('admin_notifications').insert({
        type: 'order_status_update',
        title: 'Order Status Updated',
        message: `Order ${invoice_number} → ${targetStatus} (Bulk)`,
        metadata: { entity_type: 'order', entity_id: id, order_id: id }
      })
      successCount++
    }

    return NextResponse.json({ success_count: successCount, failed })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
