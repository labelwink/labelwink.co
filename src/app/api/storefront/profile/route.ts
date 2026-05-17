import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('id, email, full_name, first_name, last_name, phone, avatar_url, role, is_active, wink_points, created_at, updated_at')
      .eq('id', user.id)
      .single();

    if (error && error.code === 'PGRST116') {
      // Profile doesn't exist — create it
      const newProfile = {
        id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name || '',
        first_name: user.user_metadata?.first_name || user.user_metadata?.full_name?.split(' ')[0] || '',
        last_name: user.user_metadata?.last_name || user.user_metadata?.full_name?.split(' ').slice(1).join(' ') || '',
        phone: user.phone || null,
        updated_at: new Date().toISOString(),
      };
      
      const { data: created } = await supabase
        .from('profiles')
        .insert([newProfile])
        .select('id, email, full_name, first_name, last_name, phone, avatar_url, role, is_active, wink_points, created_at, updated_at')
        .single();
      
      return NextResponse.json({
        ...created,
        email: user.email,
        phone: created?.phone || user.phone || null,
      });
    }

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Combine auth email with profile
    return NextResponse.json({
      ...profile,
      email: user.email,
      phone: profile.phone || user.phone || null,
    });
  } catch {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();

    // Only allow columns that actually exist on the profiles table
    const allowed = ['full_name', 'phone', 'avatar_url', 'first_name', 'last_name'] as const;
    const updates: Record<string, any> = {};

    for (const key of allowed) {
      if (body[key] !== undefined) {
        updates[key] = body[key];
      }
    }

    // Ensure all name fields are in sync
    if (body.first_name !== undefined || body.last_name !== undefined) {
      const first = (body.first_name || '').trim();
      const last = (body.last_name || '').trim();
      updates.first_name = first;
      updates.last_name = last;
      updates.full_name = `${first} ${last}`.trim();
    } else if (body.full_name !== undefined) {
      const parts = (body.full_name || '').trim().split(/\s+/);
      updates.first_name = parts[0] || '';
      updates.last_name = parts.slice(1).join(' ') || '';
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields provided' }, { status: 400 });
    }

    updates.updated_at = new Date().toISOString();

    const { data: profile, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
      .select('id, email, full_name, first_name, last_name, phone, avatar_url, role, is_active, wink_points')
      .single();

    if (error) {
      console.error('[profile PATCH]', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      ...profile,
      email: user.email,
      phone: profile.phone || user.phone || null,
    });
  } catch {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
