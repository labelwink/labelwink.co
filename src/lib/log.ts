import { createClient } from '@supabase/supabase-js'

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
    await supabaseAdmin.from('system_logs').insert({
      level, category, message,
      metadata: metadata || {},
    })
  } catch (e) {
    console.error('Logger failed silently:', e)
  }
}
