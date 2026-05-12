import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/requireAdmin';

export async function GET() {
  const guard = await requireAdmin();
  if (guard instanceof NextResponse) return guard;

  const supabaseAdmin = createAdminClient();
  const { data: cms_entry, error } = await supabaseAdmin
    .from('cms_content')
    .select('content')
    .eq('page', 'about')
    .single();

  if (error && error.code !== 'PGRST116') {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const data = cms_entry?.content || {};
  
  // Migration/Mapping for legacy fields
  const mappedData = {
    hero_title: data.hero_title || data.title || "",
    hero_subtitle: data.hero_subtitle || data.tagline || "",
    hero_image_url: data.hero_image_url || data.hero_image || "",
    story_heading: data.story_heading || "Our Story",
    story_body: data.story_body || data.content || "", // Mapping legacy HTML content to story body
    mission_heading: data.mission_heading || "Our Mission",
    mission_body: data.mission_body || "",
    values: data.values || []
  };

  return NextResponse.json(mappedData);
}

export async function PATCH(req: Request) {
  const guard = await requireAdmin();
  if (guard instanceof NextResponse) return guard;

  try {
    const fields = await req.json();
    if (!fields || typeof fields !== 'object' || Object.keys(fields).length === 0) {
      return NextResponse.json({ error: 'Request body must be a non-empty object' }, { status: 400 });
    }
    const supabaseAdmin = createAdminClient();
    
    const { data: updated_entry, error } = await supabaseAdmin
      .from('cms_content')
      .upsert({ 
        page: 'about', 
        content: fields, 
        updated_at: new Date().toISOString() 
      }, { onConflict: 'page' })
      .select('content')
      .single();

    if (error) throw error;
    return NextResponse.json(updated_entry?.content);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
