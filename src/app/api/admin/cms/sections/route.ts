import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/requireAdmin';

export async function GET() {
  const guard = await requireAdmin();
  if (guard instanceof NextResponse) return guard;

  const supabaseAdmin = createAdminClient();
  const { data: sections, error } = await supabaseAdmin
    .from('homepage_sections')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(sections);
}

export async function PATCH(req: Request) {
  const guard = await requireAdmin();
  if (guard instanceof NextResponse) return guard;

  try {
    const body = await req.json();
    const { section_key, ...fields } = body;

    if (!section_key) {
      return NextResponse.json({ error: 'section_key is required' }, { status: 400 });
    }
    
    const supabaseAdmin = createAdminClient();
    const { data: section, error } = await supabaseAdmin
      .from('homepage_sections')
      .update({ ...fields, updated_at: new Date().toISOString() })
      .eq('section_key', section_key)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(section);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
