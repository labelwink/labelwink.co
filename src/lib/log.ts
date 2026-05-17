import { createClient } from '@supabase/supabase-js'
import { sendTelegramMessage } from '@/lib/telegram'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

type LogLevel = 'info' | 'warn' | 'error' | 'critical'
type LogCategory = 'payment' | 'shiprocket' | 'auth' | 'order' |
                   'inventory' | 'email' | 'telegram' | 'system'

export async function logEvent(
  level: LogLevel,
  category: LogCategory,
  message: string,
  metadata?: Record<string, any>
) {
  try {
    // 1. Insert into system_logs table using correct column names (module, details)
    await supabaseAdmin.from('system_logs').insert({
      level,
      module: category,
      message,
      details: metadata || {},
    })

    // 2. If it is an error or critical level log, also route it to admin_notifications and Telegram!
    if (level === 'error' || level === 'critical') {
      // Insert to admin_notifications
      await supabaseAdmin.from('admin_notifications').insert({
        type: 'system_error',
        title: `🚨 System ${level === 'critical' ? 'CRITICAL' : 'Error'} [${category.toUpperCase()}]`,
        body: message,
        metadata: metadata || {},
      })

      // Send Telegram alert
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://labelwink.co'
      const teleMsg = `🚨 <b>System Error Alert</b>\n📂 <b>Category:</b> ${category.toUpperCase()}\n⚠️ <b>Level:</b> ${level.toUpperCase()}\n📝 <b>Message:</b> ${message}\n` +
                      (metadata ? `⚙️ <b>Metadata:</b> <code>${JSON.stringify(metadata)}</code>\n` : '') +
                      `👉 <a href="${siteUrl}/admin">Open Admin Panel</a>`
      
      await sendTelegramMessage(teleMsg).catch((e) =>
        console.error('Failed to send Telegram system log alert:', e.message)
      )
    }
  } catch (e) {
    console.error('Logger failed silently:', e)
  }
}
