import { type SupabaseClient } from '@supabase/supabase-js'
import type { NextRequest } from 'next/server'

export interface AuditLogParams {
  admin_id?:    string
  admin_email?: string
  action:       string  // 'CREATE' | 'UPDATE' | 'DELETE' | 'STATUS_CHANGE' | 'LOGIN'
  entity:       string  // 'orders' | 'products' | 'discount_codes' | 'return_requests' | ...
  entity_id?:   string
  changes?:     { before?: Record<string, unknown>; after?: Record<string, unknown> }
  request?:     NextRequest
}

/**
 * Write an entry to the audit_logs table.
 * Non-fatal: errors are logged but never thrown (so they don't break the calling route).
 */
export async function logAudit(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any>,
  params: AuditLogParams,
): Promise<void> {
  try {
    await supabase.from('audit_logs').insert({
      admin_id:    params.admin_id    ?? null,
      admin_email: params.admin_email ?? null,
      action:      params.action,
      entity:      params.entity,
      entity_id:   params.entity_id   ?? null,
      changes:     params.changes     ?? null,
      ip_address:  params.request?.headers.get('x-forwarded-for')?.split(',')[0].trim()
                   ?? params.request?.headers.get('x-real-ip')
                   ?? 'unknown',
      user_agent:  params.request?.headers.get('user-agent') ?? 'unknown',
      created_at:  new Date().toISOString(),
    })
  } catch (err) {
    console.warn('[audit] Failed to write audit log:', err)
  }
}
