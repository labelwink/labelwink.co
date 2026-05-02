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

export async function GET() {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabaseAdmin = createAdminClient();
  const { data: about_page, error } = await supabaseAdmin
    .from('about_page')
    .select('*')
    .eq('id', 1)
    .single();

  if (error && error.code !== 'PGRST116') {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(about_page || {});
}

export async function PATCH(req: Request) {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const fields = await req.json();
    const supabaseAdmin = createAdminClient();
    
    const { data: about_page, error } = await supabaseAdmin
      .from('about_page')
      .update({ ...fields, updated_at: new Date().toISOString() })
      .eq('id', 1)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(about_page);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
