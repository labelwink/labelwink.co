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
      .select('id, email, full_name, phone, avatar_url, role, is_active, wink_points, created_at, updated_at')
      .eq('id', user.id)
      .single();

    if (error && error.code === 'PGRST116') {
      // Profile doesn't exist — create it
      const newProfile = {
        id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name || '',
        updated_at: new Date().toISOString(),
      };
      
      const { data: created } = await supabase
        .from('profiles')
        .insert([newProfile])
        .select('id, email, full_name, phone, avatar_url, role, is_active, wink_points, created_at, updated_at')
        .single();
      
      return NextResponse.json({
        ...created,
        email: user.email,
      });
    }

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Combine auth email with profile
    return NextResponse.json({
      ...profile,
      email: user.email,
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
    // DB columns: id, email, full_name, phone, avatar_url, role, is_active, wink_points
    const allowed = ['full_name', 'phone', 'avatar_url'] as const;
    const updates: Record<string, any> = {};

    for (const key of allowed) {
      if (body[key] !== undefined) {
        updates[key] = body[key];
      }
    }

    // Handle split first_name + last_name → full_name
    if (body.first_name !== undefined || body.last_name !== undefined) {
      const first = (body.first_name || '').trim();
      const last = (body.last_name || '').trim();
      updates.full_name = `${first} ${last}`.trim();
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields provided' }, { status: 400 });
    }

    updates.updated_at = new Date().toISOString();

    const { data: profile, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
      .select('id, email, full_name, phone, avatar_url, role, is_active, wink_points')
      .single();

    if (error) {
      console.error('[profile PATCH]', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(profile);
  } catch {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
