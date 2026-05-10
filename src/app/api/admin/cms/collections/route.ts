import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/requireAdmin";

export async function GET() {
  const guard = await requireAdmin();
  if (guard instanceof NextResponse) return guard;

  try {
    const supabaseAdmin = createAdminClient();
    const { data: collections, error } = await supabaseAdmin
      .from("collections")
      .select(
        "id, name, slug, is_featured, sort_order, banner_image_url, subtitle",
      )
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (error) {
      console.error("Admin collections fetch error:", error);
      return NextResponse.json([]);
    }
    return NextResponse.json(collections || []);
  } catch (error: unknown) {
    console.error("[cms/collections] Unexpected error:", error);
    return NextResponse.json([], { status: 200 });
  }
}

export async function PATCH(req: Request) {
  const guard = await requireAdmin();
  if (guard instanceof NextResponse) return guard;

  try {
    const body = await req.json();
    const { id, is_featured, sort_order, banner_image_url, subtitle } = body;

    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const supabaseAdmin = createAdminClient();
    const { data: collection, error } = await supabaseAdmin
      .from("collections")
      .update({
        is_featured,
        sort_order,
        banner_image_url,
        subtitle,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(collection);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const guard = await requireAdmin();
  if (guard instanceof NextResponse) return guard;

  try {
    const { ids } = await req.json();
    if (!Array.isArray(ids))
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

    const supabaseAdmin = createAdminClient();

    for (let i = 0; i < ids.length; i++) {
      await supabaseAdmin
        .from("collections")
        .update({ sort_order: i })
        .eq("id", ids[i]);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
