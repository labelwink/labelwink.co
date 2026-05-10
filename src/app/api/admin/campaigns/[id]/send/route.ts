import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { sendCampaignEmail } from '@/lib/brevo';
import crypto from 'crypto';

function generateUnsubscribeToken(email: string) {
  const key = process.env.BREVO_API_KEY || 'default-secret';
  return crypto.createHmac('sha256', key).update(email).digest('hex');
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { test_email } = body;
    
    const supabaseAdmin = createAdminSupabaseClient();
    
    // 1. Fetch campaign and settings
    const { data: campaign } = await supabaseAdmin
      .from('email_campaigns')
      .select('*')
      .eq('id', id)
      .single();

    if (!campaign) return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });

    const { data: settings } = await supabaseAdmin
      .from('shop_settings')
      .select('store_name, logo_url')
      .single();

    const storeName = settings?.store_name || 'LabelWink';
    const logoUrl = settings?.logo_url || '';
    const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://shop.hawklab.in';

    // TEST SEND
    if (test_email) {
      const token = generateUnsubscribeToken(test_email);
      const unsubscribeUrl = `${SITE_URL}/api/storefront/unsubscribe?email=${encodeURIComponent(test_email)}&token=${token}`;
      
      await sendCampaignEmail({
        to: test_email,
        subject: `[TEST] ${campaign.subject}`,
        preview_text: campaign.preview_text,
        body_html: campaign.body_html.replace(/{{store_name}}/g, storeName).replace(/{{unsubscribe_url}}/g, unsubscribeUrl),
        store_name: storeName,
        logo_url: logoUrl,
        unsubscribe_url: unsubscribeUrl
      });
      
      return NextResponse.json({ success: true, message: 'Test email sent' });
    }

    // ACTUAL SEND
    if (campaign.status === 'sent') {
      return NextResponse.json({ error: 'Campaign already sent' }, { status: 400 });
    }

    // Process in background
    (async () => {
      try {
        let recipientEmails: string[] = [];
        
        // 2. Build recipient list based on segment
        switch (campaign.segment) {
          case 'all':
            const { data: all } = await supabaseAdmin
              .from('newsletter_subscriptions')
              .select('email')
              .eq('is_active', true);
            recipientEmails = all?.map(r => r.email) || [];
            break;
            
          case 'new_customers':
            const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
            const { data: newCust } = await supabaseAdmin
              .from('profiles')
              .select('email')
              .gt('created_at', thirtyDaysAgo);
            recipientEmails = newCust?.map(r => r.email) || [];
            break;

          case 'high_value':
            const { data: highValue } = await supabaseAdmin.rpc('get_high_value_customers', { min_spend: 5000 });
            recipientEmails = highValue?.map((r: any) => r.email) || [];
            break;

          case 'loyalty_members':
            const { data: loyalty } = await supabaseAdmin
              .from('loyalty_points')
              .select('user:profiles(email)')
              .gt('balance', 0);
            recipientEmails = loyalty?.map((r: any) => r.user?.email).filter(Boolean) || [];
            break;

          case 'inactive':
            const { data: inactive } = await supabaseAdmin.rpc('get_inactive_customers', { days: 90 });
            recipientEmails = inactive?.map((r: any) => r.email) || [];
            break;
        }

        // Deduplicate
        const uniqueEmails = Array.from(new Set(recipientEmails));
        
        // Batch Send
        const batchSize = 50;
        let sentCount = 0;

        for (let i = 0; i < uniqueEmails.length; i += batchSize) {
          const batch = uniqueEmails.slice(i, i + batchSize);
          
          await Promise.all(batch.map(async (email) => {
            const token = generateUnsubscribeToken(email);
            const unsubscribeUrl = `${SITE_URL}/api/storefront/unsubscribe?email=${encodeURIComponent(email)}&token=${token}`;
            
            await sendCampaignEmail({
              to: email,
              subject: campaign.subject,
              preview_text: campaign.preview_text,
              body_html: campaign.body_html.replace(/{{store_name}}/g, storeName).replace(/{{unsubscribe_url}}/g, unsubscribeUrl),
              store_name: storeName,
              logo_url: logoUrl,
              unsubscribe_url: unsubscribeUrl
            });

            await supabaseAdmin.from('campaign_sends').insert({
              campaign_id: id,
              email: email,
              status: 'sent',
              sent_at: new Date().toISOString()
            });
            
            sentCount++;
          }));

          // Small delay between batches to respect API limits
          if (i + batchSize < uniqueEmails.length) {
            await new Promise(resolve => setTimeout(resolve, 200));
          }
        }

        // 6. Update campaign status
        await supabaseAdmin
          .from('email_campaigns')
          .update({
            status: 'sent',
            sent_at: new Date().toISOString(),
            recipient_count: sentCount
          })
          .eq('id', id);

      } catch (bgError) {
        console.error('Background send error:', bgError);
      }
    })();

    return NextResponse.json({ success: true, message: 'Send process started' }, { status: 202 });

  } catch (error: any) {
    console.error('Campaign send POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
