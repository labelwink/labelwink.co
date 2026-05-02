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
  const { data: trust_badges, error } = await supabaseAdmin
    .from('trust_badges')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(trust_badges);
}

export async function POST(req: Request) {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const supabaseAdmin = createAdminClient();
    const { data: badge, error } = await supabaseAdmin
      .from('trust_badges')
      .insert(body)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(badge);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const { id, ...fields } = body;
    
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    const supabaseAdmin = createAdminClient();
    const { data: badge, error } = await supabaseAdmin
      .from('trust_badges')
      .update(fields)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(badge);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    const supabaseAdmin = createAdminClient();
    const { error } = await supabaseAdmin
      .from('trust_badges')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { ids } = await req.json();
    if (!Array.isArray(ids)) return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });

    const supabaseAdmin = createAdminClient();
    
    for (let i = 0; i < ids.length; i++) {
      await supabaseAdmin
        .from('trust_badges')
        .update({ sort_order: i })
        .eq('id', ids[i]);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
