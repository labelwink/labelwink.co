import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/requireAdmin";

export async function GET() {
  const guard = await requireAdmin();
  if (guard instanceof NextResponse) return guard;

  try {
    const supabaseAdmin = createAdminClient();
    const { data: flash_sales, error } = await supabaseAdmin
      .from("flash_sales")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Admin flash sale fetch error:", error);
      return NextResponse.json([]);
    }
    return NextResponse.json(flash_sales || []);
  } catch (error: unknown) {
    console.error("[cms/flash-sale] Unexpected error:", error);
    return NextResponse.json([], { status: 200 });
  }
}

export async function POST(req: Request) {
  const guard = await requireAdmin();
  if (guard instanceof NextResponse) return guard;

  try {
    const body = await req.json();
    const {
      title,
      discount_percent,
      starts_at,
      ends_at,
      banner_image_url,
      is_active,
    } = body;

    const supabaseAdmin = createAdminClient();
    const { data: flash_sale, error } = await supabaseAdmin
      .from("flash_sales")
      .insert({
        title,
        discount_percent,
        starts_at,
        ends_at,
        banner_image_url,
        is_active,
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(flash_sale);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const guard = await requireAdmin();
  if (guard instanceof NextResponse) return guard;

  try {
    const body = await req.json();
    const { id, ...fields } = body;

    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const supabaseAdmin = createAdminClient();
    const { data: flash_sale, error } = await supabaseAdmin
      .from("flash_sales")
      .update(fields)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(flash_sale);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const guard = await requireAdmin();
  if (guard instanceof NextResponse) return guard;

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const supabaseAdmin = createAdminClient();
    const { error } = await supabaseAdmin
      .from("flash_sales")
      .delete()
      .eq("id", id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
