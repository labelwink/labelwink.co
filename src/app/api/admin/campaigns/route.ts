import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || 'all';
    
    const supabaseAdmin = createAdminSupabaseClient();
    
    let query = supabaseAdmin
      .from('email_campaigns')
      .select(`
        *,
        campaign_sends!campaign_sends_campaign_id_fkey(count)
      `);

    if (status !== 'all') {
      query = query.eq('status', status);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;

    const campaigns = data.map(c => ({
      ...c,
      actual_sends: c.campaign_sends?.[0]?.count || 0,
      campaign_sends: undefined // Remove the helper array
    }));

    return NextResponse.json(campaigns);
  } catch (error: any) {
    console.error('Campaigns GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, subject, preview_text, body_html, segment, scheduled_at } = body;

    if (!name || !subject || !body_html) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const validSegments = ['all', 'new_customers', 'high_value', 'loyalty_members', 'inactive'];
    if (!validSegments.includes(segment)) {
      return NextResponse.json({ error: 'Invalid segment' }, { status: 400 });
    }

    const supabaseAdmin = createAdminSupabaseClient();
    
    const { data, error } = await supabaseAdmin
      .from('email_campaigns')
      .insert({
        name,
        subject,
        preview_text,
        body_html,
        segment,
        scheduled_at,
        status: scheduled_at ? 'scheduled' : 'draft',
        recipient_count: 0,
        open_count: 0,
        click_count: 0
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Campaigns POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
