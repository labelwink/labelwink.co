import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';

/**
 * GET /api/admin/seasonal-sales/cron
 * Triggered by Vercel Cron to auto-activate/deactivate sales based on time.
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  const supabase = createAdminSupabaseClient();
  const now = new Date().toISOString();

  try {
    // 1. Find sales to ACTIVATE
    // Starts at is in the past, ends at is in the future, but currently NOT active
    const { data: toActivate } = await supabase
      .from('seasonal_sales')
      .select('id')
      .lte('starts_at', now)
      .gt('ends_at', now)
      .eq('is_active', false);

    // 2. Find sales to DEACTIVATE
    // Ends at is in the past, but currently IS active
    const { data: toDeactivate } = await supabase
      .from('seasonal_sales')
      .select('id')
      .lte('ends_at', now)
      .eq('is_active', true);

    const results = {
      activated: 0,
      deactivated: 0,
      errors: [] as string[]
    };

    // We call the internal activation logic by making internal requests or just importing logic
    // Since we are in the same app, we can just fetch the activation endpoint using a service role client
    // Or we can just reuse the logic. Let's reuse the logic by making a POST request to our own API
    // with an admin secret or just use the Supabase client directly here.
    
    // To avoid circular dependencies and keep it simple, I'll implement a minimal version of the logic here
    // but a better way would be to have a shared lib function.

    const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

    if (toActivate && toActivate.length > 0) {
      for (const sale of toActivate) {
        try {
          const res = await fetch(`${SITE_URL}/api/admin/seasonal-sales/${sale.id}/activate`, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${process.env.CRON_SECRET}` // We'll need to allow CRON_SECRET in the activate route too
            },
            body: JSON.stringify({ activate: true })
          });
          if (res.ok) results.activated++;
          else results.errors.push(`Failed to activate ${sale.id}: ${await res.text()}`);
        } catch (e: any) {
          results.errors.push(`Error activating ${sale.id}: ${e.message}`);
        }
      }
    }

    if (toDeactivate && toDeactivate.length > 0) {
      for (const sale of toDeactivate) {
        try {
          const res = await fetch(`${SITE_URL}/api/admin/seasonal-sales/${sale.id}/activate`, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${process.env.CRON_SECRET}`
            },
            body: JSON.stringify({ activate: false })
          });
          if (res.ok) results.deactivated++;
          else results.errors.push(`Failed to deactivate ${sale.id}: ${await res.text()}`);
        } catch (e: any) {
          results.errors.push(`Error deactivating ${sale.id}: ${e.message}`);
        }
      }
    }

    return NextResponse.json(results);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
