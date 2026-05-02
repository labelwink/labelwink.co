import { NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';

export async function POST(request: Request) {
  try {
    const { user_id } = await request.json();

    if (!user_id) {
      return NextResponse.json({ error: 'user_id is required' }, { status: 400 });
    }

    const supabaseAdmin = createAdminSupabaseClient();
    
    const { data: { user }, error: userError } = await supabaseAdmin.auth.admin.getUserById(user_id);
    
    if (userError || !user || !user.email) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: user.email,
    });

    if (linkError) {
      return NextResponse.json({ error: linkError.message }, { status: 500 });
    }

    return NextResponse.json({ magic_link_url: linkData.properties.action_link });
  } catch (error: any) {
    console.error('Login existing error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
