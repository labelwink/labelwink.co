import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/requireAdmin';

export const runtime = 'nodejs';

export async function GET() {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('site_settings')
    .select('key, value');

  if (error) {
    console.error('[admin/settings GET]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Reduce key-value rows into a flat object
  const settings = (data ?? []).reduce((acc: Record<string, any>, row) => {
    const raw = row.value;
    acc[row.key] = raw !== null && typeof raw === 'object' && 'v' in raw ? raw.v : raw;
    return acc;
  }, {});

  return NextResponse.json(settings);
}

export async function PATCH(req: Request) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  const supabase = createAdminClient();
  const body = await req.json();

  // body is expected as { key: value, key2: value2, ... }
  // Each entry becomes a row upsert in site_settings
  const entries = Object.entries(body);
  if (entries.length === 0) {
    return NextResponse.json({ error: 'No settings provided' }, { status: 400 });
  }

  const rows = entries.map(([key, value]) => ({
    key,
    value: typeof value === 'object' ? value : { v: value },
    updated_at: new Date().toISOString(),
  }));

  const { error } = await supabase
    .from('site_settings')
    .upsert(rows, { onConflict: 'key' });

  if (error) {
    console.error('[admin/settings PATCH]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, updated: rows.length });
}
