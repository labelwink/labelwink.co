import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabaseAdmin = createAdminSupabaseClient();
    const id = params.id;

    const { data: campaign, error } = await supabaseAdmin
      .from('email_campaigns')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!campaign) return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });

    const { data: recentSends } = await supabaseAdmin
      .from('campaign_sends')
      .select('email, status, sent_at')
      .eq('campaign_id', id)
      .order('sent_at', { ascending: false })
      .limit(10);

    const { data: sendStats } = await supabaseAdmin
      .from('campaign_sends')
      .select('status', { count: 'exact', head: true })
      .eq('campaign_id', id);

    return NextResponse.json({
      ...campaign,
      recent_sends: recentSends || [],
      total_sends: campaign.recipient_count || 0
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const body = await req.json();
    const supabaseAdmin = createAdminSupabaseClient();

    const { data: campaign } = await supabaseAdmin
      .from('email_campaigns')
      .select('status')
      .eq('id', id)
      .single();

    if (!campaign) return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    
    if (campaign.status === 'sent') {
      return NextResponse.json({ error: 'Cannot edit a sent campaign' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('email_campaigns')
      .update({
        ...body,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const supabaseAdmin = createAdminSupabaseClient();

    const { data: campaign } = await supabaseAdmin
      .from('email_campaigns')
      .select('status')
      .eq('id', id)
      .single();

    if (!campaign) return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });

    if (campaign.status !== 'draft') {
      return NextResponse.json({ error: 'Only draft campaigns can be deleted' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('email_campaigns')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
