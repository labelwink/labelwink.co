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
      const { data: order, error: fetchErr } = await supabase.from('orders').select('status, order_number, user_id, invoices(invoice_number)').eq('id', id).single()
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
      if (order?.user_id) {
        try {
          const statusTitles: Record<string, string> = {
            confirmed: 'Order Confirmed ✅',
            packed: 'Order Packed 📦',
            cancelled: 'Order Cancelled ❌'
          };
          const statusMessages: Record<string, string> = {
            confirmed: `Your order #${order.order_number} has been confirmed!`,
            packed: `Your order #${order.order_number} has been packed and is ready to be shipped.`,
            cancelled: `Your order #${order.order_number} has been cancelled.`
          };
          await supabase.from('notifications').insert({
            user_id: order.user_id,
            type: `order_${targetStatus}`,
            title: statusTitles[targetStatus] || 'Order Updated',
            message: statusMessages[targetStatus] || `Your order #${order.order_number} status is now ${targetStatus}.`,
            data: { order_id: id, order_number: order.order_number }
          });
        } catch (custNotifErr) {
          console.error('Customer bulk status notification failed:', custNotifErr);
        }
      }
      successCount++
    }

    return NextResponse.json({ success_count: successCount, failed })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
