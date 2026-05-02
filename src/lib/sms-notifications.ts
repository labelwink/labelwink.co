import { sendSMS } from './msg91';
import { createAdminClient } from './supabase/server';

async function shouldSendSMS(event: string): Promise<boolean> {
  try {
    const supabaseAdmin = createAdminClient();
    const { data: settings } = await supabaseAdmin.from('shop_settings').select('*').single();
    if (!settings || !settings.sms_enabled) return false;

    if (event === 'order_placed') return !!settings.sms_order_placed;
    if (event === 'order_dispatched') return !!settings.sms_order_dispatched;
    if (event === 'order_delivered') return !!settings.sms_order_delivered;
    return false;
  } catch (err) {
    console.error('Error checking SMS settings:', err);
    return false;
  }
}

async function logSMS(phone: string, message_type: string, status: string, provider_response: any) {
  try {
    const supabaseAdmin = createAdminClient();
    await supabaseAdmin.from('sms_logs').insert({
      phone,
      message_type,
      status,
      provider_response
    });
  } catch (err) {
    console.error('Failed to log SMS:', err);
  }
}

export async function sendOrderPlacedSMS(phone: string, data: { customer_name: string, order_id: string, invoice_number: string, total: number, store_name: string }): Promise<void> {
  try {
    if (!(await shouldSendSMS('order_placed'))) return;
    const message = `Hi ${data.customer_name}! Your order ${data.invoice_number} for ₹${data.total} is confirmed. Thank you for shopping with ${data.store_name}!`;
    
    // sendSMS from msg91.ts expects templateVars, but the prompt says sendSMS(phone, { message, type: 'order_placed' })
    // Let's look at sendSMS in msg91.ts: export async function sendSMS(phone: string, templateVars: Record<string, string>): Promise<void>
    // It doesn't return anything. Wait, msg91.ts sendSMS returns void. I need to handle it.
    // Actually, I'll pass { message } to templateVars.
    await sendSMS(phone, { message });
    await logSMS(phone, 'order_placed', 'sent', { success: true, via: 'MSG91 Flow API' });
  } catch (err: any) {
    console.error('Error sending Order Placed SMS:', err);
    await logSMS(phone, 'order_placed', 'failed', { error: err.message });
  }
}

export async function sendOrderDispatchedSMS(phone: string, data: { customer_name: string, invoice_number: string, tracking_number: string, store_name: string }): Promise<void> {
  try {
    if (!(await shouldSendSMS('order_dispatched'))) return;
    const message = `Hi ${data.customer_name}! Your order ${data.invoice_number} has been dispatched. AWB: ${data.tracking_number}. Track at shiprocket.co/tracking/${data.tracking_number}`;
    await sendSMS(phone, { message });
    await logSMS(phone, 'order_dispatched', 'sent', { success: true });
  } catch (err: any) {
    console.error('Error sending Order Dispatched SMS:', err);
    await logSMS(phone, 'order_dispatched', 'failed', { error: err.message });
  }
}

export async function sendOrderDeliveredSMS(phone: string, data: { customer_name: string, invoice_number: string, store_name: string }): Promise<void> {
  try {
    if (!(await shouldSendSMS('order_delivered'))) return;
    const message = `Hi ${data.customer_name}! Your order ${data.invoice_number} has been delivered. We hope you love it! — ${data.store_name}`;
    await sendSMS(phone, { message });
    await logSMS(phone, 'order_delivered', 'sent', { success: true });
  } catch (err: any) {
    console.error('Error sending Order Delivered SMS:', err);
    await logSMS(phone, 'order_delivered', 'failed', { error: err.message });
  }
}
