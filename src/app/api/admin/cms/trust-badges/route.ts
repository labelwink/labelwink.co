import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/requireAdmin";

export async function GET() {
  const guard = await requireAdmin();
  if (guard instanceof NextResponse) return guard;

  try {
    const supabaseAdmin = createAdminClient();
    const { data: trust_badges, error } = await supabaseAdmin
      .from("trust_badges")
      .select("*")
      .order("sort_order", { ascending: true });

    if (error) {
      console.error("Admin trust badges fetch error:", error);
      return NextResponse.json([]);
    }
    return NextResponse.json(trust_badges || []);
  } catch (error: unknown) {
    console.error("[cms/trust-badges] Unexpected error:", error);
    return NextResponse.json([], { status: 200 });
  }
}

export async function POST(req: Request) {
  const guard = await requireAdmin();
  if (guard instanceof NextResponse) return guard;

  try {
    const body = await req.json();
    const supabaseAdmin = createAdminClient();
    const { data: badge, error } = await supabaseAdmin
      .from("trust_badges")
      .insert(body)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(badge);
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
    const { data: badge, error } = await supabaseAdmin
      .from("trust_badges")
      .update(fields)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(badge);
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
      .from("trust_badges")
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
        .from("trust_badges")
        .update({ sort_order: i })
        .eq("id", ids[i]);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
