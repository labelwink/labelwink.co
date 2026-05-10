import { sendSMS } from './msg91';
import { createAdminClient } from './supabase/server';

/** Fetch SMS-related keys from site_settings (key-value store) */
async function getSmsSettings(): Promise<Record<string, any>> {
  try {
    const supabase = createAdminClient();
    const keys = ['sms_enabled', 'sms_order_placed', 'sms_order_dispatched', 'sms_order_delivered'];
    const { data } = await supabase.from('site_settings').select('key, value').in('key', keys);
    return (data ?? []).reduce((acc: Record<string, any>, row) => {
      const raw = row.value;
      acc[row.key] = raw !== null && typeof raw === 'object' && 'v' in raw ? raw.v : raw;
      return acc;
    }, {});
  } catch {
    return {};
  }
}

async function shouldSendSMS(event: string): Promise<boolean> {
  try {
    const settings = await getSmsSettings();
    if (!settings.sms_enabled) return false;

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
