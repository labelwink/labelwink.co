import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

async function verifyAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  
  const supabaseAdmin = createAdminClient();
  const { data: profile } = await supabaseAdmin.from('profiles').select('role').eq('id', user.id).single();
  return profile?.role === 'admin';
}

export async function PUT(req: Request) {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { sections } = await req.json();
    if (!Array.isArray(sections)) return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });

    const supabaseAdmin = createAdminClient();
    
    for (const section of sections) {
      if (!section.id) continue;
      await supabaseAdmin
        .from('homepage_sections')
        .update({ sort_order: section.sort_order })
        .eq('id', section.id);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
