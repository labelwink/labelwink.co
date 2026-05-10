import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/requireAdmin";

export async function GET() {
  const guard = await requireAdmin();
  if (guard instanceof NextResponse) return guard;

  try {
    const supabaseAdmin = createAdminClient();
    const { data: occasions, error } = await supabaseAdmin
      .from("occasions")
      .select("*")
      .order("sort_order", { ascending: true });

    if (error) {
      console.error("Admin occasions fetch error:", error);
      return NextResponse.json([]);
    }
    return NextResponse.json(occasions || []);
  } catch (error: unknown) {
    console.error("[cms/occasions] Unexpected error:", error);
    return NextResponse.json([], { status: 200 });
  }
}

export async function POST(req: Request) {
  const guard = await requireAdmin();
  if (guard instanceof NextResponse) return guard;

  try {
    const body = await req.json();
    const supabaseAdmin = createAdminClient();
    const { data: occasion, error } = await supabaseAdmin
      .from("occasions")
      .insert(body)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(occasion);
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
    const { data: occasion, error } = await supabaseAdmin
      .from("occasions")
      .update(fields)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(occasion);
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
      .from("occasions")
      .delete()
      .eq("id", id);

    if (error) throw error;
    return NextResponse.json({ success: true });
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
        .from("occasions")
        .update({ sort_order: i })
        .eq("id", ids[i]);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
